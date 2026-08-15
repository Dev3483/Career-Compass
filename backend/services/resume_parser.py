# services/resume_parser.py - FIXED VERSION
import re
import logging
from typing import List, Dict

from cv2 import line
from matplotlib import text

logger = logging.getLogger(__name__)


class ResumeSkillExtractor:
    """Simple and reliable skill extractor"""

    def __init__(self):
        # Common tech skills for extraction
        self.common_skills = {
            # Languages
            "python", "java", "javascript", "typescript", "c++", "c#", "c",
            "ruby", "php", "swift", "kotlin", "go", "rust", "scala", "r",
            "matlab", "html", "css", "shell", "bash", "sql", "dart",

            # Frameworks
            "react", "angular", "vue", "node.js", "django", "flask", "spring",
            "express", "next.js", "nuxt.js", "fastapi", "rails", "laravel",
            "streamlit", "mern",

            # AI/ML
            "tensorflow", "pytorch", "keras", "scikit-learn", "pandas",
            "numpy", "matplotlib", "seaborn", "nltk", "spacy", "huggingface",

            # CSS
            "tailwind", "tailwindcss", "bootstrap", "shadcn",

            # Cloud & DevOps
            "aws", "azure", "gcp", "docker", "kubernetes", "terraform",
            "vercel", "netlify", "render", "heroku", "linux", "nginx",

            # Databases
            "mysql", "postgresql", "mongodb", "redis", "firebase",
            "supabase", "sqlite", "dynamodb", "neo4j",

            # Tools
            "git", "github", "gitlab", "figma", "jira", "postman",

            # Concepts
            "machine learning", "deep learning", "data science",
            "natural language processing", "nlp", "computer vision",
            "data analysis", "data visualization", "rest api",
            "microservices", "ci/cd", "agile", "scrum",
        }

        # Alias map: normalize variants to canonical name
        self.aliases = {
            "react.js": "React",
            "reactjs": "React",
            "node.js": "Node.js",
            "nodejs": "Node.js",
            "next.js": "Next.js",
            "nextjs": "Next.js",
            "tailwindcss": "Tailwind CSS",
            "tailwind css": "Tailwind CSS",
            "tailwind": "Tailwind CSS",
            "scikit-learn": "Scikit-learn",
            "sklearn": "Scikit-learn",
            "sci-kit learn": "Scikit-learn",
            "shadcn ui": "Shadcn UI",
            "shadcn": "Shadcn UI",
            "c++": "C++",
            "c#": "C#",
            "javascript": "JavaScript",
            "typescript": "TypeScript",
            "postgresql": "PostgreSQL",
            "mongodb": "MongoDB",
            "mysql": "MySQL",
            "firebase": "Firebase",
            "supabase": "Supabase",
            "groq api": "Groq API",
            "twilio": "Twilio",
            "twilio api": "Twilio",
            "gridsearchcv": "GridSearchCV",
            "nltk": "NLTK",
            "numpy": "NumPy",
            "pandas": "Pandas",
            "matplotlib": "Matplotlib",
            "seaborn": "Seaborn",
            "streamlit": "Streamlit",
            "vercel": "Vercel",
            "netlify": "Netlify",
            "render": "Render",
            "figma": "Figma",
            "flask": "Flask",
            "python": "Python",
            "html": "HTML",
            "css": "CSS",
            "sql": "SQL",
            "git": "Git",
            "github": "GitHub",
            "mern": "MERN Stack",
        }

        # For case-insensitive matching
        self.common_skills_lower = {s.lower() for s in self.common_skills}
        self.common_skills_lower.update(self.aliases.keys())
        # Tech patterns (pipe-separated lists like "React | Angular | Vue")
        self.tech_pattern = re.compile(
            r'[A-Za-z0-9\+\#\.]+(?:\s*\|\s*[A-Za-z0-9\+\#\.]+)+')

        # Try to load ESCO skills CSV if available (optional enhancement)
        self._load_esco_skills()

        logger.info("✅ Skill extractor initialized")

    def _load_esco_skills(self):
        """Optionally load ESCO skills CSV to extend the skill list"""
        import os
        possible_paths = [
            os.path.join(os.path.dirname(os.path.dirname(
                os.path.abspath(__file__))), 'datasets', 'skills.csv'),
            os.path.join(os.path.dirname(os.path.abspath(__file__)),
                         '..', 'datasets', 'skills.csv'),
        ]

        for csv_path in possible_paths:
            if os.path.exists(csv_path):
                try:
                    import csv
                    logger.info(f"Found skills CSV at: {csv_path}")
                    with open(csv_path, newline='', encoding='utf-8') as f:
                        reader = csv.DictReader(f)
                        for row in reader:
                            # Try common column names
                            skill = (
                                row.get('preferredLabel') or
                                row.get('skill') or
                                row.get('name') or
                                row.get('label') or
                                ''
                            ).strip().lower()
                            if skill and len(skill) > 1:
                                self.common_skills.add(skill)
                                self.common_skills_lower.add(skill)
                    logger.info(
                        f"✅ Loaded ESCO skills from CSV. Total skills: {len(self.common_skills)}")
                    return
                except Exception as e:
                    logger.warning(f"Could not load ESCO skills CSV: {e}")
                    return

        logger.info("No ESCO skills CSV found — using built-in skill list only")

    def _normalize(self, raw: str) -> str:
        """Return canonical display name for a skill token"""
        key = raw.lower().strip()
        return self.aliases.get(key, raw.title())


    def extract_skills(self, text: str, sections: Dict = None) -> List[str]:
        skills = set()
        combined_text = text.lower()

        if sections:
            for v in sections.values():
                if v:
                    combined_text += " " + v.lower()

    # Method 1: Match aliases first (handles react.js, tailwindcss etc.)
        for alias_key, canonical in self.aliases.items():
            if alias_key in     combined_text:
                skills.add(canonical)

    # Method 2: Match known skills
        for skill in self.common_skills:
            if skill.lower() in combined_text:
                skills.add(self._normalize(skill))

    # Method 3: Pipe-separated tech lists
        tech_pattern = re.compile(
        r'[A-Za-z0-9\+\#\.\-]+(?:\s*[\|,]\s*[A-Za-z0-9\+\#\.\-]+)+')
        for match in tech_pattern.findall(text):
            for sep in ['|', ',']:
                if sep in match:
                    for tech in match.split(sep):
                        tech = tech.strip()
                        key = tech.lower()
                        if key in self.aliases:
                            skills.add(self.aliases[key])
                        elif key in self.common_skills_lower:
                            skills.add(self._normalize(tech))

    # Method 4: Skills section line parsing
        for line in text.split('\n'):
            if ':' in line and any(kw in line.lower() for kw in ['languages', 'skills', 'technologies', 'tools', 'frameworks', 'databases']):
                after = line.split(':', 1)[1]
                for token in re.split(r'[,|•\-·]', after):
                    token = token.strip()
                    key = token.lower()
                    if key in self.aliases:
                        skills.add(self.aliases[key])
                    elif key in self.common_skills_lower:
                        skills.add(self._normalize(token))

        return sorted(list(skills))

    def rank_skills(self, skills: List[str]) -> List[str]:
        """Return skills as-is (already unique and sorted)"""
        return skills if skills else []
