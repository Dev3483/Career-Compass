# routes/resume_intelligence.py - WITH CLOUDINARY INTEGRATION & RATE LIMITING & SEMANTIC ANALYSIS
import re
import sys
import os
import logging
import uuid
from datetime import datetime, timedelta
from flask import request, jsonify, Blueprint
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
import cloudinary
import cloudinary.uploader

load_dotenv()

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

logger = logging.getLogger(__name__)

resume_bp = Blueprint('resume', __name__, url_prefix='/api')

# ── Semantic Analysis Import ───────────────────────────────────────────────────
try:
    from services.semantic_analyzer import analyze_domains, semantic_job_match, format_domain_insights
    SEMANTIC_AVAILABLE = True
    logger.info("✅ Semantic analyzer imported successfully")
except Exception as e:
    logger.warning(f"⚠️ Semantic analyzer import failed: {e}")
    SEMANTIC_AVAILABLE = False

# ── Cloudinary Configuration ────────────────────────────────────────────────────
CLOUDINARY_CONFIGURED = False
try:
    cloudinary.config(
        cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
        api_key=os.getenv("CLOUDINARY_API_KEY"),
        api_secret=os.getenv("CLOUDINARY_API_SECRET")
    )
    # Test configuration by getting cloud name
    if os.getenv("CLOUDINARY_CLOUD_NAME"):
        CLOUDINARY_CONFIGURED = True
        logger.info("✅ Cloudinary configured successfully")
    else:
        logger.warning(
            "⚠️ Cloudinary credentials missing, will save resumes locally")
except Exception as e:
    logger.error(f"❌ Cloudinary configuration failed: {e}")
    CLOUDINARY_CONFIGURED = False

# ── Service initialization ────────────────────────────────────────────────────

# 1. Text Extractor
try:
    from services.resume_extractor import ResumeTextExtractor
    text_extractor = ResumeTextExtractor()
    logger.info("✅ Text extractor initialized")
except Exception as e:
    logger.error(f"❌ Failed to initialize text extractor: {e}")
    text_extractor = None

# 2. Skill Extractor
try:
    from services.resume_parser import ResumeSkillExtractor
    skill_extractor = ResumeSkillExtractor()
    logger.info("✅ Skill extractor initialized")
except Exception as e:
    logger.error(f"❌ Failed to initialize skill extractor: {e}")
    skill_extractor = None

# 3. ATS Analyzer
try:
    from services.resume_ats import ResumeATSAnalyzer
    ats_analyzer = ResumeATSAnalyzer()
    logger.info("✅ ATS analyzer initialized")
except Exception as e:
    logger.warning(
        f"ResumeATSAnalyzer import failed ({e}), using built-in fallback")
    ats_analyzer = None

# 4. AI Analyzer (Gemini)
try:
    from services.resume_ai import ResumeAIAnalyzer
    gemini_api_key = os.getenv("gemini_api_key") or os.getenv("GEMINI_API_KEY")
    ai_analyzer = ResumeAIAnalyzer(api_key=gemini_api_key)
    logger.info("✅ AI analyzer initialized")
except Exception as e:
    logger.warning(f"AI analyzer failed ({e}), will skip AI analysis")
    ai_analyzer = None

# 5. Database
try:
    from services.database import Database
    db = Database()
    logger.info("✅ Database connected")
except Exception as e:
    logger.warning(f"Database not available: {e}")
    db = None

# ── Rate Limiting Setup ────────────────────────────────────────────────────────
# Store upload counts per user: {user_id: {'count': 3, 'date': '2024-01-01'}}
upload_limits = {}

MAX_UPLOADS_PER_DAY = 3


