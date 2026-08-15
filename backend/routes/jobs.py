# routes/jobs.py - COMPLETE FIXED VERSION with sorting and filtering
from flask import request, jsonify, g
from datetime import datetime, timedelta
import uuid
import logging
from routes.auth import token_required
import sys
import os
from collections import Counter, defaultdict
import hashlib

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

logger = logging.getLogger(__name__)


def register_jobs_routes(api_bp, db, background_manager=None, notification_service=None):
    """Register all job-related routes with the blueprint"""

    # ── Helpers ────────────────────────────────────────────────────────────────

    def _get_user_skills(user: dict) -> list:
        """
        Pull skills from the user document.
        Prefers 'skills' (manually set / resume upload).
        Falls back to 'extracted_skills' if skills is empty.
        """
        skills = [s.strip() for s in user.get('skills', []) if s and s.strip()]
        if not skills:
            skills = [s.strip() for s in user.get(
                'extracted_skills', []) if s and s.strip()]
        return skills

    def _apply_sorting(jobs: list, sort_by: str) -> list:
        """Apply sorting to jobs based on sort_by parameter"""
        if sort_by == "match":
            jobs.sort(key=lambda x: (x.get('skill_match_percentage', x.get('match_score', 0)), x.get('match_score', 0)), reverse=True)
        elif sort_by == "date":
            jobs.sort(key=lambda x: x.get('date_posted', x.get('created_at', '')), reverse=True)
        elif sort_by == "salary":
            def get_salary(x):
                s = x.get('salary_max')
                if isinstance(s, dict) and '$numberLong' in s:
                    return int(s['$numberLong'])
                if isinstance(s, (int, float)): return s
                return 0
            jobs.sort(key=get_salary, reverse=True)
        elif sort_by == "authenticity":
            jobs.sort(key=lambda x: x.get(
                'authenticity_score', 0), reverse=True)
        return jobs

    def _apply_filters(jobs: list, filters: dict) -> list:
        """Apply filters to jobs from all collections (jobs, job_matches, recommend_jobs)"""
        filtered = jobs

        # Verification filter
        verification = filters.get('verification') or 'all'
        if verification and verification != 'all':
            new_filtered = []
            for job in filtered:
                vs = str(job.get('verification_status', '')).lower()
                is_ver = job.get('is_verified', False)
                has_trust = str(job.get('trust_badge', '')).lower() == 'verified'
                
                if verification == 'verified':
                    if vs == 'verified' or is_ver or has_trust or job.get('source') == 'company_posted':
                        new_filtered.append(job)
                elif verification == 'scraped':
                    if vs == 'scraped' or job.get('is_scraped', False):
                        new_filtered.append(job)
            filtered = new_filtered

        # Job type filter
        job_type = filters.get('job_type') or 'all'
        if job_type and job_type not in ('all', 'any'):
            new_filtered = []
            search_jt = job_type.lower().replace('_', ' ')
            search_jt_nospace = job_type.lower().replace('_', '')
            for job in filtered:
                jt = str(job.get('job_type', '')).lower()
                if search_jt in jt.replace('_', ' ') or search_jt_nospace in jt.replace('_', ''):
                    new_filtered.append(job)
                else:
                    # fallback to title/description for scraped/recommended jobs missing job_type
                    title = str(job.get('title', '')).lower()
                    desc = str(job.get('description', '')).lower()
                    if search_jt in title or search_jt in desc or search_jt_nospace in title:
                        new_filtered.append(job)
            filtered = new_filtered

        # Minimum match score filter
        min_match = int(filters.get('min_match', 0))
        if min_match > 0:
            filtered = [
                job for job in filtered
                if job.get('match_score', 0) >= min_match 
                or (job.get('confidence_score', 0) * 100) >= min_match
                or job.get('combined_score', 0) >= min_match
            ]

        # Minimum authenticity score filter
        min_authenticity = int(filters.get('min_authenticity', 0))
        if min_authenticity > 0:
            filtered = [
                job for job in filtered
                if job.get('authenticity_score', 0) >= min_authenticity 
                or job.get('trust_score', 0) >= min_authenticity
            ]

        # Location filter
        location = filters.get('location', '')
        if location:
            filtered = [
                job for job in filtered
                if location.lower() in str(job.get('location', '')).lower()
            ]

        return filtered

    # ── Existing routes ────────────────────────────────────────────────────────


    @api_bp.route('/jobs/<user_id>', methods=['GET'])
    def get_matched_jobs(user_id):
        """Get matched jobs for a user (legacy endpoint)"""
        try:
            logger.info(f"Fetching jobs for {user_id}")

            if background_manager:
                cached = background_manager.get_cached_result(user_id)
                if cached:
                    status = cached.get("status")
                    if status == "processing":
                        return jsonify({
                            "success": True, "user_id": user_id,
                            "status": "processing",
                            "message": "Jobs are being processed...",
                            "jobs": [], "count": 0
                        }), 200
                    if status == "completed":
                        return jsonify({
                            "success": True, "user_id": user_id,
                            "status": "completed",
                            "jobs": cached.get("jobs", []),
                            "count": len(cached.get("jobs", [])),
                            "scraper_stats": cached.get("scraper_stats", {})
                        }), 200
                    if status == "error":
                        return jsonify({
                            "success": False, "user_id": user_id,
                            "status": "error", "error": cached.get("error"), "jobs": []
                        }), 200

            matched_jobs = db.get_user_jobs(user_id)
            if matched_jobs:
                return jsonify({
                    "success": True, "user_id": user_id,
                    "status": "completed", "jobs": matched_jobs,
                    "count": len(matched_jobs)
                }), 200

            user = db.get_user(user_id)
            if not user:
                return jsonify({"success": False, "error": "User not found"}), 404

            return jsonify({
                "success": True, "user_id": user_id,
                "status": "processing",
                "message": "Jobs are being processed...",
                "jobs": [], "count": 0
            }), 200

        except Exception as e:
            logger.error(f"Get jobs error: {e}", exc_info=True)
            return jsonify({"success": False, "error": str(e)}), 500

    @api_bp.route('/status/<user_id>', methods=['GET'])
    def get_processing_status(user_id):
        """Get processing status for a user"""
        try:
            user = db.get_user(user_id)
            if not user:
                return jsonify({"success": False, "error": "User not found"}), 404

            cached = background_manager.get_cached_result(
                user_id) if background_manager else None
            cached_status = cached.get(
                "status", "unknown") if cached else "unknown"
            matched_jobs = db.get_user_jobs(user_id)

            return jsonify({
                "success": True,
                "status": {
                    "user_id": user_id,
                    "upload_date": user.get("upload_date"),
                    "skills_found": len(_get_user_skills(user)),
                    "jobs_matched": len(matched_jobs),
                    "is_processing": cached_status == "processing",
                    "cache_status": cached_status
                }
            }), 200

        except Exception as e:
            logger.error(f"Status error: {e}", exc_info=True)
            return jsonify({"success": False, "error": str(e)}), 500

    @api_bp.route('/test-scrape', methods=['POST'])
    def test_scrape():
        """Test scraping directly (no auth required)"""
        try:
            data = request.json or {}
            skills = data.get('skills', ['Python', 'JavaScript'])
            logger.info(f"Test scraping with skills: {skills}")

            from services.job_scraper import RealisticJobScraper
            scraper = RealisticJobScraper()
            jobs = scraper.scrape_jobs(
                skills=skills, location="", job_type="remote", max_jobs=10)

            return jsonify({
                "success": True,
                "jobs_found": len(jobs),
                "jobs": jobs[:5],
                "stats": scraper.scraper_stats
            }), 200

        except Exception as e:
            logger.error(f"Test scrape error: {e}", exc_info=True)
            return jsonify({"success": False, "error": str(e)}), 500

    # ── Authenticated routes ───────────────────────────────────────────────────

    @api_bp.route('/jobs/post', methods=['POST'])
    @token_required
    def post_job():
        """Post a new job (company users only)"""
        try:
            data = request.json
            if not data:
                return jsonify({'success': False, 'error': 'No data provided'}), 400

            user = db.get_user(g.user_id)
            if not user or user.get('role') != 'company':
                return jsonify({'success': False, 'error': 'Only companies can post jobs'}), 403

            for field in ['title', 'location', 'description']:
                if not data.get(field):
                    return jsonify({'success': False, 'error': f'{field} is required'}), 400

            job_id = str(uuid.uuid4())
            job = {
                'job_id': job_id,
                'title': data['title'],
                'company': user.get('company_name', user.get('full_name')),
                'company_id': g.user_id,
                'location': data['location'],
                'salary_min': data.get('salary_min'),
                'salary_max': data.get('salary_max'),
                'job_type': data.get('type', 'full_time'),
                'description': data['description'],
                'requirements': data.get('requirements', ''),
                'skills': [s.strip() for s in data.get('skills', '').split(',') if s.strip()],
                'experience_level': data.get('experience_level', 'mid'),
                'category': data.get('category', 'other'),
                'status': 'active',
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat(),
                'source': 'company_posted',
                'authenticity_score': 100,
                'is_verified': True,
                'verification_status': 'verified',
                'source_display': 'Verified Company'
            }

            if not db.save_job(job):
                return jsonify({'success': False, 'error': 'Failed to post job'}), 500

            # Notify company about successful post
            if notification_service:
                notification_service.notify_user(
                    user_id=g.user_id,
                    title="Job Posted Successfully",
                    message=f"Your job '{job['title']}' is now live and visible to job seekers.",
                    nt_type="success",
                    link=f"/dashboard/company/jobs"
                )

            return jsonify({'success': True, 'message': 'Job posted successfully', 'job_id': job_id}), 201

        except Exception as e:
            logger.error(f"Post job error: {e}", exc_info=True)
            return jsonify({'success': False, 'error': str(e)}), 500

    @api_bp.route('/jobs/all', methods=['GET'])
    @token_required
    def get_all_jobs():
        """Get ALL jobs (company-posted + scraped) - for 'all jobs' tab"""
        try:
            user = db.get_user(g.user_id)
            if not user:
                return jsonify({'success': False, 'error': 'User not found'}), 404

        # Get sort and filter parameters
            sort_by = request.args.get('sort_by', 'match')
            verification = request.args.get('verification', 'all')
            min_match = int(request.args.get('min_match', 0))
            min_authenticity = int(request.args.get('min_authenticity', 0))
            location_filter = request.args.get('location', '')
            job_type_filter = request.args.get('type', 'all')
            search_query = request.args.get('search', '')

        # Get unified jobs from both sources
            all_jobs = db.get_all_jobs_unified(g.user_id, limit=200)

        # Apply matching scores for job seekers
            if user.get('role') ==  'job_seeker' and all_jobs:
                try:
                    from services.job_matcher import JobMatcher
                    matcher = JobMatcher()
                    all_jobs = matcher.match_jobs(user, all_jobs)
                except Exception as e:
                    logger.error(f"Matcher error: {e}")

        # Apply search filter
            if search_query:
                search_lower = search_query.lower()
                all_jobs = [j for j in all_jobs if (
                search_lower in j.get('title', '').lower() or
                search_lower in j.get('company', '').lower() or
                any(search_lower in s.lower() for s in j.get('skills', []))
            )]

        # Apply filters
            filters = {
            'verification': verification,
            'job_type': job_type_filter,
            'min_match': min_match,
            'min_authenticity': min_authenticity,
            'location': location_filter
        }
            all_jobs = _apply_filters(all_jobs, filters)

        # Apply sorting
            all_jobs = _apply_sorting(all_jobs, sort_by)

            return jsonify({
            'success': True,
            'jobs': all_jobs,
            'count': len(all_jobs),
            'source': 'unified',
            'company_count': len([j for j in all_jobs if j.get('source_type') == 'company']),
            'scraped_count': len([j for j in all_jobs if j.get('source_type') == 'scraped']),
            'filters_applied': filters,
            'sort_by': sort_by
        }), 200

        except Exception as e:
            logger.error(f"Get all jobs error: {e}", exc_info=True)
            return jsonify({'success': False, 'error': str(e)}), 500

    @api_bp.route('/jobs/foryou', methods=['GET'])
    @token_required
    def get_jobs_for_you():
        """Get jobs strictly from recommend_jobs collection for 'Jobs For You' tab"""
        try:
            user = db.get_user(g.user_id)
            if not user:
                return jsonify({'success': False, 'error': 'User not found'}), 404

            sort_by = request.args.get('sort_by', 'match')
            verification = request.args.get('verification', 'all')
            min_match = int(request.args.get('min_match', 0))
            min_authenticity = int(request.args.get('min_authenticity', 0))
            location_filter = request.args.get('location', '')
            job_type_filter = request.args.get('job_type', 'all')
            
            user_skills = _get_user_skills(user)
            logger.info(f"Fetching Jobs For You for user {g.user_id}")

            recommended_jobs = db.get_recommend_jobs(limit=100)

            filters = {
                'verification': verification,
                'job_type': job_type_filter,
                'min_match': min_match,
                'min_authenticity': min_authenticity,
                'location': location_filter
            }
            unique_jobs = _apply_filters(recommended_jobs, filters)
            unique_jobs = _apply_sorting(unique_jobs, sort_by)

            return jsonify({
                'success': True,
                'jobs': unique_jobs,
                'source': 'recommend_jobs',
                'skills_used': user_skills,
                'total_count': len(unique_jobs),
                'filters_applied': filters,
                'sort_by': sort_by
            }), 200

        except Exception as e:
            logger.error(f"Jobs for you error: {e}", exc_info=True)
            return jsonify({'success': False, 'error': str(e)}), 500

    @api_bp.route('/jobs/recommended', methods=['GET'])
    @token_required
    def get_recommended_jobs():
        """
    Get RECOMMENDED jobs (scraped + company-posted) - for 'jobs for you' tab
        """
        try:
            user = db.get_user(g.user_id)
            if not user:
                return jsonify({'success': False, 'error': 'User not found'}), 404

            if user.get('role') != 'job_seeker':
                return jsonify({'success': False, 'error': 'Only job seekers can get recommendations'}), 403

        # Get sort and filter parameters
            sort_by = request.args.get('sort_by', 'match')
            verification = request.args.get('verification', 'all')
            min_match = int(request.args.get('min_match', 0))
            min_authenticity = int(request.args.get('min_authenticity', 0))
            location_filter = request.args.get('location', '')
            job_type_filter = request.args.get('job_type', 'all')

        # Get user skills
            user_skills = _get_user_skills(user)
            logger.info(
            f"Recommending jobs for user {g.user_id} using {len(user_skills)} skills")

            if not user_skills:
                return jsonify({
                'success': True,
                'jobs': [],
                'message': 'No skills found. Please upload your resume or add skills to your profile.',
                'skills_used': []
            }), 200

        # Get recommended jobs strictly from recommend_jobs collection
            recommended_jobs = db.get_recommend_jobs(limit=100)

        # Apply filters
            filters = {
            'verification': verification,
            'job_type': job_type_filter,
            'min_match': min_match,
            'min_authenticity': min_authenticity,
            'location': location_filter
        }
            unique_jobs = _apply_filters(recommended_jobs, filters)

        # Apply sorting
            unique_jobs = _apply_sorting(unique_jobs, sort_by)

            return jsonify({
            'success': True,
            'jobs': unique_jobs,
            'source': 'recommend_jobs',
            'skills_used': user_skills,
            'total_count': len(unique_jobs),
            'filters_applied': filters,
            'sort_by': sort_by
        }), 200

        except Exception as e:
            logger.error(f"Recommended jobs error: {e}", exc_info=True)
            return jsonify({'success': False, 'error': str(e)}), 500

    @api_bp.route('/jobs/detail/<job_id>', methods=['GET'])
    @token_required
    def get_job_details(job_id):
        """Get job details by ID"""
        try:
            # First check in jobs collection
            job = db.get_job_by_id(job_id)

            # If not found, check in job_matches for scraped jobs
            if not job and hasattr(db, 'get_scraped_job_by_id'):
                job = db.get_scraped_job_by_id(g.user_id, job_id)

            if not job:
                return jsonify({'success': False, 'error': 'Job not found'}), 404

            # Add source display for frontend
            if job.get('source') == 'company_posted':
                job['source_display'] = 'Verified Company'
                job['is_verified'] = True
            else:
                job['source_display'] = f"{job.get('source', 'External')} (External)"
                job['is_verified'] = job.get('is_verified', False)

            return jsonify({'success': True, 'job': job}), 200
        except Exception as e:
            logger.error(f"Get job details error: {e}", exc_info=True)
            return jsonify({'success': False, 'error': str(e)}), 500

    @api_bp.route('/jobs/<job_id>/apply', methods=['POST'])
    @token_required
    def apply_for_job(job_id):
        """Apply for a job - redirects to URL for scraped jobs, uses internal for company jobs"""
        try:
            user = db.get_user(g.user_id)
            if not user or user.get('role') != 'job_seeker':
                return jsonify({'success': False, 'error': 'Only job seekers can apply'}), 403

            # Check if this is a scraped job
            is_scraped = False
            if hasattr(db, 'is_scraped_job'):
                is_scraped = db.is_scraped_job(g.user_id, job_id)

            if is_scraped:
                # For scraped jobs, return the external URL
                scraped_job = None
                if hasattr(db, 'get_scraped_job_by_id'):
                    scraped_job = db.get_scraped_job_by_id(g.user_id, job_id)

                if scraped_job and scraped_job.get('url'):
                    return jsonify({
                        'success': True,
                        'message': 'Redirecting to external job application',
                        'is_scraped': True,
                        'redirect_url': scraped_job.get('url'),
                        'job_url': scraped_job.get('url')
                    }), 200
                else:
                    return jsonify({
                        'success': False,
                        'error': 'No application URL found for this job'
                    }), 404

            # For company-posted jobs, use internal application system
            job = db.get_job_by_id(job_id)
            if not job:
                return jsonify({'success': False, 'error': 'Job not found'}), 404

            if db.has_applied(g.user_id, job_id):
                return jsonify({'success': False, 'error': 'Already applied for this job'}), 400

            application = {
                'application_id': str(uuid.uuid4()),
                'user_id': g.user_id,
                'job_id': job_id,
                'status': 'pending',
                'applied_at': datetime.now().isoformat(),
                'user_name': user.get('full_name'),
                'user_email': user.get('email'),
                'user_skills': _get_user_skills(user)
            }

            if not db.save_application(application):
                return jsonify({'success': False, 'error': 'Failed to submit application'}), 500

            # Notify Company about new application
            if notification_service:
                # Need company_id from job
                company_id = job.get('company_id')
                if company_id:
                    notification_service.notify_user(
                        user_id=company_id,
                        title="New Job Application",
                        message=f"A new candidate ({user.get('full_name')}) has applied for your job: '{job.get('title')}'",
                        nt_type="info",
                        link=f"/dashboard/company/applications/{job_id}"
                    )
                
                # Notify Job Seeker (confirmation)
                notification_service.notify_user(
                    user_id=g.user_id,
                    title="Application Submitted",
                    message=f"Your application for '{job.get('title')}' has been successfully submitted to {job.get('company')}.",
                    nt_type="success",
                    link="/dashboard/applications"
                )

            return jsonify({
                'success': True,
                'message': 'Application submitted successfully',
                'is_scraped': False
            }), 201

        except Exception as e:
            logger.error(f"Apply error: {e}", exc_info=True)
            return jsonify({'success': False, 'error': str(e)}), 500

    @api_bp.route('/jobs/<job_id>/save', methods=['POST'])
    @token_required
    def save_job_route(job_id):
        """Save a job for later"""
        try:
            user = db.get_user(g.user_id)
            if not user or user.get('role') != 'job_seeker':
                return jsonify({'success': False, 'error': 'Only job seekers can save jobs'}), 403

            if not db.save_saved_job(g.user_id, job_id):
                return jsonify({'success': False, 'error': 'Failed to save job'}), 500

            return jsonify({'success': True, 'message': 'Job saved successfully'}), 200

        except Exception as e:
            logger.error(f"Save job error: {e}", exc_info=True)
            return jsonify({'success': False, 'error': str(e)}), 500

    @api_bp.route('/jobs/<job_id>/unsave', methods=['DELETE'])
    @token_required
    def unsave_job_route(job_id):
        """Remove saved job"""
        try:
            if not db.remove_saved_job(g.user_id, job_id):
                return jsonify({'success': False, 'error': 'Failed to unsave job'}), 500
            return jsonify({'success': True, 'message': 'Job removed from saved'}), 200
        except Exception as e:
            logger.error(f"Unsave job error: {e}", exc_info=True)
            return jsonify({'success': False, 'error': str(e)}), 500

    @api_bp.route('/jobs/saved', methods=['GET'])
    @token_required
    def get_saved_jobs():
        """Get saved jobs for current user"""
        try:
            user = db.get_user(g.user_id)
            if not user or user.get('role') != 'job_seeker':
                return jsonify({'success': False, 'error': 'Only job seekers can view saved jobs'}), 403

            saved_jobs = db.get_saved_jobs(g.user_id)
            return jsonify({'success': True, 'jobs': saved_jobs, 'count': len(saved_jobs)}), 200

        except Exception as e:
            logger.error(f"Get saved jobs error: {e}", exc_info=True)
            return jsonify({'success': False, 'error': str(e)}), 500

    # ==================== JOB REFRESH ENDPOINTS ====================

    @api_bp.route('/jobs/refresh/trigger', methods=['POST'])
    def trigger_job_refresh():
        """Manually trigger job refresh"""
        if background_manager:
            try:
                result = background_manager.manual_refresh_jobs()
                return jsonify({
                    "success": result.get('success', False),
                    "message": "Job refresh triggered successfully" if result.get('success') else "Job refresh failed",
                    "data": result,
                    "timestamp": datetime.now().isoformat()
                }), 200 if result.get('success') else 500
            except Exception as e:
                logger.error(f"Error triggering job refresh: {e}")
                return jsonify({"success": False, "error": str(e)}), 500
        return jsonify({"success": False, "error": "Background manager not available"}), 503

    @api_bp.route('/jobs/refresh/status', methods=['GET'])
    def get_refresh_status():
        """Get job refresh scheduler status"""
        if background_manager:
            try:
                stats = background_manager.get_refresh_stats()
                return jsonify({"success": True, "data": stats, "timestamp": datetime.now().isoformat()}), 200
            except Exception as e:
                logger.error(f"Error getting refresh status: {e}")
                return jsonify({"success": False, "error": str(e)}), 500
        return jsonify({"success": False, "error": "Background manager not available"}), 503

    @api_bp.route('/jobs/recent', methods=['GET'])
    def get_recent_jobs():
        """Get recently refreshed jobs from the last X hours"""
        if not db:
            return jsonify({"success": False, "error": "Database not available"}), 503

        try:
            hours = request.args.get('hours', 24, type=int)
            limit = request.args.get('limit', 100, type=int)
            page = request.args.get('page', 1, type=int)
            source = request.args.get('source', None)
            job_type = request.args.get('job_type', None)

            jobs = db.get_recent_jobs(hours=hours, limit=limit * page)

            start_idx = (page - 1) * limit
            end_idx = start_idx + limit
            paginated_jobs = jobs[start_idx:end_idx]

            if source:
                paginated_jobs = [
                    j for j in paginated_jobs if j.get('source') == source]
            if job_type:
                paginated_jobs = [
                    j for j in paginated_jobs if j.get('job_type') == job_type]

            return jsonify({
                "success": True,
                "data": paginated_jobs,
                "count": len(paginated_jobs),
                "total_available": len(jobs),
                "hours": hours,
                "page": page,
                "limit": limit,
                "filters": {"source": source, "job_type": job_type},
                "timestamp": datetime.now().isoformat()
            }), 200

        except Exception as e:
            logger.error(f"Error getting recent jobs: {e}")
            return jsonify({"success": False, "error": str(e)}), 500

    @api_bp.route('/jobs/refresh/stats', methods=['GET'])
    def get_refresh_statistics():
        """Get detailed refresh statistics"""
        if background_manager:
            try:
                stats = background_manager.get_refresh_stats()
                stats['api_endpoint'] = '/api/jobs/refresh/status'
                stats['manual_trigger_endpoint'] = '/api/jobs/refresh/trigger'
                stats['recent_jobs_endpoint'] = '/api/jobs/recent'
                return jsonify({"success": True, "data": stats, "timestamp": datetime.now().isoformat()}), 200
            except Exception as e:
                logger.error(f"Error getting refresh statistics: {e}")
                return jsonify({"success": False, "error": str(e)}), 500
        return jsonify({"success": False, "error": "Background manager not available"}), 503

    @api_bp.route('/jobs/url/<job_id>', methods=['GET'])
    def get_job_url(job_id):
        """Get job URL by job ID"""
        if not db:
            return jsonify({"success": False, "error": "Database not available"}), 503

        try:
            # First check in jobs collection
            job = db.get_job_by_id(job_id)

            # If not found, check in job_matches (but we need user_id for that)
            # This endpoint might need to be used with user context
            if not job and hasattr(db, 'get_scraped_job_by_id') and 'user_id' in request.args:
                user_id = request.args.get('user_id')
                if user_id:
                    job = db.get_scraped_job_by_id(user_id, job_id)

            if job:
                return jsonify({
                    "success": True,
                    "data": {
                        "job_id": job_id,
                        "title": job.get('title'),
                        "company": job.get('company'),
                        "url": job.get('url'),
                        "source": job.get('source')
                    }
                }), 200
            else:
                return jsonify({"success": False, "error": "Job not found"}), 404

        except Exception as e:
            logger.error(f"Error getting job URL: {e}")
            return jsonify({"success": False, "error": str(e)}), 500

    # ==================== COMPANY RATING ROUTES ====================

    @api_bp.route('/company/rate', methods=['POST'])
    @token_required
    def rate_company():
        """Rate a company (job seekers only)"""
        try:
            user = db.get_user(g.user_id)
            if not user or user.get('role') != 'job_seeker':
                return jsonify({'success': False, 'error': 'Only job seekers can rate companies'}), 403

            data = request.json
            if not data:
                return jsonify({'success': False, 'error': 'No data provided'}), 400

            required_fields = ['company_id', 'rating']
            for field in required_fields:
                if field not in data:
                    return jsonify({'success': False, 'error': f'{field} is required'}), 400

            rating_value = data['rating']
            if not 1 <= rating_value <= 5:
                return jsonify({'success': False, 'error': 'Rating must be between 1 and 5'}), 400

            rating_data = {
                'company_id': data['company_id'],
                'user_id': g.user_id,
                'rating': rating_value,
                'review': data.get('review', '')
            }

            success = db.save_rating(rating_data)
            if not success:
                return jsonify({'success': False, 'error': 'Failed to save rating'}), 500

            return jsonify({
                'success': True,
                'message': 'Rating submitted successfully'
            }), 200

        except Exception as e:
            logger.error(f"Rate company error: {e}", exc_info=True)
            return jsonify({'success': False, 'error': str(e)}), 500

    @api_bp.route('/company/<company_id>/rating', methods=['GET'])
    @token_required
    def get_company_rating_route(company_id):
        """Get rating for a company"""
        try:
            rating_info = db.get_company_rating(company_id)

            # Get user's rating if exists
            user_rating = db.get_user_rating_for_company(g.user_id, company_id)

            return jsonify({
                'success': True,
                'rating': rating_info,
                'user_rating': user_rating.get('rating') if user_rating else None
            }), 200

        except Exception as e:
            logger.error(f"Get company rating error: {e}", exc_info=True)
            return jsonify({'success': False, 'error': str(e)}), 500

    @api_bp.route('/companies/top-rated', methods=['GET'])
    def get_top_rated_companies():
        """Get top rated companies"""
        try:
            limit = request.args.get('limit', 10, type=int)
            companies = db.get_top_rated_companies(limit)
            return jsonify({
                'success': True,
                'companies': companies
            }), 200
        except Exception as e:
            logger.error(f"Get top rated companies error: {e}", exc_info=True)
            return jsonify({'success': False, 'error': str(e)}), 500

    # ==================== CAREER INSIGHTS ENDPOINT ====================

    @api_bp.route('/career-insights', methods=['GET'])
    @token_required
    def career_insights():
        """Get career insights based on market trends and user skills"""
        try:
            # Simple cache mechanism
            cache_key = f"career_insights_{g.user_id}"
            cached_result = getattr(
                career_insights, 'cache', {}).get(cache_key)

            # 30 min cache
            if cached_result and (datetime.now() - cached_result['timestamp']).seconds < 1800:
                return jsonify(cached_result['data']), 200

            user = db.get_user(g.user_id)
            if not user:
                return jsonify({'success': False, 'error': 'User not found'}), 404

            # Get user skills and clean them
            user_skills_raw = user.get('skills', [])
            from services.skill_processor import clean_skills, group_skills_by_category, calculate_skill_confidence
            user_skills = set(clean_skills(user_skills_raw))

            # Get jobs from different time periods for trend analysis
            now = datetime.now()
            recent_cutoff = (now - timedelta(days=7)).isoformat()
            older_cutoff = (now - timedelta(days=30)).isoformat()

            # Recent jobs (last 7 days)
            recent_jobs = list(db.db.job_matches.find(
                {"scraped_at": {"$gte": recent_cutoff}},
                {"skills": 1}
            ))

            # Older jobs (days 8-30)
            older_jobs = list(db.db.job_matches.find(
                {"scraped_at": {"$gte": older_cutoff, "$lt": recent_cutoff}},
                {"skills": 1}
            ))

            # Company posted jobs
            company_jobs = list(db.db.jobs.find(
                {"created_at": {"$gte": older_cutoff}, "source": "company_posted"},
                {"skills": 1, "title": 1, "company": 1}
            ))

            all_jobs = recent_jobs + older_jobs + company_jobs
            total_jobs = len(all_jobs)

            # Count skill frequencies with time periods
            skill_counter = Counter()
            recent_skill_counter = Counter()
            skill_jobs_map = {}

            for job in all_jobs:
                job_skills_raw = job.get('skills', [])
                cleaned_job_skills = clean_skills(job_skills_raw)
                is_recent = job.get('scraped_at', '').startswith(
                    now.strftime('%Y-%m-%d')) if 'scraped_at' in job else False

                for skill in cleaned_job_skills:
                    skill_counter[skill] += 1
                    if is_recent:
                        recent_skill_counter[skill] += 1

                    if skill not in skill_jobs_map:
                        skill_jobs_map[skill] = []
                    if len(skill_jobs_map[skill]) < 5:  # Keep only 5 examples
                        skill_jobs_map[skill].append({
                            'title': job.get('title'),
                            'company': job.get('company')
                        })

            # Calculate trend scores and confidence for top skills
            top_skills = skill_counter.most_common(50)

            insights = []
            for skill, count in top_skills:
                has_skill = skill in user_skills
                recent_count = recent_skill_counter.get(skill, 0)

                # Calculate trend percentage
                old_count = count - recent_count
                trend_percent = ((recent_count - old_count) /
                                 max(old_count, 1)) * 100 if old_count > 0 else 100
                trend_score = min(max(int(trend_percent), -100), 100)

                # Calculate confidence score
                confidence = calculate_skill_confidence(
                    skill, count, total_jobs, trend_score)

                # Priority score with AI confidence boost
                priority_score = count
                if not has_skill:
                    priority_score += count * 0.3  # 30% boost for missing skills
                priority_score = int(priority_score * (confidence / 100))

                insights.append({
                    "skill": skill.title(),
                    "skill_lower": skill,
                    "demand": count,
                    "recent_demand": recent_count,
                    "trend_score": trend_score,
                    "trend_direction": "up" if trend_score > 10 else "down" if trend_score < -10 else "stable",
                    "confidence": int(confidence),
                    "priority_score": priority_score,
                    "has_skill": has_skill,
                    "sample_jobs": skill_jobs_map.get(skill, [])[:3]
                })

            # Sort by priority score
            insights = sorted(
                insights, key=lambda x: x["priority_score"], reverse=True)

            # Calculate overall market match score
            total_demand = sum(s["demand"] for s in insights[:30])
            user_demand = sum(s["demand"]
                              for s in insights[:30] if s["has_skill"])
            market_match_score = int(
                (user_demand / total_demand) * 100) if total_demand > 0 else 0

            top_trending = insights[:10]
            missing_skills = [s for s in insights if not s["has_skill"]][:15]
            priority_skills = [s for s in insights if not s["has_skill"]][:8]

            # Calculate category breakdown
            all_trending_skills = [s["skill_lower"] for s in insights[:20]]
            categories = group_skills_by_category(all_trending_skills)

            # Format categories for frontend
            formatted_categories = {}
            category_display_names = {
                "frontend": "Frontend Development",
                "backend": "Backend Development",
                "cloud_devops": "Cloud & DevOps",
                "data_ai": "Data Science & AI",
                "mobile": "Mobile Development",
                "security": "Cybersecurity",
                "database": "Database Technologies",
                "testing": "Testing & QA",
                "version_control": "Version Control",
                "project_management": "Project Management",
                "other": "Other Skills"
            }

            for category, skills in categories.items():
                display_name = category_display_names.get(
                    category, category.title())
                formatted_categories[display_name] = skills[:5]

            # Get learning recommendations with trend indicators
            learning_recommendations = []
            for skill in priority_skills[:5]:
                trend_icon = "📈" if skill["trend_score"] > 10 else "📉" if skill["trend_score"] < -10 else "➡️"
                trend_text = f"{trend_icon} {abs(skill['trend_score'])}% {'growth' if skill['trend_score'] > 0 else 'decline'}" if abs(
                    skill['trend_score']) > 5 else ""

                learning_recommendations.append({
                    "skill": skill["skill"],
                    "demand": skill["demand"],
                    "priority_score": skill["priority_score"],
                    "trend_score": skill["trend_score"],
                    "trend_text": trend_text,
                    "confidence": skill["confidence"],
                    "courses": [
                        {"platform": "Udemy",
                         "url": f"https://www.udemy.com/courses/search/?q={skill['skill_lower']}"},
                        {"platform": "Coursera",
                         "url": f"https://www.coursera.org/search?query={skill['skill_lower']}"},
                        {"platform": "YouTube",
                         "url": f"https://www.youtube.com/results?search_query={skill['skill_lower']}+tutorial"},
                        {"platform": "Pluralsight",
                         "url": f"https://www.pluralsight.com/search?q={skill['skill_lower']}"}
                    ]
                })

            result_data = {
                "success": True,
                "trending_skills": top_trending,
                "missing_skills": missing_skills,
                "priority_skills": priority_skills,
                "learning_recommendations": learning_recommendations,
                "categories": formatted_categories,
                "user_skills_count": len(user_skills),
                "user_skills_list": list(user_skills)[:20],
                "total_jobs_analyzed": total_jobs,
                "market_match_score": market_match_score,
                "market_summary": generate_market_summary(insights, user_skills, market_match_score)
            }

            # Cache the result
            if not hasattr(career_insights, 'cache'):
                career_insights.cache = {}
            career_insights.cache[cache_key] = {
                'data': result_data,
                'timestamp': datetime.now()
            }

            return jsonify(result_data), 200

        except Exception as e:
            logger.error(f"Career insights error: {e}", exc_info=True)
            return jsonify({'success': False, 'error': str(e)}), 500

    def generate_market_summary(insights, user_skills, market_match_score):
        """Generate intelligent market summary with AI-like insights"""
        top_skills = insights[:5]
        missing_skills = [s for s in insights if not s["has_skill"]]
        missing_count = len(missing_skills)

        # Find top growing skill
        growing_skills = [s for s in insights[:10]
                          if s.get("trend_score", 0) > 20]
        top_growing = growing_skills[0]["skill"] if growing_skills else "N/A"

        if missing_count == 0:
            summary = f"🎯 Excellent! Your skills match {market_match_score}% of market demand. You're perfectly aligned with current industry needs."
            recommendation = f"Consider exploring emerging technologies like {top_growing} to stay ahead of the curve."
            level = "expert"
        elif missing_count < 5:
            summary = f"✅ Great progress! You match {market_match_score}% of market demand. Only {missing_count} key skills stand between you and top opportunities."
            recommendation = f"Focus on {missing_skills[0]['skill']} - it's growing {missing_skills[0]['trend_score']}% and appears in {missing_skills[0]['demand']} jobs."
            level = "intermediate"
        else:
            summary = f"📊 Opportunity ahead! You match {market_match_score}% of market demand. The market shows {missing_count} high-demand skills to develop."
            recommendation = f"Start with {missing_skills[0]['skill']} (confidence {missing_skills[0]['confidence']}%) - it's the most valuable skill you're missing."
            level = "beginner"

        # Generate AI-style career advice
        advice = f"Based on market analysis, {top_skills[0]['skill']} is the most in-demand skill. "
        if not user_skills:
            advice += "Upload your resume to get personalized recommendations."
        else:
            advice += f"Your {len(user_skills)} current skills are valuable, but adding {', '.join([s['skill'] for s in missing_skills[:3]])} could boost your career significantly."

        return {
            "text": summary,
            "recommendation": recommendation,
            "advice": advice,
            "top_skill": top_skills[0]["skill"] if top_skills else "N/A",
            "top_growing": top_growing,
            "missing_count": missing_count,
            "market_match": market_match_score,
            "level": level,
            "market_demand": "Very High" if insights and insights[0]["demand"] > 200 else "High" if insights and insights[0]["demand"] > 100 else "Medium"
        }

    # ==================== COMPANY JOB MANAGEMENT ROUTES ====================

    @api_bp.route('/company/jobs', methods=['GET'])
    @token_required
    def get_company_jobs():
        """Get all jobs posted by the authenticated company"""
        try:
            user = db.get_user(g.user_id)
            if not user or user.get('role') != 'company':
                return jsonify({'success': False, 'error': 'Only companies can access this endpoint'}), 403

            # Get all jobs posted by this company
            jobs = db.get_company_jobs_by_company_id(g.user_id)

            # Get application counts for each job
            for job in jobs:
                applications = db.get_applications_by_job(job.get('job_id'))
                job['applications_count'] = len(applications)
                job['pending_count'] = len(
                    [a for a in applications if a.get('status') == 'pending'])
                job['shortlisted_count'] = len(
                    [a for a in applications if a.get('status') == 'shortlisted'])
                job['hired_count'] = len(
                    [a for a in applications if a.get('status') == 'hired'])

            return jsonify({
                'success': True,
                'jobs': jobs,
                'total': len(jobs)
            }), 200

        except Exception as e:
            logger.error(f"Error getting company jobs: {e}", exc_info=True)
            return jsonify({'success': False, 'error': str(e)}), 500

    @api_bp.route('/company/jobs/<job_id>', methods=['PUT'])
    @token_required
    def update_company_job(job_id):
        """Update a job posting"""
        try:
            user = db.get_user(g.user_id)
            if not user or user.get('role') != 'company':
                return jsonify({'success': False, 'error': 'Only companies can update jobs'}), 403

            # Get existing job
            job = db.get_job_by_id(job_id)
            if not job:
                return jsonify({'success': False, 'error': 'Job not found'}), 404

            # Verify ownership
            if job.get('company_id') != g.user_id:
                return jsonify({'success': False, 'error': 'You can only update your own jobs'}), 403

            data = request.json
            if not data:
                return jsonify({'success': False, 'error': 'No data provided'}), 400

            # Build update data
            update_data = {
                'updated_at': datetime.now().isoformat()
            }

            # Update allowed fields
            allowed_fields = ['title', 'location', 'description', 'requirements',
                              'job_type', 'experience_level', 'category', 'salary_min',
                              'salary_max', 'status']

            for field in allowed_fields:
                if field in data and data[field] is not None:
                    update_data[field] = data[field]

            # Update skills if provided
            if 'skills' in data:
                if isinstance(data['skills'], list):
                    update_data['skills'] = [s.strip()
                                             for s in data['skills'] if s.strip()]
                elif isinstance(data['skills'], str):
                    update_data['skills'] = [s.strip()
                                             for s in data['skills'].split(',') if s.strip()]

            # Perform update
            success = db.update_job(job_id, update_data)

            if success:
                return jsonify({
                    'success': True,
                    'message': 'Job updated successfully',
                    'job_id': job_id
                }), 200
            else:
                return jsonify({'success': False, 'error': 'Failed to update job'}), 500

        except Exception as e:
            logger.error(f"Error updating job: {e}", exc_info=True)
            return jsonify({'success': False, 'error': str(e)}), 500

    @api_bp.route('/company/jobs/<job_id>', methods=['DELETE'])
    @token_required
    def delete_company_job(job_id):
        """Delete a job posting (soft delete by setting status to inactive)"""
        try:
            user = db.get_user(g.user_id)
            if not user or user.get('role') != 'company':
                return jsonify({'success': False, 'error': 'Only companies can delete jobs'}), 403

            # Get existing job
            job = db.get_job_by_id(job_id)
            if not job:
                return jsonify({'success': False, 'error': 'Job not found'}), 404

            # Verify ownership
            if job.get('company_id') != g.user_id:
                return jsonify({'success': False, 'error': 'You can only delete your own jobs'}), 403

            # Soft delete - set status to inactive
            success = db.update_job(
                job_id, {'status': 'inactive', 'updated_at': datetime.now().isoformat()})

            if success:
                return jsonify({
                    'success': True,
                    'message': 'Job deleted successfully'
                }), 200
            else:
                return jsonify({'success': False, 'error': 'Failed to delete job'}), 500

        except Exception as e:
            logger.error(f"Error deleting job: {e}", exc_info=True)
            return jsonify({'success': False, 'error': str(e)}), 500

    @api_bp.route('/company/jobs/<job_id>/duplicate', methods=['POST'])
    @token_required
    def duplicate_job(job_id):
        """Duplicate an existing job posting"""
        try:
            user = db.get_user(g.user_id)
            if not user or user.get('role') != 'company':
                return jsonify({'success': False, 'error': 'Only companies can duplicate jobs'}), 403

            # Get existing job
            job = db.get_job_by_id(job_id)
            if not job:
                return jsonify({'success': False, 'error': 'Job not found'}), 404

            # Verify ownership
            if job.get('company_id') != g.user_id:
                return jsonify({'success': False, 'error': 'You can only duplicate your own jobs'}), 403

            # Create new job from existing
            new_job_id = str(uuid.uuid4())
            new_job = {
                'job_id': new_job_id,
                'title': f"{job.get('title', 'Job')} (Copy)",
                'company': job.get('company'),
                'company_id': g.user_id,
                'location': job.get('location'),
                'salary_min': job.get('salary_min'),
                'salary_max': job.get('salary_max'),
                'job_type': job.get('job_type', 'full_time'),
                'description': job.get('description'),
                'requirements': job.get('requirements'),
                'skills': job.get('skills', []),
                'experience_level': job.get('experience_level', 'mid'),
                'category': job.get('category', 'other'),
                'status': 'active',
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat(),
                'source': 'company_posted',
                'authenticity_score': 100,
                'is_verified': True,
                'verification_status': 'verified',
                'source_display': 'Verified Company'
            }

            if db.save_job(new_job):
                return jsonify({
                    'success': True,
                    'message': 'Job duplicated successfully',
                    'job_id': new_job_id,
                    'job': new_job
                }), 201
            else:
                return jsonify({'success': False, 'error': 'Failed to duplicate job'}), 500

        except Exception as e:
            logger.error(f"Error duplicating job: {e}", exc_info=True)
            return jsonify({'success': False, 'error': str(e)}), 500

    @api_bp.route('/company/jobs/stats', methods=['GET'])
    @token_required
    def get_company_jobs_stats():
        """Get statistics for company jobs"""
        try:
            user = db.get_user(g.user_id)
            if not user or user.get('role') != 'company':
                return jsonify({'success': False, 'error': 'Only companies can access this endpoint'}), 403

            jobs = db.get_company_jobs_by_company_id(g.user_id)

            total_jobs = len(jobs)
            active_jobs = len([j for j in jobs if j.get('status') == 'active'])
            inactive_jobs = len(
                [j for j in jobs if j.get('status') == 'inactive'])

            total_applications = 0
            pending_applications = 0
            shortlisted_applications = 0
            hired_applications = 0

            for job in jobs:
                applications = db.get_applications_by_job(job.get('job_id'))
                total_applications += len(applications)
                pending_applications += len(
                    [a for a in applications if a.get('status') == 'pending'])
                shortlisted_applications += len(
                    [a for a in applications if a.get('status') == 'shortlisted'])
                hired_applications += len(
                    [a for a in applications if a.get('status') == 'hired'])

            return jsonify({
                'success': True,
                'stats': {
                    'total_jobs': total_jobs,
                    'active_jobs': active_jobs,
                    'inactive_jobs': inactive_jobs,
                    'total_applications': total_applications,
                    'pending_applications': pending_applications,
                    'shortlisted_applications': shortlisted_applications,
                    'hired_applications': hired_applications
                }
            }), 200

        except Exception as e:
            logger.error(f"Error getting job stats: {e}", exc_info=True)
            return jsonify({'success': False, 'error': str(e)}), 500

    @api_bp.route('/user/applications', methods=['GET'])
    @token_required
    def get_user_applications():
        try:
            applications = db.get_user_applications(g.user_id)
            return jsonify({
                'success': True,
                'applications': applications
            }), 200
        except Exception as e:
            logger.error(f"Error getting user applications: {e}", exc_info=True)
            return jsonify({'success': False, 'error': str(e)}), 500

    @api_bp.route('/user/applications/stats', methods=['GET'])
    @token_required
    def get_user_application_stats_route():
        try:
            stats = db.get_user_application_stats(g.user_id)
            return jsonify({
                'success': True,
                'stats': stats
            }), 200
        except Exception as e:
            logger.error(f"Error getting user application stats: {e}", exc_info=True)
            return jsonify({'success': False, 'error': str(e)}), 500

    @api_bp.route('/user/dashboard/stats', methods=['GET'])
    @token_required
    def get_user_dashboard_stats():
        """Get unified statistics and recommendations for the user dashboard"""
        try:
            # 1. Get user profile for ATS and Match scores
            user = db.get_user(g.user_id)
            if not user:
                return jsonify({'success': False, 'error': 'User not found'}), 404
            
            # 2. Get application stats
            app_stats = db.get_user_application_stats(g.user_id)
            
            # 3. Get saved jobs count
            saved_jobs = db.get_saved_jobs(g.user_id)
            
            # 4. Get top 3 recommended jobs
            recommended_jobs = db.get_recommend_jobs(limit=3)
            
            # Prepare unified stats
            dashboard_stats = {
                'ats_score': user.get('ats_score', 0),
                'profile_complete': user.get('profile_complete', 75), # Default to 75 if missing
                'ai_match_score': user.get('semantic_match_score', 0),
                'total_applications': app_stats.get('total', 0),
                'saved_jobs_count': len(saved_jobs),
                'recommended_jobs': recommended_jobs,
                'skills': user.get('skills', []),
                'domain_scores': user.get('domain_scores', {})
            }
            
            return jsonify({
                'success': True,
                'stats': dashboard_stats
            }), 200
            
        except Exception as e:
            logger.error(f"Error getting dashboard stats: {e}", exc_info=True)
            return jsonify({'success': False, 'error': str(e)}), 500

    @api_bp.route('/user/applications/<application_id>/status', methods=['GET'])
    @token_required
    def get_application_status_route(application_id):
        try:
            app_status = db.get_application_status(application_id)
            if app_status:
                return jsonify({
                    'success': True,
                    'status': app_status.get('status'),
                    'updated_at': app_status.get('updated_at')
                }), 200
            else:
                return jsonify({'success': False, 'error': 'Application not found'}), 404
        except Exception as e:
            logger.error(f"Error getting application status: {e}", exc_info=True)
            return jsonify({'success': False, 'error': str(e)}), 500