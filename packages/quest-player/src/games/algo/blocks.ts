import * as Blockly from "blockly/core";
import { javascriptGenerator, Order } from "blockly/javascript";
import type { TFunction } from "i18next";

export function init(t: TFunction) {
	// XÓA các định nghĩa cũ trước khi tạo mới
	const blocksToDelete = ["algo_input", "algo_print", "algo_start"];

	blocksToDelete.forEach((blockType) => {
		if (Blockly.Blocks[blockType]) {
			delete Blockly.Blocks[blockType];
		}
	});

	Blockly.defineBlocksWithJsonArray([
		{
			type: "algo_start",
			message0: t("Maze.whenRunClicked") + " %1 %2",
			args0: [
				{ type: "input_dummy" },
				{ type: "input_statement", name: "DO" },
			],
			style: "events_category",
			topRow: true,
			tooltip:
				"This block is the starting point for your coding challenge.",
		},
		{
			type: "algo_input",
			message0: "read input",
			output: "String",
			style: "text_blocks",
			tooltip:
				"Reads a line from the input (equivalent to input() in Python or prompt() in JS).",
		},
		{
			type: "algo_print",
			message0: "print %1",
			args0: [{ type: "input_value", name: "TEXT" }],
			previousStatement: null,
			nextStatement: null,
			style: "text_blocks",
			tooltip: "Prints the specified text or value.",
		},
	]);

	javascriptGenerator.forBlock["algo_start"] = function (
		block: Blockly.Block,
	) {
		const code = javascriptGenerator.statementToCode(block, "DO") || "";
		return code
			.split("\n")
			.map((line) => line.trimStart())
			.join("\n");
	};

	javascriptGenerator.forBlock["algo_input"] = function () {
		return ["prompt()", Order.FUNCTION_CALL];
	};

	javascriptGenerator.forBlock["algo_print"] = function (
		block: Blockly.Block,
	) {
		const msg =
			javascriptGenerator.valueToCode(block, "TEXT", Order.NONE) || "''";
		return `console.log(${msg});\n`;
	};
}
