/**
 * Variable Generators
 * 
 * Concepts covered:
 * - counter (Difficulty 3) ✅
 * - state_toggle (Difficulty 4) ✅
 * - accumulator (Difficulty 5) ✅
 * - collection (Difficulty 6) ✅
 * - flag (Difficulty 5) ✅
 * 
 * Map features used:
 * - Segments with regular patterns (for counting)
 * - Switches (for state toggle)
 * - Multiple items (for accumulator)
 */

import {
  PlacementContext,
  AcademicPlacement,
  ItemType,
  CONCEPT_CURRICULUM,
  createDefaultSolution,
  getMainSegment,
  getEndpoints,
  getPointsOnSegment
} from './common';

// ============================================================================
// COUNTER GENERATORS (Difficulty 3)
// ============================================================================

/**
 * Generate counter placements - counting variables
 */
export function generateCounterPlacements(context: PlacementContext): AcademicPlacement[] {
  const placements: AcademicPlacement[] = [];
  const mainSegment = getMainSegment(context);
  
  if (!mainSegment || mainSegment.length < 4) return placements;
  
  const meta = CONCEPT_CURRICULUM['counter'];
  
  // === Pattern 1: Count steps ===
  placements.push({
    id: 'counter_steps',
    name: 'Counter - đếm bước đi',
    concepts: ['counter', 'repeat_n'],
    primaryConcept: 'counter',
    difficulty: 3,
    items: [
      ...mainSegment.points.slice(1, -1).map((pos, i) => ({
        type: 'crystal' as ItemType,
        position: pos,
        groupId: 'steps',
        patternRole: 'counted'
      })),
      { 
        type: 'switch' as ItemType, 
        position: mainSegment.points[mainSegment.points.length - 1], 
        groupId: 'target', 
        patternRole: 'target_count' 
      }
    ],
    patternDescription: 'count = 0, repeat: move, count++, until count == target',
    expectedSolution: createDefaultSolution({
      hasLoop: true,
      loopType: 'repeat_n',
      hasVariable: true,
      variableType: 'counter',
      estimatedSteps: mainSegment.length + 2,
      estimatedBlocks: 8
    }),
    requiredBlocks: meta.blockTypes,
    tags: ['variable', 'counter', 'steps'],
    educationalGoal: meta.learningGoal,
    prerequisiteConcepts: ['repeat_n']
  });
  
  // === Pattern 2: Count crystals ===
  const crystalPos = getPointsOnSegment(mainSegment, 2, 1);
  if (crystalPos.length >= 3) {
    placements.push({
      id: 'counter_crystals',
      name: 'Counter - đếm crystal thu được',
      concepts: ['counter', 'repeat_n'],
      primaryConcept: 'counter',
      difficulty: 4,
      items: [
        ...crystalPos.map((pos, i) => ({
          type: 'crystal' as ItemType,
          position: pos,
          groupId: 'collect',
          patternRole: 'countable'
        })),
        { 
          type: 'goal' as ItemType, 
          position: mainSegment.points[mainSegment.points.length - 1], 
          groupId: 'target', 
          patternRole: `need_${crystalPos.length}` 
        }
      ],
      patternDescription: `collected = 0, move and collect until collected >= ${crystalPos.length}`,
      expectedSolution: createDefaultSolution({
        hasLoop: true,
        loopType: 'while_condition',
        hasVariable: true,
        variableType: 'counter',
        hasConditional: true,
        conditionalType: 'if_simple',
        estimatedSteps: mainSegment.length + crystalPos.length,
        estimatedBlocks: 12
      }),
      requiredBlocks: meta.blockTypes,
      tags: ['variable', 'counter', 'collect'],
      educationalGoal: 'Đếm và so sánh số lượng thu thập',
      prerequisiteConcepts: ['repeat_n', 'if_simple']
    });
  }
  
  return placements;
}

// ============================================================================
// STATE_TOGGLE GENERATORS (Difficulty 4)
// ============================================================================

/**
 * Generate state_toggle placements - on/off state variables
 */
