import {
	AlgoConfig,
	GameState,
	IGameEngine,
	SolutionConfig,
	StepResult,
	TestCase,
	TestCaseResult,
} from "../../types";
import Interpreter from "js-interpreter";

export class AlgoEngine implements IGameEngine {
	public readonly gameType = "algo";
	private config: AlgoConfig;
	private currentState: GameState;
	private userCode: string = "";
	private currentTestCaseIndex: number = -1;
	private allTestCases: TestCase[] = [];

	constructor(gameConfig: AlgoConfig) {
		this.config = gameConfig;
		this.allTestCases = [
			...this.config.sampleCases,
			...(this.config.hiddenCases || []),
		];
		this.currentState = this.getInitialState();
	}

	public getInitialState(): GameState {
		return {
			testResults: this.allTestCases.map((tc) => ({
				input: tc.input,
				expectedOutput: tc.expectedOutput,
				actualOutput: "",
				status: "pending",
				isHidden: tc.isHidden,
			})),
			result: "unset",
		};
	}

	public reset(): void {
		this.currentState = this.getInitialState();
		this.currentTestCaseIndex = -1;
	}

	public execute(userCode: string): void {
		this.userCode = userCode;
		this.currentTestCaseIndex = 0;
		this.currentState.result = "running";
	}

	public async step(): Promise<StepResult> {
		if (
			this.currentTestCaseIndex === -1 ||
			!this.currentState.testResults
		) {
			return null;
		}

		if (this.currentTestCaseIndex >= this.allTestCases.length) {
			this.currentState.result = this.checkAllPassed()
				? "success"
				: "failure";
			return {
				done: true,
				state: JSON.parse(JSON.stringify(this.currentState)),
			};
		}

		const testCase = this.allTestCases[this.currentTestCaseIndex];
		const result = await this.runSingleTestCase(this.userCode, testCase);

		this.currentState.testResults[this.currentTestCaseIndex] = result;
		this.currentTestCaseIndex++;

		const isLast = this.currentTestCaseIndex >= this.allTestCases.length;
		if (isLast) {
			this.currentState.result = this.checkAllPassed()
				? "success"
				: "failure";
		}

		return {
			done: isLast,
			state: JSON.parse(JSON.stringify(this.currentState)),
		};
	}

	private checkAllPassed(): boolean {
		return (
			this.currentState.testResults?.every((r) => r.status === "pass") ??
			false
		);
	}

	private async runSingleTestCase(
		code: string,
		testCase: TestCase,
	): Promise<TestCaseResult> {
		// This is a placeholder for actual multi-language execution.
		// For Phase 1, we implement JS execution using js-interpreter.
		// Python (Skulpt/Pyodide) will be integrated in the next step.

		const result: TestCaseResult = {
			input: testCase.input,
			expectedOutput: testCase.expectedOutput,
			actualOutput: "",
			status: "pending",
			isHidden: testCase.isHidden,
		};

		try {
			if (this.config.pythonRuntime === "pyodide") {
				return await this.runPythonPyodide(code, testCase);
			} else if (this.config.pythonRuntime === "skulpt") {
				return await this.runPythonSkulpt(code, testCase);
			} else {
				return this.runJavaScript(code, testCase);
			}
		} catch (e: any) {
			result.status = "error";
			result.error = e.message || "Unknown error";
			return result;
		}
	}

	private runJavaScript(code: string, testCase: TestCase): TestCaseResult {
		const result: TestCaseResult = {
			input: testCase.input,
			expectedOutput: testCase.expectedOutput,
			actualOutput: "",
			status: "pending",
			isHidden: testCase.isHidden,
		};

		try {
			// Mocking input/output for JS
			const inputLines = testCase.input.split("\n");
			let output = "";

			const initApi = (interpreter: any, globalObject: any) => {
				// Mock prompt() for input
				interpreter.setProperty(
					globalObject,
					"prompt",
					interpreter.createNativeFunction(() => {
						return inputLines.shift() || "";
					}),
				);

				// Replace console.log for output capture
				const consoleObj = interpreter.nativeToPseudo({});
				interpreter.setProperty(globalObject, "console", consoleObj);
				interpreter.setProperty(
					consoleObj,
					"log",
					interpreter.createNativeFunction((...args: any[]) => {
						output += args.map(String).join(" ") + "\n";
					}),
				);

				// Global print helper
				interpreter.setProperty(
					globalObject,
					"print",
					interpreter.createNativeFunction((...args: any[]) => {
						output += args.map(String).join(" ") + "\n";
					}),
				);
			};

			const interpreter = new Interpreter(code, initApi);

			// Simple execution limit to prevent infinite loops (approximate)
			let steps = 0;
			const MAX_STEPS = 100000;
			while (interpreter.step() && steps < MAX_STEPS) {
				steps++;
			}

			if (steps >= MAX_STEPS) {
				result.status = "error";
				result.error = "Time Limit Exceeded (Too many steps)";
			} else {
				result.actualOutput = output.trim();
				const expected = testCase.expectedOutput.trim();
				result.status =
					result.actualOutput === expected ? "pass" : "fail";
			}
		} catch (e: any) {
			result.status = "error";
			result.error = e.message || "Unknown error";
		}

		return result;
	}

