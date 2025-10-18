import React, { useState } from 'react';
import { Send, HelpCircle } from 'lucide-react';

interface QuestionPromptProps {
  question: string;
  onAnswer?: (answer: string) => void;
  className?: string;
}

/**
 * Displays a question from the agent and collects user's answer
 * Used when agent_status is "Waiting"
 */
export default function QuestionPrompt({ 
  question, 
  onAnswer,
  className = '' 
}: QuestionPromptProps) {
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!answer.trim() || !onAnswer) return;
    
    setIsSubmitting(true);
    try {
      await onAnswer(answer);
      setAnswer(''); // Clear after successful submission
    } catch (error) {
      console.error('Error submitting answer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`question-prompt ${className}`}>
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        {/* Question Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 bg-amber-100 rounded-full">
            <HelpCircle size={20} className="text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800 mb-1">
              Agent is waiting for your response
            </p>
            <p className="text-gray-700">{question}</p>
          </div>
        </div>

        {/* Answer Input */}
        <form onSubmit={handleSubmit} className="mt-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer here..."
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              autoFocus
            />
            <button
              type="submit"
              disabled={!answer.trim() || isSubmitting}
              className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send size={16} />
              )}
              <span>{isSubmitting ? 'Sending...' : 'Send'}</span>
            </button>
          </div>
        </form>

        {/* Helper Text */}
        <p className="text-xs text-gray-500 mt-2">
          The agent needs this information to continue processing your request.
        </p>
      </div>
    </div>
  );
}