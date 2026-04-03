import { supabase } from "../lib/supabase";
import type {
	ContestConfig,
	ContestParticipant,
	ContestSubmission,
} from "../types/contest";

export type {
	ContestConfig,
	ContestParticipant,
	ContestSubmission,
};

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
 * Join a contest as a participant (for both registered and test users)
 */
export async function joinContest(
	contestId: string,
	displayName: string,
	isTest = true,
): Promise<{ participantId: string } | null> {
	try {
		const { data, error } = await supabase.rpc("join_contest_rpc", {
			p_contest_id: contestId,
			p_display_name: displayName,
			p_is_test: isTest,
		});

		if (error) {
			console.error("[SupabaseService] joinContest error:", error);
			throw error;
		}

		return { participantId: data as string };
	} catch (err) {
		console.error("[SupabaseService] joinContest catch:", err);
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
 * Submit a solution to the Judge API (Express).
 * This replaces direct Supabase RPC calls for logic/algo challenges.
 */
export async function submitToJudgeApi(
	data: Omit<ContestSubmission, "id">,
): Promise<{ submissionId: string; score: number } | null> {
	try {
		const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
		const { data: sessionData } = await supabase.auth.getSession();
		const accessToken = sessionData?.session?.access_token;

		const response = await fetch(`${apiUrl}/submissions-code`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${accessToken}`,
			},
			body: JSON.stringify({
				board_participant_id: data.participantId,
				exam_id: data.contestId,
				quest_id: data.questId,
				code: data.code,
				language: data.language,
			}),
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.error || "Submission failed");
		}

		const result = await response.json();
		return {
			submissionId: result.submission_id,
			score: result.score,
		};
	} catch (error) {
		console.error("[SupabaseService] submitToJudgeApi error:", error);
		return null;
	}
}

/**
 * Submit a Scratch .sb3 file to the Judge API.
 */
export async function submitSb3File(
	participantId: string,
	contestId: string,
	questId: string,
	file: File,
	isDryRun: boolean = false
): Promise<{ submissionId: string; status: string } | null> {
	try {
		const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
		const { data: sessionData } = await supabase.auth.getSession();
		const accessToken = sessionData?.session?.access_token;

		const formData = new FormData();
		formData.append("sb3file", file);
		formData.append("board_participant_id", participantId);
		formData.append("exam_id", contestId);
		formData.append("quest_id", questId);
		formData.append("is_dry_run", isDryRun.toString());

		const response = await fetch(`${apiUrl}/submit`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
			body: formData,
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.error || "Upload failed");
		}

		const result = await response.json();
		return {
			submissionId: result.submission_id,
			status: result.status,
		};
	} catch (error) {
		console.error("[SupabaseService] submitSb3File error:", error);
		return null;
	}
}

/**
 * @deprecated Use submitToJudgeApi
 */
export async function saveSupabaseSubmission(
	data: Omit<ContestSubmission, "id">,
): Promise<void> {
	await submitToJudgeApi(data);
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
		workerLog: row.worker_log,
		timeMs: row.time_ms,
	})) as ContestSubmission[];
}

/**
 * Get a single submission by its ID.
 */
export async function getSubmissionById(
	submissionId: string,
): Promise<ContestSubmission | null> {
	const { data, error } = await supabase
		.from("submissions")
		.select("*")
		.eq("id", submissionId)
		.single();

	if (error || !data) {
		console.error("[SupabaseService] getSubmissionById error:", error);
		return null;
	}

	return {
		id: data.id,
		contestId: data.exam_id,
		participantId: data.board_participant_id,
		questId: data.quest_id,
		code: data.code,
		language: data.language,
		testResults: data.test_results,
		score: data.score,
		attempt: data.attempt,
		submittedAt: data.submitted_at,
		workerLog: data.worker_log,
		timeMs: data.time_ms,
	} as ContestSubmission;
}

/**
 * Lấy lịch sử nộp bài của participant cho một câu hỏi
 */
export async function getSubmissionHistory(
	questId: string,
	examId?: string,
): Promise<any[]> {
	try {
		const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
		const { data: sessionData } = await supabase.auth.getSession();
		const accessToken = sessionData?.session?.access_token;

		const url = new URL(`${apiUrl}/submit/history/${questId}`);
		if (examId) url.searchParams.append("exam_id", examId);

		const response = await fetch(url.toString(), {
			method: "GET",
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		});

		if (!response.ok) {
			throw new Error("Failed to fetch history");
		}

		return await response.json();
	} catch (error) {
		console.error("[SupabaseService] getSubmissionHistory error:", error);
		return [];
	}
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
