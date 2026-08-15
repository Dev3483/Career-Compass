# routes/company.py
from flask import Blueprint, request, jsonify, session
from services.database import Database
import logging
import uuid
from datetime import datetime

logger = logging.getLogger(__name__)

# Create blueprint
company_bp = Blueprint('company', __name__, url_prefix='/api/company')

# Initialize database (will be set from app)
db = None


def init_company_routes(database_instance):
    """Initialize company routes with database instance"""
    global db
    db = database_instance
    logger.info("Company routes initialized with database")


@company_bp.route('/jobs', methods=['GET'])
def get_company_jobs():
    """Get all jobs for the logged-in company"""
    try:
        # Get user_id from query parameter or session
        user_id = request.args.get('user_id') or session.get('user_id')

        if not user_id:
            return jsonify({
                "success": False,
                "error": "User ID required"
            }), 400

        # Get user to verify role
        user = db.get_user(user_id)
        if not user or user.get('role') != 'company':
            return jsonify({
                "success": False,
                "error": "Unauthorized - Company access only"
            }), 403

        # Get company jobs
        jobs = db.get_company_jobs_by_company_id(user_id)

        return jsonify({
            "success": True,
            "jobs": jobs
        }), 200

    except Exception as e:
        logger.error(f"Error in get_company_jobs: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@company_bp.route('/applications/<job_id>', methods=['GET'])
def get_job_applications(job_id):
    """Get all applications for a specific job"""
    try:
        # Verify company owns this job
        user_id = request.args.get('user_id') or session.get('user_id')

        if not user_id:
            return jsonify({
                "success": False,
                "error": "User ID required"
            }), 400

        # Get the job to verify ownership
        job = db.get_job_by_id(job_id)
        if not job:
            return jsonify({
                "success": False,
                "error": "Job not found"
            }), 404

        if job.get('company_id') != user_id:
            return jsonify({
                "success": False,
                "error": "Unauthorized - You don't own this job"
            }), 403

        # Get applications with user details
        applications = db.get_job_applications_with_details(job_id)

        return jsonify({
            "success": True,
            "applications": applications
        }), 200

    except Exception as e:
        logger.error(f"Error in get_job_applications: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@company_bp.route('/applications/update-status', methods=['POST'])
def update_application_status():
    """Update the status of an application"""
    try:
        data = request.get_json()
        application_id = data.get('application_id')
        new_status = data.get('status')
        user_id = data.get('user_id') or session.get('user_id')

        if not application_id or not new_status:
            return jsonify({
                "success": False,
                "error": "Application ID and status required"
            }), 400

        # Get application to verify ownership
        app = db.db.applications.find_one({"application_id": application_id})
        if not app:
            return jsonify({
                "success": False,
                "error": "Application not found"
            }), 404

        # Get job to verify company owns it
        job = db.get_job_by_id(app.get('job_id'))
        if not job or job.get('company_id') != user_id:
            return jsonify({
                "success": False,
                "error": "Unauthorized"
            }), 403

        # Update status
        success = db.update_application_status(application_id, new_status)

        if success:
            return jsonify({
                "success": True,
                "message": f"Application status updated to {new_status}"
            }), 200
        else:
            return jsonify({
                "success": False,
                "error": "Failed to update status"
            }), 500

    except Exception as e:
        logger.error(f"Error in update_application_status: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@company_bp.route('/all-applications', methods=['GET'])
def get_all_company_applications():
    """Get all applications for all jobs of the company"""
    try:
        user_id = request.args.get('user_id') or session.get('user_id')

        if not user_id:
            return jsonify({
                "success": False,
                "error": "User ID required"
            }), 400

        # Verify company role
        user = db.get_user(user_id)
        if not user or user.get('role') != 'company':
            return jsonify({
                "success": False,
                "error": "Unauthorized"
            }), 403

        # Get all applications for company
        applications = db.get_applications_by_company(user_id)

        return jsonify({
            "success": True,
            "applications": applications
        }), 200

    except Exception as e:
        logger.error(f"Error in get_all_company_applications: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
