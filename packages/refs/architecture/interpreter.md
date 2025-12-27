# Interpreter Architecture

## 1. Overview

The Solution-Driven approach requires a full interpreter to execute code templates
and generate maps from the execution trace. This document describes the interpreter
architecture.

## 2. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CODE TEMPLATE INPUT                              │
│                                                                          │
│  "for i in 1 to $N { moveForward(); pickCrystal() }"                   │
│  + parameters: { N: 5 }                                                 │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           LEXER / TOKENIZER                              │
│                                                                          │
│  Tokens: [FOR, IDENT(i), IN, NUM(1), TO, PARAM(N), LBRACE, ...]        │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              PARSER                                      │
│                                                                          │
│  AST:                                                                    │
│    ForLoop {                                                            │
│      variable: "i",                                                     │
│      start: 1,                                                          │
│      end: ParameterRef("N"),                                           │
│      body: Block [                                                      │
│        FunctionCall("moveForward"),                                    │
│        FunctionCall("pickCrystal")                                     │
│      ]                                                                  │
│    }                                                                    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         PARAMETER RESOLVER                               │
│                                                                          │
│  Resolves $N → 5 (from input parameters)                               │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            INTERPRETER                                   │
│                                                                          │
│  ExecutionContext:                                                      │
│    - position: { x: 0, y: 0 }                                          │
│    - direction: NORTH                                                   │
│    - variables: { i: 1 }                                               │
│    - loopStack: [{ variable: 'i', current: 1, max: 5 }]               │
│    - inventory: { crystals: 0, keys: 0 }                               │
│                                                                          │
│  Traces:                                                                │
│    - pathCoords: Set<string>                                           │
│    - placementCoords: Map<string, ItemType>                            │
│    - actionHistory: Action[]                                            │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           MAP BUILDER                                    │
│                                                                          │
│  GeneratedMap:                                                          │
│    - pathCoords (ground blocks)                                         │
│    - items (crystals, keys, etc.)                                      │
│    - startPosition, endPosition                                         │
│    - metadata (complexity, path length)                                 │
└─────────────────────────────────────────────────────────────────────────┘
```

## 3. Components

### 3.1 Lexer (Tokenizer)

```typescript
enum TokenType {
  // Keywords
  FOR = 'FOR',
  IN = 'IN',
  TO = 'TO',
  IF = 'IF',
  ELSE = 'ELSE',
  WHILE = 'WHILE',
  FUNC = 'FUNC',
  
  // Literals
  NUMBER = 'NUMBER',
  IDENTIFIER = 'IDENTIFIER',
  PARAMETER = 'PARAMETER',  // $NAME
  
  // Operators
  LBRACE = 'LBRACE',        // {
  RBRACE = 'RBRACE',        // }
  LPAREN = 'LPAREN',        // (
  RPAREN = 'RPAREN',        // )
  
  // Built-in functions
  MOVE_FORWARD = 'MOVE_FORWARD',
  TURN_LEFT = 'TURN_LEFT',
  TURN_RIGHT = 'TURN_RIGHT',
  PICK_CRYSTAL = 'PICK_CRYSTAL',
  PICK_KEY = 'PICK_KEY',
  TOGGLE_SWITCH = 'TOGGLE_SWITCH',
  
  // Control
  EOF = 'EOF'
}

interface Token {
  type: TokenType;
  value: any;
  line: number;
  column: number;
}

class Lexer {
  private input: string;
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;
  
  tokenize(): Token[] {
    const tokens: Token[] = [];
    
    while (this.position < this.input.length) {
      this.skipWhitespace();
      
      if (this.position >= this.input.length) break;
      
      const char = this.input[this.position];
      
      // Parameter: $NAME
      if (char === '$') {
        tokens.push(this.readParameter());
        continue;
      }
      
      // Number
      if (/\d/.test(char)) {
        tokens.push(this.readNumber());
        continue;
      }
      
      // Identifier or keyword
      if (/[a-zA-Z_]/.test(char)) {
        tokens.push(this.readIdentifier());
        continue;
      }
      
      // Single character tokens
      tokens.push(this.readSingleChar());
    }
    
    tokens.push({ type: TokenType.EOF, value: null, line: this.line, column: this.column });
    return tokens;
  }
  
