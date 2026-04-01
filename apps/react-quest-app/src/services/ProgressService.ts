/**
 * Progress Service
 * 
 * Manages user progress across practice sessions.
 * Uses localStorage for local storage, with optional Firestore sync.
 */

import type { 
  UserProgress, 
  CategoryProgress, 
  ExerciseResult,
  ConceptCategory 
} from '@repo/shared-templates';
import { 
  calculateLevel, 
  createUserProgress, 
  updateCategoryProgress 
} from '@repo/shared-templates';
import { syncProgress } from './SupabaseProgressService';

const PROGRESS_KEY = 'quest_practice_progress';

/**
 * Load progress from localStorage
 */
export function loadProgress(userId?: string): UserProgress {
  try {
    const stored = localStorage.getItem(PROGRESS_KEY);
    if (stored) {
      const progress = JSON.parse(stored) as UserProgress;
      // Restore dates from JSON strings
      progress.lastUpdated = new Date(progress.lastUpdated);
      for (const cat of Object.values(progress.categories)) {
        if (cat.lastActivity) {
          cat.lastActivity = new Date(cat.lastActivity);
        }
      }
      return progress;
    }
  } catch (e) {
    console.error('[ProgressService] Failed to load progress:', e);
  }
  
  // Return fresh progress
  return createUserProgress(userId || 'anonymous');
}

/**
 * Save progress to localStorage
 */
export function saveProgress(progress: UserProgress): void {
  try {
    progress.lastUpdated = new Date();
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error('[ProgressService] Failed to save progress:', e);
  }
}

/**
 * Update progress after completing an exercise
 */
export function updateProgress(
  category: ConceptCategory,
  result: ExerciseResult,
  userId?: string | null
): UserProgress {
  const progress = loadProgress(userId || undefined);
  
  // Update category progress
  const catProgress = progress.categories[category];
  if (catProgress) {
    progress.categories[category] = updateCategoryProgress(catProgress, result);
  }
  
  // Recalculate total XP
  progress.totalXP = Object.values(progress.categories)
    .reduce((sum, cat) => sum + cat.xp, 0);
  
  saveProgress(progress);

  // Sync to cloud in background if user is logged in
  if (userId) {
    syncProgress(progress, userId).catch(err => {
        console.error('[ProgressService] Background sync failed:', err);
    });
  }

  return progress;
}

/**
 * Get summary stats for display
 */
export function getProgressSummary(progress: UserProgress): {
  totalXP: number;
  totalLevel: number;
  strongestCategory: ConceptCategory | null;
  weakestCategory: ConceptCategory | null;
  completedExercises: number;
  currentStreak: number;
} {
  const categories = Object.values(progress.categories);
  
  const totalXP = categories.reduce((sum, c) => sum + c.xp, 0);
  const totalLevel = calculateLevel(totalXP);
  const completedExercises = categories.reduce((sum, c) => sum + c.exercisesCompleted, 0);
  
  // Find strongest & weakest
  let strongest: CategoryProgress | null = null;
  let weakest: CategoryProgress | null = null;
  
  for (const cat of categories) {
    if (cat.exercisesAttempted > 0) {
      if (!strongest || cat.xp > strongest.xp) {
        strongest = cat;
      }
      if (!weakest || cat.xp < weakest.xp) {
        weakest = cat;
      }
    }
  }
  
  // Get max streak
  const currentStreak = Math.max(...categories.map(c => c.streak), 0);
  
  return {
    totalXP,
    totalLevel,
    strongestCategory: strongest?.category || null,
    weakestCategory: weakest?.category || null,
    completedExercises,
    currentStreak,
  };
}

/**
 * Reset all progress (with confirmation)
 */
export function resetProgress(): void {
  localStorage.removeItem(PROGRESS_KEY);
}
