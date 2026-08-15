from flask import request, jsonify
import logging

logger = logging.getLogger(__name__)


def register_interview_routes(api_bp, interview_service):
    """Registers the interview routes directly to the main API blueprint."""

    # Attach directly to the passed blueprint, explicitly allowing OPTIONS
    @api_bp.route('/evaluate-interview', methods=['POST', 'OPTIONS'])
    def evaluate_interview():
        # Handle CORS Preflight request explicitly
        if request.method == 'OPTIONS':
            return jsonify({}), 200

        try:
            data = request.json
            question = data.get('question')
            answer = data.get('answer')
            role = data.get('role', 'developer')

            if not question or not answer:
                return jsonify({"error": "Missing question or answer"}), 400

            # Pass the data to your service layer
            evaluation = interview_service.evaluate_answer(
                question, answer, role)

            return jsonify(evaluation), 200

        except ValueError as ve:
            logger.error(f"Configuration error: {ve}")
            return jsonify({"error": str(ve)}), 503
        except Exception as e:
            logger.error(f"Interview evaluation error: {e}")
            return jsonify({"error": "Failed to evaluate answer"}), 500
