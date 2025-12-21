/**
 * Function Generators
 * 
 * Concepts covered:
 * - procedure_simple (Difficulty 4) ✅
 * - procedure_with_param (Difficulty 6) ✅
 * - function_return (Difficulty 7) ✅
 * - function_compose (Difficulty 7) ✅
 * - recursion (Difficulty 9) ✅
 * 
 * Map features used:
 * - Symmetric segments (for function reuse)
 * - Perpendicular branches (for hub-spoke)
 * - Multiple areas (for function per area)
 */

import {
  PlacementContext,
  AcademicPlacement,
  ItemType,
  PathSegment,
  CONCEPT_CURRICULUM,
  createDefaultSolution,
  getMainSegment,
  getEndpoints,
  getPointsOnSegment,
  getSymmetricPairs,
  getPerpendicularBranches
} from './common';

// ============================================================================
// PROCEDURE_SIMPLE GENERATORS (Difficulty 4)
// ============================================================================

/**
 * Generate procedure_simple placements - basic reusable procedures
 */
export function generateProcedureSimplePlacements(context: PlacementContext): AcademicPlacement[] {
  const placements: AcademicPlacement[] = [];
  const meta = CONCEPT_CURRICULUM['procedure_simple'];
  
  // === Pattern 1: Symmetric branches (best for function reuse) ===
  const symmetricPairs = getSymmetricPairs(context);
  
  for (const [seg1, seg2] of symmetricPairs) {
    placements.push({
      id: `procedure_symmetric_${seg1.id}_${seg2.id}`,
      name: 'Procedure - nhánh đối xứng',
      concepts: ['procedure_simple'],
      primaryConcept: 'procedure_simple',
      difficulty: 4,
      items: [
        ...seg1.points.map((pos, i) => ({
          type: 'crystal' as ItemType,
          position: pos,
          groupId: 'branch_a',
          patternRole: i === 0 ? 'first' : 'repeat'
        })),
        ...seg2.points.map((pos, i) => ({
          type: 'crystal' as ItemType,
          position: pos,
          groupId: 'branch_b',
          patternRole: i === 0 ? 'first' : 'repeat'
        }))
      ],
      patternDescription: 'Define processBranch(), call twice for symmetric branches',
      expectedSolution: createDefaultSolution({
        hasProcedure: true,
        procedureCount: 1,
        estimatedSteps: seg1.length + seg2.length + 4,
        estimatedBlocks: 6 + seg1.length
      }),
      requiredBlocks: meta.blockTypes,
      tags: ['function', 'procedure', 'symmetric', 'reuse'],
      educationalGoal: meta.learningGoal,
      prerequisiteConcepts: ['repeat_n']
    });
  }
  
  // === Pattern 2: Hub and spoke (multiple calls) ===
  const mainSegment = getMainSegment(context);
  if (mainSegment) {
    const branches = getPerpendicularBranches(context, mainSegment.id);
    
    if (branches.length >= 2) {
      // Check if branches are similar length
      const avgLength = branches.reduce((sum, b) => sum + b.length, 0) / branches.length;
      const similarBranches = branches.filter(b => 
        Math.abs(b.length - avgLength) <= 1
      );
      
      if (similarBranches.length >= 2) {
        placements.push({
          id: 'procedure_hub_spoke',
          name: 'Procedure - Hub & Spoke',
          concepts: ['procedure_simple'],
          primaryConcept: 'procedure_simple',
          difficulty: 5,
          items: similarBranches.flatMap((seg, branchIdx) =>
            seg.points.map((pos, i) => ({
              type: 'crystal' as ItemType,
              position: pos,
              groupId: `spoke_${branchIdx}`,
              patternRole: i === 0 ? 'first' : 'repeat'
            }))
          ),
          patternDescription: `Define processSpoke(), call ${similarBranches.length} times`,
          expectedSolution: createDefaultSolution({
            hasProcedure: true,
            procedureCount: 1,
            hasLoop: true,
            loopType: 'repeat_n',
            loopCount: similarBranches.length,
            estimatedSteps: similarBranches.length * (avgLength + 2),
            estimatedBlocks: 8 + avgLength
          }),
          requiredBlocks: meta.blockTypes,
          tags: ['function', 'procedure', 'hub-spoke'],
          educationalGoal: 'Tái sử dụng procedure cho nhiều nhánh giống nhau',
          prerequisiteConcepts: ['repeat_n']
        });
      }
    }
  }
  
  // === Pattern 3: Repeated pattern ===
  if (mainSegment && mainSegment.length >= 6) {
    const patternSize = 3;
    const repetitions = Math.floor(mainSegment.length / patternSize);
    
    if (repetitions >= 2) {
      placements.push({
        id: 'procedure_repeated_pattern',
        name: 'Procedure - pattern lặp lại',
        concepts: ['procedure_simple', 'repeat_n'],
        primaryConcept: 'procedure_simple',
        difficulty: 5,
        items: Array.from({ length: repetitions }, (_, i) => {
          const startIdx = i * patternSize + 1;
          return {
            type: 'crystal' as ItemType,
            position: mainSegment.points[Math.min(startIdx, mainSegment.points.length - 1)],
            groupId: `pattern_${i}`,
            patternRole: 'pattern_item'
          };
        }),
        patternDescription: `Define doPattern(), repeat ${repetitions} times`,
        expectedSolution: createDefaultSolution({
          hasProcedure: true,
          procedureCount: 1,
          hasLoop: true,
          loopType: 'repeat_n',
          loopCount: repetitions,
          estimatedSteps: repetitions * patternSize + 3,
          estimatedBlocks: 8
        }),
        requiredBlocks: meta.blockTypes,
        tags: ['function', 'procedure', 'pattern'],
        educationalGoal: 'Đóng gói pattern thành procedure',
        prerequisiteConcepts: ['repeat_n']
      });
    }
  }
  
  return placements;
}

