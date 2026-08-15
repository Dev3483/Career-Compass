# app.py - Combined version with all features
from flask import Flask, jsonify
from flask_cors import CORS
import os
import logging
import numpy as np
from dotenv import load_dotenv
from flask.json.provider import DefaultJSONProvider

# Import services
from services.database import Database
from services.resume_parser import ResumeSkillExtractor
from services.job_matcher import JobMatcher
from services.job_scraper import RealisticJobScraper
from services.resume_extractor import ResumeTextExtractor
from services.resume_ats import ResumeATSAnalyzer
from services.interview_evaluator import InterviewEvaluator
from services.notification_service import NotificationService

# Import utilities
from utils.background import BackgroundJobManager

# Import route registration functions
from routes import api_bp
from routes.auth import register_auth_routes
from routes.jobs import register_jobs_routes
from routes.resume_intelligence import resume_bp
from routes.health import register_health_routes
from routes.filters import register_filters_routes
from routes.career_chat import register_career_chat_routes
from routes.skill_gap import register_skill_gap_routes
from routes.company import company_bp, init_company_routes
from routes.candidates import register_candidates_routes
from routes.salary import register_salary_routes
from routes.interview import register_interview_routes
from routes.notifications import notifications_bp, init_notifications_routes

# Load environment variables
load_dotenv()

# Custom JSON Provider for NumPy types


class CustomJSONProvider(DefaultJSONProvider):
    def default(self, obj):
        if isinstance(obj, np.float32) or isinstance(obj, np.float64):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return super().default(obj)


# Initialize Flask app
app = Flask(__name__)
app.json = CustomJSONProvider(app)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configure CORS
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
        "expose_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True,
        "max_age": 3600
    }
})

# ==================== INITIALIZE SERVICES ====================

# Database
try:
    db = Database()
    logger.info("Database connected successfully")
except Exception as e:
    logger.error(f"Database connection failed: {e}")
    db = None

# Resume Skill Extractor
try:
    resume_skill_extractor = ResumeSkillExtractor()
    logger.info("Resume skill extractor initialized")
except Exception as e:
    logger.error(f"Resume skill extractor initialization failed: {e}")
    resume_skill_extractor = None

# Resume Text Extractor
try:
    resume_text_extractor = ResumeTextExtractor()
    logger.info("Resume text extractor initialized")
except Exception as e:
    logger.error(f"Resume text extractor initialization failed: {e}")
    resume_text_extractor = None

# Resume ATS Analyzer
try:
    resume_ats_analyzer = ResumeATSAnalyzer()
    logger.info("Resume ATS analyzer initialized")
except Exception as e:
    logger.error(f"Resume ATS analyzer initialization failed: {e}")
    resume_ats_analyzer = None

# Interview Evaluator
try:
    interview_evaluator = InterviewEvaluator()
    logger.info("Interview evaluator initialized")
except Exception as e:
    logger.error(f"Interview evaluator initialization failed: {e}")
    interview_evaluator = None

# Job Scraper
try:
    job_scraper = RealisticJobScraper(
        mode="api_only", enable_db=True, db_instance=db)
    logger.info("Job scraper initialized with database integration")
except Exception as e:
    logger.error(f"Job scraper initialization failed: {e}")
    job_scraper = None

# Job Matcher
try:
    job_matcher = JobMatcher()
    logger.info("Job matcher initialized")
except Exception as e:
    logger.error(f"Job matcher initialization failed: {e}")
    job_matcher = None

# Notification Service
try:
    notification_service = NotificationService(db)
    logger.info("Notification service initialized")
except Exception as e:
    logger.error(f"Notification service initialization failed: {e}")
    notification_service = None

# Background Job Manager
try:
    background_manager = BackgroundJobManager(db, job_scraper, job_matcher)
    logger.info("Background job manager initialized")
except Exception as e:
    logger.error(f"Background job manager initialization failed: {e}")
    background_manager = None

# Company Routes Initialization
try:
    init_company_routes(db)
    app.register_blueprint(company_bp)
    logger.info("Company routes registered")
except Exception as e:
    logger.error(f"Company routes registration failed: {e}")

# Notification Routes Initialization
try:
    init_notifications_routes(db, notification_service)
    app.register_blueprint(notifications_bp)
    logger.info("Notification routes registered")
except Exception as e:
    logger.error(f"Notification routes registration failed: {e}")

# ==================== REGISTER ROUTES ====================

# Auth Routes
try:
    register_auth_routes(api_bp, db, notification_service)
    logger.info("Auth routes registered")
except Exception as e:
    logger.error(f"Auth routes registration failed: {e}")

# Skill Gap Routes
try:
    register_skill_gap_routes(api_bp, db)
    logger.info("Skill Gap routes registered")
