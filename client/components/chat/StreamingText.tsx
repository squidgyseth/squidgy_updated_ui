import React, { useState, useEffect, useRef } from 'react';

interface StreamingTextProps {
    content: string;
    speed?: number; // ms per character
    className?: string;
    onComplete?: () => void;
    shouldStream?: boolean;
}

/**
 * A component that renders text with a typing/streaming effect.
 * It handles raw text and attempts to preserve basic whitespace.
 */
export function StreamingText({
    content,
    speed = 15,
    className = '',
    onComplete,
    shouldStream = true
}: StreamingTextProps) {
    const [displayedText, setDisplayedText] = useState(shouldStream ? '' : content);
    const [isTyping, setIsTyping] = useState(shouldStream);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const indexRef = useRef(0);

    useEffect(() => {
        if (!shouldStream) {
            setDisplayedText(content);
            setIsTyping(false);
            return;
        }

        setDisplayedText('');
        indexRef.current = 0;
        setIsTyping(true);

        const startTyping = () => {
            timerRef.current = setInterval(() => {
                if (indexRef.current < content.length) {
                    setDisplayedText((prev) => prev + content.charAt(indexRef.current));
                    indexRef.current++;
                } else {
                    if (timerRef.current) clearInterval(timerRef.current);
                    setIsTyping(false);
                    if (onComplete) onComplete();
                }
            }, speed);
        };

        startTyping();

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [content, speed, shouldStream, onComplete]);

    return (
        <div className={`${className} relative`}>
            <span className="whitespace-pre-wrap">{displayedText}</span>
            {isTyping && (
                <span
                    className="inline-block w-1.5 h-4 ml-1 bg-purple-500 animate-pulse align-middle pointer-events-none"
                    style={{ verticalAlign: 'middle', marginTop: '-2px', pointerEvents: 'none' }}
                >
                    ▍
                </span>
            )}
        </div>
    );
}

export default StreamingText;
