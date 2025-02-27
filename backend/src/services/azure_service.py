# src/services/azure_service.py
import os
from openai import OpenAI
import sys
import logging

# Add parent directory to path to import utils
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.logger import setup_logger

# Set up logger
logger = setup_logger("azure_service")

from dotenv import load_dotenv

load_dotenv()
class AzureOpenAIService:
    """Service for interacting with Azure OpenAI API"""
    
    def __init__(self, base_url=None, api_key=None, model="gpt-4o-mini"):
        """
        Initialize the Azure OpenAI service
        
        Args:
            base_url: Azure OpenAI base URL
            api_key: Azure OpenAI API key
            model: Model to use for completions
        """
        # Use provided values or environment variables
        self.base_url = base_url or os.getenv("AZURE_OPENAI_BASE_URL", "https://models.inference.ai.azure.com")
        self.api_key = api_key or os.getenv("AZURE_OPENAI_API_KEY")
        self.model = model
        
        try:
            # Initialize OpenAI client
            self.client = OpenAI(
                base_url=self.base_url,
                api_key=self.api_key,
            )
            logger.info("Azure OpenAI client initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing Azure OpenAI client: {str(e)}")
            self.client = None
    
    def _get_instruction_prompt(self):
        """
        Create instruction prompt for the portfolio chatbot
        
        Returns:
            Instruction string that can be used as the first user message
        """
        return """You are responding as an assistant for Hassane Skikri, a Computer Science Student and Data Scientist studying at École Nationale des Sciences Appliquées de Fès (2021-2026).
                Your answers should help visitors learn about Hassane's:
                - Professional skills (Data Science, Machine Learning, Computer Vision, Python, Deep Learning)
                - Projects and their technical details
                - Educational background and certifications
                - Contact information and availability
                Keep responses friendly, professional, and technically accurate. Be concise while highlighting Hassane's expertise.
                
                Now, please respond to the user's question."""
    
    def generate_response(self, message, system_prompt=None, context=None):
        """
        Generate a response using Azure OpenAI
        
        Args:
            message: User message
            system_prompt: Not used directly due to model limitations, but kept for API compatibility
            context: Optional conversation context (list of previous messages)
            
        Returns:
            Response text or None if an error occurs
        """
        if not self.client:
            logger.error("Cannot generate response: Azure OpenAI client not initialized")
            return None
        
        try:
            # Create messages array
            messages = []
            
            # Add instruction as the first user message if no context
            if not context or len(context) == 0:
                messages.append({
                    "role": "user",
                    "content": self._get_instruction_prompt()
                })
                
                # Add assistant acknowledgment
                messages.append({
                    "role": "assistant",
                    "content": "I understand. I will answer questions about Hassane's portfolio professionally. Here's how I'll format my responses:\n\n### Key Information\n- **Skills** and technical expertise\n- *Projects* and achievements\n- Educational background\n- Contact details\n\nI can provide code examples like:\n```python\ndef example():\n    return \"Clear explanations\"\n```\n\nAnd link to resources when relevant. Let me know what you'd like to learn about!"
                })
            
            # Add conversation context if provided
            elif context and isinstance(context, list):
                # Filter out invalid messages and ensure content is present
                filtered_context = [
                    msg for msg in context
                    if msg.get("role") != "system"
                    and msg.get("content") is not None
                    and isinstance(msg.get("content"), str)
                ]
                messages.extend(filtered_context)
            
            # Add the user message
            messages.append({
                "role": "user",
                "content": message
            })
            
            # Log the request (truncate long messages)
            log_message = message[:60] + "..." if len(message) > 60 else message
            logger.info(f"Sending request to Azure OpenAI: '{log_message}'")
            
            # Generate completion
            response = self.client.chat.completions.create(
                messages=messages,
                model=self.model,
                temperature=0.7,
                max_completion_tokens=500,
                top_p=0.95
            )
            
            # Extract response text
            response_text = response.choices[0].message.content
            logger.info(f"Response generated successfully ({len(response_text)} chars)")
            
            return response_text
            
        except Exception as e:
            logger.error(f"Error generating response from Azure OpenAI: {str(e)}")
            return "I'm sorry, I'm having trouble connecting to my knowledge base right now. Please try asking in a different way or try again later."

if __name__ == "__main__":
    azure_service = AzureOpenAIService()
    test_questions = [
        "What are Hassane's main skills?",
        "Tell me about Hassane's projects in computer vision"
    ]
    
    for question in test_questions:
        print(f"\nQ: {question}")
        response = azure_service.generate_response(question)
        print(f"A: {response}")