/**
 * Pattern Library Specification
 * 
 * Defines the pattern system for Pattern-Based map generation.
 */

import {
  ItemType,
  PedagogyConcept,
  DifficultyLevel,
  Vector2,
  Direction,
  Turn,
  PatternCategory
} from './core-types';

// ============================================================================
// PATTERN NOTATION
// ============================================================================

/**
 * Pattern symbols and their meanings
 */
export const PATTERN_SYMBOLS = {
  // Movement
  '-': 'Move forward (empty cell)',
  '>': 'Turn right',
  '<': 'Turn left',
  
  // Items
  'C': 'Crystal',
  'K': 'Key',
  'S': 'Switch',
  'P': 'Portal',
  'G': 'Gate',
  
  // Special
  '*': 'Start position',
  '@': 'End/goal position'
} as const;

/**
 * Symbol to item type mapping
 */
export const SYMBOL_TO_ITEM: Record<string, ItemType | undefined> = {
  'C': ItemType.CRYSTAL,
  'K': ItemType.KEY,
  'S': ItemType.SWITCH,
  'P': ItemType.PORTAL,
  'G': ItemType.GATE
};

// ============================================================================
// PATTERN DEFINITION
// ============================================================================

/**
 * Item within a pattern
 */
export interface PatternItem {
  /** Item type */
  type: ItemType;
  
  /** Position relative to pattern start */
  relativePosition: Vector2;
  
  /** Which step in the sequence places this item (0-indexed) */
  stepIndex: number;
}

/**
 * Pattern step (action)
 */
export interface PatternStep {
  /** Step index in sequence */
  index: number;
  
  /** Symbol at this step */
  symbol: string;
  
  /** Action type */
  action: 'move' | 'turn_left' | 'turn_right' | 'place_item';
  
  /** Item type if action is place_item */
  itemType?: ItemType;
  
  /** Position after this step */
  positionAfter: Vector2;
  
  /** Direction after this step */
  directionAfter: Direction;
}

/**
 * Full pattern definition
 */
export interface Pattern {
  /** Unique identifier */
  id: string;
  
  /** Pattern sequence string (e.g., "C->-C") */
  sequence: string;
  
  /** Total number of steps */
  length: number;
  
  /** Items placed by this pattern */
  items: PatternItem[];
  
  /** Direction change relative to start (cumulative) */
  exitDirection: Turn;
  
  // ---- Metadata ----
  
  /** Pattern category */
  category: PatternCategory;
  
  /** Difficulty level */
  difficulty: DifficultyLevel;
  
  /** Concepts this pattern can teach */
  teaches?: PedagogyConcept[];
  
  /** Tags for filtering */
  tags?: string[];
  
  /** Description */
  description?: string;
}

/**
 * Loop pattern (repeatable pattern)
 */
export interface LoopPattern {
  /** Pattern body to repeat */
  body: string;
  
  /** Fixed iterations (for-counted) */
  iterations?: number;
  
  /** Random iteration range */
  iterationRange?: [min: number, max: number];
  
  /** What this loop teaches */
  teaches: PedagogyConcept;
  
  /** Expected shape after execution */
  resultShape: 'line' | 'square' | 'spiral' | 'staircase' | 'zigzag';
}

// ============================================================================
// PATTERN CONSTRAINTS
// ============================================================================

/**
 * Constraints for valid patterns
 */
export interface PatternConstraints {
  /** Maximum sequence length */
  maxLength: number;
  
  /** Maximum number of turns */
  maxTurns: number;
  
  /** Maximum items per pattern */
  maxItems: number;
  
  /** Minimum items per pattern */
  minItems: number;
  
  /** Allowed item types */
  allowedItems: ItemType[];
  
  /** Forbidden sequences (e.g., "><" is useless) */
  forbiddenSequences: string[];
}

/**
 * Default pattern constraints
 */
export const DEFAULT_PATTERN_CONSTRAINTS: PatternConstraints = {
  maxLength: 10,
  maxTurns: 4,
  maxItems: 3,
  minItems: 1,
  allowedItems: [
    ItemType.CRYSTAL,
    ItemType.KEY,
    ItemType.SWITCH,
    ItemType.PORTAL,
    ItemType.GATE
  ],
  forbiddenSequences: [
    '><',   // Right then left = no movement
    '<>',   // Left then right = no movement
    '>>>', // 270° turn = better as single <
    '<<<'  // 270° turn = better as single >
  ]
};

