import re
import logging
from typing import List, Dict, Tuple

logger = logging.getLogger(__name__)


class ResumeATSAnalyzer:
    """Analyze resume for ATS compatibility (Improved Version)"""

    def __init__(self):
        # Weight distribution (must sum ~1)
        self.ats_factors = {
            "formatting": 0.10,
            "keywords": 0.25,
            "experience": 0.20,
            "education": 0.10,
            "achievements": 0.20,
            "projects": 0.15
        }

    # ========================= MAIN METHOD =========================
    def calculate_ats_score(
        self,
        text: str,
        skills: List[str],
        experience: List[Dict],
        education: List[Dict],
        projects: List[Dict],
        achievements: List[str]
    ) -> Tuple[int, Dict]:

        breakdown = {}

        formatting = self._check_formatting(text)
        keywords = self._check_keywords(text, skills)
        exp = self._check_experience_quality(experience)
        edu = self._check_education_quality(education)
        ach = self._check_achievements(achievements)
        proj = self._check_projects_quality(projects)

        breakdown["formatting"] = self._format_breakdown(
            formatting, self.ats_factors["formatting"])
        breakdown["keywords"] = self._format_breakdown(
            keywords, self.ats_factors["keywords"])
        breakdown["experience"] = self._format_breakdown(
            exp, self.ats_factors["experience"])
        breakdown["education"] = self._format_breakdown(
            edu, self.ats_factors["education"])
        breakdown["achievements"] = self._format_breakdown(
            ach, self.ats_factors["achievements"])
        breakdown["projects"] = self._format_breakdown(
            proj, self.ats_factors["projects"])

        final_score = (
            formatting * self.ats_factors["formatting"] +
            keywords * self.ats_factors["keywords"] +
            exp * self.ats_factors["experience"] +
            edu * self.ats_factors["education"] +
            ach * self.ats_factors["achievements"] +
            proj * self.ats_factors["projects"]
        )

        final_score = int(max(0, min(100, final_score * 100)))

        return final_score, breakdown

    # ========================= HELPERS =========================

    def _format_breakdown(self, score: float, weight: float) -> Dict:
        return {
            "score": round(score * 100, 1),
            "weight": weight * 100,
            "contribution": round(score * weight * 100, 1)
        }

    # ========================= SCORING =========================

    def _check_formatting(self, text: str) -> float:
        score = 0.6

        if len(text.split()) > 250:
            score += 0.1

        if re.search(r'[•●■➢▪▸-]\s', text):
            score += 0.1

        if re.search(r'\n[A-Z][A-Z\s]{3,}\n', text):
            score += 0.1

        if not re.search(r'\n{3,}', text):
            score += 0.1

        return min(score, 1.0)

    def _check_keywords(self, text: str, skills: List[str]) -> float:
        if not skills:
            return 0.3

        text_lower = text.lower()
        found = 0

        for skill in skills:
            if skill.lower() in text_lower:
                found += 1

        ratio = found / len(skills)

        if ratio > 0.8:
            return 1.0
        elif ratio > 0.6:
            return 0.8
        elif ratio > 0.4:
            return 0.6
        elif ratio > 0.2:
            return 0.4
        else:
            return 0.3

    def _check_experience_quality(self, experience: List[Dict]) -> float:
        if not experience:
            return 0.3

        score = 0.4

        for exp in experience:
            if exp.get("title"):
                score += 0.1
            if exp.get("company"):
                score += 0.1
            if exp.get("achievements"):
                score += 0.1
            if exp.get("technologies"):
                score += 0.1

        if len(experience) >= 2:
            score += 0.1

        return min(score, 1.0)

    def _check_education_quality(self, education: List[Dict]) -> float:
        if not education:
            return 0.3

        edu = education[0]

        score = 0.5
        if edu.get("degree"):
            score += 0.2
        if edu.get("institution"):
            score += 0.2
        if edu.get("year"):
            score += 0.1

        return min(score, 1.0)

    def _check_achievements(self, achievements: List[str]) -> float:
        if not achievements:
            return 0.3

        metric_count = 0

        for ach in achievements:
            if re.search(r'\d+%|\d+\s*(x|times)', ach.lower()):
                metric_count += 1

        score = 0.5 + min(0.5, metric_count * 0.1)

        return min(score, 1.0)

    def _check_projects_quality(self, projects: List[Dict]) -> float:
        if not projects:
            return 0.3

        score = 0.4

        for proj in projects:
            if proj.get("title"):
                score += 0.1
            if proj.get("technologies"):
                score += 0.1
            if proj.get("description"):
                score += 0.1
            if proj.get("outcomes"):
                score += 0.1

        if len(projects) >= 2:
            score += 0.1

        return min(score, 1.0)

    # ========================= INSIGHTS =========================

    def generate_strengths_weaknesses(
        self,
        skills: List[str],
        experience: List[Dict],
        education: List[Dict],
        projects: List[Dict],
        achievements: List[str]
    ) -> Tuple[List[str], List[str]]:

        strengths = []
        weaknesses = []

        # Skills
        if len(skills) >= 12:
            strengths.append(
                "Strong technical skillset across multiple domains")
        else:
            weaknesses.append("Add more relevant technical skills")

        # Experience
        if experience:
            strengths.append("Relevant practical experience present")
        else:
            weaknesses.append("Add internships or real-world experience")

        # Projects
        if len(projects) >= 2:
            strengths.append("Good project portfolio demonstrating skills")
        else:
            weaknesses.append("Add 2–3 strong projects")

        # Achievements
        if any(re.search(r'\d', a) for a in achievements):
            strengths.append("Includes measurable achievements")
        else:
            weaknesses.append("Add quantified results (%, numbers)")

        # Education
        if education:
            strengths.append("Educational background clearly mentioned")
        else:
            weaknesses.append("Add education details")

        return strengths[:5], weaknesses[:5]

    def generate_summary(
        self,
        skills: List[str],
        experience: List[Dict],
        education: List[Dict],
        projects: List[Dict],
        achievements: List[str],
        total_years: int
    ) -> str:

        if not skills:
            return "Candidate profile available. Add more details for better analysis."

        top_skills = ", ".join(skills[:5])

        if experience:
            return f"Professional with {total_years}+ years of experience, skilled in {top_skills}, with hands-on project experience and strong technical capabilities."

        return f"Motivated candidate skilled in {top_skills}, with strong project experience and a passion for building scalable solutions."
