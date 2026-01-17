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
  serializedSession: string; // JSON string of PracticeSession
  createdAt: any;
  createdBy?: string;
}

/**
 * Save a practice session to Firestore for sharing
 * Returns the document ID (shareId)
 */
export async function saveSharedSession(session: PracticeSession, userId?: string): Promise<string> {
  try {
    // Simply stringify the entire session object.
    // This avoids Firestore issues with:
    // 1. Nested arrays (pathCoords)
    // 2. undefined values (JSON.stringify removes them)
    // 3. Complex nested objects
    const serializedSession = JSON.stringify(session);
    
    const sessionData = {
      serializedSession,
      createdAt: serverTimestamp(),
      createdBy: userId || 'anonymous',
      version: 2 // Bump version to indicate new format
    };

    const docRef = await addDoc(collection(db, SHARED_SESSIONS_COLLECTION), sessionData);
    console.log('[SharedSessionService] Session saved with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('[SharedSessionService] Failed to save shared session:', error);
    if (error instanceof Error) {
        console.error('Error details:', error.message, error.stack);
    }
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
      
      try {
        // Parse the full session from JSON string
        const parsedSession = JSON.parse(data.serializedSession) as PracticeSession;
        
        // Return with new ID/Timestamp semantics for the receiver
        return {
           ...parsedSession,
           id: `shared_${shareId}_${Date.now()}`,
           startedAt: new Date(), // Reset start time
        };
      } catch (e) {
         console.error('[SharedSessionService] Failed to parse serialized session', e);
         // Fallback for version 1 if needed? 
         // For now, assume consistent V2 since V1 was broken for complex maps.
         return null; 
      }
    } else {
      console.warn('[SharedSessionService] Shared session not found:', shareId);
      return null;
    }
  } catch (error) {
    console.error('[SharedSessionService] Failed to get shared session:', error);
    return null; // Let UI handle error
  }
}
