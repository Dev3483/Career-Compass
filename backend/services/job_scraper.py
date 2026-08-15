# services/job_scraper.py - With fake job detection
import requests
from bs4 import BeautifulSoup
from typing import List, Dict, Optional
import time
import random
from datetime import datetime
import hashlib
from abc import ABC, abstractmethod
import logging
from dataclasses import dataclass, asdict
import re
import urllib3
from pymongo import MongoClient, ASCENDING
import os

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def calculate_authenticity(job: Dict) -> int:
    """
    Calculate authenticity score for a job posting
    Score range: 0-100
    """
    score = 50
    
    if job.get("url"):
        score += 20
    elif job.get("redirect_url"):
        score += 15
    
    company = job.get("company", "")
    if company and len(company) > 2:
        score += 10
        generic_names = ["tech company", "startup", "company", "ltd", "inc"]
        if company.lower() not in generic_names:
            score += 5
    
    description = job.get("description", "")
    if description and len(description) > 200:
        score += 10
    elif description and len(description) > 100:
        score += 5
    
    trusted_sources = ["RemoteOK", "Remotive", "LinkedIn", "Indeed", "Glassdoor"]
    if job.get("source") in trusted_sources:
        score += 10
    
    if job.get("salary_min") or job.get("salary"):
        score += 5
    
    if job.get("location"):
        score += 5
    
    if job.get("skills") and len(job.get("skills", [])) > 0:
        score += 5
    
    return min(score, 100)


def detect_fake_job(job: Dict) -> Dict:
    """
    Detect fake job postings based on multiple indicators
    Returns: {'fake_score': int, 'is_suspicious': bool, 'flags': list}
    """
    score = 0
    flags = []
    
    # Flag 1: No URL or invalid URL
    if not job.get("url"):
        score += 30
        flags.append("missing_url")
    
    # Flag 2: Too short description (less than 100 chars)
    description = job.get("description", "")
    if len(description) < 100:
        score += 20
        flags.append("short_description")
    
    # Flag 3: Gmail/Yahoo email in description (common in scam jobs)
    if "gmail.com" in description.lower() or "yahoo.com" in description.lower():
        score += 30
        flags.append("personal_email")
    
    # Flag 4: Missing company name
    if not job.get("company") or len(job.get("company", "")) < 2:
        score += 20
        flags.append("missing_company")
    
    # Flag 5: Suspicious keywords (advance fee, wire money, etc.)
    suspicious_keywords = [
        "wire money", "paypal", "western union", "advance fee",
        "deposit required", "investment required", "startup fee",
        "pay to apply", "processing fee", "registration fee"
    ]
    desc_lower = description.lower()
    for keyword in suspicious_keywords:
        if keyword in desc_lower:
            score += 15
            flags.append(f"suspicious_keyword_{keyword.replace(' ', '_')}")
    
    # Flag 6: Too generic title
    generic_titles = ["job", "work from home", "part time job", "online job"]
    title_lower = job.get("title", "").lower()
    if title_lower in generic_titles:
        score += 10
        flags.append("generic_title")
    
    # Flag 7: Unrealistic salary (very high or very low)
    salary = job.get("salary", "")
    if salary:
        try:
            salary_num = int(re.sub(r'[^0-9]', '', str(salary))[:10])
            if salary_num > 500000:  # Suspiciously high
                score += 15
                flags.append("unrealistic_salary_high")
            elif salary_num < 10000 and salary_num > 0:  # Suspiciously low
                score += 10
                flags.append("unrealistic_salary_low")
        except:
            pass
    
    return {
        'fake_score': min(score, 100),
        'is_suspicious': score > 40,
        'flags': flags
    }


@dataclass
class JobPosting:
    """Unified job posting data model"""
    job_id: str
    title: str
    company: str
    location: str
    job_type: str
    skills: List[str]
    source: str
    url: str
    description: str
    salary: Optional[str] = None
    salary_currency: Optional[str] = None
    date_posted: Optional[str] = None
    company_logo: Optional[str] = None
    experience: Optional[str] = None
    scraped_at: Optional[str] = None
    authenticity_score: Optional[int] = None
    is_verified: Optional[bool] = None
    verification_status: Optional[str] = None
    # Fake job detection fields
    fake_score: Optional[int] = None
    is_suspicious: Optional[bool] = None
    fake_flags: Optional[List[str]] = None

    def to_dict(self):
        data = asdict(self)
        for key, value in data.items():
            if isinstance(value, datetime):
                data[key] = value.isoformat()
        return data


