/**
 * AcademicPlacementGenerator
 * 
 * Main entry point for generating academic placements based on map analysis.
 * Uses modular generators organized by concept category.
 * 
 * Coverage: 37/39 concepts = 95% ✅
 */

import type { PlacementContext, Vector3, PathSegment } from './MapAnalyzer';

// Import types from AcademicConceptTypes
import type {
  AcademicConcept,
  ItemType,
  ItemPlacement,
  AcademicPlacement,
  ExpectedSolution
} from './AcademicConceptTypes';

import { CONCEPT_CURRICULUM } from './AcademicConceptTypes';

// Import all generators
import { generateSequentialPlacements } from './generators/SequentialGenerators';
import { generateAllLoopPlacements } from './generators/LoopGenerators';
import { generateAllConditionalPlacements } from './generators/ConditionalGenerators';
import { generateAllFunctionPlacements } from './generators/FunctionGenerators';
import { generateAllVariablePlacements } from './generators/VariableGenerators';
import { generateAllCombinationPlacements } from './generators/CombinationGenerators';
import { GENERATOR_COVERAGE } from './generators/index';

// Re-export types for convenience
export type {
  AcademicConcept,
  ItemType,
  ItemPlacement,
  AcademicPlacement,
  ExpectedSolution
};

export { CONCEPT_CURRICULUM };

// ============================================================================
// PLACEMENT OPPORTUNITY ANALYSIS
// ============================================================================

export interface PlacementOpportunity {
  type: string;
  description: string;
  segments?: string[];
  positions?: Vector3[];
  concepts: AcademicConcept[];
  potentialDifficulty: [number, number];
}

/**
 * Analyze opportunities from PlacementContext
 */
function analyzeOpportunities(context: PlacementContext): PlacementOpportunity[] {
  const opportunities: PlacementOpportunity[] = [];
  
  // 1. Main path analysis
  const sortedSegments = [...context.segments].sort((a, b) => b.length - a.length);
  const mainSegment = sortedSegments[0];
  
  if (mainSegment && mainSegment.length >= 3) {
    opportunities.push({
      type: 'MAIN_PATH_LOOP',
      description: `Main segment (${mainSegment.id}) có ${mainSegment.length + 1} blocks - có thể tạo loop pattern`,
      segments: [mainSegment.id],
      positions: mainSegment.points,
      concepts: ['repeat_n', 'sequential'],
      potentialDifficulty: [2, 5]
    });
  }
  
  // 2. Symmetric relations
  const symmetricRelations = context.relations.filter(
    r => r.type === 'axis_symmetric' || r.type === 'point_symmetric'
  );
  
  if (symmetricRelations.length > 0) {
    for (const rel of symmetricRelations) {
      const seg1 = context.segments.find(s => s.id === rel.path1Id);
      const seg2 = context.segments.find(s => s.id === rel.path2Id);
      
      if (seg1 && seg2) {
        opportunities.push({
          type: 'SYMMETRIC_BRANCHES',
          description: `${seg1.id} và ${seg2.id} đối xứng - lý tưởng cho function reuse`,
          segments: [seg1.id, seg2.id],
          positions: [...seg1.points, ...seg2.points],
          concepts: ['procedure_simple', 'loop_function_call'],
          potentialDifficulty: [4, 7]
        });
      }
    }
  }
  
  // 3. Perpendicular relations
  const perpendicularRelations = context.relations.filter(r => r.type === 'perpendicular');
  
  if (perpendicularRelations.length >= 2) {
    opportunities.push({
      type: 'PERPENDICULAR_BRANCHES',
      description: `${perpendicularRelations.length} cặp vuông góc - có thể tạo conditional hoặc function`,
      concepts: ['if_else', 'procedure_simple'],
      potentialDifficulty: [5, 8]
    });
  }
  
  // 4. Parallel relations
  const parallelRelations = context.relations.filter(r => r.type === 'parallel_axis');
  
  if (parallelRelations.length >= 2) {
    opportunities.push({
      type: 'PARALLEL_SEGMENTS',
      description: `${parallelRelations.length} cặp song song - có thể tạo nested loop`,
      concepts: ['nested_loop', 'repeat_n'],
      potentialDifficulty: [6, 9]
    });
  }
  
  // 5. Multi-area analysis
  if (context.areas.length > 1) {
    opportunities.push({
      type: 'MULTI_AREA',
      description: `${context.areas.length} areas riêng biệt - có thể tạo function cho mỗi area`,
      concepts: ['procedure_simple', 'for_each'],
      potentialDifficulty: [5, 8]
    });
  }
  
  // 6. Connectors
  if (context.connectors.length > 0) {
    opportunities.push({
      type: 'CONNECTORS',
      description: `${context.connectors.length} connectors nối các areas - điểm chuyển tiếp`,
      concepts: ['sequential', 'if_simple'],
      potentialDifficulty: [3, 6]
    });
  }
  
  // 7. Detected patterns
  for (const pattern of context.patterns) {
    if (pattern.type === 'repeat') {
      opportunities.push({
        type: 'DETECTED_REPEAT_PATTERN',
        description: `Pattern lặp ${pattern.repetitions} lần - loop rõ ràng`,
        segments: pattern.unitElements,
        concepts: ['repeat_n'],
        potentialDifficulty: [3, 5]
      });
    }
    
    if (pattern.type === 'mirror') {
      opportunities.push({
        type: 'DETECTED_MIRROR_PATTERN',
        description: `Pattern mirror/đối xứng - function reuse`,
        segments: pattern.unitElements,
        concepts: ['procedure_simple', 'loop_function_call'],
        potentialDifficulty: [4, 7]
      });
    }
  }
  
  return opportunities;
}