def check_upload_limit(user_id: str) -> tuple:
    """
    Check if user has exceeded daily upload limit.
    Returns (allowed: bool, remaining: int, message: str)
    """
    if not user_id:
        return True, MAX_UPLOADS_PER_DAY, "No user ID provided, skipping rate limit"

    today = datetime.now().date().isoformat()

    # Get or create user record
    if user_id not in upload_limits:
        upload_limits[user_id] = {'count': 0, 'date': today}

    # Reset if it's a new day
    if upload_limits[user_id]['date'] != today:
        upload_limits[user_id] = {'count': 0, 'date': today}

    current_count = upload_limits[user_id]['count']
    remaining = MAX_UPLOADS_PER_DAY - current_count

    if current_count >= MAX_UPLOADS_PER_DAY:
        return False, 0, f"You have reached the maximum of {MAX_UPLOADS_PER_DAY} uploads per day"

    return True, remaining, f"You have {remaining} uploads remaining today"


def increment_upload_count(user_id: str):
    """Increment upload count for a user"""
    if not user_id:
        return

    today = datetime.now().date().isoformat()

    if user_id not in upload_limits:
        upload_limits[user_id] = {'count': 0, 'date': today}

    if upload_limits[user_id]['date'] != today:
        upload_limits[user_id] = {'count': 0, 'date': today}

    upload_limits[user_id]['count'] += 1


def get_upload_stats(user_id: str) -> dict:
    """Get upload statistics for a user"""
    if not user_id:
        return {"remaining": MAX_UPLOADS_PER_DAY, "used": 0, "limit": MAX_UPLOADS_PER_DAY}

    today = datetime.now().date().isoformat()

    if user_id not in upload_limits or upload_limits[user_id]['date'] != today:
        return {"remaining": MAX_UPLOADS_PER_DAY, "used": 0, "limit": MAX_UPLOADS_PER_DAY}

    used = upload_limits[user_id]['count']
    return {"remaining": MAX_UPLOADS_PER_DAY - used, "used": used, "limit": MAX_UPLOADS_PER_DAY}


# ── Inline fallback ATS analyzer ──────────────────────────────────────────────
class _FallbackATSAnalyzer:
    """Lightweight ATS analyzer with no external dependencies"""

    def calculate_ats_score(self, text, skills, experience, education, projects, achievements):
        score = 50
        score += min(25, len(skills) * 2)
        score += min(15, len(experience) * 3)
        if education:
            score += 10
        score += min(10, len(projects) * 2)
        score += min(10, len(achievements))
        return min(100, score), {}

    def generate_strengths_weaknesses(self, skills, experience, education, projects, achievements):
        strengths, weaknesses = [], []
        if len(skills) >= 8:
            strengths.append(
                f"Strong technical skills with {len(skills)} identified skills")
        elif len(skills) >= 4:
            strengths.append(
                f"Good technical foundation with {len(skills)} skills")
        else:
            weaknesses.append(
                "Add more technical skills to strengthen your profile")
        if experience:
            strengths.append(
                f"{len(experience)} work experience(s) documented")
        else:
            weaknesses.append("Add work experience or internships")
        if projects:
            strengths.append(
                f"{len(projects)} project(s) showcasing practical skills")
        else:
            weaknesses.append("Add personal or professional projects")
        if education:
            strengths.append("Educational background clearly mentioned")
        else:
            weaknesses.append("Add educational details")
        if achievements:
            strengths.append("Includes measurable achievements")
        else:
            weaknesses.append("Add quantifiable achievements with numbers")
        return strengths[:5], weaknesses[:5]

    def generate_summary(self, skills, experience, education, projects, achievements, total_years):
        if not skills:
            return "Resume analysis complete. Add more details for better insights."
        top_skills = ", ".join(skills[:5])
        if total_years > 0:
            return f"Professional with {total_years}+ years of experience, skilled in {top_skills}."
        return f"Motivated candidate skilled in {top_skills}, with strong project experience."


if ats_analyzer is None:
    ats_analyzer = _FallbackATSAnalyzer()
    logger.info("✅ Fallback ATS analyzer active")