class RateLimiter:
    def __init__(self, min_delay=2.0, max_delay=5.0):
        self.min_delay = min_delay
        self.max_delay = max_delay
        self.last_request = 0

    def wait(self):
        elapsed = time.time() - self.last_request
        delay = random.uniform(self.min_delay, self.max_delay)
        if elapsed < delay:
            time.sleep(delay - elapsed)
        self.last_request = time.time()


class RequestManager:
    def __init__(self):
        self.rate_limiter = RateLimiter()
        self.session = requests.Session()
        self.session.verify = False

    def get(self, url, params=None, headers=None):
        self.rate_limiter.wait()
        final_headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
        }
        if headers:
            final_headers.update(headers)
        try:
            response = self.session.get(
                url, params=params, headers=final_headers,
                timeout=20, allow_redirects=True
            )
            if response.status_code == 200:
                return response
            else:
                logger.warning(f"HTTP {response.status_code} for {url}")
                return None
        except Exception as e:
            logger.error(f"Request failed: {e}")
            return None


class BaseScraper(ABC):
    def __init__(self):
        self.request_manager = RequestManager()
        self.name = self.__class__.__name__

    @abstractmethod
    def scrape(self, skills: List[str], location: str, job_type: str, max_jobs: int) -> List[JobPosting]:
        pass

    def _generate_job_id(self, *args) -> str:
        combined = "_".join(str(arg) for arg in args)
        return f"{self.name.lower()}_{hashlib.md5(combined.encode()).hexdigest()[:12]}"

    def _clean_text(self, text: str) -> str:
        if not text:
            return ""
        text = re.sub(r'\s+', ' ', text.strip())
        return ''.join(char for char in text if char.isprintable())

    def _normalize_skills(self, skills: List[str]) -> List[str]:
        return [s.lower().strip() for s in skills if s]

    def _skills_match(self, user_skills: List[str], job_tags: List[str], job_desc: str) -> int:
        user_skills_lower = set(self._normalize_skills(user_skills))
        job_tags_lower = set(self._normalize_skills(job_tags))
        job_desc_lower = job_desc.lower()

        match_count = 0
        for skill in user_skills_lower:
            if skill in job_tags_lower:
                match_count += 1
                continue
            if re.search(r'\b' + re.escape(skill) + r'\b', job_desc_lower):
                match_count += 1
        return match_count

    def _extract_skills_from_description(self, description: str) -> List[str]:
        common_skills = [
            'python', 'java', 'javascript', 'react', 'angular', 'vue', 'node.js',
            'django', 'flask', 'mysql', 'postgresql', 'mongodb', 'aws', 'docker',
            'kubernetes', 'git', 'typescript', 'html', 'css', 'redux', 'next.js',
            'fastapi', 'pandas', 'numpy', 'machine learning', 'sql', 'linux',
            'firebase', 'keras', 'tensorflow', 'data science', 'deep learning',
            'c++', 'matlab', 'r', 'spark', 'hadoop', 'tableau', 'power bi'
        ]
        description_lower = description.lower()
        found_skills = []
        for skill in common_skills:
            if skill in description_lower:
                found_skills.append(skill.title())
        return found_skills[:8]


class RemoteOKScraper(BaseScraper):
    API_URL = "https://remoteok.com/api"

    def scrape(self, skills: List[str], location: str, job_type: str, max_jobs: int = 20) -> List[JobPosting]:
        jobs = []
        try:
            response = self.request_manager.get(self.API_URL)
            if not response or response.status_code != 200:
                logger.warning("[RemoteOK] No response from API")
                return jobs

            data = response.json()
            api_data = data[1:] if isinstance(
                data, list) and len(data) > 1 else []
            logger.info(f"[RemoteOK] Got {len(api_data)} total jobs from API")

            for job_data in api_data:
                if not isinstance(job_data, dict) or len(jobs) >= max_jobs:
                    break

                if skills:
                    job_tags = job_data.get('tags', [])
                    job_desc = job_data.get('description', '')
                    if job_desc:
                        soup = BeautifulSoup(job_desc, 'html.parser')
                        job_desc = soup.get_text()

                    match_count = self._skills_match(
                        skills, job_tags, job_desc)
                    if match_count == 0:
                        continue

                job = self._parse_api_data(job_data)
                if job:
                    jobs.append(job)

        except Exception as e:
            logger.error(f"[RemoteOK] Error: {e}", exc_info=True)

        logger.info(f"[RemoteOK] Returning {len(jobs)} matched jobs")
        return jobs[:max_jobs]

    def _parse_api_data(self, data: Dict) -> Optional[JobPosting]:
        try:
            job_id = str(data.get('id', ''))
            position = data.get('position', 'Software Developer')
            company = data.get('company', 'Tech Company')
            description = data.get('description', '')
            if description:
                soup = BeautifulSoup(description, 'html.parser')
                description = soup.get_text()[:1000]

            skills = data.get('tags', [])
            if not skills and description:
                skills = self._extract_skills_from_description(description)

            job_dict = {
                'job_id': job_id or self._generate_job_id(position, company),
                'title': self._clean_text(position),
                'company': self._clean_text(company),
                'location': "Remote",
                'job_type': "remote",
                'skills': skills[:10],
                'source': "RemoteOK",
                'url': data.get('url', f'https://remoteok.com/remote-jobs/{job_id}'),
                'description': self._clean_text(description) or f"{position} position at {company}.",
                'salary': str(data.get('salary', '')) or None,
                'date_posted': data.get('date', 'Recently'),
                'scraped_at': datetime.now().isoformat()
            }
            
            authenticity_score = calculate_authenticity(job_dict)
            fake_detection = detect_fake_job(job_dict)
            
            return JobPosting(
                **job_dict,
                authenticity_score=authenticity_score,
                is_verified=False,
                verification_status="scraped",
                fake_score=fake_detection['fake_score'],
                is_suspicious=fake_detection['is_suspicious'],
                fake_flags=fake_detection['flags']
            )
        except Exception as e:
            logger.error(f"[RemoteOK] Error parsing job: {e}")
            return None


