import intentsData from './intents.json';

/**
 * Intent classifier for the chatbot
 * Uses pattern matching to identify user intentions
 */

// Preprocess the intents data
const processedIntents = {};
intentsData.intents.forEach(intent => {
  processedIntents[intent.tag] = {
    patterns: intent.patterns.map(pattern => pattern.toLowerCase()),
    responses: intent.responses,
    threshold: 0.7 // Default confidence threshold
  };
});

/**
 * Preprocesses text by removing punctuation, extra spaces, and converting to lowercase
 * @param {string} text - The input text to preprocess
 * @returns {string} - Preprocessed text
 */
function preprocessText(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ')    // Replace multiple spaces with single space
    .trim();
}

/**
 * Calculates similarity score between two strings using Levenshtein distance
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - Similarity score between 0 and 1
 */
function calculateSimilarity(str1, str2) {
  // Simple word matching for short phrases
  if (str1 === str2) return 1.0;
  
  const words1 = str1.split(' ');
  const words2 = str2.split(' ');
  
  // Count matching words
  let matches = 0;
  for (const word1 of words1) {
    if (words2.includes(word1)) {
      matches++;
    }
  }
  
  // Calculate Jaccard similarity
  const uniqueWords = new Set([...words1, ...words2]);
  return matches / uniqueWords.size;
}

/**
 * Checks for direct matches in simple patterns
 * @param {string} input - Preprocessed user input
 * @param {string} intentName - Intent name to check against
 * @returns {boolean} - Whether there's a direct match
 */
function checkDirectMatch(input, intentName) {
  // Check for exact matches in greeting patterns
  if (intentName === 'greeting') {
    const greetingPatterns = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'];
    if (greetingPatterns.includes(input)) {
      return true;
    }
  }
  
  // Check for exact matches in farewell patterns
  if (intentName === 'goodbye') {
    const farewellPatterns = ['bye', 'goodbye', 'see you', 'see you later', 'farewell'];
    if (farewellPatterns.includes(input)) {
      return true;
    }
  }
  
  // Check for exact matches in thanks patterns
  if (intentName === 'thanks') {
    const thanksPatterns = ['thanks', 'thank you', 'appreciate it', 'thanks a lot'];
    if (thanksPatterns.includes(input)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Classifies the intent of a user message
 * @param {string} message - User message
 * @returns {Promise<{intent: string, confidence: number}>} - Classified intent and confidence score
 */
export async function classifyIntent(message) {
  try {
    // Preprocess the message
    const preprocessedMessage = preprocessText(message);
    
    // Check for direct matches first
    for (const [intentName, intentData] of Object.entries(processedIntents)) {
      if (checkDirectMatch(preprocessedMessage, intentName)) {
        return {
          intent: intentName,
          confidence: 1.0
        };
      }
    }
    
    // Find the best matching intent
    let bestMatch = { intent: 'unknown', confidence: 0 };
    
    for (const [intentName, intentData] of Object.entries(processedIntents)) {
      // Check each pattern in the intent
      let maxConfidence = 0;
      
      for (const pattern of intentData.patterns) {
        const similarity = calculateSimilarity(preprocessedMessage, preprocessText(pattern));
        
        if (similarity > maxConfidence) {
          maxConfidence = similarity;
          
          // If we find a very high match, no need to check further
          if (similarity > 0.9) break;
        }
      }
      
      // If this intent has higher confidence than our current best match
      if (maxConfidence > bestMatch.confidence && maxConfidence >= intentData.threshold) {
        bestMatch = {
          intent: intentName,
          confidence: maxConfidence
        };
      }
    }
    
    // If no good match found, return unknown intent
    return bestMatch.confidence > 0.3 
      ? bestMatch 
      : { intent: 'unknown', confidence: 0.1 };
      
  } catch (error) {
    console.error('Error classifying intent:', error);
    return { intent: 'unknown', confidence: 0 };
  }
}