// ============================================================================
// PROCEDURE_WITH_PARAM GENERATORS (Difficulty 6)
// ============================================================================

/**
 * Generate procedure_with_param placements - procedures with parameters
 */
export function generateProcedureWithParamPlacements(context: PlacementContext): AcademicPlacement[] {
  const placements: AcademicPlacement[] = [];
  const mainSegment = getMainSegment(context);
  const meta = CONCEPT_CURRICULUM['procedure_with_param'];
  
  if (!mainSegment) return placements;
  
  // === Pattern 1: Branches of different lengths ===
  const branches = getPerpendicularBranches(context, mainSegment.id);
  
  if (branches.length >= 2) {
    // Get branches with different lengths
    const differentLengths = branches.filter((b, i, arr) => 
      i === 0 || b.length !== arr[i-1].length
    ).slice(0, 3);
    
    if (differentLengths.length >= 2) {
      placements.push({
        id: 'procedure_param_length',
        name: 'Procedure(n) - độ dài khác nhau',
        concepts: ['procedure_with_param', 'counter'],
        primaryConcept: 'procedure_with_param',
        difficulty: 6,
        items: differentLengths.flatMap((seg, branchIdx) =>
          seg.points.map((pos, i) => ({
            type: 'crystal' as ItemType,
            position: pos,
            groupId: `branch_${branchIdx}`,
            patternRole: `step_${i}`
          }))
        ),
        patternDescription: 'Define processBranch(length), call with different lengths',
        expectedSolution: createDefaultSolution({
          hasProcedure: true,
          procedureCount: 1,
          hasVariable: true,
          variableType: 'counter',
          estimatedSteps: differentLengths.reduce((sum, b) => sum + b.length, 0) + 6,
          estimatedBlocks: 12
        }),
        requiredBlocks: meta.blockTypes,
        tags: ['function', 'procedure', 'parameter', 'length'],
        educationalGoal: meta.learningGoal,
        prerequisiteConcepts: ['procedure_simple', 'counter']
      });
    }
  }
  
  // === Pattern 2: Different actions per parameter ===
  if (mainSegment.length >= 8) {
    const crystalPos = getPointsOnSegment(mainSegment, 4, 1);
    const switchPos = getPointsOnSegment(mainSegment, 4, 3);
    
    if (crystalPos.length >= 1 && switchPos.length >= 1) {
      placements.push({
        id: 'procedure_param_action',
        name: 'Procedure(action) - hành động khác nhau',
        concepts: ['procedure_with_param', 'if_else'],
        primaryConcept: 'procedure_with_param',
        difficulty: 7,
        items: [
          ...crystalPos.map((pos, i) => ({
            type: 'crystal' as ItemType,
            position: pos,
            groupId: 'crystals',
            patternRole: 'crystal_action'
          })),
          ...switchPos.map((pos, i) => ({
            type: 'switch' as ItemType,
            position: pos,
            groupId: 'switches',
            patternRole: 'switch_action'
          }))
        ],
        patternDescription: 'Define doAction(type), if type=="collect" → ..., else → ...',
        expectedSolution: createDefaultSolution({
          hasProcedure: true,
          procedureCount: 1,
          hasConditional: true,
          conditionalType: 'if_else',
          estimatedSteps: mainSegment.length + crystalPos.length + switchPos.length,
          estimatedBlocks: 15
        }),
        requiredBlocks: [...meta.blockTypes, 'if_else'],
        tags: ['function', 'procedure', 'parameter', 'action'],
        educationalGoal: 'Procedure linh hoạt với tham số xác định hành vi',
        prerequisiteConcepts: ['procedure_simple', 'if_else']
      });
    }
  }
  
  return placements;
}

