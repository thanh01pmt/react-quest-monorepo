// packages/quest-player/src/types/index.ts

// =================================================================
// ==                      QUEST DEFINITIONS                      ==
// =================================================================

export type EditorType =
	| "blockly"
	| "monaco"
	| "javascript"
	| "python"
	| "lua"
	| "cpp"
	| "swift";

// --- Toolbox Definition Types ---

interface ToolboxBlock {
	kind: "block";
	type: string;
	inputs?: Record<string, any>;
	fields?: Record<string, any>;
}

interface ToolboxCategory {
	kind: "category";
	name: string;
	colour?: string;
	contents?: ToolboxItem[]; // Optional for custom categories
	categorystyle?: string;
	expanded?: boolean; // For auto-expanding search results
	custom?: "PROCEDURE" | "VARIABLE"; // For dynamic flyout categories
}

interface ToolboxSeparator {
	kind: "sep";
}

export type ToolboxItem = ToolboxBlock | ToolboxCategory | ToolboxSeparator;

export interface ToolboxJSON {
	kind: "flyoutToolbox" | "categoryToolbox";
	contents: ToolboxItem[];
}

// --- Main Config Interfaces ---

export interface BlocklyConfig {
	toolbox: ToolboxJSON;
	maxBlocks?: number;
	startBlocks?: string;
	readOnly?: boolean;
}

export type GameConfig =
	| MazeConfig
	| TurtleConfig
	| PondConfig
	| BirdConfig
	| AlgoConfig;

export interface MonacoConfig {
	initialCode: string;
}

// =================================================================
// ==                 GAME-SPECIFIC CONFIGURATIONS                ==
// =================================================================

export type Direction = 0 | 1 | 2 | 3;

export interface Position3D {
	x: number;
	y: number;
	z: number;
}

export interface Block {
	modelKey: string;
	position: Position3D;
}

export interface Collectible {
	id: string;
	type: "crystal" | "key";
	position: Position3D;
}

export interface Switch {
	type: "switch";
	id: string;
	position: Position3D;
	toggles?: string[];
	initialState: "on" | "off";
}

export interface Portal {
	type: "portal";
	id: string;
	position: Position3D;
	color: "blue" | "green" | "orange" | "pink";
	targetId: string;
	exitDirection?: Direction;
	controlSwitchId?: string; // ID of switch that enables this portal
}

export type Interactive = Switch | Portal;

export interface PlayerConfig {
	id: string;
	start: {
		x: number;
		y: number;
		z?: number;
		direction: Direction;
	};
}

// --- Intro Scene Configuration ---

export type IntroSceneType =
	| "dronie"
	| "rocket"
	| "circle"
	| "helix"
	| "boomerang";

export interface IntroSceneConfig {
	/** Bật/tắt intro scene. Nếu false hoặc không có, màn chơi bắt đầu ngay */
	enabled: boolean;
	/** Loại animation camera */
	type: IntroSceneType;
	/** Thời lượng animation (ms). Mặc định: 4000 */
	duration?: number;

	// Type-specific parameters
	/** Khoảng cách bay lùi (dronie). Mặc định: 20 */
	distance?: number;
	/** Độ cao (rocket, helix, boomerang). Mặc định: 15 */
	height?: number;
	/** Bán kính (circle, helix). Mặc định: 25 */
	radius?: number;
	/** Bán kính trục X (boomerang). Mặc định: 30 */
	radiusX?: number;
	/** Bán kính trục Z (boomerang). Mặc định: 20 */
	radiusZ?: number;
	/** Số vòng quay (circle, helix). Mặc định: 1 */
	loops?: number;
}

export interface FogZone {
	id: string;
	// Position is center of the fog zone box
	position: { x: number; y: number; z: number };
	// Size of the fog zone box
	scale: { x: number; y: number; z: number };
	color: string;
	density: number;
	noiseSpeed?: number;
	opacity?: number;
}

