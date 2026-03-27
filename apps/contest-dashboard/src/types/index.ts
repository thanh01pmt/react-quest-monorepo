export type ContestStatus =
	| "draft"
	| "scheduled"
	| "lobby"
	| "active"
	| "ended";
export type ParticipantStatus =
	| "active"
	| "submitted"
	| "timed_out"
	| "disqualified";
export type PromotionMode = "manual" | "auto";
export type TimingMode = "synchronized" | "per_board";

export interface Contest {
	id: string;
	short_code?: string;
	title: string;
	description: string;
	status: ContestStatus;
	settings: ContestSettings;
	created_by?: string;
	created_at: string;
}

export interface ContestSettings {
	allowLanguages: string[];
	showHiddenTestCases: boolean;
	maxSubmissionsPerChallenge: number;
	scoringMode: "highest" | "latest";
}

export interface Round {
	id: string;
	contest_id: string;
	order_index: number;
	title: string;
	status: ContestStatus;
	timing: RoundTiming;
	promotion_config: PromotionConfig;
	created_at: string;
}

export interface RoundTiming {
	timingMode: TimingMode;
	duration_minutes: number;
	start_time: string | null;
	end_time: string | null;
}

export interface PromotionConfig {
	mode: PromotionMode;
	autoRule: {
		type: "top_n" | "min_score" | "top_percent";
		value: number;
	} | null;
}

export interface Exam {
	id: string;
	round_id: string;
	title: string;
	quest_data: AlgoQuest[];
	created_at: string;
}

export interface ExamBoard {
	id: string;
	round_id: string;
	exam_id: string | null;
	name: string;
	timing_override: RoundTiming | null;
	created_at: string;
}

export interface Participant {
	id: string;
	contest_id: string;
	user_id: string;
	username: string;
	display_name: string;
	email: string;
	phone: string;
	joined_at: string;
}

export interface BoardParticipant {
	id: string;
	board_id: string;
	participant_id: string;
	status: ParticipantStatus;
	deadline: string | null;
	started_at: string | null;
	submitted_at: string | null;
	score: number;
}

export interface AlgoQuest {
	id: string;
	gameType: "algo";
	level: number;
	titleKey: string;
	questTitleKey: string;
	descriptionKey: string;
	gameConfig: {
		type: "algo";
		description: string;
		inputFormat?: string;
		outputFormat?: string;
		constraints?: string;
		sampleCases: TestCase[];
		hiddenCases: TestCase[];
		supportedLanguages: string[];
		pythonRuntime?: string;
	};
	solution: { type: "match_output" };
}

export interface TestCase {
	input: string;
	expectedOutput: string;
	label?: string;
	isHidden?: boolean;
}

export interface ContestProgress {
	board_participant_id: string;
	completed_count: number;
	total_count: number;
	last_updated_at: string;
}

export interface Submission {
	id: string;
	board_participant_id: string;
	exam_id: string;
	quest_id: string;
	code: string;
	language: string;
	test_results: SubmissionTestResult[];
	score: number;
	attempt: number;
	submitted_at: string;
}

export interface SubmissionTestResult {
	id: string;
	status: "pass" | "fail" | "error";
	actualOutput: string;
	error?: string;
}

export interface LeaderboardEntry {
	board_participant_id: string;
	board_id?: string;
	round_id?: string;
	contest_id?: string;
	display_name: string;
	username: string;
	status: string;
	total_score: number;
	challenges_solved: number;
	last_submission: string;
	board_name?: string;
}
