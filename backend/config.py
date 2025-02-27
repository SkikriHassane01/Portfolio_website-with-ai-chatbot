# config.py
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    """Base configuration"""
    DEBUG = False
    TESTING = False
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-key-please-change-in-production')
    
    # Azure OpenAI settings
    AZURE_OPENAI_BASE_URL = os.environ.get('AZURE_OPENAI_BASE_URL', 'https://models.inference.ai.azure.com')
    AZURE_OPENAI_API_KEY = os.environ.get('AZURE_OPENAI_API_KEY')
    AZURE_OPENAI_MODEL = os.environ.get('AZURE_OPENAI_MODEL', 'o1-mini')
    
    # Model paths
    MODEL_PATH = os.environ.get('MODEL_PATH', 'models/chatbot_model_improved.h5')
    INTENTS_PATH = os.environ.get('INTENTS_PATH', 'data/intents.json')
    
    # Confidence threshold for local vs Azure responses
    CONFIDENCE_THRESHOLD = float(os.environ.get('CONFIDENCE_THRESHOLD', '0.7'))
    
    # Logging configuration
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    LOG_LEVEL = 'DEBUG'

class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    DEBUG = True
    # Use a separate test database if needed

class ProductionConfig(Config):
    """Production configuration"""
    # Production specific settings
    SECRET_KEY = os.environ.get('SECRET_KEY') # This should be set in production

# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}

def get_config():
    """Get the config based on the environment"""
    env = os.environ.get('FLASK_ENV', 'default')
    return config.get(env, config['default'])