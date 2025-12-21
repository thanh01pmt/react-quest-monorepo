/**
 * Conditional Generators
 * 
 * Concepts covered:
 * - if_simple (Difficulty 3) ✅
 * - if_else (Difficulty 4) ✅
 * - if_elif_else (Difficulty 5) ✅
 * - switch_case (Difficulty 6) ✅
 * - nested_if (Difficulty 6) ✅
 * 
 * Map features used:
 * - Junction points (branching)
 * - Segments with different items
 * - Multiple areas
 */

import {
  PlacementContext,
  AcademicPlacement,
  ItemType,
  PathSegment,
  Vector3,
  CONCEPT_CURRICULUM,
  createDefaultSolution,
  getMainSegment,
  getEndpoints,
  getPointsOnSegment,
  findJunctionPoints,
  parseVectorKey,
  vectorEquals
} from './common';

// ============================================================================
// IF_SIMPLE GENERATORS (Difficulty 3)
// ============================================================================

/**
 * Generate if_simple placements - basic conditional check
 */
export function generateIfSimplePlacements(context: PlacementContext): AcademicPlacement[] {
  const placements: AcademicPlacement[] = [];
  const mainSegment = getMainSegment(context);
  
  if (!mainSegment || mainSegment.length < 4) return placements;
  
  const meta = CONCEPT_CURRICULUM['if_simple'];
  
  // === Pattern 1: If crystal ahead, collect ===
  const crystalPositions = getPointsOnSegment(mainSegment, 3, 1);
  if (crystalPositions.length >= 2) {
    placements.push({
      id: 'if_simple_crystal',
      name: 'If - kiểm tra crystal',
      concepts: ['if_simple'],
      primaryConcept: 'if_simple',
      difficulty: 3,
      items: crystalPositions.map((pos, i) => ({
        type: 'crystal' as ItemType,
        position: pos,
        groupId: 'sparse',
        patternRole: 'if_target'
      })),
      patternDescription: 'For each step: if hasCrystal → collect',
      expectedSolution: createDefaultSolution({
        hasConditional: true,
        conditionalType: 'if_simple',
        estimatedSteps: mainSegment.length + crystalPositions.length,
        estimatedBlocks: 6
      }),
      requiredBlocks: meta.blockTypes,
      tags: ['conditional', 'if', 'crystal'],
      educationalGoal: meta.learningGoal,
      prerequisiteConcepts: ['sequential']
    });
  }
  
  // === Pattern 2: If path ahead ===
  const [, end] = getEndpoints(mainSegment);
  placements.push({
    id: 'if_simple_path',
    name: 'If - kiểm tra đường đi',
    concepts: ['if_simple'],
    primaryConcept: 'if_simple',
    difficulty: 3,
    items: [
      ...mainSegment.points.slice(1, -1).map((pos, i) => ({
        type: 'crystal' as ItemType,
        position: pos,
        groupId: 'path',
        patternRole: 'collect'
      })),
      { type: 'goal' as ItemType, position: end, groupId: 'target', patternRole: 'goal' }
    ],
    patternDescription: 'While true: if pathAhead → move, else → done',
    expectedSolution: createDefaultSolution({
      hasConditional: true,
      conditionalType: 'if_simple',
      hasLoop: true,
      loopType: 'while_condition',
      estimatedSteps: mainSegment.length + 2,
      estimatedBlocks: 8
    }),
    requiredBlocks: meta.blockTypes,
    tags: ['conditional', 'if', 'path'],
    educationalGoal: 'Kiểm tra điều kiện môi trường trước khi hành động',
    prerequisiteConcepts: ['sequential']
  });
  
  return placements;
}

// ============================================================================
// IF_ELSE GENERATORS (Difficulty 4)
// ============================================================================

/**
 * Generate if_else placements - two-branch conditional
 */
