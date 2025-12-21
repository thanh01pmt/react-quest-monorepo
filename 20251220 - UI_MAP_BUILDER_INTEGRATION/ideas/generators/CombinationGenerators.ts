/**
 * Combination Generators
 * 
 * Concepts covered (combining multiple basic concepts):
 * - repeat_n_counter (Difficulty 4) ✅
 * - while_counter (Difficulty 6) ✅
 * - repeat_until_state (Difficulty 5) ✅
 * - for_each_accumulator (Difficulty 7) ✅
 * - loop_if_inside (Difficulty 5) ✅
 * - if_loop_inside (Difficulty 5) ✅
 * - loop_break (Difficulty 6) ✅
 * - function_loop_inside (Difficulty 5) ✅
 * - loop_function_call (Difficulty 5) ✅
 * - function_if_inside (Difficulty 5) ✅
 * - conditional_function_call (Difficulty 6) ✅
 * - nested_conditional (Difficulty 6) ✅
 * - nested_function (Difficulty 6) ✅
 * - loop_if_function (Difficulty 8) ✅
 * - function_loop_if (Difficulty 8) ✅
 * 
 * These are the most complex generators combining multiple concepts
 */

import {
  PlacementContext,
  AcademicPlacement,
  ItemType,
  CONCEPT_CURRICULUM,
  createDefaultSolution,
  getMainSegment,
  getEndpoints,
  getPointsOnSegment,
  getSymmetricPairs,
  getPerpendicularBranches,
  findJunctionPoints,
  parseVectorKey,
  vectorEquals
} from './common';

// ============================================================================
// LOOP + VARIABLE COMBINATIONS
// ============================================================================

/**
 * repeat_n + counter
 */
export function generateRepeatNCounterPlacements(context: PlacementContext): AcademicPlacement[] {
  const placements: AcademicPlacement[] = [];
  const mainSegment = getMainSegment(context);
  
  if (!mainSegment || mainSegment.length < 5) return placements;
  
  const meta = CONCEPT_CURRICULUM['repeat_n_counter'];
  
  // Place crystals at positions 2, 4, 6... (counting pattern)
  const countPositions = getPointsOnSegment(mainSegment, 2, 2);
  if (countPositions.length >= 2) {
    placements.push({
      id: 'repeat_n_counter_tracking',
      name: 'Repeat + Counter - theo dõi tiến trình',
      concepts: ['repeat_n', 'counter'],
      primaryConcept: 'repeat_n_counter',
      difficulty: 4,
      items: [
        ...countPositions.map((pos, i) => ({
          type: 'crystal' as ItemType,
          position: pos,
          groupId: 'count',
          patternRole: `step_${(i + 1) * 2}`
        })),
        { type: 'switch' as ItemType, position: mainSegment.points[mainSegment.length - 1], groupId: 'target', patternRole: 'goal' }
      ],
      patternDescription: `step = 0, repeat ${countPositions.length}: move 2, step += 2, collect`,
      expectedSolution: createDefaultSolution({
        hasLoop: true,
        loopType: 'repeat_n',
        loopCount: countPositions.length,
        hasVariable: true,
        variableType: 'counter',
        estimatedSteps: mainSegment.length + countPositions.length,
        estimatedBlocks: 10
      }),
      requiredBlocks: meta.blockTypes,
      tags: ['combination', 'loop', 'counter', 'tracking'],
      educationalGoal: meta.learningGoal,
      prerequisiteConcepts: ['repeat_n', 'counter']
    });
  }
  
  return placements;
}

/**
 * while + counter
 */
