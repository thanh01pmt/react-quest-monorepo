/**
 * PlayerSyncService - Handles syncing quests from Builder to Player
 * 
 * Supports two modes:
 * - Local (same origin): Uses localStorage
 * - Production (cross-origin): Uses URL-encoded quest data
 */

import { toolboxPresets } from '../config/toolboxPresets';
import LZString from 'lz-string';

// Quest type for sync (simplified - we pass the full JSON object)
export type QuestData = Record<string, unknown>;

const STORAGE_KEYS = {
  PLAYER_URL: 'playerSyncUrl',
  BUILDER_QUEST: 'builderQuest',
} as const;

const DEFAULT_PLAYER_URL = 'http://localhost:5173';

/**
 * Get the configured Player URL
 */
export function getPlayerUrl(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.PLAYER_URL);
    return stored || DEFAULT_PLAYER_URL;
  } catch {
    return DEFAULT_PLAYER_URL;
  }
}

/**
 * Set the Player URL
 */
export function setPlayerUrl(url: string): void {
  try {
    // Normalize URL: remove trailing slash
    const normalizedUrl = url.replace(/\/+$/, '');
    localStorage.setItem(STORAGE_KEYS.PLAYER_URL, normalizedUrl);
  } catch (error) {
    console.error('Failed to save Player URL:', error);
  }
}

/**
 * Check if the target Player URL is on the same origin (localhost)
 */
export function isLocalSync(playerUrl?: string): boolean {
  const url = playerUrl || getPlayerUrl();
  try {
    const targetOrigin = new URL(url).origin;
    const currentOrigin = window.location.origin;
    
    // Check if both are localhost (even with different ports)
    const isTargetLocalhost = targetOrigin.includes('localhost') || targetOrigin.includes('127.0.0.1');
    const isCurrentLocalhost = currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1');
    
    return isTargetLocalhost && isCurrentLocalhost;
  } catch {
    return false;
  }
}

/**
 * Strip unnecessary fields from quest before sync.
 * Keeps only essential data for: map rendering, scoring, and hints.
 * Removes: builder-only debugging fields, redundant path data.
 * 
 * KEEPS:
 * - structuredSolution: Needed for answer comparison/hints in Player
 * - blocklyConfig.startBlocks: Pre-placed blocks for practice
 * - solution.itemGoals + optimalBlocks: Scoring
 */
export function stripQuestForSync(quest: QuestData): QuestData {
  // Deep clone to avoid mutation
  const stripped = JSON.parse(JSON.stringify(quest)) as Record<string, any>;

  // Debug only fields to remove
  const fieldsToRemove = [
    'rawSolution',
    'basicSolution',
    // 'structuredSolution' - KEEP for answer comparison if small enough
  ];
  
  fieldsToRemove.forEach(field => {
    delete stripped[field];
  });
  
  // Strip redundant placement_coords and path metadata (Builder only)
  delete stripped.pathInfo;
  
  // Strip large metadata
  delete stripped.templateMeta;
  
  // Handle Toolbox Stripping
  if (stripped.blocklyConfig) {
    if (!stripped.blocklyConfig.toolboxPresetKey && stripped.blocklyConfig.toolbox) {
      try {
        const currentToolboxStr = JSON.stringify(stripped.blocklyConfig.toolbox);
        for (const [key, preset] of Object.entries(toolboxPresets)) {
          if (JSON.stringify(preset) === currentToolboxStr) {
            stripped.blocklyConfig.toolboxPresetKey = key;
            break;
          }
        }
      } catch (e) {
        // ignore
      }
    }

    if (stripped.blocklyConfig.toolboxPresetKey && stripped.blocklyConfig.toolbox) {
       delete stripped.blocklyConfig.toolbox;
    }
  }
  
  // Strip solution debug data
  if (stripped.solution) {
    delete stripped.solution.rawActions;
    // structuredSolution is PRESERVED as per user request
  }

  // Minify startBlocks XML if present
  if (stripped.blocklyConfig?.startBlocks) {
    stripped.blocklyConfig.startBlocks = stripped.blocklyConfig.startBlocks.replace(/>\s+</g, '><').trim();
  }

  // LOG SIZES OF REMAINING FIELDS to debug
  console.log('--- Payload Composition ---');
  Object.keys(stripped).forEach(key => {
    console.log(`${key}: ~${JSON.stringify(stripped[key]).length} chars`);
  });
  
  // Recursive cleanup of null/empty values
  const cleanEmpty = (obj: Record<string, any>): Record<string, any> => {
    for (const key in obj) {
      if (obj[key] === null || obj[key] === undefined) {
        delete obj[key];
      } else if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        cleanEmpty(obj[key]);
        if (Object.keys(obj[key]).length === 0) {
          delete obj[key];
        }
      } else if (Array.isArray(obj[key]) && obj[key].length === 0) {
        delete obj[key];
      }
    }
    return obj;
  };
  
  return cleanEmpty(stripped);
}

