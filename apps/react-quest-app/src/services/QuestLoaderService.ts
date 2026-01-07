/**
 * QuestLoaderService - Handles loading quests from external sources (Builder)
 * 
 * Supports:
 * - URL parameter (?quest=<encoded> or ?data=<encoded>)
 * - LZString decompression
 * - localStorage (builderQuest)
 * - Automatic toolbox restoration from presets
 */

import LZString from 'lz-string';
import { getToolboxPresetWithFallback, type ToolboxPresetKey } from '@repo/quest-player';

export type QuestData = Record<string, unknown>;

const STORAGE_KEY = 'builderQuest';

/**
 * Helper: Restore toolbox from preset if stripped
 */
const restoreToolbox = (quest: any) => {
    // Check if blocklyConfig exists first
    if (!quest?.blocklyConfig) return;

    if (quest.blocklyConfig.toolboxPresetKey && !quest.blocklyConfig.toolbox) {
        try {
            // Use getToolboxPresetWithFallback which always returns a valid toolbox
            const preset = getToolboxPresetWithFallback(quest.blocklyConfig.toolboxPresetKey);
            console.log('[QuestLoader] Restored toolbox from preset:', quest.blocklyConfig.toolboxPresetKey);
            // Deep clone preset to avoid reference issues
            quest.blocklyConfig.toolbox = JSON.parse(JSON.stringify(preset));
        } catch (e) {
            console.error('[QuestLoader] Failed to restore toolbox preset', e);
            quest.blocklyConfig.toolbox = { kind: 'categoryToolbox', contents: [] };
        }
    } else if (!quest.blocklyConfig.toolbox) {
        // Fallback: No toolbox and no preset key -> Empty toolbox to prevent crash
        console.warn('[QuestLoader] No toolbox definition found. Using empty toolbox.');
        quest.blocklyConfig.toolbox = { kind: 'categoryToolbox', contents: [] };
    }
};

/**
 * Decompress quest data from URL-safe base64 (Legacy)
 */
export function decompressQuest(encoded: string): QuestData {
  try {
    // Restore base64 from URL-safe format
    let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if needed
    while (base64.length % 4) {
      base64 += '=';
    }
    const jsonString = decodeURIComponent(escape(atob(base64)));
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Failed to decompress quest:', error);
    throw new Error('Failed to decode quest data');
  }
}

/**
 * Load quest from URL search params
 */
export function loadFromUrl(): QuestData | null {
  try {
    const params = new URLSearchParams(window.location.search);
    // Support both 'quest' (legacy) and 'data' (new) params
    const encoded = params.get('quest') || params.get('data');
    const compression = params.get('compression');
    const isCompressed = params.get('compressed') === 'true'; // Legacy boolean check
    
    if (!encoded) {
      return null;
    }
    
    // Check for LZ compression
    if (compression === 'lz' || isCompressed) {
      console.log('[QuestLoader] Attempting LZString decompression...');
      const decompressed = LZString.decompressFromEncodedURIComponent(encoded);
      if (decompressed) {
         try {
             return JSON.parse(decompressed);
         } catch (e) {
             console.error('[QuestLoader] Failed to parse decompressed JSON', e);
         }
      }
      console.warn('[QuestLoader] LZString decompression failed or returned null');
    }
    
    // Try standard base64/url decode (legacy or fallback)
    try {
      return decompressQuest(encoded);
    } catch (e) {
       // If standard decompress fails, maybe it's just URL encoded JSON?
       try {
           const jsonStr = decodeURIComponent(encoded);
           return JSON.parse(jsonStr);
       } catch (jsonErr) {
           console.error('[QuestLoader] All decoding attempts failed');
           return null;
       }
    }
  } catch (error) {
    console.error('Failed to load quest from URL:', error);
    return null;
  }
}

/**
 * Load quest from localStorage
 */
export function loadFromLocalStorage(): QuestData | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    // Check if stored data is LZ compressed (starts with specific marker or just try)
    // LocalStorage from Builder might be compressed if on same origin
    const decompressed = LZString.decompressFromUTF16(stored);
    if (decompressed) {
        try {
            return JSON.parse(decompressed);
        } catch {
            // ignore
        }
    }
    
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load quest from localStorage:', error);
    return null;
  }
}

/**
 * Clear builder quest from localStorage
 */
export function clearBuilderQuest(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear builder quest:', error);
  }
}

/**
 * Main loader function - tries URL first, then localStorage
 */
export function loadBuilderQuest(): { quest: QuestData | null; source: 'url' | 'localStorage' | null } {
  // Try URL first (takes priority)
  const urlQuest = loadFromUrl();
  if (urlQuest) {
    restoreToolbox(urlQuest);
    return { quest: urlQuest, source: 'url' };
  }
  
  // Try localStorage
  const localQuest = loadFromLocalStorage();
  if (localQuest) {
    restoreToolbox(localQuest);
    return { quest: localQuest, source: 'localStorage' };
  }
  
  return { quest: null, source: null };
}

export default {
  loadFromUrl,
  loadFromLocalStorage,
  clearBuilderQuest,
  loadBuilderQuest,
  decompressQuest,
};