export function generateWhileCounterPlacements(context: PlacementContext): AcademicPlacement[] {
  const placements: AcademicPlacement[] = [];
  const mainSegment = getMainSegment(context);
  
  if (!mainSegment || mainSegment.length < 6) return placements;
  
  const meta = CONCEPT_CURRICULUM['while_counter'];
  const [, end] = getEndpoints(mainSegment);
  
  placements.push({
    id: 'while_counter_spiral',
    name: 'While + Counter - di chuyển đến đích',
    concepts: ['while_condition', 'counter'],
    primaryConcept: 'while_counter',
    difficulty: 6,
    items: [
      ...mainSegment.points.slice(1, -1).map((pos, i) => ({
        type: 'crystal' as ItemType,
        position: pos,
        groupId: 'path',
        patternRole: 'step'
      })),
      { type: 'goal' as ItemType, position: end, groupId: 'target', patternRole: 'goal' }
    ],
    patternDescription: `distance = ${mainSegment.length}, while distance > 0: move, distance--`,
    expectedSolution: createDefaultSolution({
      hasLoop: true,
      loopType: 'while_condition',
      hasVariable: true,
      variableType: 'counter',
      estimatedSteps: mainSegment.length + 2,
      estimatedBlocks: 10
    }),
    requiredBlocks: meta.blockTypes,
    tags: ['combination', 'while', 'counter', 'distance'],
    educationalGoal: meta.learningGoal,
    prerequisiteConcepts: ['while_condition', 'counter']
  });
  
  return placements;
}

/**
 * repeat_until + state
 */
export function generateRepeatUntilStatePlacements(context: PlacementContext): AcademicPlacement[] {
  const placements: AcademicPlacement[] = [];
  const mainSegment = getMainSegment(context);
  
  if (!mainSegment || mainSegment.length < 5) return placements;
  
  const meta = CONCEPT_CURRICULUM['repeat_until_state'];
  const switchPos = mainSegment.points[mainSegment.length - 2];
  const [, end] = getEndpoints(mainSegment);
  
  placements.push({
    id: 'repeat_until_state_switch',
    name: 'Repeat Until + State - tìm switch',
    concepts: ['repeat_until', 'state_toggle'],
    primaryConcept: 'repeat_until_state',
    difficulty: 5,
    items: [
      ...mainSegment.points.slice(1, -2).map((pos, i) => ({
        type: 'crystal' as ItemType,
        position: pos,
        groupId: 'path',
        patternRole: 'collect'
      })),
      { type: 'switch' as ItemType, position: switchPos, groupId: 'switch', patternRole: 'toggle_target' },
      { type: 'gem' as ItemType, position: end, groupId: 'reward', patternRole: 'after_toggle' }
    ],
    patternDescription: 'doorOpen = false, repeat until doorOpen: move, if switch → toggle, doorOpen = true',
    expectedSolution: createDefaultSolution({
      hasLoop: true,
      loopType: 'repeat_until',
      hasVariable: true,
      variableType: 'state_toggle',
      hasConditional: true,
      conditionalType: 'if_simple',
      estimatedSteps: mainSegment.length + 2,
      estimatedBlocks: 12
    }),
    requiredBlocks: meta.blockTypes,
    tags: ['combination', 'repeat_until', 'state'],
    educationalGoal: meta.learningGoal,
    prerequisiteConcepts: ['repeat_until', 'state_toggle']
  });
  
  return placements;
}

/**
 * for_each + accumulator
 */
export function generateForEachAccumulatorPlacements(context: PlacementContext): AcademicPlacement[] {
  const placements: AcademicPlacement[] = [];
  
  if (context.areas.length < 2) return placements;
  
  const meta = CONCEPT_CURRICULUM['for_each_accumulator'];
  
  placements.push({
    id: 'for_each_accumulator_areas',
    name: 'For Each + Accumulator - tổng từ các vùng',
    concepts: ['for_each', 'accumulator'],
    primaryConcept: 'for_each_accumulator',
    difficulty: 7,
    items: context.areas.slice(0, 4).flatMap((area, areaIdx) => {
      // 1-3 crystals per area to accumulate
      const count = Math.min(3, area.blocks.length);
      return Array.from({ length: count }, (_, i) => ({
        type: 'crystal' as ItemType,
        position: { 
          x: area.blocks[i].x, 
          y: area.blocks[i].y + 1, 
          z: area.blocks[i].z 
        },
        groupId: `area_${areaIdx}`,
        patternRole: `value_${areaIdx}_${i}`
      }));
    }),
    patternDescription: 'total = 0, for each area: visitArea, count crystals, total += count',
    expectedSolution: createDefaultSolution({
      hasLoop: true,
      loopType: 'for_each',
      hasVariable: true,
      variableType: 'accumulator',
      estimatedSteps: context.areas.length * 5,
      estimatedBlocks: 14
    }),
    requiredBlocks: meta.blockTypes,
    tags: ['combination', 'for_each', 'accumulator', 'areas'],
    educationalGoal: meta.learningGoal,
    prerequisiteConcepts: ['for_each', 'accumulator']
  });
  
  return placements;
}

