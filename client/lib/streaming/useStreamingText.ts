import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseStreamingTextOptions {
    /** Typing speed in milliseconds per character. Default: 15 */
    speed?: number;
    /** Callback function called when the streaming is complete. */
    onComplete?: () => void;
    /** Whether to start streaming immediately. Default: true */
    autoStart?: boolean;
}

export interface UseStreamingTextResult {
    /** The currently streamed text. */
    streamedText: string;
    /** Whether the text is currently streaming. */
    isStreaming: boolean;
    /** Function to start or resume streaming. */
    start: () => void;
    /** Function to stop streaming at the current position. */
    stop: () => void;
    /** Function to restart streaming from the beginning. */
    restart: () => void;
}

/**
 * A reusable React hook for streaming/typing text effects.
 *
 * @param text The full text to be streamed.
 * @param options Configuration for speed, callbacks, and behavior.
 * @returns {UseStreamingTextResult} The current state and control functions.
 */
export function useStreamingText(
    text: string,
    options: UseStreamingTextOptions = {}
): UseStreamingTextResult {
    const { speed = 15, onComplete, autoStart = true } = options;
    
    // Ensure text is always a string to prevent undefined errors
    const safeText = text ?? '';

    const [streamedText, setStreamedText] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const indexRef = useRef(0);
    const textRef = useRef(safeText);
    const onCompleteRef = useRef(onComplete);

    // Update refs when dependencies change
    useEffect(() => {
        textRef.current = safeText;
    }, [safeText]);

    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);

    const stop = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        setIsStreaming(false);
    }, []);

    const start = useCallback(() => {
        if (isStreaming) return;

        setIsStreaming(true);

        // Clear existing interval if any
        if (timerRef.current) clearInterval(timerRef.current);

        timerRef.current = setInterval(() => {
            if (indexRef.current < textRef.current.length) {
                const nextChar = textRef.current.charAt(indexRef.current);
                setStreamedText((prev) => prev + nextChar);
                indexRef.current++;
            } else {
                if (timerRef.current) clearInterval(timerRef.current);
                timerRef.current = null;
                setIsStreaming(false);
                if (onCompleteRef.current) onCompleteRef.current();
            }
        }, speed);
    }, [isStreaming, speed]);

    const restart = useCallback(() => {
        stop();
        setStreamedText('');
        indexRef.current = 0;
        start();
    }, [stop, start]);

    useEffect(() => {
        if (autoStart) {
            restart();
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [safeText, speed, autoStart]); // restart if text or speed changes

    return {
        streamedText,
        isStreaming,
        start,
        stop,
        restart
    };
}
