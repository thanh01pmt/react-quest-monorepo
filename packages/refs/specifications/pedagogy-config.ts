/**
 * Pedagogy Configuration
 * 
 * Defines grade-level appropriate settings for map generation.
 */

import {
  GradeLevel,
  BloomLevel,
  PedagogyConcept,
  DifficultyLevel,
  NoiseConfig,
  GenerationConstraints,
  DependencyStrategy,
  ItemType
} from './core-types';

// ============================================================================
// COGNITIVE LOAD CONFIGURATION
// ============================================================================

/**
 * Cognitive load configuration based on Miller's Law (7±2 items)
 * and educational research on working memory
 */
export interface CognitiveLoadConfig {
  /** Grade level */
  gradeLevel: GradeLevel;
  
  /** Bloom's Taxonomy level */
  bloomLevel: BloomLevel;
  
  /** Maximum nesting depth for code structures */
  maxNestingDepth: number;
  
  /** Maximum loop iterations */
  maxLoopIterations: number;
  
  /** Maximum simultaneous decisions (for conditionals) */
  maxSimultaneousDecisions: number;
  
  /** Maximum complexity score */
  maxComplexityScore: number;
  
  /** Allowed programming constructs */
  allowedConstructs: PedagogyConcept[];
}

/**
 * Cognitive load configurations by grade level
 */
export const COGNITIVE_LOAD_CONFIGS: Record<GradeLevel, CognitiveLoadConfig> = {
  'K-2': {
    gradeLevel: 'K-2',
    bloomLevel: 'Remember',
    maxNestingDepth: 1,
    maxLoopIterations: 5,
    maxSimultaneousDecisions: 2,
    maxComplexityScore: 10,
    allowedConstructs: [
      PedagogyConcept.SEQUENCE,
      PedagogyConcept.MOVE,
      PedagogyConcept.TURN,
      PedagogyConcept.COLLECT,
      PedagogyConcept.FOR_COUNTED
    ]
  },
  
  '3-5': {
    gradeLevel: '3-5',
    bloomLevel: 'Understand',
    maxNestingDepth: 2,
    maxLoopIterations: 10,
    maxSimultaneousDecisions: 4,
    maxComplexityScore: 25,
    allowedConstructs: [
      PedagogyConcept.SEQUENCE,
      PedagogyConcept.MOVE,
      PedagogyConcept.TURN,
      PedagogyConcept.COLLECT,
      PedagogyConcept.FOR_COUNTED,
      PedagogyConcept.IF_SIMPLE,
      PedagogyConcept.FUNCTION_CALL
    ]
  },
  
  '6-8': {
    gradeLevel: '6-8',
    bloomLevel: 'Apply',
    maxNestingDepth: 2,  // Note: Still 2, not 3
    maxLoopIterations: 15,
    maxSimultaneousDecisions: 5,
    maxComplexityScore: 50,
    allowedConstructs: [
      PedagogyConcept.SEQUENCE,
      PedagogyConcept.MOVE,
      PedagogyConcept.TURN,
      PedagogyConcept.COLLECT,
      PedagogyConcept.FOR_COUNTED,
      PedagogyConcept.FOR_EACH,
      PedagogyConcept.NESTED_FOR,
      PedagogyConcept.IF_SIMPLE,
      PedagogyConcept.IF_ELSE,
      PedagogyConcept.WHILE_CONDITION,
      PedagogyConcept.FUNCTION_DEFINITION,
      PedagogyConcept.FUNCTION_CALL
    ]
  },
  
  '9-12': {
    gradeLevel: '9-12',
    bloomLevel: 'Analyze',
    maxNestingDepth: 3,
    maxLoopIterations: 20,
    maxSimultaneousDecisions: 7,
    maxComplexityScore: 100,
    allowedConstructs: [
      // All constructs allowed
      ...Object.values(PedagogyConcept)
    ]
  }
};

// ============================================================================
// NOISE CONFIGURATION
// ============================================================================

/**
 * Noise configurations by grade level
 * Controls how much "exploration" content is added to maps
 */
