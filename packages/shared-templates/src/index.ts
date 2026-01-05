/**
 * Shared Templates Package
 * 
 * Central package for practice mode templates, types, and utilities.
 * Used by both Map Builder and Quest Player.
 */

// Types
export * from './types';

// Parser
export { 
  parseTemplate, 
  validateTemplate, 
  applyParameters 
} from './parser';

// Registry
export { 
  TemplateRegistry, 
  templateRegistry, 
  registerBundledTemplate 
} from './registry';

// Scoring
export {
  calculateXP,
  calculateLevel,
  calculateLevelProgress,
  xpToNextLevel,
  createCategoryProgress,
  updateCategoryProgress,
  createUserProgress,
  calculateTotalXP,
  shouldResetStreak,
  XP_PER_LEVEL,
  DIFFICULTY_XP_MULTIPLIER,
  MAX_STREAK_MULTIPLIER,
  PAR_TIME_SECONDS,
} from './scoring';
