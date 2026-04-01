/**
 * SupabaseSharedSessionService
 * 
 * Persists practice sessions to Supabase for sharing.
 * Replacement for SharedSessionService (Firestore).
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
 * Share a session with Clean or Full mode.
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
        exercises: session.exercises.map(ex => ({
          ...ex,
        }))
      };
    }

    const serialized_session = JSON.stringify(sessionToShare);
    const original_session_id = session.id;

    // Check for existing share by this user for this session/mode
    if (userId) {
      const { data: existing, error: findError } = await supabase
        .from('shared_sessions')
        .select('id, serialized_session')
        .eq('original_session_id', original_session_id)
        .eq('user_id', userId)
        .eq('share_type', mode)
        .maybeSingle();

      if (findError) throw findError;

      if (existing) {
        if (existing.serialized_session === serialized_session) {
          return existing.id;
        } else {
          const { error: updateError } = await supabase
            .from('shared_sessions')
            .update({
              serialized_session,
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id);
          
          if (updateError) throw updateError;
          return existing.id;
        }
      }
    }

    // Create NEW share
    const { data: inserted, error: insertError } = await supabase
      .from('shared_sessions')
      .insert({
        serialized_session,
        original_session_id,
        user_id: userId,
        share_type: mode,
      })
      .select('id')
      .single();

    if (insertError) throw insertError;
    return inserted.id;

  } catch (error) {
    console.error('[SupabaseSharedSessionService] Failed to share session:', error);
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
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    try {
      const parsedSession = JSON.parse(data.serialized_session) as PracticeSession;
      return {
          ...parsedSession,
          id: `shared_${shareId}_${Date.now()}`,
          startedAt: new Date(),
      };
    } catch (e) {
        console.error('[SupabaseSharedSessionService] Failed to parse session', e);
        return null;
    }
  } catch (error) {
    console.error('[SupabaseSharedSessionService] Failed to get shared session:', error);
    return null;
  }
}
