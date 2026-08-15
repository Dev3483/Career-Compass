# services/resume_ai.py - FIXED VERSION
import re
import json
import logging
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)

try:
    from google import genai
    GEMINI_AVAILABLE = True
except ImportError:
    logger.warning("Google GenAI not installed. Run: pip install google-genai")
    GEMINI_AVAILABLE = False


class ResumeAIAnalyzer:
    """AI-powered resume analysis using Gemini"""

    def __init__(self, api_key: Optional[str] = None):
        self.client = None
        if GEMINI_AVAILABLE and api_key:
            try:
                self.client = genai.Client(api_key=api_key)
                logger.info("✅ Gemini AI client initialized")
            except Exception as e:
                logger.error(f"Failed to initialize Gemini: {e}")
                self.client = None
        else:
            logger.info("Gemini AI not configured — using fallback analysis")

    def analyze_resume(self, text: str, skills: List[str], sections: Dict) -> Dict:
        """Analyze resume with AI or fallback"""
        if not self.client:
            return self._fallback_analysis(skills, sections)

        try:
            prompt = f"""
You are an expert resume analyst and technical recruiter. Analyze this resume deeply and thoroughly extract ALL relevant skills for the candidate, and provide insights.

Resume Text (first 8000 chars):
{text[:8000]}

Initial Skills Recognized (for context):
{skills}

Respond ONLY with valid JSON, no markdown fences, no preamble:
{{
    "extracted_skills": ["Skill 1", "Skill 2", "Skill 3"],
    "strengths": ["strength1", "strength2", "strength3", "strength4", "strength5"],
    "improvements": ["improvement1", "improvement2", "improvement3", "improvement4", "improvement5"],
    "summary": "A highly professional and engaging 2-3 line candidate summary."
}}

Rules:
- "extracted_skills" MUST be a comprehensive list of ALL technical skills, tools, frameworks, languages, AND soft skills found in the resume. 
- Ensure that the skills listed are precise, canonical names (e.g., "Node.js", "React", "Machine Learning").
- Only include REAL skills. Remove noise words like "system", "platform", "project", "software", "lab".
- Strengths must be based on actual resume content, be very specific to the candidate.
- Improvements must be highly actionable and specific to this candidate's profile.
- Return ONLY JSON!
"""
            # FIX: Use correct model name that actually exists
            response = self.client.models.generate_content(
                model="gemini-1.5-flash",  # ✅ FIXED: Use available model
                contents=prompt
            )

            result_text = response.text.strip()
            # Strip markdown code fences if present
            result_text = re.sub(r'^```(?:json)?\s*', '', result_text)
            result_text = re.sub(r'\s*```$', '', result_text)

            json_match = re.search(r'\{.*\}', result_text, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group())
                logger.info("✅ Gemini analysis complete")
                return result
            else:
                logger.error("Failed to parse Gemini response as JSON")
                return self._fallback_analysis(skills, sections)

        except Exception as e:
            logger.error(f"Gemini analysis error: {e}")
            return self._fallback_analysis(skills, sections)

    def _fallback_analysis(self, skills: List[str], sections: Dict) -> Dict:
        """Fallback analysis when Gemini is unavailable"""
        noise_words = {'system', 'platform', 'lab', 'project', 'software'}
        valid_skills = [s for s in skills if len(
            s) > 2 and s.lower() not in noise_words]

        strengths = []
        if len(valid_skills) >= 10:
            strengths.append(
                f"Strong technical breadth with {len(valid_skills)} skills")
        elif len(valid_skills) >= 5:
            strengths.append(
                f"Good technical foundation with {len(valid_skills)} skills")

        skills_lower = [s.lower() for s in valid_skills]
        if any(s in skills_lower for s in ['python', 'java', 'javascript']):
            strengths.append("Proficient in multiple programming languages")
        if any(s in skills_lower for s in ['react', 'angular', 'vue']):
            strengths.append("Experience with modern frontend frameworks")
        if any(s in skills_lower for s in ['aws', 'docker', 'kubernetes']):
            strengths.append("Cloud and DevOps exposure")
        if not strengths:
            strengths = ["Technical skills identified",
                         "Ready to learn and grow"]

        improvements = []
        if len(valid_skills) < 10:
            improvements.append(
                "Expand technical skill set with additional technologies")
        if not any(s in skills_lower for s in ['aws', 'gcp', 'azure']):
            improvements.append(
                "Consider adding cloud platform experience (AWS/GCP/Azure)")
        if not any(s in skills_lower for s in ['docker', 'kubernetes']):
            improvements.append("Learn containerization tools like Docker")
        if not improvements:
            improvements = ["Add quantifiable achievements",
                            "Include more project details"]

        summary = sections.get("summary", "")[:200] if sections.get("summary") else \
            f"Professional with skills in {', '.join(valid_skills[:5])}. Looking for opportunities to apply technical expertise."

        return {
            "extracted_skills": valid_skills,
            "strengths": strengths[:5],
            "improvements": improvements[:5],
            "summary": summary
        }
