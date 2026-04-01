import { supabase } from "../lib/supabase";
import type {
	ContestConfig,
	ContestParticipant,
	ContestSubmission,
} from "../types/contest";

/**
 * Fetch a contest (Board Participant session) from Supabase via RPC.
 * Uses SECURITY DEFINER RPC function so anon role can access
 * without direct table permissions (safe against RLS blocking).
 */
export async function getSupabaseContestSession(
	boardParticipantId: string,
): Promise<{ contest: ContestConfig; participant: ContestParticipant } | null> {
	try {
		const { data: bp, error } = await supabase.rpc("get_contest_session", {
			p_bp_id: boardParticipantId,
		});

		if (error || !bp) {
			console.error(
				"[SupabaseService] getSupabaseContestSession error:",
				error,
			);
			return null;
		}

		const board = bp.exam_boards;
		const exam = board?.exams;

		if (!exam) return null;

		// Map to ContestConfig
		const contestConfig: ContestConfig = {
			id: exam.id,
			title: exam.title || "Kỳ thi",
			description: "",
			startTime: bp.started_at || new Date().toISOString(),
			endTime: bp.deadline || new Date().toISOString(),
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
			username: "admin_preview",
			displayName: "Admin Preview",
			email: "",
			phone: "",
			joinedAt: bp.started_at || new Date().toISOString(),
			deadline: bp.deadline || new Date().toISOString(),
			status: bp.status,
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
