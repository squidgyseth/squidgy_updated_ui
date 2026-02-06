import React from 'react';
import { useStreamingText } from './useStreamingText';

export function StreamingDemo() {
    const text = "Hello Soma! This is a standalone streaming utility. You can integrate this into any workflow easily. It supports configurable speed, start/restart, and onComplete callbacks.";

    const { streamedText, isStreaming, restart, stop, start } = useStreamingText(text, {
        speed: 30,
    });

    return (
        <div className="p-6 max-w-2xl mx-auto bg-white rounded-xl shadow-md space-y-4 border border-gray-100 mt-10">
            <div className="flex items-center justify-between border-b pb-4">
                <h2 className="text-xl font-bold text-gray-800">Streaming Utility Demo</h2>
                <div className="flex gap-2">
                    <button
                        onClick={restart}
                        className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition"
                    >
                        Restart
                    </button>
                    <button
                        onClick={isStreaming ? stop : start}
                        className={`px-3 py-1 rounded text-sm transition ${isStreaming
                                ? 'bg-orange-500 text-white hover:bg-orange-600'
                                : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                    >
                        {isStreaming ? 'Pause' : 'Resume'}
                    </button>
                </div>
            </div>

            <div className="min-h-[120px] p-4 bg-gray-50 rounded-lg font-mono text-gray-700 leading-relaxed relative">
                <span className="whitespace-pre-wrap">{streamedText}</span>
                {isStreaming && (
                    <span className="inline-block w-1.5 h-4 ml-1 bg-purple-500 animate-pulse align-middle">
                        ▍
                    </span>
                )}
            </div>

            <div className="text-xs text-gray-400 italic">
                Speed: 30ms/char | Status: {isStreaming ? 'Streaming...' : 'Idle'}
            </div>
        </div>
    );
}

export default StreamingDemo;