export interface MazeConfig {
	type: "maze";
	renderer?: "2d" | "3d";
	map?: number[][];
	blocks?: Block[];
	player?: PlayerConfig;
	players?: PlayerConfig[];
	collectibles?: Collectible[];
	interactibles?: Interactive[];
	fogZones?: FogZone[];
	finish: { x: number; y: number; z?: number };
	/** Cấu hình intro scene camera animation (chỉ áp dụng cho 3D renderer) */
	introScene?: IntroSceneConfig;

	// Random Item Mode configuration
	/** Mode xác định cách hiển thị items: fixed (mặc định) hoặc random (ẩn ngẫu nhiên mỗi Run) */
	mode?: "fixed" | "random";
	/** Pool các items có sẵn - dùng khi mode='random' để xác định max items */
	itemPool?: {
		crystal?: number; // Max crystals trong pool
		key?: number; // Max keys trong pool
	};

	/** Movement sequence for path visualization (from SolutionDrivenGenerator) */
	movementSequence?: Array<[number, number, number]>;
}

export interface TurtleConfig {
	type: "turtle";
	player: {
		start: { x: number; y: number } & {
			direction: number;
			penDown: boolean;
		};
	};
}

export interface PondAvatarConfig {
	name: string;
	isPlayer: boolean;
	start: { x: number; y: number };
	damage: number;
	code?: string;
}

export interface PondConfig {
	type: "pond";
	avatars: PondAvatarConfig[];
}

interface Coordinate {
	x: number;
	y: number;
}
interface Line {
	x0: number;
	y0: number;
	x1: number;
	y1: number;
}
export interface BirdConfig {
	type: "bird";
	start: Coordinate;
	startAngle: number;
	worm: Coordinate | null;
	nest: Coordinate;
	walls: Line[];
}

export interface TestCase {
	input: string; // Stdin / prompt() input (mỗi dòng một giá trị)
	expectedOutput: string; // Expected stdout output (trim + compare)
	isHidden?: boolean; // Ẩn input/expected từ user, chỉ hiện kết quả
	label?: string; // Optional display label, ví dụ "Ví dụ 1"
}

export interface AlgoConfig {
	type: "algo";
	description: string; // Markdown description của bài toán (full)
	inputFormat?: string; // Mô tả format input
	outputFormat?: string; // Mô tả format output
	constraints?: string; // Ràng buộc (ví dụ "1 <= a, b, c <= 100.000.000.000")
	sampleCases: TestCase[]; // Visible test cases (hiện input+output)
	hiddenCases?: TestCase[]; // Hidden test cases (chỉ hiện pass/fail)
	timeLimit?: number; // Time limit per test case (ms), default 5000
	supportedLanguages?: ("blockly" | "javascript" | "python")[]; // Ngôn ngữ hỗ trợ
	pythonRuntime?: "skulpt" | "pyodide"; // Mặc định là skulpt để load nhanh
	initialCode?: Record<string, string>; // Template code per language
}

// Placeholders for other game configs
// export interface MusicConfig { /* To be defined */ }

// =================================================================
// ==                   SOLUTION & CORE TYPES                     ==
// =================================================================

export interface SolutionConfig {
	type:
		| "reach_target"
		| "match_drawing"
		| "match_music"
		| "survive_battle"
		| "destroy_target"
		| "match_output";
	itemGoals?: Record<string, number>;
	pixelTolerance?: number;
	solutionBlocks?: string;
	solutionScript?: string;
	optimalBlocks?: number;
	optimalLines?: number;
	solutionMaxBlocks?: number;
	rawActions?: string[];
	structuredSolution?: { main: any[]; procedures?: Record<string, any[]> };
	basicSolution?: { main: any[]; procedures?: Record<string, any[]> };
}

// =================================================================
// ==                  ENGINE & RENDERER INTERFACES               ==
// =================================================================

export interface TestCaseResult {
	input: string;
	expectedOutput: string;
	actualOutput: string;
	status: "pass" | "fail" | "error" | "pending";
	error?: string;
	isHidden?: boolean;
}

export interface GameState {
	solution?: SolutionConfig;
	result?: string;
	testResults?: TestCaseResult[];
}

export type ExecutionMode = "run" | "debug";
export type CameraMode = "Follow" | "TopDown" | "Free";

