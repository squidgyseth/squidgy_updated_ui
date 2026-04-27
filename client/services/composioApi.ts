/**
 * Composio API client.
 *
 * Thin wrapper around the FastAPI backend's /api/composio/* routes
 * (squidgy_updated_backend/routes/composio.py). The backend orchestrates
 * Composio's REST API; we just hand off the user_id + toolkit and surface
 * results to the connect UI.
 */

import { getBackendUrl } from '@/lib/envConfig';

const BACKEND_URL = getBackendUrl();

export interface ComposioConnection {
  toolkit: string;
  status: 'initiated' | 'active' | 'expired' | 'revoked' | 'failed';
  connected_at?: string | null;
  composio_connection_id?: string;
}

export interface ComposioConnectResult {
  redirect_url: string;
  connection_id: string;
  status: string;
}

async function jsonOrThrow<T>(res: Response, label: string): Promise<T> {
  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new Error(`${label} failed: ${res.status} ${detail}`);
  }
  return res.json() as Promise<T>;
}

/**
 * Initiate a Composio OAuth flow for (user, toolkit). Returns a redirect URL
 * the user must open to authorize. The connection is also persisted with
 * status='initiated' so the UI can show a pending state without polling.
 */
export async function connectToolkit(userId: string, toolkit: string): Promise<ComposioConnectResult> {
  const res = await fetch(`${BACKEND_URL}/api/composio/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, toolkit })
  });
  return jsonOrThrow<ComposioConnectResult>(res, 'composio.connect');
}

/**
 * List connections for a user. Use to render Connect/Reconnect/Connected
 * states next to each toolkit on an agent's onboarding card.
 */
export async function listConnections(userId: string): Promise<ComposioConnection[]> {
  const res = await fetch(`${BACKEND_URL}/api/composio/status?user_id=${encodeURIComponent(userId)}`);
  const data = await jsonOrThrow<{ user_id: string; connections: ComposioConnection[] }>(res, 'composio.status');
  return data.connections || [];
}

export async function disconnectToolkit(userId: string, toolkit: string): Promise<void> {
  const res = await fetch(
    `${BACKEND_URL}/api/composio/connection?user_id=${encodeURIComponent(userId)}&toolkit=${encodeURIComponent(toolkit)}`,
    { method: 'DELETE' }
  );
  await jsonOrThrow<{ success: boolean }>(res, 'composio.disconnect');
}

/**
 * Convenience helper: which of the toolkits required by an agent are not yet
 * active for a user. The connect UI renders one button per missing toolkit.
 */
export function pendingToolkits(required: string[], connections: ComposioConnection[]): string[] {
  const active = new Set(connections.filter(c => c.status === 'active').map(c => c.toolkit));
  return required.filter(t => !active.has(t));
}
