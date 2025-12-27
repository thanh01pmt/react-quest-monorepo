# Solution-Driven Map Generation (Top-Down Approach)

## 1. Tổng quan

Phương pháp Solution-Driven thiết kế map từ trên xuống (top-down):
- Bắt đầu từ **code mẫu** (solution code)
- **Simulate** code để xác định path và item positions
- Map được "reverse engineered" từ solution

### Core Concept

```
┌─────────────────────────────────────────────────────────────┐
│  Traditional:  Design Map → Find Solution → Teach Code     │
│                                                             │
│  Solution-Driven:  Design Code → Simulate → Generate Map   │
│                                                             │
│  Lợi ích: Map LUÔN khớp chính xác với code dạy học        │
└─────────────────────────────────────────────────────────────┘
```

### Workflow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Code Template  │ ──→ │   Interpreter   │ ──→ │  Generated Map  │
│  (with params)  │     │   (simulate)    │     │  (with items)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                      │                       │
         ▼                      ▼                       ▼
   "for i in 1..N"      Execute step-by-step      Path + Items
   "moveForward()"      Track state changes        Ground blocks
   "pickCrystal()"      Record positions           Scenery
```

## 2. Code Template System

### Template Structure

```typescript
interface CodeTemplate {
  // === Identity ===
  id: string;
  version: string;
  name: string;
  
  // === Pedagogy ===
  category: PedagogyConcept;
  gradeLevel: 'K-2' | '3-5' | '6-8' | '9-12';
  difficultyLevel: 1 | 2 | 3 | 4 | 5;
  learningObjective: string;
  
  // === Code ===
  code: string;                    // Pseudo-code với $PLACEHOLDERS
  syntax: 'swift-like' | 'scratch-like' | 'python-like';
  
  // === Parameters (cho randomization) ===
  parameters: ParameterDef[];
  
  // === Constraints ===
  constraints: GenerationConstraints;
  
  // === Expected Outputs ===
  expectedMetrics: MetricsRange;
}

interface ParameterDef {
  name: string;                    // e.g., 'N'
  type: 'int' | 'bool' | 'enum';
  range?: [min: number, max: number];
  options?: any[];
  default?: any;
  description: string;
}

interface GenerationConstraints {
  maxNestingDepth: number;
  maxComplexityScore: number;
  requiredItems: ItemType[];
  forbiddenItems: ItemType[];
  noiseLevel: 'none' | 'low' | 'medium' | 'high';
}
```

### Example Templates

#### Simple FOR Loop

```typescript
const simpleForTemplate: CodeTemplate = {
  id: 'for-simple-001',
  version: '1.0.0',
  name: 'Collect N Crystals',
  
  category: PedagogyConcept.FOR_COUNTED,
  gradeLevel: '3-5',
  difficultyLevel: 2,
  learningObjective: 'Hiểu for loop với số lần lặp cố định',
  
  code: `
for i in 1 to $N {
    moveForward()
    pickCrystal()
}
  `.trim(),
  syntax: 'swift-like',
  
  parameters: [
    { 
      name: 'N', 
      type: 'int', 
      range: [3, 8], 
      default: 5,
      description: 'Số lần lặp' 
    }
  ],
  
  constraints: {
    maxNestingDepth: 1,
    maxComplexityScore: 15,
    requiredItems: [ItemType.CRYSTAL],
    forbiddenItems: [],
    noiseLevel: 'none'
  },
  
  expectedMetrics: {
    pathLengthRange: [3, 8],
    itemCountRange: [3, 8],
    branchCountRange: [0, 0],
    estimatedTimeMinutes: 3
  }
};
```

#### Nested FOR Loop

```typescript
const nestedForTemplate: CodeTemplate = {
  id: 'nested-for-001',
  version: '1.0.0',
  name: 'Grid Crystal Collection',
  
  category: PedagogyConcept.NESTED_FOR,
  gradeLevel: '6-8',
  difficultyLevel: 3,
  learningObjective: 'Hiểu nested for loops tạo grid patterns',
  
  code: `
for row in 1 to $ROWS {
    for col in 1 to $COLS {
        moveForward()
        pickCrystal()
    }
    turnRight()
    moveForward()
    turnRight()
}
  `.trim(),
  syntax: 'swift-like',
  
  parameters: [
    { name: 'ROWS', type: 'int', range: [2, 4], default: 3, description: 'Số hàng' },
    { name: 'COLS', type: 'int', range: [3, 6], default: 4, description: 'Số cột' }
  ],
  
  constraints: {
    maxNestingDepth: 2,
    maxComplexityScore: 30,
    requiredItems: [ItemType.CRYSTAL],
    forbiddenItems: [ItemType.GATE],
    noiseLevel: 'low'
  },
  
  expectedMetrics: {
    pathLengthRange: [12, 48],
    itemCountRange: [6, 24],
    branchCountRange: [0, 0],
    estimatedTimeMinutes: 5
  }
};
```

## 3. Interpreter Architecture

### Core Interpreter

```typescript
interface ExecutionContext {
  position: Vector2;
  direction: Direction;
  variables: Map<string, number>;
  loopStack: LoopFrame[];
  inventory: Inventory;
}