  private readParameter(): Token {
    const start = this.position;
    this.position++; // skip $
    
    let name = '';
    while (this.position < this.input.length && /\w/.test(this.input[this.position])) {
      name += this.input[this.position++];
    }
    
    return { type: TokenType.PARAMETER, value: name, line: this.line, column: start };
  }
  
  // ... other methods
}
```

### 3.2 Parser

```typescript
// AST Node Types
interface ASTNode {
  type: string;
  line?: number;
}

interface ForLoopNode extends ASTNode {
  type: 'ForLoop';
  variable: string;
  start: number | ParameterRef;
  end: number | ParameterRef;
  body: BlockNode;
}

interface IfStatementNode extends ASTNode {
  type: 'IfStatement';
  condition: ConditionNode;
  thenBranch: BlockNode;
  elseBranch?: BlockNode;
}

interface WhileLoopNode extends ASTNode {
  type: 'WhileLoop';
  condition: ConditionNode;
  body: BlockNode;
}

interface FunctionCallNode extends ASTNode {
  type: 'FunctionCall';
  name: string;
  arguments: any[];
}

interface BlockNode extends ASTNode {
  type: 'Block';
  statements: ASTNode[];
}

interface ParameterRef {
  type: 'ParameterRef';
  name: string;
}

interface ConditionNode extends ASTNode {
  type: 'Condition';
  operator: 'not' | 'and' | 'or' | 'none';
  condition: ConditionType;
  left?: ConditionNode;
  right?: ConditionNode;
}

// Parser
class Parser {
  private tokens: Token[];
  private current: number = 0;
  
  parse(): BlockNode {
    const statements: ASTNode[] = [];
    
    while (!this.isAtEnd()) {
      statements.push(this.parseStatement());
    }
    
    return { type: 'Block', statements };
  }
  
  private parseStatement(): ASTNode {
    if (this.check(TokenType.FOR)) {
      return this.parseForLoop();
    }
    if (this.check(TokenType.IF)) {
      return this.parseIfStatement();
    }
    if (this.check(TokenType.WHILE)) {
      return this.parseWhileLoop();
    }
    
    return this.parseFunctionCall();
  }
  
  private parseForLoop(): ForLoopNode {
    this.consume(TokenType.FOR, 'Expected FOR');
    const variable = this.consume(TokenType.IDENTIFIER, 'Expected variable').value;
    this.consume(TokenType.IN, 'Expected IN');
    const start = this.parseValue();
    this.consume(TokenType.TO, 'Expected TO');
    const end = this.parseValue();
    this.consume(TokenType.LBRACE, 'Expected {');
    const body = this.parseBlock();
    this.consume(TokenType.RBRACE, 'Expected }');
    
    return {
      type: 'ForLoop',
      variable,
      start,
      end,
      body,
      line: this.previous().line
    };
  }
  
  private parseIfStatement(): IfStatementNode {
    this.consume(TokenType.IF, 'Expected IF');
    const condition = this.parseCondition();
    this.consume(TokenType.LBRACE, 'Expected {');
    const thenBranch = this.parseBlock();
    this.consume(TokenType.RBRACE, 'Expected }');
    
    let elseBranch: BlockNode | undefined;
    if (this.match(TokenType.ELSE)) {
      this.consume(TokenType.LBRACE, 'Expected {');
      elseBranch = this.parseBlock();
      this.consume(TokenType.RBRACE, 'Expected }');
    }
    
    return {
      type: 'IfStatement',
      condition,
      thenBranch,
      elseBranch,
      line: this.previous().line
    };
  }
  
  // ... other parsing methods
}
```

### 3.3 Execution Context

```typescript
interface ExecutionContext {
  // Character state
  position: Vector2;
  direction: Direction;
  inventory: Inventory;
  
  // Variable scope
  variables: Map<string, number>;
  
  // Loop management
  loopStack: LoopFrame[];
  
  // Switch states (for conditionals)
  switchStates: Map<string, boolean>;
  
  // Function definitions
  functions: Map<string, FunctionDef>;
}

