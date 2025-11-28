import React, { useState } from 'react';

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
      {/* Question Content */}
      <div className="mb-4">
        <p className="text-text-primary leading-relaxed whitespace-pre-line">{question}</p>
      </div>

      {/* Chat-style Input */}
      <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-2 border border-grey-500 rounded-xl p-2">
          <input 
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer here..."
            disabled={isSubmitting}
            className="flex-1 bg-transparent border-none outline-none text-text-primary placeholder-text-subtle text-sm"
            autoFocus
          />
          <button 
            type="submit"
            disabled={!answer.trim() || isSubmitting}
            className="p-2 rounded-lg bg-squidgy-purple hover:bg-squidgy-purple/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 16 16">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.25 5.75L5.75 12.25M12.25 5.75L8.5 5.75M12.25 5.75L12.25 9.5" />
              </svg>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}