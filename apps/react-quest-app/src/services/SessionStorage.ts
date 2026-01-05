/**
 * Practice Session Storage
 * 
 * IndexedDB storage for practice sessions with base64 encoding for privacy.
 */

import type { PracticeSession, ExerciseResult } from '@repo/shared-templates';

const DB_NAME = 'QuestPracticeDB';
const DB_VERSION = 1;
const STORE_NAME = 'sessions';

// Simple base64 encode/decode for privacy (not security)
function encode(data: unknown): string {
  return btoa(encodeURIComponent(JSON.stringify(data)));
}

function decode<T>(encoded: string): T {
  return JSON.parse(decodeURIComponent(atob(encoded)));
}

/**
 * Open IndexedDB connection
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('userId', 'userId', { unique: false });
        store.createIndex('completedAt', 'completedAt', { unique: false });
      }
    };
  });
}

/**
 * Session storage interface
 */
interface StoredSession {
  id: string;
  userId?: string;
  data: string; // base64 encoded session
  updatedAt: number;
  completedAt?: number;
}

/**
 * Save a practice session
 */
export async function saveSession(session: PracticeSession): Promise<void> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    
    const storedSession: StoredSession = {
      id: session.id,
      userId: session.userId,
      data: encode(session),
      updatedAt: Date.now(),
      completedAt: session.completedAt?.getTime(),
    };
    
    const request = store.put(storedSession);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Load a practice session by ID
 */
export async function loadSession(id: string): Promise<PracticeSession | null> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    
    const request = store.get(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const stored = request.result as StoredSession | undefined;
      if (stored) {
        const session = decode<PracticeSession>(stored.data);
        // Restore Date objects
        session.startedAt = new Date(session.startedAt);
        if (session.completedAt) {
          session.completedAt = new Date(session.completedAt);
        }
        resolve(session);
      } else {
        resolve(null);
      }
    };
  });
}

/**
 * Get all incomplete sessions for a user
 */
export async function getIncompleteSessions(userId?: string): Promise<PracticeSession[]> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const stored = request.result as StoredSession[];
      const sessions = stored
        .filter(s => !s.completedAt && (!userId || s.userId === userId))
        .map(s => {
          const session = decode<PracticeSession>(s.data);
          session.startedAt = new Date(session.startedAt);
          return session;
        });
      resolve(sessions);
    };
  });
}

/**
 * Delete a session
 */
export async function deleteSession(id: string): Promise<void> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    
    const request = store.delete(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Clean up old completed sessions (older than 7 days)
 */
export async function cleanupOldSessions(): Promise<number> {
  const db = await openDB();
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const stored = request.result as StoredSession[];
      let deleted = 0;
      
      for (const session of stored) {
        if (session.completedAt && session.completedAt < cutoff) {
          store.delete(session.id);
          deleted++;
        }
      }
      
      resolve(deleted);
    };
  });
}

/**
 * Update exercise result in session
 */
export async function updateSessionResult(
  sessionId: string,
  result: ExerciseResult
): Promise<void> {
  const session = await loadSession(sessionId);
  if (!session) return;
  
  session.results.push(result);
  session.currentIndex++;
  
  // Mark complete if all exercises done
  if (session.currentIndex >= session.exercises.length) {
    session.completedAt = new Date();
  }
  
  await saveSession(session);
}
