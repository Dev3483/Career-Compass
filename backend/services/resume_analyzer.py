# services/resume_analyzer.py
import requests
import pdfplumber
import io
import logging
from typing import Dict, Optional
import json
import os
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


class ResumeAnalyzer:
    """AI-powered resume analysis service"""

    def __init__(self, groq_api_key=None):
        """Initialize with Groq API key"""
        import os
        self.api_key = groq_api_key or os.getenv("GROQ_API_KEY")

        # Fallback to keyword-based analysis if no API key
        self.use_ai = bool(self.api_key)

        if self.use_ai:
            logger.info("✅ Resume Analyzer initialized with AI (Groq)")
        else:
            logger.warning(
                "⚠️ GROQ_API_KEY not found, using keyword-based fallback")

    def extract_resume_text(self, resume_url: str) -> str:
        """
        Extract text from resume PDF using URL
        """
        try:
            # Download PDF from URL
            response = requests.get(resume_url, timeout=30)
            response.raise_for_status()

            # Extract text using pdfplumber
            with pdfplumber.open(io.BytesIO(response.content)) as pdf:
                text = ""
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"

            if not text.strip():
                logger.warning(f"No text extracted from {resume_url}")
                return ""

            logger.info(
                f"Successfully extracted {len(text)} characters from resume")
            return text

        except Exception as e:
            logger.error(f"Error extracting resume text: {e}")
            return ""

    def analyze_resume_with_ai(self, resume_text: str, job: Dict) -> Dict:
        """
        Analyze resume using Groq AI
        """
        if not self.use_ai or not resume_text:
            return self._fallback_analysis(resume_text, job)

        try:
            from groq import Groq

            client = Groq(api_key=self.api_key)

            # Truncate text if too long (max 8000 chars for API)
            truncated_text = resume_text[:7000]

            prompt = f"""
You are an expert resume reviewer and technical recruiter.

JOB DESCRIPTION:
Title: {job.get('title', 'Unknown')}
Company: {job.get('company', 'Unknown')}
Skills Required: {', '.join(job.get('skills', []))}
Description: {job.get('description', '')[:1000]}

CANDIDATE RESUME:
{truncated_text}

Evaluate this candidate for the position. Return ONLY valid JSON with no other text.

{{
    "score": 0-100,
    "reason": "brief explanation of why this score was given",
    "strengths": ["strength1", "strength2", "strength3"],
    "weaknesses": ["weakness1", "weakness2"],
    "skill_relevance": 0-100,
    "project_quality": 0-100,
    "experience_level": "entry/junior/mid/senior/expert"
}}
"""

            response = client.chat.completions.create(
                model="llama3-70b-8192",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=500
            )

            result_text = response.choices[0].message.content

            # Extract JSON from response
            import re
            json_match = re.search(r'\{.*\}', result_text, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group())
                logger.info(
                    f"AI analysis completed with score: {result.get('score', 0)}")
                return result

            return self._fallback_analysis(resume_text, job)

        except Exception as e:
            logger.error(f"AI analysis error: {e}")
            return self._fallback_analysis(resume_text, job)

    def _fallback_analysis(self, resume_text: str, job: Dict) -> Dict:
        """
        Fallback keyword-based analysis when AI is unavailable
        """
        resume_lower = resume_text.lower() if resume_text else ""
        job_skills = [s.lower() for s in job.get('skills', [])]

        # Count skill matches
        matched_skills = []
        for skill in job_skills:
            if skill.lower() in resume_lower:
                matched_skills.append(skill)

        skill_relevance = int(
            (len(matched_skills) / max(len(job_skills), 1)) * 100)

        # Estimate experience from keywords
        experience_keywords = {
            'entry': 0, 'junior': 0, 'mid': 1, 'senior': 2, 'lead': 3, 'principal': 4
        }
        exp_level = 'entry'
        for level, weight in experience_keywords.items():
            if level in resume_lower:
                exp_level = level

        # Calculate overall score
        score = min(100, skill_relevance + 10)  # Base on skill match

        strengths = []
        if skill_relevance > 60:
            strengths.append(
                f"Good skill match ({len(matched_skills)}/{len(job_skills)} skills)")
        if len(resume_text) > 500:
            strengths.append("Detailed resume with substantial content")

        weaknesses = []
        missing_skills = [s for s in job_skills if s not in matched_skills][:3]
        if missing_skills:
            weaknesses.append(
                f"Missing key skills: {', '.join(missing_skills)}")

        return {
            "score": score,
            "reason": f"Skill match: {len(matched_skills)}/{len(job_skills)} required skills found",
            "strengths": strengths[:3],
            "weaknesses": weaknesses[:2],
            "skill_relevance": skill_relevance,
            "project_quality": min(100, skill_relevance + 5),
            "experience_level": exp_level
        }

    def analyze_cached_resume(self, user: Dict, job: Dict) -> Dict:
        """
        Use cached resume analysis from user object if available
        """
        # Check if user has cached AI analysis
        if user.get('ai_resume_analysis'):
            cached = user.get('ai_resume_analysis')
            # Use cached if it's less than 7 days old
            from datetime import datetime
            analyzed_at = cached.get('analyzed_at')
            if analyzed_at:
                try:
                    analyzed_date = datetime.fromisoformat(analyzed_at)
                    if (datetime.now() - analyzed_date).days < 7:
                        logger.info(
                            f"Using cached resume analysis for user {user.get('user_id')}")
                        return cached.get('analysis', {})
                except:
                    pass

        # Otherwise perform fresh analysis
        if user.get('resume_url'):
            resume_text = self.extract_resume_text(user['resume_url'])
            analysis = self.analyze_resume_with_ai(resume_text, job)

            # Cache the analysis
            self._cache_resume_analysis(user.get('user_id'), analysis)

            return analysis

        return self._fallback_analysis("", job)

    def _cache_resume_analysis(self, user_id: str, analysis: Dict):
        """Cache resume analysis in database"""
        try:
            from services.database import Database
            db = Database()
            db.db.users.update_one(
                {"user_id": user_id},
                {"$set": {
                    "ai_resume_analysis": {
                        "analyzed_at": datetime.now().isoformat(),
                        "analysis": analysis
                    }
                }}
            )
        except Exception as e:
            logger.error(f"Error caching resume analysis: {e}")


# Create global instance
resume_analyzer = None


def get_resume_analyzer():
    global resume_analyzer
    if resume_analyzer is None:
        resume_analyzer = ResumeAnalyzer()
    return resume_analyzer