// ============================================================================
// PATTERN LIBRARY
// ============================================================================

/**
 * Pattern library for storing and querying patterns
 */
export class PatternLibrary {
  private patterns: Map<string, Pattern> = new Map();
  private byCategory: Map<PatternCategory, Pattern[]> = new Map();
  private byConcept: Map<PedagogyConcept, Pattern[]> = new Map();
  
  constructor(patterns?: Pattern[]) {
    if (patterns) {
      this.addPatterns(patterns);
    }
  }
  
  /**
   * Add patterns to library
   */
  addPatterns(patterns: Pattern[]): void {
    for (const pattern of patterns) {
      this.patterns.set(pattern.id, pattern);
      
      // Index by category
      if (!this.byCategory.has(pattern.category)) {
        this.byCategory.set(pattern.category, []);
      }
      this.byCategory.get(pattern.category)!.push(pattern);
      
      // Index by concept
      if (pattern.teaches) {
        for (const concept of pattern.teaches) {
          if (!this.byConcept.has(concept)) {
            this.byConcept.set(concept, []);
          }
          this.byConcept.get(concept)!.push(pattern);
        }
      }
    }
  }
  
  /**
   * Get pattern by ID
   */
  get(id: string): Pattern | undefined {
    return this.patterns.get(id);
  }
  
  /**
   * Get all patterns
   */
  getAll(): Pattern[] {
    return Array.from(this.patterns.values());
  }
  
  /**
   * Get patterns by category
   */
  getByCategory(category: PatternCategory): Pattern[] {
    return this.byCategory.get(category) ?? [];
  }
  
  /**
   * Get patterns that teach a concept
   */
  getByConcept(concept: PedagogyConcept): Pattern[] {
    return this.byConcept.get(concept) ?? [];
  }
  
  /**
   * Get patterns by difficulty
   */
  getByDifficulty(difficulty: DifficultyLevel): Pattern[] {
    return this.getAll().filter(p => p.difficulty === difficulty);
  }
  
  /**
   * Get patterns with specific item types
   */
  getWithItems(items: ItemType[]): Pattern[] {
    return this.getAll().filter(p => 
      p.items.some(item => items.includes(item.type))
    );
  }
  
  /**
   * Get random pattern matching criteria
   */
  getRandom(filter?: PatternFilter): Pattern | undefined {
    let candidates = this.getAll();
    
    if (filter) {
      candidates = this.applyFilter(candidates, filter);
    }
    
    if (candidates.length === 0) return undefined;
    
    const index = Math.floor(Math.random() * candidates.length);
    return candidates[index];
  }
  
  /**
   * Apply filter to pattern list
   */
  private applyFilter(patterns: Pattern[], filter: PatternFilter): Pattern[] {
    let result = patterns;
    
    if (filter.category) {
      result = result.filter(p => p.category === filter.category);
    }
    
    if (filter.maxLength) {
      result = result.filter(p => p.length <= filter.maxLength);
    }
    
    if (filter.maxDifficulty) {
      result = result.filter(p => p.difficulty <= filter.maxDifficulty);
    }
    
    if (filter.teaches) {
      result = result.filter(p => 
        p.teaches?.includes(filter.teaches!) ?? false
      );
    }
    
    if (filter.requiredItems) {
      result = result.filter(p =>
        filter.requiredItems!.every(req => 
          p.items.some(item => item.type === req)
        )
      );
    }
    
    if (filter.excludeItems) {
      result = result.filter(p =>
        !p.items.some(item => filter.excludeItems!.includes(item.type))
      );
    }
    
    return result;
  }
}

/**
 * Filter criteria for pattern selection
 */
export interface PatternFilter {
  category?: PatternCategory;
  maxLength?: number;
  minLength?: number;
  maxDifficulty?: DifficultyLevel;
  teaches?: PedagogyConcept;
  requiredItems?: ItemType[];
  excludeItems?: ItemType[];
  tags?: string[];
}

// ============================================================================
// PATTERN PARSER
// ============================================================================

