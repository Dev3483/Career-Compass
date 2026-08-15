# routes/health.py
from flask import jsonify
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

def register_health_routes(api_bp, background_manager, job_scraper):
    """Register health check routes with the blueprint"""
    
    @api_bp.route('/health', methods=['GET'])
    def health_check():
        """Health check endpoint"""
        status = background_manager.get_status()
        
        return jsonify({
            "status": "healthy",
            "service": "Career AI Backend",
            "timestamp": datetime.now().isoformat(),
            "queue_size": status["queue_size"],
            "threads_alive": status["threads_alive"],
            "cached_results": status["cached_results"],
            "scraper_mode": job_scraper.mode
        }), 200
    
    @api_bp.route('/db-health', methods=['GET'])
    def db_health_check():
        """Database health check"""
        try:
            health_status = db.health_check()
            return jsonify(health_status), 200
        except Exception as e:
            logger.error(f"❌ DB health check error: {e}")
            return jsonify({
                "status": "unhealthy",
                "error": str(e)
            }), 500