except Exception as e:
    logger.error(f"Skill Gap routes registration failed: {e}")

# Jobs Routes
try:
    register_jobs_routes(api_bp, db, background_manager, notification_service)
    logger.info("Jobs routes registered")
except Exception as e:
    logger.error(f"Jobs routes registration failed: {e}")

# Candidates Routes
try:
    register_candidates_routes(api_bp, db)
    logger.info("Candidates routes registered")
except Exception as e:
    logger.error(f"Candidates routes registration failed: {e}")

# Health Routes
try:
    register_health_routes(api_bp, background_manager, job_scraper)
    logger.info("Health routes registered")
except Exception as e:
    logger.error(f"Health routes registration failed: {e}")

# Filters Routes
try:
    register_filters_routes(api_bp)
    logger.info("Filters routes registered")
except Exception as e:
    logger.error(f"Filters routes registration failed: {e}")

# Career Chat Routes
try:
    register_career_chat_routes(api_bp)
    logger.info("Career Chat routes registered")
except Exception as e:
    logger.error(f"Career Chat route registration failed: {e}")

# Salary Routes
try:
    register_salary_routes(api_bp)
    logger.info("Salary routes registered")
except Exception as e:
    logger.error(f"Salary routes registration failed: {e}")

# Interview Routes
try:
    register_interview_routes(api_bp, interview_evaluator)
    logger.info("Interview routes registered")
except Exception as e:
    logger.error(f"Interview routes registration failed: {e}")

# Register additional blueprints
try:
    app.register_blueprint(resume_bp)
    logger.info("Resume blueprint registered")
except Exception as e:
    logger.error(f"Resume blueprint registration failed: {e}")

# Register main API blueprint (THIS MUST BE LAST)
try:
    app.register_blueprint(api_bp)
    logger.info("Main API blueprint registered")
except Exception as e:
    logger.error(f"Main API blueprint registration failed: {e}")

# ==================== START BACKGROUND WORKERS ====================

if background_manager:
    try:
        background_manager.start_workers(num_workers=2)
        logger.info("Background workers started")
    except Exception as e:
        logger.error(f"Background workers startup failed: {e}")

# ==================== ROOT ENDPOINT ====================


@app.route('/', methods=['GET'])
def home():
    services_status = {
        "database": "connected" if db else "disconnected",
        "background_workers": "active" if background_manager else "inactive",
        "job_scraper": "active" if job_scraper else "inactive",
        "job_scraper_db_enabled": job_scraper.enable_db if job_scraper else False,
        "job_matcher": "active" if job_matcher else "inactive",
        "resume_skill_extractor": "active" if resume_skill_extractor else "inactive",
        "resume_text_extractor": "active" if resume_text_extractor else "inactive",
        "resume_ats_analyzer": "active" if resume_ats_analyzer else "inactive",
        "interview_evaluator": "active" if interview_evaluator else "inactive"
    }

    # Add database stats if available
    if db:
        try:
            services_status["database_stats"] = db.get_database_stats()
        except Exception as e:
            logger.warning(f"Could not fetch database stats: {e}")

    return jsonify({
        "message": "Career AI Backend - Operational",
        "status": "running",
        "version": "2.0.0",
        "services": services_status
    }), 200

# ==================== ERROR HANDLERS ====================


@app.errorhandler(404)
def not_found(error):
    return jsonify({
        "success": False,
        "error": "Endpoint not found"
    }), 404


@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal error: {error}", exc_info=True)
    return jsonify({
        "success": False,
        "error": "Internal server error"
    }), 500

# ==================== MAIN ENTRY POINT ====================


if __name__ == '__main__':
    # Get debug setting from environment
    debug_mode = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'

    # Get port from environment (default to 5000)
    port = int(os.getenv('PORT', 5000))

    # Disable reloader on Windows to avoid watchdog issues
    use_reloader = debug_mode and os.name != 'nt'

    print("\n" + "=" * 60)
    print("Starting Career AI Backend...")
    print(f"📝 Debug Mode: {'ON' if debug_mode else 'OFF'}")
    print(f"🔄 Auto-reloader: {'ON' if use_reloader else 'OFF'}")
    print(f"💾 Database Storage: {'ENABLED' if db else 'DISABLED'}")
    print(
        f"🔍 Job Scraper DB: {'ENABLED' if (job_scraper and job_scraper.enable_db) else 'DISABLED'}")
    print(
        f"🎙️ Interview Evaluator: {'ENABLED' if interview_evaluator else 'DISABLED'}")
    print(f"🌐 Port: {port}")
    print("=" * 60)

    app.run(
        debug=debug_mode,
        use_reloader=use_reloader,
        port=port,
        host=os.getenv('HOST', '0.0.0.0'),
        threaded=True
    )
