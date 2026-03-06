export interface Contest {
	id: string;
	title: string;
	description: string;
	start_time: string;
	end_time: string;
	duration_minutes: number;
	status: "draft" | "scheduled" | "active" | "ended";
	quest_data: AlgoQuest[];
	settings: ContestSettings;
	created_at: string;
}

export interface ContestSettings {
	allowLanguages: string[];
	showHiddenTestCases: boolean;
	maxSubmissionsPerChallenge: number;
	scoringMode: "highest" | "latest";
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

export interface Participant {
	id: string;
	contest_id: string;
	user_id: string;
	username: string;
	display_name: string;
	email: string;
	phone: string;
	joined_at: string;
	deadline: string;
	status: "active" | "submitted" | "timed_out" | "disqualified";
}

export interface Submission {
	id: string;
	contest_id: string;
	participant_id: string;
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
	participant_id: string;
	contest_id: string;
	display_name: string;
	username: string;
	status: string;
	total_score: number;
	challenges_solved: number;
	last_submission: string;
}
