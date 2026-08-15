# routes/candidates.py
from flask import request, jsonify, g
from routes.auth import token_required
import logging
from services.candidate_scoring import CandidateScoringEngine

logger = logging.getLogger(__name__)


def register_candidates_routes(api_bp, db):
    """Register candidate ranking routes"""

    # Initialize scoring engine
    scoring_engine = CandidateScoringEngine(db)

    @api_bp.route('/candidates/rank/<job_id>', methods=['GET'])
    @token_required
    def rank_candidates(job_id):
        """
        Rank candidates for a specific job using hybrid AI scoring
        """
        try:
            # Get user from token
            user = db.get_user(g.user_id)
            if not user:
                return jsonify({'success': False, 'error': 'User not found'}), 404

            # Verify user is a company
            if user.get('role') != 'company':
                return jsonify({'success': False, 'error': 'Only companies can access candidate rankings'}), 403

            # Verify company owns this job
            job = db.get_job_by_id(job_id)
            if not job:
                return jsonify({'success': False, 'error': 'Job not found'}), 404

            if job.get('company_id') != g.user_id:
                return jsonify({'success': False, 'error': 'You do not have permission to view candidates for this job'}), 403

            # Check if we have cached ranking (less than 1 hour old)
            cached = db.get_cached_ranking(job_id)
            from datetime import datetime, timedelta

            if cached and cached.get('last_ranked_at'):
                try:
                    last_ranked = datetime.fromisoformat(
                        cached['last_ranked_at'])
                    if datetime.now() - last_ranked < timedelta(hours=1):
                        logger.info(
                            f"Returning cached ranking for job {job_id}")
                        return jsonify({
                            'success': True,
                            'job': {
                                'job_id': job.get('job_id'),
                                'title': job.get('title'),
                                'company': job.get('company')
                            },
                            'candidates': cached.get('ranked_candidates', []),
                            'total_candidates': cached.get('total_candidates', 0),
                            'cached': True,
                            'last_updated': cached.get('last_ranked_at')
                        }), 200
                except:
                    pass

            # Perform fresh ranking
            logger.info(f"Performing fresh ranking for job {job_id}")
            ranked_candidates = scoring_engine.rank_candidates_for_job(
                job_id, g.user_id)

            return jsonify({
                'success': True,
                'job': {
                    'job_id': job.get('job_id'),
                    'title': job.get('title'),
                    'company': job.get('company')
                },
                'candidates': ranked_candidates,
                'total_candidates': len(ranked_candidates),
                'cached': False
            }), 200

        except Exception as e:
            logger.error(f"Rank candidates error: {e}", exc_info=True)
            return jsonify({'success': False, 'error': str(e)}), 500

    @api_bp.route('/candidates/rank/<job_id>/refresh', methods=['POST'])
    @token_required
    def refresh_ranking(job_id):
        """
        Force refresh ranking for a job (clear cache)
        """
        try:
            user = db.get_user(g.user_id)
            if not user or user.get('role') != 'company':
                return jsonify({'success': False, 'error': 'Unauthorized'}), 403

            # Clear cached ranking
            db.db.job_rankings.delete_one({"job_id": job_id})

            # Perform fresh ranking
            ranked_candidates = scoring_engine.rank_candidates_for_job(
                job_id, g.user_id)

            return jsonify({
                'success': True,
                'message': 'Ranking refreshed successfully',
                'candidates': ranked_candidates,
                'total_candidates': len(ranked_candidates)
            }), 200

        except Exception as e:
            logger.error(f"Refresh ranking error: {e}", exc_info=True)
            return jsonify({'success': False, 'error': str(e)}), 500

    @api_bp.route('/candidates/analyze/<user_id>', methods=['GET'])
    @token_required
    def analyze_candidate_resume(user_id):
        """
        Manually trigger AI analysis for a candidate's resume
        """
        try:
            user = db.get_user(g.user_id)
            if not user or user.get('role') != 'company':
                return jsonify({'success': False, 'error': 'Unauthorized'}), 403

            candidate = db.get_user(user_id)
            if not candidate:
                return jsonify({'success': False, 'error': 'Candidate not found'}), 404

            # Get a sample job to analyze against
            job = db.db.jobs.find_one({"company_id": g.user_id})
            if not job:
                return jsonify({'success': False, 'error': 'No jobs found for analysis'}), 404

            # Perform analysis
            result = scoring_engine.calculate_final_score(candidate, job)

            return jsonify({
                'success': True,
                'candidate': {
                    'name': candidate.get('full_name'),
                    'email': candidate.get('email')
                },
                'analysis': result
            }), 200

        except Exception as e:
            logger.error(f"Analyze candidate error: {e}", exc_info=True)
            return jsonify({'success': False, 'error': str(e)}), 500