export const NOISE_CONFIGS: Record<GradeLevel, NoiseConfig> = {
  'K-2': {
    noiseType: 'none',
    maxNoisePaths: 0,
    maxExtraItems: 0,
    allowDeadEnds: false,
    allowDecoys: false
  },
  
  '3-5': {
    noiseType: 'visual_only',
    maxNoisePaths: 2,
    maxExtraItems: 0,       // Paths visible, but no items
    allowDeadEnds: true,
    allowDecoys: false
  },
  
  '6-8': {
    noiseType: 'collectible',
    maxNoisePaths: 3,
    maxExtraItems: 3,       // Extra crystals in detours
    allowDeadEnds: true,
    allowDecoys: false
  },
  
  '9-12': {
    noiseType: 'full',
    maxNoisePaths: 5,
    maxExtraItems: 5,
    allowDeadEnds: true,
    allowDecoys: true       // Decoy items that waste moves
  }
};

// ============================================================================
// GENERATION CONSTRAINTS
// ============================================================================

/**
 * Complete generation constraints by grade level
 */
export const GENERATION_CONSTRAINTS: Record<GradeLevel, GenerationConstraints> = {
  'K-2': {
    maxNestingDepth: 1,
    maxComplexityScore: 10,
    maxPathLength: 10,
    maxItems: 5,
    requiredItems: [],
    forbiddenItems: [ItemType.SWITCH, ItemType.GATE],
    noiseLevel: 'none'
  },
  
  '3-5': {
    maxNestingDepth: 2,
    maxComplexityScore: 25,
    maxPathLength: 20,
    maxItems: 10,
    requiredItems: [],
    forbiddenItems: [],
    noiseLevel: 'low'
  },
  
  '6-8': {
    maxNestingDepth: 2,
    maxComplexityScore: 50,
    maxPathLength: 40,
    maxItems: 20,
    requiredItems: [],
    forbiddenItems: [],
    noiseLevel: 'medium'
  },
  
  '9-12': {
    maxNestingDepth: 3,
    maxComplexityScore: 100,
    maxPathLength: 80,
    maxItems: 40,
    requiredItems: [],
    forbiddenItems: [],
    noiseLevel: 'high'
  }
};

// ============================================================================
// DEPENDENCY STRATEGIES
// ============================================================================

/**
 * Recommended dependency strategies by grade level
 */
export const DEPENDENCY_STRATEGIES: Record<GradeLevel, DependencyStrategy> = {
  'K-2': DependencyStrategy.BALANCED,      // Simple, obvious placement
  '3-5': DependencyStrategy.BALANCED,      // Still straightforward
  '6-8': DependencyStrategy.PROGRESSIVE,   // Items in difficulty order
  '9-12': DependencyStrategy.PUZZLE        // Challenge with backtracking
};

// ============================================================================
// CONCEPT DIFFICULTY MAPPING
// ============================================================================

/**
 * Difficulty level for each pedagogy concept
 */
export const CONCEPT_DIFFICULTY: Record<PedagogyConcept, DifficultyLevel> = {
  [PedagogyConcept.SEQUENCE]: 1,
  [PedagogyConcept.MOVE]: 1,
  [PedagogyConcept.TURN]: 1,
  [PedagogyConcept.COLLECT]: 1,
  [PedagogyConcept.FOR_COUNTED]: 2,
  [PedagogyConcept.FOR_EACH]: 2,
  [PedagogyConcept.IF_SIMPLE]: 2,
  [PedagogyConcept.FUNCTION_CALL]: 2,
  [PedagogyConcept.IF_ELSE]: 3,
  [PedagogyConcept.NESTED_FOR]: 3,
  [PedagogyConcept.WHILE_CONDITION]: 3,
  [PedagogyConcept.FUNCTION_DEFINITION]: 3,
  [PedagogyConcept.NESTED_IF]: 4,
  [PedagogyConcept.REPEAT_UNTIL]: 4,
  [PedagogyConcept.SENSING]: 4,
  [PedagogyConcept.CONDITIONAL_LOGIC]: 4,
  [PedagogyConcept.FUNCTION_PARAMETER]: 4,
  [PedagogyConcept.OPTIMIZATION]: 5,
  [PedagogyConcept.ALGORITHM_DESIGN]: 5,
  [PedagogyConcept.DEBUGGING]: 5
};

/**
 * Prerequisite concepts for each concept
 */
