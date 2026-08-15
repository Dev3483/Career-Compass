# backend/routes/notifications.py
from flask import Blueprint, request, jsonify, g
from .auth import token_required
import logging

logger = logging.getLogger(__name__)

# Create blueprint
notifications_bp = Blueprint('notifications', __name__, url_prefix='/api/notifications')

# Initialize with database (will be set from app)
db = None
notification_service = None

def init_notifications_routes(database_instance, service_instance):
    """Initialize notification routes with dependencies"""
    global db, notification_service
    db = database_instance
    notification_service = service_instance
    logger.info("Notification routes initialized")

@notifications_bp.route('', methods=['GET'])
@token_required
def get_notifications():
    """Get notifications for current user"""
    try:
        limit = request.args.get('limit', 50, type=int)
        notifications = db.get_notifications(g.user_id, limit)
        
        # Calculate unread count
        unread_count = sum(1 for n in notifications if not n.get('is_read'))
        
        return jsonify({
            "success": True,
            "notifications": notifications,
            "unread_count": unread_count
        }), 200
    except Exception as e:
        logger.error(f"Error getting notifications: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@notifications_bp.route('/<notification_id>/read', methods=['PATCH'])
@token_required
def mark_read(notification_id):
    """Mark notification as read"""
    try:
        success = db.mark_notification_as_read(notification_id)
        return jsonify({"success": success}), 200
    except Exception as e:
        logger.error(f"Error marking notification as read: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@notifications_bp.route('/<notification_id>', methods=['DELETE'])
@token_required
def delete_notification(notification_id):
    """Delete a notification"""
    try:
        success = db.delete_notification(notification_id)
        return jsonify({"success": success}), 200
    except Exception as e:
        logger.error(f"Error deleting notification: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@notifications_bp.route('/clear-all', methods=['DELETE'])
@token_required
def clear_all():
    """Clear all notifications for user"""
    try:
        success = db.clear_all_notifications(g.user_id)
        return jsonify({"success": success}), 200
    except Exception as e:
        logger.error(f"Error clearing notifications: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@notifications_bp.route('/settings', methods=['PATCH'])
@token_required
def update_settings():
    """Update notification preferences"""
    try:
        settings = request.json
        if not settings:
            return jsonify({"success": False, "error": "No settings provided"}), 400
            
        success = db.update_notification_settings(g.user_id, settings)
        return jsonify({
            "success": success,
            "message": "Notification preferences updated successfully"
        }), 200
    except Exception as e:
        logger.error(f"Error updating notification settings: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@notifications_bp.route('/test-email', methods=['POST'])
@token_required
def test_email():
    """Test SMTP configuration by sending a test email"""
    try:
        if not notification_service:
            return jsonify({"success": False, "error": "Notification service not initialized"}), 500
            
        success = notification_service.notify_user(
            g.user_id, 
            "Test Notification", 
            "This is a test notification from Career AI to verify your email settings.",
            nt_type="info"
        )
        
        return jsonify({
            "success": success,
            "message": "Test notification sent. Please check your inbox and dashboard."
        }), 200
    except Exception as e:
        logger.error(f"Error testing email: {e}")
        return jsonify({"success": False, "error": str(e)}), 500