export function generateStateTogglePlacements(context: PlacementContext): AcademicPlacement[] {
  const placements: AcademicPlacement[] = [];
  const mainSegment = getMainSegment(context);
  
  if (!mainSegment || mainSegment.length < 5) return placements;
  
  const meta = CONCEPT_CURRICULUM['state_toggle'];
  
  // === Pattern 1: Alternating actions ===
  const switchPos = getPointsOnSegment(mainSegment, 3, 1);
  const crystalPos = getPointsOnSegment(mainSegment, 3, 2);
  
  if (switchPos.length >= 2 && crystalPos.length >= 1) {
    placements.push({
      id: 'state_toggle_alternate',
      name: 'State Toggle - hành động xen kẽ',
      concepts: ['state_toggle', 'if_else'],
      primaryConcept: 'state_toggle',
      difficulty: 4,
      items: [
        ...switchPos.map((pos, i) => ({
          type: 'switch' as ItemType,
          position: pos,
          groupId: 'toggles',
          patternRole: 'toggle_on'
        })),
        ...crystalPos.map((pos, i) => ({
          type: 'crystal' as ItemType,
          position: pos,
          groupId: 'crystals',
          patternRole: 'when_on'
        }))
      ],
      patternDescription: 'isEnabled = false, if switch → toggle, if isEnabled → collect',
      expectedSolution: createDefaultSolution({
        hasLoop: true,
        loopType: 'repeat_n',
        hasVariable: true,
        variableType: 'state_toggle',
        hasConditional: true,
        conditionalType: 'if_else',
        estimatedSteps: mainSegment.length + switchPos.length + crystalPos.length,
        estimatedBlocks: 14
      }),
      requiredBlocks: meta.blockTypes,
      tags: ['variable', 'state', 'toggle', 'alternating'],
      educationalGoal: meta.learningGoal,
      prerequisiteConcepts: ['if_simple']
    });
  }
  
  // === Pattern 2: Door/Gate mechanism ===
  if (mainSegment.length >= 6) {
    const gatePos = mainSegment.points[Math.floor(mainSegment.length / 2)];
    const keyPos = mainSegment.points[1];
    const [, endPos] = getEndpoints(mainSegment);
    
    placements.push({
      id: 'state_toggle_gate',
      name: 'State Toggle - cổng và chìa khóa',
      concepts: ['state_toggle', 'if_simple'],
      primaryConcept: 'state_toggle',
      difficulty: 5,
      items: [
        { type: 'switch' as ItemType, position: keyPos, groupId: 'key', patternRole: 'unlock' },
        { type: 'gem' as ItemType, position: gatePos, groupId: 'gate', patternRole: 'gate' },
        { type: 'crystal' as ItemType, position: endPos, groupId: 'treasure', patternRole: 'reward' }
      ],
      patternDescription: 'gateOpen = false, get key → gateOpen = true, if gateOpen → pass',
      expectedSolution: createDefaultSolution({
        hasVariable: true,
        variableType: 'state_toggle',
        hasConditional: true,
        conditionalType: 'if_simple',
        estimatedSteps: mainSegment.length + 4,
        estimatedBlocks: 12
      }),
      requiredBlocks: meta.blockTypes,
      tags: ['variable', 'state', 'gate', 'sequence'],
      educationalGoal: 'Quản lý state để mở khóa tiến trình',
      prerequisiteConcepts: ['if_simple']
    });
  }
  
  return placements;
}

// ============================================================================
// ACCUMULATOR GENERATORS (Difficulty 5)
// ============================================================================

/**
 * Generate accumulator placements - summing/accumulating values
 */