export const CONCEPT_PREREQUISITES: Partial<Record<PedagogyConcept, PedagogyConcept[]>> = {
  [PedagogyConcept.TURN]: [PedagogyConcept.MOVE],
  [PedagogyConcept.COLLECT]: [PedagogyConcept.MOVE],
  [PedagogyConcept.FOR_COUNTED]: [PedagogyConcept.SEQUENCE],
  [PedagogyConcept.FOR_EACH]: [PedagogyConcept.FOR_COUNTED],
  [PedagogyConcept.IF_SIMPLE]: [PedagogyConcept.SEQUENCE],
  [PedagogyConcept.IF_ELSE]: [PedagogyConcept.IF_SIMPLE],
  [PedagogyConcept.NESTED_FOR]: [PedagogyConcept.FOR_COUNTED],
  [PedagogyConcept.NESTED_IF]: [PedagogyConcept.IF_ELSE],
  [PedagogyConcept.WHILE_CONDITION]: [PedagogyConcept.FOR_COUNTED, PedagogyConcept.IF_SIMPLE],
  [PedagogyConcept.FUNCTION_DEFINITION]: [PedagogyConcept.FUNCTION_CALL],
  [PedagogyConcept.FUNCTION_PARAMETER]: [PedagogyConcept.FUNCTION_DEFINITION],
  [PedagogyConcept.SENSING]: [PedagogyConcept.IF_SIMPLE],
  [PedagogyConcept.OPTIMIZATION]: [PedagogyConcept.FOR_COUNTED, PedagogyConcept.IF_ELSE]
};

// ============================================================================
// BLOOM'S TAXONOMY MAPPING
// ============================================================================

/**
 * Bloom's level for each concept
 */
export const CONCEPT_BLOOM_LEVEL: Record<PedagogyConcept, BloomLevel> = {
  [PedagogyConcept.SEQUENCE]: 'Remember',
  [PedagogyConcept.MOVE]: 'Remember',
  [PedagogyConcept.TURN]: 'Remember',
  [PedagogyConcept.COLLECT]: 'Remember',
  [PedagogyConcept.FOR_COUNTED]: 'Understand',
  [PedagogyConcept.FOR_EACH]: 'Understand',
  [PedagogyConcept.IF_SIMPLE]: 'Understand',
  [PedagogyConcept.FUNCTION_CALL]: 'Understand',
  [PedagogyConcept.IF_ELSE]: 'Apply',
  [PedagogyConcept.NESTED_FOR]: 'Apply',
  [PedagogyConcept.WHILE_CONDITION]: 'Apply',
  [PedagogyConcept.FUNCTION_DEFINITION]: 'Apply',
  [PedagogyConcept.NESTED_IF]: 'Analyze',
  [PedagogyConcept.REPEAT_UNTIL]: 'Analyze',
  [PedagogyConcept.SENSING]: 'Analyze',
  [PedagogyConcept.CONDITIONAL_LOGIC]: 'Analyze',
  [PedagogyConcept.FUNCTION_PARAMETER]: 'Analyze',
  [PedagogyConcept.OPTIMIZATION]: 'Evaluate',
  [PedagogyConcept.ALGORITHM_DESIGN]: 'Create',
  [PedagogyConcept.DEBUGGING]: 'Evaluate'
};

// ============================================================================
// PEDAGOGY VALIDATOR
// ============================================================================

/**
 * Result of pedagogy validation
 */
export interface PedagogyValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  complexity: number;
  recommendations: string[];
}

/**
 * Validates templates against pedagogy constraints
 */
export class PedagogyValidator {
  private config: CognitiveLoadConfig;
  
  constructor(gradeLevel: GradeLevel) {
    this.config = COGNITIVE_LOAD_CONFIGS[gradeLevel];
  }
  
