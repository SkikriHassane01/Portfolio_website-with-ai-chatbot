import intentsData from './intents.json';

/**
 * Response manager for the chatbot
 * Generates appropriate responses based on identified intents using the intents.json data
 */

// Organize responses by intent tag
const responsesMap = {};
const suggestionsMap = {};

// Process intents data from intents.json
intentsData.intents.forEach(intent => {
  responsesMap[intent.tag] = intent.responses;
  
  // Generate suggestions based on patterns for each intent
  // These will be used as quick reply options
  suggestionsMap[intent.tag] = generateSuggestionsFromIntent(intent);
});

/**
 * Generates suggested replies based on an intent's patterns
 * @param {Object} intent - The intent object from intents.json
 * @returns {Array} - Array of suggestion strings
 */
function generateSuggestionsFromIntent(intent) {
  // For certain intents, we'll provide custom follow-up questions
  const customSuggestions = {
    'greeting': [
      "What projects have you worked on?",
      "Tell me about your skills",
      "What's your educational background?"
    ],
    'about_me': [
      "What skills do you have?",
      "Show me your projects",
      "What's your professional experience?"
    ],
    'skills': [
      "Tell me about your data science skills",
      "What programming languages do you know?",
      "Any machine learning experience?"
    ],
    'projects': [
      "Tell me about your face recognition project",
      "What data science projects have you worked on?",
      "Any web development projects?"
    ],
    'education': [
      "Where did you study?",
      "What's your degree in?",
      "Tell me about your certifications"
    ],
    'work_experience': [
      "What internships have you done?",
      "Any industry experience?",
      "What companies have you worked for?"
    ],
    'contact': [
      "What's your email?",
      "Do you have a LinkedIn profile?",
      "How can I reach you?"
    ],
    'unknown': [
      "Tell me about your projects",
      "What skills do you have?",
      "How can I contact you?"
    ]
  };
  
  // Return custom suggestions if available
  if (customSuggestions[intent.tag]) {
    return customSuggestions[intent.tag];
  }
  
  // Otherwise, extract questions from the patterns
  let suggestions = intent.patterns
    .filter(pattern => pattern.includes('?'))
    .slice(0, 3); // Take up to 3 question patterns
    
  // If we don't have enough question patterns, add some generic ones
  if (suggestions.length < 2) {
    suggestions = [
      `Tell me more about ${intent.tag.replace('_', ' ')}`,
      "Can you elaborate?",
      "What else should I know?"
    ];
  }
  
  return suggestions;
}

/**
 * Randomly selects a response from available options
 * @param {Array} responses - Array of possible responses
 * @returns {string} - Selected response
 */
function getRandomResponse(responses) {
  if (!responses || responses.length === 0) {
    return "I'm not sure how to respond to that.";
  }
  
  const randomIndex = Math.floor(Math.random() * responses.length);
  return responses[randomIndex];
}

/**
 * Generates a response based on the identified intent
 * @param {string} intent - The identified intent
 * @returns {Promise<{response: string, suggestions: string[]}>} - Generated response and suggestions
 */
export async function generateResponse(intent) {
  try {
    // Get responses for the intent, fall back to 'unknown' if not found
    const responses = responsesMap[intent] || responsesMap.unknown;
    
    // Get suggestions for the intent, fall back to default suggestions if not found
    const suggestions = suggestionsMap[intent] || [
      "Tell me about your projects",
      "What skills do you have?",
      "How can I contact you?"
    ];
    
    // Select a random response
    const response = getRandomResponse(responses);
    
    return {
      response,
      suggestions
    };
    
  } catch (error) {
    console.error('Error generating response:', error);
    return {
      response: "I'm having trouble generating a response right now. Could you try again?",
      suggestions: [
        "Tell me about your projects",
        "What skills do you have?",
        "How can I contact you?"
      ]
    };
  }
}