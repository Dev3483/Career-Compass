from flask import request, jsonify
import sqlite3
import logging
from services.career_chat_service import CareerChatService

logger = logging.getLogger(__name__)

try:
    career_chat_service = CareerChatService()
    logger.info("✅ Career Chat Service initialized")
except Exception as e:
    logger.error(f"❌ Failed to initialize Career Chat Service: {e}")
    career_chat_service = None


def register_career_chat_routes(api_bp):

    @api_bp.route('/career-chat', methods=['POST'])
    def career_chat():
        try:
            data = request.get_json()
            if not data:
                return jsonify({"error": "No data provided"}), 400

            message = data.get("message", "")
            user_id = data.get("user_id", "")
            # ✨ Extract current frontend transcript
            transcript = data.get("transcript", [])

            if not message:
                return jsonify({"error": "Message required"}), 400

            if not user_id:
                return jsonify({"error": "User ID required"}), 400

            if career_chat_service is None:
                return jsonify({"error": "Career chat service not available"}), 503

            # ✨ Pass transcript to service
            response = career_chat_service.process_chat(
                message, user_id, transcript)
            return jsonify(response), 200

        except Exception as e:
            logger.error(f"Career chat error: {e}", exc_info=True)
            return jsonify({"error": str(e)}), 500

    @api_bp.route('/career-chat-test', methods=['GET'])
    def career_chat_test():
        return jsonify({
            "status": "ok",
            "service_available": career_chat_service is not None,
            "message": "Career chat endpoint is reachable"
        }), 200

    @api_bp.route('/career-chat/history/<user_id>', methods=['GET'])
    def get_chat_history(user_id):
        try:
            conn = sqlite3.connect('career_chatbot.db')
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()

            # ✨ Added id and chat_transcript to the fetch
            cursor.execute('''
                SELECT id, timestamp, top_prediction, confidence, domain, education_level, chat_transcript
                FROM user_history 
                WHERE user_id = ? 
                ORDER BY timestamp DESC
            ''', (user_id,))

            rows = cursor.fetchall()
            history = [dict(row) for row in rows]
            conn.close()

            return jsonify({"history": history}), 200
        except Exception as e:
            logger.error(f"History fetch error: {e}")
            return jsonify({"error": "Could not fetch history"}), 500