// ============================================================================
// FUNCTION_RETURN GENERATORS (Difficulty 7)
// ============================================================================

/**
 * Generate function_return placements - functions that return values
 */
export function generateFunctionReturnPlacements(context: PlacementContext): AcademicPlacement[] {
  const placements: AcademicPlacement[] = [];
  const mainSegment = getMainSegment(context);
  const meta = CONCEPT_CURRICULUM['function_return'];
  
  if (!mainSegment || mainSegment.length < 6) return placements;
  
  // === Pattern 1: Count and compare ===
  const crystalPos = getPointsOnSegment(mainSegment, 2, 1);
  
  if (crystalPos.length >= 3) {
    placements.push({
      id: 'function_return_count',
      name: 'Function → return count',
      concepts: ['function_return', 'counter', 'if_else'],
      primaryConcept: 'function_return',
      difficulty: 7,
      items: crystalPos.map((pos, i) => ({
        type: 'crystal' as ItemType,
        position: pos,
        groupId: 'count',
        patternRole: 'countable'
      })),
      patternDescription: 'Define countCrystals() → number, if count >= 3 → success',
      expectedSolution: createDefaultSolution({
        hasProcedure: true,
        procedureCount: 1,
        hasVariable: true,
        variableType: 'counter',
        hasConditional: true,
        conditionalType: 'if_else',
        estimatedSteps: mainSegment.length + crystalPos.length + 3,
        estimatedBlocks: 18
      }),
      requiredBlocks: meta.blockTypes,
      tags: ['function', 'return', 'count'],
      educationalGoal: meta.learningGoal,
      prerequisiteConcepts: ['procedure_with_param']
    });
  }
  
  // === Pattern 2: Check and return boolean ===
  placements.push({
    id: 'function_return_bool',
    name: 'Function → return boolean',
    concepts: ['function_return', 'if_simple'],
    primaryConcept: 'function_return',
    difficulty: 7,
    items: [
      ...mainSegment.points.slice(1, 4).map((pos, i) => ({
        type: 'crystal' as ItemType,
        position: pos,
        groupId: 'check',
        patternRole: 'checkable'
      })),
      { 
        type: 'switch' as ItemType, 
        position: mainSegment.points[mainSegment.points.length - 1], 
        groupId: 'target', 
        patternRole: 'goal' 
      }
    ],
    patternDescription: 'Define hasItems() → bool, while hasItems() → collect',
    expectedSolution: createDefaultSolution({
      hasProcedure: true,
      procedureCount: 1,
      hasLoop: true,
      loopType: 'while_condition',
      estimatedSteps: mainSegment.length + 5,
      estimatedBlocks: 14
    }),
    requiredBlocks: meta.blockTypes,
    tags: ['function', 'return', 'boolean'],
    educationalGoal: 'Function trả về giá trị để điều khiển luồng',
    prerequisiteConcepts: ['procedure_with_param']
  });
  
  return placements;
}