// ============================================================================
// LOOP + CONDITIONAL COMBINATIONS
// ============================================================================

/**
 * loop with if inside
 */
export function generateLoopIfInsidePlacements(context: PlacementContext): AcademicPlacement[] {
  const placements: AcademicPlacement[] = [];
  const mainSegment = getMainSegment(context);
  
  if (!mainSegment || mainSegment.length < 6) return placements;
  
  const meta = CONCEPT_CURRICULUM['loop_if_inside'];
  
  // Mixed crystals and switches
  const crystalPositions = getPointsOnSegment(mainSegment, 3, 1);
  const switchPositions = getPointsOnSegment(mainSegment, 3, 2);
  
  if (crystalPositions.length >= 2 && switchPositions.length >= 1) {
    placements.push({
      id: 'loop_if_inside_mixed',
      name: 'Loop + If Inside - xử lý xen kẽ',
      concepts: ['repeat_n', 'if_simple'],
      primaryConcept: 'loop_if_inside',
      difficulty: 5,
      items: [
        ...crystalPositions.map((pos, i) => ({
          type: 'crystal' as ItemType,
          position: pos,
          groupId: 'crystals',
          patternRole: 'if_crystal'
        })),
        ...switchPositions.map((pos, i) => ({
          type: 'switch' as ItemType,
          position: pos,
          groupId: 'switches',
          patternRole: 'if_switch'
        }))
      ],
      patternDescription: `Repeat ${mainSegment.length}: move, if crystal → collect, if switch → toggle`,
      expectedSolution: createDefaultSolution({
        hasLoop: true,
        loopType: 'repeat_n',
        loopCount: mainSegment.length,
        hasConditional: true,
        conditionalType: 'if_simple',
        estimatedSteps: mainSegment.length + crystalPositions.length + switchPositions.length,
        estimatedBlocks: 12
      }),
      requiredBlocks: meta.blockTypes,
      tags: ['combination', 'loop', 'if', 'mixed'],
      educationalGoal: meta.learningGoal,
      prerequisiteConcepts: ['repeat_n', 'if_simple']
    });
  }
  
  return placements;
}

/**
 * if with loop inside
 */
export function generateIfLoopInsidePlacements(context: PlacementContext): AcademicPlacement[] {
  const placements: AcademicPlacement[] = [];
  const junctions = findJunctionPoints(context);
  const meta = CONCEPT_CURRICULUM['if_loop_inside'];
  
  Array.from(junctions.entries()).slice(0, 1).forEach(([key, segmentIds]) => {
    const junctionPos = parseVectorKey(key);
    const branches = segmentIds.slice(0, 2).map(id => 
      context.segments.find(s => s.id === id)
    ).filter(Boolean);
    
    if (branches.length < 2) return;
    
    placements.push({
      id: `if_loop_inside_${key}`,
      name: 'If + Loop Inside - rẽ nhánh rồi lặp',
      concepts: ['if_else', 'repeat_n'],
      primaryConcept: 'if_loop_inside',
      difficulty: 5,
      items: [
        { type: 'switch' as ItemType, position: junctionPos, groupId: 'decision', patternRole: 'condition' },
        ...(branches[0]?.points.map((pos, i) => ({
          type: 'crystal' as ItemType,
          position: pos,
          groupId: 'if_branch',
          patternRole: 'if_loop_item'
        })) || []),
        ...(branches[1]?.points.map((pos, i) => ({
          type: 'gem' as ItemType,
          position: pos,
          groupId: 'else_branch',
          patternRole: 'else_loop_item'
        })) || [])
      ],
      patternDescription: 'If condition → repeat collect on branch A, else → repeat on branch B',
      expectedSolution: createDefaultSolution({
        hasConditional: true,
        conditionalType: 'if_else',
        hasLoop: true,
        loopType: 'repeat_n',
        estimatedSteps: Math.max(branches[0]?.length || 0, branches[1]?.length || 0) + 4,
        estimatedBlocks: 14
      }),
      requiredBlocks: meta.blockTypes,
      tags: ['combination', 'if', 'loop', 'branch'],
      educationalGoal: meta.learningGoal,
      prerequisiteConcepts: ['if_simple', 'repeat_n']
    });
  });
  
  return placements;
}

