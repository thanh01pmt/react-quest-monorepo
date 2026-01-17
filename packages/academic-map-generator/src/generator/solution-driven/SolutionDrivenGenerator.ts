/**
 * Solution-Driven Map Generator
 * 
 * Main API for generating maps from code templates.
 */

import {
  CodeTemplate,
  SolutionDrivenResult,
  GenerationMetadata,
  Coord,
  GradeLevel,
  ParameterConfig,
  ExecutionTrace
} from './types';
import { TemplateInterpreter } from './TemplateInterpreter';
import { SolutionBuilder } from './SolutionBuilder';
import { Item, PathInfo } from '../../core';
import { AcademicConcept } from '../../analyzer';
import { SeededRandom } from './utils';
import {
  executePostProcessors,
  PostProcessorContext,
  Coord3D,
  GeneratedBlock
} from './post-processor';



// ============================================================================
// SOLUTION-DRIVEN GENERATOR
// ============================================================================

export class SolutionDrivenGenerator {
  private interpreter: TemplateInterpreter;
  private builder: SolutionBuilder;

  constructor() {
    this.interpreter = new TemplateInterpreter();
    this.builder = new SolutionBuilder();
  }

  /**
   * Generate a map from a template with random parameters
   */
  generate(template: CodeTemplate, seed?: string): SolutionDrivenResult {
    const actualSeed = seed || this.generateSeed();
    const rng = new SeededRandom(actualSeed);
    
    // Resolve parameters
    const params = this.resolveParameters(template, rng);
    
    return this.generateWithParams(template, params, actualSeed);
  }

  /**
   * Generate a map with specific parameter values
   */
  generateWithParams(
    template: CodeTemplate,
    params: Record<string, number>,
    seed?: string
  ): SolutionDrivenResult {
    const actualSeed = seed || this.generateSeed();
    const rng = new SeededRandom(actualSeed);

    // Execute template
    const trace = this.interpreter.execute(template, params, rng);
    
    // Apply post-processors if any
    let additionalBlocks: GeneratedBlock[] = [];
    if (trace.postProcessConfigs && trace.postProcessConfigs.length > 0) {
      const context: PostProcessorContext = {
        pathCoords: trace.pathCoords.map(c => ({ x: c[0], y: c[1], z: c[2] })),
        blocks: trace.pathCoords.map(c => ({ x: c[0], y: c[1] - 1, z: c[2], model: 'ground' })),
        interactibles: trace.items
          .filter(i => i.type === 'switch' || i.type === 'gate')
          .map(i => ({ type: i.type, position: { x: i.position[0], y: i.position[1], z: i.position[2] } }))
      };
      
      additionalBlocks = executePostProcessors(context, trace.postProcessConfigs);
      console.log('[SolutionDrivenGenerator] PostProcessor generated', additionalBlocks.length, 'blocks');
    }
    
    // Store additional blocks in trace for builder to use
    (trace as any).additionalBlocks = additionalBlocks;
    
    // Build output
    const pathInfo = this.builder.buildPathInfo(trace);
    const items = this.builder.buildItems(trace);
    const solution = this.builder.buildSolutionConfig(template, trace);
    
    // OVERRIDE: Use Transpiled Solution for optimal structure (AST-based)
    // BUT only for concepts that actually use loops/functions
    // Sequential templates should use basicSolution (fully expanded)
    const concept = template.concept;
    const usesAdvancedStructures = 
      concept.includes('loop') || 
      concept.includes('repeat') || 
      concept.includes('procedure') || 
      concept.includes('function') ||
      concept === 'nested_loop';
    
    if (usesAdvancedStructures) {
      try {
          const optimal = this.interpreter.transpile(template, params);
          console.log('[SolutionDrivenGenerator] Transpile result:', {
            hasProcedures: optimal?.procedures && Object.keys(optimal.procedures).length > 0,
            procedureNames: optimal?.procedures ? Object.keys(optimal.procedures) : [],
            mainLength: optimal?.main?.length
          });
          if (optimal) {
              solution.structuredSolution = optimal;
              // Recalculate optimal blocks based on AST structure
              solution.optimalBlocks = this.countBlocks(optimal);
          }
      } catch (e) {
          console.warn('Transpilation failed, falling back to trace solution', e);
      }
    } else {
      // For sequential templates, use basicSolution (no loops, no functions)
      console.log('[SolutionDrivenGenerator] Using basicSolution for sequential concept:', concept);
      solution.structuredSolution = solution.basicSolution!;
    }

    const gameConfig = this.builder.buildGameConfig(template, trace, actualSeed);
    
    // Build metadata
    const metadata: GenerationMetadata = {
      templateId: template.id,
      concept: template.concept,
      gradeLevel: template.gradeLevel,
      seed: actualSeed,
      generatedAt: new Date().toISOString(),
      resolvedParams: params,
      complexity: this.calculateComplexity(template, trace),
      pathLength: trace.pathCoords.length,
      itemCount: trace.items.length
    };

    return {
      pathInfo,
      items,
      trace,
      solution,
      gameConfig,
      metadata
    };
  }

