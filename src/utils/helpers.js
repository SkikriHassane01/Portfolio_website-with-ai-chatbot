/**
 * Utility functions for the chatbot
 */

/**
 * Gets a greeting based on the time of day
 * @returns {string} - Time-appropriate greeting
 */
export function getGreetingByTime() {
    const hour = new Date().getHours();
    
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }
  
  /**
   * Randomly selects an item from an array
   * @param {Array} array - Array to select from
   * @returns {*} - Randomly selected item
   */
  export function getRandomItem(array) {
    if (!array || array.length === 0) return null;
    return array[Math.floor(Math.random() * array.length)];
  }
  
  /**
   * Formats a timestamp to a relative time string (e.g., "just now", "2m ago")
   * @param {Date|string|number} timestamp - The timestamp to format
   * @returns {string} - Formatted relative time
   */
  export function formatRelativeTime(timestamp) {
    const now = new Date();
    const date = new Date(timestamp);
    const seconds = Math.floor((now - date) / 1000);
    
    if (isNaN(seconds)) {
      return '';
    }
    
    if (seconds < 60) {
      return 'just now';
    }
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes}m ago`;
    }
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours}h ago`;
    }
    
    const days = Math.floor(hours / 24);
    if (days < 7) {
      return `${days}d ago`;
    }
    
    // For older messages, show the actual date
    return date.toLocaleDateString();
  }