/**
 * loop with break
 */
export function generateLoopBreakPlacements(context: PlacementContext): AcademicPlacement[] {
  const placements: AcademicPlacement[] = [];
  const mainSegment = getMainSegment(context);
  
  if (!mainSegment || mainSegment.length < 6) return placements;
  
  const meta = CONCEPT_CURRICULUM['loop_break'];
  const targetPos = mainSegment.points[Math.floor(mainSegment.length * 0.7)];
  
  placements.push({
    id: 'loop_break_find_target',
    name: 'Loop + Break - tìm và dừng',
    concepts: ['while_condition', 'if_simple'],
    primaryConcept: 'loop_break',
    difficulty: 6,
    items: [
      ...mainSegment.points.slice(1, Math.floor(mainSegment.length * 0.7)).map((pos, i) => ({
        type: 'crystal' as ItemType,
        position: pos,
        groupId: 'path',
        patternRole: 'collect'
      })),
      { type: 'gem' as ItemType, position: targetPos, groupId: 'target', patternRole: 'break_trigger' }
    ],
    patternDescription: 'While pathAhead: move, if gem → collect, break',
    expectedSolution: createDefaultSolution({
      hasLoop: true,
      loopType: 'while_condition',
      hasConditional: true,
      conditionalType: 'if_simple',
      estimatedSteps: Math.floor(mainSegment.length * 0.7) + 2,
      estimatedBlocks: 10
    }),
    requiredBlocks: meta.blockTypes,
    tags: ['combination', 'loop', 'break', 'search'],
    educationalGoal: meta.learningGoal,
    prerequisiteConcepts: ['while_condition', 'if_simple']
  });
  
  return placements;
}

// ============================================================================
// FUNCTION + LOOP COMBINATIONS
// ============================================================================

/**
 * function containing loop
 */
export function generateFunctionLoopInsidePlacements(context: PlacementContext): AcademicPlacement[] {
  const placements: AcademicPlacement[] = [];
  const symmetricPairs = getSymmetricPairs(context);
  const meta = CONCEPT_CURRICULUM['function_loop_inside'];
  
  for (const [seg1, seg2] of symmetricPairs) {
    if (seg1.length < 3 || seg2.length < 3) continue;
    
    placements.push({
      id: `function_loop_inside_${seg1.id}`,
      name: 'Function(Loop) - procedure chứa loop',
      concepts: ['procedure_simple', 'repeat_n'],
      primaryConcept: 'function_loop_inside',
      difficulty: 5,
      items: [
        ...seg1.points.map((pos, i) => ({
          type: 'crystal' as ItemType,
          position: pos,
          groupId: 'branch_a',
          patternRole: 'loop_item'
        })),
        ...seg2.points.map((pos, i) => ({
          type: 'crystal' as ItemType,
          position: pos,
          groupId: 'branch_b',
          patternRole: 'loop_item'
        }))
      ],
      patternDescription: `Define processBranch(): repeat ${seg1.length}: move, collect. Call twice.`,
      expectedSolution: createDefaultSolution({
        hasProcedure: true,
        procedureCount: 1,
        hasLoop: true,
        loopType: 'repeat_n',
        loopCount: seg1.length,
        estimatedSteps: seg1.length * 2 + 4,
        estimatedBlocks: 10
      }),
      requiredBlocks: meta.blockTypes,
      tags: ['combination', 'function', 'loop', 'inside'],
      educationalGoal: meta.learningGoal,
      prerequisiteConcepts: ['procedure_simple', 'repeat_n']
    });
    break; // Only one placement
  }
  
  return placements;
}

