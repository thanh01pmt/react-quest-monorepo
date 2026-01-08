/**
 * Random Item Mode - Client-side item randomization utility
 * 
 * Randomly hides items on each Run to teach algorithmic search.
 * Only applies when gameConfig.mode === 'random'
 */

import type { MazeConfig, Collectible } from '../types';

/** Shuffle array using Fisher-Yates algorithm */
function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Random integer between min and max (inclusive) */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export interface RandomizationResult {
  /** Randomized collectibles (some hidden) */
  collectibles: Collectible[];
  /** Updated interactive states (randomized on/off) */
  interactiveStates: Record<string, string>;
  /** Updated item goals matching visible items */
  itemGoals: { crystal?: number; key?: number };
}

/**
 * Randomize items for Random Item Mode
 * 
 * - Crystals: Randomly hide some (keep between [maxCrystals/2, maxCrystals))
 * - Switches: Randomize initial state (on/off)
 * 
 * @param config - Original MazeConfig
 * @returns RandomizationResult with visible items, states, and goals
 */
export function randomizeItems(config: MazeConfig): RandomizationResult {
  const collectibles = config.collectibles || [];
  const interactibles = config.interactibles || [];
  
  // 1. Randomize crystals - hide some
  const maxCrystals = config.itemPool?.crystal ?? collectibles.filter(c => c.type === 'crystal').length;
  const minCrystals = Math.max(1, Math.floor(maxCrystals / 2));
  
  // Target count: random between [min, max)
  const targetCrystals = maxCrystals > minCrystals 
    ? randomInt(minCrystals, maxCrystals - 1) 
    : maxCrystals;
  
  // Shuffle and keep target number of crystals
  const crystals = collectibles.filter(c => c.type === 'crystal');
  const others = collectibles.filter(c => c.type !== 'crystal');
  const shuffledCrystals = shuffle(crystals);
  const visibleCrystals = shuffledCrystals.slice(0, targetCrystals);
  
  // 2. Randomize switch states
  const randomizedStates: Record<string, string> = {};
  for (const item of interactibles) {
    if (item.type === 'switch') {
      randomizedStates[item.id] = Math.random() > 0.5 ? 'on' : 'off';
    }
  }
  
  // 3. Calculate item goals
  const itemGoals: { crystal?: number; key?: number } = {};
  if (targetCrystals > 0) {
    itemGoals.crystal = targetCrystals;
  }
  
  return {
    collectibles: [...visibleCrystals, ...others],
    interactiveStates: randomizedStates,
    itemGoals,
  };
}

/**
 * Check if a config is in random mode
 */
export function isRandomMode(config: MazeConfig): boolean {
  return config.mode === 'random';
}
