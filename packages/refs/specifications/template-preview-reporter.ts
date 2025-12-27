/**
 * Template Preview Reporter
 * 
 * Generates ASCII map visualization and analysis report from a code template input.
 * This allows previewing what a map would look like BEFORE actually generating it.
 */

// ============================================================================
// TYPES
// ============================================================================

interface Vector3 {
  x: number;
  y: number;
  z: number;
}

interface TemplateInput {
  id?: string;
  concept: string;
  gradeLevel: string;
  code: string;
  parameters: Record<string, { min: number; max: number; default?: number }>;
  meta?: {
    topic?: string;
    titleVi?: string;
    titleEn?: string;
    descVi?: string;
    descEn?: string;
  };
}

interface SimulatedAction {
  type: 'move' | 'turn' | 'collect' | 'interact';
  position: Vector3;
  direction: number;
  item?: string;
}

interface SimulationResult {
  pathCoords: Vector3[];
  items: Array<{ type: string; position: Vector3 }>;
  startPosition: Vector3;
  startDirection: number;
  endPosition: Vector3;
  actions: SimulatedAction[];
  loopIterations: number;
  totalMoves: number;
  totalCollects: number;
}

// ============================================================================
// DIRECTION HELPERS
// ============================================================================

const DIRECTION_NAMES = ['North (+Z)', 'East (+X)', 'South (-Z)', 'West (-X)'];
const DIRECTION_ARROWS = ['↑', '→', '↓', '←'];

const DIRECTION_DELTAS: Record<number, { x: number; z: number }> = {
  0: { x: 0, z: 1 },   // North: +Z
  1: { x: 1, z: 0 },   // East: +X
  2: { x: 0, z: -1 },  // South: -Z
  3: { x: -1, z: 0 }   // West: -X
};

function turnRight(dir: number): number {
  return (dir + 1) % 4;
}

function turnLeft(dir: number): number {
  return (dir + 3) % 4;
}

function moveForward(pos: Vector3, dir: number): Vector3 {
  const delta = DIRECTION_DELTAS[dir];
  return {
    x: pos.x + delta.x,
    y: pos.y,
    z: pos.z + delta.z
  };
}

// ============================================================================
// TEMPLATE SIMULATOR
// ============================================================================

/**
 * Simulates code execution to generate path and item positions
 */
class TemplateSimulator {
  private position: Vector3 = { x: 0, y: 1, z: 0 };
  private direction: number = 1; // East by default
  private pathCoords: Vector3[] = [];
  private items: Array<{ type: string; position: Vector3 }> = [];
  private actions: SimulatedAction[] = [];
  private loopIterations = 0;
  private totalMoves = 0;
  private totalCollects = 0;

  /**
   * Simulate a template with resolved parameters
   */
  simulate(input: TemplateInput, paramValues: Record<string, number>): SimulationResult {
    // Reset state
    this.position = { x: 0, y: 1, z: 0 };
    this.direction = 1;
    this.pathCoords = [{ ...this.position }];
    this.items = [];
    this.actions = [];
    this.loopIterations = 0;
    this.totalMoves = 0;
    this.totalCollects = 0;

    // Parse and execute code
    this.executeCode(input.code, paramValues);

    return {
      pathCoords: this.pathCoords,
      items: this.items,
      startPosition: { x: 0, y: 1, z: 0 },
      startDirection: 1,
      endPosition: { ...this.position },
      actions: this.actions,
      loopIterations: this.loopIterations,
      totalMoves: this.totalMoves,
      totalCollects: this.totalCollects
    };
  }

  private executeCode(code: string, params: Record<string, number>): void {
    // Replace parameters
    let resolvedCode = code;
    for (const [name, value] of Object.entries(params)) {
      resolvedCode = resolvedCode.replace(new RegExp(`\\$${name}`, 'g'), String(value));
    }

    // Simple parser for common patterns
    this.parseAndExecute(resolvedCode);
  }

  private parseAndExecute(code: string): void {
    // Handle FOR loops
    const forMatch = code.match(/for\s+\w+\s+in\s+(\d+)\s+to\s+(\d+)\s*\{([^}]+)\}/);
    if (forMatch) {
      const start = parseInt(forMatch[1]);
      const end = parseInt(forMatch[2]);
      const body = forMatch[3];

      for (let i = start; i <= end; i++) {
        this.loopIterations++;
        this.executeStatements(body);
      }
      
      // Execute any code after the loop
      const afterLoop = code.substring(code.indexOf('}') + 1).trim();
      if (afterLoop) {
        this.parseAndExecute(afterLoop);
      }
      return;
    }

