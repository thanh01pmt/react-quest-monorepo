/**
 * Template Interpreter
 * 
 * Parses and executes code templates, tracking path and item positions.
 */

import {
  CodeTemplate,
  ExecutionContext,
  ExecutionTrace,
  ExecutionAction,
  ASTNode,
  BlockNode,
  ForLoopNode,
  FunctionCallNode,
  IfStatementNode,
  WhileLoopNode,
  FunctionDefNode,
  ConditionNode,
  ConditionType,
  Direction,
  Coord,
  createInitialContext,
  turnRight,
  turnLeft,
  moveForward,
  coordToKey
} from './types';

// ============================================================================
// LEXER
// ============================================================================

enum TokenType {
  // Keywords
  FOR = 'FOR',
  LET = 'LET',
  CONST = 'CONST',
  IN = 'IN',
  TO = 'TO',
  IF = 'IF',
  ELSE = 'ELSE',
  WHILE = 'WHILE',
  FUNC = 'FUNC',
  FUNCTION = 'FUNCTION',
  NOT = 'NOT',
  
  // Literals
  NUMBER = 'NUMBER',
  IDENTIFIER = 'IDENTIFIER',
  
  // Operators
  ASSIGN = 'ASSIGN',       // =
  LT = 'LT',               // <
  LTE = 'LTE',             // <=
  GT = 'GT',               // >
  GTE = 'GTE',             // >=
  INCREMENT = 'INCREMENT', // ++
  DECREMENT = 'DECREMENT', // --
  PLUS = 'PLUS',           // +
  MINUS = 'MINUS',         // -
  
  // Punctuation
  LBRACE = 'LBRACE',
  RBRACE = 'RBRACE',
  LPAREN = 'LPAREN',
  RPAREN = 'RPAREN',
  SEMICOLON = 'SEMICOLON',
  COMMA = 'COMMA',
  
  EOF = 'EOF'
}

interface Token {
  type: TokenType;
  value: any;
  line: number;
  column: number;
}

const KEYWORDS: Record<string, TokenType> = {
  'for': TokenType.FOR,
  'let': TokenType.LET,
  'const': TokenType.CONST,
  'in': TokenType.IN,
  'to': TokenType.TO,
  'if': TokenType.IF,
  'else': TokenType.ELSE,
  'while': TokenType.WHILE,
  'func': TokenType.FUNC,
  'function': TokenType.FUNCTION,
  'not': TokenType.NOT
};

class Lexer {
  private input: string;
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;

  constructor(input: string) {
    this.input = input;
  }

  tokenize(): Token[] {
    const tokens: Token[] = [];

    while (this.position < this.input.length) {
      this.skipWhitespace();
      if (this.position >= this.input.length) break;

      const char = this.input[this.position];
      const nextChar = this.input[this.position + 1];

      // Number
      if (/\d/.test(char)) {
        tokens.push(this.readNumber());
        continue;
      }

      // Identifier or keyword
      if (/[a-zA-Z_$]/.test(char)) {
        tokens.push(this.readIdentifier());
        continue;
      }

      // Multi-character operators
      if (char === '+' && nextChar === '+') {
        tokens.push(this.makeDoubleToken(TokenType.INCREMENT, '++'));
        continue;
      }
      if (char === '-' && nextChar === '-') {
        tokens.push(this.makeDoubleToken(TokenType.DECREMENT, '--'));
        continue;
      }
      if (char === '<' && nextChar === '=') {
        tokens.push(this.makeDoubleToken(TokenType.LTE, '<='));
        continue;
      }
      if (char === '>' && nextChar === '=') {
        tokens.push(this.makeDoubleToken(TokenType.GTE, '>='));
        continue;
      }

      // Single character tokens
      switch (char) {
        case '{':
          tokens.push(this.makeToken(TokenType.LBRACE, '{'));
          break;
        case '}':
          tokens.push(this.makeToken(TokenType.RBRACE, '}'));
          break;
        case '(':
          tokens.push(this.makeToken(TokenType.LPAREN, '('));
          break;
        case ')':
          tokens.push(this.makeToken(TokenType.RPAREN, ')'));
          break;
        case ';':
          tokens.push(this.makeToken(TokenType.SEMICOLON, ';'));
          break;
        case ',':
          tokens.push(this.makeToken(TokenType.COMMA, ','));
          break;
        case '=':
          tokens.push(this.makeToken(TokenType.ASSIGN, '='));
          break;
        case '<':
          tokens.push(this.makeToken(TokenType.LT, '<'));
          break;
        case '>':
          tokens.push(this.makeToken(TokenType.GT, '>'));
          break;
        case '+':
          tokens.push(this.makeToken(TokenType.PLUS, '+'));
          break;
        case '-':
          tokens.push(this.makeToken(TokenType.MINUS, '-'));
          break;
        case '!':
          tokens.push(this.makeToken(TokenType.NOT, '!'));
          break;
        default:
          // Skip unknown characters
          this.position++;
          this.column++;
      }
    }

    tokens.push({ type: TokenType.EOF, value: null, line: this.line, column: this.column });
    return tokens;
  }