interface LoopFrame {
  variable: string;
  currentValue: number;
  maxValue: number;
  bodyStartPosition: Vector2;
  bodyStartDirection: Direction;
}

interface FunctionDef {
  name: string;
  parameters: string[];
  body: BlockNode;
}

interface Inventory {
  crystals: number;
  keys: number;
}

// Context factory
function createInitialContext(): ExecutionContext {
  return {
    position: { x: 0, y: 0 },
    direction: Direction.NORTH,
    inventory: { crystals: 0, keys: 0 },
    variables: new Map(),
    loopStack: [],
    switchStates: new Map(),
    functions: new Map()
  };
}
```

### 3.4 Interpreter

```typescript
interface ExecutionTrace {
  pathCoords: Set<string>;
  placementCoords: Map<string, ItemType>;
  actionHistory: Action[];
  finalContext: ExecutionContext;
}

interface Action {
  type: 'move' | 'turn' | 'collect' | 'interact';
  position: Vector2;
  direction: Direction;
  item?: ItemType;
  timestamp: number;
}

class Interpreter {
  private context: ExecutionContext;
  private pathCoords: Set<string> = new Set();
  private placementCoords: Map<string, ItemType> = new Map();
  private actionHistory: Action[] = [];
  private parameters: Map<string, any>;
  
  constructor(parameters: Record<string, any>) {
    this.context = createInitialContext();
    this.parameters = new Map(Object.entries(parameters));
    
    // Add start position to path
    this.pathCoords.add(this.posKey());
  }
  
  execute(ast: BlockNode): ExecutionTrace {
    this.executeBlock(ast);
    
    return {
      pathCoords: this.pathCoords,
      placementCoords: this.placementCoords,
      actionHistory: this.actionHistory,
      finalContext: this.context
    };
  }
  
  private executeBlock(block: BlockNode): void {
    for (const statement of block.statements) {
      this.executeNode(statement);
    }
  }
  
  private executeNode(node: ASTNode): void {
    switch (node.type) {
      case 'ForLoop':
        this.executeFor(node as ForLoopNode);
        break;
      case 'IfStatement':
        this.executeIf(node as IfStatementNode);
        break;
      case 'WhileLoop':
        this.executeWhile(node as WhileLoopNode);
        break;
      case 'FunctionCall':
        this.executeFunctionCall(node as FunctionCallNode);
        break;
      case 'Block':
        this.executeBlock(node as BlockNode);
        break;
    }
  }
  
  private executeFor(node: ForLoopNode): void {
    const start = this.resolveValue(node.start);
    const end = this.resolveValue(node.end);
    
    for (let i = start; i <= end; i++) {
      // Set loop variable
      this.context.variables.set(node.variable, i);
      
      // Push loop frame
      this.context.loopStack.push({
        variable: node.variable,
        currentValue: i,
        maxValue: end,
        bodyStartPosition: { ...this.context.position },
        bodyStartDirection: this.context.direction
      });
      
      // Execute body
      this.executeBlock(node.body);
      
      // Pop loop frame
      this.context.loopStack.pop();
    }
    
    // Clean up variable
    this.context.variables.delete(node.variable);
  }
  
  private executeIf(node: IfStatementNode): void {
    const conditionResult = this.evaluateCondition(node.condition);
    
    if (conditionResult) {
      this.executeBlock(node.thenBranch);
    } else if (node.elseBranch) {
      this.executeBlock(node.elseBranch);
    }
  }
  
  private executeWhile(node: WhileLoopNode): void {
    const MAX_ITERATIONS = 1000; // Safety limit
    let iterations = 0;
    
    while (this.evaluateCondition(node.condition) && iterations < MAX_ITERATIONS) {
      this.executeBlock(node.body);
      iterations++;
    }
    
    if (iterations >= MAX_ITERATIONS) {
      console.warn('While loop hit iteration limit');
    }
  }
  