  /**
   * Validate a code template
   */
  validate(
    code: string,
    requestedConcepts: PedagogyConcept[]
  ): PedagogyValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];
    
    // Check concepts are allowed for grade
    for (const concept of requestedConcepts) {
      if (!this.config.allowedConstructs.includes(concept)) {
        errors.push(
          `Concept "${concept}" not allowed for grade ${this.config.gradeLevel}. ` +
          `Allowed: ${this.config.allowedConstructs.join(', ')}`
        );
      }
    }
    
    // Check prerequisites are met
    for (const concept of requestedConcepts) {
      const prerequisites = CONCEPT_PREREQUISITES[concept] ?? [];
      for (const prereq of prerequisites) {
        if (!requestedConcepts.includes(prereq) && 
            !this.config.allowedConstructs.includes(prereq)) {
          warnings.push(
            `Concept "${concept}" requires prerequisite "${prereq}" ` +
            `which may not be taught yet for grade ${this.config.gradeLevel}`
          );
        }
      }
    }
    
    // Calculate complexity
    const complexity = this.calculateComplexity(code, requestedConcepts);
    
    if (complexity > this.config.maxComplexityScore) {
      errors.push(
        `Complexity ${complexity} exceeds limit ${this.config.maxComplexityScore} ` +
        `for grade ${this.config.gradeLevel}`
      );
    } else if (complexity > this.config.maxComplexityScore * 0.8) {
      warnings.push(
        `Complexity ${complexity} is close to limit. ` +
        `Consider simplifying for grade ${this.config.gradeLevel}`
      );
    }
    
    // Check nesting depth
    const depth = this.detectNestingDepth(code);
    if (depth > this.config.maxNestingDepth) {
      errors.push(
        `Nesting depth ${depth} exceeds limit ${this.config.maxNestingDepth}`
      );
    }
    
    // Generate recommendations
    if (errors.length > 0) {
      recommendations.push(
        `Consider using grade-appropriate concepts: ${this.config.allowedConstructs.slice(0, 5).join(', ')}`
      );
      
      if (complexity > this.config.maxComplexityScore) {
        recommendations.push(
          `Reduce complexity by removing nested structures or reducing loop iterations`
        );
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      complexity,
      recommendations
    };
  }
  
  /**
   * Calculate complexity score for code
   */
  calculateComplexity(code: string, concepts: PedagogyConcept[]): number {
    let score = 0;
    
    // Base complexity from concepts
    for (const concept of concepts) {
      score += CONCEPT_DIFFICULTY[concept] * 2;
    }
    
    // Nesting penalty (exponential)
    const depth = this.detectNestingDepth(code);
    score += Math.pow(2, depth);
    
    // Loop iterations (estimated from code)
    const loopIterations = this.estimateLoopIterations(code);
    score += loopIterations * 0.5;
    
    // Branch count
    const branches = (code.match(/\bif\b/gi) || []).length;
    score += branches * 2;
    
    return Math.round(score);
  }
  
  /**
   * Detect maximum nesting depth in code
   */
  private detectNestingDepth(code: string): number {
    let maxDepth = 0;
    let currentDepth = 0;
    
    for (const char of code) {
      if (char === '{') {
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
      } else if (char === '}') {
        currentDepth--;
      }
    }
    
    return maxDepth;
  }
  
  /**
   * Estimate total loop iterations from code
   */
  private estimateLoopIterations(code: string): number {
    let total = 0;
    
    // Match patterns like "1 to N" or "range(1, N)"
    const forMatches = code.match(/\d+\s*to\s*(\d+)/gi) || [];
    for (const match of forMatches) {
      const num = parseInt(match.replace(/[^\d]/g, ''));
      total += num;
    }
    
    // Match patterns like "repeat N times"
    const repeatMatches = code.match(/repeat\s+(\d+)/gi) || [];
    for (const match of repeatMatches) {
      const num = parseInt(match.replace(/[^\d]/g, ''));
      total += num;
    }
    
    return total;
  }
  
  /**
   * Get recommended concepts for this grade level
   */
  getRecommendedConcepts(): PedagogyConcept[] {
    return this.config.allowedConstructs.filter(
      c => CONCEPT_DIFFICULTY[c] <= 3
    );
  }
  
  /**
   * Check if concept progression is appropriate
   */
  checkProgression(
    previousConcepts: PedagogyConcept[],
    newConcept: PedagogyConcept
  ): { valid: boolean; reason?: string } {
    const prerequisites = CONCEPT_PREREQUISITES[newConcept] ?? [];
    
    for (const prereq of prerequisites) {
      if (!previousConcepts.includes(prereq)) {
        return {
          valid: false,
          reason: `Missing prerequisite: ${prereq}`
        };
      }
    }
    
    // Check difficulty jump
    const previousMaxDifficulty = Math.max(
      0,
      ...previousConcepts.map(c => CONCEPT_DIFFICULTY[c])
    );
    const newDifficulty = CONCEPT_DIFFICULTY[newConcept];
    
    if (newDifficulty > previousMaxDifficulty + 2) {
      return {
        valid: false,
        reason: `Difficulty jump too large: ${previousMaxDifficulty} to ${newDifficulty}`
      };
    }
    
    return { valid: true };
  }
}

