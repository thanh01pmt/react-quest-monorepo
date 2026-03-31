/**
 * ContestService
 *
 * Firestore CRUD operations for contests, participants, and submissions.
 */

import {
	doc,
	getDoc,
	setDoc,
	addDoc,
	collection,
	query,
	where,
	getDocs,
	updateDoc,
	serverTimestamp,
	orderBy,
	limit,
} from "firebase/firestore";
import { db } from "../config/firebase";
import type {
	ContestConfig,
	ContestParticipant,
	ContestSubmission,
} from "../types/contest";

// ─── Collections ────────────────────────────────────────────────────

const CONTESTS = "contests";
const PARTICIPANTS = "contest_participants";
const SUBMISSIONS = "contest_submissions";

// ─── Contest ────────────────────────────────────────────────────────

/**
 * Fetch a contest by its ID
 */
export async function getContest(
	contestId: string,
): Promise<ContestConfig | null> {
	try {
		const ref = doc(db, CONTESTS, contestId);
		const snap = await getDoc(ref);
		if (!snap.exists()) return null;
		return { id: snap.id, ...snap.data() } as ContestConfig;
	} catch (error) {
		console.error("[ContestService] getContest error:", error);
		return null;
	}
}

/**
 * Check if the contest is currently active (between startTime and endTime)
 */
export function isContestActive(contest: ContestConfig): boolean {
	const now = new Date();
	const start = new Date(contest.startTime);
	const end = new Date(contest.endTime);
	return now >= start && now <= end;
}

/**
 * Get the contest time status
 */
export function getContestTimeStatus(
	contest: ContestConfig,
): "not_started" | "active" | "ended" {
	const now = new Date();
	const start = new Date(contest.startTime);
	const end = new Date(contest.endTime);
	if (now < start) return "not_started";
	if (now > end) return "ended";
	return "active";
}

// ─── Participants ───────────────────────────────────────────────────

/**
 * Find an existing participant by contestId + uid
 */
export async function findParticipant(
	contestId: string,
	uid: string,
): Promise<ContestParticipant | null> {
	try {
		const q = query(
			collection(db, PARTICIPANTS),
			where("contestId", "==", contestId),
			where("uid", "==", uid),
			limit(1),
		);
		const snap = await getDocs(q);
		if (snap.empty) return null;
		const docSnap = snap.docs[0];
		return { id: docSnap.id, ...docSnap.data() } as ContestParticipant;
	} catch (error) {
		console.error("[ContestService] findParticipant error:", error);
		return null;
	}
}

/**
 * Create a new participant record
 */
export async function createParticipant(
	data: Omit<ContestParticipant, "id">,
): Promise<ContestParticipant> {
	const ref = await addDoc(collection(db, PARTICIPANTS), {
		...data,
		_createdAt: serverTimestamp(),
	});
	return { id: ref.id, ...data };
}

/**
 * Update participant status
 */
export async function updateParticipantStatus(
	participantId: string,
	status: ContestParticipant["status"],
): Promise<void> {
	const ref = doc(db, PARTICIPANTS, participantId);
	await updateDoc(ref, { status, _updatedAt: serverTimestamp() });
}

// ─── Submissions ────────────────────────────────────────────────────

/**
 * Save a submission
 */
export async function saveSubmission(
	data: Omit<ContestSubmission, "id">,
): Promise<ContestSubmission> {
	const ref = await addDoc(collection(db, SUBMISSIONS), {
		...data,
		_createdAt: serverTimestamp(),
	});
	return { id: ref.id, ...data };
}

/**
 * Get all submissions for a participant in a contest
 */
export async function getParticipantSubmissions(
	contestId: string,
	participantId: string,
): Promise<ContestSubmission[]> {
	try {
		const q = query(
			collection(db, SUBMISSIONS),
			where("contestId", "==", contestId),
			where("participantId", "==", participantId),
			orderBy("submittedAt", "desc"),
		);
		const snap = await getDocs(q);
		return snap.docs.map(
			(d) => ({ id: d.id, ...d.data() }) as ContestSubmission,
		);
	} catch (error) {
		console.error(
			"[ContestService] getParticipantSubmissions error:",
			error,
		);
		return [];
	}
}

/**
 * Get the best submission for a specific quest
 */
export async function getBestSubmission(
	contestId: string,
	participantId: string,
	questId: string,
): Promise<ContestSubmission | null> {
	try {
		const q = query(
			collection(db, SUBMISSIONS),
			where("contestId", "==", contestId),
			where("participantId", "==", participantId),
			where("questId", "==", questId),
			orderBy("score", "desc"),
			limit(1),
		);
		const snap = await getDocs(q);
		if (snap.empty) return null;
		const docSnap = snap.docs[0];
		return { id: docSnap.id, ...docSnap.data() } as ContestSubmission;
	} catch (error) {
		console.error("[ContestService] getBestSubmission error:", error);
		return null;
	}
}

/**
 * Count submissions for a specific quest
 */
export async function countSubmissions(
	contestId: string,
	participantId: string,
	questId: string,
): Promise<number> {
	try {
		const q = query(
			collection(db, SUBMISSIONS),
			where("contestId", "==", contestId),
			where("participantId", "==", participantId),
			where("questId", "==", questId),
		);
		const snap = await getDocs(q);
		return snap.size;
	} catch (error) {
		console.error("[ContestService] countSubmissions error:", error);
		return 0;
	}
}

// ─── Scoring ────────────────────────────────────────────────────────

/**
 * Calculate score from test results
 * score = (passed / total) * 100
 */
export function calculateScore(
	testResults: ContestSubmission["testResults"],
): number {
	if (testResults.length === 0) return 0;
	const passed = testResults.filter((r) => r.status === "pass").length;
	return Math.round((passed / testResults.length) * 100);
}