export function generateAccumulatorPlacements(context: PlacementContext): AcademicPlacement[] {
  const placements: AcademicPlacement[] = [];
  const mainSegment = getMainSegment(context);
  
  if (!mainSegment || mainSegment.length < 5) return placements;
  
  const meta = CONCEPT_CURRICULUM['accumulator'];
  
  // === Pattern 1: Sum values ===
  const valuePositions = getPointsOnSegment(mainSegment, 2, 1);
  
  if (valuePositions.length >= 3) {
    placements.push({
      id: 'accumulator_sum',
      name: 'Accumulator - tính tổng',
      concepts: ['accumulator', 'repeat_n'],
      primaryConcept: 'accumulator',
      difficulty: 5,
      items: valuePositions.map((pos, i) => ({
        type: 'crystal' as ItemType,
        position: pos,
        groupId: 'values',
        patternRole: `value_${i + 1}`
      })),
      patternDescription: `total = 0, repeat: collect crystal, total += value, until total >= target`,
      expectedSolution: createDefaultSolution({
        hasLoop: true,
        loopType: 'repeat_n',
        hasVariable: true,
        variableType: 'accumulator',
        estimatedSteps: mainSegment.length + valuePositions.length,
        estimatedBlocks: 10
      }),
      requiredBlocks: meta.blockTypes,
      tags: ['variable', 'accumulator', 'sum'],
      educationalGoal: meta.learningGoal,
      prerequisiteConcepts: ['counter', 'repeat_n']
    });
  }
  
  // === Pattern 2: Weighted sum ===
  if (mainSegment.length >= 7) {
    const crystalPos = getPointsOnSegment(mainSegment, 3, 1);
    const gemPos = getPointsOnSegment(mainSegment, 3, 2);
    
    if (crystalPos.length >= 2 && gemPos.length >= 1) {
      placements.push({
        id: 'accumulator_weighted',
        name: 'Accumulator - tổng có trọng số',
        concepts: ['accumulator', 'if_else'],
        primaryConcept: 'accumulator',
        difficulty: 6,
        items: [
          ...crystalPos.map((pos, i) => ({
            type: 'crystal' as ItemType,
            position: pos,
            groupId: 'crystals',
            patternRole: 'value_1'
          })),
          ...gemPos.map((pos, i) => ({
            type: 'gem' as ItemType,
            position: pos,
            groupId: 'gems',
            patternRole: 'value_5'
          }))
        ],
        patternDescription: 'score = 0, if crystal → score += 1, if gem → score += 5',
        expectedSolution: createDefaultSolution({
          hasLoop: true,
          loopType: 'repeat_n',
          hasVariable: true,
          variableType: 'accumulator',
          hasConditional: true,
          conditionalType: 'if_else',
          estimatedSteps: mainSegment.length + crystalPos.length + gemPos.length,
          estimatedBlocks: 14
        }),
        requiredBlocks: [...meta.blockTypes, 'if_else'],
        tags: ['variable', 'accumulator', 'weighted', 'scoring'],
        educationalGoal: 'Tích lũy giá trị khác nhau dựa trên loại',
        prerequisiteConcepts: ['counter', 'if_else']
      });
    }
  }
  
  return placements;
}

// ============================================================================
// COLLECTION GENERATORS (Difficulty 6)
// ============================================================================

/**
 * Generate collection placements - list/array operations
 */
export function generateCollectionPlacements(context: PlacementContext): AcademicPlacement[] {
  const placements: AcademicPlacement[] = [];
  
  // Need multiple areas or segments for meaningful collections
  if (context.areas.length < 2 && context.segments.length < 3) return placements;
  
  const meta = CONCEPT_CURRICULUM['collection'];
  
  // === Pattern 1: Store positions ===
  if (context.areas.length >= 2) {
    placements.push({
      id: 'collection_positions',
      name: 'Collection - lưu vị trí',
      concepts: ['collection', 'for_each'],
      primaryConcept: 'collection',
      difficulty: 6,
      items: context.areas.slice(0, 4).map((area, i) => ({
        type: (i % 2 === 0 ? 'crystal' : 'gem') as ItemType,
        position: { 
          x: Math.round(area.center.x), 
          y: Math.round(area.center.y) + 1, 
          z: Math.round(area.center.z) 
        },
        groupId: `area_${i}`,
        patternRole: 'stored_position'
      })),
      patternDescription: 'targets = [area1, area2, ...], for each target: goTo, collect',
      expectedSolution: createDefaultSolution({
        hasLoop: true,
        loopType: 'for_each',
        hasVariable: true,
        variableType: 'collection',
        estimatedSteps: context.areas.length * 4,
        estimatedBlocks: 10
      }),
      requiredBlocks: meta.blockTypes,
      tags: ['variable', 'collection', 'positions'],
      educationalGoal: meta.learningGoal,
      prerequisiteConcepts: ['counter']
    });
  }
  
  // === Pattern 2: Queue of actions ===
  const mainSegment = getMainSegment(context);
  if (mainSegment && mainSegment.length >= 6) {
    const actionPositions = getPointsOnSegment(mainSegment, 2, 1);
    
    if (actionPositions.length >= 3) {
      placements.push({
        id: 'collection_action_queue',
        name: 'Collection - hàng đợi hành động',
        concepts: ['collection', 'for_each'],
        primaryConcept: 'collection',
        difficulty: 7,
        items: actionPositions.map((pos, i) => ({
          type: (i % 3 === 0 ? 'crystal' : i % 3 === 1 ? 'gem' : 'switch') as ItemType,
          position: pos,
          groupId: 'queue',
          patternRole: `action_${i % 3}`
        })),
        patternDescription: 'actions = ["collect", "toggle", "wait"], for each action: perform(action)',
        expectedSolution: createDefaultSolution({
          hasLoop: true,
          loopType: 'for_each',
          hasVariable: true,
          variableType: 'collection',
          hasConditional: true,
          conditionalType: 'switch_case',
          estimatedSteps: mainSegment.length + actionPositions.length * 2,
          estimatedBlocks: 16
        }),
        requiredBlocks: [...meta.blockTypes, 'switch'],
        tags: ['variable', 'collection', 'queue', 'actions'],
        educationalGoal: 'Xử lý danh sách hành động tuần tự',
        prerequisiteConcepts: ['counter', 'for_each']
      });
    }
  }
  
  return placements;
}