// ============================================================================
// COMPLEXITY CALCULATOR
// ============================================================================

/**
 * Weights for complexity calculation (can be empirically calibrated)
 */
export interface ComplexityWeights {
  nodeWeight: number;        // Per AST node
  depthWeight: number;       // Per nesting level (exponential)
  iterationWeight: number;   // Per loop iteration
  branchWeight: number;      // Per conditional branch
  dependencyWeight: number;  // Per item dependency
}

/**
 * Default weights (can be updated with empirical data)
 */
export const DEFAULT_COMPLEXITY_WEIGHTS: ComplexityWeights = {
  nodeWeight: 0.8,
  depthWeight: 2.5,
  iterationWeight: 0.3,
  branchWeight: 1.8,
  dependencyWeight: 2.2
};

/**
 * Validated weights (from student performance data)
 * These should be updated based on actual usage data
 */
export const VALIDATED_COMPLEXITY_WEIGHTS: ComplexityWeights = {
  nodeWeight: 0.8,
  depthWeight: 2.5,      // Higher than expected - nesting is HARD
  iterationWeight: 0.3,  // Lower than expected - repetition is easy
  branchWeight: 1.8,
  dependencyWeight: 2.2
};

/**
 * Calculate complexity with custom weights
 */
export function calculateComplexityWithWeights(
  code: string,
  weights: ComplexityWeights = DEFAULT_COMPLEXITY_WEIGHTS
): number {
  let score = 0;
  
  // Count nodes (approximate)
  const nodes = (code.match(/\b(for|if|while|func|def)\b/gi) || []).length;
  score += nodes * weights.nodeWeight;
  
  // Count nesting depth
  let maxDepth = 0;
  let currentDepth = 0;
  for (const char of code) {
    if (char === '{') currentDepth++;
    if (char === '}') currentDepth--;
    maxDepth = Math.max(maxDepth, currentDepth);
  }
  score += Math.pow(weights.depthWeight, maxDepth);
  
  // Count iterations
  const iterations = (code.match(/\d+/g) || [])
    .map(Number)
    .filter(n => n > 0 && n < 100)
    .reduce((a, b) => a + b, 0);
  score += iterations * weights.iterationWeight;
  
  // Count branches
  const branches = (code.match(/\bif\b/gi) || []).length;
  score += branches * weights.branchWeight;
  
  return Math.round(score);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get appropriate config for a grade level
 */
export function getConfigForGrade(gradeLevel: GradeLevel): {
  cognitive: CognitiveLoadConfig;
  noise: NoiseConfig;
  constraints: GenerationConstraints;
  dependencyStrategy: DependencyStrategy;
} {
  return {
    cognitive: COGNITIVE_LOAD_CONFIGS[gradeLevel],
    noise: NOISE_CONFIGS[gradeLevel],
    constraints: GENERATION_CONSTRAINTS[gradeLevel],
    dependencyStrategy: DEPENDENCY_STRATEGIES[gradeLevel]
  };
}

/**
 * Check if a concept is appropriate for a grade level
 */
export function isConceptAppropriate(
  concept: PedagogyConcept,
  gradeLevel: GradeLevel
): boolean {
  return COGNITIVE_LOAD_CONFIGS[gradeLevel].allowedConstructs.includes(concept);
}

/**
 * Get concepts appropriate for progression from current level
 */
export function getNextConcepts(
  currentConcepts: PedagogyConcept[],
  gradeLevel: GradeLevel
): PedagogyConcept[] {
  const allowed = COGNITIVE_LOAD_CONFIGS[gradeLevel].allowedConstructs;
  const currentMaxDifficulty = Math.max(
    0,
    ...currentConcepts.map(c => CONCEPT_DIFFICULTY[c])
  );
  
  return allowed.filter(concept => {
    // Not already learned
    if (currentConcepts.includes(concept)) return false;
    
    // Difficulty appropriate (max +2 jump)
    if (CONCEPT_DIFFICULTY[concept] > currentMaxDifficulty + 2) return false;
    
    // Prerequisites met
    const prereqs = CONCEPT_PREREQUISITES[concept] ?? [];
    return prereqs.every(p => currentConcepts.includes(p) || allowed.includes(p));
  });
}
