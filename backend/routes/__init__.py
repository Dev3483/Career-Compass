# routes/__init__.py
from .jobs import register_jobs_routes
from .career_chat import register_career_chat_routes
from . import auth, jobs, health, filters, resume_intelligence, career_chat, company, candidates, skill_gap
from flask import Blueprint

# Create main blueprint
api_bp = Blueprint('api', __name__, url_prefix='/api')

# Import all route modules to register them
from .auth import register_auth_routes
