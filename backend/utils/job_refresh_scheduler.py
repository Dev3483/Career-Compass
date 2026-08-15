# utils/job_refresh_scheduler.py - Fixed version
import threading
import time
import logging
from datetime import datetime, timedelta
from typing import List, Optional
import schedule

logger = logging.getLogger(__name__)


class JobRefreshScheduler:
    def __init__(self, db, job_scraper, default_skills=None):
        self.db = db
        self.job_scraper = job_scraper
        self.default_skills = default_skills or [
            'python', 'javascript', 'java', 'react', 'node.js',
            'data science', 'machine learning', 'devops', 'aws',
            'full stack', 'backend', 'frontend'
        ]
        self.refresh_thread = None
        self.is_running = False
        self.last_refresh_time = None
        self.refresh_stats = {
            'total_refreshes': 0,
            'successful_refreshes': 0,
            'failed_refreshes': 0,
            'jobs_added_total': 0,
            'last_error': None
        }
        logger.info("JobRefreshScheduler initialized")

    def start_scheduler(self, interval_hours=24):
        if self.is_running:
            logger.warning("Scheduler is already running")
            return False

        self.is_running = True
        self.refresh_thread = threading.Thread(
            target=self._run_scheduler,
            args=(interval_hours,),
            daemon=True,
            name="JobRefreshScheduler"
        )
        self.refresh_thread.start()
        logger.info(
            f"✅ Job refresh scheduler started (interval: {interval_hours} hours)")
        return True

    def _run_scheduler(self, interval_hours):
        logger.info("🔄 Job refresh scheduler loop started")
        schedule.every(interval_hours).hours.do(self.refresh_jobs)
        logger.info("Running initial job refresh...")
        self.refresh_jobs()

        while self.is_running:
            try:
                schedule.run_pending()
                time.sleep(60)
            except Exception as e:
                logger.error(f"Error in scheduler loop: {e}")
                time.sleep(300)

    def refresh_jobs(self):
        logger.info("=" * 60)
        logger.info("🔄 Starting scheduled job refresh...")
        logger.info(f"Time: {datetime.now().isoformat()}")

        try:
            start_time = time.time()
            all_jobs = []
            total_stored = 0

            for skill in self.default_skills[:5]:
                try:
                    logger.info(f"Scraping jobs for skill: {skill}")

                    # Use the correct method that stores in job_matches
                    jobs = self.job_scraper.scrape_jobs_and_store_matches(
                        skills=[skill],
                        user_id="system",  # System user for global refresh
                        location="Remote",
                        job_type="remote",
                        max_jobs=30
                    )

                    if jobs:
                        all_jobs.extend(jobs)
                        logger.info(
                            f"Found {len(jobs)} jobs for skill: {skill}")
                        total_stored += len(jobs)

                    time.sleep(2)

                except Exception as e:
                    logger.error(f"Error scraping for skill {skill}: {e}")
                    continue

            unique_jobs = self._deduplicate_jobs(all_jobs)
            refresh_time = datetime.now().isoformat()

            self.last_refresh_time = refresh_time
            self.refresh_stats['total_refreshes'] += 1
            self.refresh_stats['successful_refreshes'] += 1
            self.refresh_stats['jobs_added_total'] += total_stored

            elapsed_time = time.time() - start_time

            logger.info(f"✅ Job refresh completed!")
            logger.info(f"   Total jobs scraped: {len(all_jobs)}")
            logger.info(f"   Unique jobs: {len(unique_jobs)}")
            logger.info(f"   Jobs stored: {total_stored}")
            logger.info(f"   Time taken: {elapsed_time:.2f} seconds")
            logger.info("=" * 60)

            return {
                'success': True,
                'jobs_scraped': len(all_jobs),
                'unique_jobs': len(unique_jobs),
                'jobs_stored': total_stored,
                'refresh_time': refresh_time,
                'elapsed_time': elapsed_time
            }

        except Exception as e:
            logger.error(f"❌ Job refresh failed: {e}", exc_info=True)
            self.refresh_stats['failed_refreshes'] += 1
            self.refresh_stats['last_error'] = str(e)
            return {'success': False, 'error': str(e), 'refresh_time': datetime.now().isoformat()}

    def _deduplicate_jobs(self, jobs: List[dict]) -> List[dict]:
        seen_urls = set()
        seen_keys = set()
        unique = []

        for job in jobs:
            url = job.get('url', '')
            if url and url in seen_urls:
                continue
            key = f"{job.get('title', '').lower().strip()}_{job.get('company', '').lower().strip()}"
            if key in seen_keys:
                continue
            if url:
                seen_urls.add(url)
            seen_keys.add(key)
            unique.append(job)
        return unique

    def get_refresh_stats(self) -> dict:
        return {
            'is_running': self.is_running,
            'last_refresh_time': self.last_refresh_time,
            'stats': self.refresh_stats,
            'next_refresh_estimate': self._get_next_refresh_estimate()
        }

    def _get_next_refresh_estimate(self) -> Optional[str]:
        if self.last_refresh_time:
            try:
                last_time = datetime.fromisoformat(self.last_refresh_time)
                next_time = last_time + timedelta(hours=24)
                return next_time.isoformat()
            except:
                pass
        return None

    def manual_refresh(self) -> dict:
        logger.info("Manual job refresh triggered")
        return self.refresh_jobs()

    def stop_scheduler(self):
        self.is_running = False
        logger.info("Job refresh scheduler stopped")
