import React, { useState, useEffect } from 'react';
import { Play, RotateCcw } from 'lucide-react';

interface StreamingChatMessageProps {
    slides?: string[];
    fullText?: string;
    typingSpeed?: number;
    slideInterval?: number;
}

const DEFAULT_SLIDES = [
    'https://placehold.co/1200x700/png?text=Screenshot+1',
    'https://placehold.co/1200x700/png?text=Screenshot+2',
    'https://placehold.co/1200x700/png?text=Screenshot+3',
];

const DEFAULT_TEXT = "I've analyzed your brand profile and created a preliminary strategy. Here are some screenshots of the draft posts and the layout I'm proposing for your social media channels. \n\nI can start scheduling these right away, or we can refine them further based on your feedback. What do you think?";

export default function StreamingChatMessage({
    slides: propsSlides,
    fullText = DEFAULT_TEXT,
    typingSpeed = 20,
    slideInterval = 4500,
}: StreamingChatMessageProps) {
    // Add debug log to verify mount
    useEffect(() => {
        console.log("🚀 StreamingChatMessage mounted");
    }, []);

    // Force placeholder slides if none provided
    const slides = (propsSlides && propsSlides.length > 0) ? propsSlides : DEFAULT_SLIDES;

    const [currentSlide, setCurrentSlide] = useState(0);
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(true);
    const [isCompleted, setIsCompleted] = useState(false);

    // Screenshot rotation - strictly separate interval
    useEffect(() => {
        if (!slides || slides.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, slideInterval);

        return () => clearInterval(interval);
    }, [slides, slideInterval]);

    // Typing animation - strictly separate interval
    useEffect(() => {
        if (!isTyping || !fullText) {
            if (!isTyping && fullText) setDisplayedText(fullText);
            return;
        }

        let index = 0;
        setDisplayedText('');
        setIsCompleted(false);

        const interval = setInterval(() => {
            if (index < fullText.length) {
                setDisplayedText((prev) => prev + fullText.charAt(index));
                index++;
            } else {
                setIsTyping(false);
                setIsCompleted(true);
                clearInterval(interval);
            }
        }, typingSpeed);

        return () => clearInterval(interval);
    }, [isTyping, fullText, typingSpeed]);

    const handleRestartDemo = () => {
        setDisplayedText('');
        setIsTyping(true);
        setIsCompleted(false);
    };

    return (
        <div className="flex flex-col w-full max-w-2xl group/demo mx-auto sm:mx-0 bg-gray-100 rounded-2xl shadow-sm border border-gray-200/50 overflow-hidden transition-all relative">
            {/* EXTREME DEBUG MARKER */}
            <div className="absolute top-0 left-0 z-[100] bg-yellow-400 text-black font-black text-[10px] px-2 py-1 rounded-br-lg shadow-xl animate-bounce">
                🚀 STREAMING COMPONENT ACTIVE
            </div>

            {/* Unified Bubble Contents */}

            {/* Rotating Screenshot Area - strictly above text, edge-to-edge at top */}
            <div
                className="relative w-full h-[300px] overflow-hidden bg-white border-b-4 border-red-500"
                style={{ minHeight: '300px', display: 'block', backgroundColor: '#f3f4f6', borderBottom: '4px solid red' }}
            >
                {slides && slides.length > 0 ? (
                    <div
                        className="transition-opacity duration-500 ease-in-out w-full h-full"
                        key={currentSlide}
                    >
                        <img
                            src={slides[currentSlide]}
                            alt={`Screenshot ${currentSlide + 1}`}
                            className="w-full h-full object-cover block"
                            style={{ display: 'block', width: '100%', height: '100%' }}
                            loading="lazy"
                            onLoad={() => console.log("✅ Image loaded:", slides[currentSlide])}
                            onError={(e) => console.error("❌ Image failed to load:", slides[currentSlide], e)}
                        />
                    </div>
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold bg-gray-100 italic">
                        No images available to display.
                    </div>
                )}

                {/* Slide Indicator Dots */}
                {slides && slides.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1.5 px-2 py-1.5 bg-black/30 rounded-full backdrop-blur-md">
                        {slides.map((_, i) => (
                            <div
                                key={i}
                                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === currentSlide ? 'bg-white scale-125' : 'bg-white/40'}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Typing Text Area - internal padding within the unified bubble */}
            <div className="relative px-5 py-4 min-h-[60px]">
                <div className="text-text-primary whitespace-pre-wrap text-[15px] leading-relaxed">
                    {displayedText}
                    {isTyping && (
                        <span
                            className="inline-block w-1.5 h-4 ml-1 bg-purple-500 animate-pulse align-middle pointer-events-none"
                            style={{ verticalAlign: 'middle', marginTop: '-2px', pointerEvents: 'none' }}
                        >
                            ▍
                        </span>
                    )}
                </div>

                {/* Restart overlay within bubble */}
                {isCompleted && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover/demo:opacity-100 transition-opacity">
                        <button
                            onClick={handleRestartDemo}
                            className="p-1.5 bg-white/90 hover:bg-white text-purple-600 rounded-md border border-purple-100 shadow-sm transition-all active:scale-95"
                            title="Restart demo"
                        >
                            <RotateCcw size={14} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
