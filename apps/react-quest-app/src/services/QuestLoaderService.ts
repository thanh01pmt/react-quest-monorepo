/**
 * QuestLoaderService - Handles loading quests from external sources (Builder)
 * 
 * Supports:
 * - URL parameter (?quest=<encoded>)
 * - localStorage (builderQuest)
 */

export type QuestData = Record<string, unknown>;

const STORAGE_KEY = 'builderQuest';

/**
 * Decompress quest data from URL-safe base64
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
    const encoded = params.get('quest');
    
    if (!encoded) {
      return null;
    }
    
    return decompressQuest(encoded);
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
    return stored ? JSON.parse(stored) : null;
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
    return { quest: urlQuest, source: 'url' };
  }
  
  // Try localStorage
  const localQuest = loadFromLocalStorage();
  if (localQuest) {
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