    // Handle WHILE loops (simplified - execute fixed iterations based on context)
    const whileMatch = code.match(/while\s+[^{]+\s*\{([^}]+)\}/);
    if (whileMatch) {
      const body = whileMatch[1];
      // For preview, simulate 5 iterations
      for (let i = 0; i < 5; i++) {
        this.loopIterations++;
        this.executeStatements(body);
      }
      return;
    }

    // Handle nested FOR loops
    const nestedForMatch = code.match(/for\s+\w+\s+in\s+(\d+)\s+to\s+(\d+)\s*\{\s*for\s+\w+\s+in\s+(\d+)\s+to\s+(\d+)\s*\{([^}]+)\}\s*([^}]*)\}/);
    if (nestedForMatch) {
      const outerStart = parseInt(nestedForMatch[1]);
      const outerEnd = parseInt(nestedForMatch[2]);
      const innerStart = parseInt(nestedForMatch[3]);
      const innerEnd = parseInt(nestedForMatch[4]);
      const innerBody = nestedForMatch[5];
      const afterInner = nestedForMatch[6];

      for (let i = outerStart; i <= outerEnd; i++) {
        for (let j = innerStart; j <= innerEnd; j++) {
          this.loopIterations++;
          this.executeStatements(innerBody);
        }
        if (afterInner.trim()) {
          this.executeStatements(afterInner);
        }
      }
      return;
    }

    // Just statements
    this.executeStatements(code);
  }

  private executeStatements(code: string): void {
    // Split by semicolons or newlines
    const statements = code.split(/[;\n]/).map(s => s.trim()).filter(Boolean);

    for (const stmt of statements) {
      this.executeStatement(stmt);
    }
  }

  private executeStatement(stmt: string): void {
    const lowerStmt = stmt.toLowerCase();

    if (lowerStmt.includes('moveforward') || lowerStmt.includes('move_forward')) {
      this.position = moveForward(this.position, this.direction);
      this.pathCoords.push({ ...this.position });
      this.actions.push({ type: 'move', position: { ...this.position }, direction: this.direction });
      this.totalMoves++;
    } 
    else if (lowerStmt.includes('turnright') || lowerStmt.includes('turn_right') || lowerStmt.includes('turnright')) {
      this.direction = turnRight(this.direction);
      this.actions.push({ type: 'turn', position: { ...this.position }, direction: this.direction });
    } 
    else if (lowerStmt.includes('turnleft') || lowerStmt.includes('turn_left')) {
      this.direction = turnLeft(this.direction);
      this.actions.push({ type: 'turn', position: { ...this.position }, direction: this.direction });
    } 
    else if (lowerStmt.includes('pickcrystal') || lowerStmt.includes('pick_crystal') || lowerStmt.includes('collect')) {
      this.items.push({ type: 'crystal', position: { ...this.position } });
      this.actions.push({ type: 'collect', position: { ...this.position }, direction: this.direction, item: 'crystal' });
      this.totalCollects++;
    } 
    else if (lowerStmt.includes('pickkey') || lowerStmt.includes('pick_key')) {
      this.items.push({ type: 'key', position: { ...this.position } });
      this.actions.push({ type: 'collect', position: { ...this.position }, direction: this.direction, item: 'key' });
      this.totalCollects++;
    }
    else if (lowerStmt.includes('toggleswitch') || lowerStmt.includes('toggle_switch')) {
      this.items.push({ type: 'switch', position: { ...this.position } });
      this.actions.push({ type: 'interact', position: { ...this.position }, direction: this.direction, item: 'switch' });
    }
    else if (lowerStmt.includes('opengate') || lowerStmt.includes('open_gate')) {
      this.items.push({ type: 'gate', position: { ...this.position } });
      this.actions.push({ type: 'interact', position: { ...this.position }, direction: this.direction, item: 'gate' });
    }
  }
}

// ============================================================================
// TEMPLATE PREVIEW REPORTER
// ============================================================================

export class TemplatePreviewReporter {
  private buffer: string[] = [];
  private simulator = new TemplateSimulator();