// ============================================================================
// MAIN CLASS
// ============================================================================

export class AcademicPlacementGenerator {
  private context: PlacementContext;
  
  constructor(context: PlacementContext) {
    this.context = context;
  }
  
  /**
   * Get coverage statistics
   */
  static getCoverage() {
    return {
      ...GENERATOR_COVERAGE,
      summary: `${GENERATOR_COVERAGE.totalImplemented}/${GENERATOR_COVERAGE.totalConcepts} concepts = ${GENERATOR_COVERAGE.percentage}%`
    };
  }
  
  /**
   * Analyze opportunities in map
   */
  getOpportunities(): PlacementOpportunity[] {
    return analyzeOpportunities(this.context);
  }
  
  /**
   * Generate all placements from all categories
   */
  generateAll(): AcademicPlacement[] {
    const allPlacements: AcademicPlacement[] = [
      // Easiest first
      ...generateSequentialPlacements(this.context),
      ...generateAllLoopPlacements(this.context),
      ...generateAllConditionalPlacements(this.context),
      ...generateAllVariablePlacements(this.context),
      ...generateAllFunctionPlacements(this.context),
      ...generateAllCombinationPlacements(this.context)
    ];
    
    // Sort by difficulty
    return allPlacements.sort((a, b) => a.difficulty - b.difficulty);
  }
  
  /**
   * Generate placements for a specific concept
   */
  generateForConcept(concept: AcademicConcept): AcademicPlacement[] {
    const all = this.generateAll();
    return all.filter(p => 
      p.primaryConcept === concept || p.concepts.includes(concept)
    );
  }
  
  /**
   * Generate placements within difficulty range
   */
  generateByDifficulty(minDifficulty: number, maxDifficulty: number): AcademicPlacement[] {
    return this.generateAll().filter(
      p => p.difficulty >= minDifficulty && p.difficulty <= maxDifficulty
    );
  }
  
  /**
   * Generate placements based on mastered concepts
   */
  generateForMasteredConcepts(masteredConcepts: AcademicConcept[]): AcademicPlacement[] {
    return this.generateAll().filter(p => 
      p.prerequisiteConcepts.every(prereq => masteredConcepts.includes(prereq))
    );
  }
  
  /**
   * Generate placements by category
   */
  generateByCategory(category: 'sequential' | 'loop' | 'conditional' | 'function' | 'variable' | 'combination'): AcademicPlacement[] {
    switch (category) {
      case 'sequential':
        return generateSequentialPlacements(this.context);
      case 'loop':
        return generateAllLoopPlacements(this.context);
      case 'conditional':
        return generateAllConditionalPlacements(this.context);
      case 'function':
        return generateAllFunctionPlacements(this.context);
      case 'variable':
        return generateAllVariablePlacements(this.context);
      case 'combination':
        return generateAllCombinationPlacements(this.context);
      default:
        return [];
    }
  }
  
