# Streaming Text Utility

A reusable streaming/typing text effect system for React, ported from the dev branch.

## Files

- **`useStreamingText.ts`** - Core React hook for streaming text character-by-character
- **`StreamingDemo.tsx`** - Demo component showing usage examples
- **`index.ts`** - Exports barrel file

## Usage in N8N Chat Interface

The `StreamingAgentMessage` component automatically applies streaming to agent responses:

### Streaming Behavior

**Streamed (character-by-character):**
- Plain text responses
- Markdown responses
- Responses with `agent_status: 'Ready'` or `'Waiting'`

**NOT Streamed (shown immediately):**
- HTML content
- Social media content (content_repurposer)
- Newsletter content
- Structured JSON responses

### Configuration

```tsx
<StreamingAgentMessage
  response={n8nResponse}
  enableStreaming={true}    // Enable/disable streaming
  streamingSpeed={15}       // Speed in ms per character (default: 15)
/>
```

### Features

- ✅ Configurable speed (ms per character)
- ✅ Auto-start support
- ✅ Start/stop/restart controls
- ✅ OnComplete callback
- ✅ Streaming cursor indicator
- ✅ Automatic detection of content types
- ✅ Smart fallback for non-streamable content

## Example: Direct Hook Usage

```tsx
import { useStreamingText } from './lib/streaming';

function MyComponent() {
  const { streamedText, isStreaming, start, stop, restart } = useStreamingText(
    "Your text here",
    {
      speed: 30,
      autoStart: true,
      onComplete: () => console.log("Done!")
    }
  );

  return (
    <div>
      {streamedText}
      {isStreaming && <span className="cursor">▍</span>}
    </div>
  );
}
```

## Integration with N8N Responses

When n8n workflows return responses, they're automatically streamed in the chat interface:

1. **N8N Response Arrives** → `N8nChatInterface` receives it
2. **Message Added to State** → With `agent_status` field
3. **StreamingAgentMessage Renders** → Determines if content should stream
4. **useStreamingText Hook** → Streams text if plain text/markdown
5. **User Sees Typewriter Effect** → Character-by-character reveal

This creates a more engaging, human-like conversation experience! 🚀
