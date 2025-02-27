# src/services/response_manager.py
import os
import json
import sys
from typing import Dict, List

# Add parent directory to path to import utils
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.logger import setup_logger
from services.azure_service import AzureOpenAIService

# Import the intent classifier
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'src'))
from prediction.intent_classifier import IntentClassifier

# Set up logger
logger = setup_logger("response_manager")

class ResponseManager:
    """
    Manager for handling chat responses, coordinating between local model and Azure OpenAI
    """
    MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'models', 'chatbot_model_improved.h5')
    def __init__(self, confidence_threshold=0.9, intents_path=None, model_path=MODEL_PATH):
        """
        Initialize the response manager
        
        Args:
            confidence_threshold: Threshold for using Azure OpenAI (default: 0.7)
            intents_path: Path to the intents.json file
            model_path: Path to the trained model file
        """
        self.confidence_threshold = confidence_threshold
        self.intents_path = intents_path or os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'data', 'intents.json')
        
        # Load intents data
        try:
            with open(self.intents_path, 'r', encoding='utf-8') as file:
                self.intents_data = json.load(file)
            logger.info(f"Loaded intents from {self.intents_path}")
        except Exception as e:
            logger.error(f"Error loading intents file: {str(e)}")
            self.intents_data = {"intents": []}
        
        # Initialize intent classifier
        try:
            self.intent_classifier = IntentClassifier(
                model_path=model_path,
                threshold=confidence_threshold
            )
            logger.info("Intent classifier initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing intent classifier: {str(e)}")
            self.intent_classifier = None
        
        # Initialize Azure OpenAI service
        self.azure_service = AzureOpenAIService()
        
    
    def get_response(self, message: str, conversation_history=None) -> Dict:
        """
        Get a response based on the user message
        
        Args:
            message: User message
            conversation_history: List of previous messages in the conversation
            
        Returns:
            Dict containing response and metadata
        """
        if not message:
            return {
                "response": "I didn't receive a message. How can I help you?",
                "source": "default",
                "confidence": 0.0,
                "intent": None
            }
        
        # Initialize conversation history if not provided
        if conversation_history is None:
            conversation_history = []
        
        try:
            # First, try to classify the intent using our local model
            if self.intent_classifier:
                logger.info(f"Classifying intent for message: {message[:50]}...")
                intent_data = self.intent_classifier.predict_intent(message)
                
                # If confidence is above threshold, use local response
                if intent_data and intent_data["confidence"] >= self.confidence_threshold:
                    logger.info(f"Using local response for intent: {intent_data['intent']} (confidence: {intent_data['confidence']:.4f})")
                    
                    # Get response from intents data
                    response = self._get_local_response(intent_data["intent"])
                    
                    return {
                        "response": response,
                        "source": "local",
                        "confidence": intent_data["confidence"],
                        "intent": intent_data["intent"]
                    }
                else:
                    # Intent confidence below threshold, use Azure
                    logger.info(f"Local confidence ({intent_data['confidence']:.4f}) below threshold ({self.confidence_threshold}), using Azure OpenAI")
            else:
                logger.warning("Intent classifier not available, defaulting to Azure OpenAI")
            
            # Use Azure OpenAI for response
            return self._get_azure_response(message, conversation_history)
            
        except Exception as e:
            logger.error(f"Error getting response: {str(e)}")
            # Fallback to Azure in case of any error
            try:
                return self._get_azure_response(message, conversation_history)
            except Exception as e2:
                logger.error(f"Error getting Azure fallback response: {str(e2)}")
                return {
                    "response": "I'm sorry, I encountered an issue processing your request. Please try again.",
                    "source": "error",
                    "confidence": 0.0,
                    "intent": None
                }
    
    def _get_local_response(self, intent_tag: str) -> str:
        """
        Get response from local intents data
        
        Args:
            intent_tag: Intent tag to find response for
            
        Returns:
            Response string
        """
        try:
            # Find matching intent
            for intent in self.intents_data["intents"]:
                if intent["tag"] == intent_tag:
                    # Return random response from list
                    import random
                    return random.choice(intent["responses"])
            
            # If no matching intent found
            logger.warning(f"No local response found for intent: {intent_tag}")
            return None
        except Exception as e:
            logger.error(f"Error getting local response: {str(e)}")
            return None
    
    def _get_azure_response(self, message: str, conversation_history: List) -> Dict:
        """
        Get response from Azure OpenAI
        
        Args:
            message: User message
            conversation_history: List of previous messages
            
        Returns:
            Dict containing response and metadata
        """
        # Format conversation history for Azure
        formatted_history = self._format_conversation_history(conversation_history)
        
        # Get response from Azure
        response_text = self.azure_service.generate_response(
            message=message,
            context=formatted_history
        )
        
        if response_text:
            return {
                "response": response_text,
                "source": "azure",
                "confidence": 1.0,  # Azure responses are considered high confidence
                "intent": "azure_generated"
            }
        else:
            # If Azure fails, provide a fallback message
            logger.error("Failed to get response from Azure OpenAI")
            return {
                "response": "I'm sorry, I couldn't generate a response at the moment. Please try asking in a different way.",
                "source": "fallback",
                "confidence": 0.0,
                "intent": None
            }
    
    def _format_conversation_history(self, history: List) -> List:
        """
        Format conversation history for Azure OpenAI
        
        Args:
            history: List of conversation messages
            
        Returns:
            Formatted history for Azure OpenAI
        """
        formatted_history = []
        
        if not history:
            return formatted_history
        
        for item in history:
            if isinstance(item, dict) and "role" in item and "content" in item:
                # Already in the correct format
                formatted_history.append(item)
            elif isinstance(item, dict) and "user" in item:
                # Convert to the correct format
                formatted_history.append({
                    "role": "user",
                    "content": item["user"]
                })
                if "assistant" in item and item["assistant"]:
                    formatted_history.append({
                        "role": "assistant",
                        "content": item["assistant"]
                    })
            elif isinstance(item, tuple) and len(item) == 2:
                # Tuple format (user_message, assistant_message)
                user_msg, assistant_msg = item
                formatted_history.append({
                    "role": "user",
                    "content": user_msg
                })
                if assistant_msg:
                    formatted_history.append({
                        "role": "assistant",
                        "content": assistant_msg
                    })
        
        # Limit history length to avoid token limits
        if len(formatted_history) > 10:
            # Keep the most recent messages
            formatted_history = formatted_history[-10:]
        
        return formatted_history

# Example usage for testing
if __name__ == "__main__":
    response_manager = ResponseManager()
    result = response_manager.get_response("what are the skills of hassane")
    print(f"Response: {result['response']}")
    print(f"Source: {result['source']}")
    print(f"Confidence: {result['confidence']}")
    print(f"Intent: {result['intent']}")