  private skipWhitespace(): void {
    while (this.position < this.input.length) {
      const char = this.input[this.position];
      if (char === ' ' || char === '\t') {
        this.position++;
        this.column++;
      } else if (char === '\n') {
        this.position++;
        this.line++;
        this.column = 1;
      } else if (char === '\r') {
        this.position++;
      } else if (char === '/' && this.input[this.position + 1] === '/') {
        // Skip single-line comments
        while (this.position < this.input.length && this.input[this.position] !== '\n') {
          this.position++;
        }
      } else {
        break;
      }
    }
  }

  private readNumber(): Token {
    const start = this.column;
    let value = '';
    
    while (this.position < this.input.length && /\d/.test(this.input[this.position])) {
      value += this.input[this.position++];
      this.column++;
    }
    
    return { type: TokenType.NUMBER, value: parseInt(value, 10), line: this.line, column: start };
  }

  private readIdentifier(): Token {
    const start = this.column;
    let value = '';
    
    while (this.position < this.input.length && /[\w$]/.test(this.input[this.position])) {
      value += this.input[this.position++];
      this.column++;
    }
    
    const type = KEYWORDS[value.toLowerCase()] || TokenType.IDENTIFIER;
    return { type, value, line: this.line, column: start };
  }

  private makeToken(type: TokenType, value: any): Token {
    const token = { type, value, line: this.line, column: this.column };
    this.position++;
    this.column++;
    return token;
  }

  private makeDoubleToken(type: TokenType, value: string): Token {
    const token = { type, value, line: this.line, column: this.column };
    this.position += 2;
    this.column += 2;
    return token;
  }
}

// ============================================================================
// PARSER
// ============================================================================

