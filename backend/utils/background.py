# utils/background.py - Fixed version
import threading
import queue
import logging
from datetime import datetime
from utils.job_refresh_scheduler import JobRefreshScheduler

logger = logging.getLogger(__name__)


class BackgroundJobManager:
    """Manages background job processing"""

    def __init__(self, db, job_scraper, job_matcher):
        self.db = db
        self.job_scraper = job_scraper
        self.job_matcher = job_matcher
        self.job_queue = queue.Queue()
        self.processing_threads = []
        self.job_results_cache = {}

        # Initialize refresh scheduler
        self.refresh_scheduler = JobRefreshScheduler(db, job_scraper)

    def start_workers(self, num_workers=2):
        """Start background worker threads"""
        logger.info(f"🚀 Starting {num_workers} background worker threads...")

        for i in range(num_workers):
            thread = threading.Thread(
                target=self._background_job_matcher,
                daemon=True,
                name=f"JobMatcher-{i+1}"
            )
            thread.start()
            self.processing_threads.append(thread)
            logger.info(f"✅ Started worker thread {i+1}")

        # Start the 24-hour refresh scheduler
        try:
            self.refresh_scheduler.start_scheduler(interval_hours=24)
            logger.info("✅ 24-hour job refresh scheduler started")
        except Exception as e:
            logger.error(f"❌ Failed to start refresh scheduler: {e}")

    def _background_job_matcher(self):
        """Background worker for job matching"""
        logger.info("🔧 Background job matcher thread started")

        while True:
            user_id = None
            try:
                user_id = self.job_queue.get(timeout=300)
                logger.info(f"📝 Processing jobs for user: {user_id}")

                self.job_results_cache[user_id] = {
                    "status": "processing",
                    "jobs": [],
                    "started_at": datetime.now().isoformat()
                }

                user = self.db.get_user(user_id)
                if not user:
                    logger.warning(f"⚠️ User {user_id} not found")
                    self.job_results_cache[user_id] = {
                        "status": "error", "error": "User not found", "jobs": []
                    }
                    self.job_queue.task_done()
                    continue

                skills = user.get("skills", [])
                if not skills:
                    logger.warning(f"⚠️ No skills found for user {user_id}")
                    self.job_results_cache[user_id] = {
                        "status": "error", "error": "No skills found", "jobs": []
                    }
                    self.job_queue.task_done()
                    continue

                logger.info(f"🔍 Searching jobs for skills: {skills[:5]}")

                try:
                    # Scrape fresh jobs and store in job_matches
                    jobs = self.job_scraper.scrape_jobs_and_store_matches(
                        skills=skills,
                        user_id=user_id,
                        location=user.get('location', 'India'),
                        job_type=user.get('preferred_job_type', 'remote'),
                        max_jobs=100
                    )
                    logger.info(f"✅ Found {len(jobs)} jobs for user {user_id}")

                    if not jobs:
                        self.job_results_cache[user_id] = {
                            "status": "completed", "jobs": [],
                            "message": "No matching jobs found",
                            "completed_at": datetime.now().isoformat()
                        }
                        self.job_queue.task_done()
                        continue

                    # Ensure all jobs have URLs
                    for job in jobs:
                        if 'url' not in job or not job['url']:
                            job['url'] = self._generate_job_url(job)

                    # Match jobs
                    try:
                        matched_jobs = self.job_matcher.match_jobs(
                            user, jobs, top_k=30)
                        logger.info(f"🎯 Matched {len(matched_jobs)} jobs")
                    except Exception as e:
                        logger.error(f"❌ Job matching failed: {e}")
                        matched_jobs = jobs[:15]

                    # Save matches
                    saved_count = 0
                    for job in matched_jobs:
                        try:
                            match_data = {
                                'job_id': job.get('job_id'),
                                'title': job.get('title'),
                                'company': job.get('company'),
                                'location': job.get('location'),
                                'job_type': job.get('job_type'),
                                'skills': job.get('skills', []),
                                'source': job.get('source'),
                                'url': job.get('url', ''),
                                'description': job.get('description', '')[:500],
                                'match_score': job.get('match_score', 0),
                                'skill_match_percentage': job.get('skill_match_percentage', 0),
                                'missing_skills': job.get('missing_skills', []),
                                'salary': job.get('salary'),
                                'date_posted': job.get('date_posted'),
                                'combined_score': job.get('match_score', 0)
                            }
                            self.db.save_job_match(
                                user_id, job["job_id"], match_data)
                            saved_count += 1
                        except Exception as e:
                            logger.error(f"❌ Failed to save match: {e}")

                    logger.info(f"💾 Saved {saved_count} matches")

                    self.job_results_cache[user_id] = {
                        "status": "completed",
                        "jobs": matched_jobs,
                        "count": len(matched_jobs),
                        "completed_at": datetime.now().isoformat(),
                        "scraper_stats": self.job_scraper.get_stats()
                    }
                    logger.info(f"✅ Completed processing for user {user_id}")

                except Exception as e:
                    logger.error(f"❌ Job search failed: {e}", exc_info=True)
                    self.job_results_cache[user_id] = {
                        "status": "error", "error": str(e), "jobs": []}

                self.job_queue.task_done()

            except queue.Empty:
                continue
            except Exception as e:
                logger.error(f"❌ Background error: {e}", exc_info=True)
                if user_id:
                    self.job_results_cache[user_id] = {
                        "status": "error", "error": str(e), "jobs": []}
                    self.job_queue.task_done()

    def _generate_job_url(self, job: dict) -> str:
        if job.get('url'):
            return job['url']
        job_id = job.get('job_id', '')
        source = job.get('source', '').lower()
        if source == 'remoteok':
            return f"https://remoteok.com/remote-jobs/{job_id}"
        elif source == 'remotive':
            return f"https://remotive.com/remote-jobs/{job_id}"
        return f"/jobs/{job_id}"

    def get_status(self):
        return {
            "queue_size": self.job_queue.qsize(),
            "threads_alive": sum(1 for t in self.processing_threads if t.is_alive()),
            "cached_results": len(self.job_results_cache),
            "refresh_scheduler": self.refresh_scheduler.get_refresh_stats() if self.refresh_scheduler else None
        }

    def add_to_queue(self, user_id):
        self.job_queue.put(user_id)
        logger.info(
            f"📝 Added user {user_id} to queue (Queue: {self.job_queue.qsize()})")

    def get_cached_result(self, user_id):
        return self.job_results_cache.get(user_id)

    def manual_refresh_jobs(self):
        if hasattr(self, 'refresh_scheduler') and self.refresh_scheduler:
            return self.refresh_scheduler.manual_refresh()
        return {"success": False, "error": "Refresh scheduler not available"}

    def get_refresh_stats(self):
        if hasattr(self, 'refresh_scheduler') and self.refresh_scheduler:
            return self.refresh_scheduler.get_refresh_stats()
        return {"error": "Refresh scheduler not available", "is_running": False}