// The Main Quest Interface
export interface Quest {
	id: string;
	gameType:
		| "maze"
		| "bird"
		| "turtle"
		| "movie"
		| "music"
		| "pond"
		| "puzzle"
		| "algo"
		| "scratch";
	level: number;
	titleKey: string;
	questTitleKey?: string;
	title?: string; // Trường title mới
	descriptionKey: string;
	supportedEditors?: ("blockly" | "monaco")[];
	translations?: Record<string, Record<string, string>>;
	blocklyConfig?: BlocklyConfig;
	monacoConfig?: MonacoConfig;
	gameConfig: GameConfig;
	solution: SolutionConfig;
	hints?: {
		title?: string;
		description?: string;
		learningGoals?: string;
		goalDetails?: string[];
	};
	sounds?: Record<string, string>;
	backgroundMusic?: string;

	// Template metadata for dynamic toolbox selection (synced from Builder)
	templateMeta?: {
		tags?: string[];
		concepts?: string[];
		category?: string;
	};

	/** Source code of the solution for reference */
	referenceCode?: string;
}

// =================================================================
// ==                  ENGINE & RENDERER INTERFACES               ==
// =================================================================

export type StepResult = {
	done: boolean;
	state: GameState;
	highlightedBlockId?: string | null;
} | null;

export interface IGameEngine {
	readonly gameType: string;
	reset?(): void;
	getInitialState(): GameState;
	execute(userCode: string): void;
	step?(): StepResult | Promise<StepResult>;
	checkWinCondition(
		finalState: GameState,
		solutionConfig: SolutionConfig,
	): boolean;
}

export type GameEngineConstructor = new (gameConfig: GameConfig) => IGameEngine;

export type IGameRenderer = React.FC<{
	gameState: GameState;
	gameConfig: GameConfig;
	[key: string]: any;
}>;

// =================================================================
// ==                  LIBRARY-SPECIFIC INTERFACES                ==
// =================================================================

export interface QuestPlayerSettings {
	renderer?: "geras" | "zelos";
	blocklyThemeName?: "zelos" | "classic";
	gridEnabled?: boolean;
	soundsEnabled?: boolean;
	colorSchemeMode?: "auto" | "light" | "dark";
	cameraMode?: CameraMode;
	/** @deprecated Use toolboxPresetKey instead */
	toolboxMode?: "default" | "simple" | "test";
	/**
	 * Selected toolbox preset key. When set, overrides the quest's toolbox configuration.
	 * Set to 'default' to use the quest's original toolbox.
	 */
	toolboxPresetKey?:
		| "default"
		| "basic_movement"
		| "with_actions"
		| "with_loops"
		| "with_functions"
		| "with_conditionals"
		| "full_toolbox"
		| (string & {});
	environment?: "day" | "night";
	displayLanguage?: CodeLanguage;
	/**
	 * Block layout mode: 'vertical' for standard Scratch-style blocks,
	 * 'horizontal' for Junior Mode (Google Doodle / ScratchJr style)
	 */
	blockMode?: "vertical" | "horizontal";
}

export type CodeLanguage = "javascript" | "python" | "lua" | "cpp" | "swift";

export interface QuestMetrics {
	/** Timestamp when the quest started (ms) */
	startTime: number;
	/** Number of times 'Run' was clicked */
	runCount: number;
	/** Number of times 'Debug' was clicked */
	debugCount: number;
	/**
	 * Time intervals (in ms) between consecutive Run/Debug actions.
	 * First element is time from start to first action.
	 */
	actionIntervals: number[];
	/**
	 * Timestamps (in ms relative to startTime) when specific star ratings were first achieved.
	 * e.g. { 1: 12000, 3: 45000 }
	 */
	timeToStars: Record<number, number>;
	/** Total time spent in the quest (ms) until completion */
	totalTime: number;
}

export interface QuestCompletionResult {
	isSuccess: boolean;
	finalState: GameState;
	userCode?: string;
	unitCount?: number;
	unitLabel: "block" | "line";
	stars?: number;
	/** Metrics collected during the session */
	metrics?: QuestMetrics;
}