// ============================================================================
// FUNCTION_COMPOSE GENERATORS (Difficulty 7)
// ============================================================================

/**
 * Generate function_compose placements - composing multiple functions
 */
export function generateFunctionComposePlacements(context: PlacementContext): AcademicPlacement[] {
  const placements: AcademicPlacement[] = [];
  const meta = CONCEPT_CURRICULUM['function_compose'];
  
  // Need multiple areas for composition
  if (context.areas.length < 2) return placements;
  
  // === Pattern 1: Function calling function ===
  placements.push({
    id: 'function_compose_areas',
    name: 'Function Compose - xử lý areas',
    concepts: ['function_compose', 'procedure_simple'],
    primaryConcept: 'function_compose',
    difficulty: 7,
    items: context.areas.slice(0, 3).flatMap((area, areaIdx) => 
      area.blocks.slice(0, 2).map((pos, i) => ({
        type: (areaIdx % 2 === 0 ? 'crystal' : 'gem') as ItemType,
        position: { x: pos.x, y: pos.y + 1, z: pos.z },
        groupId: `area_${areaIdx}`,
        patternRole: 'area_item'
      }))
    ),
    patternDescription: 'processMap() calls processArea() for each area',
    expectedSolution: createDefaultSolution({
      hasProcedure: true,
      procedureCount: 2,
      hasLoop: true,
      loopType: 'for_each',
      estimatedSteps: context.areas.length * 5 + 4,
      estimatedBlocks: 16
    }),
    requiredBlocks: meta.blockTypes,
    tags: ['function', 'compose', 'areas'],
    educationalGoal: meta.learningGoal,
    prerequisiteConcepts: ['procedure_simple']
  });
  
  // === Pattern 2: Building blocks ===
  const mainSegment = getMainSegment(context);
  if (mainSegment && mainSegment.length >= 6) {
    placements.push({
      id: 'function_compose_building',
      name: 'Function Compose - building blocks',
      concepts: ['function_compose', 'procedure_simple'],
      primaryConcept: 'function_compose',
      difficulty: 8,
      items: [
        ...getPointsOnSegment(mainSegment, 2, 0).slice(0, 3).map((pos, i) => ({
          type: 'crystal' as ItemType,
          position: pos,
          groupId: 'step1',
          patternRole: 'move_collect'
        })),
        ...getPointsOnSegment(mainSegment, 2, 1).slice(0, 3).map((pos, i) => ({
          type: 'switch' as ItemType,
          position: pos,
          groupId: 'step2',
          patternRole: 'toggle'
        }))
      ],
      patternDescription: 'doTask() calls moveStep() then actionStep()',
      expectedSolution: createDefaultSolution({
        hasProcedure: true,
        procedureCount: 3,
        hasLoop: true,
        loopType: 'repeat_n',
        estimatedSteps: mainSegment.length + 8,
        estimatedBlocks: 20
      }),
      requiredBlocks: meta.blockTypes,
      tags: ['function', 'compose', 'building-blocks'],
      educationalGoal: 'Xây dựng giải pháp từ các function nhỏ',
      prerequisiteConcepts: ['procedure_simple']
    });
  }
  
  return placements;
}