# ── Helpers ───────────────────────────────────────────────────────────────────

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf', 'docx', 'doc', 'txt'}
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# ── Routes ────────────────────────────────────────────────────────────────────

@resume_bp.route('/upload-resume', methods=['POST'])
def upload_resume():
    """Upload and analyze a resume with Cloudinary storage and rate limiting"""
    try:
        # Guard: critical services must be present
        missing = []
        if not text_extractor:
            missing.append("Text Extractor")
        if not skill_extractor:
            missing.append("Skill Extractor")
        if missing:
            return jsonify({
                "success": False,
                "error": f"Service initialization failed. Missing: {', '.join(missing)}",
                "missing_services": missing
            }), 500

        if 'resume' not in request.files:
            return jsonify({"success": False, "error": "No resume file provided"}), 400

        file = request.files['resume']
        user_id = request.form.get('user_id')
        job_description = request.form.get('job_description', '')

        logger.info(f"📥 Received upload request for user_id: {user_id}")

        if file.filename == '':
            return jsonify({"success": False, "error": "No file selected"}), 400

        if not allowed_file(file.filename):
            return jsonify({
                "success": False,
                "error": "File type not allowed. Please upload PDF, DOCX, or TXT"
            }), 400

        # ── RATE LIMITING CHECK ────────────────────────────────────────────────
        allowed, remaining, limit_msg = check_upload_limit(user_id)
        if not allowed:
            return jsonify({
                "success": False,
                "error": limit_msg,
                "rate_limit": {
                    "allowed": False,
                    "remaining": 0,
                    "limit": MAX_UPLOADS_PER_DAY,
                    "message": limit_msg
                }
            }), 429  # 429 Too Many Requests

        filename = secure_filename(file.filename)
        temp_path = os.path.join(
            UPLOAD_FOLDER, f"{user_id}_{uuid.uuid4().hex}_{filename}")
        file.save(temp_path)
        logger.info(f"💾 File saved temporarily at: {temp_path}")

        resume_url = None
        public_id = None
        clean_name = filename.rsplit('.', 1)[0]
        clean_name = re.sub(r'[^a-zA-Z0-9_-]', '', clean_name)


        try:
            # ── CLOUDINARY UPLOAD ────────────────────────────────────────────────
            if CLOUDINARY_CONFIGURED:
                try:
                    logger.info("☁️ Uploading to Cloudinary...")
                    # Upload to Cloudinary
                    upload_result = cloudinary.uploader.upload(
                        temp_path,
                        resource_type="image",  # For PDF/DOCX files
                        format="pdf" if filename.lower().endswith('.pdf') else "docx",
                        folder=f"resumes/{user_id}" if user_id else "resumes",
                        public_id=f"{user_id}_{uuid.uuid4().hex}_{clean_name}" if user_id else filename,
                        overwrite=False
                    )

                    resume_url = upload_result.get("secure_url")
                    public_id = upload_result.get("public_id")

                    # ADDED: Debug logs for Cloudinary upload
                    if resume_url:
                        logger.info(
                            f"✅ Resume uploaded to Cloudinary: {resume_url}")
                        logger.info(f"✅ Public ID: {public_id}")
                    else:
                        logger.warning(
                            f"⚠️ No resume_url returned from Cloudinary")
                        logger.warning(f"⚠️ Upload result: {upload_result}")

                except Exception as cloud_err:
                    logger.error(f"Cloudinary upload failed: {cloud_err}")
                    # Continue with local processing even if Cloudinary fails
                    resume_url = None
            else:
                logger.info("Cloudinary not configured, skipping cloud upload")

            # ── TEXT EXTRACTION ─────────────────────────────────────────────────
            logger.info("📄 Extracting text from resume...")
            text = text_extractor.extract_text(temp_path, filename)
            sections = text_extractor.parse_sections(text)
            skills = skill_extractor.extract_skills(text, sections)
            ranked_skills = skill_extractor.rank_skills(skills)
            experience = text_extractor.extract_experience(sections)
            education = text_extractor.extract_education(sections)
            projects = text_extractor.extract_projects(sections)
            achievements = text_extractor.extract_achievements(text)
            contact = text_extractor.extract_contact(text)

            # ── ATS ANALYSIS ────────────────────────────────────────────────────
            logger.info("📊 Calculating ATS score...")
            ats_score, ats_breakdown = ats_analyzer.calculate_ats_score(
                text, ranked_skills, experience, education, projects, achievements
            )
            strengths, weaknesses = ats_analyzer.generate_strengths_weaknesses(
                ranked_skills, experience, education, projects, achievements
            )
            total_years = text_extractor.calculate_experience_years(experience)
            summary = ats_analyzer.generate_summary(
                ranked_skills, experience, education, projects, achievements, total_years
            )

            # ── AI ENRICHMENT ───────────────────────────────────────────────────
            if ai_analyzer:
                try:
                    logger.info("🤖 Running AI analysis...")
                    ai_result = ai_analyzer.analyze_resume(
                        text, ranked_skills, sections)
                    if ai_result.get("extracted_skills"):
                        ranked_skills = ai_result["extracted_skills"]
                    if ai_result.get("strengths"):
                        strengths = ai_result["strengths"]
                    if ai_result.get("improvements"):
                        weaknesses = ai_result["improvements"]
                    if ai_result.get("summary"):
                        summary = ai_result["summary"]
                except Exception as ai_err:
                    logger.warning(f"AI enrichment skipped: {ai_err}")

            education_str = text_extractor.format_education_string(education)

            # ── SEMANTIC ANALYSIS (NEW) ─────────────────────────────────────────
            domain_scores = {}
            domain_insights = {}
            semantic_match_score = 0

            if SEMANTIC_AVAILABLE:
                try:
                    logger.info("🧠 Running semantic domain analysis...")
                    domain_scores = analyze_domains(text)
                    domain_insights = format_domain_insights(domain_scores)

                    # Calculate semantic job match if job description provided
                    if job_description and job_description.strip():
                        logger.info("🔗 Calculating semantic job match...")
                        semantic_match_score = semantic_job_match(
                            text, job_description)
                        logger.info(
                            f"📊 Semantic job match score: {semantic_match_score}%")
                    else:
                        logger.info(
                            "No job description provided, skipping semantic job match")
                except Exception as sem_err:
                    logger.error(f"Semantic analysis error: {sem_err}")
                    domain_scores = {}
                    domain_insights = {}
                    semantic_match_score = 0
            else:
                logger.warning(
                    "⚠️ Semantic analyzer not available, skipping analysis")

            skills_categorized = {
                "technical_skills": ranked_skills,
                "soft_skills": [
                    s for s in ranked_skills
                    if s.lower() in {"leadership", "communication", "teamwork",
                                     "problem solving", "critical thinking"}
                ][:5],
                "domain_insights": domain_insights,  # NEW
                "semantic_match_score": semantic_match_score  # NEW
            }

            # ── INCREMENT UPLOAD COUNT ──────────────────────────────────────────
            increment_upload_count(user_id)

            # ── PERSIST TO DATABASE ─────────────────────────────────────────────
            # ADDED: Debug logs for database operations
            logger.info(f"🔍 Looking for user with user_id: {user_id}")

            if user_id and db:
                try:
                    user = db.get_user(user_id)
                    if user:
                        logger.info(f"✅ User found: {user.get('email')}")
                        logger.info(
                            f"📝 Updating user with resume_url: {resume_url}")
                        logger.info(
                            f"📝 Updating user with public_id: {public_id}")

                        user['skills'] = ranked_skills
                        user['ats_score'] = ats_score
                        user['resume_analyzed_at'] = datetime.now().isoformat()
                        user['resume_url'] = resume_url
                        user['resume_public_id'] = public_id
                        # NEW: Store semantic analysis data
                        user['domain_scores'] = domain_scores
                        user['domain_insights'] = domain_insights
                        user['semantic_match_score'] = semantic_match_score
                        db.update_user(user_id, user)
                        logger.info(
                            f"✅ Updated user {user_id} in DB with resume URL and semantic data")
                    else:
                        logger.error(
                            f"❌ User NOT FOUND for user_id: {user_id}")
                except Exception as db_err:
                    logger.error(f"Database update failed: {db_err}")
            else:
                logger.warning(
                    f"⚠️ Skipping database update - user_id: {user_id}, db exists: {db is not None}")

        finally:
            # Always clean up temp file
            try:
                if os.path.exists(temp_path):
                    os.remove(temp_path)
                    logger.info(f"🗑️ Temporary file deleted: {temp_path}")
            except Exception as e:
                logger.error(f"Failed to delete temp file: {e}")

        response_data = {
            "success": True,
            "user_id": user_id,
            "message": "Resume uploaded and analysed successfully",
            "rate_limit": get_upload_stats(user_id),
            "data": {
                "ats_score": ats_score,
                "ats_breakdown": ats_breakdown,
                "extracted_skills": ranked_skills,
                "all_skills_count": len(ranked_skills),
                "experience_years": total_years,
                "education": education_str,
                "summary": summary,
                "strengths": strengths[:5],
                "weaknesses": weaknesses[:5],
                "skills_categorized": skills_categorized,
                "contact": contact,
                "experience": experience[:3],
                "education_details": education[:2],
                "projects": projects[:3],
                "achievements": achievements[:10]
            }
        }

        # Add resume URL if available
        if resume_url:
            response_data["data"]["resume_url"] = resume_url
            response_data["data"]["resume_public_id"] = public_id
            response_data["data"]["cloudinary_stored"] = True
            logger.info(f"✅ Added resume_url to response: {resume_url}")
        else:
            response_data["data"]["cloudinary_stored"] = False
            logger.warning("⚠️ No resume_url added to response")

        logger.info(
            f"Analysis complete: {len(ranked_skills)} skills, ATS score: {ats_score}")
        return jsonify(response_data), 200

    except Exception as e:
        logger.error(f"Upload error: {str(e)}", exc_info=True)
        return jsonify({"success": False, "error": f"Server error: {str(e)}"}), 500


