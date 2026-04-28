/**
 * Voice service — connects Squidgy pages to the squidgy_embed voice gateway.
 *
 * Two scopes, same wire format:
 *   - Platform (this app): one shared Vapi assistant per agent. Use getAgentVoiceConfig().
 *   - Embed (external sites): per-key Vapi assistant. Lives in squidgy_embed itself.
 *
 * Required env (Vite client-side):
 *   VITE_EMBED_GATEWAY_URL    e.g. https://squidgy-embed.vercel.app
 *   VITE_VAPI_PUBLIC_KEY      Vapi browser public key (web SDK)
 * Optional:
 *   VITE_INTERNAL_VOICE_TOKEN Bearer token if the gateway has INTERNAL_VOICE_TOKEN set
 */

import Vapi from '@vapi-ai/web';

const GATEWAY = import.meta.env.VITE_EMBED_GATEWAY_URL?.replace(/\/$/, '') ?? '';
const PUBLIC_KEY_FALLBACK = import.meta.env.VITE_VAPI_PUBLIC_KEY ?? '';
const INTERNAL_TOKEN = import.meta.env.VITE_INTERNAL_VOICE_TOKEN ?? '';

export type VoiceConfig = {
  voice_enabled: true;
  assistant_id: string;
  public_key: string;
};
export type VoiceDisabled = { voice_enabled: false };
export type VoiceLookup = VoiceConfig | VoiceDisabled;

export async function getAgentVoiceConfig(agentId: string): Promise<VoiceLookup> {
  if (!GATEWAY) return { voice_enabled: false };
  const headers: Record<string, string> = {};
  if (INTERNAL_TOKEN) headers['Authorization'] = `Bearer ${INTERNAL_TOKEN}`;
  const res = await fetch(`${GATEWAY}/api/voice/agent/${encodeURIComponent(agentId)}`, { headers });
  if (!res.ok) return { voice_enabled: false };
  const data = (await res.json()) as VoiceLookup;
  if (data.voice_enabled && !data.public_key && PUBLIC_KEY_FALLBACK) {
    return { ...data, public_key: PUBLIC_KEY_FALLBACK };
  }
  return data;
}

// --- Voice session wrapper around Vapi Web SDK ---

export type VoiceState = 'idle' | 'connecting' | 'listening' | 'speaking' | 'error';

export type VoiceCallbacks = {
  onState?: (s: VoiceState) => void;
  onTranscript?: (role: 'user' | 'agent', text: string, final: boolean) => void;
  onError?: (msg: string) => void;
};

export class VoiceSession {
  private vapi: Vapi;
  private active = false;

  constructor(publicKey: string, cb: VoiceCallbacks = {}) {
    this.vapi = new Vapi(publicKey);

    this.vapi.on('call-start', () => cb.onState?.('listening'));
    this.vapi.on('call-end', () => {
      this.active = false;
      cb.onState?.('idle');
    });
    this.vapi.on('speech-start', () => cb.onState?.('speaking'));
    this.vapi.on('speech-end', () => cb.onState?.('listening'));
    this.vapi.on('error', (e: any) => {
      const flat = stringifyError(e);
      cb.onError?.(`Voice: ${flat}`);
      cb.onState?.('error');
    });
    this.vapi.on('message', (m: any) => {
      if (m?.type === 'transcript' && m.transcript) {
        const role = m.role === 'user' ? 'user' : 'agent';
        const final = m.transcriptType === 'final';
        cb.onTranscript?.(role, m.transcript, final);
      }
    });
  }

  async start(assistantId: string) {
    if (this.active) return;
    this.active = true;
    await this.vapi.start(assistantId);
  }

  stop() {
    if (!this.active) return;
    this.vapi.stop();
    this.active = false;
  }

  isActive() {
    return this.active;
  }
}

function stringifyError(e: any): string {
  if (!e) return 'unknown';
  if (typeof e === 'string') return e;
  if (e instanceof Error) return e.message;
  const candidates = [e.error?.message, e.errorMsg, e.message, e.error?.msg, e.error?.type, e.type];
  for (const c of candidates) if (typeof c === 'string' && c) return c;
  try { return JSON.stringify(e).slice(0, 200); } catch { return 'unknown vapi error'; }
}