class RemotiveScraper(BaseScraper):
    API_URL = "https://remotive.com/api/remote-jobs"

    def scrape(self, skills: List[str], location: str, job_type: str, max_jobs: int = 20) -> List[JobPosting]:
        jobs = []
        try:
            response = self.request_manager.get(self.API_URL)
            if not response:
                logger.warning("[Remotive] No response from API")
                return jobs

            data = response.json()
            jobs_data = data.get("jobs", [])
            logger.info(f"[Remotive] Got {len(jobs_data)} total jobs from API")

            for job_data in jobs_data:
                if len(jobs) >= max_jobs:
                    break

                if skills:
                    job_tags = job_data.get("tags", [])
                    job_desc = job_data.get("description", "")
                    if job_desc:
                        soup = BeautifulSoup(job_desc, 'html.parser')
                        job_desc = soup.get_text()
                    job_title = job_data.get("title", "")

                    match_count = self._skills_match(
                        skills, job_tags, job_desc + " " + job_title)
                    if match_count == 0:
                        continue

                job = self._parse_api_data(job_data)
                if job:
                    jobs.append(job)

        except Exception as e:
            logger.error(f"[Remotive] Error: {e}", exc_info=True)

        logger.info(f"[Remotive] Returning {len(jobs)} matched jobs")
        return jobs[:max_jobs]

    def _parse_api_data(self, data: Dict) -> Optional[JobPosting]:
        try:
            job_id = str(data.get("id", ""))
            title = data.get("title", "Remote Developer")
            company = data.get("company_name", "Company")
            description = data.get("description", "")
            if description:
                soup = BeautifulSoup(description, 'html.parser')
                description = soup.get_text()[:1000]

            tags = data.get("tags", [])
            skills = tags[:8] if tags else self._extract_skills_from_description(
                description)

            job_dict = {
                'job_id': job_id or self._generate_job_id(title, company),
                'title': self._clean_text(title),
                'company': self._clean_text(company),
                'location': data.get("candidate_required_location", "Remote"),
                'job_type': "remote",
                'skills': list(set(skills))[:10],
                'source': "Remotive",
                'url': data.get("url", f"https://remotive.com/remote-jobs/{job_id}"),
                'description': self._clean_text(description) or f"{title} position at {company}.",
                'salary': data.get("salary") or None,
                'date_posted': data.get("publication_date", "Recently"),
                'scraped_at': datetime.now().isoformat()
            }
            
            authenticity_score = calculate_authenticity(job_dict)
            fake_detection = detect_fake_job(job_dict)
            
            return JobPosting(
                **job_dict,
                authenticity_score=authenticity_score,
                is_verified=False,
                verification_status="scraped",
                fake_score=fake_detection['fake_score'],
                is_suspicious=fake_detection['is_suspicious'],
                fake_flags=fake_detection['flags']
            )
        except Exception as e:
            logger.error(f"[Remotive] Error parsing job: {e}")
            return None


