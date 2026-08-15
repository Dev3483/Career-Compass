# routes/skill_gap.py
from flask import request, jsonify, g
from routes.auth import token_required
import logging

logger = logging.getLogger(__name__)


def register_skill_gap_routes(api_bp, db):
    """Register skill gap analysis routes"""

    @api_bp.route('/skill-gap/<job_id>', methods=['GET'])
    @token_required
    def get_skill_gap(job_id):
        """Analyze skill gap between user and a specific job"""
        try:
            # Get user from database
            user = db.get_user(g.user_id)
            if not user:
                return jsonify({'success': False, 'error': 'User not found'}), 404

            # Get job (handle both types: company-posted and scraped)
            job = db.get_job_by_id(job_id)
            if not job and hasattr(db, 'get_scraped_job_by_id'):
                job = db.get_scraped_job_by_id(g.user_id, job_id)

            if not job:
                return jsonify({'success': False, 'error': 'Job not found'}), 404

            # Extract skills (normalize to lowercase)
            user_skills = [s.lower().strip()
                           for s in user.get('skills', []) if s and s.strip()]
            job_skills = [s.lower().strip()
                          for s in job.get('skills', []) if s and s.strip()]

            # If job has no skills, try to extract from description
            if not job_skills and job.get('description'):
                # Simple skill extraction from description
                common_skills = [
                    'python', 'java', 'javascript', 'react', 'angular', 'vue', 'node.js',
                    'django', 'flask', 'mysql', 'postgresql', 'mongodb', 'aws', 'docker',
                    'kubernetes', 'git', 'typescript', 'html', 'css', 'redux', 'next.js',
                    'fastapi', 'pandas', 'numpy', 'machine learning', 'sql', 'linux'
                ]
                desc_lower = job.get('description', '').lower()
                job_skills = [
                    skill for skill in common_skills if skill in desc_lower]

            # Calculate matching and missing skills
            user_skills_set = set(user_skills)
            job_skills_set = set(job_skills)

            matching_skills = list(
                user_skills_set.intersection(job_skills_set))
            missing_skills = list(job_skills_set - user_skills_set)

            # Calculate match percentage
            match_percentage = 0
            if job_skills_set:
                match_percentage = int(
                    (len(matching_skills) / len(job_skills_set)) * 100)

            # Generate learning recommendations for missing skills
            recommendations = generate_recommendations(missing_skills)

            return jsonify({
                'success': True,
                'user_skills': user_skills,
                'required_skills': job_skills,
                'matching_skills': matching_skills,
                'missing_skills': missing_skills,
                'match_percentage': match_percentage,
                'recommendations': recommendations,
                'job_title': job.get('title', 'Unknown Position'),
                'company': job.get('company', 'Unknown Company')
            }), 200

        except Exception as e:
            logger.error(f"Skill gap analysis error: {e}", exc_info=True)
            return jsonify({'success': False, 'error': str(e)}), 500


def generate_recommendations(missing_skills):
    """Generate learning resources for missing skills"""
    recommendations = []

    for skill in missing_skills[:10]:  # Limit to top 10 missing skills
        recommendations.append({
            "skill": skill.title(),
            "resources": [
                {
                    "name": "Udemy",
                    "url": f"https://www.udemy.com/courses/search/?q={skill.replace(' ', '+')}"
                },
                {
                    "name": "Coursera",
                    "url": f"https://www.coursera.org/search?query={skill.replace(' ', '+')}"
                },
                {
                    "name": "YouTube",
                    "url": f"https://www.youtube.com/results?search_query={skill.replace(' ', '+')}+tutorial"
                },
                {
                    "name": "LinkedIn Learning",
                    "url": f"https://www.linkedin.com/learning/search?keywords={skill.replace(' ', '+')}"
                }
            ]
        })

    return recommendations