/**
 * Parse pattern sequence string into structured pattern
 */
export class PatternParser {
  private constraints: PatternConstraints;
  
  constructor(constraints: PatternConstraints = DEFAULT_PATTERN_CONSTRAINTS) {
    this.constraints = constraints;
  }
  
  /**
   * Parse sequence string into Pattern
   */
  parse(sequence: string, metadata?: Partial<Pattern>): Pattern | null {
    // Validate
    const validation = this.validate(sequence);
    if (!validation.valid) {
      console.error('Invalid pattern:', validation.errors);
      return null;
    }
    
    // Parse steps
    const steps = this.parseSteps(sequence);
    
    // Extract items
    const items = this.extractItems(steps);
    
    // Calculate exit direction
    const exitDirection = this.calculateExitDirection(steps);
    
    // Determine category
    const category = this.determineCategory(sequence, steps);
    
    return {
      id: metadata?.id ?? `pattern-${Date.now()}`,
      sequence,
      length: sequence.length,
      items,
      exitDirection,
      category,
      difficulty: metadata?.difficulty ?? this.estimateDifficulty(sequence),
      teaches: metadata?.teaches,
      tags: metadata?.tags,
      description: metadata?.description
    };
  }
  
  /**
   * Validate pattern sequence
   */
  validate(sequence: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check length
    if (sequence.length > this.constraints.maxLength) {
      errors.push(`Length ${sequence.length} exceeds max ${this.constraints.maxLength}`);
    }
    
    // Check turns
    const turns = (sequence.match(/[<>]/g) || []).length;
    if (turns > this.constraints.maxTurns) {
      errors.push(`Turns ${turns} exceeds max ${this.constraints.maxTurns}`);
    }
    
    // Check items
    const items = sequence.replace(/[-<>]/g, '');
    if (items.length < this.constraints.minItems) {
      errors.push(`Items ${items.length} below min ${this.constraints.minItems}`);
    }
    if (items.length > this.constraints.maxItems) {
      errors.push(`Items ${items.length} exceeds max ${this.constraints.maxItems}`);
    }
    
    // Check forbidden sequences
    for (const forbidden of this.constraints.forbiddenSequences) {
      if (sequence.includes(forbidden)) {
        errors.push(`Contains forbidden sequence: ${forbidden}`);
      }
    }
    
    // Check valid symbols
    for (const char of sequence) {
      if (!PATTERN_SYMBOLS[char as keyof typeof PATTERN_SYMBOLS]) {
        errors.push(`Unknown symbol: ${char}`);
      }
    }
    
    return { valid: errors.length === 0, errors };
  }
  
  /**
   * Parse sequence into steps
   */
  private parseSteps(sequence: string): PatternStep[] {
    const steps: PatternStep[] = [];
    let position: Vector2 = { x: 0, y: 0 };
    let direction: Direction = Direction.NORTH;
    
    for (let i = 0; i < sequence.length; i++) {
      const symbol = sequence[i];
      let step: PatternStep;
      
      switch (symbol) {
        case '-':
          position = this.moveForward(position, direction);
          step = {
            index: i,
            symbol,
            action: 'move',
            positionAfter: { ...position },
            directionAfter: direction
          };
          break;
          
        case '>':
          direction = this.turnRight(direction);
          step = {
            index: i,
            symbol,
            action: 'turn_right',
            positionAfter: { ...position },
            directionAfter: direction
          };
          break;
          
        case '<':
          direction = this.turnLeft(direction);
          step = {
            index: i,
            symbol,
            action: 'turn_left',
            positionAfter: { ...position },
            directionAfter: direction
          };
          break;
          
        default:
          // Item placement
          const itemType = SYMBOL_TO_ITEM[symbol];
          step = {
            index: i,
            symbol,
            action: 'place_item',
            itemType,
            positionAfter: { ...position },
            directionAfter: direction
          };
          break;
      }
      
      steps.push(step);
    }
    
    return steps;
  }
  
  /**
   * Extract items from steps
   */
  private extractItems(steps: PatternStep[]): PatternItem[] {
    return steps
      .filter(step => step.action === 'place_item' && step.itemType)
      .map(step => ({
        type: step.itemType!,
        relativePosition: step.positionAfter,
        stepIndex: step.index
      }));
  }
  
