# services/database.py - Enhanced database handler with all methods
from pymongo import MongoClient, ASCENDING, DESCENDING
from datetime import datetime
import os
import logging
from typing import List, Dict, Optional
import uuid

logger = logging.getLogger(__name__)


class Database:
    """Main database handler for Career AI application"""

    def __init__(self, mongodb_uri=None):
        self.client = MongoClient(
            mongodb_uri or os.getenv(
                "MONGODB_URI", "mongodb://localhost:27017/")
        )
        self.db = self.client.career_ai

        # Create indexes for better performance
        self._create_indexes()
        logger.info("Database initialized")

    def _create_indexes(self):
        """Create database indexes for optimized queries"""
        try:
            # Users collection indexes
            self.db.users.create_index([("user_id", ASCENDING)], unique=True)
            self.db.users.create_index([("email", ASCENDING)], unique=True)
            self.db.users.create_index([("skills", ASCENDING)])
            self.db.users.create_index([("role", ASCENDING)])
            self.db.users.create_index([("upload_date", ASCENDING)])

            # Jobs collection indexes
            self.db.jobs.create_index([("job_id", ASCENDING)], unique=True)
            self.db.jobs.create_index([("skills", ASCENDING)])
            self.db.jobs.create_index([("source", ASCENDING)])
            self.db.jobs.create_index([("created_at", DESCENDING)])
            self.db.jobs.create_index([("job_type", ASCENDING)])
            self.db.jobs.create_index([("scraped_at", DESCENDING)])

            # Job matches collection indexes
            self.db.job_matches.create_index(
                [("user_id", ASCENDING), ("job_id", ASCENDING)], unique=True
            )
            self.db.job_matches.create_index([("user_id", ASCENDING)])
            self.db.job_matches.create_index([("combined_score", DESCENDING)])

            # Applications collection indexes
            self.db.applications.create_index(
                [("user_id", ASCENDING), ("job_id", ASCENDING)], unique=True
            )

            # Saved jobs collection indexes
            self.db.saved_jobs.create_index(
                [("user_id", ASCENDING), ("job_id", ASCENDING)], unique=True
            )

            # Notifications collection indexes
            self.db.notifications.create_index([("user_id", ASCENDING)])
            self.db.notifications.create_index([("is_read", ASCENDING)])
            self.db.notifications.create_index([("created_at", DESCENDING)])

            # OTP collection indexes (TTL index for automatic deletion after 5 minutes)
            self.db.otps.create_index([("email", ASCENDING)], unique=True)
            self.db.otps.create_index([("expires_at", ASCENDING)], expireAfterSeconds=0)

            logger.info("Database indexes created successfully")
        except Exception as e:
            logger.error(f"Error creating indexes: {e}")

    # ==================== USER METHODS ====================

    def save_user(self, user_data):
        """Save user data with upsert to prevent duplicates"""
        try:
            result = self.db.users.update_one(
                {"user_id": user_data["user_id"]},
                {"$set": user_data},
                upsert=True
            )
            logger.info(f"User saved: {user_data.get('email')}")
            return result
        except Exception as e:
            logger.error(f"Error saving user: {e}")
            return None

    def get_user(self, user_id):
        """Get user by ID"""
        try:
            return self.db.users.find_one(
                {"user_id": user_id},
                {"_id": 0}
            )
        except Exception as e:
            logger.error(f"Error getting user by ID: {e}")
            return None

    def get_user_by_email(self, email):
        """Get user by email (for authentication)"""
        try:
            user = self.db.users.find_one(
                {"email": email},
                {"_id": 0}
            )
            if user:
                logger.info(f"User found by email: {email}")
            return user
        except Exception as e:
            logger.error(f"Error getting user by email {email}: {e}")
            return None

    def update_user(self, user_id, user_data):
        """Update user in database"""
        try:
            user_data['updated_at'] = datetime.now().isoformat()
            result = self.db.users.update_one(
                {"user_id": user_id},
                {"$set": user_data}
            )

            if result.modified_count > 0:
                logger.info(f"User updated: {user_id}")
                return True
            logger.warning(f"No changes made to user: {user_id}")
            return False
        except Exception as e:
            logger.error(f"Error updating user {user_id}: {e}")
            return False

    def get_user_by_role(self, role, limit=100):
        """Get users by role"""
        try:
            return list(self.db.users.find(
                {"role": role},
                {"_id": 0, "password": 0}
            ).limit(limit))
        except Exception as e:
            logger.error(f"Error getting users by role {role}: {e}")
            return []

    def check_email_exists(self, email):
        """Check if email already exists"""
        try:
            count = self.db.users.count_documents({"email": email})
            return count > 0
        except Exception as e:
            logger.error(f"Error checking user existence: {e}")
            return False

    def update_password_by_email(self, email, hashed_password):
        """Update user password by email"""
        try:
            result = self.db.users.update_one(
                {"email": email},
                {"$set": {"password": hashed_password, "updated_at": datetime.now().isoformat()}}
            )
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Error updating password: {e}")
            return False

    # ==================== OTP METHODS ====================

    def save_otp(self, email, otp, expiry_minutes=5):
        """Save or update OTP for an email"""
        try:
            from datetime import timedelta
            expires_at = datetime.utcnow() + timedelta(minutes=expiry_minutes)
            
            result = self.db.otps.update_one(
                {"email": email},
                {
                    "$set": {
                        "otp": otp,
                        "expires_at": expires_at,
                        "created_at": datetime.now().isoformat()
                    }
                },
                upsert=True
            )
            return True
        except Exception as e:
            logger.error(f"Error saving OTP: {e}")
            return False

    def verify_otp(self, email, otp):
        """Verify if OTP is valid and not expired"""
        try:
            # MongoDB TTL index handles expiry, but we check presence
            otp_record = self.db.otps.find_one({
                "email": email,
                "otp": otp
            })
            if otp_record:
                # Delete OTP after successful verification
                self.db.otps.delete_one({"email": email})
                return True
            return False
        except Exception as e:
            logger.error(f"Error verifying OTP: {e}")
            return False

    def update_last_login(self, user_id):
        """Update user's last login timestamp"""
        try:
            self.db.users.update_one(
                {"user_id": user_id},
                {"$set": {"last_login": datetime.now().isoformat()}}
            )
            return True
        except Exception as e:
            logger.error(f"Error updating last login: {e}")
            return False

    def delete_user(self, user_id):
        """Delete user account and associated data"""
        try:
            # Delete user
            result = self.db.users.delete_one({"user_id": user_id})

            # Delete associated data
            self.db.job_matches.delete_many({"user_id": user_id})
            self.db.applications.delete_many({"user_id": user_id})
            self.db.saved_jobs.delete_many({"user_id": user_id})

            if result.deleted_count > 0:
                logger.info(f"User deleted: {user_id}")
                return True
            return False
        except Exception as e:
            logger.error(f"Error deleting user {user_id}: {e}")
            return False

    def get_all_users(self, limit=100):
        """Get all users (excluding passwords)"""
        try:
            return list(self.db.users.find(
                {},
                {"_id": 0, "password": 0}
            ).limit(limit))
        except Exception as e:
            logger.error(f"Error getting all users: {e}")
            return []

    # ==================== JOB METHODS ====================

    def save_job(self, job_data):
        """Save a job to database - ONLY for company-posted jobs"""
        # Safety filter: Only allow company-posted jobs
        if job_data.get("source") != "company_posted":
            logger.warning(
            f"Attempted to save non-company job: {job_data.get('source')}")
            return False

        try:
            result = self.db.jobs.update_one(
            {"job_id": job_data["job_id"]},
            {"$set": job_data},
            upsert=True
        )
            logger.debug(f"Job saved: {job_data.get('title')}")
            return True
        except Exception as e:
            logger.error(f"Error saving job: {e}")
            return False

    def save_jobs_batch(self, jobs):
        """Save multiple jobs efficiently"""
        if not jobs:
            return None

        operations = []
        for job in jobs:
            if "job_id" not in job:
                continue

            operations.append({
                "updateOne": {
                    "filter": {"job_id": job["job_id"]},
                    "update": {"$set": job},
                    "upsert": True
                }
            })

        if operations:
            try:
                result = self.db.jobs.bulk_write(operations)
                logger.info(f"Saved {len(operations)} jobs in batch")
                return result
            except Exception as e:
                logger.error(f"Error saving jobs batch: {e}")
                return None

    def get_job_by_id(self, job_id):
        """Get job by ID across all job collections"""
        try:
            job = self.db.jobs.find_one({"job_id": job_id}, {"_id": 0})
            if job:
                return job
                
            job = self.db.recommend_jobs.find_one({"job_id": job_id}, {"_id": 0})
            if job:
                job['source_type'] = 'recommended'
                return job
                
            job = self.db.job_matches.find_one({"job_id": job_id}, {"_id": 0})
            if job:
                job['source_type'] = 'scraped'
                return job
                
            return None
        except Exception as e:
            logger.error(f"Error getting job {job_id}: {e}")
            return None

    def get_jobs(self, page=1, limit=20, search="", job_type="", category="", status="active"):
        """Get jobs with pagination and filters"""
        try:
            query = {}
            if status:
                query['status'] = status
            if job_type:
                query['job_type'] = job_type
            if category:
                query['category'] = category

            # Get jobs from database
            jobs = list(self.db.jobs.find(
                query,
                {"_id": 0}
            ).sort("created_at", -1).skip((page-1)*limit).limit(limit))

            # Apply text search if provided
            if search:
                search_lower = search.lower()
                jobs = [j for j in jobs if (
                    search_lower in j.get('title', '').lower() or
                    search_lower in j.get('company', '').lower() or
                    any(search_lower in s.lower() for s in j.get('skills', []))
                )]

            return jobs
        except Exception as e:
            logger.error(f"Error getting jobs: {e}")
            return []

    def get_all_stored_jobs(self, limit=1000):
        """Get all stored jobs from database"""
        try:
            return list(self.db.jobs.find(
                {},
                {"_id": 0}
            ).sort("scraped_at", -1).limit(limit))
        except Exception as e:
            logger.error(f"Error getting all stored jobs: {e}")
            return []

    def get_jobs_by_skills(self, skills, limit=50):
        """Get jobs that match given skills"""
        try:
            return list(self.db.jobs.find(
                {"skills": {"$in": skills}},
                {"_id": 0}
            ).limit(limit))
        except Exception as e:
            logger.error(f"Error getting jobs by skills: {e}")
            return []

    def get_recent_jobs(self, hours=24, limit=100):
        """Get jobs scraped in the last X hours"""
        from datetime import datetime, timedelta

        cutoff_time = datetime.now() - timedelta(hours=hours)

        try:
            return list(self.db.jobs.find(
                {"scraped_at": {"$gte": cutoff_time.isoformat()}},
                {"_id": 0}
            ).limit(limit))
        except Exception as e:
            logger.error(f"Error getting recent jobs: {e}")
            return []

    def update_job(self, job_id, update_data):
        """Update an existing job"""
        try:
            update_data['updated_at'] = datetime.now().isoformat()
            result = self.db.jobs.update_one(
                {"job_id": job_id},
                {"$set": update_data}
            )
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Error updating job {job_id}: {e}")
            return False

    def search_jobs(self, query, limit=50):
        """Search jobs by title, company, or skills"""
        try:
            return list(self.db.jobs.find(
                {"$text": {"$search": query}},
                {"_id": 0, "score": {"$meta": "textScore"}}
            ).sort([("score", {"$meta": "textScore"})]).limit(limit))
        except Exception as e:
            logger.error(f"Error searching jobs: {e}")
            return []

    def get_job_statistics(self):
        """Get job statistics"""
        try:
            total_jobs = self.db.jobs.count_documents({})
            jobs_by_source = list(self.db.jobs.aggregate([
                {"$group": {"_id": "$source", "count": {"$sum": 1}}}
            ]))
            jobs_by_type = list(self.db.jobs.aggregate([
                {"$group": {"_id": "$job_type", "count": {"$sum": 1}}}
            ]))

            return {
                "total_jobs": total_jobs,
                "by_source": {item["_id"]: item["count"] for item in jobs_by_source},
                "by_type": {item["_id"]: item["count"] for item in jobs_by_type}
            }
        except Exception as e:
            logger.error(f"Error getting job statistics: {e}")
            return {}

    # ==================== JOB MATCH METHODS ====================

    def save_job_match(self, user_id, job_id, match_data):
        """Save job match result"""
        try:
            match_doc = {
                **match_data,
                "matched_at": datetime.now().isoformat(),
                "user_id": user_id,
                "job_id": job_id
            }

            result = self.db.job_matches.update_one(
                {"user_id": user_id, "job_id": job_id},
                {"$set": match_doc},
                upsert=True
            )
            return result
        except Exception as e:
            logger.error(f"Error saving job match: {e}")
            return None

    def get_user_jobs(self, user_id, limit=20):
        """Get matched jobs for a user"""
        try:
            # Get job matches
            matches = list(self.db.job_matches.find(
                {"user_id": user_id},
                {"_id": 0}
            ).sort("combined_score", -1).limit(limit))

            # If no matches found, try to get from jobs directly
            if not matches:
                user = self.get_user(user_id)
                if user and user.get('skills'):
                    skills = user.get('skills', [])
                    if skills:
                        jobs = list(self.db.jobs.find(
                            {"skills": {"$in": skills}},
                            {"_id": 0}
                        ).limit(limit))
                        return jobs

            return matches
        except Exception as e:
            logger.error(f"Error getting user jobs: {e}")
            return []

    # ==================== APPLICATION METHODS ====================

    def save_application(self, application_data):
        """Save job application"""
        try:
            self.db.applications.insert_one(application_data)
            logger.info(
                f"Application saved: {application_data['application_id']}")
            return True
        except Exception as e:
            logger.error(f"Error saving application: {e}")
            return False

    def has_applied(self, user_id, job_id):
        """Check if user has already applied for a job"""
        try:
            count = self.db.applications.count_documents({
                "user_id": user_id,
                "job_id": job_id
            })
            return count > 0
        except Exception as e:
            logger.error(f"Error checking application: {e}")
            return False

    def get_user_applications(self, user_id):
        """Get all applications for a specific user"""
        try:
            applications = list(self.db.applications.find(
                {"user_id": user_id},
                {"_id": 0}
            ).sort("applied_at", -1))
            
            # Enrich applications with job details
            enriched_applications = []
            for app in applications:
                job = self.get_job_by_id(app.get("job_id"))
                if job:
                    app["job_title"] = job.get("title")
                    app["company"] = job.get("company")
                    app["location"] = job.get("location")
                    app["job_type"] = job.get("job_type")
                    if "salary_min" in job and "salary_max" in job:
                        app["salary_range"] = f"₹{job['salary_min']} - ₹{job['salary_max']}"
                    elif "salary_min" in job:
                        app["salary_range"] = f"₹{job['salary_min']}+"
                    elif "salary_max" in job:
                        app["salary_range"] = f"Up to ₹{job['salary_max']}"
                    
                    # Try to get match score
                    match = self.db.job_matches.find_one({"user_id": user_id, "job_id": app.get("job_id")})
                    if match:
                        app["match_score"] = match.get("combined_score", 0)
                
                enriched_applications.append(app)
                
            return enriched_applications
        except Exception as e:
            logger.error(f"Error getting user applications: {e}")
            return []

    def get_user_application_stats(self, user_id):
        """Get application statistics for a user"""
        try:
            pipeline = [
                {"$match": {"user_id": user_id}},
                {"$group": {
                    "_id": "$status",
                    "count": {"$sum": 1}
                }}
            ]
            results = list(self.db.applications.aggregate(pipeline))
            
            stats = {
                "total": 0,
                "pending": 0,
                "reviewed": 0,
                "shortlisted": 0,
                "interview": 0,
                "hired": 0,
                "rejected": 0
            }
            
            for result in results:
                status = result["_id"] or "pending"
                count = result["count"]
                if status in stats:
                    stats[status] = count
                stats["total"] += count
                
            return stats
        except Exception as e:
            logger.error(f"Error getting application stats: {e}")
            return {}

    def get_application_status(self, application_id):
        """Get status of an application for realtime updates"""
        try:
            app = self.db.applications.find_one(
                {"application_id": application_id},
                {"_id": 0, "status": 1, "updated_at": 1}
            )
            return app
        except Exception as e:
            logger.error(f"Error getting application status: {e}")
            return None

    # ==================== SAVED JOB METHODS ====================

    def save_saved_job(self, user_id, job_id):
        """Save a job for user"""
        try:
            self.db.saved_jobs.update_one(
                {"user_id": user_id, "job_id": job_id},
                {"$set": {
                    "user_id": user_id,
                    "job_id": job_id,
                    "saved_at": datetime.now().isoformat()
                }},
                upsert=True
            )
            return True
        except Exception as e:
            logger.error(f"Error saving job: {e}")
            return False

    def remove_saved_job(self, user_id, job_id):
        """Remove saved job"""
        try:
            result = self.db.saved_jobs.delete_one({
                "user_id": user_id,
                "job_id": job_id
            })
            return result.deleted_count > 0
        except Exception as e:
            logger.error(f"Error removing saved job: {e}")
            return False

    def get_saved_jobs(self, user_id):
        """Get saved jobs for user"""
        try:
            saved = list(self.db.saved_jobs.find(
                {"user_id": user_id}, {"_id": 0}).sort("saved_at", -1))
            
            jobs = []
            for s in saved:
                job = self.get_job_by_id(s['job_id'])
                if job:
                    job['saved_at'] = s.get('saved_at')
                    jobs.append(job)

            return jobs
        except Exception as e:
            logger.error(f"Error getting saved jobs: {e}")
            return []

    # ==================== UTILITY METHODS ====================

    def get_database_stats(self):
        """Get database statistics"""
        try:
            return {
                "users_count": self.db.users.count_documents({}),
                "jobs_count": self.db.jobs.count_documents({}),
                "matches_count": self.db.job_matches.count_documents({}),
                "applications_count": self.db.applications.count_documents({}),
                "saved_jobs_count": self.db.saved_jobs.count_documents({}),
                "collections": self.db.list_collection_names()
            }
        except Exception as e:
            logger.error(f"Error getting database stats: {e}")
            return {}

    def clear_user_data(self, user_id):
        """Clear all data associated with a user"""
        try:
            self.db.job_matches.delete_many({"user_id": user_id})
            self.db.applications.delete_many({"user_id": user_id})
            self.db.saved_jobs.delete_many({"user_id": user_id})
            self.db.users.delete_one({"user_id": user_id})
            logger.info(f"Cleared data for user: {user_id}")
            return True
        except Exception as e:
            logger.error(f"Error clearing user data: {e}")
            return False

    def health_check(self):
        """Check database connection health"""
        try:
            self.client.admin.command('ping')
            return {
                "status": "healthy",
                "database": "connected",
                "stats": self.get_database_stats()
            }
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return {
                "status": "unhealthy",
                "database": "disconnected",
                "error": str(e)
            }

    # services/database.py - Add these new methods to the existing Database class

    # Add these methods inside the Database class (after the existing methods)

    def save_job_match_direct(self, user_id: str, job_id: str, match_data: Dict) -> bool:
        """
        Save a job match directly to job_matches collection
        This is used for storing scraped jobs
        """
        try:
            match_doc = {
                **match_data,
                "user_id": user_id,
                "job_id": job_id,
                "updated_at": datetime.now().isoformat()
            }

            result = self.db.job_matches.update_one(
                {"user_id": user_id, "job_id": job_id},
                {"$set": match_doc},
                upsert=True
            )
            logger.debug(f"Job match saved for user {user_id}, job {job_id}")
            return True
        except Exception as e:
            logger.error(f"Error saving job match: {e}")
            return False

    def get_scraped_job_by_id(self, user_id: str, job_id: str) -> Optional[Dict]:
        """
        Get a scraped job from job_matches for a specific user
        """
        try:
            return self.db.job_matches.find_one(
                {"user_id": user_id, "job_id": job_id},
                {"_id": 0}
            )
        except Exception as e:
            logger.error(f"Error getting scraped job: {e}")
            return None

    def is_scraped_job(self, user_id: str, job_id: str) -> bool:
        """
        Check if a job is a scraped job (from external source)
        """
        try:
            job = self.db.job_matches.find_one(
                {"user_id": user_id, "job_id": job_id},
                {"is_scraped": 1}
            )
            return job.get('is_scraped', False) if job else False
        except Exception as e:
            logger.error(f"Error checking if scraped job: {e}")
            return False

    def get_user_scraped_jobs(self, user_id: str, limit: int = 100) -> List[Dict]:
        """
        Get all scraped jobs for a user
        """
        try:
            return list(self.db.job_matches.find(
                {"user_id": user_id, "is_scraped": True},
                {"_id": 0}
            ).sort("combined_score", -1).limit(limit))
        except Exception as e:
            logger.error(f"Error getting user scraped jobs: {e}")
            return []

    def get_company_jobs(self, page=1, limit=20, search="", job_type="", category="", status="active"):
        """Get only company-posted jobs"""
        try:
            query = {'source': 'company_posted'}
            if status:
                query['status'] = status
            if job_type:
                query['job_type'] = job_type
            if category:
                query['category'] = category

            jobs = list(self.db.jobs.find(
                query,
                {"_id": 0}
            ).sort("created_at", -1).skip((page-1)*limit).limit(limit))
            print(jobs)

            if search:
                search_lower = search.lower()
                jobs = [j for j in jobs if (
                    search_lower in j.get('title', '').lower() or
                    search_lower in j.get('company', '').lower() or
                    any(search_lower in s.lower() for s in j.get('skills', []))
                )]

            return jobs
        except Exception as e:
            logger.error(f"Error getting company jobs: {e}")
            return []
        
    # Add these methods to the Database class in database.py

    # ==================== COMPANY RATING METHODS ====================

    def save_rating(self, rating_data: Dict) -> bool:
        """Save a company rating/review"""
        try:
            # Check if user already rated this company
            existing = self.db.ratings.find_one({
                "company_id": rating_data['company_id'],
                "user_id": rating_data['user_id']
            })
            
            rating_doc = {
                "rating_id": str(uuid.uuid4()),
                "company_id": rating_data['company_id'],
                "user_id": rating_data['user_id'],
                "rating": rating_data['rating'],
                "review": rating_data.get('review', ''),
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
            
            if existing:
                # Update existing rating
                self.db.ratings.update_one(
                    {"company_id": rating_data['company_id'], "user_id": rating_data['user_id']},
                    {"$set": rating_doc}
                )
            else:
                # Insert new rating
                self.db.ratings.insert_one(rating_doc)
            
            logger.info(f"Rating saved for company {rating_data['company_id']}")
            return True
        except Exception as e:
            logger.error(f"Error saving rating: {e}")
            return False

    def get_company_rating(self, company_id: str) -> Dict:
        """Get average rating and reviews for a company"""
        try:
            ratings = list(self.db.ratings.find(
                {"company_id": company_id},
                {"_id": 0, "rating": 1, "review": 1, "user_id": 1, "created_at": 1}
            ))
            
            if not ratings:
                return {
                    "average_rating": 0,
                    "total_reviews": 0,
                    "reviews": []
                }
            
            avg_rating = sum(r['rating'] for r in ratings) / len(ratings)
            
            return {
                "average_rating": round(avg_rating, 1),
                "total_reviews": len(ratings),
                "reviews": ratings[:10]  # Return latest 10 reviews
            }
        except Exception as e:
            logger.error(f"Error getting company rating: {e}")
            return {"average_rating": 0, "total_reviews": 0, "reviews": []}

    def get_user_rating_for_company(self, user_id: str, company_id: str) -> Optional[Dict]:
        """Get a user's rating for a specific company"""
        try:
            return self.db.ratings.find_one(
                {"company_id": company_id, "user_id": user_id},
                {"_id": 0}
            )
        except Exception as e:
            logger.error(f"Error getting user rating: {e}")
            return None

    def get_top_rated_companies(self, limit: int = 10) -> List[Dict]:
        """Get top rated companies"""
        try:
            pipeline = [
                {"$group": {
                    "_id": "$company_id",
                    "average_rating": {"$avg": "$rating"},
                    "total_reviews": {"$sum": 1}
                }},
                {"$sort": {"average_rating": -1}},
                {"$limit": limit}
            ]
            
            results = list(self.db.ratings.aggregate(pipeline))
            
            # Fetch company details
            companies = []
            for result in results:
                company = self.get_user(result['_id'])
                if company:
                    companies.append({
                        "company_id": result['_id'],
                        "company_name": company.get('company_name', company.get('full_name')),
                        "average_rating": round(result['average_rating'], 1),
                        "total_reviews": result['total_reviews']
                    })
            
            return companies
        except Exception as e:
            logger.error(f"Error getting top rated companies: {e}")
            return []
        
    # Add this import at the top

# Add these methods to the Database class in database.py

# ==================== APPLICATION METHODS (Enhanced) ====================

    # In services/database.py - Replace the get_applications_by_job method


    def get_applications_by_job(self, job_id: str) -> List[Dict]:
        """Get all applications for a specific job"""
        try:
        # Debug logging
            logger.info(f"Querying applications for job_id: {job_id}")

        # Simple query first to debug
            applications = list(self.db.applications.find(
            {"job_id": job_id}
        ))

            logger.info(
            f"Found {len(applications)} raw applications for job {job_id}")

        # If no applications found, log all applications in collection for debugging
            if not applications:
                all_apps = list(self.db.applications.find(
                {}, {"job_id": 1, "application_id": 1}))
                logger.info(f"All applications in collection: {all_apps}")
                return []

        # Enrich applications with user details
            enriched_applications = []
            for app in applications:
                user = self.get_user(app.get("user_id"))
                if user:
                    enriched_app = {
                    **app,
                    "applicant_name": user.get("full_name", "Unknown"),
                    "applicant_email": user.get("email", ""),
                    "applicant_skills": user.get("skills", []),
                    "applicant_experience_years": user.get("experience_years", 0),
                    "applicant_ats_score": user.get("ats_score", 0),
                    "applicant_resume_url": user.get("resume_url", "")
                }
                    enriched_applications.append(enriched_app)
                    logger.info(
                    f"Enriched application for user: {user.get('full_name')}")
                else:
                    logger.warning(
                    f"User not found for application: {app.get('user_id')}")
                    enriched_applications.append(app)

            logger.info(
            f"Returning {len(enriched_applications)} enriched applications for job {job_id}")
            return enriched_applications

        except Exception as e:
            logger.error(
            f"Error fetching applications for job {job_id}: {e}", exc_info=True)
            return []

    def get_applications_by_company(self, company_id):
        """Get all applications for jobs posted by a company"""
        try:
        # First get all jobs posted by this company
            jobs = list(self.db.jobs.find(
            {"company_id": company_id, "source": "company_posted"},
            {"job_id": 1}
        ))
        
            job_ids = [job["job_id"] for job in jobs]
        
            if not job_ids:
                return []
        
        # Get applications for these jobs
            applications = list(self.db.applications.find(
            {"job_id": {"$in": job_ids}},
            {"_id": 0}
        ).sort("created_at", -1))
        
        # Enrich with user details
            enriched_applications = []
            for app in applications:
                user = self.get_user(app.get("user_id"))
                if user:
                    enriched_app = {
                    **app,
                    "applicant_name": user.get("full_name", "Unknown"),
                    "applicant_email": user.get("email", ""),
                    "applicant_skills": user.get("skills", []),
                }
                enriched_applications.append(enriched_app)
        
            return enriched_applications
        except Exception as e:
            logger.error(f"Error fetching company applications: {e}")
            return []

    def update_application_status(self, application_id, new_status):
        """Update the status of an application"""
        try:
            result = self.db.applications.update_one(
            {"application_id": application_id},
            {"$set": {
                "status": new_status,
                "updated_at": datetime.now().isoformat()
            }}
        )
        
            if result.modified_count > 0:
                logger.info(f"Application {application_id} status updated to {new_status}")
                return True
            return False
        except Exception as e:
            logger.error(f"Error updating application status: {e}")
            return False

    def get_job_applications_with_details(self, job_id):
        """Get applications for a job with complete user details"""
        try:
            pipeline = [
            {"$match": {"job_id": job_id}},
            {"$lookup": {
                "from": "users",
                "localField": "user_id",
                "foreignField": "user_id",
                "as": "applicant"
            }},
            {"$unwind": {"path": "$applicant", "preserveNullAndEmptyArrays": True}},
            {"$project": {
                "_id": 0,
                "application_id": 1,
                "job_id": 1,
                "user_id": 1,
                "status": 1,
                "ai_match_score": 1,
                "created_at": 1,
                "cover_letter": 1,
                "applicant_name": {"$ifNull": ["$applicant.full_name", "Unknown"]},
                "applicant_email": {"$ifNull": ["$applicant.email", ""]},
                "applicant_skills": {"$ifNull": ["$applicant.skills", []]},
                "applicant_experience": {"$ifNull": ["$applicant.experience", []]},
                "applicant_education": {"$ifNull": ["$applicant.education", []]},
                "applicant_resume_url": {"$ifNull": ["$applicant.resume_url", ""]}
            }},
            {"$sort": {"ai_match_score": -1, "created_at": -1}}
        ]
        
            results = list(self.db.applications.aggregate(pipeline))
            logger.info(f"Found {len(results)} applications for job {job_id}")
            return results
        except Exception as e:
            logger.error(f"Error getting job applications with details: {e}")
            return []

    def get_company_jobs_by_company_id(self, company_id):
        """Get all jobs posted by a specific company"""
        try:
            jobs = list(self.db.jobs.find(
            {"company_id": company_id, "source": "company_posted"},
            {"_id": 0}
        ).sort("created_at", -1))
        
            logger.info(f"Found {len(jobs)} jobs for company {company_id}")
            return jobs
        except Exception as e:
            logger.error(f"Error getting company jobs: {e}")
            return []

    
    # Add these methods to the Database class in database.py

# ==================== RANKING METHODS ====================


    def get_cached_ranking(self, job_id: str) -> Optional[Dict]:
        """Get cached ranking results for a job"""
        try:
            result = self.db.job_rankings.find_one(
                {"job_id": job_id},
                {"_id": 0}
            )
            return result
        except Exception as e:
            logger.error(f"Error getting cached ranking: {e}")
            return None

    def get_applications_by_job(self, job_id: str) -> List[Dict]:
        """Get all applications for a specific job"""
        try:
            applications = list(self.db.applications.find(
                {"job_id": job_id},
                {"_id": 0}
            ).sort("created_at", -1))

            logger.info(
                f"Found {len(applications)} applications for job {job_id}")
            return applications
        except Exception as e:
            logger.error(f"Error getting applications by job: {e}")
            return []

    def get_job_applications(self, job_id: str, company_id: str = None) -> List[Dict]:
        """Get applications with enriched user data"""
        try:
            # First verify company owns this job if company_id provided
            if company_id:
                job = self.get_job_by_id(job_id)
                if not job or job.get('company_id') != company_id:
                    logger.warning(
                        f"Company {company_id} not authorized for job {job_id}")
                    return []

            # Get applications with user details using aggregation
            pipeline = [
                {"$match": {"job_id": job_id}},
                {"$lookup": {
                    "from": "users",
                    "localField": "user_id",
                    "foreignField": "user_id",
                    "as": "applicant"
                }},
                {"$unwind": {"path": "$applicant", "preserveNullAndEmptyArrays": True}},
                {"$project": {
                    "_id": 0,
                    "application_id": 1,
                    "job_id": 1,
                    "user_id": 1,
                    "status": 1,
                    "ai_match_score": 1,
                    "created_at": 1,
                    "cover_letter": 1,
                    "applicant_name": {"$ifNull": ["$applicant.full_name", "Unknown"]},
                    "applicant_email": {"$ifNull": ["$applicant.email", ""]},
                    "applicant_skills": {"$ifNull": ["$applicant.skills", []]},
                    "applicant_experience_years": {"$ifNull": ["$applicant.experience_years", 0]},
                    "applicant_ats_score": {"$ifNull": ["$applicant.ats_score", 0]},
                    "applicant_resume_url": {"$ifNull": ["$applicant.resume_url", ""]}
                }},
                {"$sort": {"created_at": -1}}
            ]

            results = list(self.db.applications.aggregate(pipeline))
            return results

        except Exception as e:
            logger.error(f"Error getting job applications: {e}")
            return []

    # Add these methods to the Database class in database.py

    def get_company_jobs_by_company_id(self, company_id):
        """Get all jobs posted by a specific company"""
        try:
            jobs = list(self.db.jobs.find(
                {"company_id": company_id, "source": "company_posted"},
                {"_id": 0}
            ).sort("created_at", -1))

            logger.info(f"Found {len(jobs)} jobs for company {company_id}")
            return jobs
        except Exception as e:
            logger.error(f"Error getting company jobs: {e}")
            return []

    # Add this method to your Database class in database.py


    def get_user_by_company_name(self, company_name):
        """Get user by company name"""
        try:
            return self.db.users.find_one(
            {"company_name": company_name, "role": "company"},
            {"_id": 0}
        )
        except Exception as e:
            logger.error(f"Error getting user by company name: {e}")
            return None


    # Add to services/database.py inside the Database class

    def get_all_jobs_unified(self, user_id: str, limit: int = 100) -> List[Dict]:
        """
        Get all jobs from all sources (company-posted, scraped, recommended) for a user
        Returns unified list with source identification
        """
        try:
            all_jobs = []

            # 1. Get company-posted jobs from jobs collection
            company_jobs = list(self.db.jobs.find(
                {"source": "company_posted", "status": "active"},
                {"_id": 0}
            ).sort("created_at", -1))

            for job in company_jobs:
                job['source_type'] = 'company'
                job['source_display'] = 'Verified Company'
                job['is_verified'] = True
                job['authenticity_score'] = job.get('authenticity_score', 100)

            all_jobs.extend(company_jobs)

            # 2. Get scraped jobs from job_matches for this user
            scraped_jobs = list(self.db.job_matches.find(
                {"user_id": user_id, "is_scraped": True},
                {"_id": 0}
            ).sort("scraped_at", -1).limit(limit))

            for job in scraped_jobs:
                job['source_type'] = 'scraped'
                job['source_display'] = f"{job.get('source', 'External')} (External)"
                job['is_verified'] = job.get('is_verified', False)
                job['authenticity_score'] = job.get('authenticity_score', 50)

            all_jobs.extend(scraped_jobs)
            
            # 3. Get recommended jobs
            recommend_jobs = list(self.db.recommend_jobs.find({}, {"_id": 0}).limit(limit))
            for job in recommend_jobs:
                job['source_type'] = 'recommended'
                job['source_display'] = job.get('platform', 'External')
                job['is_verified'] = job.get('trust_badge') == 'Verified'
                job['authenticity_score'] = job.get('trust_score', 50)
                job['match_score'] = job.get('confidence_score', 0) * 100
                job['skill_match_percentage'] = job.get('confidence_score', 0) * 100
                if 'salary' in job and job['salary'] and isinstance(job['salary'], str):
                     job['salary_min'] = job['salary']
                job['date_posted'] = job.get('posted_date')

            all_jobs.extend(recommend_jobs)

            logger.info(
                f"Unified {len(company_jobs)} company jobs, {len(scraped_jobs)} scraped jobs, and {len(recommend_jobs)} recommended jobs")
            return all_jobs

        except Exception as e:
            logger.error(f"Error getting unified jobs: {e}")
            return []

    def get_recommend_jobs(self, limit: int = 100) -> List[Dict]:
        """Get jobs strictly from recommend_jobs collection"""
        try:
            jobs = list(self.db.recommend_jobs.find({}, {"_id": 0}).limit(limit))
            for job in jobs:
                job['source_type'] = 'recommended'
                job['source_display'] = job.get('platform', 'External')
                job['is_verified'] = job.get('trust_badge') == 'Verified'
                job['authenticity_score'] = job.get('trust_score', 50)
                job['match_score'] = job.get('confidence_score', 0) * 100
                job['skill_match_percentage'] = job.get('confidence_score', 0) * 100
                if 'salary' in job and job['salary'] and isinstance(job['salary'], str):
                     job['salary_min'] = job['salary']
                job['date_posted'] = job.get('posted_date')
            return jobs
        except Exception as e:
            logger.error(f"Error getting recommend jobs: {e}")
            return []

    # ==================== NOTIFICATION METHODS ====================

    def save_notification(self, notification_data: Dict) -> bool:
        """Save a new notification"""
        try:
            notification_data['created_at'] = datetime.now().isoformat()
            notification_data['is_read'] = False
            if 'notification_id' not in notification_data:
                notification_data['notification_id'] = str(uuid.uuid4())
            
            self.db.notifications.insert_one(notification_data)
            return True
        except Exception as e:
            logger.error(f"Error saving notification: {e}")
            return False

    def get_notifications(self, user_id: str, limit: int = 50) -> List[Dict]:
        """Get notifications for a specific user"""
        try:
            return list(self.db.notifications.find(
                {"user_id": user_id},
                {"_id": 0}
            ).sort("created_at", -1).limit(limit))
        except Exception as e:
            logger.error(f"Error getting notifications: {e}")
            return []

    def mark_notification_as_read(self, notification_id: str) -> bool:
        """Mark a specific notification as read"""
        try:
            result = self.db.notifications.update_one(
                {"notification_id": notification_id},
                {"$set": {"is_read": True}}
            )
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Error marking notification as read: {e}")
            return False

    def delete_notification(self, notification_id: str) -> bool:
        """Delete a specific notification"""
        try:
            result = self.db.notifications.delete_one({"notification_id": notification_id})
            return result.deleted_count > 0
        except Exception as e:
            logger.error(f"Error deleting notification: {e}")
            return False

    def clear_all_notifications(self, user_id: str) -> bool:
        """Delete all notifications for a user"""
        try:
            result = self.db.notifications.delete_many({"user_id": user_id})
            return True
        except Exception as e:
            logger.error(f"Error clearing notifications: {e}")
            return False

    def update_notification_settings(self, user_id: str, settings: Dict) -> bool:
        """Update notification preferences for a user"""
        try:
            result = self.db.users.update_one(
                {"user_id": user_id},
                {"$set": {"notification_settings": settings}}
            )
            return True
        except Exception as e:
            logger.error(f"Error updating notification settings: {e}")
            return False

    def get_users_by_role(self, role: str) -> List[Dict]:
        """Get all users with a specific role"""
        try:
            return list(self.db.users.find({"role": role}, {"_id": 0}))
        except Exception as e:
            logger.error(f"Error getting users by role {role}: {e}")
            return []

