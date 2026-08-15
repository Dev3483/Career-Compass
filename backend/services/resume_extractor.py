# services/resume_extractor.py - FIXED VERSION
import re
import logging
import os
from datetime import datetime
from typing import List, Dict

logger = logging.getLogger(__name__)


class ResumeTextExtractor:
    """Extract text and parse sections from resume"""

    def __init__(self):
        self.section_patterns = {
            "summary": r'(?:summary|objective|profile|about me)[:\s]*(.*?)(?=\n\s*(?:experience|work|education|skills|projects|$))',
            "experience": r'(?:experience|work experience|employment|work history)[:\s]*(.*?)(?=\n\s*(?:education|skills|projects|certifications|$))',
            "education": r'(?:education|academic|qualifications|degrees)[:\s]*(.*?)(?=\n\s*(?:skills|projects|certifications|experience|$))',
            "skills": r'(?:skills|technical skills|competencies|expertise)[:\s]*(.*?)(?=\n\s*(?:experience|education|projects|certifications|$))',
            "projects": r'(?:projects|personal projects|project experience)[:\s]*(.*?)(?=\n\s*(?:experience|education|skills|certifications|$))',
            "certifications": r'(?:certifications|certificates|courses|training)[:\s]*(.*?)(?=\n\s*(?:experience|education|skills|projects|$))'
        }

        self.date_pattern = r'((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s?\d{4})\s*[-–—]\s*(Present|Current|Now|\d{4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s?\d{4})'
        self.simple_date_pattern = r'(\d{4})\s*[-–—]\s*(Present|Current|Now|\d{4})'

        self.degree_patterns = [
            r'(bachelor|master|ph\.?d|doctorate|diploma|associate)(\'s)?\s+(of|in)?\s+([^,\n]+)',
            r'(b\.?s\.?|b\.?a\.?|m\.?s\.?|m\.?a\.?|mba|ph\.?d)\s+(in\s+)?([^,\n]+)',
            r'(btech|b\.tech|mtech|m\.tech|be|b\.e|me|m\.e)'
        ]

    def extract_text(self, file_path: str, filename: str) -> str:
        """Extract text from resume file"""
        text = ""
        try:
            if filename.lower().endswith('.pdf'):
                import fitz  # PyMuPDF
                doc = fitz.open(file_path)
                for page in doc:
                    text += page.get_text() + "\n"
                doc.close()

            elif filename.lower().endswith('.docx'):
                import docx
                doc = docx.Document(file_path)
                for paragraph in doc.paragraphs:
                    text += paragraph.text + "\n"

            elif filename.lower().endswith('.txt'):
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as file:
                    text = file.read()

            # Clean text
            text = re.sub(r'[^\x00-\x7F]+', ' ', text)
            text = re.sub(r'[ \t]+', ' ', text)
            text = re.sub(r'\n\s*\n\s*\n+', '\n\n', text)

        except Exception as e:
            logger.error(f"Text extraction error: {e}")
            raise

        return text

    def parse_sections(self, text: str) -> Dict[str, str]:
        """Parse resume into sections"""
        sections = {
            "summary": "",
            "experience": "",
            "education": "",
            "skills": "",
            "projects": "",
            "certifications": "",
            "other": ""
        }

        for section, pattern in self.section_patterns.items():
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if match:
                sections[section] = match.group(1).strip()

        return sections

    def extract_contact(self, text: str) -> Dict[str, str]:
        """Extract contact information"""
        contact = {}

        email_match = re.search(
            r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text)
        if email_match:
            contact["email"] = email_match.group(0)

        phone_match = re.search(
            r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', text)
        if phone_match:
            contact["phone"] = phone_match.group(0)

        linkedin_match = re.search(
            r'(linkedin\.com/in/|linkedin\.com/profile/view\?id=)[A-Za-z0-9_-]+', text, re.IGNORECASE)
        if linkedin_match:
            contact["linkedin"] = linkedin_match.group(0)

        github_match = re.search(
            r'github\.com/([A-Za-z0-9_-]+)', text, re.IGNORECASE)
        if github_match:
            contact["github"] = github_match.group(0)

        return contact

    def extract_experience(self, sections: Dict) -> List[Dict]:
        """Extract work experience with achievements"""
        experiences = []
        exp_text = sections.get("experience", "")

        if not exp_text:
            return experiences

        lines = exp_text.split('\n')
        current_exp = {}

        for line in lines:
            line = line.strip()
            if not line:
                continue

            date_match = re.search(self.date_pattern, line, re.IGNORECASE)
            if not date_match:
                date_match = re.search(
                    self.simple_date_pattern, line, re.IGNORECASE)

            if date_match:
                if current_exp:
                    experiences.append(current_exp)
                current_exp = {
                    "duration": line,
                    "title": "",
                    "company": "",
                    "start_date": date_match.group(1).strip(),
                    "end_date": date_match.group(2).strip(),
                    "achievements": [],
                    "technologies": []
                }
            elif " at " in line.lower() or " @ " in line.lower():
                parts = re.split(r'\s+at\s+|\s+@\s+',
                                 line, flags=re.IGNORECASE)
                if len(parts) > 1 and current_exp:
                    current_exp["title"] = parts[0].strip()
                    current_exp["company"] = parts[1].strip()
            elif not current_exp:
                current_exp = {"title": line, "company": "", "duration": ""}
            else:
                if "description" not in current_exp:
                    current_exp["description"] = []
                current_exp["description"].append(line)

                metrics = self._extract_metrics(line)
                if metrics:
                    if "achievements" not in current_exp:
                        current_exp["achievements"] = []
                    current_exp["achievements"].extend(metrics)

        if current_exp:
            experiences.append(current_exp)

        return experiences

    def extract_education(self, sections: Dict) -> List[Dict]:
        """Extract education information"""
        education = []
        edu_text = sections.get("education", "")

        if not edu_text:
            return education

        lines = edu_text.split('\n')
        current_edu = {}

        for line in lines:
            line = line.strip()
            if not line:
                continue

            for pattern in self.degree_patterns:
                if re.search(pattern, line, re.IGNORECASE):
                    if current_edu:
                        education.append(current_edu)
                    current_edu = {"degree": line,
                                   "institution": "", "year": ""}
                    break

            year_match = re.search(r'\b(19|20)\d{2}\b', line)
            if year_match and current_edu:
                current_edu["year"] = year_match.group(0)
            elif any(word in line.lower() for word in ["university", "college", "institute", "school"]):
                if current_edu:
                    current_edu["institution"] = line
                else:
                    current_edu = {"degree": "",
                                   "institution": line, "year": ""}

        if current_edu:
            education.append(current_edu)

        return education

    def extract_projects(self, sections: Dict) -> List[Dict]:
        """Extract projects with technologies"""
        projects = []
        projects_text = sections.get("projects", "")

        if not projects_text:
            return projects

        lines = projects_text.split('\n')
        current_project = {}

        for line in lines:
            line = line.strip()
            if not line:
                continue

            if (line.isupper() or line.endswith(':') or
                    (len(line.split()) < 8 and re.match(r'^[A-Z][a-z]+', line))):
                if current_project:
                    projects.append(current_project)
                current_project = {
                    "title": line.rstrip(':'),
                    "description": [],
                    "technologies": [],
                    "outcomes": []
                }
            else:
                if current_project:
                    if "description" not in current_project:
                        current_project["description"] = []
                    current_project["description"].append(line)

                    techs = self._extract_technologies(line)
                    if techs:
                        current_project["technologies"].extend(techs)

                    outcomes = self._extract_metrics(line)
                    if outcomes:
                        current_project["outcomes"].extend(outcomes)

        if current_project:
            projects.append(current_project)

        return projects

    def extract_achievements(self, text: str) -> List[str]:
        """
        Extract achievements and metrics from text.
        NOTE: spaCy removed — uses regex-only approach for reliability.
        """
        achievements = []

        achievement_keywords = [
            "achieved", "increased", "decreased", "improved", "reduced",
            "saved", "generated", "led", "managed", "created", "developed",
            "implemented", "launched", "grew", "exceeded", "awarded",
            "promoted", "optimized", "accelerated", "pioneered", "delivered",
            "drove", "spearheaded", "established", "designed", "built"
        ]

        # Split into sentences by period or newline
        sentences = re.split(r'(?<=[.!?])\s+|\n', text[:5000])

        seen = set()
        for sent in sentences:
            sent = sent.strip()
            if not sent or len(sent.split()) > 30 or len(sent) < 10:
                continue

            sent_lower = sent.lower()
            has_keyword = any(kw in sent_lower for kw in achievement_keywords)
            has_metric = bool(re.search(
                r'\d+%|\d+\s*(?:x|times)|\d+\s*(?:million|thousand|k\b)', sent, re.IGNORECASE))

            if has_keyword or has_metric:
                if sent not in seen and len(sent) < 200:
                    seen.add(sent)
                    achievements.append(sent)

            if len(achievements) >= 20:
                break

        return achievements[:20]

    def _extract_metrics(self, text: str) -> List[str]:
        """Extract numeric metrics from text"""
        metrics = []
        percentages = re.findall(r'\b\d+(?:\.\d+)?%', text)
        metrics.extend(percentages)

        number_patterns = [
            r'\b\d+\s*(?:users|customers|clients|revenue|sales|people)\b',
            r'\b\d+\s*(?:x|times)\s*(?:faster|better|improvement|increase|decrease)\b',
            r'\b\d+\s*(?:hours|days|weeks|months|years)\b',
            r'\b\d+\s*(?:million|billion|thousand|k)\b'
        ]
        for pattern in number_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            metrics.extend(matches)

        return metrics

    def _extract_technologies(self, text: str) -> List[str]:
        """Extract technologies from text"""
        technologies = set()
        tech_pattern = re.compile(
            r'[A-Za-z0-9\+\#\.]+(?:\s*\|\s*[A-Za-z0-9\+\#\.]+)+')

        for match in tech_pattern.findall(text):
            for tech in match.split('|'):
                tech = tech.strip()
                if len(tech) > 1 and not tech.isdigit():
                    technologies.add(tech)

        for line in text.split('\n'):
            if ':' in line and any(t in line.lower() for t in ['technologies', 'tech stack', 'tools']):
                after_colon = line.split(':', 1)[1].strip()
                if ',' in after_colon:
                    for tech in after_colon.split(','):
                        tech = tech.strip()
                        if len(tech) > 1 and not tech.isdigit():
                            technologies.add(tech)

        return list(technologies)

    def calculate_experience_years(self, experience: List[Dict]) -> int:
        """Calculate total years of experience"""
        total_years = 0
        current_year = datetime.now().year

        for exp in experience:
            start_date = exp.get("start_date", "")
            end_date = exp.get("end_date", "")

            if start_date:
                start_year_match = re.search(r'(\d{4})', start_date)
                if start_year_match:
                    start_year = int(start_year_match.group(1))

                    if end_date and end_date.lower() not in ['present', 'current', 'now']:
                        end_year_match = re.search(r'(\d{4})', end_date)
                        end_year = int(end_year_match.group(
                            1)) if end_year_match else current_year
                    else:
                        end_year = current_year

                    total_years += max(0, end_year - start_year)

        return max(1, total_years) if total_years > 0 else len(experience) * 2

    def format_education_string(self, education: List[Dict]) -> str:
        """Format education as a readable string"""
        if not education:
            return "Education information not specified"

        top_edu = education[0]
        degree = top_edu.get("degree", "")
        institution = top_edu.get("institution", "")

        if degree and institution:
            return f"{degree} from {institution}"
        elif degree:
            return degree
        elif institution:
            return f"Studied at {institution}"
        else:
            return "Education information available"
