# train_model_improved.py
import json
import pickle
import numpy as np
import tensorflow as tf
import random
import nltk
from nltk.stem import WordNetLemmatizer
import os
import sys
import tensorflow_hub as hub
import nlpaug.augmenter.word as naw
import mlflow
import mlflow.keras

# Add the parent directory to path to import utils
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.logger import setup_logger

from tensorflow.keras.models import Sequential, Model
from tensorflow.keras.layers import Dense, Dropout, BatchNormalization, Input, Embedding, LSTM, Bidirectional
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau
from tensorflow.keras.regularizers import l2
# Set up logger
logger = setup_logger("train_model_improved")

def train_model(num_epochs=200, use_data_augmentation=True, embedding_method="use"):
    """
    Train an improved intent classification model
    
    Args:
        num_epochs: Maximum number of training epochs
        use_data_augmentation: Whether to augment training data
        embedding_method: 'use' for Universal Sentence Encoder or 'lstm' for word embeddings with LSTM
    """
    
    logger.info(f"Starting improved model training process with {embedding_method} embeddings")
    
    # Set up MLflow tracking
    mlflow.set_experiment("chatbot_intent_classification")
    
    # Start MLflow run
    with mlflow.start_run(run_name=f"{embedding_method}_model"):
        # Log parameters
        mlflow.log_param("embedding_method", embedding_method)
        mlflow.log_param("num_epochs", num_epochs)
        mlflow.log_param("use_data_augmentation", use_data_augmentation)
    
        # Download required NLTK resources
        logger.info("Downloading NLTK resources")
        nltk.download('punkt')
        nltk.download('wordnet')
        nltk.download('omw-1.4')
        nltk.download('averaged_perceptron_tagger')  # For POS tagging
        nltk.download('tagsets')
        
        # Create directory for models if it doesn't exist
        if not os.path.exists('models'):
            os.makedirs('models')
            logger.info("Created models directory")

        # Load the intents file with UTF-8 encoding
        logger.info("Loading intents file")
        try:
            with open('data/intents.json', 'r', encoding='utf-8') as file:
                intents = json.load(file)
            logger.info(f"Intents file loaded successfully with {len(intents['intents'])} intent categories")
            mlflow.log_param("num_intent_categories", len(intents['intents']))
        except Exception as e:
            logger.error(f"Error while loading the intents json file: {str(e)}")
            raise ValueError(f"Error while loading the intents json file ==> {str(e)}")

        # Initialize empty lists
        classes = []
        documents = []
        all_patterns = []  # Store all patterns for USE embedding
        
        # Loop through each intent
        logger.info("Processing intents and patterns")
        for intent in intents['intents']:
            for pattern in intent['patterns']:
                if isinstance(pattern, list):
                    pattern = ' '.join(pattern)  # Join list elements with spaces
                elif not isinstance(pattern, str):
                    pattern = str(pattern)  # Convert other types to string
                # Tokenize each pattern
                word_tokens = nltk.word_tokenize(pattern)
                # Add to documents with associated intent
                documents.append((word_tokens, intent['tag']))
                all_patterns.append(pattern)  # Add original pattern text
                # Add to classes list if not already there
                if intent['tag'] not in classes:
                    classes.append(intent['tag'])
        
        # Sort classes
        classes = sorted(list(set(classes)))
        logger.info(f"Total patterns: {len(documents)}")
        logger.info(f"Intent classes: {len(classes)}")
        
        # Log metrics about the dataset
        mlflow.log_metric("original_pattern_count", len(documents))
        mlflow.log_metric("intent_class_count", len(classes))
        
        # Data augmentation to increase training examples
        if use_data_augmentation:
            logger.info("Performing data augmentation...")
            # Synonym replacement augmentation
            try:
                aug = naw.SynonymAug()
                
                augmented_documents = []
                augmented_patterns = []
                
                for i, (doc, label) in enumerate(documents):
                    # Keep original document
                    augmented_documents.append((doc, label))
                    augmented_patterns.append(all_patterns[i])
                    
                    # Create 2 augmented versions (increased from 1)
                    text = all_patterns[i]
                    for _ in range(5):
                        try:
                            augmented_text = aug.augment(text)
                            # Ensure augmented_text is a string
                            if isinstance(augmented_text, list):
                                augmented_text = ' '.join(augmented_text)  # Join if it's a list
                            augmented_tokens = nltk.word_tokenize(augmented_text)
                            augmented_documents.append((augmented_tokens, label))
                            augmented_patterns.append(augmented_text)
                        except Exception as e:
                            logger.warning(f"Augmentation failed for '{text}': {str(e)}")
                
                logger.info(f"After augmentation: {len(augmented_documents)} patterns (was {len(documents)})")
                mlflow.log_metric("augmented_pattern_count", len(augmented_documents))
                documents = augmented_documents
                all_patterns = augmented_patterns
            except Exception as e:
                logger.error(f"Data augmentation failed, using original data: {str(e)}")
        
        # Save the classes for prediction
        logger.info("Saving class labels")
        pickle.dump(classes, open('models/classes.pkl', 'wb'))
        
        # Process text based on the chosen embedding method
        if embedding_method == "use":
            # Using Universal Sentence Encoder
            logger.info("Loading Universal Sentence Encoder...")
            embed = hub.load("https://tfhub.dev/google/universal-sentence-encoder/4")
            
            logger.info("Creating embeddings for patterns...")
            # Create embeddings for each pattern
            X_data = embed(all_patterns).numpy()
            
            # For USE, we don't need the traditional preprocessing since the encoder handles it
            # But we'll save the model information for future use
            model_info = {
                'embedding_method': 'use',
                'embedding_dim': X_data.shape[1],  # Should be 512 for USE
                'num_classes': len(classes)
            }
            pickle.dump(model_info, open('models/model_info.pkl', 'wb'))
            
            # Log embedding dimension
            mlflow.log_param("embedding_dim", X_data.shape[1])
            
        elif embedding_method == "lstm":
            # Using word embeddings + LSTM
            logger.info("Preparing data for LSTM model...")
            
            # Create vocabulary from all tokens
            words = []
            for doc, _ in documents:
                words.extend(doc)
            
            # Lemmatize and clean words
            lemmatizer = WordNetLemmatizer()
            ignore_words = ['?', '!', '.', ',']
            words = [lemmatizer.lemmatize(word.lower()) for word in words if word not in ignore_words]
            
            # Remove duplicates and sort
            words = sorted(list(set(words)))
            logger.info(f"Vocabulary size: {len(words)}")
            mlflow.log_metric("vocabulary_size", len(words))
            
            # Create word to index mapping
            word_to_index = {w: i+1 for i, w in enumerate(words)}  # 0 reserved for padding
            
            # Find maximum sequence length
            max_seq_len = max([len(doc) for doc, _ in documents])
            logger.info(f"Maximum sequence length: {max_seq_len}")
            mlflow.log_param("max_sequence_length", max_seq_len)
            
            # Create sequences
            X_data = []
            for doc, _ in documents:
                # Convert words to indices
                seq = [word_to_index.get(lemmatizer.lemmatize(w.lower()), 0) for w in doc]
                # Pad sequence
                padded_seq = seq + [0] * (max_seq_len - len(seq))
                X_data.append(padded_seq)
            
            X_data = np.array(X_data)
            
            # Save vocabulary and model info
            pickle.dump(words, open('models/words.pkl', 'wb'))
            model_info = {
                'embedding_method': 'lstm',
                'vocab_size': len(words) + 1,  # +1 for padding token
                'max_seq_len': max_seq_len,
                'word_to_index': word_to_index,
                'num_classes': len(classes)
            }
            pickle.dump(model_info, open('models/model_info.pkl', 'wb'))
        
        else:
            logger.error(f"Unknown embedding method: {embedding_method}")
            raise ValueError(f"Unknown embedding method: {embedding_method}")
        
        # Create one-hot encoded outputs for intent classes
        y_data = []
        for _, intent_tag in documents:
            output_row = [0] * len(classes)
            output_row[classes.index(intent_tag)] = 1
            y_data.append(output_row)
        
        y_data = np.array(y_data)
        
        # Shuffle data
        indices = np.random.permutation(len(X_data))
        X_data = X_data[indices]
        y_data = y_data[indices]
        
        # Create model based on embedding method
        logger.info(f"Building {embedding_method} model...")
        
        if embedding_method == "use":
            # Model with Universal Sentence Encoder embeddings
            model = Sequential([
                # Input shape is 512 for USE embeddings
                Dense(256, input_shape=(X_data.shape[1],), activation='relu', 
                    kernel_regularizer=tf.keras.regularizers.l2(0.0001)),
                BatchNormalization(),
                Dropout(0.7),
                Dense(128, activation='relu',
                    kernel_regularizer=tf.keras.regularizers.l2(0.0001)), 
                BatchNormalization(), 
                Dropout(0.7),
                Dense(len(classes), activation='softmax')
            ])
        
        elif embedding_method == "lstm":
            # Model with word embeddings and LSTM
            vocab_size = model_info['vocab_size']
            embedding_dim = 100  # Dimension of word embeddings
            
            input_layer = Input(shape=(max_seq_len,))
            embedding_layer = Embedding(vocab_size, embedding_dim, input_length=max_seq_len)(input_layer)
            lstm_layer = Bidirectional(LSTM(64, return_sequences=False))(embedding_layer)
            dense1 = Dense(32, activation='relu')(lstm_layer)
            dropout = Dropout(0.7)(dense1)
            output_layer = Dense(len(classes), activation='softmax')(dropout)
            
            model = Model(inputs=input_layer, outputs=output_layer)
        
        # Model summary
        model.summary()
        logger.info("Model architecture created")
        
        # Compile model
        optimizer = Adam(learning_rate=0.001)
        model.compile(loss='categorical_crossentropy', optimizer=optimizer, metrics=['accuracy'])
        
        # Define callbacks for training
        callbacks = [
            EarlyStopping(
                monitor='val_accuracy',
                patience=20,
                min_delta=0.0001,
                restore_best_weights=True,
                verbose=1
            ),
            ReduceLROnPlateau(
                monitor='val_loss',
                factor=0.5,
                patience=5,
                min_lr=0.00001,
                verbose=1
            ),
            ModelCheckpoint(
                filepath='models/checkpoints/model_{epoch:02d}_{val_accuracy:.4f}.h5',
                monitor='val_accuracy',
                save_best_only=True,
                verbose=1
            ),
            # Add MLflow callback to log metrics at the end of each epoch
            tf.keras.callbacks.LambdaCallback(
                on_epoch_end=lambda epoch, logs: mlflow.log_metrics(
                    {
                        "train_loss": logs["loss"],
                        "train_accuracy": logs["accuracy"],
                        "val_loss": logs["val_loss"],
                        "val_accuracy": logs["val_accuracy"]
                    },
                    step=epoch
                )
            )
        ]
        
        # Create checkpoints directory if it doesn't exist
        if not os.path.exists('models/checkpoints'):
            os.makedirs('models/checkpoints')
        
        # Train the model
        logger.info("Training model (this may take a while)...")
        validation_split = 0.2
        mlflow.log_param("validation_split", validation_split)
        
        hist = model.fit(
            X_data, y_data,
            epochs=num_epochs,
            batch_size=32,  # Increased batch size for faster training
            verbose=1,
            validation_split=validation_split,
            callbacks=callbacks
        )
        
        # Get best metrics
        best_train_accuracy = max(hist.history['accuracy'])
        if 'val_accuracy' in hist.history:
            best_val_accuracy = max(hist.history['val_accuracy'])
            logger.info(f"Best validation accuracy: {best_val_accuracy:.4f}")
            mlflow.log_metric("best_val_accuracy", best_val_accuracy)
        
        logger.info(f"Best training accuracy: {best_train_accuracy:.4f}")
        mlflow.log_metric("best_train_accuracy", best_train_accuracy)
        mlflow.log_metric("epochs_trained", len(hist.epoch))
        
        # Save the final model
        model.save('models/chatbot_model_improved.h5')
        logger.info("Model saved to models/chatbot_model_improved.h5")
        
        # Log model to MLflow
        mlflow.keras.log_model(model, "model")
        
        # Return training information
        return {
            'embedding_method': embedding_method,
            'num_patterns': len(documents),
            'num_classes': len(classes),
            'train_accuracy': best_train_accuracy,
            'val_accuracy': best_val_accuracy if 'val_accuracy' in hist.history else None,
            'epochs_trained': len(hist.epoch)
        }

if __name__ == "__main__":
    result = train_model(num_epochs=200, use_data_augmentation=True, embedding_method="use")
    print("\nTraining Results:")
    for key, value in result.items():
        print(f"{key}: {value}")