# app.py
from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import sys
import logging
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Add the src directory to the path
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'src'))

# Import routes
from routes.chat_routes import chat_bp
from utils.logger import setup_logger

# Set up logger
logger = setup_logger("app")

def create_app():
    """
    Create and configure the Flask application
    """
    app = Flask(__name__)
    
    # Configure CORS
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    # Register blueprints
    app.register_blueprint(chat_bp)
    
    # Root route
    @app.route('/')
    def index():
        return jsonify({
            "service": "Portfolio Chatbot API",
            "status": "operational",
            "endpoints": {
                "chat": "/api/chat",
                "health": "/api/chat/health",
                "test": "/api/chat/test"
            }
        })
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            "error": "Not found",
            "status": "error"
        }), 404
    
    @app.errorhandler(405)
    def method_not_allowed(error):
        return jsonify({
            "error": "Method not allowed",
            "status": "error"
        }), 405
    
    @app.errorhandler(500)
    def server_error(error):
        logger.error(f"Server error: {str(error)}")
        return jsonify({
            "error": "Internal server error",
            "status": "error"
        }), 500
    
    # Request logging middleware
    @app.before_request
    def log_request_info():
        if not request.path.startswith('/api/chat/health'):  # Don't log health checks
            logger.info(f"Request: {request.method} {request.path} from {request.remote_addr}")
    
    return app

# Create the application instance
app = create_app()

if __name__ == '__main__':
    # Get port from environment or use default
    port = int(os.environ.get('PORT', 5000))
    
    # Start the Flask application
    app.run(host='0.0.0.0', port=port, debug=os.environ.get('FLASK_DEBUG', 'False').lower() == 'true')