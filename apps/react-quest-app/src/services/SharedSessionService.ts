/**
 * SharedSessionService
 * 
 * Persists practice sessions to Firestore to allow sharing exact replicas 
 * of generated maps and exercises, bypassing seed/determinism issues.
 */

import { 
  collection,
  doc, 
  getDoc, 
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { PracticeSession } from '@repo/shared-templates';

// Firestore collection name
const SHARED_SESSIONS_COLLECTION = 'shared_practice_sessions';

export interface SharedSessionData {
  config: any; // PracticeConfig
  exercises: any[]; // GeneratedExercise[] with mapData
  createdAt: any;
  createdBy?: string;
}

/**
 * Save a practice session to Firestore for sharing
 * Returns the document ID (shareId)
 */
export async function saveSharedSession(session: PracticeSession, userId?: string): Promise<string> {
  try {
    const sessionData = {
      config: session.config,
      // We must strip out runtime-only fields if any, but mapData is serializable
      exercises: session.exercises,
      createdAt: serverTimestamp(),
      createdBy: userId || 'anonymous',
      version: 1
    };

    const docRef = await addDoc(collection(db, SHARED_SESSIONS_COLLECTION), sessionData);
    console.log('[SharedSessionService] Session saved with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('[SharedSessionService] Failed to save shared session:', error);
    throw error;
  }
}

/**
 * Retrieve a shared session by ID
 */
export async function getSharedSession(shareId: string): Promise<PracticeSession | null> {
  try {
    const docRef = doc(db, SHARED_SESSIONS_COLLECTION, shareId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as SharedSessionData;
      
      // Reconstitute minimal session object
      // Note: We create a new local session ID, but reuse the exercises
      return {
        id: `shared_${shareId}_${Date.now()}`,
        config: data.config,
        exercises: data.exercises,
        currentIndex: 0,
        results: [],
        startedAt: new Date(), // Reset start time for the receiver
      };
    } else {
      console.warn('[SharedSessionService] Shared session not found:', shareId);
      return null;
    }
  } catch (error) {
    console.error('[SharedSessionService] Failed to get shared session:', error);
    return null; // Let UI handle error
  }
}
