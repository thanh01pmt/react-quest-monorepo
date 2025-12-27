/**
 * Code Template Specification
 * 
 * Defines the structure for educational code templates used in Solution-Driven generation.
 */

import {
  PedagogyConcept,
  GradeLevel,
  BloomLevel,
  DifficultyLevel,
  ItemType,
  NoiseLevel,
  DependencyStrategy,
  MetricsRange
} from './core-types';

// ============================================================================
// TEMPLATE TIERS
// ============================================================================

/**
 * Minimal Template (MVP - V1)
 * Quick to create, auto-infers missing properties
 */
export interface MinimalTemplate {
  id: string;
  code: string;
  parameters: ParameterDef[];
  gradeLevel: GradeLevel;
}

/**
 * Standard Template (V2)
 * Full pedagogical context
 */
export interface StandardTemplate extends MinimalTemplate {
  name: string;
  category: PedagogyConcept;
  learningObjective: string;
  expectedMetrics: MetricsRange;
  constraints: GenerationConstraints;
}

/**
 * Full Template (V3 - Enterprise)
 * Complete specification with validation and testing
 */
export interface FullTemplate extends StandardTemplate {
  version: string;
  syntax: CodeSyntax;
  difficultyLevel: DifficultyLevel;
  bloomLevel: BloomLevel;
  priorKnowledge: string[];
  validation: ValidationConfig;
  testCases: TestCase[];
  studentFacing: StudentFacingInfo;
  author: AuthorInfo;
}

// Alias for full template
export type CodeTemplate = FullTemplate;

// ============================================================================
// PARAMETER DEFINITIONS
// ============================================================================

/**
 * Parameter types
 */
export type ParameterType = 'int' | 'bool' | 'enum' | 'string';

/**
 * Parameter definition for code templates
 */
export interface ParameterDef {
  /** Parameter name (used as $NAME in code) */
  name: string;
  
  /** Parameter type */
  type: ParameterType;
  
  /** Range for int parameters */
  range?: [min: number, max: number];
  
  /** Options for enum parameters */
  options?: any[];
  
  /** Default value */
  default?: any;
  
  /** Human-readable description */
  description: string;
  
  /** Whether this parameter affects pedagogy */
  pedagogicallyRelevant?: boolean;
}

// ============================================================================
// CODE SYNTAX
// ============================================================================

/**
 * Supported code syntaxes
 */
export type CodeSyntax = 'swift-like' | 'scratch-like' | 'python-like' | 'blockly';

/**
 * Syntax examples
 */
export const SYNTAX_EXAMPLES: Record<CodeSyntax, string> = {
  'swift-like': `
for i in 1 to 5 {
    moveForward()
    if crystalAhead {
        pickCrystal()
    }
}
`,
  'scratch-like': `
repeat 5 times
    move forward
    if touching crystal
        pick up
    end
end
`,
  'python-like': `
for i in range(1, 6):
    move_forward()
    if crystal_ahead():
        pick_crystal()
`,
  'blockly': `
<!-- Blockly XML representation -->
`
};

// ============================================================================
// CONSTRAINTS
// ============================================================================

/**
 * Generation constraints for templates
 */
export interface GenerationConstraints {
  /** Maximum nesting depth for loops/conditionals */
  maxNestingDepth: number;
  
  /** Maximum complexity score (see complexity calculator) */
  maxComplexityScore: number;
  
  /** Maximum path length in steps */
  maxPathLength?: number;
  
  /** Maximum number of items */
  maxItems?: number;
  
  /** Item types that MUST be present */
  requiredItems: ItemType[];
  
  /** Item types that MUST NOT be present */
  forbiddenItems: ItemType[];
  
  /** Noise level for hybrid generation */
  noiseLevel: NoiseLevel;
  
  /** Dependency placement strategy */
  dependencyStrategy?: DependencyStrategy;
}

/**
 * Default constraints by grade level
 */
