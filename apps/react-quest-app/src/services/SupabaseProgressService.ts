/**
 * SupabaseProgressService
 * 
 * Syncs user progress to Supabase for cross-device persistence.
 */

import { supabase } from '../lib/supabase';
import type { UserProgress, CategoryProgress, ConceptCategory, ExerciseResult } from '@repo/shared-templates';

/**
 * Initialize user progress record if it doesn't exist.
 * Note: auth.users is handled by Supabase Auth, we only care about user_progress table.
 */
export async function initializeUserProgress(userId: string): Promise<void> {
    const { data, error } = await supabase
        .from('user_progress')
        .select('user_id')
        .eq('user_id', userId)
        .single();

    if (error && error.code === 'PGRST116') { // Record not found
        await supabase.from('user_progress').insert({
            user_id: userId,
            total_xp: 0,
            categories: {},
            last_updated: new Date().toISOString(),
        });
    }
}

/**
 * Get user progress from Supabase
 */
export async function getCloudProgress(userId: string): Promise<UserProgress | null> {
    try {
        const { data, error } = await supabase
            .from('user_progress')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) {
            if (error.code !== 'PGRST116') {
                console.error('[SupabaseProgress] Failed to get progress:', error);
            }
            return null;
        }

        if (data) {
            return {
                userId: data.user_id,
                totalXP: Number(data.total_xp) || 0,
                categories: (data.categories as Record<ConceptCategory, CategoryProgress>) || {},
                lastUpdated: new Date(data.last_updated),
            };
        }
        return null;
    } catch (error) {
        console.error('[SupabaseProgress] Unexpected error in getCloudProgress:', error);
        return null;
    }
}

/**
 * Save user progress to Supabase
 */
export async function saveCloudProgress(userId: string, progress: UserProgress): Promise<void> {
    try {
        const { error } = await supabase
            .from('user_progress')
            .upsert({
                user_id: userId,
                total_xp: progress.totalXP,
                categories: progress.categories,
                last_updated: new Date().toISOString(),
            }, {
                onConflict: 'user_id'
            });

        if (error) throw error;
    } catch (error) {
        console.error('[SupabaseProgress] Failed to save cloud progress:', error);
        throw error;
    }
}

/**
 * Update category progress in Supabase after exercise completion
 */
export async function updateCategoryProgress(
    userId: string,
    category: ConceptCategory,
    result: ExerciseResult
): Promise<void> {
    try {
        // 1. Get current cloud progress
        const cloudProgress = await getCloudProgress(userId);
        
        let currentProgress: UserProgress;
        if (cloudProgress) {
            currentProgress = cloudProgress;
        } else {
            currentProgress = {
                userId,
                totalXP: 0,
                categories: {} as Record<ConceptCategory, CategoryProgress>,
                lastUpdated: new Date(),
            };
        }

        // 2. Get or create category progress
        const categoryProgress: CategoryProgress = currentProgress.categories[category] || {
            category,
            xp: 0,
            level: 1,
            streak: 0,
            exercisesCompleted: 0,
            exercisesAttempted: 0,
        };

        // 3. Update category stats
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

        // 4. Update total XP
        currentProgress.totalXP += result.xpEarned;
        currentProgress.categories[category] = categoryProgress;

        // 5. Save back to cloud
        await saveCloudProgress(userId, currentProgress);
    } catch (error) {
        console.error('[SupabaseProgress] Failed to update category progress:', error);
    }
}

/**
 * Merge local and cloud progress (same logic as before)
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
