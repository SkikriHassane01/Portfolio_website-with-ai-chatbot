import { useState, useCallback } from 'react';
import { classifyIntent } from '../services/chatbot/intentClassifier';

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (message) => {
    // TODO: Implement message sending logic
  }, []);

  return {
    messages,
    isLoading,
    sendMessage
  };
}