export const DEFAULT_CONSTRAINTS: Record<GradeLevel, GenerationConstraints> = {
  'K-2': {
    maxNestingDepth: 1,
    maxComplexityScore: 10,
    maxPathLength: 10,
    maxItems: 5,
    requiredItems: [],
    forbiddenItems: [ItemType.SWITCH, ItemType.GATE],
    noiseLevel: 'none',
    dependencyStrategy: DependencyStrategy.BALANCED
  },
  '3-5': {
    maxNestingDepth: 2,
    maxComplexityScore: 25,
    maxPathLength: 20,
    maxItems: 10,
    requiredItems: [],
    forbiddenItems: [],
    noiseLevel: 'low',
    dependencyStrategy: DependencyStrategy.BALANCED
  },
  '6-8': {
    maxNestingDepth: 2,
    maxComplexityScore: 50,
    maxPathLength: 40,
    maxItems: 20,
    requiredItems: [],
    forbiddenItems: [],
    noiseLevel: 'medium',
    dependencyStrategy: DependencyStrategy.PROGRESSIVE
  },
  '9-12': {
    maxNestingDepth: 3,
    maxComplexityScore: 100,
    maxPathLength: 80,
    maxItems: 40,
    requiredItems: [],
    forbiddenItems: [],
    noiseLevel: 'high',
    dependencyStrategy: DependencyStrategy.PUZZLE
  }
};

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validation configuration
 */
export interface ValidationConfig {
  /** Student code must be optimal to pass */
  mustBeOptimal: boolean;
  
  /** Multiple solutions are acceptable */
  allowAlternatives: boolean;
  
  /** Concepts that MUST be used in solution */
  requiredConcepts: PedagogyConcept[];
  
  /** Maximum allowed steps */
  maxSteps?: number;
  
  /** Minimum items that must be collected */
  minItemsRequired?: number;
  
  /** Custom validation function (serialized) */
  customValidation?: string;
}

/**
 * Test case for template validation
 */
export interface TestCase {
  /** Test case name */
  name: string;
  
  /** Parameter values for this test */
  input: Record<string, any>;
  
  /** Expected output */
  expectedOutput: ExpectedOutput;
  
  /** Description of what this tests */
  description: string;
  
  /** Whether this is an edge case */
  isEdgeCase?: boolean;
}

/**
 * Expected output for test case
 */
export interface ExpectedOutput {
  /** Number of items that should be collected */
  itemsCollected?: number;
  
  /** Specific items that should be collected */
  specificItems?: ItemType[];
  
  /** Expected path length */
  pathLength?: number;
  
  /** Whether goal should be reached */
  reachesGoal?: boolean;
  
  /** Pattern correctness check */
  correctPattern?: boolean;
  
  /** Any expected errors */
  expectedErrors?: string[];
}

// ============================================================================
// STUDENT-FACING INFO
// ============================================================================

/**
 * Information displayed to students
 */
export interface StudentFacingInfo {
  /** Display title */
  title: string;
  
  /** Challenge description */
  description: string;
  
  /** Optional hint */
  hint?: string;
  
  /** Visual preview URL */
  visualPreview?: string;
  
  /** Story/narrative context */
  storyContext?: string;
  
  /** Success message */
  successMessage?: string;
  
  /** Failure message */
  failureMessage?: string;
}

// ============================================================================
// AUTHOR INFO
// ============================================================================

/**
 * Author and metadata information
 */
export interface AuthorInfo {
  /** Author name or team */
  author: string;
  
  /** Creation date */
  createdAt: Date;
  
  /** Last modification date */
  lastModifiedAt: Date;
  
  /** Review status */
  reviewStatus: 'draft' | 'review' | 'approved' | 'deprecated';
  
  /** Version notes */
  versionNotes?: string;
  
  /** Reviewer name */
  reviewedBy?: string;
  
  /** Tags for categorization */
  tags?: string[];
}

// ============================================================================
// TEMPLATE FACTORY
// ============================================================================

/**
 * Factory for creating templates at different tiers
 */
export class TemplateFactory {
  /**
   * Create minimal template (quick creation)
   */
  static createMinimal(
    code: string,
    gradeLevel: GradeLevel
  ): MinimalTemplate {
    return {
      id: TemplateFactory.generateId(),
      code: code.trim(),
      parameters: TemplateFactory.autoDetectParameters(code),
      gradeLevel
    };
  }
  
  /**
   * Upgrade minimal to standard (auto-infer missing)
   */
  static upgradeToStandard(
    minimal: MinimalTemplate,
    overrides?: Partial<StandardTemplate>
  ): StandardTemplate {
    return {
      ...minimal,
      name: overrides?.name ?? TemplateFactory.inferName(minimal.code),
      category: overrides?.category ?? TemplateFactory.inferCategory(minimal.code),
      learningObjective: overrides?.learningObjective ?? TemplateFactory.inferObjective(minimal),
      expectedMetrics: overrides?.expectedMetrics ?? TemplateFactory.inferMetrics(minimal),
      constraints: overrides?.constraints ?? DEFAULT_CONSTRAINTS[minimal.gradeLevel]
    };
  }
  