class Parser {
  private tokens: Token[];
  private current: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): BlockNode {
    const statements: ASTNode[] = [];
    
    while (!this.isAtEnd()) {
      const stmt = this.parseStatement();
      if (stmt) statements.push(stmt);
    }
    
    return { type: 'Block', statements };
  }

  private parseStatement(): ASTNode | null {
    if (this.check(TokenType.FOR)) {
      return this.parseForLoop();
    }
    if (this.check(TokenType.IF)) {
      return this.parseIfStatement();
    }
    if (this.check(TokenType.WHILE)) {
      return this.parseWhileLoop();
    }
    if (this.check(TokenType.FUNC) || this.check(TokenType.FUNCTION)) {
      return this.parseFunctionDef();
    }
    if (this.check(TokenType.LET) || this.check(TokenType.CONST)) {
      // Skip variable declarations (not needed for map generation)
      while (!this.check(TokenType.SEMICOLON) && !this.isAtEnd()) this.advance();
      if (this.check(TokenType.SEMICOLON)) this.advance();
      return null;
    }
    if (this.check(TokenType.IDENTIFIER)) {
      return this.parseFunctionCall();
    }
    // Skip unknown tokens
    if (!this.isAtEnd()) this.advance();
    return null;
  }

  /**
   * Parse FOR loop - supports both syntaxes:
   * 
   * TypeScript-like: for (let i = 1; i <= N; i++) { ... }
   * Simple:          for i in 1 to N { ... }
   */
  private parseForLoop(): ForLoopNode {
    this.consume(TokenType.FOR, 'Expected "for"');
    
    // Check if TypeScript-style: for (
    if (this.check(TokenType.LPAREN)) {
      return this.parseTypeScriptForLoop();
    }
    
    // Simple syntax: for i in 1 to N { ... }
    const variable = this.consume(TokenType.IDENTIFIER, 'Expected variable name').value;
    this.consume(TokenType.IN, 'Expected "in"');
    const start = this.consume(TokenType.NUMBER, 'Expected start number').value;
    this.consume(TokenType.TO, 'Expected "to"');
    const end = this.consume(TokenType.NUMBER, 'Expected end number').value;
    this.consume(TokenType.LBRACE, 'Expected "{"');
    const body = this.parseBlock();
    this.consume(TokenType.RBRACE, 'Expected "}"');

    return { type: 'ForLoop', variable, start, end, body };
  }

  /**
   * Parse TypeScript-style FOR loop:
   * for (let i = 1; i <= N; i++) { ... }
   * for (let i = 0; i < N; i++) { ... }
   */
  private parseTypeScriptForLoop(): ForLoopNode {
    this.consume(TokenType.LPAREN, 'Expected "("');
    
    // Initialization: let i = 1 | const i = 1 | i = 1
    if (this.check(TokenType.LET) || this.check(TokenType.CONST)) {
      this.advance(); // skip let/const
    }
    const variable = this.consume(TokenType.IDENTIFIER, 'Expected variable name').value;
    this.consume(TokenType.ASSIGN, 'Expected "="');
    const start = this.consume(TokenType.NUMBER, 'Expected start number').value;
    this.consume(TokenType.SEMICOLON, 'Expected ";"');
    
    // Condition: i <= N | i < N
    this.consume(TokenType.IDENTIFIER, 'Expected variable in condition'); // Skip variable name
    let isLessThanEqual = true;
    if (this.check(TokenType.LTE)) {
      this.advance();
    } else if (this.check(TokenType.LT)) {
      this.advance();
      isLessThanEqual = false;
    } else {
      throw new Error('Expected "<=" or "<" in for loop condition');
    }
    const endValue = this.consume(TokenType.NUMBER, 'Expected end number').value;
    this.consume(TokenType.SEMICOLON, 'Expected ";"');
    
    // Increment: i++ | i--
    this.consume(TokenType.IDENTIFIER, 'Expected variable in increment');
    if (this.check(TokenType.INCREMENT)) {
      this.advance();
    } else if (this.check(TokenType.DECREMENT)) {
      this.advance();
    }
    
    this.consume(TokenType.RPAREN, 'Expected ")"');
    this.consume(TokenType.LBRACE, 'Expected "{"');
    const body = this.parseBlock();
    this.consume(TokenType.RBRACE, 'Expected "}"');

    // Adjust end value based on comparison operator
    // for (let i = 0; i < 5; i++) means 0,1,2,3,4 (5 iterations starting at 0)
    // for (let i = 1; i <= 5; i++) means 1,2,3,4,5 (5 iterations starting at 1)
    const end = isLessThanEqual ? endValue : endValue - 1;

    return { type: 'ForLoop', variable, start, end, body };
  }

  private parseIfStatement(): IfStatementNode {
    this.consume(TokenType.IF, 'Expected "if"');
    const condition = this.parseCondition();
    this.consume(TokenType.LBRACE, 'Expected "{"');
    const thenBranch = this.parseBlock();
    this.consume(TokenType.RBRACE, 'Expected "}"');
    
    let elseBranch: BlockNode | undefined;
    if (this.check(TokenType.ELSE)) {
      this.advance(); // consume 'else'
      this.consume(TokenType.LBRACE, 'Expected "{"');
      elseBranch = this.parseBlock();
      this.consume(TokenType.RBRACE, 'Expected "}"');
    }

    return { type: 'IfStatement', condition, thenBranch, elseBranch };
  }

  private parseWhileLoop(): WhileLoopNode {
    this.consume(TokenType.WHILE, 'Expected "while"');
    const condition = this.parseCondition();
    this.consume(TokenType.LBRACE, 'Expected "{"');
    const body = this.parseBlock();
    this.consume(TokenType.RBRACE, 'Expected "}"');

    return { type: 'WhileLoop', condition, body };
  }

  /**
   * Parse function definition - supports both syntaxes:
   * 
   * TypeScript-like: function name() { ... }
   * Simple:          func name() { ... }
   */
  private parseFunctionDef(): FunctionDefNode {
    // Accept both 'func' and 'function'
    if (this.check(TokenType.FUNC)) {
      this.advance();
    } else if (this.check(TokenType.FUNCTION)) {
      this.advance();
    }
    
    const name = this.consume(TokenType.IDENTIFIER, 'Expected function name').value;
    
    // Parameters: (param1, param2, ...)
    const parameters: string[] = [];
    if (this.check(TokenType.LPAREN)) {
      this.advance();
      while (!this.check(TokenType.RPAREN) && !this.isAtEnd()) {
        if (this.check(TokenType.IDENTIFIER)) {
          parameters.push(this.advance().value);
        }
        if (this.check(TokenType.COMMA)) {
          this.advance();
        } else if (!this.check(TokenType.RPAREN)) {
          this.advance();
        }
      }
      if (this.check(TokenType.RPAREN)) this.advance();
    }
    
    this.consume(TokenType.LBRACE, 'Expected "{"');
    const body = this.parseBlock();
    this.consume(TokenType.RBRACE, 'Expected "}"');

    return { type: 'FunctionDef', name, parameters, body };
  }

  private parseCondition(): ConditionNode {
    let negated = false;
    
    // Check for negation
    if (this.check(TokenType.NOT)) {
      this.advance();
      negated = true;
    }
    
    // Parse condition identifier
    const conditionName = this.consume(TokenType.IDENTIFIER, 'Expected condition').value.toLowerCase();
    
    // Map to ConditionType
    const conditionType = this.mapConditionType(conditionName);
    
    return { type: 'Condition', conditionType, negated };
  }

  private mapConditionType(name: string): ConditionType {
    const mapping: Record<string, ConditionType> = {
      'crystalahead': 'crystalAhead',
      'crystal_ahead': 'crystalAhead',
      'keyahead': 'keyAhead',
      'key_ahead': 'keyAhead',
      'atportal': 'atPortal',
      'at_portal': 'atPortal',
      'haskey': 'hasKey',
      'has_key': 'hasKey',
      'switchon': 'switchOn',
      'switch_on': 'switchOn'
    };
    return mapping[name] || 'crystalAhead';
  }

  private parseBlock(): BlockNode {
    const statements: ASTNode[] = [];
    
    while (!this.check(TokenType.RBRACE) && !this.check(TokenType.ELSE) && !this.isAtEnd()) {
      const stmt = this.parseStatement();
      if (stmt) statements.push(stmt);
    }
    
    return { type: 'Block', statements };
  }

  private parseFunctionCall(): FunctionCallNode {
    const name = this.advance().value;
    
    // Optional parentheses
    if (this.check(TokenType.LPAREN)) {
      this.advance(); // (
      // Skip arguments for now
      while (!this.check(TokenType.RPAREN) && !this.isAtEnd()) {
        this.advance();
      }
      if (this.check(TokenType.RPAREN)) this.advance(); // )
    }
    
    // Optional semicolon
    if (this.check(TokenType.SEMICOLON)) this.advance();
    
    return { type: 'FunctionCall', name, arguments: [] };
  }

  // === Helpers ===

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    throw new Error(`Parse error at line ${this.peek().line}: ${message}, got ${this.peek().type}`);
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }
}

