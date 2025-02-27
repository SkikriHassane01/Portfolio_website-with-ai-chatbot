import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Minimize2, ChevronDown, Maximize2 } from 'lucide-react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import QuickReplyButtons from './QuickReplyButtons';
import { useChat } from '../../hooks/useChat';

const ChatWindow = () => {
  // State for UI
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Get chat functionality from custom hook
  const { 
    messages, 
    isLoading, 
    sendMessage,
    quickReplies
  } = useChat();

  // Refs
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Scroll to bottom of messages when new message comes in
  useEffect(() => {
    if (isOpen && !isMinimized && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized]);

  // Check if should show scroll to bottom button
  useEffect(() => {
    const handleScroll = () => {
      if (!messagesContainerRef.current) return;
      
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom && messages.length > 3);
    };

    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, [messages.length]);

  // Auto-greet when chat first opens
  useEffect(() => {
    // Only send welcome message when first opening chat and messages are empty
    if (isOpen && messages.length === 0) {
      sendMessage({
        content: "Hello! I'm Hassane's portfolio chatbot. How can I assist you today?",
        sender: 'bot',
        initial: true
      });
    }
  }, [isOpen, messages.length, sendMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleChat = () => {
    if (isMinimized) {
      setIsMinimized(false);
    } else {
      setIsOpen(!isOpen);
    }
  };

  const minimizeChat = (e) => {
    e.stopPropagation();
    setIsMinimized(true);
    setIsFullScreen(false);
  };

  const closeChat = (e) => {
    e.stopPropagation();
    setIsOpen(false);
    setIsMinimized(false);
    setIsFullScreen(false);
  };
  
  const toggleFullScreen = (e) => {
    e.stopPropagation();
    setIsFullScreen(!isFullScreen);
  };

  const handleQuickReplyClick = (reply) => {
    sendMessage({
      content: reply,
      sender: 'user'
    });
  };

  // Animation variants
  const chatButtonVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 260,
        damping: 20
      }
    },
    hover: { 
      scale: 1.1,
      boxShadow: '0 5px 15px rgba(0, 0, 0, 0.1)',
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 10
      }
    },
    tap: { scale: 0.9 }
  };

  const chatWindowVariants = {
    hidden: { 
      opacity: 0,
      y: 20,
      scale: 0.9
    },
    visible: { 
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 25
      }
    },
    exit: { 
      opacity: 0,
      y: 20,
      scale: 0.9,
      transition: {
        duration: 0.2
      }
    }
  };

  const minimizedVariants = {
    hidden: { 
      opacity: 0,
      x: 20,
      width: 0 
    },
    visible: { 
      opacity: 1,
      x: 0,
      width: 'auto',
      transition: {
        type: 'spring',
        stiffness: 500,
        damping: 25
      }
    },
    exit: { 
      opacity: 0,
      x: 20,
      width: 0,
      transition: {
        duration: 0.2
      }
    }
  };

  return (
    <div className={`fixed z-50 flex flex-col items-end ${
      isFullScreen 
        ? 'inset-0 bg-black bg-opacity-50' 
        : 'bottom-5 right-5'
    }`}>
      {/* Main Chat Window */}
      <AnimatePresence>
        {isOpen && !isMinimized && (
          <motion.div
            className={`${
              isFullScreen 
                ? 'w-full h-full max-w-full rounded-none m-0' 
                : 'mb-4 w-full max-w-md rounded-xl max-h-[calc(100vh-120px)] h-550px'
            } bg-white dark:bg-gray-800 shadow-lg flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700`}
            variants={chatWindowVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={!isFullScreen ? { height: '550px' } : {}}
          >
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3">
                  <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800 dark:text-white">Portfolio Assistant</h3>
                  <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    <span>Online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <motion.button
                  className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                  onClick={toggleFullScreen}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label={isFullScreen ? "Exit full screen" : "Full screen"}
                >
                  {isFullScreen ? (
                    <Minimize2 className="h-5 w-5" />
                  ) : (
                    <Maximize2 className="h-5 w-5" />
                  )}
                </motion.button>
                {!isFullScreen && (
                  <motion.button
                    className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                    onClick={minimizeChat}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Minimize chat"
                  >
                    <Minimize2 className="h-5 w-5" />
                  </motion.button>
                )}
                <motion.button
                  className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                  onClick={closeChat}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Close chat"
                >
                  <X className="h-5 w-5" />
                </motion.button>
              </div>
            </div>

            {/* Chat Messages */}
            <div 
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900"
              ref={messagesContainerRef}
            >
              {messages.map((message, index) => (
                <ChatMessage 
                  key={index} 
                  message={message} 
                  isLastBotMessage={
                    index === messages.length - 1 && 
                    message.sender === 'bot' &&
                    !isLoading
                  }
                />
              ))}
              
              {/* Loading indicator */}
              {isLoading && (
                <div className="flex items-start max-w-[85%]">
                  <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3 flex-shrink-0">
                    <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex space-x-2 p-3 bg-white dark:bg-gray-800 rounded-lg rounded-tl-none shadow-sm max-w-full">
                    <div className="animate-bounce h-2 w-2 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
                    <div className="animate-bounce delay-100 h-2 w-2 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
                    <div className="animate-bounce delay-200 h-2 w-2 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
                  </div>
                </div>
              )}

              {/* Scroll to bottom button - fixed to bottom right */}
              <motion.button
                className={`fixed bottom-4 right-4 bg-white dark:bg-gray-800 shadow-md 
                           rounded-full p-2 flex items-center justify-center z-10 border border-gray-200 
                           dark:border-gray-700 ${showScrollButton ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={scrollToBottom}
                animate={{ 
                  opacity: showScrollButton ? 1 : 0,
                  scale: showScrollButton ? 1 : 0.8
                }}
                transition={{ duration: 0.2 }}
                whileHover={{ y: -2 }}
              >
                <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </motion.button>
              
              {/* Invisible element to scroll to */}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Reply Buttons */}
            {quickReplies.length > 0 && (
              <QuickReplyButtons 
                replies={quickReplies} 
                onReplyClick={handleQuickReplyClick}
              />
            )}

            {/* Chat Input */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
              <ChatInput 
                onSendMessage={sendMessage} 
                isLoading={isLoading}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Button - hidden in fullscreen mode */}
      {!isFullScreen && (
        <motion.button
          className={`flex items-center justify-center w-14 h-14 rounded-full shadow-lg ${
            isOpen || isMinimized 
              ? 'bg-gray-700 dark:bg-gray-700 text-white' 
              : 'bg-blue-600 dark:bg-blue-600 text-white'
          }`}
          onClick={toggleChat}
          variants={chatButtonVariants}
          initial="hidden"
          animate="visible"
          whileHover="hover"
          whileTap="tap"
          aria-label="Toggle chat" 
        >
          {isOpen || isMinimized ? (
            <X className="h-6 w-6" />
          ) : (
            <MessageSquare className="h-6 w-6" />
          )}
        </motion.button>
      )}
    </div>
  );
};

export default ChatWindow;