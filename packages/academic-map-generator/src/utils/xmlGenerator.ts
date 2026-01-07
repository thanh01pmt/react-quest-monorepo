/**
 * XML Generator
 * 
 * Converts structured solution (JSON) into Blockly XML format.
 * Essential for generating startBlocks that include:
 * 1. Main execution stack (inside maze_start)
 * 2. Procedure definitions (procedures_defnoreturn)
 */

interface BlockAction {
    type: string;
    // Repeat
    times?: number;
    do?: BlockAction[];
    // If/Else
    condition?: string; // Field value for simple ifs
    // Procedure
    name?: string; // Function name
    // Generic substacks
    else?: BlockAction[];
}

interface StructuredSolution {
    main: BlockAction[];
    procedures: Record<string, BlockAction[]>;
}

/**
 * Convert a list of blocks to XML string recursively
 */
function convertBlocksToXml(blocks: BlockAction[]): string {
    if (!blocks || blocks.length === 0) return '';

    let xml = '';
    const block = blocks[0];
    const nextBlocks = blocks.slice(1);

    xml += `<block type="${block.type}">`;

    // --- HANDLE MUTATIONS ---
    if (block.type === 'procedures_callnoreturn' && block.name) {
        xml += `<mutation name="${block.name}"></mutation>`;
    }

    // --- HANDLE FIELDS ---
    // If simple (maze_if), condition is usually a field named 'DIR'
    if (block.condition) {
        // Warning: Field name depends on block type.
        // maze_if, maze_ifElse -> DIR
        // maze_while, maze_until -> ? (usually inputs, but let's assume field for simple ones)
        if (block.type.startsWith('maze_if') || block.type === 'maze_peek') {
            xml += `<field name="DIR">${block.condition}</field>`;
        }
    }

    // --- HANDLE VALUES ---
    if (block.times !== undefined) {
        xml += `<value name="TIMES"><shadow type="math_number"><field name="NUM">${block.times}</field></shadow></value>`;
    }

    // --- HANDLE STATEMENTS (Substacks) ---
    if (block.do && block.do.length > 0) {
        xml += `<statement name="DO">${convertBlocksToXml(block.do)}</statement>`;
    }

    if (block.else && block.else.length > 0) {
        xml += `<statement name="ELSE">${convertBlocksToXml(block.else)}</statement>`;
    }

    // --- HANDLE NEXT CONNECTION ---
    if (nextBlocks.length > 0) {
        xml += `<next>${convertBlocksToXml(nextBlocks)}</next>`;
    }

    xml += `</block>`;
    return xml;
}

/**
 * Main conversion function
 */
export function convertSolutionToXml(solution: StructuredSolution): string {
    let xml = '<xml xmlns="https://developers.google.com/blockly/xml">';

    // 1. Create maze_start with main stack
    // Fixed position (20, 20)
    xml += '<block type="maze_start" deletable="false" movable="false" x="20" y="20">';
    if (solution.main && solution.main.length > 0) {
        xml += '<statement name="DO">';
        xml += convertBlocksToXml(solution.main);
        xml += '</statement>';
    }
    xml += '</block>';

    // 2. Create procedure definitions
    if (solution.procedures) {
        let y = 200; // Start below main stack
        const x = 20;

        for (const [name, blocks] of Object.entries(solution.procedures)) {
            // Procedure Definition Block
            xml += `<block type="procedures_defnoreturn" x="${x}" y="${y}">`;
            xml += `<field name="NAME">${name}</field>`;
            xml += `<comment pinned="false" h="80" w="160">Describe this function...</comment>`;
            
            if (blocks && blocks.length > 0) {
                xml += '<statement name="STACK">';
                xml += convertBlocksToXml(blocks);
                xml += '</statement>';
            }
            
            xml += '</block>';
            
            // Increment Y position for next procedure (estimate height)
            // A simple block is ~30px. Assume reasonable gap.
            const estimatedHeight = (blocks.length * 30) + 50; 
            y += Math.max(150, estimatedHeight); 
        }
    }

    xml += '</xml>';
    return xml;
}
