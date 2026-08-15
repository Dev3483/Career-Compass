# routes/filters.py - Enhanced with sorting and verification options
from flask import jsonify
import logging

logger = logging.getLogger(__name__)

def register_filters_routes(api_bp):
    """Register filter-related routes with the blueprint"""
    
    @api_bp.route('/filter-options', methods=['GET'])
    def get_filter_options():
        """Get filter options for job search"""
        return jsonify({
            "success": True,
            "options": {
                "job_types": ["all", "remote", "onsite", "hybrid", "full_time", "part_time", "contract", "internship"],
                "date_ranges": ["any", "day", "week", "month"],
                "min_match_percentages": [0, 50, 60, 70, 80, 90],
                "min_authenticity_scores": [0, 50, 60, 70, 80, 90],
                "order_by": ["match", "date", "salary", "authenticity"],
                "verification": ["all", "verified", "scraped"],
                "salary_ranges": [
                    {"label": "Any", "value": None},
                    {"label": "$50,000+", "value": 50000},
                    {"label": "$75,000+", "value": 75000},
                    {"label": "$100,000+", "value": 100000},
                    {"label": "$150,000+", "value": 150000}
                ]
            }
        }), 200