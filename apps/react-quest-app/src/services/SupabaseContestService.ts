import { supabase } from "../lib/supabase";
import type {
	ContestConfig,
	ContestParticipant,
	ContestSubmission,
} from "../types/contest";

/**
 * Fetch generic contest metadata (before login)
 */
export async function getPublicContestInfo(
	contestId: string,
): Promise<{ id: string; title: string; description: string; status: string } | null> {
	try {
		const { data, error } = await supabase.rpc("get_public_contest_info", { p_contest_id: contestId });
		if (error) {
			console.error("[SupabaseService] getPublicContestInfo error:", error);
			return null;
		}
		if (!data) return null;
		return data as { id: string; title: string; description: string; status: string };
	} catch (err) {
		console.error("[SupabaseService] getPublicContestInfo catch:", err);
		return null;
	}
}

/**
 * Resolve a contest session from Supabase via RPC using auth.uid().
 * Uses SECURITY DEFINER RPC function so anon role can access conditionally.
 */
export async function resolveSupabaseContestSession(
	contestId: string,
): Promise<{ contest: ContestConfig; participant: ContestParticipant } | null> {
	try {
		const { data: bp, error } = await supabase.rpc("resolve_participant_session", {
			p_contest_id: contestId,
		});

		if (error || !bp) {
			console.error(
				"[SupabaseService] resolveSupabaseContestSession error:",
				error,
			);
			return null;
		}

		const board = bp.exam_boards;
		const exam = board?.exams;
		const participantData = bp.participant;

		if (!exam) return null;

		// Map to ContestConfig
		const contestConfig: ContestConfig = {
			id: exam.id,
			title: exam.title || "Kỳ thi",
			description: "",
			startTime: bp.board_start_time || bp.started_at || new Date().toISOString(),
			endTime: bp.board_end_time || bp.deadline || new Date().toISOString(),
			durationMinutes: bp.duration_minutes || 120,
			status: "active",
			questData: exam.quest_data || [],
			credentials: { type: "pre-created" },
			settings: {
				allowLanguages: ["javascript", "python"],
				showHiddenTestCases: true,
				maxSubmissionsPerChallenge: 0,
				scoringMode: "highest",
			},
		};

		// Map to ContestParticipant
		const participant: ContestParticipant = {
			id: bp.id,
			contestId: exam.id,
			uid: bp.participant_id,
			username: participantData?.username || "student",
			displayName: participantData?.display_name || "Student",
			email: "",
			phone: "",
			joinedAt: bp.started_at || new Date().toISOString(),
			deadline: bp.deadline || new Date().toISOString(),
			status: bp.status,
			isTest: bp.is_test || false,
		};

		return { contest: contestConfig, participant };
	} catch (error) {
		console.error("[SupabaseService] Unexpected error:", error);
		return null;
	}
}

/**
 * Save a submission to Supabase via RPC.
 * Uses SECURITY DEFINER RPC so anon role can insert
 * without direct INSERT permission on submissions table.
 */
export async function saveSupabaseSubmission(
	data: Omit<ContestSubmission, "id">,
): Promise<void> {
	const { error } = await supabase.rpc("submit_contest_solution", {
		p_board_participant_id: data.participantId,
		p_exam_id: data.contestId,
		p_quest_id: data.questId,
		p_code: data.code,
		p_language: data.language,
		p_test_results: data.testResults,
		p_score: data.score,
		p_attempt: data.attempt,
	});

	if (error) {
		console.error("[SupabaseService] saveSubmission error:", error);
	}
}

/**
 * Update the status of a board participant via RPC.
 * Scoped strictly to the provided UUID.
 */
export async function updateSupabaseParticipantStatus(
	participantId: string,
	status: string,
): Promise<void> {
	const { error } = await supabase.rpc("update_participant_status_rpc", {
		p_bp_id: participantId,
		p_status: status,
	});

	if (error) {
		console.error("[SupabaseService] updateParticipantStatus error:", error);
	}
}

/**
 * Get all submissions for a participant (board_participant) in a contest.
 */
export async function getSupabaseSubmissions(
	contestId: string,
	participantId: string,
): Promise<ContestSubmission[]> {
	const { data, error } = await supabase
		.from("submissions")
		.select("*")
		.eq("board_participant_id", participantId)
		.eq("exam_id", contestId)
		.order("submitted_at", { ascending: false });

	if (error) {
		console.error("[SupabaseService] getSubmissions error:", error);
		return [];
	}

	return (data || []).map((row) => ({
		id: row.id,
		contestId: row.exam_id,
		participantId: row.board_participant_id,
		questId: row.quest_id,
		code: row.code,
		language: row.language,
		testResults: row.test_results,
		score: row.score,
		attempt: row.attempt,
		submittedAt: row.submitted_at,
	})) as ContestSubmission[];
}

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
