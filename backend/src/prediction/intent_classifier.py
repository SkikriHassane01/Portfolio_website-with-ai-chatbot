# intent_classifier.py
import numpy as np
import pickle
import os
import tensorflow as tf
import nltk
from nltk.stem import WordNetLemmatizer
import tensorflow_hub as hub
import random
import sys
import json

# Add the parent directory to path to import utils
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.logger import setup_logger

# Set up logger
logger = setup_logger("intent_classifier")

class IntentClassifier:
    """
    Class for intent classification using the trained model
    """
    
    def __init__(self, model_path=None, threshold=0.6):
        """
        Initialize the intent classifier
        
        Args:
            model_path: Path to the trained model, defaults to 'models/chatbot_model_improved.h5'
            threshold: Confidence threshold for intent prediction
        """
        # Set paths and parameters
        self.model_path = model_path or 'models/chatbot_model_improved.h5'
        self.classes_path = 'models/classes.pkl'
        self.model_info_path = 'models/model_info.pkl'
        self.threshold = threshold
        self.logger = logger
        
        # Download required NLTK resources
        nltk.download('punkt', quiet=True)
        nltk.download('wordnet', quiet=True)
        
        # Initialize lemmatizer
        self.lemmatizer = WordNetLemmatizer()
        
        # Load model and data
        self._load_model_and_data()
        
        logger.info("Intent classifier initialized successfully")
        
    def _load_model_and_data(self):
        """Load the trained model, classes, and model info"""
        try:
            # Load model
            logger.info(f"Loading model from {self.model_path}")
            self.model = tf.keras.models.load_model(
                self.model_path, 
                custom_objects={'KerasLayer': hub.KerasLayer}
            )
            
            # Load classes
            logger.info(f"Loading classes from {self.classes_path}")
            self.classes = pickle.load(open(self.classes_path, 'rb'))
            
            # Load model info
            logger.info(f"Loading model info from {self.model_info_path}")
            self.model_info = pickle.load(open(self.model_info_path, 'rb'))
            
            # Determine the embedding method
            self.embedding_method = self.model_info.get('embedding_method', 'bow')  # Default to bag of words
            
            # Initialize USE encoder if needed
            if self.embedding_method == 'use':
                logger.info("Loading Universal Sentence Encoder")
                self.use_encoder = hub.load("https://tfhub.dev/google/universal-sentence-encoder/4")
            
            # Load words and other info if using LSTM or bag of words
            if self.embedding_method == 'lstm' or self.embedding_method == 'bow':
                self.words_path = 'models/words.pkl'
                if os.path.exists(self.words_path):
                    logger.info(f"Loading words from {self.words_path}")
                    self.words = pickle.load(open(self.words_path, 'rb'))
                else:
                    logger.warning(f"Words file not found at {self.words_path}")
                    self.words = []
                
                if self.embedding_method == 'lstm':
                    self.word_to_index = self.model_info.get('word_to_index', {})
                    self.max_seq_len = self.model_info.get('max_seq_len', 20)
            
            logger.info(f"Model and data loaded successfully. Embedding method: {self.embedding_method}")
            
            # Get the expected input shape to validate later inputs
            self._determine_input_shape()
            
        except Exception as e:
            logger.error(f"Error loading model and data: {str(e)}")
            raise ValueError(f"Failed to load the model and supporting files: {str(e)}")
    
    def _determine_input_shape(self):
        """Determine the expected input shape for the model"""
        try:
            # Get expected input shape from model
            input_shape = self.model.input_shape
            
            if input_shape is not None:
                self.input_shape = input_shape
                logger.info(f"Model expects input shape: {input_shape}")
            else:
                # Default input shape if not available
                if self.embedding_method == 'use':
                    self.input_shape = (None, 512)  # USE embeddings are 512-dimensional
                elif self.embedding_method == 'lstm':
                    self.input_shape = (None, self.max_seq_len)
                else:
                    self.input_shape = (None, len(self.words))  # Bag of words
                
                logger.info(f"Using default input shape for {self.embedding_method}: {self.input_shape}")
        except Exception as e:
            logger.warning(f"Could not determine input shape: {str(e)}. Will use dynamic shape.")
            self.input_shape = None
    
    def _clean_up_sentence(self, sentence):
        """
        Tokenize and lemmatize the sentence
        
        Args:
            sentence: Input sentence
            
        Returns:
            List of lemmatized words
        """
        # Tokenize words
        word_tokens = nltk.word_tokenize(sentence)
        # Lemmatize each word
        return [self.lemmatizer.lemmatize(word.lower()) for word in word_tokens]
    
    def _bag_of_words(self, sentence):
        """
        Create a bag of words representation for the traditional approach
        
        Args:
            sentence: Input sentence
            
        Returns:
            Bag of words array
        """
        # Get lemmatized words from the sentence
        sentence_words = self._clean_up_sentence(sentence)
        
        # Create empty bag with 0 for each word in our vocabulary
        bag = [0] * len(self.words)
        
        # Fill the bag with 1s for each word found in the sentence
        for s_word in sentence_words:
            for i, word in enumerate(self.words):
                if word == s_word:
                    bag[i] = 1
        
        return bag
    
    def _prepare_use_input(self, message):
        """Prepare input for USE embedding model"""
        # Get embedding using Universal Sentence Encoder
        embedding = self.use_encoder([message]).numpy()
        return embedding
    
    def _prepare_lstm_input(self, message):
        """Prepare input for LSTM model"""
        # Get lemmatized words
        sentence_words = self._clean_up_sentence(message)
        
        # Convert words to indices and pad sequence
        seq = []
        for word in sentence_words:
            # Get index of word, or 0 if not found
            idx = self.word_to_index.get(word, 0)
            seq.append(idx)
        
        # Truncate if too long or pad if too short
        if len(seq) > self.max_seq_len:
            seq = seq[:self.max_seq_len]
        else:
            seq = seq + [0] * (self.max_seq_len - len(seq))
        
        return np.array([seq])
    
    def _prepare_bow_input(self, message):
        """Prepare input for bag of words model"""
        bow = self._bag_of_words(message)
        return np.array([bow])
    
    def _prepare_input(self, message):
        """
        Prepare input for prediction based on the embedding method
        
        Args:
            message: Input message
            
        Returns:
            Processed input ready for model prediction
        """
        try:
            if self.embedding_method == 'use':
                return self._prepare_use_input(message)
            elif self.embedding_method == 'lstm':
                return self._prepare_lstm_input(message)
            else:  # Default to bag of words
                return self._prepare_bow_input(message)
        except Exception as e:
            logger.error(f"Error preparing input: {str(e)}")
            # Return None to indicate failure
            return None
    
    def predict_intent(self, message):
        """
        Predict the intent of a message
        
        Args:
            message: user input message
            
        Returns:
            dict containing:
                - intent: predicted intent tag
                - confidence: confidence score of prediction
                - use_azure: boolean indicating if confidence is below threshold
                - requires_fallback: boolean indicating if confidence is below threshold
        """
        
        try:
            # Prepare input based on model type
            self.logger.info(f"Classifying intent for: '{message}'")
            input_data = self._prepare_input(message)
            
            if input_data is None:
                raise ValueError("Failed to prepare input data")
            
            # Check input shape compatibility
            if self.input_shape and input_data.shape[1:] != self.input_shape[1:]:
                actual_shape = input_data.shape
                expected_shape = self.input_shape
                logger.warning(f"Input shape mismatch: got {actual_shape}, expected {expected_shape}")
                
                # Try to reshape if possible (only for array-based inputs)
                if len(actual_shape) == 2 and len(expected_shape) == 2:
                    if expected_shape[1] is not None:
                        # Truncate or pad to match expected shape
                        if actual_shape[1] > expected_shape[1]:
                            # Truncate
                            input_data = input_data[:, :expected_shape[1]]
                            logger.info(f"Truncated input to shape {input_data.shape}")
                        elif actual_shape[1] < expected_shape[1]:
                            # Pad with zeros
                            padding = np.zeros((actual_shape[0], expected_shape[1] - actual_shape[1]))
                            input_data = np.hstack((input_data, padding))
                            logger.info(f"Padded input to shape {input_data.shape}")
            
            # Make prediction
            result = self.model.predict(input_data, verbose=0)[0]
            
            # Get the highest confidence intent
            max_index = np.argmax(result)
            intent = self.classes[max_index]
            confidence = float(result[max_index])
            
            self.logger.info(f"Predicted intent: {intent} with confidence: {confidence:.4f}")
            
            # Determine if we should use Azure API based on confidence threshold
            use_azure = confidence < self.threshold
            
            return {
                "intent": intent,
                "confidence": confidence,
                "use_azure": use_azure,
                "requires_fallback": use_azure
            }
        except Exception as e:
            self.logger.error(f"Error predicting intent: {str(e)}")
            # Return a fallback that will trigger Azure API
            return {
                "intent": "unknown",
                "confidence": 0.0,
                "use_azure": True,
                "requires_fallback": True
            }
    
    def get_response(self, intents_json, predicted_intent):
        """
        Get a response from the intents file based on the predicted intent
        
        Args:
            intents_json: loaded intents JSON data
            predicted_intent: dict returned from predict_intent
            
        Returns:
            Random response string for the predicted intent
        """
        
        if predicted_intent['requires_fallback']:
            self.logger.info("Confidence below threshold, response will be handled by Azure API")
            return None
        
        tag = predicted_intent['intent']
        
        # Find the matching intent in our intents list
        for intent in intents_json['intents']:
            if intent['tag'] == tag:
                # Return a random response for this intent
                response = random.choice(intent["responses"])
                self.logger.info(f"Selected response for intent '{tag}'")
                return response
        
        # If no matching intent found
        self.logger.warning(f"No response found for intent '{tag}'")
        return None
    
    def process_message(self, message, intents_file='data/intents.json'):
        """
        Process a message: predict intent and get response
        
        Args:
            message: User input message
            intents_file: Path to intents JSON file
            
        Returns:
            Tuple of (predicted_intent, response)
        """
        # Load intents data
        try:
            with open(intents_file, 'r', encoding='utf-8') as file:
                intents_json = json.load(file)
        except Exception as e:
            self.logger.error(f"Error loading intents file: {str(e)}")
            return {
                "intent": "unknown",
                "confidence": 0.0,
                "use_azure": True,
                "requires_fallback": True
            }, None
        
        # Predict intent
        predicted_intent = self.predict_intent(message)
        
        # Get response
        response = self.get_response(intents_json, predicted_intent)
        
        return predicted_intent, response

# Example usage
if __name__ == "__main__":
    # Create intent classifier
    classifier = IntentClassifier()
    
    # Test with some example sentences
    test_sentences = [
        "Hello there",
        "What time do you open?",
        "Can you help me with my order?",
        "I want to cancel my subscription",
        "Tell me about your return policy"
    ]
    
    try:
        # Load intents data
        with open('data/intents.json', 'r', encoding='utf-8') as file:
            intents_json = json.load(file)
        
        for sentence in test_sentences:
            predicted_intent = classifier.predict_intent(sentence)
            response = classifier.get_response(intents_json, predicted_intent)
            
            print(f"\nSentence: {sentence}")
            print(f"Intent: {predicted_intent['intent']} (Confidence: {predicted_intent['confidence']:.4f})")
            print(f"Requires Azure fallback: {predicted_intent['requires_fallback']}")
            print(f"Response: {response}")
    except Exception as e:
        print(f"Error in test execution: {str(e)}")