interface LoopFrame {
  variable: string;
  currentValue: number;
  maxValue: number;
  bodyStartIndex: number;
}

class SolutionInterpreter {
  private context: ExecutionContext;
  private pathCoords: Set<string> = new Set();
  private placementCoords: Map<string, ItemType> = new Map();
  
  constructor() {
    this.context = {
      position: { x: 0, y: 0 },
      direction: Direction.NORTH,
      variables: new Map(),
      loopStack: [],
      inventory: { keys: 0, crystals: 0 }
    };
  }
  
  execute(ast: AST): ExecutionResult {
    this.executeNode(ast.root);
    
    return {
      pathCoords: this.pathCoords,
      placementCoords: this.placementCoords,
      finalState: this.context
    };
  }
  
  private executeNode(node: ASTNode): void {
    switch (node.type) {
      case 'FOR_LOOP':
        this.executeFor(node as ForLoopNode);
        break;
      case 'IF_STATEMENT':
        this.executeIf(node as IfStatementNode);
        break;
      case 'WHILE_LOOP':
        this.executeWhile(node as WhileLoopNode);
        break;
      case 'STATEMENT':
        this.executeStatement(node as StatementNode);
        break;
      case 'BLOCK':
        for (const child of node.children) {
          this.executeNode(child);
        }
        break;
    }
  }
  
  private executeFor(node: ForLoopNode): void {
    const { variable, start, end, body } = node;
    
    for (let i = start; i <= end; i++) {
      this.context.variables.set(variable, i);
      this.context.loopStack.push({
        variable,
        currentValue: i,
        maxValue: end,
        bodyStartIndex: 0
      });
      
      this.executeNode(body);
      
      this.context.loopStack.pop();
    }
    
    this.context.variables.delete(variable);
  }
  
  private executeIf(node: IfStatementNode): void {
    const conditionResult = this.evaluateCondition(node.condition);
    
    if (conditionResult) {
      this.executeNode(node.thenBranch);
    } else if (node.elseBranch) {
      this.executeNode(node.elseBranch);
    }
  }
  
  private executeWhile(node: WhileLoopNode): void {
    let iterations = 0;
    const MAX_ITERATIONS = 100; // Safety limit
    
    while (this.evaluateCondition(node.condition) && iterations < MAX_ITERATIONS) {
      this.executeNode(node.body);
      iterations++;
    }
  }
  
  private executeStatement(node: StatementNode): void {
    switch (node.action) {
      case 'moveForward':
        this.moveForward();
        break;
      case 'turnLeft':
        this.turnLeft();
        break;
      case 'turnRight':
        this.turnRight();
        break;
      case 'pickCrystal':
        this.placementCoords.set(this.posKey(), ItemType.CRYSTAL);
        this.context.inventory.crystals++;
        break;
      case 'pickKey':
        this.placementCoords.set(this.posKey(), ItemType.KEY);
        this.context.inventory.keys++;
        break;
      case 'toggleSwitch':
        this.placementCoords.set(this.posKey(), ItemType.SWITCH);
        break;
      case 'openGate':
        this.placementCoords.set(this.posKey(), ItemType.GATE);
        break;
    }
  }
  
