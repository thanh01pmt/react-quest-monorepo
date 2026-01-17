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
  setDoc,
  query,
  where,
  getDocs,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { PracticeSession } from '@repo/shared-templates';

// Firestore collection name
const SHARED_SESSIONS_COLLECTION = 'shared_practice_sessions';

export interface SharedSessionData {
  serializedSession: string; // JSON string of PracticeSession
  originalSessionId: string; // ID of the session being shared (for deduplication)
  userId: string; // Creator ID
  shareType: 'clean' | 'full'; // Share mode
  createdAt: any;
  updatedAt?: any;
}

/**
 * Save a practice session to Firestore for sharing
 * Returns the document ID (shareId)
 */
/**
 * Share a session with Clean or Full mode.
 * - Checks for existing shares to prevent duplicates.
 * - Overwrites if content has changed.
 * - Creates new if clean.
 */
export async function shareSession(
  session: PracticeSession, 
  mode: 'clean' | 'full',
  userId: string = 'anonymous'
): Promise<string> {
  try {
    // 1. Prepare Session Data based on mode
    let sessionToShare = { ...session };
    
    if (mode === 'clean') {
      // Reset progress data for "Clean" share (Challenge friends)
      sessionToShare = {
        ...session,
        currentIndex: 0,
        results: [],
        startedAt: new Date(),
        completedAt: undefined,
        exercises: session.exercises.map(ex => ({
          ...ex,
          // Keep mapData but clear user-specifics? 
          // Actually generated mapData is part of the challenge, so keep it.
          // Reset any user solution if we ever stored it inside exercise (currently we don't seem to)
        }))
      };
    }

    const serializedSession = JSON.stringify(sessionToShare);
    const originalSessionId = session.id;

    // 2. Check for existing share
    // Logic: Find doc where originalSessionId == id AND userId == currentUserId AND shareType == mode
    // Limit 1.
    const q = query(
      collection(db, SHARED_SESSIONS_COLLECTION),
      where("originalSessionId", "==", originalSessionId),
      where("userId", "==", userId),
      where("shareType", "==", mode),
      limit(1)
    );

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // Found existing share!
      const existingDoc = querySnapshot.docs[0];
      const existingData = existingDoc.data() as SharedSessionData;

      if (existingData.serializedSession === serializedSession) {
        console.log('[SharedSessionService] Content unchanged. Returning existing ID:', existingDoc.id);
        return existingDoc.id;
      } else {
        console.log('[SharedSessionService] Content changed. Overwriting existing doc:', existingDoc.id);
        await setDoc(doc(db, SHARED_SESSIONS_COLLECTION, existingDoc.id), {
          ...existingData,
          serializedSession,
          updatedAt: serverTimestamp()
        });
        return existingDoc.id;
      }
    }

    // 3. Create NEW share
    const sessionData: SharedSessionData = {
      serializedSession,
      originalSessionId,
      userId,
      shareType: mode,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, SHARED_SESSIONS_COLLECTION), sessionData);
    console.log('[SharedSessionService] New session shared with ID:', docRef.id);
    return docRef.id;

  } catch (error) {
    console.error('[SharedSessionService] Failed to share session:', error);
    throw error;
  }
}

/**
 * Legacy wrapper for backward compatibility if needed, 
 * or just an alias for 'full' share for now.
 * @deprecated Use shareSession instead
 */
export async function saveSharedSession(session: PracticeSession, userId?: string): Promise<string> {
  return shareSession(session, 'full', userId);
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
