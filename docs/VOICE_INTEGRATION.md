# Voice Integration

Voice for Squidgy agents is provided by the `squidgy_embed` gateway (separate Vercel deploy at `squidgy-embed.vercel.app`). This app calls that gateway to look up a Vapi assistant per agent, then connects the Vapi Web SDK in the browser.

## Setup

1. Set env vars in `.env.local`:
   ```
   VITE_EMBED_GATEWAY_URL=https://squidgy-embed.vercel.app
   VITE_VAPI_PUBLIC_KEY=<from Vapi dashboard → Public Key>
   ```
2. Provision a shared Vapi assistant for each agent you want voice on (run once per agent):
   ```bash
   cd ../squidgy_embed
   npx tsx scripts/provision-platform-voice.ts --agent <agent_id> \
     --first-message "Hi, I'm <Agent>..."
   ```

## Usage

Drop the button on any page:

```tsx
import VoiceButton from '@/components/voice/VoiceButton';

<VoiceButton
  agentId="brandy"
  onTranscript={(role, text, final) => {
    if (final) appendToChat(role, text);
  }}
  onError={(msg) => toast.error(msg)}
/>
```

The component hides itself if voice isn't provisioned for that agent.

## How it works

```
<VoiceButton agentId>
  └─ getAgentVoiceConfig(agentId)
       → GET squidgy-embed/api/voice/agent/<agentId>
       ← { assistant_id, public_key }
  └─ on click: VoiceSession.start(assistant_id)
       → Vapi browser SDK connects to assistant
       → Vapi calls squidgy-embed/api/voice/llm/<agentId>/chat/completions
            → squidgy_embed forwards to N8N
            → returns OpenAI-format response
       → Vapi speaks via TTS, transcribes user mic
       → events flow back through onTranscript callback
```

Cap, usage tracking, and disable toggles all live in the gateway — this app just connects.

## Scopes

- **Platform** (this app): one shared assistant per agent. All visitors share it. Cap: 1000 min/mo by default. Use `<VoiceButton agentId>`.
- **Embed** (third-party sites via squidgy_embed): per-key assistant. Configured in the embed dashboard. Use the `<script src="…/v1.js">` loader.

Both flow through the same gateway routes.