/**
 * loop calling function
 */
export function generateLoopFunctionCallPlacements(context: PlacementContext): AcademicPlacement[] {
  const placements: AcademicPlacement[] = [];
  const mainSegment = getMainSegment(context);
  const meta = CONCEPT_CURRICULUM['loop_function_call'];
  
  if (!mainSegment) return placements;
  
  const branches = getPerpendicularBranches(context, mainSegment.id);
  
  if (branches.length >= 2) {
    placements.push({
      id: 'loop_function_call_branches',
      name: 'Loop(Function) - gọi procedure trong loop',
      concepts: ['repeat_n', 'procedure_simple'],
      primaryConcept: 'loop_function_call',
      difficulty: 5,
      items: branches.slice(0, 4).flatMap((seg, branchIdx) =>
        seg.points.map((pos, i) => ({
          type: 'crystal' as ItemType,
          position: pos,
          groupId: `branch_${branchIdx}`,
          patternRole: 'function_item'
        }))
      ),
      patternDescription: `Define processBranch(), repeat ${branches.length}: move to branch, processBranch()`,
      expectedSolution: createDefaultSolution({
        hasLoop: true,
        loopType: 'repeat_n',
        loopCount: Math.min(branches.length, 4),
        hasProcedure: true,
        procedureCount: 1,
        estimatedSteps: branches.slice(0, 4).reduce((sum, b) => sum + b.length, 0) + branches.length * 2,
        estimatedBlocks: 12
      }),
      requiredBlocks: meta.blockTypes,
      tags: ['combination', 'loop', 'function', 'call'],
      educationalGoal: meta.learningGoal,
      prerequisiteConcepts: ['repeat_n', 'procedure_simple']
    });
  }
  
  return placements;
}

// ============================================================================
// FUNCTION + CONDITIONAL COMBINATIONS
// ============================================================================

/**
 * function containing conditional
 */
export function generateFunctionIfInsidePlacements(context: PlacementContext): AcademicPlacement[] {
  const placements: AcademicPlacement[] = [];
  const mainSegment = getMainSegment(context);
  const meta = CONCEPT_CURRICULUM['function_if_inside'];
  
  if (!mainSegment || mainSegment.length < 6) return placements;
  
  const crystalPos = getPointsOnSegment(mainSegment, 3, 1);
  const switchPos = getPointsOnSegment(mainSegment, 3, 2);
  
  if (crystalPos.length >= 2 && switchPos.length >= 1) {
    placements.push({
      id: 'function_if_inside_process',
      name: 'Function(If) - procedure với logic',
      concepts: ['procedure_simple', 'if_else'],
      primaryConcept: 'function_if_inside',
      difficulty: 5,
      items: [
        ...crystalPos.map((pos, i) => ({
          type: 'crystal' as ItemType,
          position: pos,
          groupId: 'crystals',
          patternRole: 'if_case'
        })),
        ...switchPos.map((pos, i) => ({
          type: 'switch' as ItemType,
          position: pos,
          groupId: 'switches',
          patternRole: 'else_case'
        }))
      ],
      patternDescription: 'Define processItem(): if crystal → collect, else → toggle',
      expectedSolution: createDefaultSolution({
        hasProcedure: true,
        procedureCount: 1,
        hasConditional: true,
        conditionalType: 'if_else',
        estimatedSteps: mainSegment.length + crystalPos.length + switchPos.length,
        estimatedBlocks: 14
      }),
      requiredBlocks: meta.blockTypes,
      tags: ['combination', 'function', 'if', 'inside'],
      educationalGoal: meta.learningGoal,
      prerequisiteConcepts: ['procedure_simple', 'if_simple']
    });
  }
  
  return placements;
}

