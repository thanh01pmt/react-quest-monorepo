/**
 * Script: Generate Contest Data
 *
 * Tiện ích giúp tạo cấu trúc JSON cho Cuộc thi (Contest) và các Bài toán (Algo Challenges).
 * Bạn có thể copy kết quả từ console và paste vào Firestore.
 */

import { Quest } from "@repo/quest-player";

interface TestCase {
	input: string;
	expectedOutput: string;
	label?: string;
	isHidden?: boolean;
}

/**
 * Helper để tạo nhanh một bài toán Algo
 */
function createAlgoChallenge(data: {
	id: string;
	title: string;
	description: string;
	inputFormat?: string;
	outputFormat?: string;
	constraints?: string;
	samples: TestCase[];
	hidden: TestCase[];
}): Quest {
	return {
		id: data.id,
		gameType: "algo",
		level: 1,
		titleKey: data.title,
		questTitleKey: data.title,
		descriptionKey: data.id + "-desc",
		gameConfig: {
			type: "algo",
			description: data.description,
			inputFormat: data.inputFormat,
			outputFormat: data.outputFormat,
			constraints: data.constraints,
			sampleCases: data.samples,
			hiddenCases: data.hidden,
			supportedLanguages: ["blockly", "javascript", "python"],
			pythonRuntime: "skulpt",
		},
		solution: {
			type: "match_output",
		},
	} as Quest;
}

// ─── ĐỊNH NGHĨA CÁC BÀI TOÁN ────────────────────────────────────────

const challenge1 = createAlgoChallenge({
	id: "algo-hello-world",
	title: "Chào mừng bạn đến với Teky",
	description:
		'Viết chương trình in ra dòng chữ "Hello Teky" (không có dấu ngoặc kép).',
	samples: [{ input: "", expectedOutput: "Hello Teky", label: "Ví dụ 1" }],
	hidden: [{ input: "", expectedOutput: "Hello Teky" }],
});

const challenge2 = createAlgoChallenge({
	id: "algo-sum-2",
	title: "Tổng hai số nguyên",
	description: "Nhập vào 2 số nguyên a và b. Tính tổng của chúng.",
	inputFormat: "Hai số nguyên a, b trên 2 dòng.",
	outputFormat: "Một số nguyên duy nhất.",
	samples: [
		{ input: "5\n7", expectedOutput: "12", label: "Ví dụ 1" },
		{ input: "-3\n10", expectedOutput: "7", label: "Ví dụ 2" },
	],
	hidden: [
		{ input: "0\n0", expectedOutput: "0" },
		{ input: "1000\n-1000", expectedOutput: "0" },
		{ input: "99999999\n1", expectedOutput: "100000000" },
	],
});

const challenge3 = createAlgoChallenge({
	id: "algo-even-odd",
	title: "Số chẵn hay lẻ",
	description:
		'Nhập vào một số nguyên n. In ra "EVEN" nếu n là số chẵn, "ODD" nếu n là số lẻ.',
	samples: [
		{ input: "4", expectedOutput: "EVEN", label: "Ví dụ 1" },
		{ input: "7", expectedOutput: "ODD", label: "Ví dụ 2" },
	],
	hidden: [
		{ input: "0", expectedOutput: "EVEN" },
		{ input: "-2", expectedOutput: "EVEN" },
		{ input: "101", expectedOutput: "ODD" },
	],
});

// ─── ĐỊNH NGHĨA CUỘC THI (CONTEST) ──────────────────────────────────

const contestId = "teky-spring-2026";
const startTime = new Date("2026-03-15T09:00:00+07:00");
const endTime = new Date("2026-03-15T11:00:00+07:00");

const contestData = {
	id: contestId,
	title: "Kỳ thi Tin học Trẻ Teky - Spring 2026",
	description: "Thử thách thuật toán dành cho học sinh yêu thích lập trình.",
	startTime: startTime.toISOString(),
	endTime: endTime.toISOString(),
	durationMinutes: 120,
	status: "active",
	questData: [challenge1, challenge2, challenge3],
	settings: {
		allowLanguages: ["blockly", "javascript", "python"],
		showHiddenTestCases: false,
		maxSubmissionsPerChallenge: 0,
		scoringMode: "highest",
	},
};

// ─── XUẤT KẾT QUẢ ──────────────────────────────────────────────────

console.log("=== CONTEST DOCUMENT DATA ===");
console.log(JSON.stringify(contestData, null, 2));

console.log("\n\n=== HDSD ===");
console.log("1. Copy toàn bộ JSON ở trên.");
console.log("2. Mở Firebase Console -> Firestore.");
console.log(
	`3. Tạo document trong collection "contests" với ID là "${contestId}".`,
);
console.log("4. Paste dữ liệu vào document đó.");