@resume_bp.route('/upload-status', methods=['GET'])
def get_upload_status():
    """Get current user's upload status and remaining uploads"""
    user_id = request.args.get('user_id')

    if not user_id:
        return jsonify({
            "success": False,
            "error": "user_id is required"
        }), 400

    stats = get_upload_stats(user_id)
    logger.info(
        f"Upload status for user {user_id}: {stats['remaining']} remaining")

    return jsonify({
        "success": True,
        "rate_limit": stats,
        "message": f"You have {stats['remaining']} uploads remaining today"
    }), 200


@resume_bp.route('/delete-resume', methods=['DELETE'])
def delete_resume():
    """Delete resume from Cloudinary and database"""
    try:
        data = request.json or {}
        user_id = data.get('user_id')

        if not user_id:
            return jsonify({"success": False, "error": "user_id is required"}), 400

        logger.info(f"🗑️ Deleting resume for user: {user_id}")
        user = db.get_user(user_id) if db else None

        if user and user.get('resume_public_id') and CLOUDINARY_CONFIGURED:
            try:
                # Delete from Cloudinary
                cloudinary.uploader.destroy(
                    user['resume_public_id'], resource_type="image")
                logger.info(
                    f"Deleted resume from Cloudinary: {user['resume_public_id']}")
            except Exception as cloud_err:
                logger.error(f"Failed to delete from Cloudinary: {cloud_err}")

        if user and db:
            # Remove resume data from user
            user['resume_url'] = None
            user['resume_public_id'] = None
            user['resume_analyzed_at'] = None
            db.update_user(user_id, user)
            logger.info(f"Removed resume data from user: {user_id}")

        return jsonify({
            "success": True,
            "message": "Resume deleted successfully"
        }), 200

    except Exception as e:
        logger.error(f"Delete resume error: {str(e)}", exc_info=True)
        return jsonify({"success": False, "error": str(e)}), 500


