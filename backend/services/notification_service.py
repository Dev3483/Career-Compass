# backend/services/notification_service.py
import logging
from .email_service import EmailService

logger = logging.getLogger(__name__)

class NotificationService:
    """Orchestrator for managing and sending notifications"""
    
    def __init__(self, db):
        self.db = db
        self.email_service = EmailService()
        logger.info("NotificationService initialized")

    def notify_user(self, user_id, title, message, nt_type="info", link=None):
        """
        Send a notification to a specific user.
        Persists to DB and optionally sends email based on user settings.
        """
        try:
            # 1. Save to database
            notification_doc = {
                "user_id": user_id,
                "title": title,
                "message": message,
                "type": nt_type,
                "link": link
            }
            self.db.save_notification(notification_doc)
            
            # 2. Check user settings for email
            user = self.db.get_user(user_id)
            if not user:
                return False
                
            settings = user.get("notification_settings", {})
            
            # Default to True if setting doesn't exist (if email_service is enabled)
            email_enabled = settings.get("email_notifications", True)
            
            # Additional type-specific checks
            type_enabled = True
            if nt_type == "job_match":
                type_enabled = settings.get("job_alerts", True)
            
            if email_enabled and type_enabled and user.get("email"):
                subject = f"Career AI: {title}"
                html_body = self.email_service.get_notification_template(title, message, link)
                self.email_service.send_email(user["email"], subject, html_body)
                
            return True
        except Exception as e:
            logger.error(f"Error in notify_user for {user_id}: {e}")
            return False

    def notify_admins(self, title, message, link=None):
        """Send a notification to all administrators"""
        try:
            admins = self.db.get_users_by_role("admin")
            for admin in admins:
                self.notify_user(admin["user_id"], title, message, nt_type="admin", link=link)
            return True
        except Exception as e:
            logger.error(f"Error notifying admins: {e}")
            return False

    def notify_role(self, role, title, message, nt_type="info", link=None):
        """Notify all users with a specific role"""
        try:
            users = self.db.get_users_by_role(role)
            for user in users:
                self.notify_user(user["user_id"], title, message, nt_type=nt_type, link=link)
            return True
        except Exception as e:
            logger.error(f"Error notifying role {role}: {e}")
            return False
