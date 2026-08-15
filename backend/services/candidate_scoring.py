# services/candidate_scoring.py - Fixed version

from datetime import datetime
import logging
from typing import Dict, List, Any
from services.resume_analyzer import get_resume_analyzer

logger = logging.getLogger(__name__)


class CandidateScoringEngine:
    """Hybrid scoring engine combining skill match + AI analysis"""

    def __init__(self, db):
        self.db = db
        self.resume_analyzer = get_resume_analyzer()

    def _safe_int(self, value, default=0):
        """Safely convert value to integer"""
        if value is None:
            return default
        if isinstance(value, (int, float)):
            return int(value)
        if isinstance(value, str):
            try:
                return int(float(value)) if value.strip() else default
            except (ValueError, TypeError):
                return default
        return default

    def _safe_float(self, value, default=0.0):
        """Safely convert value to float"""
        if value is None:
            return default
        if isinstance(value, (int, float)):
            return float(value)
        if isinstance(value, str):
            try:
                return float(value) if value.strip() else default
            except (ValueError, TypeError):
                return default
        return default

    def calculate_base_score(self, user: Dict, job: Dict) -> Dict:
        """
        Calculate base score from skills and experience
        """
        # Extract skills safely
        user_skills_raw = user.get('skills', [])
        if not isinstance(user_skills_raw, list):
            user_skills_raw = []

        job_skills_raw = job.get('skills', [])
        if not isinstance(job_skills_raw, list):
            job_skills_raw = []

        user_skills = set([str(s).lower().strip()
                          for s in user_skills_raw if s])
        job_skills = set([str(s).lower().strip() for s in job_skills_raw if s])

        # Skill match percentage
        if job_skills:
            matching_skills = user_skills & job_skills
            match_percentage = (len(matching_skills) / len(job_skills)) * 100
        else:
            match_percentage = 0
            matching_skills = set()

        # Experience score (0-100) - FIXED: Handle empty string
        exp_years_raw = user.get('experience_years', 0)
        exp_years = self._safe_int(exp_years_raw, 0)
        exp_score = min(exp_years * 10, 100)

        # ATS score (if available) - FIXED: Handle None
        ats_score_raw = user.get('ats_score', 0)
        ats_score = self._safe_float(ats_score_raw, 0)

        # Base score: 60% skill match, 20% ATS, 20% experience
        base_score = (match_percentage * 0.6) + \
            (ats_score * 0.2) + (exp_score * 0.2)

        return {
            "match_percentage": round(match_percentage, 1),
            "matching_skills": list(matching_skills),
            "missing_skills": list(job_skills - user_skills),
            "exp_score": round(exp_score, 1),
            "ats_score": ats_score,
            "base_score": round(base_score, 1)
        }

    def calculate_ai_score(self, user: Dict, job: Dict) -> Dict:
        """
        Calculate AI-based score from resume analysis
        """
        try:
            analysis = self.resume_analyzer.analyze_cached_resume(user, job)

            return {
                "ai_score": self._safe_float(analysis.get('score', 50), 50),
                "ai_reason": str(analysis.get('reason', 'Analysis completed')),
                "strengths": analysis.get('strengths', []),
                "weaknesses": analysis.get('weaknesses', []),
                "skill_relevance": self._safe_float(analysis.get('skill_relevance', 50), 50),
                "project_quality": self._safe_float(analysis.get('project_quality', 50), 50),
                "experience_level": str(analysis.get('experience_level', 'unknown'))
            }
        except Exception as e:
            logger.error(f"AI scoring error: {e}")
            return {
                "ai_score": 50,
                "ai_reason": "Analysis unavailable",
                "strengths": [],
                "weaknesses": [],
                "skill_relevance": 50,
                "project_quality": 50,
                "experience_level": "unknown"
            }

    def calculate_final_score(self, user: Dict, job: Dict) -> Dict:
        """
        Calculate final hybrid score: 60% base + 40% AI
        """
        base_result = self.calculate_base_score(user, job)
        ai_result = self.calculate_ai_score(user, job)

        # Hybrid final score - FIXED: Ensure all values are floats
        base_score = self._safe_float(base_result['base_score'], 0)
        ai_score = self._safe_float(ai_result['ai_score'], 50)
        final_score = (base_score * 0.6) + (ai_score * 0.4)

        # Generate explanation
        explanation = self._generate_explanation(
            base_result, ai_result, final_score)

        return {
            "final_score": round(final_score, 1),
            "base_score": round(base_score, 1),
            "ai_score": round(ai_score, 1),
            "match_percentage": base_result['match_percentage'],
            "matching_skills": base_result['matching_skills'],
            "missing_skills": base_result['missing_skills'][:5],
            "strengths": ai_result['strengths'][:3],
            "weaknesses": ai_result['weaknesses'][:2],
            "explanation": explanation,
            "ai_reason": ai_result['ai_reason'],
            "experience_level": ai_result['experience_level']
        }

    def _generate_explanation(self, base: Dict, ai: Dict, final_score: float) -> str:
        """
        Generate human-readable explanation of ranking
        """
        parts = []

        match_pct = self._safe_float(base.get('match_percentage', 0), 0)
        ats_score = self._safe_float(base.get('ats_score', 0), 0)
        skill_rel = self._safe_float(ai.get('skill_relevance', 0), 0)

        if match_pct >= 70:
            parts.append(f"✓ Excellent skill match ({match_pct:.0f}%)")
        elif match_pct >= 50:
            parts.append(f"✓ Good skill match ({match_pct:.0f}%)")
        else:
            parts.append(f"⚠️ Low skill match ({match_pct:.0f}%)")

        if ats_score >= 70:
            parts.append("✓ Strong ATS optimization")
        elif ats_score >= 50:
            parts.append("✓ Decent ATS score")

        if skill_rel >= 70:
            parts.append("✓ AI-confirmed skill relevance")

        strengths = ai.get('strengths', [])
        if strengths and isinstance(strengths, list) and len(strengths) > 0:
            parts.append(f"✓ {str(strengths[0])}")

        if not parts:
            parts.append("Review recommended - mixed qualifications")

        return " | ".join(parts)

    def rank_candidates_for_job(self, job_id: str, company_id: str = None) -> List[Dict]:
        """
        Rank all candidates who applied for a job
        """
        try:
            # Get job details
            job = self.db.get_job_by_id(job_id)
            if not job:
                logger.error(f"Job not found: {job_id}")
                return []

            logger.info(
                f"Ranking candidates for job: {job.get('title')} ({job_id})")

            # Get applications for this job
            applications = self.db.get_applications_by_job(job_id)

            logger.info(
                f"Found {len(applications)} applications for job {job_id}")

            if not applications:
                logger.info(f"No applications found for job {job_id}")
                return []

            # Score each candidate
            ranked_candidates = []

            for app in applications:
                user_id = app.get('user_id')
                if not user_id:
                    logger.warning(
                        f"Application missing user_id: {app.get('application_id')}")
                    continue

                user = self.db.get_user(user_id)
                if not user:
                    logger.warning(f"User not found for user_id: {user_id}")
                    continue

                logger.info(
                    f"Scoring candidate: {user.get('full_name')} ({user_id})")

                # Calculate final score
                scoring_result = self.calculate_final_score(user, job)

                ranked_candidates.append({
                    "application_id": app.get('application_id'),
                    "user_id": user_id,
                    "applicant_name": str(user.get('full_name', 'Unknown')),
                    "applicant_email": str(user.get('email', '')),
                    "applicant_skills": user.get('skills', []),
                    "applicant_resume_url": str(user.get('resume_url', '')),
                    "current_status": str(app.get('status', 'pending')),
                    "applied_at": app.get('applied_at') or app.get('created_at'),
                    "score": self._safe_float(scoring_result['final_score'], 0),
                    "ai_score": self._safe_float(scoring_result['ai_score'], 50),
                    "match_percentage": self._safe_float(scoring_result['match_percentage'], 0),
                    "matching_skills": scoring_result.get('matching_skills', []),
                    "missing_skills": scoring_result.get('missing_skills', []),
                    "strengths": scoring_result.get('strengths', []),
                    "weaknesses": scoring_result.get('weaknesses', []),
                    "explanation": str(scoring_result.get('explanation', '')),
                    "ai_reason": str(scoring_result.get('ai_reason', '')),
                    "experience_level": str(scoring_result.get('experience_level', 'unknown'))
                })

            # Sort by score (highest first) - FIXED: Ensure all scores are numbers
            ranked_candidates.sort(key=lambda x: self._safe_float(
                x.get('score', 0), 0), reverse=True)

            # Add rank number
            for idx, candidate in enumerate(ranked_candidates, 1):
                candidate['rank'] = idx

            logger.info(
                f"Successfully ranked {len(ranked_candidates)} candidates for job {job_id}")

            # Cache ranking results
            self._cache_ranking_results(job_id, ranked_candidates)

            return ranked_candidates

        except Exception as e:
            logger.error(f"Error ranking candidates: {e}", exc_info=True)
            return []

    def _cache_ranking_results(self, job_id: str, ranked_candidates: List[Dict]):
        """Cache ranking results in database"""
        try:
            self.db.db.job_rankings.update_one(
                {"job_id": job_id},
                {"$set": {
                    "ranked_candidates": ranked_candidates,
                    "last_ranked_at": datetime.now().isoformat(),
                    "total_candidates": len(ranked_candidates)
                }},
                upsert=True
            )
        except Exception as e:
            logger.error(f"Error caching ranking results: {e}")