/**
 * Compress and encode quest data for URL transmission
 * Uses LZString for high compression ratio
 */
export function compressQuest(quest: QuestData): string {
  try {
    const jsonString = JSON.stringify(quest);
    // Use compressToEncodedURIComponent for URL safety and better compactness than base64
    const compressed = LZString.compressToEncodedURIComponent(jsonString);
    console.log(`[Sync] Compression: ${jsonString.length} chars -> ${compressed.length} chars (${Math.round(compressed.length/jsonString.length*100)}%)`);
    return compressed;
  } catch (error) {
    console.error('Failed to compress quest:', error);
    throw new Error('Failed to encode quest data');
  }
}

/**
 * Decompress quest data from URL
 */
export function decompressQuest(encoded: string): QuestData {
  try {
    const jsonString = LZString.decompressFromEncodedURIComponent(encoded);
    if (!jsonString) throw new Error('Decompression result is null');
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Failed to decompress quest:', error);
    // Fallback? No, if we use LZString we must decompress with it.
    throw new Error('Failed to decode quest data');
  }
}

/**
 * Save quest to localStorage for local sync
 */
export function saveQuestToLocalStorage(quest: QuestData): void {
  try {
    // For local storage we can use compressToUTF16 which is most efficient for storage
    const compressed = LZString.compressToUTF16(JSON.stringify(quest));
    localStorage.setItem(STORAGE_KEYS.BUILDER_QUEST, compressed);
  } catch (error) {
    console.error('Failed to save quest to localStorage:', error);
    throw new Error('Failed to save quest locally');
  }
}

/**
 * Load quest from localStorage
 */
export function loadQuestFromLocalStorage(): QuestData | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.BUILDER_QUEST);
    if (!stored) return null;
    
    // Try decompressing from UTF16 first
    const decompressed = LZString.decompressFromUTF16(stored);
    if (decompressed) {
        return JSON.parse(decompressed);
    }
    
    // Fallback for legacy uncompressed data
    try {
        return JSON.parse(stored);
    } catch {
        return null;
    }
  } catch (error) {
    console.error('Failed to load quest from localStorage:', error);
    return null;
  }
}

/**
 * Clear quest from localStorage
 */
export function clearBuilderQuest(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.BUILDER_QUEST);
  } catch (error) {
    console.error('Failed to clear builder quest:', error);
  }
}

/**
 * Build the sync URL for the Player
 */
export function buildSyncUrl(playerUrl: string, quest?: QuestData): string {
  const baseUrl = playerUrl.replace(/\/+$/, '');
  const syncPath = `${baseUrl}/sync`;
  
  // Always encode if quest is provided (caller decides whether to pass quest or save to localstorage)
  if (quest) {
    const encoded = compressQuest(quest);
    // Add extra params to help player identify compression
    return `${syncPath}?data=${encoded}&compression=lz`;
  }
  
  return syncPath;
}

/**
 * Main sync function - sends quest to Player
 * 
 * Always uses URL-based sync because Builder and Player run on different ports
 * (even on localhost), so they cannot share localStorage.
 */
export function syncToPlayer(quest: QuestData, playerUrl?: string): { success: boolean; error?: string } {
  const url = playerUrl || getPlayerUrl();
  
  // Strip unnecessary fields before sync to reduce payload size
  const strippedQuest = stripQuestForSync(quest);
  
  try {
    // Check if truly same origin (same protocol, domain, AND PORT)
    const isTrulySameOrigin = new URL(url).origin === window.location.origin;

    if (isTrulySameOrigin) {
      // Only use localStorage if truly same origin
      saveQuestToLocalStorage(strippedQuest);
      window.open(url, '_blank');
      return { success: true };
    } else {
      // Cross-origin (different ports or domains): MUST use URL param
      const syncUrl = buildSyncUrl(url, strippedQuest);
      
      // Check URL length - most browsers support ~8000 chars
      // Modern browsers handle much longer URLs (32k+), but we keep a safe limit
      // Increased from 7500 to 15000 to support moderately complex quests
      if (syncUrl.length > 30000) {
        return { 
          success: false, 
          error: `Quest too large for URL sync (${syncUrl.length} chars). Try reducing map size or use 'Export JSON' instead.` 
        };
      }
      
      window.open(syncUrl, '_blank');
      return { success: true };
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error during sync' 
    };
  }
}

export default {
  getPlayerUrl,
  setPlayerUrl,
  isLocalSync,
  compressQuest,
  decompressQuest,
  saveQuestToLocalStorage,
  loadQuestFromLocalStorage,
  clearBuilderQuest,
  buildSyncUrl,
  syncToPlayer,
};
