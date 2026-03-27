import { supabase } from "../lib/supabase";
import type {
	ContestConfig,
	ContestParticipant,
	ContestSubmission,
} from "../types/contest";

/**
 * Fetch a contest (Board Participant session) from Supabase
 * mapped to ContestConfig interface for compatibility.
 */
export async function getSupabaseContestSession(
	boardParticipantId: string,
): Promise<{ contest: ContestConfig; participant: ContestParticipant } | null> {
	try {
		// Fetch Board Participant + Board + Exam + Round
		const { data: bp, error } = await supabase
			.from("board_participants")
			.select(
				`
        *,
        exam_boards (
          *,
          exams (*)
        )
      `,
			)
			.eq("id", boardParticipantId)
			.single();

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
			id: exam.id, // THE REAL EXAM ID
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
			contestId: exam.id, // Link to the exam id
			uid: bp.participant_id, // Placeholder or real UID if available
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
 * Save a submission to Supabase
 */
export async function saveSupabaseSubmission(
	data: Omit<ContestSubmission, "id">,
): Promise<void> {
	const { error } = await supabase.from("submissions").insert({
		board_participant_id: data.participantId,
		exam_id: data.contestId, // In our mapping, this might need refinement
		quest_id: data.questId,
		code: data.code,
		language: data.language,
		test_results: data.testResults,
		score: data.score,
		attempt: data.attempt,
		submitted_at: new Date().toISOString(),
	});

	if (error) {
		console.error("[SupabaseService] saveSubmission error:", error);
	}
}

export async function updateSupabaseParticipantStatus(
	participantId: string,
	status: string,
): Promise<void> {
	await supabase
		.from("board_participants")
		.update({ status })
		.eq("id", participantId);
}