  private executeFunctionCall(node: FunctionCallNode): void {
    switch (node.name) {
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
        this.pickItem(ItemType.CRYSTAL);
        break;
      case 'pickKey':
        this.pickItem(ItemType.KEY);
        break;
      case 'toggleSwitch':
        this.toggleSwitch();
        break;
      default:
        // Check user-defined functions
        const func = this.context.functions.get(node.name);
        if (func) {
          this.executeBlock(func.body);
        }
    }
  }
  
  // === Movement Actions ===
  
  private moveForward(): void {
    const delta = DIRECTION_DELTAS[this.context.direction];
    this.context.position = {
      x: this.context.position.x + delta.x,
      y: this.context.position.y + delta.y
    };
    
    this.pathCoords.add(this.posKey());
    this.recordAction('move');
  }
  
  private turnLeft(): void {
    this.context.direction = rotateLeft(this.context.direction);
    this.recordAction('turn');
  }
  
  private turnRight(): void {
    this.context.direction = rotateRight(this.context.direction);
    this.recordAction('turn');
  }
  
  // === Item Actions ===
  
  private pickItem(type: ItemType): void {
    this.placementCoords.set(this.posKey(), type);
    this.recordAction('collect', type);
    
    if (type === ItemType.CRYSTAL) {
      this.context.inventory.crystals++;
    } else if (type === ItemType.KEY) {
      this.context.inventory.keys++;
    }
  }
  
  private toggleSwitch(): void {
    const key = this.posKey();
    const currentState = this.context.switchStates.get(key) ?? false;
    this.context.switchStates.set(key, !currentState);
    this.placementCoords.set(key, ItemType.SWITCH);
    this.recordAction('interact', ItemType.SWITCH);
  }
  
  // === Condition Evaluation ===
  
  private evaluateCondition(condition: ConditionNode): boolean {
    if (condition.operator === 'not') {
      return !this.evaluateCondition(condition.left!);
    }
    if (condition.operator === 'and') {
      return this.evaluateCondition(condition.left!) && 
             this.evaluateCondition(condition.right!);
    }
    if (condition.operator === 'or') {
      return this.evaluateCondition(condition.left!) || 
             this.evaluateCondition(condition.right!);
    }
    
    // Simple condition
    return this.evaluateSimpleCondition(condition.condition);
  }
  
  private evaluateSimpleCondition(type: ConditionType): boolean {
    switch (type) {
      case ConditionType.CRYSTAL_AHEAD:
        return this.checkItemAhead(ItemType.CRYSTAL);
      case ConditionType.KEY_AHEAD:
        return this.checkItemAhead(ItemType.KEY);
      case ConditionType.HAS_KEY:
        return this.context.inventory.keys > 0;
      case ConditionType.AT_PORTAL:
        return this.placementCoords.get(this.posKey()) === ItemType.PORTAL;
      case ConditionType.SWITCH_ON:
        return this.context.switchStates.get(this.posKey()) ?? false;
      default:
        return false;
    }
  }
  
  private checkItemAhead(type: ItemType): boolean {
    const delta = DIRECTION_DELTAS[this.context.direction];
    const aheadPos = {
      x: this.context.position.x + delta.x,
      y: this.context.position.y + delta.y
    };
    const key = `${aheadPos.x},${aheadPos.y}`;
    return this.placementCoords.get(key) === type;
  }
  
  // === Helpers ===
  
  private resolveValue(value: number | ParameterRef): number {
    if (typeof value === 'number') return value;
    
    const param = this.parameters.get(value.name);
    if (param === undefined) {
      throw new Error(`Undefined parameter: ${value.name}`);
    }
    return param;
  }
  
  private posKey(): string {
    return `${this.context.position.x},${this.context.position.y}`;
  }
  