  // --- Formatting Helpers ---
  private h1(text: string) { this.buffer.push(`\n# ${text}\n`); }
  private h2(text: string) { this.buffer.push(`\n## ${text}\n`); }
  private h3(text: string) { this.buffer.push(`\n### ${text}\n`); }
  private line(text: string) { this.buffer.push(text); }
  private list(items: string[]) { items.forEach(i => this.buffer.push(`- ${i}`)); }

  /**
   * Draw ASCII map visualization
   */
  private drawMap(
    pathCoords: Vector3[],
    items: Array<{ type: string; position: Vector3 }>,
    startPos: Vector3,
    startDir: number,
    endPos: Vector3,
    label: string = ""
  ): void {
    if (pathCoords.length === 0) return;

    // Calculate bounds
    const xs = pathCoords.map(c => c.x);
    const zs = pathCoords.map(c => c.z);
    const minX = Math.min(...xs) - 1;
    const maxX = Math.max(...xs) + 1;
    const minZ = Math.min(...zs) - 1;
    const maxZ = Math.max(...zs) + 1;

    // Create lookup sets
    const pathSet = new Set(pathCoords.map(c => `${c.x},${c.z}`));
    const itemMap = new Map<string, string>();
    items.forEach(item => {
      const key = `${item.position.x},${item.position.z}`;
      itemMap.set(key, item.type);
    });
    const startKey = `${startPos.x},${startPos.z}`;
    const endKey = `${endPos.x},${endPos.z}`;

    this.buffer.push(`\n**${label}**`);
    this.buffer.push("```text");

    // X-axis header
    let axis = "    ";
    for (let x = minX; x <= maxX; x++) axis += `${x.toString().padStart(2)} `;
    this.buffer.push(axis);
    this.buffer.push("    " + "─".repeat((maxX - minX + 1) * 3));

    // Draw each row (Z from high to low)
    for (let z = maxZ; z >= minZ; z--) {
      let row = `${z.toString().padStart(2)} │`;
      for (let x = minX; x <= maxX; x++) {
        const key = `${x},${z}`;
        const isPath = pathSet.has(key);
        const isStart = key === startKey;
        const isEnd = key === endKey;
        const item = itemMap.get(key);

        if (isStart) {
          row += ` ${DIRECTION_ARROWS[startDir]} `;  // Start with direction arrow
        } else if (isEnd && !item) {
          row += " ⬛";                               // End/Goal
        } else if (item) {
          // Item symbols
          const symbols: Record<string, string> = {
            'crystal': '💎',
            'key': '🔑',
            'switch': '🔘',
            'gate': '🚪',
            'portal': '🌀'
          };
          row += ` ${symbols[item] || '?'} `;
        } else if (isPath) {
          row += " ░░";                               // Path
        } else {
          row += " · ";                               // Empty
        }
      }
      this.buffer.push(row);
    }

    this.buffer.push("```");

    // Legend
    this.buffer.push("\n**Legend:** " + 
      `${DIRECTION_ARROWS[startDir]}=Start ` +
      `░░=Path ` +
      `💎=Crystal ` +
      `🔑=Key ` +
      `🔘=Switch ` +
      `🚪=Gate ` +
      `⬛=Goal`
    );
  }

