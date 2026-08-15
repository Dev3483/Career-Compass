# backend/services/email_service.py
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import logging

from dotenv import load_dotenv

logger = logging.getLogger(__name__)

class EmailService:
    """Service to handle sending emails via SMTP"""
    
    def __init__(self):
        # Explicitly reload .env to catch changes without restart
        load_dotenv(override=True)
        
        self.smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_user = os.getenv("SMTP_USER")
        self.smtp_pass = os.getenv("SMTP_PASS")
        self.smtp_from = os.getenv("SMTP_FROM", self.smtp_user)
        
        # Validation
        missing = []
        if not self.smtp_host: missing.append("SMTP_HOST")
        if not self.smtp_user: missing.append("SMTP_USER")
        if not self.smtp_pass: missing.append("SMTP_PASS")
        
        self.enabled = len(missing) == 0
        if not self.enabled:
            logger.warning(f"EmailService: SMTP disabled. Missing variables: {', '.join(missing)}")
        else:
            logger.info(f"EmailService: SMTP enabled for {self.smtp_user}")

    def send_email(self, to_email, subject, body_html):
        """Send an HTML email"""
        if not self.enabled:
            logger.info(f"EmailService: Skipping email to {to_email} (service disabled)")
            return False
            
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = self.smtp_from
            msg["To"] = to_email
            
            # Create HTML part
            html_part = MIMEText(body_html, "html")
            msg.attach(html_part)
            
            # Connect and send
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_pass)
                server.send_message(msg)
                
            logger.info(f"EmailService: Sent email to {to_email} with subject: {subject}")
            return True
        except Exception as e:
            logger.error(f"EmailService error sending message to {to_email}: {e}")
            return False

    def get_notification_template(self, title, message, link=None):
        """Generate a basic HTML template for notifications"""
        link_html = f'<p><a href="{link}" style="display:inline-block;background:#6C63FF;color:white;padding:10px 20px;text-decoration:none;border-radius:8px;">View Details</a></p>' if link else ""
        
        return f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #6C63FF;">{title}</h2>
                    <p>{message}</p>
                    {link_html}
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #888;">
                        You received this email because you have notifications enabled in your Career AI account.
                        You can change your preferences in the <a href="http://localhost:5173/dashboard/settings">Settings</a> menu.
                    </p>
                </div>
            </body>
        </html>
        """

    def get_otp_template(self, otp):
        """Generate HTML template for 4-digit OTP"""
        return f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; padding: 20px;">
                <div style="max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 16px; border: 1px solid #eee; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                    <div style="background: #6C63FF; width: 60px; height: 60px; border-radius: 12px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                        <span style="color: white; font-size: 30px; font-weight: bold; line-height: 55px;">🔑</span>
                    </div>
                    <h2 style="color: #1a1a1a; margin-bottom: 10px;">Reset Your Password</h2>
                    <p style="color: #666; font-size: 16px; margin-bottom: 25px;">Use the 4-digit code below to verify your identity. This code will expire in 5 minutes.</p>
                    
                    <div style="display: inline-block; letter-spacing: 15px; font-size: 40px; font-weight: 800; color: #6C63FF; background: #f0f0ff; padding: 15px 30px; border-radius: 12px; margin-bottom: 25px; border: 2px dashed #6C63FF;">
                        {otp}
                    </div>
                    
                    <p style="color: #999; font-size: 13px;">If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">
                    <p style="color: #bcbcbc; font-size: 11px;">© 2026 Career AI. All rights reserved.</p>
                </div>
            </body>
        </html>
        """