  private recordAction(type: Action['type'], item?: ItemType): void {
    this.actionHistory.push({
      type,
      position: { ...this.context.position },
      direction: this.context.direction,
      item,
      timestamp: Date.now()
    });
  }
}
```

## 4. Nested Structure Handling

### 4.1 Nested FOR Loops

```typescript
// Example: Nested FOR handling
executeNestedFor(outer: ForLoopNode, inner: ForLoopNode): void {
  const outerEnd = this.resolveValue(outer.end);
  const innerEnd = this.resolveValue(inner.end);
  
  for (let i = 1; i <= outerEnd; i++) {
    this.context.variables.set(outer.variable, i);
    this.context.loopStack.push({
      variable: outer.variable,
      currentValue: i,
      maxValue: outerEnd,
      bodyStartPosition: { ...this.context.position },
      bodyStartDirection: this.context.direction
    });
    
    for (let j = 1; j <= innerEnd; j++) {
      this.context.variables.set(inner.variable, j);
      this.context.loopStack.push({
        variable: inner.variable,
        currentValue: j,
        maxValue: innerEnd,
        bodyStartPosition: { ...this.context.position },
        bodyStartDirection: this.context.direction
      });
      
      // Execute inner body
      this.executeBlock(inner.body);
      
      this.context.loopStack.pop();
    }
    
    // Execute outer remainder (after inner loop)
    this.executeBlock(outer.bodyAfterInner);
    
    this.context.loopStack.pop();
  }
}
```

### 4.2 Nested IF-ELSE

```typescript
// For IF-ELSE, we may need to enumerate all paths
class PathEnumerator {
  enumeratePaths(ast: BlockNode): Path[] {
    const paths: Path[] = [];
    this.enumerateNode(ast, [], paths);
    return paths;
  }
  
  private enumerateNode(node: ASTNode, currentPath: Action[], paths: Path[]): void {
    if (node.type === 'IfStatement') {
      const ifNode = node as IfStatementNode;
      
      // Branch 1: condition true
      const truePath = [...currentPath];
      this.enumerateBlock(ifNode.thenBranch, truePath, paths);
      
      // Branch 2: condition false
      if (ifNode.elseBranch) {
        const falsePath = [...currentPath];
        this.enumerateBlock(ifNode.elseBranch, falsePath, paths);
      }
    } else {
      // Normal statement - add to path
      currentPath.push(this.nodeToAction(node));
      if (node.type === 'Block') {
        this.enumerateBlock(node as BlockNode, currentPath, paths);
      }
    }
  }
}
```

## 5. Error Handling

```typescript
class InterpreterError extends Error {
  constructor(
    message: string,
    public line?: number,
    public type: 'syntax' | 'runtime' | 'limit' = 'runtime'
  ) {
    super(message);
    this.name = 'InterpreterError';
  }
}

// Usage in interpreter
private executeFor(node: ForLoopNode): void {
  const start = this.resolveValue(node.start);
  const end = this.resolveValue(node.end);
  
  // Validate iteration count
  if (end - start > 100) {
    throw new InterpreterError(
      `Loop iteration count ${end - start} exceeds limit 100`,
      node.line,
      'limit'
    );
  }
  
  // ... execution
}
```

## 6. Performance Considerations

```typescript
// Memoization for repeated evaluations
class MemoizedInterpreter extends Interpreter {
  private conditionCache: Map<string, boolean> = new Map();
  
  private evaluateCondition(condition: ConditionNode): boolean {
    const cacheKey = this.getConditionCacheKey(condition);
    
    if (this.conditionCache.has(cacheKey)) {
      return this.conditionCache.get(cacheKey)!;
    }
    
    const result = super.evaluateCondition(condition);
    this.conditionCache.set(cacheKey, result);
    return result;
  }
  
  // Clear cache when state changes
  private moveForward(): void {
    this.conditionCache.clear();
    super.moveForward();
  }
}
```

## 7. Testing

```typescript
describe('Interpreter', () => {
  it('should execute simple for loop', () => {
    const code = 'for i in 1 to 5 { moveForward(); pickCrystal() }';
    const interpreter = new Interpreter({ });
    const result = interpreter.execute(parse(code));
    
    expect(result.pathCoords.size).toBe(6);  // Start + 5 moves
    expect(result.placementCoords.size).toBe(5);  // 5 crystals
  });
  
  it('should handle nested loops', () => {
    const code = `
      for i in 1 to 3 {
        for j in 1 to 4 {
          moveForward()
          pickCrystal()
        }
        turnRight()
      }
    `;
    const result = new Interpreter({}).execute(parse(code));
    
    expect(result.placementCoords.size).toBe(12);  // 3 * 4 crystals
  });
});
```
