/**
 * Contest Types
 *
 * TypeScript interfaces for the contest entrance feature.
 */

import type { Quest } from "@repo/quest-player";

// ─── Supabase: exam_boards ────────────────────────────────

export interface ContestConfig {
	id: string;
	title: string;
	description: string;
	/** ISO 8601 timestamp — contest opens for login */
	startTime: string;
	/** ISO 8601 timestamp — contest closes */
	endTime: string;
	/** Duration in minutes for each contestant (from their login time) */
	durationMinutes: number;
	/** Current contest status */
	status: "scheduled" | "active" | "ended";
	/** Inline quest JSON data for each challenge */
	questData: Quest[];
	/** Auth credentials type */
	credentials: {
		type: "pre-created";
	};
	/** Contest settings */
	settings: ContestSettings;
}

export interface ContestSettings {
	/** Allowed coding languages */
	allowLanguages: ("blockly" | "javascript" | "python")[];
	/** Whether to show hidden test cases to contestants */
	showHiddenTestCases: boolean;
	/** Max submissions per challenge (0 = unlimited) */
	maxSubmissionsPerChallenge: number;
	/** Scoring mode: highest score across attempts, or latest attempt */
	scoringMode: "highest" | "latest";
}

// ─── Supabase: board_participants ────────────────

export interface ContestParticipant {
	id?: string;
	contestId: string;
	/** Supabase Auth UID */
	uid: string;
	/** Login username (e.g. "ts001") */
	username: string;
	/** Display name provided during registration */
	displayName: string;
	/** Contact email for results */
	email: string;
	/** Contact phone for results */
	phone: string;
	/** When the participant joined */
	joinedAt: string;
	/** Participant's personal deadline (joinedAt + durationMinutes) */
	deadline: string;
	/** Status */
	status: "active" | "submitted" | "timed_out" | "disqualified";
	/** Is this a test session? */
	isTest?: boolean;
}

// ─── Supabase: board_submissions ──────────────────

export interface ContestSubmission {
	id?: string;
	contestId: string;
	participantId: string;
	/** Quest ID of the challenge */
	questId: string;
	/** Submitted code */
	code: string;
	/** Language used */
	language: string;
	/** Test case results */
	testResults: SubmissionTestResult[];
	/** Score for this submission (0-100) */
	score: number;
	/** When submitted */
	submittedAt: string;
	/** Attempt number (1-based) */
	attempt: number;
}

export interface SubmissionTestResult {
	id: string;
	status: "pass" | "fail" | "error" | "pending";
	actualOutput: string;
	error?: string;
}

// ─── UI State Types ─────────────────────────────────────────────────

export type ChallengeStatus = "pending" | "attempted" | "passed" | "failed";

export interface ChallengeState {
	questId: string;
	title: string;
	status: ChallengeStatus;
	bestScore: number;
	attempts: number;
	/** Saved code for this challenge (preserved when switching) */
	savedCode?: string;
}

export interface ContestState {
	contest: ContestConfig | null;
	participant: ContestParticipant | null;
	challenges: ChallengeState[];
	currentChallengeIndex: number;
	/** Total score across all challenges */
	totalScore: number;
	/** Whether the exam has been locked (submitted or timed out) */
	isLocked: boolean;
	/** Loading states */
	loading: boolean;
	error: string | null;
}
