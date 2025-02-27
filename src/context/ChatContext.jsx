import React, { createContext, useContext, useState, useEffect } from 'react';
import { classifyIntent } from '../services/chatbot/intentClassifier';
import { getAzureOpenAIResponse } from '../services/chatbot/azureOpenAI';
import { generateResponse } from '../services/chatbot/responseManager';

const ChatContext = createContext();

// Initial greeting message from the chatbot
const initialMessages = [
  {
    id: '1',
    type: 'bot',
    content: 'Hi there! 👋 I\'m Hassane\'s assistant. How can I help you today?',
    timestamp: new Date().toISOString(),
  }
];

// Common quick reply options
const defaultQuickReplies = [
  { id: 'about', text: 'Tell me about Hassane', intent: 'about' },
  { id: 'skills', text: 'What skills does he have?', intent: 'skills' },
  { id: 'projects', text: 'Show recent projects', intent: 'projects' },
  { id: 'contact', text: 'How to contact him?', intent: 'contact' }
];

export function ChatProvider({ children }) {
  // Chat state
  const [messages, setMessages] = useState(() => {
    // Try to load messages from sessionStorage
    const savedMessages = sessionStorage.getItem('chatMessages');
    return savedMessages ? JSON.parse(savedMessages) : initialMessages;
  });
  
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [quickReplies, setQuickReplies] = useState(defaultQuickReplies);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Effects
  
  // Save messages to sessionStorage
  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem('chatMessages', JSON.stringify(messages));
    }
  }, [messages]);
  
  // Update unread count when chat is closed
  useEffect(() => {
    if (!isOpen && messages.length > initialMessages.length) {
      // Count bot messages that came after the last user message
      let lastUserIndex = messages.length - 1;
      while (lastUserIndex >= 0 && messages[lastUserIndex].type !== 'user') {
        lastUserIndex--;
      }
      
      if (lastUserIndex >= 0) {
        const newMessages = messages.slice(lastUserIndex + 1)
          .filter(msg => msg.type === 'bot').length;
        setUnreadCount(prev => prev + newMessages);
      }
    } else if (isOpen) {
      // Reset unread count when chat is opened
      setUnreadCount(0);
    }
  }, [isOpen, messages]);

  // Send message function
  const sendMessage = async (content, isQuickReply = false) => {
    if (!content.trim()) return;
    
    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      // Classify intent
      let intentResult;
      if (isQuickReply) {
        // If it's a quick reply, we already know the intent
        const selectedReply = quickReplies.find(reply => reply.text === content);
        intentResult = {
          intent: selectedReply?.intent || '',
          confidence: 1
        };
      } else {
        intentResult = await classifyIntent(content);
      }
      
      let responseContent;
      
      // If confidence is high enough, use predefined responses, otherwise use Azure OpenAI
      if (intentResult.confidence >= 0.7) {
        responseContent = await generateResponse(intentResult.intent, content);
      } else {
        // Use Azure OpenAI for dynamic responses
        responseContent = await getAzureOpenAIResponse(
          content, 
          messages.slice(-6) // Send last 6 messages for context
        );
      }
      
      // Add bot response with a slight delay for natural feel
      setTimeout(() => {
        const botResponse = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: responseContent,
          timestamp: new Date().toISOString(),
          intent: intentResult.intent,
        };
        
        setMessages(prev => [...prev, botResponse]);
        setIsLoading(false);
        
        // Update quick replies based on context
        updateContextualQuickReplies(intentResult.intent);
      }, 600);
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: "I'm having trouble processing your request. Please try again later.",
        timestamp: new Date().toISOString(),
        isError: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };
  
  // Update quick replies based on conversation context
  const updateContextualQuickReplies = (currentIntent) => {
    // Define contextual quick replies for different intents
    const contextualReplies = {
      'about': [
        { id: 'education', text: 'What is his education?', intent: 'education' },
        { id: 'experience', text: 'Any work experience?', intent: 'experience' },
        { id: 'skills', text: 'What are his skills?', intent: 'skills' }
      ],
      'skills': [
        { id: 'projects', text: 'Projects using these skills?', intent: 'projects' },
        { id: 'certifications', text: 'Any certifications?', intent: 'certificates' },
        { id: 'tech-stack', text: 'What tech stack?', intent: 'tech_stack' }
      ],
      'projects': [
        { id: 'github', text: 'GitHub link?', intent: 'github' },
        { id: 'recent-project', text: 'Most recent project?', intent: 'recent_project' },
        { id: 'tech-used', text: 'Technologies used?', intent: 'technologies' }
      ],
      'contact': [
        { id: 'email', text: 'Email address?', intent: 'email' },
        { id: 'linkedin', text: 'LinkedIn profile?', intent: 'linkedin' },
        { id: 'resume', text: 'Download resume?', intent: 'resume' }
      ],
      'default': defaultQuickReplies
    };
    
    // Select appropriate quick replies or fallback to default
    const newReplies = contextualReplies[currentIntent] || contextualReplies.default;
    setQuickReplies(newReplies);
  };
  
  // Clear chat history
  const clearChat = () => {
    setMessages(initialMessages);
    setQuickReplies(defaultQuickReplies);
    sessionStorage.removeItem('chatMessages');
  };
  
  // Toggle chat window
  const toggleChat = () => {
    setIsOpen(prev => !prev);
    if (!isOpen) {
      setUnreadCount(0);
    }
  };

  // Context value
  const contextValue = {
    messages,
    isOpen,
    isLoading,
    quickReplies,
    unreadCount,
    sendMessage,
    clearChat,
    toggleChat
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
}

// Custom hook for using chat context
export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export default ChatContext;