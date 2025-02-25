import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const QuickReplyButtons = ({ replies, onReplyClick }) => {
  const [showNavigation, setShowNavigation] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  
  const containerRef = useRef(null);

  // Check if navigation buttons should be shown
  useEffect(() => {
    const checkScroll = () => {
      if (!containerRef.current) return;
      
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10); // 10px buffer
      setShowNavigation(scrollWidth > clientWidth);
    };

    checkScroll();
    
    // Add resize listener
    window.addEventListener('resize', checkScroll);
    
    // Add scroll listener to containerRef
    const currentRef = containerRef.current;
    if (currentRef) {
      currentRef.addEventListener('scroll', checkScroll);
    }
    
    return () => {
      window.removeEventListener('resize', checkScroll);
      if (currentRef) {
        currentRef.removeEventListener('scroll', checkScroll);
      }
    };
  }, [replies]);

  const scroll = (direction) => {
    if (containerRef.current) {
      const scrollAmount = 200;
      const newScrollLeft = direction === 'left' 
        ? containerRef.current.scrollLeft - scrollAmount
        : containerRef.current.scrollLeft + scrollAmount;
        
      containerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.2,
        when: 'beforeChildren',
        staggerChildren: 0.07
      }
    }
  };

  const buttonVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 15
      }
    }
  };

  if (!replies || replies.length === 0) return null;

  return (
    <div className="relative px-4 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex items-center"
      >
        {/* Left scroll button */}
        {showNavigation && (
          <motion.button
            onClick={() => scroll('left')}
            className={`absolute left-1 z-10 p-1 rounded-full shadow-sm bg-white dark:bg-gray-800 ${
              canScrollLeft 
                ? 'opacity-100 text-gray-700 dark:text-gray-300' 
                : 'opacity-0 cursor-default'
            } transition-opacity`}
            aria-label="Scroll left"
            disabled={!canScrollLeft}
            initial={{ opacity: 0 }}
            animate={{ opacity: canScrollLeft ? 1 : 0 }}
            whileHover={canScrollLeft ? { scale: 1.1 } : {}}
            whileTap={canScrollLeft ? { scale: 0.95 } : {}}
          >
            <ChevronLeft className="h-4 w-4" />
          </motion.button>
        )}
        
        {/* Replies container */}
        <div
          ref={containerRef}
          className="flex space-x-2 overflow-x-auto scrollbar-hide px-1 py-1 w-full"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {replies.map((reply, index) => (
            <motion.button
              key={index}
              onClick={() => onReplyClick(reply)}
              className="px-4 py-2 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200 
                        rounded-full shadow-sm border border-gray-200 dark:border-gray-700 whitespace-nowrap
                        hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-800
                        hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex-shrink-0"
              variants={buttonVariants}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              {reply}
            </motion.button>
          ))}
        </div>
        
        {/* Right scroll button */}
        {showNavigation && (
          <motion.button
            onClick={() => scroll('right')}
            className={`absolute right-1 z-10 p-1 rounded-full shadow-sm bg-white dark:bg-gray-800 ${
              canScrollRight 
                ? 'opacity-100 text-gray-700 dark:text-gray-300' 
                : 'opacity-0 cursor-default'
            } transition-opacity`}
            aria-label="Scroll right"
            disabled={!canScrollRight}
            initial={{ opacity: 0 }}
            animate={{ opacity: canScrollRight ? 1 : 0 }}
            whileHover={canScrollRight ? { scale: 1.1 } : {}}
            whileTap={canScrollRight ? { scale: 0.95 } : {}}
          >
            <ChevronRight className="h-4 w-4" />
          </motion.button>
        )}
      </motion.div>
    </div>
  );
};

export default QuickReplyButtons;