# services/job_matcher.py - With ML-based ranking and recency score
import numpy as np
from typing import List, Dict, Tuple
from sklearn.metrics.pairwise import cosine_similarity
import hashlib
import re
from datetime import datetime


def calculate_recency_score(job: Dict) -> int:
    """
    Calculate recency score based on when the job was posted
    Score range: 0-100, higher for more recent jobs
    """
    posted = job.get("date_posted")
    
    if not posted:
        return 0
    
    try:
        # Try to parse different date formats
        if isinstance(posted, str):
            # Common formats: ISO, "Recently", "2 days ago", etc.
            if posted.lower() == "recently":
                return 100
            if "day" in posted.lower():
                import re
                days = re.findall(r'\d+', posted)
                if days:
                    days_ago = int(days[0])
                    return max(0, 100 - days_ago * 10)
                return 80
            if "hour" in posted.lower():
                return 95
            if "week" in posted.lower():
                weeks = re.findall(r'\d+', posted)
                if weeks:
                    weeks_ago = int(weeks[0])
                    return max(0, 100 - weeks_ago * 15)
                return 60
            if "month" in posted.lower():
                months = re.findall(r'\d+', posted)
                if months:
                    months_ago = int(months[0])
                    return max(0, 100 - months_ago * 30)
                return 40
            
            # Try ISO format
            try:
                posted_date = datetime.fromisoformat(posted)
                days_ago = (datetime.now() - posted_date).days
                return max(0, 100 - days_ago)
            except:
                pass
    except:
        pass
    
    return 50  # Default score


def calculate_rank_score(job: Dict) -> float:
    """
    Calculate comprehensive rank score using multiple factors
    Weights:
    - Match Score: 40%
    - Authenticity Score: 20%
    - Semantic Match: 20%
    - Company Rating: 10% (converted to 0-100 scale)
    - Recency Score: 10%
    """
    match_score = job.get('match_score', 0)
    authenticity_score = job.get('authenticity_score', 50)
    semantic_match = job.get('semantic_match', 0)
    company_rating = job.get('company_rating', 0) * 20  # Convert 0-5 to 0-100
    recency_score = job.get('recency_score', 50)
    
    rank_score = (
        0.4 * match_score +
        0.2 * authenticity_score +
        0.2 * semantic_match +
        0.1 * company_rating +
        0.1 * recency_score
    )
    
    # Apply penalty for suspicious/fake jobs
    if job.get('is_suspicious', False):
        rank_score *= 0.7
    if job.get('fake_score', 0) > 60:
        rank_score *= 0.5
    
    return round(rank_score, 2)


class JobMatcher:
    def __init__(self):
        self.quick_matcher = QuickMatchMatcher()

    def match_jobs(self, user_profile: Dict, jobs: List[Dict], top_k: int = 50) -> List[Dict]:
        if not jobs:
            return []

        # Use quick matcher for scoring
        matched_jobs = self.quick_matcher.quick_match(
            user_profile, jobs, top_k=top_k)

        # Add recency score to each job
        for job in matched_jobs:
            if 'recency_score' not in job:
                job['recency_score'] = calculate_recency_score(job)
            
            # Ensure match_score exists
            if 'match_score' not in job:
                job['match_score'] = job.get('skill_match_percentage', 0)
            
            # Calculate rank score
            job['rank_score'] = calculate_rank_score(job)
        
        # Sort by rank score for final ranking
        matched_jobs.sort(key=lambda x: x.get('rank_score', 0), reverse=True)
        
        return matched_jobs


class QuickMatchMatcher:
    @staticmethod
    def quick_match(user_profile: Dict, jobs: List[Dict], top_k: int = 50) -> List[Dict]:
        if not jobs:
            return []

        user_skills = set(skill.lower().strip()
                          for skill in user_profile.get('skills', []))
        preferred_type = user_profile.get('preferred_job_type', '').lower()

        scored_jobs = []

        for job in jobs:
            job_skills = set(skill.lower().strip()
                             for skill in job.get('skills', []))

            # Calculate skill match percentage
            skill_match = 0
            if job_skills:
                matched_skills = len(user_skills.intersection(job_skills))
                skill_match = (matched_skills / len(job_skills)) * 100
            else:
                skill_match = 30

            # Calculate preference match
            preference_match = 0
            job_type = job.get('job_type', '').lower()
            if preferred_type and job_type:
                if preferred_type == job_type:
                    preference_match = 100
                elif 'remote' in job_type:
                    preference_match = 80
                elif 'hybrid' in job_type:
                    preference_match = 70

            # Calculate total score (weighted)
            total_score = (skill_match * 0.7) + (preference_match * 0.3)

            # Ensure minimum score for all jobs
            if total_score < 20:
                total_score = 20 + (total_score / 10)

            matched_job = job.copy()
            matched_job['match_score'] = round(total_score, 1)
            matched_job['skill_match_percentage'] = round(skill_match, 1)
            matched_job['missing_skills'] = list(job_skills - user_skills)[:5]

            scored_jobs.append(matched_job)

        # Sort by match score initially
        scored_jobs.sort(key=lambda x: x['match_score'], reverse=True)
        return scored_jobs[:top_k]