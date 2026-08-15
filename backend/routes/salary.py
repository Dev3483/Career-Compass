# routes/salary.py
from flask import request, jsonify
import logging
from services.salary_service import SkillBasedSalaryPredictor

logger = logging.getLogger(__name__)

# Initialize the service safely
try:
    salary_service = SkillBasedSalaryPredictor()
    logger.info("✅ Salary Prediction Service initialized")
except Exception as e:
    logger.error(f"❌ Failed to initialize Salary Service: {e}")
    salary_service = None

def register_salary_routes(api_bp):

    @api_bp.route('/predict-salary', methods=['POST'])
    def predict_salary():
        try:
            data = request.get_json()
            if not data:
                return jsonify({"success": False, "error": "No data provided"}), 400

            if salary_service is None:
                return jsonify({"success": False, "error": "Salary service not available"}), 503

            # Extract variables with safe defaults
            experience_years = data.get('experience_years', 0)
            skills = data.get('skills', [])
            role = data.get('role', 'Frontend Developer')
            location = data.get('location', 'Bangalore')
            margin = data.get('margin', 0.15)

            # Process prediction via the service
            result = salary_service.predict(
                experience_years=experience_years, 
                skills=skills,
                role=role, 
                location=location,
                margin=margin
            )
            
            return jsonify({
                "success": True, 
                "salary_prediction": result
            }), 200

        except Exception as e:
            logger.error(f"Salary Prediction error: {e}", exc_info=True)
            return jsonify({"success": False, "error": str(e)}), 500

    @api_bp.route('/predict-salary-test', methods=['GET'])
    def predict_salary_test():
        """Test endpoint to verify salary module is working"""
        return jsonify({
            "status": "ok",
            "service_available": salary_service is not None,
            "has_ml_model": salary_service.has_ml if salary_service else False,
            "message": "Salary prediction endpoint is reachable"
        }), 200