  /**
   * Calculate net direction change
   */
  private calculateExitDirection(steps: PatternStep[]): Turn {
    let netTurns = 0;
    
    for (const step of steps) {
      if (step.action === 'turn_right') netTurns++;
      if (step.action === 'turn_left') netTurns--;
    }
    
    // Normalize to -1, 0, 1
    netTurns = ((netTurns % 4) + 4) % 4;
    
    if (netTurns === 0) return 'none';
    if (netTurns === 1) return 'right';
    if (netTurns === 3) return 'left';
    return 'none'; // 2 = U-turn, treat as none for simplicity
  }
  
  /**
   * Determine pattern category
   */
  private determineCategory(sequence: string, steps: PatternStep[]): PatternCategory {
    const turns = (sequence.match(/[<>]/g) || []).length;
    
    if (turns === 0) return PatternCategory.STRAIGHT;
    if (turns === 1) return PatternCategory.TURN;
    
    // Check for zigzag pattern (alternating turns)
    if (this.isZigzag(sequence)) return PatternCategory.ZIGZAG;
    
    // Check for spiral (same direction turns)
    if (this.isSpiral(sequence)) return PatternCategory.SPIRAL;
    
    return PatternCategory.COMPLEX;
  }
  
  private isZigzag(sequence: string): boolean {
    // Zigzag: alternates between < and >
    const turns = sequence.replace(/[^<>]/g, '');
    if (turns.length < 2) return false;
    
    for (let i = 1; i < turns.length; i++) {
      if (turns[i] === turns[i - 1]) return false;
    }
    return true;
  }
  
  private isSpiral(sequence: string): boolean {
    // Spiral: all turns in same direction
    const rightTurns = (sequence.match(/>/g) || []).length;
    const leftTurns = (sequence.match(/</g) || []).length;
    
    return (rightTurns > 0 && leftTurns === 0) || 
           (leftTurns > 0 && rightTurns === 0);
  }
  
  private estimateDifficulty(sequence: string): DifficultyLevel {
    const turns = (sequence.match(/[<>]/g) || []).length;
    const items = sequence.replace(/[-<>]/g, '').length;
    
    const score = turns + items * 0.5 + sequence.length * 0.1;
    
    if (score < 3) return 1;
    if (score < 5) return 2;
    if (score < 8) return 3;
    if (score < 12) return 4;
    return 5;
  }
  
  // Movement helpers
  private moveForward(pos: Vector2, dir: Direction): Vector2 {
    switch (dir) {
      case Direction.NORTH: return { x: pos.x, y: pos.y + 1 };
      case Direction.EAST: return { x: pos.x + 1, y: pos.y };
      case Direction.SOUTH: return { x: pos.x, y: pos.y - 1 };
      case Direction.WEST: return { x: pos.x - 1, y: pos.y };
    }
  }
  
  private turnRight(dir: Direction): Direction {
    const order = [Direction.NORTH, Direction.EAST, Direction.SOUTH, Direction.WEST];
    const idx = order.indexOf(dir);
    return order[(idx + 1) % 4];
  }
  
  private turnLeft(dir: Direction): Direction {
    const order = [Direction.NORTH, Direction.WEST, Direction.SOUTH, Direction.EAST];
    const idx = order.indexOf(dir);
    return order[(idx + 1) % 4];
  }
}

// ============================================================================
// BUILT-IN PATTERNS
// ============================================================================

/**
 * Basic patterns for common scenarios
 */
