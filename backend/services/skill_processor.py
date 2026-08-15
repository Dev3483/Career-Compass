# services/skill_processor.py - Complete skill cleaning and normalization system with AI

import re
import os
import json
import logging
from typing import List, Set, Dict, Optional
from datetime import datetime, timedelta
from collections import Counter
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Normalization mapping for skill variations
NORMALIZATION_MAP = {
    # React variations
    "reactjs": "react",
    "react.js": "react",
    "react-js": "react",
    "react js": "react",
    "reactj": "react",

    # Node.js variations
    "nodejs": "node.js",
    "node-js": "node.js",
    "node js": "node.js",
    "node": "node.js",

    # Python variations
    "python3": "python",
    "python 3": "python",
    "py": "python",

    # JavaScript variations
    "javascript": "javascript",
    "js": "javascript",
    "javasript": "javascript",

    # TypeScript variations
    "typescript": "typescript",
    "ts": "typescript",

    # AWS variations
    "aws cloud": "aws",
    "amazon web services": "aws",
    "amazon aws": "aws",
    "amazonwebservices": "aws",

    # Docker variations
    "docker container": "docker",
    "docker engine": "docker",
    "dockerhub": "docker",

    # Kubernetes variations
    "kubernetes": "kubernetes",
    "k8s": "kubernetes",
    "kube": "kubernetes",

    # SQL variations
    "sql database": "sql",
    "mysql": "mysql",
    "postgresql": "postgresql",
    "postgres": "postgresql",
    "pg": "postgresql",

    # MongoDB variations
    "mongo db": "mongodb",
    "mongo": "mongodb",
    "mongod": "mongodb",

    # Machine Learning variations
    "machinelearning": "machine learning",
    "ml": "machine learning",
    "ai/ml": "machine learning",
    "ai": "machine learning",

    # Data Science variations
    "datascience": "data science",
    "ds": "data science",
    "data-science": "data science",

    # Git variations
    "github": "git",
    "gitlab": "git",
    "bitbucket": "git",

    # Frontend frameworks
    "vuejs": "vue",
    "vue.js": "vue",
    "angularjs": "angular",
    "angular2": "angular",
    "nextjs": "next.js",
    "next": "next.js",
}

# Blacklist - skills to completely exclude
BLACKLIST = {
    # Soft skills
    "communication", "team player", "problem solving", "critical thinking",
    "leadership", "teamwork", "collaboration", "time management",
    "adaptability", "creativity", "interpersonal skills", "work ethic",
    "strong communication", "excellent communication", "written communication",
    "verbal communication", "presentation skills", "public speaking",

    # Generic terms
    "experience", "knowledge", "skills", "ability", "proficiency",
    "familiarity", "understanding", "expertise", "competency",
    "background", "track record", "proven experience",

    # Vague terms
    "hardworking", "dedicated", "motivated", "passionate", "enthusiastic",
    "self-starter", "quick learner", "detail oriented", "results driven",
    "goal oriented", "self motivated", "highly motivated",

    # Non-technical
    "degree", "bachelor", "master", "phd", "certification", "diploma",
    "english", "writing", "negotiation", "management", "administration",

    # Business terms
    "business acumen", "strategic thinking", "decision making",
    "analytical skills", "organizational skills", "multitasking",
}