  private moveForward(): void {
    const delta = this.getDirectionDelta();
    this.context.position.x += delta.x;
    this.context.position.y += delta.y;
    this.pathCoords.add(this.posKey());
  }
  
  private turnLeft(): void {
    this.context.direction = this.rotateLeft(this.context.direction);
  }
  
  private turnRight(): void {
    this.context.direction = this.rotateRight(this.context.direction);
  }
  
  private posKey(): string {
    return `${this.context.position.x},${this.context.position.y}`;
  }
}
```

### AST Parser

```typescript
interface AST {
  root: BlockNode;
  metadata: {
    totalNodes: number;
    maxDepth: number;
    usedConstructs: string[];
  };
}

class CodeParser {
  parse(code: string, syntax: string): AST {
    const tokens = this.tokenize(code);
    const root = this.parseBlock(tokens, 0);
    
    return {
      root,
      metadata: this.analyzeAST(root)
    };
  }
  
  private tokenize(code: string): Token[] {
    // Lexer implementation
    // Returns tokens like: FOR, IN, TO, IDENTIFIER, NUMBER, etc.
  }
  
  private parseBlock(tokens: Token[], startIndex: number): BlockNode {
    // Recursive descent parser
    // Builds AST from tokens
  }
}
```

## 4. Handling Complex Structures

### 4.1 Nested FOR Loops

```typescript
class NestedForHandler {
  execute(ast: NestedForNode): ExecutionResult {
    const { outer, inner } = ast;
    
    for (let i = outer.start; i <= outer.end; i++) {
      this.context.variables.set(outer.variable, i);
      
      for (let j = inner.start; j <= inner.end; j++) {
        this.context.variables.set(inner.variable, j);
        
        // Execute inner body
        this.executeStatements(inner.body);
      }
      
      // Execute outer body remainder (after inner loop)
      this.executeStatements(outer.bodyAfterInner);
    }
  }
}

/*
Example:
for row in 1 to 3 {
    for col in 1 to 4 {
        moveForward()
        pickCrystal()
    }
    turnRight()    // This is outer.bodyAfterInner
    moveForward()
    turnRight()
}

Result: 3 rows × 4 columns = 12 crystals in grid pattern
*/
```

### 4.2 Nested IF-ELSE

```typescript
class NestedIfHandler {
  // For IF-ELSE, we need to generate ALL possible paths
  // because player might take any branch
  
  enumeratePaths(ast: IfStatementNode): Path[] {
    const paths: Path[] = [];
    
    // Path 1: condition = true
    const truePath = this.executeWithCondition(ast, true);
    paths.push(truePath);
    
    // Path 2: condition = false
    if (ast.elseBranch) {
      const falsePath = this.executeWithCondition(ast, false);
      paths.push(falsePath);
    }
    
    // If nested IF in either branch, recursively enumerate
    if (this.hasNestedIf(ast.thenBranch)) {
      const nestedPaths = this.enumeratePaths(ast.thenBranch as IfStatementNode);
      paths.push(...nestedPaths);
    }
    
    return paths;
  }
  
  generateMapForAllPaths(paths: Path[]): GeneratedMap {
    const map = new GeneratedMap();
    
    // Generate ground for ALL paths (including dead ends)
    for (const path of paths) {
      map.addGroundBlocks(path.coords);
    }
    
    // Place items based on primary path
    const primaryPath = paths[0];
    for (const [coord, item] of primaryPath.items) {
      map.placeItem(coord, item);
    }
    
    // Add visual hints at branch points
    for (const branchPoint of this.findBranchPoints(paths)) {
      map.addBranchIndicator(branchPoint);
    }
    
    return map;
  }
}
```

### 4.3 FOR + IF Hybrid

```typescript
class ForWithIfHandler {
  execute(ast: ForWithIfNode): ExecutionResult {
    const { loopVar, start, end, ifStatement, bodyAfterIf } = ast;
    
    for (let i = start; i <= end; i++) {
      this.context.variables.set(loopVar, i);
      
      // Decide condition for this iteration
      const condition = this.decideCondition(i, end, ast.ifStatement.condition);
      
      if (condition) {
        this.executeStatements(ast.ifStatement.thenBranch);
      } else {
        this.executeStatements(ast.ifStatement.elseBranch);
      }
      
      this.executeStatements(bodyAfterIf);
    }
  }
  