	private async runPythonSkulpt(
		code: string,
		testCase: TestCase,
	): Promise<TestCaseResult> {
		const result: TestCaseResult = {
			input: testCase.input,
			expectedOutput: testCase.expectedOutput,
			actualOutput: "",
			status: "pending",
			isHidden: testCase.isHidden,
		};

		// @ts-ignore
		const Sk = (window as any).Sk;
		if (!Sk) {
			result.status = "error";
			result.error = "Skulpt runtime not loaded";
			return result;
		}

		try {
			let output = "";
			const inputLines = testCase.input.split("\n");

			Sk.configure({
				output: (text: string) => {
					output += text;
				},
				read: (filename: string) => {
					if (
						Sk.builtinFiles === undefined ||
						Sk.builtinFiles["files"][filename] === undefined
					) {
						throw new Error(`File not found: '${filename}'`);
					}
					return Sk.builtinFiles["files"][filename];
				},
				// Custom input handler for Skulpt
				inputfun: () => {
					return new Promise((resolve) => {
						resolve(inputLines.shift() || "");
					});
				},
			});

			await Sk.misceval.asyncToPromise(() => {
				return Sk.importMainWithBody("<stdin>", false, code, true);
			});

			result.actualOutput = output.trim();
			const expected = testCase.expectedOutput.trim();
			result.status = result.actualOutput === expected ? "pass" : "fail";
		} catch (e: any) {
			result.status = "error";
			result.error = e.toString() || "Python execution error";
		}

		return result;
	}

	private async runPythonPyodide(
		code: string,
		testCase: TestCase,
	): Promise<TestCaseResult> {
		const result: TestCaseResult = {
			input: testCase.input,
			expectedOutput: testCase.expectedOutput,
			actualOutput: "",
			status: "pending",
			isHidden: testCase.isHidden,
		};

		// @ts-ignore
		let pyodide = (window as any).pyodide;

		if (!pyodide) {
			// Lazy load Pyodide if not present
			// Note: This requires loadPyodide to be available globally (e.g. from script tag)
			try {
				// @ts-ignore
				if (typeof (window as any).loadPyodide === "function") {
					// @ts-ignore
					pyodide = await (window as any).loadPyodide();
					(window as any).pyodide = pyodide;
				} else {
					throw new Error("Pyodide loader not found");
				}
			} catch (err) {
				result.status = "error";
				result.error = "Failed to load Pyodide: " + err;
				return result;
			}
		}

		try {
			// Redirect stdout/stderr and mock input
			const inputLines = testCase.input.split("\n");
			let output = "";

			// Pyodide input mock is tricky because it's usually blocking.
			// One way is to override builtins.input.
			pyodide.runPython(`
import sys
import io

class MockInput:
    def __init__(self, lines):
        self.lines = lines
    def readline(self):
        if not self.lines: return ""
        return self.lines.pop(0)

class MockOutput:
    def __init__(self):
        self.content = ""
    def write(self, text):
        self.content += text
    def flush(self):
        pass

sys.stdin = MockInput(${JSON.stringify(inputLines)})
sys.stdout = MockOutput()
sys.stderr = sys.stdout

def input(prompt=""):
    return sys.stdin.readline().strip()
			`);

			await pyodide.runPythonAsync(code);

			output = pyodide.runPython("sys.stdout.content");

			result.actualOutput = output.trim();
			const expected = testCase.expectedOutput.trim();
			result.status = result.actualOutput === expected ? "pass" : "fail";
		} catch (e: any) {
			result.status = "error";
			result.error = e.toString() || "Pyodide execution error";
		}

		return result;
	}

	public checkWinCondition(
		finalState: GameState,
		_solutionConfig: SolutionConfig,
	): boolean {
		return finalState.result === "success";
	}
}