export const BASIC_PATTERNS: Pattern[] = [
  // Straight patterns
  { id: 'straight-c1', sequence: 'C', length: 1, items: [{ type: ItemType.CRYSTAL, relativePosition: { x: 0, y: 0 }, stepIndex: 0 }], exitDirection: 'none', category: PatternCategory.STRAIGHT, difficulty: 1 },
  { id: 'straight-c2', sequence: 'C-', length: 2, items: [{ type: ItemType.CRYSTAL, relativePosition: { x: 0, y: 0 }, stepIndex: 0 }], exitDirection: 'none', category: PatternCategory.STRAIGHT, difficulty: 1 },
  { id: 'straight-c3', sequence: '-C', length: 2, items: [{ type: ItemType.CRYSTAL, relativePosition: { x: 0, y: 1 }, stepIndex: 1 }], exitDirection: 'none', category: PatternCategory.STRAIGHT, difficulty: 1 },
  { id: 'straight-c4', sequence: 'C-C', length: 3, items: [{ type: ItemType.CRYSTAL, relativePosition: { x: 0, y: 0 }, stepIndex: 0 }, { type: ItemType.CRYSTAL, relativePosition: { x: 0, y: 2 }, stepIndex: 2 }], exitDirection: 'none', category: PatternCategory.STRAIGHT, difficulty: 2, teaches: [PedagogyConcept.FOR_COUNTED] },
  { id: 'straight-c5', sequence: 'C---', length: 4, items: [{ type: ItemType.CRYSTAL, relativePosition: { x: 0, y: 0 }, stepIndex: 0 }], exitDirection: 'none', category: PatternCategory.STRAIGHT, difficulty: 1 },
  
  // Turn patterns
  { id: 'turn-right-c', sequence: '>C', length: 2, items: [{ type: ItemType.CRYSTAL, relativePosition: { x: 0, y: 0 }, stepIndex: 1 }], exitDirection: 'right', category: PatternCategory.TURN, difficulty: 2 },
  { id: 'turn-left-c', sequence: '<C', length: 2, items: [{ type: ItemType.CRYSTAL, relativePosition: { x: 0, y: 0 }, stepIndex: 1 }], exitDirection: 'left', category: PatternCategory.TURN, difficulty: 2 },
  { id: 'turn-move-c', sequence: '->C', length: 3, items: [{ type: ItemType.CRYSTAL, relativePosition: { x: 1, y: 0 }, stepIndex: 2 }], exitDirection: 'right', category: PatternCategory.TURN, difficulty: 2 },
  { id: 'c-turn-c', sequence: 'C>-C', length: 4, items: [{ type: ItemType.CRYSTAL, relativePosition: { x: 0, y: 0 }, stepIndex: 0 }, { type: ItemType.CRYSTAL, relativePosition: { x: 1, y: 0 }, stepIndex: 3 }], exitDirection: 'right', category: PatternCategory.TURN, difficulty: 3 },
  
  // Zigzag patterns
  { id: 'zigzag-2', sequence: 'C>C<', length: 4, items: [{ type: ItemType.CRYSTAL, relativePosition: { x: 0, y: 0 }, stepIndex: 0 }, { type: ItemType.CRYSTAL, relativePosition: { x: 0, y: 0 }, stepIndex: 2 }], exitDirection: 'none', category: PatternCategory.ZIGZAG, difficulty: 3 },
  
  // Key patterns
  { id: 'key-simple', sequence: 'K', length: 1, items: [{ type: ItemType.KEY, relativePosition: { x: 0, y: 0 }, stepIndex: 0 }], exitDirection: 'none', category: PatternCategory.STRAIGHT, difficulty: 1 },
  { id: 'key-gate', sequence: 'K---G', length: 5, items: [{ type: ItemType.KEY, relativePosition: { x: 0, y: 0 }, stepIndex: 0 }, { type: ItemType.GATE, relativePosition: { x: 0, y: 4 }, stepIndex: 4 }], exitDirection: 'none', category: PatternCategory.STRAIGHT, difficulty: 3, teaches: [PedagogyConcept.IF_SIMPLE] }
];

/**
 * Loop patterns
 */
export const LOOP_PATTERNS: LoopPattern[] = [
  {
    body: 'C-',
    iterationRange: [3, 8],
    teaches: PedagogyConcept.FOR_COUNTED,
    resultShape: 'line'
  },
  {
    body: 'C>',
    iterations: 4,
    teaches: PedagogyConcept.FOR_COUNTED,
    resultShape: 'square'
  },
  {
    body: 'C->',
    iterationRange: [3, 6],
    teaches: PedagogyConcept.FOR_COUNTED,
    resultShape: 'spiral'
  },
  {
    body: 'C>-<',
    iterationRange: [3, 5],
    teaches: PedagogyConcept.FOR_COUNTED,
    resultShape: 'staircase'
  }
];