  // Key insight: Condition result determines item placement
  private decideCondition(
    iteration: number, 
    total: number, 
    conditionType: ConditionType
  ): boolean {
    switch (conditionType) {
      case ConditionType.CRYSTAL_AHEAD:
        // Random with probability, ensuring at least one of each
        return this.randomWithMinimums(iteration, total, 0.6);
        
      case ConditionType.HAS_KEY:
        // Check if key was collected
        return this.context.inventory.keys > 0;
        
      default:
        return Math.random() > 0.5;
    }
  }
  
  private randomWithMinimums(i: number, total: number, probability: number): boolean {
    // Ensure at least 1 true and 1 false across all iterations
    if (i === 1) return true;   // First iteration always true
    if (i === total) return false;  // Last iteration always false
    return Math.random() < probability;
  }
}
```

### 4.4 WHILE Loops (with Guaranteed Termination)

```typescript
class SafeWhileHandler {
  execute(ast: WhileLoopNode): ExecutionResult {
    // CRITICAL: Generate path FIRST, then place terminator
    
    // Step 1: Decide number of iterations
    const iterations = this.randomIterations(5, 12);
    
    // Step 2: Execute loop body n times
    const pathCoords: Vector2[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const newCoords = this.executeBody(ast.body);
      pathCoords.push(...newCoords);
      
      // Handle nested conditions if present
      if (ast.hasNestedIf) {
        this.handleNestedWhileIf(ast.nestedIf, i, iterations);
      }
    }
    
    // Step 3: Place terminator at LAST position (guaranteed on path)
    const terminatorPos = pathCoords[pathCoords.length - 1];
    this.placementCoords.set(this.posKey(terminatorPos), ItemType.PORTAL);
    
    // Step 4: Verify path reaches terminator
    this.verifyTermination(pathCoords, terminatorPos);
    
    return {
      pathCoords: new Set(pathCoords.map(p => this.posKey(p))),
      placementCoords: this.placementCoords,
      iterations
    };
  }
  
  private verifyTermination(path: Vector2[], terminator: Vector2): void {
    const lastPos = path[path.length - 1];
    if (lastPos.x !== terminator.x || lastPos.y !== terminator.y) {
      throw new Error('Termination check failed: path does not reach terminator');
    }
  }
}
```

## 5. Randomization Layer

### Deterministic Random (Seeded)

```typescript
class SeededRandom {
  private seed: number;
  
  constructor(levelId: string, conceptId: string) {
    // Same levelId + conceptId = same map
    this.seed = this.hash(levelId + conceptId);
  }
  
  private hash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
  
  next(): number {
    // Linear Congruential Generator
    this.seed = (this.seed * 1103515245 + 12345) % 2147483648;
    return this.seed / 2147483648;
  }
  
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  
  nextBool(probability: number = 0.5): boolean {
    return this.next() < probability;
  }
}
```

### Variation Generator

```typescript
class VariationGenerator {
  generateVariations(
    template: CodeTemplate, 
    count: number
  ): GeneratedMap[] {
    const maps: GeneratedMap[] = [];
    
    for (let v = 0; v < count; v++) {
      // Each variation has unique seed based on template + variation index
      const random = new SeededRandom(template.id, `variation-${v}`);
      
      // Randomize parameters within ranges
      const params = this.randomizeParams(template.parameters, random);
      
      // Substitute parameters into code
      const instantiatedCode = this.substituteParams(template.code, params);
      
      // Generate map
      const map = this.generate(instantiatedCode);
      maps.push(map);
    }
    
    return maps;
  }
  