// ============================================================================
// INTERPRETER
// ============================================================================

export class TemplateInterpreter {
  private context!: ExecutionContext;
  private pathCoords: Coord[] = [];
  private pathSet: Set<string> = new Set();
  private items: Array<{ type: string; position: Coord }> = [];
  private actions: ExecutionAction[] = [];
  private loopIterations: number = 0;
  private totalMoves: number = 0;
  private totalCollects: number = 0;

  /**
   * Execute a template with resolved parameters
   */
  execute(template: CodeTemplate, params: Record<string, number>): ExecutionTrace {
    // Reset state
    this.context = createInitialContext();
    this.pathCoords = [[...this.context.position] as Coord];
    this.pathSet = new Set([coordToKey(this.context.position)]);
    this.items = [];
    this.actions = [];
    this.loopIterations = 0;
    this.totalMoves = 0;
    this.totalCollects = 0;

    // Resolve parameters in code
    let code = template.code;
    for (const [name, value] of Object.entries(params)) {
      code = code.replace(new RegExp(`\\$${name}`, 'gi'), String(value));
    }

    // Parse and execute
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    
    this.executeBlock(ast);

    const startPos = this.pathCoords[0];
    const endPos = this.context.position;

    return {
      pathCoords: this.pathCoords,
      items: this.items,
      actions: this.actions,
      startPosition: startPos,
      startDirection: 1, // East default
      endPosition: endPos,
      endDirection: this.context.direction,
      totalMoves: this.totalMoves,
      totalCollects: this.totalCollects,
      loopIterations: this.loopIterations
    };
  }