// ============================================================================
// RECURSION GENERATORS (Difficulty 9)
// ============================================================================

/**
 * Generate recursion placements - self-referential functions
 */
export function generateRecursionPlacements(context: PlacementContext): AcademicPlacement[] {
  const placements: AcademicPlacement[] = [];
  const mainSegment = getMainSegment(context);
  const meta = CONCEPT_CURRICULUM['recursion'];
  
  if (!mainSegment || mainSegment.length < 5) return placements;
  
  // === Pattern 1: Recursive traversal ===
  const [, end] = getEndpoints(mainSegment);
  
  placements.push({
    id: 'recursion_traversal',
    name: 'Recursion - duyệt đến đích',
    concepts: ['recursion', 'if_simple'],
    primaryConcept: 'recursion',
    difficulty: 9,
    items: [
      ...mainSegment.points.slice(1, -1).map((pos, i) => ({
        type: 'crystal' as ItemType,
        position: pos,
        groupId: 'path',
        patternRole: 'recursive_collect'
      })),
      { type: 'goal' as ItemType, position: end, groupId: 'base', patternRole: 'base_case' }
    ],
    patternDescription: 'Define explore(): if atGoal → done, else → move, collect, explore()',
    expectedSolution: createDefaultSolution({
      hasProcedure: true,
      procedureCount: 1,
      hasConditional: true,
      conditionalType: 'if_simple',
      estimatedSteps: mainSegment.length + 2,
      estimatedBlocks: 10
    }),
    requiredBlocks: meta.blockTypes,
    tags: ['function', 'recursion', 'traversal'],
    educationalGoal: meta.learningGoal,
    prerequisiteConcepts: ['procedure_simple', 'if_simple']
  });
  
  // === Pattern 2: Recursive with branching ===
  const branches = getPerpendicularBranches(context, mainSegment.id);
  
  if (branches.length >= 1) {
    placements.push({
      id: 'recursion_branching',
      name: 'Recursion - khám phá nhánh',
      concepts: ['recursion', 'if_else'],
      primaryConcept: 'recursion',
      difficulty: 10,
      items: [
        ...mainSegment.points.slice(1, 3).map((pos, i) => ({
          type: 'crystal' as ItemType,
          position: pos,
          groupId: 'main',
          patternRole: 'main_path'
        })),
        ...branches[0].points.map((pos, i) => ({
          type: 'gem' as ItemType,
          position: pos,
          groupId: 'branch',
          patternRole: 'branch_path'
        }))
      ],
      patternDescription: 'Define explore(): if hasBranch → explore(branch), explore(forward)',
      expectedSolution: createDefaultSolution({
        hasProcedure: true,
        procedureCount: 1,
        hasConditional: true,
        conditionalType: 'if_else',
        estimatedSteps: mainSegment.length + branches[0].length + 4,
        estimatedBlocks: 14
      }),
      requiredBlocks: meta.blockTypes,
      tags: ['function', 'recursion', 'branching', 'dfs'],
      educationalGoal: 'Sử dụng đệ quy để khám phá cấu trúc nhánh',
      prerequisiteConcepts: ['procedure_simple', 'if_else']
    });
  }
  
  return placements;
}

// ============================================================================
// COMBINED EXPORT
// ============================================================================

/**
 * Generate all function-related placements
 */
export function generateAllFunctionPlacements(context: PlacementContext): AcademicPlacement[] {
  return [
    ...generateProcedureSimplePlacements(context),
    ...generateProcedureWithParamPlacements(context),
    ...generateFunctionReturnPlacements(context),
    ...generateFunctionComposePlacements(context),
    ...generateRecursionPlacements(context)
  ];
}

export default generateAllFunctionPlacements;