  /**
   * Draw simplified ASCII (no emoji, more compatible)
   */
  private drawSimpleMap(
    pathCoords: Vector3[],
    items: Array<{ type: string; position: Vector3 }>,
    startPos: Vector3,
    startDir: number,
    endPos: Vector3,
    label: string = ""
  ): void {
    if (pathCoords.length === 0) return;

    const xs = pathCoords.map(c => c.x);
    const zs = pathCoords.map(c => c.z);
    const minX = Math.min(...xs) - 1;
    const maxX = Math.max(...xs) + 1;
    const minZ = Math.min(...zs) - 1;
    const maxZ = Math.max(...zs) + 1;

    const pathSet = new Set(pathCoords.map(c => `${c.x},${c.z}`));
    const itemMap = new Map<string, string>();
    items.forEach(item => {
      const key = `${item.position.x},${item.position.z}`;
      itemMap.set(key, item.type);
    });
    const startKey = `${startPos.x},${startPos.z}`;
    const endKey = `${endPos.x},${endPos.z}`;

    this.buffer.push(`\n**${label}**`);
    this.buffer.push("```text");

    let axis = "    ";
    for (let x = minX; x <= maxX; x++) axis += `${x.toString().padStart(2)} `;
    this.buffer.push(axis);
    this.buffer.push("    " + "-".repeat((maxX - minX + 1) * 3));

    for (let z = maxZ; z >= minZ; z--) {
      let row = `${z.toString().padStart(2)} |`;
      for (let x = minX; x <= maxX; x++) {
        const key = `${x},${z}`;
        const isPath = pathSet.has(key);
        const isStart = key === startKey;
        const isEnd = key === endKey;
        const item = itemMap.get(key);

        if (isStart) {
          row += ` S `;              // Start
        } else if (isEnd && !item) {
          row += " E ";              // End
        } else if (item) {
          const symbols: Record<string, string> = {
            'crystal': 'C',
            'key': 'K',
            'switch': 'W',
            'gate': 'G',
            'portal': 'P'
          };
          row += ` ${symbols[item] || '?'} `;
        } else if (isPath) {
          row += "██ ";              // Path block
        } else {
          row += " . ";              // Empty
        }
      }
      this.buffer.push(row);
    }

    this.buffer.push("```");
    this.buffer.push("\n**Legend:** S=Start, E=End, ██=Path, C=Crystal, K=Key, W=Switch, G=Gate");
  }

