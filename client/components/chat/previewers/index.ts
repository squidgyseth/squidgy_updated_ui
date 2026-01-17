/**
 * Preview Registry System
 *
 * Provides a configurable and extensible way to render different content previews.
 * To add a new preview type:
 * 1. Create a new component in this folder
 * 2. Register it in the previewRegistry below
 * 3. The system will automatically use it based on the preview.type field
 */

import React from 'react';

// Preview data structure (from response.preview)
export interface PreviewData {
  type: string;
  [key: string]: unknown;
}

// Preview component props
export interface PreviewComponentProps {
  data: PreviewData;
  content?: string;
  historyId?: string;
}

// Preview component type
export type PreviewComponent = React.ComponentType<PreviewComponentProps>;

// Registry of preview components
const previewRegistry: Map<string, PreviewComponent> = new Map();

/**
 * Register a preview component for a specific type
 */
export function registerPreview(type: string, component: PreviewComponent): void {
  previewRegistry.set(type, component);
  console.log(`📦 Registered preview component for type: ${type}`);
}

/**
 * Get a preview component for a specific type
 */
export function getPreviewComponent(type: string): PreviewComponent | undefined {
  return previewRegistry.get(type);
}

/**
 * Check if a preview component exists for a type
 */
export function hasPreviewComponent(type: string): boolean {
  return previewRegistry.has(type);
}

/**
 * Get all registered preview types
 */
export function getRegisteredTypes(): string[] {
  return Array.from(previewRegistry.keys());
}

/**
 * Detect preview type from content
 * Used when preview.type is not explicitly provided
 */
export function detectPreviewType(content: string): string | null {
  // HTML content detection
  if (/<html[\s>]/i.test(content) || /<body[\s>]/i.test(content) || /<!DOCTYPE/i.test(content)) {
    return 'html';
  }

  // Newsletter detection (more specific HTML patterns)
  if (/<table[\s>]/i.test(content) && /<td[\s>]/i.test(content)) {
    return 'newsletter';
  }

  // Social media content detection
  try {
    const parsed = JSON.parse(content);
    if (parsed.LinkedIn || parsed.InstagramFacebook || parsed.TikTokReels || parsed.ContentRepurposerPosts) {
      return 'social_media';
    }
  } catch {
    // Not JSON
  }

  // Lead/Contact card detection
  try {
    const parsed = JSON.parse(content);
    if (parsed.lead_name || parsed.company || parsed.email || parsed.phone) {
      return 'lead_card';
    }
  } catch {
    // Not JSON
  }

  return null;
}

// Export registry for testing/debugging
export { previewRegistry };