class RealisticJobScraper:
    def __init__(self, mode="api_only", enable_db=False, db_instance=None):
        self.mode = mode
        self.scrapers = [RemoteOKScraper(), RemotiveScraper()]
        self.scraper_stats = {}
        self.enable_db = enable_db
        self.db = db_instance

        if self.enable_db and not self.db:
            logger.warning(
                "Database integration enabled but no db instance provided")
            self.enable_db = False

        logger.info(
            f"Initialized RealisticJobScraper with scrapers: {[s.__class__.__name__ for s in self.scrapers]}")

    def scrape_jobs_and_store_matches(
        self,
        skills: List[str],
        user_id: str,
        location: str = "India",
        job_type: str = "remote",
        max_jobs: int = 40
    ) -> List[Dict]:
        """
        Scrape jobs and store them directly in job_matches for a specific user
        """
        normalized_skills = [s.strip() for s in skills if s.strip()]
        if not normalized_skills:
            normalized_skills = ["software developer", "python"]

        logger.info(
            f"Scraping jobs for user {user_id} with skills: {normalized_skills[:8]}")

        all_jobs = []
        storage_stats = {'stored': 0, 'failed': 0}

        for scraper in self.scrapers:
            scraper_name = scraper.__class__.__name__
            try:
                jobs = scraper.scrape(
                    normalized_skills, location, job_type, min(25, max_jobs))
                count = len(jobs)
                job_dicts = [job.to_dict() for job in jobs]
                all_jobs.extend(job_dicts)
                self.scraper_stats[scraper_name] = {
                    'count': count, 'status': 'success' if count else 'no_jobs'}
                logger.info(f"{scraper_name}: {count} jobs matched")

                if job_dicts and self.enable_db and self.db:
                    stored = self._store_jobs_in_job_matches(
                        job_dicts, user_id)
                    storage_stats['stored'] += stored
                    storage_stats['failed'] += len(job_dicts) - stored

            except Exception as e:
                logger.error(f"{scraper_name} failed: {e}", exc_info=True)
                self.scraper_stats[scraper_name] = {
                    'count': 0, 'status': 'error'}

        unique_jobs = self._deduplicate_jobs(all_jobs)
        logger.info(f"Total unique jobs after dedup: {len(unique_jobs)}")
        logger.info(
            f"Storage stats: {storage_stats['stored']} stored, {storage_stats['failed']} failed")

        return unique_jobs[:max_jobs]

    def _store_jobs_in_job_matches(self, jobs: List[Dict], user_id: str) -> int:
        """Store scraped jobs directly in job_matches collection"""
        stored_count = 0

        for job in jobs:
            try:
                match_doc = {
                    'job_id': job.get('job_id'),
                    'title': job.get('title'),
                    'company': job.get('company'),
                    'location': job.get('location'),
                    'job_type': job.get('job_type', 'remote'),
                    'skills': job.get('skills', []),
                    'source': job.get('source'),
                    'url': job.get('url'),
                    'description': job.get('description', '')[:1000],
                    'salary': job.get('salary'),
                    'salary_currency': job.get('salary_currency'),
                    'date_posted': job.get('date_posted'),
                    'company_logo': job.get('company_logo'),
                    'experience': job.get('experience'),
                    'scraped_at': job.get('scraped_at', datetime.now().isoformat()),
                    'matched_at': datetime.now().isoformat(),
                    'user_id': user_id,
                    'is_scraped': True,
                    'combined_score': job.get('match_score', 0),
                    'skill_match_percentage': job.get('skill_match_percentage', 0),
                    'missing_skills': job.get('missing_skills', []),
                    'authenticity_score': job.get('authenticity_score', 50),
                    'is_verified': job.get('is_verified', False),
                    'verification_status': job.get('verification_status', 'scraped'),
                    # Fake job detection fields
                    'fake_score': job.get('fake_score', 0),
                    'is_suspicious': job.get('is_suspicious', False),
                    'fake_flags': job.get('fake_flags', [])
                }
                match_doc = {k: v for k, v in match_doc.items()
                             if v is not None}

                if self.db and hasattr(self.db, 'save_job_match_direct'):
                    self.db.save_job_match_direct(
                        user_id, job.get('job_id'), match_doc)
                    stored_count += 1

            except Exception as e:
                logger.error(
                    f"Error storing job match for {job.get('job_id')}: {e}")

        return stored_count

    def _deduplicate_jobs(self, jobs: List[Dict]) -> List[Dict]:
        seen = set()
        unique = []
        for job in jobs:
            key = f"{job.get('title','').lower().strip()}_{job.get('company','').lower().strip()}"
            if key not in seen:
                seen.add(key)
                unique.append(job)
        return unique

    def get_stats(self) -> Dict:
        stats = {
            'mode': self.mode,
            'total_scrapers': len(self.scrapers),
            'scrapers': self.scraper_stats,
            'database_enabled': self.enable_db
        }
        return stats