@resume_bp.route('/compare-with-job', methods=['POST'])
def compare_with_job():
    """Compare resume skills against a job description"""
    try:
        if not skill_extractor:
            return jsonify({"success": False, "error": "Skill extractor not available"}), 500

        data = request.json or {}
        resume_text = data.get('resume_text', '')
        job_description = data.get('job_description', '')

        if not resume_text or not job_description:
            return jsonify({
                "success": False,
                "error": "Both resume_text and job_description are required"
            }), 400

        resume_skills = skill_extractor.extract_skills(resume_text, {})
        job_skills = skill_extractor.extract_skills(job_description, {})

        resume_set = {s.lower() for s in resume_skills}
        job_set = {s.lower() for s in job_skills}
        matching = list(resume_set & job_set)
        missing = list(job_set - resume_set)
        match_pct = round(len(matching) / max(len(job_skills), 1) * 100, 1)

        return jsonify({
            "success": True,
            "resume_skills": resume_skills[:20],
            "job_skills": job_skills[:20],
            "matching_skills": matching[:15],
            "missing_skills": missing[:15],
            "skills_match": {
                "resume_has": len(matching),
                "job_requires": len(job_skills),
                "match_percentage": match_pct,
                "missing_count": len(missing)
            }
        }), 200
    except Exception as e:
        logger.error(f"Comparison error: {str(e)}", exc_info=True)
        return jsonify({"success": False, "error": f"Server error: {str(e)}"}), 500


