/**
 * ComposioConnect — per-agent OAuth connect cards.
 *
 * Reads `required_auth` (Composio toolkit slugs) from an agent's metadata and
 * renders one card per toolkit. Active connections show a green Connected
 * state with a Disconnect action; missing connections show a Connect button
 * that opens Composio's OAuth flow in a new tab and polls for completion.
 *
 * Wire-up: drop into the agent settings page that already exists for each
 * Composio-aware agent. Pass the current user_id and the agent's
 * required_auth from databaseAgentService.
 */

import { useEffect, useState, useCallback } from 'react';
import { Check, ExternalLink, Loader2, RefreshCw, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  connectToolkit,
  disconnectToolkit,
  listConnections,
  pendingToolkits,
  type ComposioConnection
} from '../services/composioApi';

interface ComposioConnectProps {
  userId: string;
  /** Toolkit slugs the agent needs (e.g., ['slack', 'gmail']). */
  requiredAuth: string[];
  /** Optional pretty labels keyed by toolkit slug. */
  toolkitLabels?: Record<string, string>;
  onAllConnected?: () => void;
}

const DEFAULT_LABELS: Record<string, string> = {
  slack: 'Slack',
  gmail: 'Gmail',
  hubspot: 'HubSpot',
  notion: 'Notion',
  github: 'GitHub',
  google_calendar: 'Google Calendar'
};

const POLL_INTERVAL_MS = 3000;
const POLL_MAX_MS = 5 * 60 * 1000;

export function ComposioConnect({ userId, requiredAuth, toolkitLabels, onAllConnected }: ComposioConnectProps) {
  const [connections, setConnections] = useState<ComposioConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingConnect, setPendingConnect] = useState<string | null>(null);
  const labels = { ...DEFAULT_LABELS, ...(toolkitLabels || {}) };

  const refresh = useCallback(async () => {
    try {
      const data = await listConnections(userId);
      setConnections(data);
      const pending = pendingToolkits(requiredAuth, data);
      if (pending.length === 0 && requiredAuth.length > 0) {
        onAllConnected?.();
      }
    } catch (err) {
      console.error('[ComposioConnect] status load failed', err);
    } finally {
      setLoading(false);
    }
  }, [userId, requiredAuth, onAllConnected]);

  useEffect(() => { void refresh(); }, [refresh]);

  // Lightweight poll while a connection is mid-OAuth. Stops as soon as the
  // toolkit flips to 'active' or the user closes the browser tab.
  useEffect(() => {
    if (!pendingConnect) return;
    const start = Date.now();
    const t = setInterval(async () => {
      if (Date.now() - start > POLL_MAX_MS) { clearInterval(t); setPendingConnect(null); return; }
      try {
        const data = await listConnections(userId);
        setConnections(data);
        const active = data.find(c => c.toolkit === pendingConnect && c.status === 'active');
        if (active) {
          clearInterval(t);
          setPendingConnect(null);
          toast.success(`${labels[pendingConnect] || pendingConnect} connected`);
          if (pendingToolkits(requiredAuth, data).length === 0) onAllConnected?.();
        }
      } catch (err) {
        console.error('[ComposioConnect] poll failed', err);
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [pendingConnect, userId, labels, requiredAuth, onAllConnected]);

  const handleConnect = async (toolkit: string) => {
    try {
      const { redirect_url } = await connectToolkit(userId, toolkit);
      // Open the OAuth URL in a new tab so the parent app stays mounted —
      // the polling effect above watches for status='active'.
      window.open(redirect_url, '_blank', 'noopener,noreferrer');
      setPendingConnect(toolkit);
      toast(`Authorize ${labels[toolkit] || toolkit} in the new tab to finish.`);
    } catch (err: any) {
      console.error('[ComposioConnect] connect failed', err);
      toast.error(`Couldn't start ${labels[toolkit] || toolkit} connection: ${err?.message || 'unknown error'}`);
    }
  };

  const handleDisconnect = async (toolkit: string) => {
    try {
      await disconnectToolkit(userId, toolkit);
      toast.success(`${labels[toolkit] || toolkit} disconnected`);
      await refresh();
    } catch (err: any) {
      console.error('[ComposioConnect] disconnect failed', err);
      toast.error(`Couldn't disconnect: ${err?.message || 'unknown error'}`);
    }
  };

  if (requiredAuth.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-neutral-700">External tools</h3>
        <button
          type="button"
          onClick={() => void refresh()}
          className="text-xs text-neutral-500 hover:text-neutral-700 inline-flex items-center gap-1"
          disabled={loading}
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <ul className="divide-y divide-neutral-200 rounded-md border border-neutral-200 bg-white">
        {requiredAuth.map(toolkit => {
          const conn = connections.find(c => c.toolkit === toolkit);
          const isActive = conn?.status === 'active';
          const isPending = pendingConnect === toolkit || conn?.status === 'initiated';
          const label = labels[toolkit] || toolkit;

          return (
            <li key={toolkit} className="flex items-center justify-between gap-3 px-3 py-2">
              <div className="flex items-center gap-2">
                {isActive ? (
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                ) : isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin text-neutral-500" />
                ) : (
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
                    <X className="h-3.5 w-3.5" />
                  </span>
                )}
                <span className="text-sm text-neutral-800">{label}</span>
              </div>

              {isActive ? (
                <button
                  type="button"
                  onClick={() => void handleDisconnect(toolkit)}
                  className="text-xs text-neutral-500 hover:text-red-600"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void handleConnect(toolkit)}
                  disabled={isPending}
                  className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-indigo-500 disabled:bg-neutral-300"
                >
                  {isPending ? 'Authorizing…' : 'Connect'}
                  {!isPending && <ExternalLink className="h-3 w-3" />}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
