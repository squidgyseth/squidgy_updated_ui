/**
 * Drop-in mic button for any agent page (marketplace demo, agent dashboard, etc.).
 *
 *   <VoiceButton agentId="brandy" />
 *
 * Resolves the platform-shared Vapi assistant via squidgy_embed gateway,
 * connects the Vapi Web SDK on click, surfaces transcripts via onTranscript.
 *
 * Hides itself if voice isn't provisioned for this agent.
 */
import { useEffect, useRef, useState } from 'react';
import {
  getAgentVoiceConfig,
  VoiceSession,
  type VoiceConfig,
  type VoiceState,
} from '@/services/voiceService';

type Props = {
  agentId: string;
  onTranscript?: (role: 'user' | 'agent', text: string, final: boolean) => void;
  onError?: (msg: string) => void;
  className?: string;
};

export default function VoiceButton({ agentId, onTranscript, onError, className }: Props) {
  const [config, setConfig] = useState<VoiceConfig | null>(null);
  const [state, setState] = useState<VoiceState>('idle');
  const sessionRef = useRef<VoiceSession | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAgentVoiceConfig(agentId)
      .then((c) => { if (!cancelled && c.voice_enabled) setConfig(c); })
      .catch(() => {});
    return () => {
      cancelled = true;
      sessionRef.current?.stop();
    };
  }, [agentId]);

  if (!config) return null;

  async function toggle() {
    if (sessionRef.current?.isActive()) {
      sessionRef.current.stop();
      return;
    }
    if (!sessionRef.current) {
      sessionRef.current = new VoiceSession(config!.public_key, {
        onState: setState,
        onError: (m) => onError?.(m),
        onTranscript: (role, text, final) => onTranscript?.(role, text, final),
      });
    }
    setState('connecting');
    try {
      await sessionRef.current.start(config!.assistant_id);
    } catch (e: any) {
      onError?.(e?.message ?? 'voice start failed');
      setState('error');
    }
  }

  const label =
    state === 'connecting' ? 'Connecting…' :
    state === 'listening' ? 'Listening — tap to stop' :
    state === 'speaking' ? 'Speaking — tap to stop' :
    state === 'error' ? 'Retry voice' :
    'Talk to agent';

  const active = state === 'listening' || state === 'speaking';

  return (
    <button
      type="button"
      onClick={toggle}
      className={className}
      aria-label={label}
      title={label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 14px',
        borderRadius: 999,
        border: 0,
        cursor: 'pointer',
        fontSize: 14,
        fontWeight: 600,
        background: active ? '#dc2626' : '#6366f1',
        color: '#fff',
      }}
    >
      <span aria-hidden>{state === 'connecting' ? '…' : active ? '■' : '🎤'}</span>
      <span>{label}</span>
    </button>
  );
}