  /**
   * Generate multiple variations of a template
   */
  generateVariations(template: CodeTemplate, count: number): SolutionDrivenResult[] {
    const results: SolutionDrivenResult[] = [];
    
    for (let i = 0; i < count; i++) {
      const seed = `${template.id}-var${i + 1}-${Date.now()}`;
      results.push(this.generate(template, seed));
    }
    
    return results;
  }

  /**
   * Generate a quick preview string (for debugging)
   */
  preview(template: CodeTemplate, params?: Record<string, number>): string {
    const result = params 
      ? this.generateWithParams(template, params)
      : this.generate(template);
    
    const lines: string[] = [
      `# Template: ${template.id}`,
      `Concept: ${template.concept}`,
      `Grade: ${template.gradeLevel}`,
      `Params: ${JSON.stringify(result.metadata.resolvedParams)}`,
      '',
      '## Path',
      `Length: ${result.trace.pathCoords.length} blocks`,
      `Start: [${result.trace.startPosition.join(', ')}]`,
      `End: [${result.trace.endPosition.join(', ')}]`,
      '',
      '## Items',
      `Count: ${result.trace.items.length}`,
      ...result.trace.items.map(i => `  - ${i.type} at [${i.position.join(', ')}]`),
      '',
      '## Actions (first 10)',
      ...result.solution.rawActions.slice(0, 10).map((a, i) => `  ${i + 1}. ${a}`)
    ];
    
    if (result.solution.rawActions.length > 10) {
      lines.push(`  ... and ${result.solution.rawActions.length - 10} more`);
    }
    
    return lines.join('\n');
  }

  // === Private helpers ===