export function generateIfElsePlacements(context: PlacementContext): AcademicPlacement[] {
  const placements: AcademicPlacement[] = [];
  const junctions = findJunctionPoints(context);
  const meta = CONCEPT_CURRICULUM['if_else'];
  
  // Need junction points for branching
  Array.from(junctions.entries()).forEach(([key, segmentIds]) => {
    const junctionPos = parseVectorKey(key);
    
    // Get first 2 branches (for if-else)
    const branches = segmentIds
      .slice(0, 3)
      .map(id => context.segments.find(s => s.id === id))
      .filter((s): s is PathSegment => s !== undefined);
    
    if (branches.length < 2) return;
    
    // Find endpoints of each branch
    const branchEnds = branches.map(seg => {
      const [start, end] = getEndpoints(seg);
      return vectorEquals(start, junctionPos) ? end : start;
    });
    
    // === Pattern 1: Basic if-else ===
    placements.push({
      id: `if_else_branch_${key}`,
      name: 'If-Else - chọn nhánh',
      concepts: ['if_else'],
      primaryConcept: 'if_else',
      difficulty: 4,
      items: [
        { type: 'crystal' as ItemType, position: branchEnds[0], groupId: 'if_branch', patternRole: 'if_target' },
        { type: 'gem' as ItemType, position: branchEnds[1], groupId: 'else_branch', patternRole: 'else_target' },
        { type: 'switch' as ItemType, position: junctionPos, groupId: 'decision', patternRole: 'condition' }
      ],
      patternDescription: 'If condition → go left, else → go right',
      expectedSolution: createDefaultSolution({
        hasConditional: true,
        conditionalType: 'if_else',
        estimatedSteps: 6,
        estimatedBlocks: 8
      }),
      requiredBlocks: meta.blockTypes,
      tags: ['conditional', 'if-else', 'branch'],
      educationalGoal: meta.learningGoal,
      prerequisiteConcepts: ['if_simple']
    });
    
    // === Pattern 2: If-else with collection ===
    if (branches[0].length >= 2 && branches[1].length >= 2) {
      placements.push({
        id: `if_else_collect_${key}`,
        name: 'If-Else - thu thập khác nhau',
        concepts: ['if_else', 'repeat_n'],
        primaryConcept: 'if_else',
        difficulty: 5,
        items: [
          // If branch - crystals
          ...branches[0].points.slice(0, 3).map((pos, i) => ({
            type: 'crystal' as ItemType,
            position: pos,
            groupId: 'if_branch',
            patternRole: 'if_collect'
          })),
          // Else branch - gems
          ...branches[1].points.slice(0, 3).map((pos, i) => ({
            type: 'gem' as ItemType,
            position: pos,
            groupId: 'else_branch',
            patternRole: 'else_collect'
          }))
        ],
        patternDescription: 'If condition → collect crystals, else → collect gems',
        expectedSolution: createDefaultSolution({
          hasConditional: true,
          conditionalType: 'if_else',
          hasLoop: true,
          loopType: 'repeat_n',
          estimatedSteps: 10,
          estimatedBlocks: 12
        }),
        requiredBlocks: [...meta.blockTypes, 'repeat_times'],
        tags: ['conditional', 'if-else', 'collect'],
        educationalGoal: 'Xử lý khác nhau cho mỗi nhánh điều kiện',
        prerequisiteConcepts: ['if_simple', 'repeat_n']
      });
    }
  });
  
  return placements;
}

// ============================================================================
// IF_ELIF_ELSE GENERATORS (Difficulty 5)
// ============================================================================

/**
 * Generate if_elif_else placements - multiple branch conditional
 */
