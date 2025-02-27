# src/routes/chat_routes.py
from flask import Blueprint, request, jsonify
import sys
import os
import time

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services.response_manager import ResponseManager
from utils.logger import setup_logger

# Set up logger
logger = setup_logger("chat_routes")

# Create Blueprint
chat_bp = Blueprint('chat', __name__)

# Initialize response manager
response_manager = ResponseManager()

@chat_bp.route('/api/chat', methods=['POST'])
def chat():
    """
    Endpoint for chat interactions
    
    Expected JSON request body:
    {
        "message": "User message text",
        "conversation_id": "optional-id-for-session",
        "history": [] // optional conversation history
    }
    
    Returns:
    {
        "response": "Assistant response",
        "source": "local/azure/fallback",
        "confidence": 0.85,
        "intent": "detected_intent",
        "processing_time": 0.25
    }
    """
    start_time = time.time()
    
    try:
        # Get request data
        data = request.json
        
        if not data:
            return jsonify({
                "error": "No data provided",
                "status": "error"
            }), 400
        
        # Extract message
        message = data.get('message', '').strip()
        if not message:
            return jsonify({
                "error": "No message provided",
                "status": "error"
            }), 400
        
        # Extract optional conversation history
        conversation_id = data.get('conversation_id')
        history = data.get('history', [])
        
        # Log incoming request
        logger.info(f"Received chat request: {message[:50]}... (conversation_id: {conversation_id})")
        
        # Get response from manager
        result = response_manager.get_response(message, history)
        
        # Calculate processing time
        processing_time = time.time() - start_time
        
        # Prepare response
        response = {
            "response": result["response"],
            "source": result["source"],
            "confidence": result["confidence"],
            "intent": result["intent"],
            "processing_time": round(processing_time, 3),
            "status": "success"
        }
        
        logger.info(f"Response sent: {result['source']}, intent: {result['intent']}, time: {processing_time:.3f}s")
        
        return jsonify(response), 200
        
    except Exception as e:
        # Log error
        logger.error(f"Error processing chat request: {str(e)}")
        
        # Calculate processing time even for errors
        processing_time = time.time() - start_time
        
        # Return error response
        return jsonify({
            "error": "Failed to process your request",
            "details": str(e),
            "processing_time": round(processing_time, 3),
            "status": "error"
        }), 500

@chat_bp.route('/api/chat/health', methods=['GET'])
def health_check():
    """
    Simple health check endpoint
    """
    return jsonify({
        "status": "healthy",
        "service": "Chat API",
        "timestamp": time.time()
    }), 200

@chat_bp.route('/api/chat/intents', methods=['GET'])
def list_intents():
    """
    List available intents for debugging/development
    """
    try:
        # Get intents from response manager
        if not hasattr(response_manager, 'intents_data') or not response_manager.intents_data:
            return jsonify({
                "error": "Intents data not available",
                "status": "error"
            }), 404
        
        # Extract intent tags and sample patterns
        intents_list = []
        for intent in response_manager.intents_data.get("intents", []):
            # Add basic intent information
            intent_info = {
                "tag": intent.get("tag"),
                "sample_patterns": intent.get("patterns", [])[:3],  # First 3 patterns as samples
                "response_count": len(intent.get("responses", [])),
            }
            intents_list.append(intent_info)
        
        return jsonify({
            "intents": intents_list,
            "count": len(intents_list),
            "status": "success"
        }), 200
        
    except Exception as e:
        logger.error(f"Error listing intents: {str(e)}")
        return jsonify({
            "error": "Failed to list intents",
            "details": str(e),
            "status": "error"
        }), 500

@chat_bp.route('/api/chat/test', methods=['GET'])
def test_chat():
    """
    Simple test endpoint that returns a predefined response
    Useful for checking if the API is functioning correctly
    """
    return jsonify({
        "response": "The chat service is running correctly. You can send POST requests to /api/chat to interact with the chatbot.",
        "source": "test",
        "status": "success"
    }), 200