  private executeBlock(block: BlockNode): void {
    for (const stmt of block.statements) {
      this.executeNode(stmt);
    }
  }

  private executeNode(node: ASTNode): void {
    switch (node.type) {
      case 'Block':
        this.executeBlock(node);
        break;
      case 'ForLoop':
        this.executeForLoop(node);
        break;
      case 'IfStatement':
        this.executeIfStatement(node);
        break;
      case 'WhileLoop':
        this.executeWhileLoop(node);
        break;
      case 'FunctionDef':
        this.executeFunctionDef(node);
        break;
      case 'FunctionCall':
        this.executeFunctionCall(node);
        break;
    }
  }

  private executeForLoop(node: ForLoopNode): void {
    for (let i = node.start; i <= node.end; i++) {
      this.context.variables.set(node.variable, i);
      this.loopIterations++;
      this.executeBlock(node.body);
    }
    this.context.variables.delete(node.variable);
  }

  private executeIfStatement(node: IfStatementNode): void {
    const conditionResult = this.evaluateCondition(node.condition);
    
    if (conditionResult) {
      this.executeBlock(node.thenBranch);
    } else if (node.elseBranch) {
      this.executeBlock(node.elseBranch);
    }
  }

  private executeWhileLoop(node: WhileLoopNode): void {
    const MAX_ITERATIONS = 1000; // Safety limit
    let iterations = 0;
    
    while (this.evaluateCondition(node.condition) && iterations < MAX_ITERATIONS) {
      this.loopIterations++;
      iterations++;
      this.executeBlock(node.body);
    }
  }

  private executeFunctionDef(node: FunctionDefNode): void {
    // Store function definition in context for later calls
    (this.context as any).functions = (this.context as any).functions || new Map();
    (this.context as any).functions.set(node.name.toLowerCase(), node);
  }