export function generateIfElifElsePlacements(context: PlacementContext): AcademicPlacement[] {
  const placements: AcademicPlacement[] = [];
  const junctions = findJunctionPoints(context);
  const meta = CONCEPT_CURRICULUM['if_elif_else'];
  
  Array.from(junctions.entries()).forEach(([key, segmentIds]) => {
    // Need 3+ branches for elif
    if (segmentIds.length < 3) return;
    
    const junctionPos = parseVectorKey(key);
    const branches = segmentIds
      .slice(0, 4)
      .map(id => context.segments.find(s => s.id === id))
      .filter((s): s is PathSegment => s !== undefined);
    
    if (branches.length < 3) return;
    
    const branchEnds = branches.map(seg => {
      const [start, end] = getEndpoints(seg);
      return vectorEquals(start, junctionPos) ? end : start;
    });
    
    // === Pattern: Multiple branches ===
    placements.push({
      id: `if_elif_else_${key}`,
      name: 'If-Elif-Else - nhiều nhánh',
      concepts: ['if_elif_else'],
      primaryConcept: 'if_elif_else',
      difficulty: 5,
      items: [
        { type: 'crystal' as ItemType, position: branchEnds[0], groupId: 'if', patternRole: 'if_target' },
        { type: 'gem' as ItemType, position: branchEnds[1], groupId: 'elif', patternRole: 'elif_target' },
        { type: 'switch' as ItemType, position: branchEnds[2], groupId: 'else', patternRole: 'else_target' },
        { type: 'switch' as ItemType, position: junctionPos, groupId: 'decision', patternRole: 'condition' }
      ],
      patternDescription: 'If A → branch1, elif B → branch2, else → branch3',
      expectedSolution: createDefaultSolution({
        hasConditional: true,
        conditionalType: 'if_elif_else',
        estimatedSteps: 8,
        estimatedBlocks: 12
      }),
      requiredBlocks: meta.blockTypes,
      tags: ['conditional', 'if-elif-else', 'multi-branch'],
      educationalGoal: meta.learningGoal,
      prerequisiteConcepts: ['if_else']
    });
  });
  
  return placements;
}

// ============================================================================
// SWITCH_CASE GENERATORS (Difficulty 6)
// ============================================================================

/**
 * Generate switch_case placements - value-based branching
 */
export function generateSwitchCasePlacements(context: PlacementContext): AcademicPlacement[] {
  const placements: AcademicPlacement[] = [];
  
  // Need multiple areas or many branches
  if (context.areas.length < 3 && context.segments.length < 4) return placements;
  
  const meta = CONCEPT_CURRICULUM['switch_case'];
  
  // === Pattern 1: Switch on area type ===
  if (context.areas.length >= 3) {
    placements.push({
      id: 'switch_case_areas',
      name: 'Switch-Case - theo vùng',
      concepts: ['switch_case', 'collection'],
      primaryConcept: 'switch_case',
      difficulty: 6,
      items: context.areas.slice(0, 4).map((area, i) => ({
        type: (i % 2 === 0 ? 'crystal' : 'gem') as ItemType,
        position: { 
          x: Math.round(area.center.x), 
          y: Math.round(area.center.y) + 1, 
          z: Math.round(area.center.z) 
        },
        groupId: `area_${i}`,
        patternRole: `case_${i}`
      })),
      patternDescription: 'Switch(areaType): case 0 → ..., case 1 → ..., default → ...',
      expectedSolution: createDefaultSolution({
        hasConditional: true,
        conditionalType: 'switch_case',
        hasVariable: true,
        variableType: 'counter',
        estimatedSteps: 12,
        estimatedBlocks: 15
      }),
      requiredBlocks: meta.blockTypes,
      tags: ['conditional', 'switch', 'areas'],
      educationalGoal: meta.learningGoal,
      prerequisiteConcepts: ['if_elif_else']
    });
  }
  
  return placements;
}

// ============================================================================
// NESTED_IF GENERATORS (Difficulty 6)
// ============================================================================

/**
 * Generate nested_if placements - if inside if
 */
