/**
 * Anonymous Player Service
 * Handles tracking game scores for users before they register/login
 */

import { supabase } from '@/lib/supabase';

// Storage keys
const STORAGE_KEYS = {
  ANONYMOUS_ID: 'squidgy_anonymous_id',
  GAME_HISTORY: 'squidgy_game_history',
  HIGH_SCORE: 'squidgy_high_score',
} as const;

// Types
export interface GameResult {
  score: number;
  durationSeconds: number;
  obstaclesDodged: Record<string, number>;
  clustersCompleted: number;
  clusterBonuses: number;
  playedAt: string;
}

export interface AnonymousPlayerData {
  anonymousId: string;
  gameHistory: GameResult[];
  highScore: number;
}

/**
 * Generate a UUID v4
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get or create an anonymous player ID
 * Persists across browser sessions via localStorage
 */
export function getOrCreateAnonymousId(): string {
  try {
    let anonymousId = localStorage.getItem(STORAGE_KEYS.ANONYMOUS_ID);

    if (!anonymousId) {
      anonymousId = `anon_${generateUUID()}`;
      localStorage.setItem(STORAGE_KEYS.ANONYMOUS_ID, anonymousId);
    }

    return anonymousId;
  } catch (error) {
    // Fallback if localStorage is not available
    console.warn('localStorage not available, using session-only ID');
    return `anon_${generateUUID()}`;
  }
}

/**
 * Get the current anonymous ID without creating one
 */
export function getAnonymousId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.ANONYMOUS_ID);
  } catch {
    return null;
  }
}

/**
 * Save a game score to local history
 */
export function saveGameScore(result: GameResult): void {
  try {
    const history = getGameHistory();
    history.push(result);

    // Keep last 50 games max
    const trimmedHistory = history.slice(-50);
    localStorage.setItem(STORAGE_KEYS.GAME_HISTORY, JSON.stringify(trimmedHistory));

    // Update high score if needed
    const currentHigh = getHighScore();
    if (result.score > currentHigh) {
      localStorage.setItem(STORAGE_KEYS.HIGH_SCORE, result.score.toString());
    }
  } catch (error) {
    console.warn('Failed to save game score:', error);
  }
}

/**
 * Get all game history for the anonymous player
 */
export function getGameHistory(): GameResult[] {
  try {
    const historyJson = localStorage.getItem(STORAGE_KEYS.GAME_HISTORY);
    return historyJson ? JSON.parse(historyJson) : [];
  } catch {
    return [];
  }
}

/**
 * Get the high score for the anonymous player
 */
export function getHighScore(): number {
  try {
    const highScore = localStorage.getItem(STORAGE_KEYS.HIGH_SCORE);
    return highScore ? parseInt(highScore, 10) : 0;
  } catch {
    return 0;
  }
}

/**
 * Get total games played
 */
export function getTotalGamesPlayed(): number {
  return getGameHistory().length;
}

/**
 * Clear all anonymous player data
 * Call this after successfully linking to a user account
 */
export function clearAnonymousData(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.ANONYMOUS_ID);
    localStorage.removeItem(STORAGE_KEYS.GAME_HISTORY);
    localStorage.removeItem(STORAGE_KEYS.HIGH_SCORE);
  } catch (error) {
    console.warn('Failed to clear anonymous data:', error);
  }
}

/**
 * Link anonymous game scores to a user account
 * @param userId - The user's ID after login/registration
 * @returns Number of scores linked
 */
export async function linkScoresToUser(userId: string): Promise<number> {
  const anonymousId = getAnonymousId();
  const history = getGameHistory();

  if (!anonymousId || history.length === 0) {
    return 0;
  }

  try {
    // Call Supabase RPC function to link scores
    const { data, error } = await supabase.rpc('link_anonymous_scores', {
      p_anonymous_id: anonymousId,
      p_user_id: userId,
    });

    if (error) {
      console.error('Failed to link anonymous scores:', error);
      // Still save locally as backup
      return 0;
    }

    // Clear local data after successful link
    clearAnonymousData();

    return data || history.length;
  } catch (error) {
    console.error('Error linking scores to user:', error);
    return 0;
  }
}

/**
 * Submit a game score to the backend (for anonymous players)
 * Scores are stored with anonymous_id and can be linked later
 */
export async function submitAnonymousScore(result: GameResult): Promise<boolean> {
  const anonymousId = getOrCreateAnonymousId();

  // Always save locally first
  saveGameScore(result);

  try {
    const { error } = await supabase.from('anonymous_game_scores').insert({
      anonymous_id: anonymousId,
      score: result.score,
      duration_seconds: result.durationSeconds,
      obstacles_dodged: result.obstaclesDodged,
      clusters_completed: result.clustersCompleted,
      played_at: result.playedAt,
    });

    if (error) {
      console.warn('Failed to submit score to backend:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.warn('Error submitting anonymous score:', error);
    return false;
  }
}

/**
 * Get full anonymous player data
 */
export function getAnonymousPlayerData(): AnonymousPlayerData {
  return {
    anonymousId: getOrCreateAnonymousId(),
    gameHistory: getGameHistory(),
    highScore: getHighScore(),
  };
}