  /**
   * Get summary for UI
   */
  getSummary(): {
    totalSegments: number;
    totalAreas: number;
    availableConcepts: AcademicConcept[];
    difficultyRange: [number, number];
    placementCount: number;
    byCategory: Record<string, number>;
    recommendedPlacements: AcademicPlacement[];
  } {
    const allPlacements = this.generateAll();
    const concepts = Array.from(new Set(allPlacements.flatMap(p => p.concepts)));
    const difficulties = allPlacements.map(p => p.difficulty);
    
    // Count by category
    const byCategory: Record<string, number> = {
      sequential: generateSequentialPlacements(this.context).length,
      loop: generateAllLoopPlacements(this.context).length,
      conditional: generateAllConditionalPlacements(this.context).length,
      variable: generateAllVariablePlacements(this.context).length,
      function: generateAllFunctionPlacements(this.context).length,
      combination: generateAllCombinationPlacements(this.context).length
    };
    
    return {
      totalSegments: this.context.segments.length,
      totalAreas: this.context.areas.length,
      availableConcepts: concepts,
      difficultyRange: difficulties.length > 0 
        ? [Math.min(...difficulties), Math.max(...difficulties)]
        : [0, 0],
      placementCount: allPlacements.length,
      byCategory,
      recommendedPlacements: allPlacements.slice(0, 5)
    };
  }
}

// ============================================================================
// TEST FUNCTION
// ============================================================================

export function testAcademicGenerator(context: PlacementContext): {
  opportunities: PlacementOpportunity[];
  summary: ReturnType<AcademicPlacementGenerator['getSummary']>;
  allPlacements: AcademicPlacement[];
} {
  console.log('\n' + '='.repeat(60));
  console.log('ACADEMIC PLACEMENT GENERATOR');
  console.log('='.repeat(60));
  
  // Coverage
  const coverage = AcademicPlacementGenerator.getCoverage();
  console.log(`\n📊 COVERAGE: ${coverage.summary}`);
  console.log(`  Sequential: ${coverage.sequential.implemented}/${coverage.sequential.total}`);
  console.log(`  Loop: ${coverage.loop.implemented}/${coverage.loop.total}`);
  console.log(`  Conditional: ${coverage.conditional.implemented}/${coverage.conditional.total}`);
  console.log(`  Function: ${coverage.function.implemented}/${coverage.function.total}`);
  console.log(`  Variable: ${coverage.variable.implemented}/${coverage.variable.total}`);
  console.log(`  Combination: ${coverage.combination.implemented}/${coverage.combination.total}`);
  
  const generator = new AcademicPlacementGenerator(context);
  
  // Opportunities
  console.log('\n📊 OPPORTUNITIES DETECTED');
  console.log('-'.repeat(40));
  const opportunities = generator.getOpportunities();
  for (const opp of opportunities) {
    console.log(`\n  [${opp.type}]`);
    console.log(`    ${opp.description}`);
    console.log(`    Concepts: ${opp.concepts.join(', ')}`);
    console.log(`    Difficulty: ${opp.potentialDifficulty[0]}-${opp.potentialDifficulty[1]}`);
  }
  
  // Summary
  console.log('\n📊 SUMMARY');
  console.log('-'.repeat(40));
  const summary = generator.getSummary();
  console.log(`  Segments: ${summary.totalSegments}`);
  console.log(`  Areas: ${summary.totalAreas}`);
  console.log(`  Total placements: ${summary.placementCount}`);
  console.log(`  By category:`);
  for (const [cat, count] of Object.entries(summary.byCategory)) {
    console.log(`    - ${cat}: ${count}`);
  }
  console.log(`  Available concepts: ${summary.availableConcepts.join(', ')}`);
  console.log(`  Difficulty range: ${summary.difficultyRange[0]} - ${summary.difficultyRange[1]}`);
  
  // All placements
  console.log('\n📊 GENERATED PLACEMENTS');
  console.log('-'.repeat(40));
  const allPlacements = generator.generateAll();
  
  for (const placement of allPlacements) {
    console.log(`\n  [${placement.id}] ${placement.name}`);
    console.log(`    Primary: ${placement.primaryConcept} | All: ${placement.concepts.join(', ')}`);
    console.log(`    Difficulty: ${placement.difficulty}/10 | Items: ${placement.items.length}`);
    console.log(`    Pattern: ${placement.patternDescription}`);
    console.log(`    Blocks: ${placement.requiredBlocks.join(', ')}`);
    console.log(`    Prerequisites: ${placement.prerequisiteConcepts.join(', ') || 'None'}`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('GENERATION COMPLETE');
  console.log('='.repeat(60));
  
  return { opportunities, summary, allPlacements };
}

export default AcademicPlacementGenerator;