# ── NEW SEMANTIC ANALYSIS ENDPOINTS ────────────────────────────────────────────

@resume_bp.route('/semantic-match', methods=['POST'])
def semantic_match():
    """Compare resume and job description using semantic analysis"""
    try:
        if not SEMANTIC_AVAILABLE:
            return jsonify({
                "success": False,
                "error": "Semantic analyzer not available. Please check installation."
            }), 503

        data = request.json or {}
        resume_text = data.get('resume_text', '')
        job_description = data.get('job_description', '')

        if not resume_text or not job_description:
            return jsonify({
                "success": False,
                "error": "Both resume_text and job_description are required"
            }), 400

        match_score = semantic_job_match(resume_text, job_description)
        domain_scores = analyze_domains(resume_text)

        return jsonify({
            "success": True,
            "semantic_match_score": match_score,
            "domain_scores": domain_scores,
            "message": f"Semantic match score: {match_score}%"
        }), 200

    except Exception as e:
        logger.error(f"Semantic match error: {str(e)}", exc_info=True)
        return jsonify({"success": False, "error": str(e)}), 500


@resume_bp.route('/domain-analysis', methods=['POST'])
def domain_analysis():
    """Analyze resume domains using semantic AI"""
    try:
        if not SEMANTIC_AVAILABLE:
            return jsonify({
                "success": False,
                "error": "Semantic analyzer not available. Please check installation."
            }), 503

        data = request.json or {}
        resume_text = data.get('resume_text', '')

        if not resume_text:
            return jsonify({
                "success": False,
                "error": "resume_text is required"
            }), 400

        domain_scores = analyze_domains(resume_text)
        domain_insights = format_domain_insights(domain_scores)

        return jsonify({
            "success": True,
            "domain_scores": domain_scores,
            "domain_insights": domain_insights
        }), 200

    except Exception as e:
        logger.error(f"Domain analysis error: {str(e)}", exc_info=True)
        return jsonify({"success": False, "error": str(e)}), 500