  /**
   * Generate preview report from template input
   */
  public generate(input: TemplateInput, paramValues?: Record<string, number>): string {
    this.buffer = [];

    // Resolve parameter values
    const resolvedParams: Record<string, number> = {};
    for (const [name, config] of Object.entries(input.parameters)) {
      resolvedParams[name] = paramValues?.[name] ?? config.default ?? config.min;
    }

    // Simulate
    const result = this.simulator.simulate(input, resolvedParams);

    // === HEADER ===
    this.h1(`📋 TEMPLATE PREVIEW REPORT`);
    this.line(`**Template ID:** \`${input.id || 'unnamed'}\``);
    this.line(`**Concept:** \`${input.concept}\``);
    this.line(`**Grade Level:** ${input.gradeLevel}`);
    this.line(`**Generated:** ${new Date().toISOString()}`);

    // === INPUT SECTION ===
    this.h2("1. 📥 Input Template");
    
    this.h3("Code Template");
    this.buffer.push("```");
    this.buffer.push(input.code);
    this.buffer.push("```");

    this.h3("Parameters");
    this.line("| Parameter | Range | Resolved Value |");
    this.line("|-----------|-------|----------------|");
    for (const [name, config] of Object.entries(input.parameters)) {
      this.line(`| \`$${name}\` | ${config.min} - ${config.max} | **${resolvedParams[name]}** |`);
    }

    this.h3("Resolved Code");
    let resolvedCode = input.code;
    for (const [name, value] of Object.entries(resolvedParams)) {
      resolvedCode = resolvedCode.replace(new RegExp(`\\$${name}`, 'g'), String(value));
    }
    this.buffer.push("```");
    this.buffer.push(resolvedCode);
    this.buffer.push("```");

    // === MAP VISUALIZATION ===
    this.h2("2. 🗺️ Generated Map Preview");

    this.drawSimpleMap(
      result.pathCoords,
      result.items,
      result.startPosition,
      result.startDirection,
      result.endPosition,
      "Map Layout (ASCII)"
    );

    // === EXECUTION TRACE ===
    this.h2("3. 🔄 Execution Trace");

    this.h3("Statistics");
    this.list([
      `Total Path Length: ${result.pathCoords.length} blocks`,
      `Total Moves: ${result.totalMoves}`,
      `Total Collects: ${result.totalCollects}`,
      `Loop Iterations: ${result.loopIterations}`,
      `Start Position: [${result.startPosition.x}, ${result.startPosition.y}, ${result.startPosition.z}]`,
      `Start Direction: ${DIRECTION_NAMES[result.startDirection]} (${result.startDirection})`,
      `End Position: [${result.endPosition.x}, ${result.endPosition.y}, ${result.endPosition.z}]`
    ]);

    this.h3("Action Sequence (rawActions)");
    const rawActions = result.actions.map(a => {
      if (a.type === 'move') return 'moveForward';
      if (a.type === 'turn') return a.direction === turnRight(result.startDirection) ? 'turnRight' : 'turnLeft'; 
      if (a.type === 'collect') return 'collect';
      if (a.type === 'interact') return `toggle_${a.item}`;
      return a.type;
    });
    this.buffer.push("```json");
    this.buffer.push(JSON.stringify(rawActions.slice(0, 20), null, 2));
    if (rawActions.length > 20) {
      this.buffer.push(`// ... and ${rawActions.length - 20} more actions`);
    }
    this.buffer.push("```");

    // === ITEMS ===
    this.h2("4. 📦 Items Placed");

    if (result.items.length > 0) {
      this.line("| Type | Position (x, y, z) |");
      this.line("|------|-------------------|");
      result.items.forEach((item, i) => {
        this.line(`| ${item.type} | [${item.position.x}, ${item.position.y}, ${item.position.z}] |`);
      });

      // Item summary
      const itemCounts = new Map<string, number>();
      result.items.forEach(item => {
        itemCounts.set(item.type, (itemCounts.get(item.type) || 0) + 1);
      });
      
      this.h3("Item Goals");
      this.buffer.push("```json");
      this.buffer.push(JSON.stringify(Object.fromEntries(itemCounts), null, 2));
      this.buffer.push("```");
    } else {
      this.line("_No items placed in this template._");
    }

    // === GROUND BLOCKS ===
    this.h2("5. 🧱 Ground Blocks");

    this.line(`Total ground blocks needed: **${result.pathCoords.length}**`);
    this.buffer.push("\n```json");
    const groundBlocks = result.pathCoords.map(p => ({
      modelKey: "ground.earthChecker",
      position: { x: p.x, y: 0, z: p.z }
    }));
    this.buffer.push(JSON.stringify(groundBlocks.slice(0, 10), null, 2));
    if (groundBlocks.length > 10) {
      this.buffer.push(`// ... and ${groundBlocks.length - 10} more blocks`);
    }
    this.buffer.push("```");

    // === OUTPUT PREVIEW ===
    this.h2("6. 📤 Output Preview");

    this.h3("gameConfig Structure");
    const gameConfigPreview = {
      type: "maze",
      renderer: "3d",
      blocks: `[${groundBlocks.length} ground blocks]`,
      players: [{
        id: "player1",
        start: {
          x: result.startPosition.x,
          y: result.startPosition.y,
          z: result.startPosition.z,
          direction: result.startDirection
        }
      }],
      collectibles: result.items.filter(i => i.type === 'crystal' || i.type === 'key').map((item, i) => ({
        id: `${item.type[0]}${i + 1}`,
        type: item.type,
        position: item.position
      })),
      interactibles: result.items.filter(i => i.type === 'switch' || i.type === 'gate').map((item, i) => ({
        id: `${item.type}${i + 1}`,
        type: item.type,
        position: item.position
      })),
      finish: result.endPosition
    };

    this.buffer.push("```json");
    this.buffer.push(JSON.stringify(gameConfigPreview, null, 2));
    this.buffer.push("```");

    // === SUMMARY ===
    this.h2("📊 Summary");
    this.buffer.push("```");
    this.buffer.push(`Template: ${input.id || 'unnamed'}`);
    this.buffer.push(`Concept: ${input.concept}`);
    this.buffer.push(`Grade Level: ${input.gradeLevel}`);
    this.buffer.push(`Parameters: ${Object.entries(resolvedParams).map(([k, v]) => `${k}=${v}`).join(', ')}`);
    this.buffer.push(`---`);
    this.buffer.push(`Path Length: ${result.pathCoords.length} blocks`);
    this.buffer.push(`Items: ${result.items.length}`);
    this.buffer.push(`Actions: ${result.actions.length}`);
    this.buffer.push(`Loop Iterations: ${result.loopIterations}`);
    this.buffer.push("```");

    return this.buffer.join("\n");
  }
}

// ============================================================================
// EXAMPLE USAGE
// ============================================================================

/*
const input: TemplateInput = {
  id: "FOR_G35_LOOPS_BASIC_C1",
  concept: "for_counted",
  gradeLevel: "3-5",
  code: "for i in 1 to $N { moveForward(); pickCrystal() }",
  parameters: {
    N: { min: 3, max: 8 }
  }
};

const reporter = new TemplatePreviewReporter();
const report = reporter.generate(input, { N: 5 });
console.log(report);
*/

export { TemplateInput, SimulationResult };