  /**
   * Upgrade standard to full
   */
  static upgradeToFull(
    standard: StandardTemplate,
    author: string,
    overrides?: Partial<FullTemplate>
  ): FullTemplate {
    const now = new Date();
    
    return {
      ...standard,
      version: overrides?.version ?? '1.0.0',
      syntax: overrides?.syntax ?? 'swift-like',
      difficultyLevel: overrides?.difficultyLevel ?? TemplateFactory.inferDifficulty(standard),
      bloomLevel: overrides?.bloomLevel ?? TemplateFactory.inferBloomLevel(standard),
      priorKnowledge: overrides?.priorKnowledge ?? [],
      validation: overrides?.validation ?? {
        mustBeOptimal: false,
        allowAlternatives: true,
        requiredConcepts: [standard.category]
      },
      testCases: overrides?.testCases ?? TemplateFactory.generateDefaultTestCases(standard),
      studentFacing: overrides?.studentFacing ?? {
        title: standard.name,
        description: standard.learningObjective
      },
      author: overrides?.author ?? {
        author,
        createdAt: now,
        lastModifiedAt: now,
        reviewStatus: 'draft'
      }
    };
  }
  
  // ---- Helper methods ----
  
  private static generateId(): string {
    return `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private static autoDetectParameters(code: string): ParameterDef[] {
    const params: ParameterDef[] = [];
    const regex = /\$(\w+)/g;
    let match;
    
    while ((match = regex.exec(code)) !== null) {
      const name = match[1];
      
      // Avoid duplicates
      if (!params.find(p => p.name === name)) {
        params.push({
          name,
          type: 'int',
          range: [1, 10],
          default: 5,
          description: `Parameter ${name}`
        });
      }
    }
    
    return params;
  }
  
  private static inferName(code: string): string {
    if (code.includes('for') && code.includes('for')) {
      return 'Nested Loop Challenge';
    }
    if (code.includes('for')) {
      return 'Loop Challenge';
    }
    if (code.includes('if')) {
      return 'Conditional Challenge';
    }
    if (code.includes('while')) {
      return 'While Loop Challenge';
    }
    return 'Coding Challenge';
  }
  
  private static inferCategory(code: string): PedagogyConcept {
    // Check for nested structures first
    if ((code.match(/for/g) || []).length >= 2) {
      return PedagogyConcept.NESTED_FOR;
    }
    if ((code.match(/if/g) || []).length >= 2) {
      return PedagogyConcept.NESTED_IF;
    }
    
    // Single structures
    if (code.includes('while')) {
      return PedagogyConcept.WHILE_CONDITION;
    }
    if (code.includes('for')) {
      return PedagogyConcept.FOR_COUNTED;
    }
    if (code.includes('if')) {
      return PedagogyConcept.IF_SIMPLE;
    }
    
    return PedagogyConcept.SEQUENCE;
  }
  
  private static inferObjective(template: MinimalTemplate): string {
    const category = TemplateFactory.inferCategory(template.code);
    
    const objectives: Record<PedagogyConcept, string> = {
      [PedagogyConcept.SEQUENCE]: 'Learn to execute commands in sequence',
      [PedagogyConcept.FOR_COUNTED]: 'Understand for loops with fixed iterations',
      [PedagogyConcept.NESTED_FOR]: 'Master nested for loops for 2D patterns',
      [PedagogyConcept.IF_SIMPLE]: 'Learn basic conditional statements',
      [PedagogyConcept.NESTED_IF]: 'Handle complex conditional logic',
      [PedagogyConcept.WHILE_CONDITION]: 'Use while loops with conditions',
      // ... other concepts
    } as Record<PedagogyConcept, string>;
    
    return objectives[category] ?? 'Complete the coding challenge';
  }
  
  private static inferMetrics(template: MinimalTemplate): MetricsRange {
    // Estimate based on parameters
    const params = template.parameters;
    const maxParam = params.reduce((max, p) => {
      if (p.type === 'int' && p.range) {
        return Math.max(max, p.range[1]);
      }
      return max;
    }, 5);
    
    return {
      pathLengthRange: [maxParam, maxParam * 3],
      itemCountRange: [maxParam, maxParam * 2],
      branchCountRange: [0, 2],
      estimatedTimeMinutes: Math.ceil(maxParam / 2)
    };
  }
  
  private static inferDifficulty(template: StandardTemplate): DifficultyLevel {
    const gradeMap: Record<GradeLevel, DifficultyLevel> = {
      'K-2': 1,
      '3-5': 2,
      '6-8': 3,
      '9-12': 4
    };
    
    let base = gradeMap[template.gradeLevel];
    
    // Adjust for complexity
    if (template.category === PedagogyConcept.NESTED_FOR) base++;
    if (template.category === PedagogyConcept.NESTED_IF) base++;
    
    return Math.min(5, base) as DifficultyLevel;
  }
  
  private static inferBloomLevel(template: StandardTemplate): BloomLevel {
    const categoryMap: Partial<Record<PedagogyConcept, BloomLevel>> = {
      [PedagogyConcept.SEQUENCE]: 'Remember',
      [PedagogyConcept.FOR_COUNTED]: 'Understand',
      [PedagogyConcept.IF_SIMPLE]: 'Understand',
      [PedagogyConcept.NESTED_FOR]: 'Apply',
      [PedagogyConcept.NESTED_IF]: 'Apply',
      [PedagogyConcept.WHILE_CONDITION]: 'Apply',
      [PedagogyConcept.OPTIMIZATION]: 'Analyze',
      [PedagogyConcept.ALGORITHM_DESIGN]: 'Create'
    };
    
    return categoryMap[template.category] ?? 'Apply';
  }
  
  private static generateDefaultTestCases(template: StandardTemplate): TestCase[] {
    const cases: TestCase[] = [];
    
    // Generate test case for default values
    const defaultInputs: Record<string, any> = {};
    for (const param of template.parameters) {
      defaultInputs[param.name] = param.default;
    }
    
    cases.push({
      name: 'Default values',
      input: defaultInputs,
      expectedOutput: {
        reachesGoal: true,
        correctPattern: true
      },
      description: 'Test with default parameter values'
    });
    
    // Generate edge cases for int parameters
    for (const param of template.parameters) {
      if (param.type === 'int' && param.range) {
        // Min value
        cases.push({
          name: `${param.name} minimum`,
          input: { ...defaultInputs, [param.name]: param.range[0] },
          expectedOutput: { reachesGoal: true },
          description: `Test with minimum ${param.name}`,
          isEdgeCase: true
        });
        
        // Max value
        cases.push({
          name: `${param.name} maximum`,
          input: { ...defaultInputs, [param.name]: param.range[1] },
          expectedOutput: { reachesGoal: true },
          description: `Test with maximum ${param.name}`,
          isEdgeCase: true
        });
      }
    }
    
    return cases;
  }
}

// ============================================================================
// EXAMPLE TEMPLATES
// ============================================================================

export const EXAMPLE_TEMPLATES: FullTemplate[] = [
  {
    id: 'for-simple-001',
    version: '1.0.0',
    name: 'Collect N Crystals',
    category: PedagogyConcept.FOR_COUNTED,
    gradeLevel: '3-5',
    difficultyLevel: 2,
    bloomLevel: 'Understand',
    learningObjective: 'Hiểu for loop với số lần lặp cố định',
    priorKnowledge: ['sequence', 'basic-movement'],
    
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
        description: 'Số lần lặp',
        pedagogicallyRelevant: true
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
    },
    
    validation: {
      mustBeOptimal: false,
      allowAlternatives: true,
      requiredConcepts: [PedagogyConcept.FOR_COUNTED]
    },
    
    testCases: [
      {
        name: 'Standard case',
        input: { N: 5 },
        expectedOutput: { itemsCollected: 5, pathLength: 5, reachesGoal: true },
        description: 'Collect 5 crystals in a line'
      },
      {
        name: 'Minimum',
        input: { N: 3 },
        expectedOutput: { itemsCollected: 3 },
        description: 'Minimum crystals',
        isEdgeCase: true
      }
    ],
    
    studentFacing: {
      title: '💎 Crystal Collection',
      description: 'Use a loop to collect all the crystals!',
      hint: 'Think about how many times you need to repeat the action.',
      successMessage: 'Great job! You used a for loop efficiently!'
    },
    
    author: {
      author: 'Curriculum Team',
      createdAt: new Date('2025-01-15'),
      lastModifiedAt: new Date('2025-01-20'),
      reviewStatus: 'approved',
      tags: ['loops', 'beginner', 'crystals']
    }
  }
];
