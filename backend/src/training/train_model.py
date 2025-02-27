# src/training/train_model.py
import json
import pickle
import numpy as np
import tensorflow as tf
import random
import nltk
from nltk.stem import WordNetLemmatizer
import os
import sys

# Add the parent directory to path to import utils
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.logger import setup_logger

from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout, BatchNormalization
from tensorflow.keras.optimizers import SGD
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau

# Set up logger
logger = setup_logger("train_model")

def train_model(num_epochs: int):
    """Train the intent classification model"""
    
    logger.info("Starting model training process")
    
    # Download required NLTK resources
    logger.info("Downloading NLTK resources")
    nltk.download('punkt')
    nltk.download('wordnet')
    nltk.download('omw-1.4')

    # Create directory for models if it doesn't exist
    if not os.path.exists('models'):
        os.makedirs('models')
        logger.info("Created models directory")

    # Load the intents file with UTF-8 encoding
    logger.info("Loading intents file")
    try:
        with open('data/intents.json', 'r', encoding='utf-8') as file:
            intents = json.load(file)
        logger.info("Intents file loaded successfully")
    except Exception as e:
        logger.error(f"Error while loading the intents json file: {str(e)}")
        raise ValueError(f"Error while loading the intents json file ==> {str(e)}")

    # Initialize empty lists
    words = []
    classes = []
    documents = []
    ignore_words = ['?', '!', '.', ',']

    # Loop through each intent
    logger.info("Processing intents and patterns")
    for intent in intents['intents']:
        for pattern in intent['patterns']:
            # Tokenize each word
            word_list = nltk.word_tokenize(pattern)
            # Add to words list
            words.extend(word_list)
            # Add to documents with associated intent
            documents.append((word_list, intent['tag']))
            # Add to classes list
            if intent['tag'] not in classes:
                classes.append(intent['tag'])

    # Lemmatize, lowercase, and remove duplicates
    logger.info("Lemmatizing words")
    # Initialize lemmatizer outside of the list comprehension
    lemmatizer = WordNetLemmatizer()
    lemmatized_words = []
    

    for w in words:
        if w not in ignore_words:
            # Convert to lowercase and lemmatize
            lemmatized_word = lemmatizer.lemmatize(w.lower())
            lemmatized_words.append(lemmatized_word)
    
    # Remove duplicates and sort
    words = sorted(list(set(lemmatized_words)))
    classes = sorted(list(set(classes)))

    logger.info(f"Total patterns: {len(documents)}")
    logger.info(f"Intent classes: {len(classes)}")
    logger.info(f"Unique lemmatized words: {len(words)}")

    # Save the preprocessed data
    logger.info("Saving preprocessed data")
    pickle.dump(words, open('models/words.pkl', 'wb'))
    pickle.dump(classes, open('models/classes.pkl', 'wb'))

    # Create the training data
    training = []
    output_empty = [0] * len(classes)

    # For each document
    logger.info("Creating training data")
    for document in documents:
        # Initialize bag of words
        bag = []
        # List of tokenized words for the pattern
        word_patterns = document[0]
        
        # Lemmatize each word for better matching
        lemmatized_patterns = []
        for word in word_patterns:
            lemmatized_word = lemmatizer.lemmatize(word.lower())
            lemmatized_patterns.append(lemmatized_word)
        
        # Create bag of words array
        for word in words:
            bag.append(1) if word in lemmatized_patterns else bag.append(0)

        # Output is a '0' for each tag and '1' for current tag
        output_row = list(output_empty)
        output_row[classes.index(document[1])] = 1
        training.append([bag, output_row])

    # Shuffle and convert to numpy array
    random.shuffle(training)
    training = np.array(training, dtype=object)

    # Split training data into X (patterns) and Y (intents)
    X_train = list(training[:, 0])
    y_train = list(training[:, 1])

    # Create model
    logger.info("Building neural network model")
    model = Sequential()
    
    # First layer
    model.add(Dense(256, input_shape=(len(X_train[0]),), activation='relu'))
    model.add(BatchNormalization())
    model.add(Dropout(0.2))
    
    # Second layer
    model.add(Dense(256, activation='relu'))
    model.add(BatchNormalization())
    model.add(Dropout(0.2))
    
    # # Third layer
    model.add(Dense(64, activation='relu'))
    model.add(BatchNormalization())
    model.add(Dropout(0.2))

    # Output layer
    model.add(Dense(len(y_train[0]), activation='softmax'))
    
    # Model summary
    model.summary()
    logger.info("Model architecture created")

    # Compile model
    sgd = SGD(learning_rate=0.01, momentum=0.9, nesterov=True)
    model.compile(loss='categorical_crossentropy', optimizer='adam', metrics=['accuracy'])

    # Fit and save the model
    logger.info("Training model (this may take a while)...")
    
    validation_split = 0.2  # 20% of data used for validation
    callbacks = [
        EarlyStopping(
            monitor='val_loss',        # Monitor validation loss
            patience=30,               # Stop after 10 epochs with no improvement
            min_delta=0.0001,          # Minimum change to count as improvement
            restore_best_weights=True,  # Restore model weights from the epoch with the best value
            verbose=1
        ), 
        # Reduce learning rate when a metric has stopped improving
        ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=5,
            min_lr=0.0001,
            verbose=1
        )  
    ]
    
    hist = model.fit(
        np.array(X_train), 
        np.array(y_train), 
        epochs=num_epochs,
        batch_size=5,
        verbose=1,
        validation_split=validation_split,  # Split off validation data
        callbacks=callbacks
    )
    
    # Get the best accuracy
    best_train_accuracy = max(hist.history['accuracy'])
    if 'val_accuracy' in hist.history:
        best_val_accuracy = max(hist.history['val_accuracy'])
        logger.info(f"Best validation accuracy: {best_val_accuracy:.4f}")
    
    logger.info(f"Best training accuracy: {best_train_accuracy:.4f}")
    
    # If early stopping was triggered
    if len(hist.epoch) < num_epochs:
        logger.info(f"Early stopping triggered at epoch {len(hist.epoch)}")
    
    # Save the final model (which should be the best one due to restore_best_weights=True)
    model.save('models/chatbot_model.h5')
    logger.info("Model saved to models/chatbot_model.h5")
    
    return {
        'words': words,
        'classes': classes,
        'num_patterns': len(documents),
        'train_accuracy': best_train_accuracy,
        'val_accuracy': best_val_accuracy if 'val_accuracy' in hist.history else None,
        'epochs': len(hist.epoch)
    }

if __name__ == "__main__":
    train_model(num_epochs=600)