/**
 * conditional calling different functions
 */
export function generateConditionalFunctionCallPlacements(context: PlacementContext): AcademicPlacement[] {
  const placements: AcademicPlacement[] = [];
  const junctions = findJunctionPoints(context);
  const meta = CONCEPT_CURRICULUM['conditional_function_call'];
  
  Array.from(junctions.entries()).slice(0, 1).forEach(([key, segmentIds]) => {
    const junctionPos = parseVectorKey(key);
    const branches = segmentIds.slice(0, 2).map(id => 
      context.segments.find(s => s.id === id)
    ).filter(Boolean);
    
    if (branches.length < 2) return;
    
    placements.push({
      id: `conditional_function_call_${key}`,
      name: 'If-Else(Function) - gọi function khác nhau',
      concepts: ['if_else', 'procedure_simple'],
      primaryConcept: 'conditional_function_call',
      difficulty: 6,
      items: [
        { type: 'switch' as ItemType, position: junctionPos, groupId: 'decision', patternRole: 'condition' },
        ...(branches[0]?.points.map((pos, i) => ({
          type: 'crystal' as ItemType,
          position: pos,
          groupId: 'if_func',
          patternRole: 'functionA_item'
        })) || []),
        ...(branches[1]?.points.map((pos, i) => ({
          type: 'gem' as ItemType,
          position: pos,
          groupId: 'else_func',
          patternRole: 'functionB_item'
        })) || [])
      ],
      patternDescription: 'If condition → processTypeA(), else → processTypeB()',
      expectedSolution: createDefaultSolution({
        hasConditional: true,
        conditionalType: 'if_else',
        hasProcedure: true,
        procedureCount: 2,
        estimatedSteps: Math.max(branches[0]?.length || 0, branches[1]?.length || 0) + 4,
        estimatedBlocks: 16
      }),
      requiredBlocks: meta.blockTypes,
      tags: ['combination', 'conditional', 'function', 'dispatch'],
      educationalGoal: meta.learningGoal,
      prerequisiteConcepts: ['if_else', 'procedure_simple']
    });
  });
  
  return placements;
}

// ============================================================================
// TRIPLE COMBINATIONS (ADVANCED)
// ============================================================================

/**
 * loop + if + function (most complex pattern)
 */
export function generateLoopIfFunctionPlacements(context: PlacementContext): AcademicPlacement[] {
  const placements: AcademicPlacement[] = [];
  const mainSegment = getMainSegment(context);
  const meta = CONCEPT_CURRICULUM['loop_if_function'];
  
  if (!mainSegment || mainSegment.length < 6) return placements;
  
  const symmetricPairs = getSymmetricPairs(context);
  
  if (symmetricPairs.length > 0) {
    const [seg1, seg2] = symmetricPairs[0];
    
    placements.push({
      id: 'loop_if_function_advanced',
      name: 'Loop + If + Function - kết hợp nâng cao',
      concepts: ['repeat_n', 'if_simple', 'procedure_simple'],
      primaryConcept: 'loop_if_function',
      difficulty: 8,
      items: [
        // Main path crystals
        ...getPointsOnSegment(mainSegment, 2, 0).slice(0, 4).map((pos, i) => ({
          type: 'crystal' as ItemType,
          position: pos,
          groupId: 'main_loop',
          patternRole: 'loop_item'
        })),
        // Branch indicators
        ...seg1.points.map(pos => ({
          type: 'switch' as ItemType,
          position: pos,
          groupId: 'branch_a',
          patternRole: 'function_item'
        })),
        ...seg2.points.map(pos => ({
          type: 'switch' as ItemType,
          position: pos,
          groupId: 'branch_b',
          patternRole: 'function_item'
        }))
      ],
      patternDescription: 'Repeat: move, collect, if hasBranch → processBranch()',
      expectedSolution: createDefaultSolution({
        hasLoop: true,
        loopType: 'repeat_n',
        loopCount: mainSegment.length,
        hasConditional: true,
        conditionalType: 'if_simple',
        hasProcedure: true,
        procedureCount: 1,
        estimatedSteps: mainSegment.length + seg1.length + seg2.length + 6,
        estimatedBlocks: 18
      }),
      requiredBlocks: meta.blockTypes,
      tags: ['advanced', 'combination', 'loop', 'if', 'function'],
      educationalGoal: meta.learningGoal,
      prerequisiteConcepts: ['repeat_n', 'if_simple', 'procedure_simple']
    });
  }
  
  return placements;
}