  private generateSeed(): string {
    return `seed-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  private resolveParameters(template: CodeTemplate, rng: SeededRandom): Record<string, number> {
    const params: Record<string, number> = {};
    const configs = template.parameters;
    
    // Pass 1: Resolve independent parameters
    for (const config of configs) {
      const name = config.name;
      if (config.minRef || config.maxRef) continue;

      if (config.default !== undefined) {
        params[name] = config.default;
      } else if (config.min !== undefined && config.max !== undefined) {
        params[name] = rng.nextInt(config.min, config.max);
      } else {
        params[name] = config.min || 1;
      }
    }
    
    // Pass 2: Resolve dependent parameters
    for (const config of configs) {
      const name = config.name;
      if (!config.minRef && !config.maxRef) continue;

      let min = config.min !== undefined ? config.min : 1;
      let max = config.max !== undefined ? config.max : 10;
      
      if (config.minRef && params[config.minRef] !== undefined) {
        min = params[config.minRef];
      }
      
      if (config.maxRef && params[config.maxRef] !== undefined) {
        max = params[config.maxRef];
      }

      if (min > max) {
          const temp = min;
          min = max;
          max = temp;
      }
      
      params[name] = rng.nextInt(min, max);
    }
    
    return params;
  }

  private calculateComplexity(template: CodeTemplate, trace: ExecutionTrace): number {
    let score = 0;
    
    // Base complexity from concept
    const conceptScores: Partial<Record<AcademicConcept, number>> = {
      'sequential': 1,
      'repeat_n': 2,
      'repeat_until': 2,
      'nested_loop': 4,
      'if_simple': 3,
      'if_else': 3,
      'while_condition': 4,
      'procedure_simple': 4,
      'function_compose': 3
    };
    score += conceptScores[template.concept] || 2;
    
    // Add from loop iterations
    score += trace.loopIterations * 0.3;
    
    // Add from path length
    score += trace.pathCoords.length * 0.1;
    
    // Add from item count
    score += trace.items.length * 0.2;
    
    return Math.round(score);
  }

  private countBlocks(solution: any): number {
     let count = 0;
     const visit = (actions: any[]) => {
        if (!actions) return;
        for (const a of actions) {
           count++;
           if (a.do) visit(a.do);
           if (a.else) visit(a.else); // Assuming else branch might exist in some block defs
        }
     }
     visit(solution.main);
     return count;
  }
}

// ============================================================================
// TEMPLATE FACTORY
// ============================================================================

/**
 * Factory for creating common templates
 */
export class TemplateFactory {
  /**
   * Create a simple FOR loop template
   */
  static forLoop(
    id: string,
    gradeLevel: GradeLevel = '3-5',
    options: {
      minIterations?: number;
      maxIterations?: number;
      bodyActions?: string;
    } = {}
  ): CodeTemplate {
    const min = options.minIterations || 3;
    const max = options.maxIterations || 8;
    const body = options.bodyActions || 'moveForward(); pickCrystal()';
    
    return {
      id,
      code: `for i in 1 to $N { ${body} }`,
      parameters: [
        { name: 'N', type: 'int', min, max }
      ],
      concept: 'repeat_n',
      gradeLevel
    };
  }

  /**
   * Create a square loop template (FOR with turns)
   */
  static squareLoop(
    id: string,
    gradeLevel: GradeLevel = '3-5'
  ): CodeTemplate {
    return {
      id,
      code: 'for i in 1 to 4 { for j in 1 to $SIDE { moveForward(); pickCrystal() } turnRight() }',
      parameters: [
        { name: 'SIDE', type: 'int', min: 2, max: 5 }
      ],
      concept: 'nested_loop',
      gradeLevel
    };
  }

  /**
   * Create a zigzag template
   */
  static zigzag(
    id: string,
    gradeLevel: GradeLevel = '3-5'
  ): CodeTemplate {
    return {
      id,
      code: 'for i in 1 to $ROWS { for j in 1 to $COLS { moveForward(); pickCrystal() } turnRight(); moveForward(); turnRight() }',
      parameters: [
        { name: 'ROWS', type: 'int', min: 2, max: 4 },
        { name: 'COLS', type: 'int', min: 3, max: 6 }
      ],
      concept: 'nested_loop',
      gradeLevel
    };
  }
}

// ============================================================================
// CONVENIENCE FUNCTION
// ============================================================================

/**
 * Quick function to generate a map from a code string
 */
export function generateFromCode(
  code: string,
  options: {
    concept?: AcademicConcept;
    gradeLevel?: GradeLevel;
    params?: Record<string, number>;
    seed?: string;
  } = {}
): SolutionDrivenResult {
  // Auto-detect parameters from code
  const paramMatches = code.match(/\$(\w+)/g) || [];
  const parameters: ParameterConfig[] = [];
  const seen = new Set<string>();
  
  for (const match of paramMatches) {
    const name = match.slice(1);
    if (!seen.has(name)) {
      seen.add(name);
      parameters.push({ name, type: 'int', min: 3, max: 8 });
    }
  }

  const template: CodeTemplate = {
    id: `adhoc-${Date.now()}`,
    code,
    parameters,
    concept: options.concept || 'repeat_n',
    gradeLevel: options.gradeLevel || '3-5'
  };

  const generator = new SolutionDrivenGenerator();
  
  if (options.params) {
    return generator.generateWithParams(template, options.params, options.seed);
  }
  
  return generator.generate(template, options.seed);
}