# Category mapping for skill grouping with weights
CATEGORY_MAP = {
    "frontend": {
        "skills": ["react", "angular", "vue", "javascript", "typescript", "html", "css", "next.js", "redux", "tailwind", "sass", "less", "webpack", "babel"],
        "weight": 1.0
    },
    "backend": {
        "skills": ["python", "java", "node.js", "django", "flask", "spring", "go", "rust", "php", "ruby", "c#", ".net", "fastapi", "express"],
        "weight": 1.0
    },
    "cloud_devops": {
        "skills": ["aws", "azure", "gcp", "docker", "kubernetes", "jenkins", "terraform", "ci/cd", "devops", "ansible", "prometheus", "grafana"],
        "weight": 1.2
    },
    "data_ai": {
        "skills": ["machine learning", "data science", "tensorflow", "pytorch", "pandas", "numpy", "big data", "spark", "hadoop", "airflow", "scikit-learn"],
        "weight": 1.3
    },
    "mobile": {
        "skills": ["ios", "android", "swift", "kotlin", "react native", "flutter", "ionic", "xamarin"],
        "weight": 1.0
    },
    "security": {
        "skills": ["cybersecurity", "penetration testing", "security", "encryption", "oauth", "jwt", "firewall", "vulnerability", "cryptography"],
        "weight": 1.1
    },
    "database": {
        "skills": ["mysql", "postgresql", "mongodb", "redis", "elasticsearch", "cassandra", "oracle", "sqlite", "dynamodb"],
        "weight": 1.0
    },
    "testing": {
        "skills": ["jest", "pytest", "junit", "selenium", "cypress", "unit testing", "integration testing", "e2e", "test automation"],
        "weight": 0.9
    },
    "version_control": {
        "skills": ["git", "github", "gitlab", "bitbucket", "svn"],
        "weight": 0.8
    },
    "project_management": {
        "skills": ["agile", "scrum", "jira", "confluence", "trello", "kanban", "waterfall"],
        "weight": 0.7
    },
}

# AI Skill Extraction (Groq Integration)
try:
    from groq import Groq
    GROQ_AVAILABLE = True
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    if GROQ_API_KEY:
        groq_client = Groq(api_key=GROQ_API_KEY)
    else:
        groq_client = None
        logger.warning("GROQ_API_KEY not set. AI skill extraction disabled.")
except ImportError:
    GROQ_AVAILABLE = False
    groq_client = None
    logger.warning(
        "Groq library not installed. Install with: pip install groq")


def normalize_skill(skill: str) -> str:
    """Normalize skill name to standard form"""
    if not skill:
        return ""

    skill_lower = skill.lower().strip()

    # Check normalization map first
    if skill_lower in NORMALIZATION_MAP:
        return NORMALIZATION_MAP[skill_lower]

    # Remove special characters and extra spaces
    skill_cleaned = re.sub(r'[^\w\s-]', '', skill_lower)
    skill_cleaned = re.sub(r'\s+', ' ', skill_cleaned).strip()

    return skill_cleaned


def is_valid_skill(skill: str) -> bool:
    """Check if skill is valid (not blacklisted, minimum length)"""
    if not skill or len(skill) < 2:
        return False

    skill_lower = skill.lower()

    # Check blacklist
    if skill_lower in BLACKLIST:
        return False

    # Check if skill is too generic
    generic_terms = ["front", "back", "full", "stack",
                     "web", "app", "api", "rest", "soap", "tech"]
    if skill_lower in generic_terms:
        return False

    return True


def clean_skills(skills: List[str]) -> List[str]:
    """
    Clean and normalize a list of skills
    - Remove duplicates
    - Normalize variations
    - Filter blacklisted terms
    - Return unique, cleaned skills
    """
    if not skills:
        return []

    cleaned_set = set()

    for skill in skills:
        if not skill:
            continue

        normalized = normalize_skill(skill)

        if is_valid_skill(normalized):
            cleaned_set.add(normalized)

    return sorted(list(cleaned_set))


def get_skill_category(skill: str) -> tuple:
    """Get the category and weight of a skill"""
    skill_lower = skill.lower()

    for category, data in CATEGORY_MAP.items():
        if skill_lower in data["skills"]:
            return category, data["weight"]

    return "other", 0.5


def group_skills_by_category(skills: List[str]) -> Dict[str, List[str]]:
    """Group skills into categories"""
    grouped = {}

    for skill in skills:
        category, _ = get_skill_category(skill)
        if category not in grouped:
            grouped[category] = []
        grouped[category].append(skill)

    return grouped


def calculate_skill_confidence(skill: str, frequency: int, total_jobs: int, trend_score: int = 0) -> float:
    """
    Calculate confidence score for a skill based on:
    - Frequency in job postings
    - Trend (growth rate)
    - Category weight
    """
    frequency_score = min(frequency / (total_jobs / 10), 100)
    trend_boost = trend_score / 100 if trend_score else 0
    _, weight = get_skill_category(skill)

    confidence = (frequency_score * 0.6) + \
        (trend_boost * 100 * 0.3) + (weight * 10)
    return min(confidence, 100)