/**
 * function containing loop containing if
 */
export function generateFunctionLoopIfPlacements(context: PlacementContext): AcademicPlacement[] {
  const placements: AcademicPlacement[] = [];
  const mainSegment = getMainSegment(context);
  const meta = CONCEPT_CURRICULUM['function_loop_if'];
  
  if (!mainSegment || mainSegment.length < 7) return placements;
  
  const crystalPos = getPointsOnSegment(mainSegment, 2, 1);
  const switchPos = getPointsOnSegment(mainSegment, 4, 3);
  
  if (crystalPos.length >= 3 && switchPos.length >= 1) {
    placements.push({
      id: 'function_loop_if_process',
      name: 'Function(Loop(If)) - procedure phức tạp',
      concepts: ['procedure_simple', 'repeat_n', 'if_simple'],
      primaryConcept: 'function_loop_if',
      difficulty: 8,
      items: [
        ...crystalPos.map((pos, i) => ({
          type: 'crystal' as ItemType,
          position: pos,
          groupId: 'collect',
          patternRole: 'if_collect'
        })),
        ...switchPos.map((pos, i) => ({
          type: 'switch' as ItemType,
          position: pos,
          groupId: 'toggle',
          patternRole: 'if_toggle'
        }))
      ],
      patternDescription: 'Define processPath(): repeat n: move, if crystal → collect, if switch → toggle',
      expectedSolution: createDefaultSolution({
        hasProcedure: true,
        procedureCount: 1,
        hasLoop: true,
        loopType: 'repeat_n',
        loopCount: mainSegment.length,
        hasConditional: true,
        conditionalType: 'if_simple',
        estimatedSteps: mainSegment.length + crystalPos.length + switchPos.length,
        estimatedBlocks: 16
      }),
      requiredBlocks: meta.blockTypes,
      tags: ['advanced', 'combination', 'function', 'loop', 'if'],
      educationalGoal: meta.learningGoal,
      prerequisiteConcepts: ['procedure_simple', 'repeat_n', 'if_simple']
    });
  }
  
  return placements;
}

// ============================================================================
// COMBINED EXPORT
// ============================================================================

/**
 * Generate all combination placements
 */
export function generateAllCombinationPlacements(context: PlacementContext): AcademicPlacement[] {
  return [
    // Loop + Variable
    ...generateRepeatNCounterPlacements(context),
    ...generateWhileCounterPlacements(context),
    ...generateRepeatUntilStatePlacements(context),
    ...generateForEachAccumulatorPlacements(context),
    
    // Loop + Conditional
    ...generateLoopIfInsidePlacements(context),
    ...generateIfLoopInsidePlacements(context),
    ...generateLoopBreakPlacements(context),
    
    // Function + Loop
    ...generateFunctionLoopInsidePlacements(context),
    ...generateLoopFunctionCallPlacements(context),
    
    // Function + Conditional
    ...generateFunctionIfInsidePlacements(context),
    ...generateConditionalFunctionCallPlacements(context),
    
    // Triple Combinations
    ...generateLoopIfFunctionPlacements(context),
    ...generateFunctionLoopIfPlacements(context)
  ];
}

export default generateAllCombinationPlacements;