// ============================================================================
// FLAG GENERATORS (Difficulty 5)
// ============================================================================

/**
 * Generate flag placements - boolean flag variables
 */
export function generateFlagPlacements(context: PlacementContext): AcademicPlacement[] {
  const placements: AcademicPlacement[] = [];
  const mainSegment = getMainSegment(context);
  
  if (!mainSegment || mainSegment.length < 5) return placements;
  
  const meta = CONCEPT_CURRICULUM['flag'];
  const [, end] = getEndpoints(mainSegment);
  
  // === Pattern 1: Found flag ===
  const targetPos = mainSegment.points[Math.floor(mainSegment.length / 2)];
  
  placements.push({
    id: 'flag_found',
    name: 'Flag - đã tìm thấy',
    concepts: ['flag', 'while_condition'],
    primaryConcept: 'flag',
    difficulty: 5,
    items: [
      { type: 'gem' as ItemType, position: targetPos, groupId: 'target', patternRole: 'search_target' },
      ...mainSegment.points.slice(1, Math.floor(mainSegment.length / 2)).map((pos, i) => ({
        type: 'crystal' as ItemType,
        position: pos,
        groupId: 'path',
        patternRole: 'path_crystal'
      }))
    ],
    patternDescription: 'found = false, while not found: move, if gem → found = true',
    expectedSolution: createDefaultSolution({
      hasLoop: true,
      loopType: 'while_condition',
      hasVariable: true,
      variableType: 'flag',
      hasConditional: true,
      conditionalType: 'if_simple',
      estimatedSteps: Math.floor(mainSegment.length / 2) + 2,
      estimatedBlocks: 10
    }),
    requiredBlocks: meta.blockTypes,
    tags: ['variable', 'flag', 'search'],
    educationalGoal: meta.learningGoal,
    prerequisiteConcepts: ['if_simple', 'state_toggle']
  });
  
  // === Pattern 2: Multiple flags ===
  if (mainSegment.length >= 8) {
    placements.push({
      id: 'flag_multiple',
      name: 'Flags - nhiều điều kiện',
      concepts: ['flag', 'if_else', 'while_condition'],
      primaryConcept: 'flag',
      difficulty: 6,
      items: [
        { type: 'crystal' as ItemType, position: mainSegment.points[2], groupId: 'key1', patternRole: 'flag1' },
        { type: 'gem' as ItemType, position: mainSegment.points[4], groupId: 'key2', patternRole: 'flag2' },
        { type: 'switch' as ItemType, position: end, groupId: 'goal', patternRole: 'requires_both' }
      ],
      patternDescription: 'hasKey1 = false, hasKey2 = false, while not (hasKey1 and hasKey2)...',
      expectedSolution: createDefaultSolution({
        hasLoop: true,
        loopType: 'while_condition',
        hasVariable: true,
        variableType: 'flag',
        hasConditional: true,
        conditionalType: 'if_else',
        estimatedSteps: mainSegment.length + 4,
        estimatedBlocks: 18
      }),
      requiredBlocks: meta.blockTypes,
      tags: ['variable', 'flag', 'multiple', 'and-condition'],
      educationalGoal: 'Kết hợp nhiều flags để kiểm tra điều kiện phức tạp',
      prerequisiteConcepts: ['if_else', 'state_toggle']
    });
  }
  
  return placements;
}

// ============================================================================
// COMBINED EXPORT
// ============================================================================

/**
 * Generate all variable-related placements
 */
export function generateAllVariablePlacements(context: PlacementContext): AcademicPlacement[] {
  return [
    ...generateCounterPlacements(context),
    ...generateStateTogglePlacements(context),
    ...generateAccumulatorPlacements(context),
    ...generateCollectionPlacements(context),
    ...generateFlagPlacements(context)
  ];
}

export default generateAllVariablePlacements;