def extract_skills_from_text(text: str, skill_dict: List[str] = None) -> List[str]:
    """
    Extract skills from text using pattern matching
    """
    if not text:
        return []

    text_lower = text.lower()
    found_skills = set()

    # Dynamic skill dictionary (combine built-in with DB skills if available)
    builtin_skills = list(CATEGORY_MAP.keys())
    for category_data in CATEGORY_MAP.values():
        builtin_skills.extend(category_data["skills"])

    skills_to_use = skill_dict if skill_dict else builtin_skills

    for skill in skills_to_use:
        skill_lower = skill.lower()

        # Check for exact word boundary matches
        pattern = r'\b' + re.escape(skill_lower) + r'\b'
        if re.search(pattern, text_lower):
            found_skills.add(skill_lower)
        # Check for hyphenated versions
        elif '-' in skill_lower and skill_lower.replace('-', ' ') in text_lower:
            found_skills.add(skill_lower)
        # Check for plural forms
        elif skill_lower + 's' in text_lower:
            found_skills.add(skill_lower)

    return list(found_skills)


def enhance_skills_with_ai(text: str, max_retries: int = 2) -> List[str]:
    """
    Enhance skill extraction using Groq AI
    Returns list of extracted skills
    """
    if not GROQ_AVAILABLE or not groq_client:
        logger.warning("AI skill extraction not available")
        return []

    if not text or len(text) < 50:
        return []

    prompt = f"""
    Extract ONLY technical skills from this job description.
    
    Rules:
    - Return ONLY a JSON array of strings
    - No explanations, no markdown
    - Only technical skills (programming languages, frameworks, tools, databases)
    - Exclude soft skills (communication, leadership, etc.)
    - Use lowercase
    - Keep skills simple (e.g., "react", not "React.js")
    
    Job Description:
    {text[:3000]}
    
    Return format: ["skill1", "skill2", "skill3"]
    """

    for attempt in range(max_retries):
        try:
            response = groq_client.chat.completions.create(
                model="llama3-70b-8192",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                max_tokens=500
            )

            result = response.choices[0].message.content.strip()

            # Extract JSON from response
            import json
            import re

            json_match = re.search(r'\[.*\]', result, re.DOTALL)
            if json_match:
                skills = json.loads(json_match.group())
                if isinstance(skills, list):
                    return skills

            return []

        except Exception as e:
            logger.error(
                f"AI skill extraction attempt {attempt + 1} failed: {e}")
            if attempt == max_retries - 1:
                return []

    return []


def hybrid_skill_extraction(text: str, use_ai_fallback: bool = True) -> Dict[str, any]:
    """
    Hybrid approach: rule-based extraction with optional AI fallback
    Returns dict with skills and confidence scores
    """
    result = {
        "skills": [],
        "method": "rule_based",
        "confidence": 0.0
    }

    # First try rule-based extraction
    extracted_skills = extract_skills_from_text(text)
    cleaned = clean_skills(extracted_skills)

    if len(cleaned) >= 3:
        result["skills"] = cleaned
        result["confidence"] = min(len(cleaned) / 10, 1.0)
        return result

    # If we got very few skills and AI fallback is enabled, try AI
    if use_ai_fallback:
        ai_skills = enhance_skills_with_ai(text)
        if ai_skills:
            all_skills = list(set(cleaned + clean_skills(ai_skills)))
            result["skills"] = all_skills
            result["method"] = "hybrid"
            result["confidence"] = min(len(all_skills) / 10, 1.0)
            return result

    result["skills"] = cleaned
    return result


def calculate_trend_score(skill: str, historical_counts: Dict[str, List[int]]) -> int:
    """
    Calculate trend score based on historical data
    Returns score from -100 to 100 (negative = declining, positive = growing)
    """
    if skill not in historical_counts:
        return 0

    counts = historical_counts[skill]
    if len(counts) < 2:
        return 0

    recent_avg = sum(counts[-7:]) / min(7, len(counts))
    older_avg = sum(counts[:-7]) / max(1, len(counts) - 7)

    if older_avg == 0:
        return 100 if recent_avg > 0 else 0

    percent_change = ((recent_avg - older_avg) / older_avg) * 100
    return max(min(percent_change, 100), -100)
