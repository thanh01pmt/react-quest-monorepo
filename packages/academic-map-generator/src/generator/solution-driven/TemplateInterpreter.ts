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
  BlockAction,
  StructuredSolution,
  ASTNode,
  BlockNode,
  ForLoopNode,
  FunctionCallNode,
  IfStatementNode,
  WhileLoopNode,
  FunctionDefNode,
  VariableDeclNode,
  AssignmentNode,
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
import { SeededRandom } from './utils';
import { getRandomPattern, MicroPattern, ActionType } from '@repo/shared-templates';

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
  
  VAR = 'VAR',
  
  // Literals
  NUMBER = 'NUMBER',
  IDENTIFIER = 'IDENTIFIER',
  STRING = 'STRING',
  
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
  STAR = 'STAR',           // *
  SLASH = 'SLASH',         // /
  MODULO = 'MODULO',       // %
  EQUAL_EQUAL = 'EQUAL_EQUAL', // ==
  
  AND = 'AND',
  OR = 'OR',
  
  // Compatibility aliases
  LESS = 'LT',
  GREATER = 'GT',
  
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
  'not': TokenType.NOT,
  'var': TokenType.VAR,
  'and': TokenType.AND,
  'or': TokenType.OR
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
          if (this.input[this.position + 1] === '=') {
             tokens.push(this.makeDoubleToken(TokenType.EQUAL_EQUAL, '=='));
          } else {
             tokens.push(this.makeToken(TokenType.ASSIGN, '='));
          }
          break;
        case '<':
          tokens.push(this.makeToken(TokenType.LESS, '<'));
          break;
        case '>':
          tokens.push(this.makeToken(TokenType.GREATER, '>'));
          break;
        case '+':
          tokens.push(this.makeToken(TokenType.PLUS, '+'));
          break;
        case '-':
          tokens.push(this.makeToken(TokenType.MINUS, '-'));
          break;
        case '*':
          tokens.push(this.makeToken(TokenType.STAR, '*'));
          break;
        case '/':
          tokens.push(this.makeToken(TokenType.SLASH, '/'));
          break;
        case '%':
          tokens.push(this.makeToken(TokenType.MODULO, '%'));
          break;
        case '!':
          tokens.push(this.makeToken(TokenType.NOT, '!'));
          break;
        case "'":
        case '"':
          tokens.push(this.readString(char));
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

  private readString(quoteType: string): Token {
    this.position++; // Skip opening quote
    this.column++;
    
    let value = '';
    while (this.position < this.input.length && this.input[this.position] !== quoteType) {
      const char = this.input[this.position];
      value += char;
      this.position++;
      this.column++;
      if (char === '\n') {
        this.line++;
        this.column = 1;
      }
    }
    
    if (this.position >= this.input.length) {
      throw new Error(`Unterminated string at line ${this.line}`);
    }
    
    this.position++; // Skip closing quote
    this.column++;
    
    return {
      type: TokenType.STRING,
      value,
      line: this.line,
      column: this.column
    };
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
    if (this.check(TokenType.FUNC) || this.check(TokenType.FUNCTION)) {
      return this.parseFunctionDef();
    }
    if (this.check(TokenType.LET) || this.check(TokenType.CONST) || this.check(TokenType.VAR)) {
      return this.parseVariableDecl();
    }
    if (this.check(TokenType.IDENTIFIER)) {
      // Could be function call OR assignment
      // Lookahead
      const next = this.lookahead(1);
      if (next && next.type === TokenType.ASSIGN) {
         return this.parseAssignment();
      }
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
    const start = this.parseExpression(); // Allow expression
    this.consume(TokenType.TO, 'Expected "to"');
    const end = this.parseExpression();   // Allow expression
    this.consume(TokenType.LBRACE, 'Expected "{"');
    const body = this.parseBlock();
    this.consume(TokenType.RBRACE, 'Expected "}"');

    return { type: 'ForLoop', variable, start, end, body };
  }

  /**
   * Parse TypeScript-style FOR loop:
   * for (let i = 1; i <= N; i++) { ... }
   * for (let i = 0; i < N; i++) { ... }
   * for (let i = 0; i < CRYSTAL_NUM; i++) { ... }  // VARIABLE SUPPORT
   */
  private parseTypeScriptForLoop(): ForLoopNode {
    this.consume(TokenType.LPAREN, 'Expected "("');
    
    // Initialization: let i = 1 | const i = 1 | var i = 1 | i = 1
    if (this.check(TokenType.LET) || this.check(TokenType.CONST) || this.check(TokenType.VAR)) {
      this.advance(); // skip let/const/var
    }
    const variable = this.consume(TokenType.IDENTIFIER, 'Expected variable name').value;
    this.consume(TokenType.ASSIGN, 'Expected "="');
    const start = this.parseExpression(); // Allow expressions
    this.consume(TokenType.SEMICOLON, 'Expected ";"');
    
    // Condition: i <= N | i < N | i < VARIABLE
    this.consume(TokenType.IDENTIFIER, 'Expected variable in condition'); // Skip loop variable
    let isLessThanEqual = true;
    if (this.check(TokenType.LTE)) {
      this.advance();
    } else if (this.check(TokenType.LT)) {
      this.advance();
      isLessThanEqual = false;
    } else {
      throw new Error('Expected "<=" or "<" in for loop condition');
    }
    const endExpr = this.parseExpression(); // Allow expressions (variables, math, etc.)
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

    // Store isLessThanEqual flag for Interpreter to adjust end value
    // We wrap endExpr in a special node or pass metadata
    // Simplest: Create an adjusted expression: if i < N, end = N - 1
    // But we can't do math on AST nodes here. Let's store metadata.
    // Hack: Store as { type: 'ForLoopEnd', expr: endExpr, isLessThan: !isLessThanEqual }
    const end = isLessThanEqual 
      ? endExpr 
      : { type: 'BinaryOp', operator: TokenType.MINUS, left: endExpr, right: { type: 'Literal', value: 1 } };

    return { type: 'ForLoop', variable, start, end, body };
  }

  private parseIfStatement(): IfStatementNode {
    this.consume(TokenType.IF, 'Expected "if"');
    
    let condition: any;

    // Support ( condition )
    if (this.check(TokenType.LPAREN)) {
      this.advance();
      condition = this.parseExpression(); // Parse general expression
      this.consume(TokenType.RPAREN, 'Expected ")" after condition');
    } else {
       // Legacy condition support
       condition = this.parseCondition(); 
    }

    this.consume(TokenType.LBRACE, 'Expected "{"');
    const thenBranch = this.parseBlock();
    this.consume(TokenType.RBRACE, 'Expected "}"');
    
    let elseBranch: BlockNode | undefined;
    if (this.check(TokenType.ELSE)) {
      this.advance(); // consume 'else'
      
      // Handle 'else if' recursively
      if (this.check(TokenType.IF)) {
         // Create a synthetic block for the else-if
         const ifStmt = this.parseIfStatement();
         elseBranch = { type: 'Block', statements: [ifStmt] };
      } else {
         this.consume(TokenType.LBRACE, 'Expected "{"');
         elseBranch = this.parseBlock();
         this.consume(TokenType.RBRACE, 'Expected "}"');
      }
    }

    return { type: 'IfStatement', condition, thenBranch, elseBranch };
  }

  private parseWhileLoop(): WhileLoopNode {
    this.consume(TokenType.WHILE, 'Expected "while"');
    
    let condition: any;

    // Support ( condition )
    if (this.check(TokenType.LPAREN)) {
      this.advance();
      condition = this.parseExpression();
      this.consume(TokenType.RPAREN, 'Expected ")" after condition');
    } else {
        condition = this.parseCondition();
    }

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

  private parseVariableDecl(): ASTNode {
    // Consume var/let/const
    this.advance(); 
    
    const nameToken = this.consume(TokenType.IDENTIFIER, 'Expected variable name');
    this.consume(TokenType.ASSIGN, 'Expected =');
    
    const value = this.parseExpression();
    this.consume(TokenType.SEMICOLON, 'Expected ; after variable declaration');
    
    return {
      type: 'VariableDecl',
      name: nameToken.value,
      value: value
    } as any;
  }

  private parseAssignment(): ASTNode {
    const nameToken = this.consume(TokenType.IDENTIFIER, 'Expected variable name');
    this.consume(TokenType.ASSIGN, 'Expected =');
    const value = this.parseExpression();
    if (this.check(TokenType.SEMICOLON)) this.advance();
    
    return {
      type: 'Assignment',
      name: nameToken.value,
      value: value
    } as any;
  }

  private parseExpression(): any {
      return this.parseEquality();
  }

  private parseEquality(): any {
      let left = this.parseComparison();

      while (this.check(TokenType.EQUAL_EQUAL) || this.check(TokenType.NOT)) { // TODO: Add NEQ if supported, leveraging NOT for now if separate token
          // Actually NOT is unary. EQUAL_EQUAL is binary.
          if (this.check(TokenType.EQUAL_EQUAL)) {
             const operator = this.advance().type;
             const right = this.parseComparison();
             left = { type: 'BinaryOp', operator, left, right };
          } else {
             break; 
          }
      }
      return left;
  }

  private parseComparison(): any {
      let left = this.parseAdditive();

      while (this.check(TokenType.GREATER) || this.check(TokenType.GTE) || this.check(TokenType.LESS) || this.check(TokenType.LTE)) {
          const operator = this.advance().type;
          const right = this.parseAdditive();
          left = { type: 'BinaryOp', operator, left, right };
      }
      return left;
  }

  private parseAdditive(): any {
      let left = this.parseTerm();

      while (this.check(TokenType.PLUS) || this.check(TokenType.MINUS)) {
          const operator = this.advance().type;
          const right = this.parseTerm();
          left = { type: 'BinaryOp', operator, left, right };
      }
      return left;
  }

  private parseTerm(): any {
      let left = this.parseFactor();

      while (this.check(TokenType.STAR) || this.check(TokenType.SLASH) || this.check(TokenType.MODULO)) {
          const operator = this.advance().type;
          const right = this.parseFactor();
          left = { type: 'BinaryOp', operator, left, right };
      }
      return left;
  }

  private parseFactor(): any {
      if (this.check(TokenType.NUMBER)) {
          return { type: 'Literal', value: parseFloat(this.advance().value) };
      }
      if (this.check(TokenType.IDENTIFIER)) {
          const token = this.peek();
          const next = this.lookahead(1);
          if (next && next.type === TokenType.LPAREN) {
               return this.parseFunctionCallExpression();
          }
          this.advance();
          return { type: 'Identifier', name: token.value };
      }
      if (this.check(TokenType.STRING)) {
          return { type: 'Literal', value: this.advance().value };
      }
      if (this.check(TokenType.LPAREN)) {
          this.advance();
          const expr = this.parseExpression();
          this.consume(TokenType.RPAREN, 'Expected )');
          return expr;
      }
      throw new Error(`Unexpected token in expression: ${this.peek().value}`);
  }

  private parseFunctionCallExpression(): any {
      const name = this.consume(TokenType.IDENTIFIER, 'Expected function name').value;
      this.consume(TokenType.LPAREN, 'Expected (');
      const args: any[] = [];
      if (!this.check(TokenType.RPAREN)) {
          do {
              args.push(this.parseExpression());
          } while (this.match(','));
      }
      this.consume(TokenType.RPAREN, 'Expected )');
      return { type: 'FunctionCallExpr', name, args };
  }

  private match(char: string): boolean {
      if (char === ',' && this.check(TokenType.COMMA)) {
          this.advance(); 
          return true; 
      }
      return false;
  }

  private lookahead(distance: number): Token | null {
      if (this.current + distance >= this.tokens.length) return null;
      return this.tokens[this.current + distance];
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
    
    // Parse optional function call with arguments: isItemPresent('crystal')
    let argument: string | undefined;
    if (this.check(TokenType.LPAREN)) {
        this.advance(); // consume (
        
        // Parse string argument if present (e.g., 'crystal', 'on')
        if (!this.check(TokenType.RPAREN)) {
          if (this.check(TokenType.STRING)) {
            argument = this.consume(TokenType.STRING, 'Expected string argument').value.toLowerCase();
          } else {
             // Fallback for old style identifiers if any (though strings are preferred now)
             // Or allow skipping over complex args if we don't support them
             while (!this.check(TokenType.RPAREN) && !this.isAtEnd()) {
                this.advance();
             }
          }
        }
        
        this.consume(TokenType.RPAREN, 'Expected ")" after condition function call');
    }
    
    // Map to ConditionType
    const conditionType = this.mapConditionType(conditionName);
    
    return { type: 'Condition', conditionType, negated, argument };
  }

  private mapConditionType(name: string): ConditionType {
    const mapping: Record<string, ConditionType> = {
      // Legacy mappings (deprecated, for backward compatibility)
      'isoncrystal': 'isOnCrystal',
      'is_on_crystal': 'isOnCrystal',
      'isonswitch': 'isOnSwitch',
      'is_on_switch': 'isOnSwitch',
      'haskey': 'hasKey',
      'has_key': 'hasKey',
      
      // Standard Blockly API
      'isitempresent': 'isItemPresent',
      'is_item_present': 'isItemPresent',
      'isswitchstate': 'isSwitchState',
      'is_switch_state': 'isSwitchState',
      'ispathforward': 'isPathForward',
      'is_path_forward': 'isPathForward',
      'ispathleft': 'isPathLeft',
      'is_path_left': 'isPathLeft',
      'ispathright': 'isPathRight',
      'is_path_right': 'isPathRight',
      'notdone': 'notDone',
      'not_done': 'notDone',
      'atfinish': 'notDone', // atFinish is negated notDone, handled in evaluator
    };
    return mapping[name] || 'isItemPresent'; // Default to isItemPresent for unknown
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
    // Optional parentheses
    const args: any[] = [];
    if (this.check(TokenType.LPAREN)) {
      this.advance(); // (
      if (!this.check(TokenType.RPAREN)) {
        do {
          args.push(this.parseExpression());
        } while (this.match(','));
      }
      this.consume(TokenType.RPAREN, 'Expected )');
    }
    
    // Optional semicolon
    if (this.check(TokenType.SEMICOLON)) this.advance();
    
    return { type: 'FunctionCall', name, arguments: args };
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
  private movementSequence: Coord[] = []; // Full sequential path (with duplicates)
  private items: Array<{ type: string; position: Coord }> = [];
  private actions: ExecutionAction[] = [];
  private loopIterations: number = 0;
  private totalMoves: number = 0;
  private totalCollects: number = 0;
  private rng?: SeededRandom;
  private initialDirection: Direction = 1; // Capture starting direction

  /**
   * Execute a template with resolved parameters
   */
  execute(template: CodeTemplate, params: Record<string, number>, rng?: SeededRandom): ExecutionTrace {
    // Reset state
    this.context = createInitialContext();
    this.rng = rng;
    this.pathCoords = [[...this.context.position] as Coord];
    this.pathSet = new Set([coordToKey(this.context.position)]);
    this.movementSequence = [[...this.context.position] as Coord]; // Start with initial position
    this.items = [];
    this.actions = [];
    this.loopIterations = 0;
    this.totalMoves = 0;
    this.totalCollects = 0;
    
    // Capture initial direction before any actions
    this.initialDirection = this.context.direction;

    // Resolve parameters in code
    let code = template.code;
    for (const [name, value] of Object.entries(params)) {
      // Replace $NAME (legacy) and NAME (if _NAME_ or similar)
      // Use word boundary or specific patterns to avoid partial replacement if name is short
      // But _NAME_ is distinct enough.
      const pattern = name.startsWith('_') ? name : `\\$${name}`;
      code = code.replace(new RegExp(pattern, 'gi'), String(value));
    }

    // Parse and execute
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    
    try {
      this.executeBlock(ast);
    } catch (error) {
       console.error('[TemplateInterpreter] Runtime Error:', error);
       throw error;
    }

    const startPos = this.pathCoords[0];
    const endPos = this.context.position;

    return {
      pathCoords: this.pathCoords,
      movementSequence: this.movementSequence, // Full sequential path for visualization
      items: this.items,
      actions: this.actions,
      startPosition: startPos,
      startDirection: this.initialDirection, // Use captured initial direction
      endPosition: endPos,
      endDirection: this.context.direction,
      totalMoves: this.totalMoves,
      totalCollects: this.totalCollects,
      loopIterations: this.loopIterations
    };
  }

  /**
   * Transpile template code directly to StructuredSolution (Blocks)
   * This preserves loops and functions from the source code.
   */
  transpile(template: CodeTemplate, params: Record<string, number>): StructuredSolution {
    // Resolve parameters in code
    let code = template.code;
    for (const [name, value] of Object.entries(params)) {
      const pattern = name.startsWith('_') ? name : `\\$${name}`;
      code = code.replace(new RegExp(pattern, 'gi'), String(value));
    }

    // Parse
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    // Context for variable lookup (global params)
    const context = new Map<string, number>();
    Object.entries(params).forEach(([k, v]) => context.set(k, v));

    // Extract function definitions first (2-pass approach)
    const procedures: Record<string, BlockAction[]> = {};
    const mainStatements: any[] = [];
    
    for (const stmt of ast.statements) {
      if (stmt.type === 'FunctionDef') {
        // Extract function definition into procedures
        procedures[stmt.name] = this.convertBlockToActions(stmt.body, context);
      } else {
        mainStatements.push(stmt);
      }
    }

    // Convert remaining statements to main blocks
    const main = this.convertBlockToActions({ type: 'Block', statements: mainStatements } as BlockNode, context);

    return {
      main,
      procedures
    };
  }

  private convertBlockToActions(block: BlockNode, context: Map<string, number>): BlockAction[] {
    const actions: BlockAction[] = [];
    for (const stmt of block.statements) {
      if (stmt.type === 'Block') {
        actions.push(...this.convertBlockToActions(stmt, context));
      } else {
        const action = this.convertNodeToAction(stmt, context);
        if (action) actions.push(action);
      }
    }
    return actions;
  }

  private convertNodeToAction(node: ASTNode, context: Map<string, number>): BlockAction | null {
    switch (node.type) {
      case 'FunctionCall':
        // Map standard calls to maze blocks
        switch (node.name) {
          case 'moveForward': return { type: 'maze_moveForward' };
          case 'turnLeft': return { type: 'maze_turn', direction: 'turnLeft' };
          case 'turnRight': return { type: 'maze_turn', direction: 'turnRight' };
          case 'collectItem': return { type: 'maze_collect' };
          case 'toggleSwitch': return { type: 'maze_toggle_switch' };
          case 'jump': return { type: 'maze_jump' };
          // Legacy/Fallback aliases
          case 'turn_left': return { type: 'maze_turn', direction: 'turnLeft' };
          case 'turn_right': return { type: 'maze_turn', direction: 'turnRight' };
          // Custom procedure call - map to Blockly procedure call block
          default: return { type: 'procedures_callnoreturn', name: node.name };
        }
      
      case 'ForLoop':
        // evaluate iterations
        // Loop structure: for (var i = start; i < end; i++)
        // We need to evaluate start and end.
        try {
           const startVal = this.evaluateSimpleExpression(node.start, context);
           const endVal = this.evaluateSimpleExpression(node.end, context);
           // Assume < comparison and ++ step for now as standard template pattern
           // iterations = end - start
           // If loop is <=, it would be end - start + 1. 
           // But parser stores expressions.
           // Heuristic: templates usually use standard loops.
           // Let's assume (endVal - startVal).
           // If the loop condition was LTE (<=), we might need to know that from AST. 
           // But AST for ForLoop in types.ts is generic: start: any, end: any.
           // Looking at parseTypeScriptForLoop: it stores start/end expressions.
           // And TemplateInterpreter.executeForLoop line 837 uses: start <= end ? 1 : -1.
           // Actually executeForLoop logic is: for (let i = start; i <= end; i++)
           // WARNING: The PARSER logic for `i < N` vs `i <= N`...
           // In parseTypeScriptForLoop (line 396): it consumes LT or LTE.
           // But the AST `ForLoopNode` definition *doesn't seem to store the operator*!
           // Checking types.ts:
           // export interface ForLoopNode { type: 'ForLoop', variable: string, start: any, end: any, body: BlockNode; }
           // It seems the parser logic (lines 403-407 of TemplateInterpreter.ts) MIGHT adjust `end` value?
           // Actually no, parseTypeScriptForLoop (viewed earlier) just calls parseExpression for endExpr.
           // Wait, if AST doesn't store operator, `executeForLoop` assumes inclusive (`<=`)?
           // Let's check `executeForLoop` (line 846): `for (let i = start; i <= end; i++)`.
           // So `TemplateInterpreter` treats loops as Inclusive!
           // But typical update `i < N` implies exclusive.
           // If the parser parsed `i < N`, did it subtract 1?
           // Let's check Parser `parseTypeScriptForLoop` again.
           
           // Assuming executeForLoop is the source of truth, it iterates start to end INCLUSIVE.
           // So count = Math.abs(end - start) + 1.
           const iterations = Math.abs(endVal - startVal) + 1;
           
           return {
             type: 'maze_repeat',  // Use maze_repeat to match quest-player block definition
             times: iterations,
             do: this.convertBlockToActions(node.body, context)
           };
        } catch (e) {
           console.warn('Failed to evaluate loop bounds in transpile', e);
           // Fallback: Just return unrolled actions? OR a dummy loop
           return {
             type: 'maze_repeat',
             times: 1, // Error placeholder
             do: this.convertBlockToActions(node.body, context)
           };
        }

      case 'IfStatement':
        // Basic Condition mapping
        // We only support 'isOnCrystal', 'isOnSwitch', 'hasKey'
        // AST ConditionNode: { conditionType: 'isOnCrystal', negated: boolean }
        const condType = node.condition.conditionType; // isOnCrystal...
        const negated = node.condition.negated;
        
        // Map to maze_if
        let blockType = 'maze_if';
        let conditionStr = 'isPathForward'; // Default
        
        if (condType === 'isOnCrystal') conditionStr = 'isPathForward'; // Wait, maze blocks use specific conds?
        // Actually, maze blocks usually have: isPathForward, isPathLeft, isPathRight.
        // isOnCrystal is NOT a standard maze block condition usually?
        // Standard Maze: 'isPathForward', 'isPathLeft', 'isPathRight'.
        // If template uses 'isOnCrystal', maybe we map it to 'isPathForward'? 
        // Or maybe this is a limitation of standard Blockly Maze.
        // But for 'Basic' usage, let's map to 'isPathForward' as placeholder if strict mapping fails.
        
        return {
           type: node.elseBranch ? 'maze_ifElse' : 'maze_if',
           mutation: { name: conditionStr }, // This might need refinement based on exact block definitions
           do: this.convertBlockToActions(node.thenBranch, context),
           // properties?
        };

      default:
        return null;
    }
  }

  private evaluateSimpleExpression(expr: any, context: Map<string, number>): number {
    // Handle primitive types (already evaluated)
    if (typeof expr === 'number') return expr;
    if (typeof expr === 'string') return context.get(expr) ?? 0; // Variable lookup by name
    
    // Handle AST node types
    if (expr && typeof expr === 'object') {
      if (expr.type === 'Literal') {
        return typeof expr.value === 'number' ? expr.value : 0;
      }
      if (expr.type === 'Identifier') {
        return context.get(expr.name) ?? 0;
      }
      if (expr.type === 'BinaryOp') {
        const left = this.evaluateSimpleExpression(expr.left, context);
        const right = this.evaluateSimpleExpression(expr.right, context);
        switch(expr.operator) {
          case TokenType.PLUS: return left + right;
          case TokenType.MINUS: return left - right;
          case TokenType.STAR: return left * right;
          case TokenType.SLASH: return Math.floor(left / right);
        }
      }
    }
    return 0;
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
      case 'VariableDecl':
        this.executeVariableDecl(node);
        break;
      case 'Assignment':
        this.executeAssignment(node);
        break;
    }
  }

  private executeForLoop(node: ForLoopNode): void {
    const start = this.evaluateExpression(node.start);
    const end = this.evaluateExpression(node.end);
    
    // Determine step direction
    const step = start <= end ? 1 : -1;
    
    // Safety break
    if (Math.abs(end - start) > 1000) {
        console.warn('[Interpreter] Loop range too large, capping at 1000 iterations');
        return;
    }

    if (step > 0) {
      for (let i = start; i <= end; i++) {
        this.context.variables.set(node.variable, i);
        this.loopIterations++;
        this.executeBlock(node.body);
      }
    } else {
      for (let i = start; i >= end; i--) {
        this.context.variables.set(node.variable, i);
        this.loopIterations++;
        this.executeBlock(node.body);
      }
    }
    this.context.variables.delete(node.variable);
  }

  private executeIfStatement(node: IfStatementNode): void {
    let conditionResult: boolean;
    
    // Check if it's a legacy ConditionNode
    if (node.condition.type === 'Condition') {
        conditionResult = this.evaluateCondition(node.condition);
    } else {
        // Evaluate as expression (truthy/falsy)
        const val = this.evaluateExpression(node.condition);
        conditionResult = !!val;
    }
    
    if (conditionResult) {
      this.executeBlock(node.thenBranch);
    } else if (node.elseBranch) {
      this.executeBlock(node.elseBranch);
    }
  }

  private executeWhileLoop(node: WhileLoopNode): void {
    const MAX_ITERATIONS = 1000; // Safety limit
    let iterations = 0;
    
    while (true) {
       let conditionResult: boolean;
       if (node.condition.type === 'Condition') {
          conditionResult = this.evaluateCondition(node.condition);
       } else {
          conditionResult = !!this.evaluateExpression(node.condition);
       }

       if (!conditionResult || iterations >= MAX_ITERATIONS) break;
      this.loopIterations++;
      iterations++;
      this.executeBlock(node.body);
    }
  }

  private executeVariableDecl(node: VariableDeclNode): void {
    const value = this.evaluateExpression(node.value);
    this.context.variables.set(node.name, value);
  }

  private executeAssignment(node: AssignmentNode): void {
    const value = this.evaluateExpression(node.value);
    this.context.variables.set(node.name, value);
  }

  private evaluateExpression(node: any): any {
    if (node.type === 'Literal') {
      return node.value;
    }
    if (node.type === 'Identifier') {
      // Lookup variable
      if (this.context.variables.has(node.name)) {
        return this.context.variables.get(node.name);
      }
      // Check overrides/params
      // In JS, variables not in scope are ReferenceError. 
      // But for Template, maybe params?
      // Params are already substituted in code, so they appear as numbers.
      // But if we missed any, or use globals?
      console.warn(`[Interpreter] Variable '${node.name}' not found.`);
      return 0; 
    }
    if (node.type === 'BinaryOp') {
      const left = this.evaluateExpression(node.left);
      const right = this.evaluateExpression(node.right);
      switch (node.operator) {
        case TokenType.PLUS: return left + right;
        case TokenType.MINUS: return left - right;
        case TokenType.STAR: return left * right;
        case TokenType.SLASH: return Math.floor(left / right); // Integer division usually better for maps
        case TokenType.MODULO: return left % right;
        // Comparisons
        case TokenType.EQUAL_EQUAL: return left === right ? true : false;
        case TokenType.GREATER: return left > right ? true : false;
        case TokenType.GTE: return left >= right ? true : false;
        case TokenType.LESS: return left < right ? true : false;
        case TokenType.LTE: return left <= right ? true : false;
        default: return 0;
      }
    }
    if (node.type === 'FunctionCallExpr') {
       return this.evaluateFunctionCallExpr(node);
    }
    return 0;
  }

  private evaluateFunctionCallExpr(node: any): any {
     const name = node.name.toLowerCase();
     
     // Random function
     if (name === 'random') {
        const min = this.evaluateExpression(node.args[0]);
        const max = this.evaluateExpression(node.args[1]);
        if (this.rng) {
            return Math.floor(this.rng.next() * (max - min + 1)) + min;
        }
        return Math.floor(Math.random() * (max - min + 1)) + min;
     }
     
     // === Standard Blockly Sensor Functions ===
     
     // isItemPresent('crystal'|'switch'|'key'|'any')
     if (name === 'isitempresent') {
        const itemType = node.args[0]?.value?.toLowerCase() || 'any';
        return this.checkItemPresent(itemType);
     }
     
     // isSwitchState('on'|'off')
     if (name === 'isswitchstate') {
        const state = node.args[0]?.value?.toLowerCase() || 'on';
        return this.checkSwitchState(state);
     }
     
     // isPathForward(), isPathLeft(), isPathRight()
     if (name === 'ispathforward') {
        return true; // In generative mode, path is always ahead
     }
     if (name === 'ispathleft') {
        return this.rng ? this.rng.nextBoolean() : Math.random() > 0.5;
     }
     if (name === 'ispathright') {
        return this.rng ? this.rng.nextBoolean() : Math.random() > 0.5;
     }
     
     // notDone() - always true in generative mode until we reach end
     if (name === 'notdone') {
        return true;
     }
     
     // atFinish() - opposite of notDone
     if (name === 'atfinish') {
        return false;
     }
     
     return 0;
  }
  
  /**
   * Check if item of specified type is present at current position
   * In generative mode, may place items randomly
   */
  private checkItemPresent(itemType: string): boolean {
    const pos = this.context.position;
    
    // Check existing items
    const hasItem = this.items.some(item => {
      if (itemType === 'any') {
        return item.position[0] === pos[0] && item.position[2] === pos[2];
      }
      return item.type === itemType && 
             item.position[0] === pos[0] && 
             item.position[2] === pos[2];
    });
    
    if (hasItem) return true;
    
    // Generative mode: randomly place item
    if (this.rng && this.rng.nextBoolean()) {
      const type = itemType === 'any' ? 'crystal' : itemType;
      console.log(`[Interpreter] Placing ${type} at position:`, pos);
      this.items.push({ type, position: [...pos] as Coord });
      return true;
    }
    
    return false;
  }
  
  /**
   * Check switch state at current position
   * In generative mode, may place switch with random state
   */
  private checkSwitchState(targetState: string): boolean {
    const pos = this.context.position;
    
    // Find switch at current position
    const switchItem = this.items.find(item => 
      item.type === 'switch' && 
      item.position[0] === pos[0] && 
      item.position[2] === pos[2]
    );
    
    if (switchItem) {
      // Check if switch is in target state
      const currentState = (switchItem as any).state || 'off';
      return currentState === targetState;
    }
    
    // Generative mode: place switch with random state
    if (this.rng) {
      const state = this.rng.nextBoolean() ? 'on' : 'off';
      console.log(`[Interpreter] Placing switch (${state}) at position:`, pos);
      this.items.push({ 
        type: 'switch', 
        position: [...pos] as Coord,
        state 
      } as any);
      return state === targetState;
    }
    
    return false;
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
      // === Legacy condition types (backward compatibility) ===
      case 'isOnCrystal':
        result = this.checkItemPresent('crystal');
        break;

      case 'isOnSwitch':
        result = this.checkItemPresent('switch');
        break;
        
      case 'hasKey':
        result = this.context.inventory.keys > 0;
        break;
      
      // === Standard Blockly API condition types ===
      case 'isItemPresent':
        result = this.checkItemPresent(condition.argument || 'any');
        break;
        
      case 'isSwitchState':
        result = this.checkSwitchState(condition.argument || 'on');
        break;
        
      case 'isPathForward':
        result = true; // Always have path ahead in generative mode
        break;
        
      case 'isPathLeft':
        result = this.rng ? this.rng.nextBoolean() : Math.random() > 0.5;
        break;
        
      case 'isPathRight':
        result = this.rng ? this.rng.nextBoolean() : Math.random() > 0.5;
        break;
        
      case 'notDone':
        result = true; // Always not done until we reach end
        break;
        
      default:
        result = false;
    }
    
    return condition.negated ? !result : result;
  }

  private executeFunctionCall(node: FunctionCallNode): void {
    const name = node.name.toLowerCase();
    
    switch (name) {
      // === Micro Pattern Support ===
      case 'randompattern':
      case 'random_pattern': {
        const maxLength = node.arguments[0] ? this.evaluateExpression(node.arguments[0]) : undefined;
        const interactionType = node.arguments[1] ? this.evaluateExpression(node.arguments[1]) : undefined; // string
        const hasNested = node.arguments[2] ? this.evaluateExpression(node.arguments[2]) : undefined; // boolean

        const pattern = getRandomPattern({
          maxLength: maxLength || 5,
          interactionType: interactionType || 'crystal',
          nestedLoopCompatible: hasNested,
          seed: this.rng ? Math.floor(this.rng.next() * 100000) : undefined // Seeded
        });

        if (pattern) {
          this.executeMicroPattern(pattern);
        }
        break;
      }

      // === Movement Commands (Quest Player standard) ===
      case 'moveforward':
        this.doMoveForward();
        break;
      
      case 'jump':
        this.doJump();
        break;
      
      case 'jumpup':
        this.doJumpUp();
        break;
      
      case 'jumpdown':
        this.doJumpDown();
        break;
      
      case 'turnleft':
        this.doTurnLeft();
        break;
      
      case 'turnright':
        this.doTurnRight();
        break;
      
      // === Item Commands (Quest Player standard) ===
      case 'collectitem':
        this.doCollect('crystal');
        break;
      
      // === Switch Commands (Quest Player standard) ===
      case 'toggleswitch':
        this.doInteract('switch');
        break;
      
      default:
        // User-defined functions (e.g., turnAround, collectItems)
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
    
    // Track full sequential path (with duplicates for patterns that revisit tiles)
    this.movementSequence.push([...this.context.position] as Coord);
    
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

  /**
   * Jump: Move forward and up one block (for elevated terrain)
   * In map generation, this creates a step-up in the path
   */
  private doJump(): void {
    // Move forward
    this.context.position = moveForward(this.context.position, this.context.direction);
    // Move up one block
    this.context.position = [
      this.context.position[0],
      this.context.position[1] + 1,
      this.context.position[2]
    ] as Coord;
    
    // Track full sequential path (with duplicates for patterns that revisit tiles)
    this.movementSequence.push([...this.context.position] as Coord);
    
    const key = coordToKey(this.context.position);
    if (!this.pathSet.has(key)) {
      this.pathCoords.push([...this.context.position] as Coord);
      this.pathSet.add(key);
    }
    
    this.actions.push({
      type: 'jump',
      position: [...this.context.position] as Coord,
      direction: this.context.direction
    });
    this.totalMoves++;
  }

  /**
   * JumpUp: Explicit jump UP (for template map generation)
   * Creates elevated terrain by moving forward + up one block
   */
  private doJumpUp(): void {
    // Move forward
    this.context.position = moveForward(this.context.position, this.context.direction);
    // Move up one block
    this.context.position = [
      this.context.position[0],
      this.context.position[1] + 1,
      this.context.position[2]
    ] as Coord;
    
    const key = coordToKey(this.context.position);
    if (!this.pathSet.has(key)) {
      this.pathCoords.push([...this.context.position] as Coord);
      this.pathSet.add(key);
    }
    
    // Output as 'jump' for backward compatibility with player
    this.actions.push({
      type: 'jump',
      position: [...this.context.position] as Coord,
      direction: this.context.direction
    });
    this.totalMoves++;
  }

  /**
   * JumpDown: Explicit jump DOWN (for template map generation)
   * Creates descending terrain by moving forward + down one block
   */
  private doJumpDown(): void {
    // Move forward
    this.context.position = moveForward(this.context.position, this.context.direction);
    // Move DOWN one block
    this.context.position = [
      this.context.position[0],
      this.context.position[1] - 1,
      this.context.position[2]
    ] as Coord;
    
    const key = coordToKey(this.context.position);
    if (!this.pathSet.has(key)) {
      this.pathCoords.push([...this.context.position] as Coord);
      this.pathSet.add(key);
    }
    
    // Output as 'jump' for backward compatibility with player
    this.actions.push({
      type: 'jump',
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
    // Check for existing item to avoid duplicates (e.g. from generative condition)
    const exists = this.items.some(i => 
      i.type === itemType && 
      i.position[0] === this.context.position[0] &&
      i.position[1] === this.context.position[1] &&
      i.position[2] === this.context.position[2]
    );

    if (!exists) {
      this.items.push({
        type: itemType,
        position: [...this.context.position] as Coord
      });
    }
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
    // Check for existing item
    const exists = this.items.some(i => 
      i.type === itemType && 
      i.position[0] === this.context.position[0] &&
      i.position[1] === this.context.position[1] &&
      i.position[2] === this.context.position[2]
    );

    if (!exists) {
      this.items.push({
        type: itemType,
        position: [...this.context.position] as Coord
      });
    }
    this.actions.push({
      type: 'interact',
      position: [...this.context.position] as Coord,
      direction: this.context.direction,
      item: itemType
    });
  }

  private executeMicroPattern(pattern: MicroPattern): void {
    if (!pattern.actions) return;
    
    for (const action of pattern.actions) {
      switch(action) {
        case 'moveForward': this.doMoveForward(); break;
        case 'turnLeft': this.doTurnLeft(); break;
        case 'turnRight': this.doTurnRight(); break;
        case 'collectItem': this.doCollect('crystal'); break;
        case 'toggleSwitch': this.doInteract('switch'); break;
        case 'pickUpKey': this.doCollect('key'); break;
        case 'jump': this.doJump(); break;
        case 'jumpUp': this.doJumpUp(); break;
        case 'jumpDown': this.doJumpDown(); break;
      }
    }
  }
}
