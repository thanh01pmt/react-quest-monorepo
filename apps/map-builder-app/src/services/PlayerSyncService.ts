/**
 * PlayerSyncService - Handles syncing quests from Builder to Player
 * 
 * Supports two modes:
 * - Local (same origin): Uses localStorage
 * - Production (cross-origin): Uses URL-encoded quest data
 */

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
  
  // Fields to REMOVE (debug only, not needed for gameplay)
  const fieldsToRemove = [
    'rawSolution',        // Debug only - raw action trace
    'basicSolution',      // Alternative solution format (debug)
    // 'structuredSolution' - KEEP for answer comparison/hints
  ];
  
  fieldsToRemove.forEach(field => {
    delete stripped[field];
  });
  
  // Strip redundant placement_coords from pathInfo (blocks already has this data)
  if (stripped.pathInfo) {
    delete stripped.pathInfo.placement_coords;
    delete stripped.pathInfo.params; // Empty params object
  }
  
  // Strip verbose solution data (keep only essential)
  if (stripped.solution) {
    // Keep: itemGoals (for scoring), optimalBlocks (for star rating)
    // Remove: rawActions (debug)
    delete stripped.solution.rawActions;
  }
  
  // Remove empty or null values to reduce size
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
 * Uses base64 encoding (pako gzip can be added later for larger quests)
 */
export function compressQuest(quest: QuestData): string {
  try {
    const jsonString = JSON.stringify(quest);
    // Use base64 encoding - URL safe variant
    const base64 = btoa(unescape(encodeURIComponent(jsonString)));
    // Make it URL-safe by replacing + with - and / with _
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
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
 * Save quest to localStorage for local sync
 */
export function saveQuestToLocalStorage(quest: QuestData): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BUILDER_QUEST, JSON.stringify(quest));
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
    return stored ? JSON.parse(stored) : null;
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
    return `${syncPath}?quest=${encoded}`;
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
      const syncUrl = buildSyncUrl(url);
      window.open(syncUrl, '_blank');
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
          error: `Quest too large for URL sync (${syncUrl.length} chars). Try reducing map size or using shorter variable names.` 
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
