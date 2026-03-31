import * as Blockly from "blockly/core";
import { javascriptGenerator, Order } from "blockly/javascript";
import type { TFunction } from "i18next";

export function init(t: TFunction) {
	// XÓA các định nghĩa cũ trước khi tạo mới
	const blocksToDelete = [
		"algo_input",
		"algo_input_number",
		"algo_to_number",
		"algo_print",
		"algo_start",
	];

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
			message0: t("Blocks.readText", "read text"),
			output: "String",
			style: "text_blocks",
			tooltip: t(
				"Blocks.readTextTooltip",
				"Reads a line from the input as text.",
			),
		},
		{
			type: "algo_input_number",
			message0: t("Blocks.readNumber", "read number"),
			output: "Number",
			style: "math_blocks",
			tooltip: t(
				"Blocks.readNumberTooltip",
				"Reads a line from the input as a number.",
			),
		},
		{
			type: "algo_to_number",
			message0: t("Blocks.toNumber", "to number %1"),
			args0: [{ type: "input_value", name: "VALUE" }],
			output: "Number",
			style: "math_blocks",
			tooltip: t(
				"Blocks.toNumberTooltip",
				"Converts a string of text to a number.",
			),
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

	javascriptGenerator.forBlock["algo_input_number"] = function () {
		return ["Number(prompt())", Order.FUNCTION_CALL];
	};

	javascriptGenerator.forBlock["algo_to_number"] = function (
		block: Blockly.Block,
	) {
		const msg =
			javascriptGenerator.valueToCode(block, "VALUE", Order.NONE) || "''";
		return [`Number(${msg})`, Order.FUNCTION_CALL];
	};

	javascriptGenerator.forBlock["algo_print"] = function (
		block: Blockly.Block,
	) {
		const msg =
			javascriptGenerator.valueToCode(block, "TEXT", Order.NONE) || "''";
		return `console.log(${msg});\n`;
	};
}
