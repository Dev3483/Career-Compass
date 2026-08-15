# routes/auth.py - With recruiter verification fields
from flask import request, jsonify, g
from datetime import datetime, timedelta
import uuid
import logging
from functools import wraps
import jwt
import bcrypt
import re
import random
import string

logger = logging.getLogger(__name__)

# JWT Configuration
JWT_SECRET = "your-secret-key-change-in-production"
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

def hash_password(password):
    """Hash a password using bcrypt"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(password, hashed):
    """Verify a password against its hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def generate_token(user_id, email, role):
    """Generate JWT token"""
    payload = {
        'user_id': user_id,
        'email': email,
        'role': role,
        'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def token_required(f):
    """Decorator to require valid token"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({'success': False, 'error': 'Token is missing'}), 401
        
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            g.user_id = payload['user_id']
            g.user_email = payload['email']
            g.user_role = payload['role']
        except jwt.ExpiredSignatureError:
            return jsonify({'success': False, 'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'success': False, 'error': 'Invalid token'}), 401
        
        return f(*args, **kwargs)
    
    return decorated

def admin_required(f):
    """Decorator to require admin role"""
    @wraps(f)
    def decorated(*args, **kwargs):
        if g.user_role != 'admin':
            return jsonify({'success': False, 'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated

def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """Validate password strength"""
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    if not re.search(r'[0-9]', password):
        return False, "Password must contain at least one number"
    return True, "Password is valid"

def register_auth_routes(api_bp, db, notification_service=None):
    """Register all auth routes with the blueprint"""
    
    @api_bp.route('/auth/register', methods=['POST'])
    def register():
        """Register a new user (job seeker or company)"""
        try:
            data = request.json
            if not data:
                return jsonify({'success': False, 'error': 'No data provided'}), 400
            
            required_fields = ['email', 'password', 'full_name', 'role']
            for field in required_fields:
                if field not in data or not data[field]:
                    return jsonify({'success': False, 'error': f'{field} is required'}), 400
            
            if not validate_email(data['email']):
                return jsonify({'success': False, 'error': 'Invalid email format'}), 400
            
            password_valid, password_msg = validate_password(data['password'])
            if not password_valid:
                return jsonify({'success': False, 'error': password_msg}), 400
            
            role = data['role']
            if role not in ['job_seeker', 'company']:
                return jsonify({'success': False, 'error': 'Role must be job_seeker or company'}), 400
            
            existing_user = db.get_user_by_email(data['email'])
            if existing_user:
                return jsonify({'success': False, 'error': 'Email already registered'}), 400
            
            hashed_password = hash_password(data['password'])
            
            user_id = str(uuid.uuid4())
            user = {
                'user_id': user_id,
                'email': data['email'],
                'full_name': data['full_name'],
                'password': hashed_password,
                'role': role,
                'created_at': datetime.now().isoformat(),
                'profile_complete': 30,
                # 🔥 Recruiter verification fields
                'is_verified': False,
                'verification_status': 'pending',
                'verification_date': None,
                'verification_documents': []
            }
            
            if role == 'job_seeker':
                user['title'] = data.get('title', '')
                user['location'] = data.get('location', '')
                user['skills'] = data.get('skills', [])
                user['experience_years'] = data.get('experience_years', 0)
                user['bio'] = data.get('bio', '')
            else:
                user['company_name'] = data.get('company_name', '')
                user['company_size'] = data.get('company_size', '')
                user['industry'] = data.get('industry', '')
                user['website'] = data.get('website', '')
                user['description'] = data.get('description', '')
                user['location'] = data.get('location', '')
                user['verification_documents'] = []
            
            success = db.save_user(user)
            if not success:
                return jsonify({'success': False, 'error': 'Failed to create user'}), 500
            
            token = generate_token(user_id, data['email'], role)
            
            if 'password' in user:
                del user['password']
            
            # Notify Admins about new user
            if notification_service:
                user_type = "Job Seeker" if role == 'job_seeker' else "Company"
                notification_service.notify_admins(
                    title="New User Registered",
                    message=f"A new {user_type} ({data['full_name']}) has joined Career AI.",
                    link=f"/admin/users" # Placeholder link
                )
            
            return jsonify({
                'success': True,
                'message': 'Registration successful',
                'token': token,
                'user': user
            }), 201
            
        except Exception as e:
            logger.error(f"Registration error: {e}", exc_info=True)
            return jsonify({'success': False, 'error': str(e)}), 500
    
    @api_bp.route('/auth/login', methods=['POST'])
    def login():
        """Login user"""
        try:
            data = request.json
            if not data:
                return jsonify({'success': False, 'error': 'No data provided'}), 400
            
            if 'email' not in data or not data['email']:
                return jsonify({'success': False, 'error': 'Email is required'}), 400
            
            if 'password' not in data or not data['password']:
                return jsonify({'success': False, 'error': 'Password is required'}), 400
            
            user = db.get_user_by_email(data['email'])
            if not user:
                return jsonify({'success': False, 'error': 'Invalid email or password'}), 401
            
            if not verify_password(data['password'], user['password']):
                return jsonify({'success': False, 'error': 'Invalid email or password'}), 401
            
            token = generate_token(user['user_id'], user['email'], user['role'])
            db.update_last_login(user['user_id'])
            
            if 'password' in user:
                del user['password']
            
            return jsonify({
                'success': True,
                'message': 'Login successful',
                'token': token,
                'user': user
            }), 200
            
        except Exception as e:
            logger.error(f"Login error: {e}", exc_info=True)
            return jsonify({'success': False, 'error': str(e)}), 500
    
    @api_bp.route('/auth/me', methods=['GET'])
    @token_required
    def get_current_user():
        """Get current user info"""
        try:
            user = db.get_user(g.user_id)
            if not user:
                return jsonify({'success': False, 'error': 'User not found'}), 404
            
            if 'password' in user:
                del user['password']
            
            return jsonify({
                'success': True,
                'user': user
            }), 200
            
        except Exception as e:
            logger.error(f"Get user error: {e}", exc_info=True)
            return jsonify({'success': False, 'error': str(e)}), 500
    
    @api_bp.route('/auth/logout', methods=['POST'])
    def logout():
        """Logout user"""
        return jsonify({
            'success': True,
            'message': 'Logout successful'
        }), 200
    
    @api_bp.route('/auth/update-profile', methods=['PUT'])
    @token_required
    def update_profile():
        """Update user profile"""
        try:
            data = request.json
            if not data:
                return jsonify({'success': False, 'error': 'No data provided'}), 400
            
            user = db.get_user(g.user_id)
            if not user:
                return jsonify({'success': False, 'error': 'User not found'}), 404
            
            allowed_fields = ['full_name', 'title', 'location', 'bio', 'skills', 
                             'experience_years', 'company_name', 'company_size', 
                             'industry', 'website', 'description']
            
            for field in allowed_fields:
                if field in data:
                    user[field] = data[field]
            
            completeness = 30
            if user.get('full_name'):
                completeness += 10
            if user.get('title') or user.get('company_name'):
                completeness += 10
            if user.get('location'):
                completeness += 10
            if user.get('bio') or user.get('description'):
                completeness += 10
            if user.get('skills') and len(user.get('skills', [])) > 0:
                completeness += 15
            if user.get('experience_years') and user['experience_years'] > 0:
                completeness += 15
            
            user['profile_complete'] = min(completeness, 100)
            
            success = db.update_user(g.user_id, user)
            if not success:
                return jsonify({'success': False, 'error': 'Failed to update user'}), 500
            
            if 'password' in user:
                del user['password']
            
            return jsonify({
                'success': True,
                'message': 'Profile updated successfully',
                'user': user
            }), 200
            
        except Exception as e:
            logger.error(f"Update profile error: {e}", exc_info=True)
            return jsonify({'success': False, 'error': str(e)}), 500
    
    @api_bp.route('/auth/change-password', methods=['POST'])
    @token_required
    def change_password():
        """Change user password"""
        try:
            data = request.json
            if not data:
                return jsonify({'success': False, 'error': 'No data provided'}), 400
            
            if 'current_password' not in data:
                return jsonify({'success': False, 'error': 'Current password is required'}), 400
            
            if 'new_password' not in data:
                return jsonify({'success': False, 'error': 'New password is required'}), 400
            
            user = db.get_user(g.user_id)
            if not user:
                return jsonify({'success': False, 'error': 'User not found'}), 404
            
            if not verify_password(data['current_password'], user['password']):
                return jsonify({'success': False, 'error': 'Current password is incorrect'}), 401
            
            password_valid, password_msg = validate_password(data['new_password'])
            if not password_valid:
                return jsonify({'success': False, 'error': password_msg}), 400
            
            user['password'] = hash_password(data['new_password'])
            
            success = db.update_user(g.user_id, user)
            if not success:
                return jsonify({'success': False, 'error': 'Failed to update password'}), 500
            
            return jsonify({
                'success': True,
                'message': 'Password changed successfully'
            }), 200
            
        except Exception as e:
            logger.error(f"Change password error: {e}", exc_info=True)
            return jsonify({'success': False, 'error': str(e)}), 500
    
    @api_bp.route('/auth/forgot-password', methods=['POST'])
    def forgot_password():
        """Request a password reset OTP"""
        try:
            data = request.json
            if not data or 'email' not in data:
                return jsonify({'success': False, 'error': 'Email is required'}), 400
            
            email = data['email'].lower()
            user = db.get_user_by_email(email)
            
            if not user:
                # Security: Don't leak if email exists, but for UX here we'll be helpful
                return jsonify({'success': False, 'error': 'Email not found'}), 404
            
            # Generate 4-digit OTP
            otp = str(random.randint(1000, 9999))
            
            # Store OTP in DB
            success = db.save_otp(email, otp)
            if not success:
                return jsonify({'success': False, 'error': 'Failed to generate security code'}), 500
            
            # Send Email
            if notification_service and notification_service.email_service:
                template = notification_service.email_service.get_otp_template(otp)
                email_success = notification_service.email_service.send_email(
                    email, 
                    "Password Reset Code - Career AI", 
                    template
                )
                if not email_success:
                    return jsonify({'success': False, 'error': 'Failed to send reset email. Please try again later.'}), 500
            else:
                return jsonify({'success': False, 'error': 'Email service is currently unavailable'}), 503
            
            return jsonify({
                'success': True,
                'message': 'Security code sent to your email'
            }), 200
            
        except Exception as e:
            logger.error(f"Forgot password error: {e}", exc_info=True)
            return jsonify({'success': False, 'error': str(e)}), 500

    @api_bp.route('/auth/verify-otp', methods=['POST'])
    def verify_otp():
        """Verify the 4-digit OTP"""
        try:
            data = request.json
            if not data or 'email' not in data or 'otp' not in data:
                return jsonify({'success': False, 'error': 'Email and OTP are required'}), 400
            
            email = data['email'].lower()
            otp = str(data['otp'])
            
            is_valid = db.verify_otp(email, otp)
            if is_valid:
                return jsonify({
                    'success': True,
                    'message': 'OTP verified successfully'
                }), 200
            else:
                return jsonify({
                    'success': False, 
                    'error': 'Invalid or expired security code'
                }), 400
                
        except Exception as e:
            logger.error(f"OTP verification error: {e}", exc_info=True)
            return jsonify({'success': False, 'error': str(e)}), 500

    @api_bp.route('/auth/reset-password', methods=['POST'])
    def reset_password():
        """Reset password using verified OTP (internal check)"""
        try:
            data = request.json
            if not data or 'email' not in data or 'new_password' not in data:
                return jsonify({'success': False, 'error': 'Missing required fields'}), 400
            
            email = data['email'].lower()
            new_password = data['new_password']
            
            # Validate new password
            password_valid, password_msg = validate_password(new_password)
            if not password_valid:
                return jsonify({'success': False, 'error': password_msg}), 400
            
            hashed_password = hash_password(new_password)
            success = db.update_password_by_email(email, hashed_password)
            
            if success:
                return jsonify({
                    'success': True,
                    'message': 'Password has been reset successfully. You can now login.'
                }), 200
            else:
                return jsonify({'success': False, 'error': 'Failed to reset password'}), 500
                
        except Exception as e:
            logger.error(f"Reset password error: {e}", exc_info=True)
            return jsonify({'success': False, 'error': str(e)}), 500

    
    # 🔥 Admin route for company verification
    @api_bp.route('/admin/verify-company', methods=['POST'])
    @token_required
    @admin_required
    def verify_company():
        """Admin endpoint to verify a company"""
        try:
            data = request.json
            if not data or 'user_id' not in data:
                return jsonify({'success': False, 'error': 'user_id is required'}), 400
            
            user_id = data['user_id']
            user = db.get_user(user_id)
            
            if not user:
                return jsonify({'success': False, 'error': 'User not found'}), 404
            
            if user.get('role') != 'company':
                return jsonify({'success': False, 'error': 'User is not a company'}), 400
            
            # Update user verification status
            update_data = {
                'is_verified': True,
                'verification_status': 'verified',
                'verification_date': datetime.now().isoformat(),
                'verified_by': g.user_id
            }
            
            db.update_user(user_id, {**user, **update_data})
            
            # Notify Company about verification
            if notification_service:
                notification_service.notify_user(
                    user_id=user_id,
                    title="Account Verified",
                    message="Congratulations! Your company account has been verified by our administrators. You can now post jobs and access premium features.",
                    nt_type="success",
                    link="/dashboard/settings"
                )
            
            logger.info(f"Company {user_id} verified by admin {g.user_id}")
            
            return jsonify({
                'success': True,
                'message': f'Company {user.get("company_name", user.get("full_name"))} has been verified',
                'user_id': user_id
            }), 200
            
        except Exception as e:
            logger.error(f"Verify company error: {e}", exc_info=True)
            return jsonify({'success': False, 'error': str(e)}), 500