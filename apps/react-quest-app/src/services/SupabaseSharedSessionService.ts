/**
 * SupabaseSharedSessionService
 * 
 * Persists practice sessions to Supabase to allow sharing.
 */

import { supabase } from '../lib/supabase';
import type { PracticeSession } from '@repo/shared-templates';

export interface SharedSessionData {
    id?: string;
    serialized_session: string;
    original_session_id: string;
    user_id: string | null;
    share_type: 'clean' | 'full';
    created_at?: string;
    updated_at?: string;
}

/**
 * Share a session using Supabase.
 */
export async function shareSession(
    session: PracticeSession, 
    mode: 'clean' | 'full',
    userId: string | null = null
): Promise<string> {
    try {
        let sessionToShare = { ...session };
        if (mode === 'clean') {
            sessionToShare = {
                ...session,
                currentIndex: 0,
                results: [],
                startedAt: new Date(),
                completedAt: undefined,
                exercises: session.exercises.map(ex => ({ ...ex }))
            };
        }

        const serialized_session = JSON.stringify(sessionToShare);
        const original_session_id = session.id;

        // Check for existing share using auth.uid() or null
        const { data: existingShares, error: checkError } = await supabase
            .from('shared_sessions')
            .select('id, serialized_session')
            .eq('original_session_id', original_session_id)
            .eq('user_id', userId)
            .eq('share_type', mode)
            .limit(1);

        if (checkError) throw checkError;

        if (existingShares && existingShares.length > 0) {
            const existing = existingShares[0];
            if (existing.serialized_session === serialized_session) {
                return existing.id;
            } else {
                const { error: updateError } = await supabase
                    .from('shared_sessions')
                    .update({ serialized_session, updated_at: new Date().toISOString() })
                    .eq('id', existing.id);
                if (updateError) throw updateError;
                return existing.id;
            }
        }

        // Create NEW
        const { data, error } = await supabase
            .from('shared_sessions')
            .insert({
                serialized_session,
                original_session_id,
                user_id: userId,
                share_type: mode
            })
            .select('id')
            .single();

        if (error) throw error;
        return data.id;

    } catch (error) {
        console.error('[SupabaseSharedSession] Failed to share session:', error);
        throw error;
    }
}

/**
 * Retrieve a shared session by ID
 */
export async function getSharedSession(shareId: string): Promise<PracticeSession | null> {
    try {
        const { data, error } = await supabase
            .from('shared_sessions')
            .select('*')
            .eq('id', shareId)
            .single();

        if (error) {
            console.warn('[SupabaseSharedSession] Shared session not found:', shareId);
            return null;
        }

        const parsedSession = JSON.parse(data.serialized_session) as PracticeSession;
        return {
            ...parsedSession,
            id: `shared_${shareId}_${Date.now()}`,
            startedAt: new Date(),
        };
    } catch (error) {
        console.error('[SupabaseSharedSession] Failed to get shared session:', error);
        return null;
    }
}
