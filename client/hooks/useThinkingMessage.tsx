import { useState, useEffect } from 'react';

const THINKING_MESSAGES = [
  "I'm thinking",
  "I'm pondering",
  "I'm tinkering",
  "I'm combobulating",
  "I'm processing",
  "I'm analyzing",
  "I'm crafting a response",
  "I'm connecting the dots",
];

/**
 * Hook that rotates through thinking messages every 3 seconds
 * Makes the waiting experience more engaging
 */
export function useThinkingMessage(): string {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % THINKING_MESSAGES.length);
    }, 3000); // Rotate every 3 seconds

    return () => clearInterval(interval);
  }, []);

  return THINKING_MESSAGES[messageIndex];
}