  /**
   * Evaluate a condition based on current state
   * For solution-driven generation, we assume conditions that would make paths possible
   */
  private evaluateCondition(condition: ConditionNode): boolean {
    let result: boolean;
    
    switch (condition.conditionType) {
      case 'crystalAhead':
        // Check if there's a crystal at the position ahead
        const aheadPos = moveForward(this.context.position, this.context.direction);
        result = this.items.some(item => 
          item.type === 'crystal' && 
          item.position[0] === aheadPos[0] && 
          item.position[2] === aheadPos[2]
        );
        break;
        
      case 'keyAhead':
        const keyAheadPos = moveForward(this.context.position, this.context.direction);
        result = this.items.some(item => 
          item.type === 'key' && 
          item.position[0] === keyAheadPos[0] && 
          item.position[2] === keyAheadPos[2]
        );
        break;
        
      case 'atPortal':
        // For generation, we'll place a portal when this becomes true
        result = false; // Will be placed at end of WHILE loop
        break;
        
      case 'hasKey':
        result = this.context.inventory.keys > 0;
        break;
        
      case 'switchOn':
        // For generation, assume switch is on if we've toggled it
        result = (this.context as any).switchOn || false;
        break;
        
      default:
        result = false;
    }
    
    return condition.negated ? !result : result;
  }

  private executeFunctionCall(node: FunctionCallNode): void {
    const name = node.name.toLowerCase();
    
    switch (name) {
      case 'moveforward':
      case 'move_forward':
        this.doMoveForward();
        break;
      case 'turnleft':
      case 'turn_left':
        this.doTurnLeft();
        break;
      case 'turnright':
      case 'turn_right':
        this.doTurnRight();
        break;
      case 'pickcrystal':
      case 'pick_crystal':
      case 'collectcrystal':
      case 'collect':
        this.doCollect('crystal');
        break;
      case 'pickkey':
      case 'pick_key':
        this.doCollect('key');
        break;
      case 'toggleswitch':
      case 'toggle_switch':
        this.doInteract('switch');
        break;
      default:
        // Check for user-defined functions
        this.callUserFunction(name);
        break;
    }
  }

  private callUserFunction(name: string): void {
    const functions = (this.context as any).functions as Map<string, FunctionDefNode> | undefined;
    if (!functions) return;
    
    const funcDef = functions.get(name);
    if (funcDef) {
      this.executeBlock(funcDef.body);
    }
  }

  // === Actions ===

  private doMoveForward(): void {
    this.context.position = moveForward(this.context.position, this.context.direction);
    
    const key = coordToKey(this.context.position);
    if (!this.pathSet.has(key)) {
      this.pathCoords.push([...this.context.position] as Coord);
      this.pathSet.add(key);
    }
    
    this.actions.push({
      type: 'move',
      position: [...this.context.position] as Coord,
      direction: this.context.direction
    });
    this.totalMoves++;
  }

  private doTurnLeft(): void {
    this.context.direction = turnLeft(this.context.direction);
    this.actions.push({
      type: 'turn_left',
      position: [...this.context.position] as Coord,
      direction: this.context.direction
    });
  }

  private doTurnRight(): void {
    this.context.direction = turnRight(this.context.direction);
    this.actions.push({
      type: 'turn_right',
      position: [...this.context.position] as Coord,
      direction: this.context.direction
    });
  }

  private doCollect(itemType: string): void {
    this.items.push({
      type: itemType,
      position: [...this.context.position] as Coord
    });
    this.actions.push({
      type: 'collect',
      position: [...this.context.position] as Coord,
      direction: this.context.direction,
      item: itemType
    });
    this.totalCollects++;
    
    if (itemType === 'crystal') {
      this.context.inventory.crystals++;
    } else if (itemType === 'key') {
      this.context.inventory.keys++;
    }
  }

  private doInteract(itemType: string): void {
    this.items.push({
      type: itemType,
      position: [...this.context.position] as Coord
    });
    this.actions.push({
      type: 'interact',
      position: [...this.context.position] as Coord,
      direction: this.context.direction,
      item: itemType
    });
  }
}