export function generateNestedIfPlacements(context: PlacementContext): AcademicPlacement[] {
  const placements: AcademicPlacement[] = [];
  const mainSegment = getMainSegment(context);
  
  if (!mainSegment || mainSegment.length < 6) return placements;
  
  const meta = CONCEPT_CURRICULUM['nested_if'];
  
  // === Pattern 1: Check two conditions ===
  const crystalPositions = getPointsOnSegment(mainSegment, 3, 1);
  const switchPositions = getPointsOnSegment(mainSegment, 3, 2);
  
  if (crystalPositions.length >= 2 && switchPositions.length >= 1) {
    placements.push({
      id: 'nested_if_two_conditions',
      name: 'Nested If - hai điều kiện',
      concepts: ['nested_if'],
      primaryConcept: 'nested_if',
      difficulty: 6,
      items: [
        ...crystalPositions.map((pos, i) => ({
          type: 'crystal' as ItemType,
          position: pos,
          groupId: 'crystals',
          patternRole: 'outer_if'
        })),
        ...switchPositions.map((pos, i) => ({
          type: 'switch' as ItemType,
          position: pos,
          groupId: 'switches',
          patternRole: 'inner_if'
        }))
      ],
      patternDescription: 'If pathAhead: if hasCrystal → collect, elif hasSwitch → toggle',
      expectedSolution: createDefaultSolution({
        hasConditional: true,
        conditionalType: 'nested_if',
        hasLoop: true,
        loopType: 'while_condition',
        estimatedSteps: mainSegment.length + crystalPositions.length + switchPositions.length,
        estimatedBlocks: 14
      }),
      requiredBlocks: meta.blockTypes,
      tags: ['conditional', 'nested-if', 'complex'],
      educationalGoal: meta.learningGoal,
      prerequisiteConcepts: ['if_else']
    });
  }
  
  // === Pattern 2: Direction + item check ===
  const junctions = findJunctionPoints(context);
  
  Array.from(junctions.entries()).slice(0, 1).forEach(([key, segmentIds]) => {
    const junctionPos = parseVectorKey(key);
    
    placements.push({
      id: `nested_if_direction_${key}`,
      name: 'Nested If - hướng + vật phẩm',
      concepts: ['nested_if'],
      primaryConcept: 'nested_if',
      difficulty: 7,
      items: [
        { type: 'switch' as ItemType, position: junctionPos, groupId: 'decision', patternRole: 'outer_check' },
        ...segmentIds.slice(0, 2).map((id, i) => {
          const seg = context.segments.find(s => s.id === id);
          if (!seg) return null;
          const [start, end] = getEndpoints(seg);
          const endPos = vectorEquals(start, junctionPos) ? end : start;
          return {
            type: (i === 0 ? 'crystal' : 'gem') as ItemType,
            position: endPos,
            groupId: `branch_${i}`,
            patternRole: 'inner_check'
          };
        }).filter(Boolean) as any[]
      ],
      patternDescription: 'If canGoLeft: if hasCrystal → collect, else: if canGoRight → go',
      expectedSolution: createDefaultSolution({
        hasConditional: true,
        conditionalType: 'nested_if',
        estimatedSteps: 10,
        estimatedBlocks: 16
      }),
      requiredBlocks: meta.blockTypes,
      tags: ['conditional', 'nested-if', 'direction'],
      educationalGoal: 'Kết hợp nhiều điều kiện phức tạp',
      prerequisiteConcepts: ['if_else']
    });
  });
  
  return placements;
}

// ============================================================================
// COMBINED EXPORT
// ============================================================================

/**
 * Generate all conditional-related placements
 */
export function generateAllConditionalPlacements(context: PlacementContext): AcademicPlacement[] {
  return [
    ...generateIfSimplePlacements(context),
    ...generateIfElsePlacements(context),
    ...generateIfElifElsePlacements(context),
    ...generateSwitchCasePlacements(context),
    ...generateNestedIfPlacements(context)
  ];
}

export default generateAllConditionalPlacements;