  private randomizeParams(
    defs: ParameterDef[], 
    random: SeededRandom
  ): Record<string, any> {
    const params: Record<string, any> = {};
    
    for (const def of defs) {
      if (def.type === 'int' && def.range) {
        params[def.name] = random.nextInt(def.range[0], def.range[1]);
      } else if (def.type === 'bool') {
        params[def.name] = random.nextBool();
      } else if (def.options) {
        const index = random.nextInt(0, def.options.length - 1);
        params[def.name] = def.options[index];
      } else {
        params[def.name] = def.default;
      }
    }
    
    return params;
  }
}
```

## 6. Dependency Management

### Smart Dependency Placement

```typescript
enum DependencyStrategy {
  BALANCED,       // Chia đều dependencies
  EXPLORATORY,    // Ẩn trong detours
  PROGRESSIVE,    // Theo thứ tự khó dần
  PUZZLE          // Require backtracking
}

class DependencyPlacer {
  place(
    item: ItemType,
    paths: Path[],
    strategy: DependencyStrategy
  ): Vector2 {
    switch (strategy) {
      case DependencyStrategy.BALANCED:
        return this.balancedPlace(item, paths);
        
      case DependencyStrategy.PROGRESSIVE:
        return this.progressivePlace(item, paths);
        
      case DependencyStrategy.PUZZLE:
        return this.puzzlePlace(item, paths);
        
      default:
        return this.balancedPlace(item, paths);
    }
  }
  
  private progressivePlace(item: ItemType, paths: Path[]): Vector2 {
    // Keys early, switches mid, gates late
    const order = [ItemType.KEY, ItemType.SWITCH, ItemType.GATE];
    const index = order.indexOf(item);
    const ratio = (index + 1) / order.length;
    
    const path = this.getLongestPath(paths);
    const position = Math.floor(path.length * ratio);
    
    return path.coords[position];
  }
}
```

## 7. Validation & Quality Assurance

### Solvability Check

```typescript
class SolvabilityValidator {
  validate(map: GeneratedMap, template: CodeTemplate): ValidationResult {
    const errors: string[] = [];
    
    // 1. All items reachable
    for (const [coord, item] of map.items) {
      if (!this.isReachable(coord, map.pathCoords)) {
        errors.push(`Item ${item} at ${coord} is not reachable`);
      }
    }
    
    // 2. Dependencies satisfied
    if (!this.checkDependencies(map.items)) {
      errors.push('Item dependencies not satisfied');
    }
    
    // 3. Termination possible
    if (!this.hasTerminator(map)) {
      errors.push('No termination point (portal/goal)');
    }
    
    // 4. Complexity within limits
    const complexity = this.calculateComplexity(map);
    if (complexity > template.constraints.maxComplexityScore) {
      errors.push(`Complexity ${complexity} exceeds limit`);
    }
    
    return {
      valid: errors.length === 0,
      errors,
      complexity
    };
  }
}
```

### Playtest Simulation

```typescript
class PlaytestSimulator {
  simulate(map: GeneratedMap, expectedCode: string): PlaytestResult {
    // Execute expected code against generated map
    const interpreter = new GameInterpreter(map);
    const result = interpreter.execute(expectedCode);
    
    return {
      success: result.reachedGoal,
      itemsCollected: result.itemsCollected,
      stepsUsed: result.steps,
      errors: result.errors
    };
  }
}
```

## 8. Điểm mạnh và Điểm yếu

### ✅ Điểm mạnh

1. **Pedagogy First**: Map luôn khớp chính xác với code dạy
2. **Guaranteed Solvable**: Map luôn có solution
3. **Controlled Complexity**: Complexity từ template, không random
4. **Reproducible**: Same seed = same map

### ⚠️ Điểm yếu

1. **Template Authoring**: Cần nhiều templates chất lượng
2. **Less Variation**: Ít đa dạng hơn pattern-based
3. **Complex Structures**: Nested constructs cần careful handling
4. **No Exploration**: Player chỉ follow script

## 9. Khi nào Sử dụng

| Use Case | Phù hợp | Lý do |
|----------|---------|-------|
| Tutorial levels | ✅ | Cần control chính xác |
| Assessment | ✅ | Đảm bảo concept cụ thể |
| Adventure levels | ❌ | Thiếu exploration |
| Challenge modes | ❌ | Thiếu variety |
