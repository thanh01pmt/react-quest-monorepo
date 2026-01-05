/**
 * FirestoreProgressService
 * 
 * Syncs user progress to Firestore for cross-device persistence.
 */

import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from '../config/firebase';
import type { UserProgress, CategoryProgress, ConceptCategory, ExerciseResult } from '@repo/shared-templates';

// Firestore collection names
const USERS_COLLECTION = 'users';
const PROGRESS_SUBCOLLECTION = 'progress';

/**
 * Initialize user document if it doesn't exist
 */
export async function initializeUserDocument(user: User): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, user.uid);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    await setDoc(userRef, {
      displayName: user.displayName || user.email?.split('@')[0],
      email: user.email,
      photoURL: user.photoURL,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    });
  } else {
    await updateDoc(userRef, {
      lastLoginAt: serverTimestamp(),
    });
  }
}

/**
 * Get user progress from Firestore
 */
export async function getCloudProgress(userId: string): Promise<UserProgress | null> {
  try {
    const progressRef = doc(db, USERS_COLLECTION, userId, PROGRESS_SUBCOLLECTION, 'main');
    const progressDoc = await getDoc(progressRef);

    if (progressDoc.exists()) {
      const data = progressDoc.data();
      return {
        userId,
        totalXP: data.totalXP || 0,
        categories: data.categories || {},
        lastUpdated: data.lastUpdated?.toDate() || new Date(),
      };
    }
    return null;
  } catch (error) {
    console.error('Failed to get cloud progress:', error);
    return null;
  }
}

/**
 * Save user progress to Firestore
 */
export async function saveCloudProgress(userId: string, progress: UserProgress): Promise<void> {
  try {
    const progressRef = doc(db, USERS_COLLECTION, userId, PROGRESS_SUBCOLLECTION, 'main');
    await setDoc(progressRef, {
      totalXP: progress.totalXP,
      categories: progress.categories,
      lastUpdated: serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to save cloud progress:', error);
    throw error;
  }
}

/**
 * Update category progress in Firestore after exercise completion
 */
export async function updateCategoryProgress(
  userId: string,
  category: ConceptCategory,
  result: ExerciseResult
): Promise<void> {
  try {
    const progressRef = doc(db, USERS_COLLECTION, userId, PROGRESS_SUBCOLLECTION, 'main');
    const progressDoc = await getDoc(progressRef);

    let currentProgress: UserProgress;
    
    if (progressDoc.exists()) {
      const data = progressDoc.data();
      currentProgress = {
        userId,
        totalXP: data.totalXP || 0,
        categories: data.categories || {},
        lastUpdated: new Date(),
      };
    } else {
      currentProgress = {
        userId,
        totalXP: 0,
        categories: {} as Record<ConceptCategory, CategoryProgress>,
        lastUpdated: new Date(),
      };
    }

    // Get or create category progress
    const categoryProgress: CategoryProgress = currentProgress.categories[category] || {
      category,
      xp: 0,
      level: 1,
      streak: 0,
      exercisesCompleted: 0,
      exercisesAttempted: 0,
    };

    // Update category stats
    categoryProgress.exercisesAttempted++;
    if (result.success) {
      categoryProgress.exercisesCompleted++;
      categoryProgress.xp += result.xpEarned;
      categoryProgress.streak++;
      
      // Level up every 100 XP
      categoryProgress.level = Math.floor(categoryProgress.xp / 100) + 1;
    } else {
      categoryProgress.streak = 0;
    }
    categoryProgress.lastActivity = new Date();

    // Update total XP
    currentProgress.totalXP += result.xpEarned;
    currentProgress.categories[category] = categoryProgress;

    await saveCloudProgress(userId, currentProgress);
  } catch (error) {
    console.error('Failed to update category progress:', error);
    // Fail silently - local progress is still saved
  }
}

/**
 * Merge local and cloud progress, taking the higher values
 */
export function mergeProgress(
  local: UserProgress | null,
  cloud: UserProgress | null
): UserProgress | null {
  if (!local && !cloud) return null;
  if (!local) return cloud;
  if (!cloud) return local;

  const merged: UserProgress = {
    userId: cloud.userId,
    totalXP: Math.max(local.totalXP, cloud.totalXP),
    categories: { ...local.categories },
    lastUpdated: new Date(),
  };

  // Merge each category, taking higher values
  for (const [category, cloudCat] of Object.entries(cloud.categories)) {
    const localCat = merged.categories[category as ConceptCategory];
    
    if (!localCat) {
      merged.categories[category as ConceptCategory] = cloudCat;
    } else {
      merged.categories[category as ConceptCategory] = {
        ...localCat,
        xp: Math.max(localCat.xp, cloudCat.xp),
        level: Math.max(localCat.level, cloudCat.level),
        streak: Math.max(localCat.streak, cloudCat.streak),
        exercisesCompleted: Math.max(localCat.exercisesCompleted, cloudCat.exercisesCompleted),
        exercisesAttempted: Math.max(localCat.exercisesAttempted, cloudCat.exercisesAttempted),
      };
    }
  }

  return merged;
}
