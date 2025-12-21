/**
 * Loop Generators
 * 
 * Concepts covered:
 * - repeat_n (Difficulty 2) ✅
 * - repeat_until (Difficulty 4) ✅
 * - while_condition (Difficulty 5) ✅
 * - for_each (Difficulty 6) ✅
 * - infinite_loop (Difficulty 7) ✅
 * - nested_loop (Difficulty 7) ✅
 * 
 * Map features used:
 * - Main segment (for regular loops)
 * - Parallel segments (for nested loops)
 * - Areas (for while/repeat_until)
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
  getParallelGroups,
  getMidpoint
} from './common';

// ============================================================================
// REPEAT_N GENERATORS (Difficulty 2-3)
// ============================================================================

/**
 * Generate repeat_n placements - basic fixed-count loops
 */
export function generateRepeatNPlacements(context: PlacementContext): AcademicPlacement[] {
  const placements: AcademicPlacement[] = [];
  const mainSegment = getMainSegment(context);
  
  if (!mainSegment || mainSegment.length < 3) return placements;
  
  const meta = CONCEPT_CURRICULUM['repeat_n'];
  
  // === Pattern 1: Regular interval (every 2 steps) ===
  const evenPositions = getPointsOnSegment(mainSegment, 2, 0);
  if (evenPositions.length >= 3) {
    placements.push({
      id: 'repeat_n_interval_2',
      name: 'Repeat - crystal cách 2 bước',
      concepts: ['repeat_n', 'pattern_recognition'],
      primaryConcept: 'repeat_n',
      difficulty: 2,
      items: evenPositions.map((pos, i) => ({
        type: 'crystal' as ItemType,
        position: pos,
        groupId: 'loop_interval',
        patternRole: i === 0 ? 'first' : 'repeat'
      })),
      patternDescription: `Repeat ${evenPositions.length} times: move 2, collect`,
      expectedSolution: createDefaultSolution({
        hasLoop: true,
        loopType: 'repeat_n',
        loopCount: evenPositions.length,
        estimatedSteps: 4 + evenPositions.length,
        estimatedBlocks: 5
      }),
      requiredBlocks: meta.blockTypes,
      tags: ['loop', 'repeat', 'pattern', 'interval'],
      educationalGoal: meta.learningGoal,
      prerequisiteConcepts: ['sequential']
    });
  }
  
  // === Pattern 2: Every step collect ===
  if (mainSegment.length >= 3) {
    placements.push({
      id: 'repeat_n_every_step',
      name: 'Repeat - thu thập mỗi bước',
      concepts: ['repeat_n'],
      primaryConcept: 'repeat_n',
      difficulty: 3,
      items: mainSegment.points.slice(1).map((pos, i) => ({
        type: 'crystal' as ItemType,
        position: pos,
        groupId: 'loop_every',
        patternRole: 'repeat'
      })),
      patternDescription: `Repeat ${mainSegment.length} times: move, collect`,
      expectedSolution: createDefaultSolution({
        hasLoop: true,
        loopType: 'repeat_n',
        loopCount: mainSegment.length,
        estimatedSteps: 3 + mainSegment.length,
        estimatedBlocks: 4
      }),
      requiredBlocks: meta.blockTypes,
      tags: ['loop', 'repeat', 'dense'],
      educationalGoal: 'Tối ưu code bằng vòng lặp cho pattern đều đặn',
      prerequisiteConcepts: ['sequential']
    });
  }
  
  // === Pattern 3: Interval 3 ===
  const threePositions = getPointsOnSegment(mainSegment, 3, 0);
  if (threePositions.length >= 2) {
    placements.push({
      id: 'repeat_n_interval_3',
      name: 'Repeat - crystal cách 3 bước',
      concepts: ['repeat_n', 'pattern_recognition'],
      primaryConcept: 'repeat_n',
      difficulty: 3,
      items: threePositions.map((pos, i) => ({
        type: 'crystal' as ItemType,
        position: pos,
        groupId: 'loop_3',
        patternRole: i === 0 ? 'first' : 'repeat'
      })),
      patternDescription: `Repeat ${threePositions.length} times: move 3, collect`,
      expectedSolution: createDefaultSolution({
        hasLoop: true,
        loopType: 'repeat_n',
        loopCount: threePositions.length,
        estimatedSteps: 4 + threePositions.length,
        estimatedBlocks: 5
      }),
      requiredBlocks: meta.blockTypes,
      tags: ['loop', 'repeat', 'pattern'],
      educationalGoal: 'Nhận diện pattern với khoảng cách khác nhau',
      prerequisiteConcepts: ['sequential']
    });
  }
  
  return placements;
}

// ============================================================================
// REPEAT_UNTIL GENERATORS (Difficulty 4)
// ============================================================================

/**
 * Generate repeat_until placements - loop until condition met
 */
export function generateRepeatUntilPlacements(context: PlacementContext): AcademicPlacement[] {
  const placements: AcademicPlacement[] = [];
  const mainSegment = getMainSegment(context);
  
  if (!mainSegment || mainSegment.length < 4) return placements;
  
  const meta = CONCEPT_CURRICULUM['repeat_until'];
  const [, end] = getEndpoints(mainSegment);
  
  // === Pattern 1: Repeat until at goal ===
  placements.push({
    id: 'repeat_until_goal',
    name: 'Repeat Until - đến đích',
    concepts: ['repeat_until'],
    primaryConcept: 'repeat_until',
    difficulty: 4,
    items: [
      // Crystals along the way
      ...getPointsOnSegment(mainSegment, 2, 1).map((pos, i) => ({
        type: 'crystal' as ItemType,
        position: pos,
        groupId: 'path',
        patternRole: 'collect'
      })),
      // Goal at the end
      { type: 'goal' as ItemType, position: end, groupId: 'target', patternRole: 'goal' }
    ],
    patternDescription: 'Repeat until atGoal: move, if crystal → collect',
    expectedSolution: createDefaultSolution({
      hasLoop: true,
      loopType: 'repeat_until',
      hasConditional: true,
      conditionalType: 'if_simple',
      estimatedSteps: mainSegment.length + 2,
      estimatedBlocks: 7
    }),
    requiredBlocks: meta.blockTypes,
    tags: ['loop', 'repeat_until', 'goal'],
    educationalGoal: meta.learningGoal,
    prerequisiteConcepts: ['repeat_n', 'if_simple']
  });
  
  // === Pattern 2: Repeat until switch toggled ===
  if (mainSegment.length >= 5) {
    const switchPos = mainSegment.points[Math.floor(mainSegment.length / 2)];
    placements.push({
      id: 'repeat_until_switch',
      name: 'Repeat Until - tìm switch',
      concepts: ['repeat_until', 'state_toggle'],
      primaryConcept: 'repeat_until',
      difficulty: 4,
      items: [
        // Crystals before switch
        ...mainSegment.points.slice(1, Math.floor(mainSegment.length / 2)).map((pos, i) => ({
          type: 'crystal' as ItemType,
          position: pos,
          groupId: 'before',
          patternRole: 'collect'
        })),
        // Switch in the middle
        { type: 'switch' as ItemType, position: switchPos, groupId: 'target', patternRole: 'until_target' }
      ],
      patternDescription: 'Repeat until atSwitch: move, collect if crystal',
      expectedSolution: createDefaultSolution({
        hasLoop: true,
        loopType: 'repeat_until',
        hasConditional: true,
        conditionalType: 'if_simple',
        estimatedSteps: Math.floor(mainSegment.length / 2) + 2,
        estimatedBlocks: 8
      }),
      requiredBlocks: meta.blockTypes,
      tags: ['loop', 'repeat_until', 'switch'],
      educationalGoal: 'Lặp đến khi tìm thấy mục tiêu cụ thể',
      prerequisiteConcepts: ['repeat_n', 'if_simple']
    });
  }
  
  return placements;
}

// ============================================================================
// WHILE_CONDITION GENERATORS (Difficulty 5)
// ============================================================================

/**
 * Generate while_condition placements - loop while condition true
 */
export function generateWhilePlacements(context: PlacementContext): AcademicPlacement[] {
  const placements: AcademicPlacement[] = [];
  const mainSegment = getMainSegment(context);
  
  if (!mainSegment || mainSegment.length < 4) return placements;
  
  const meta = CONCEPT_CURRICULUM['while_condition'];
  
  // === Pattern 1: While path ahead ===
  placements.push({
    id: 'while_path_ahead',
    name: 'While - còn đường phía trước',
    concepts: ['while_condition'],
    primaryConcept: 'while_condition',
    difficulty: 5,
    items: mainSegment.points.slice(1).map((pos, i) => ({
      type: 'crystal' as ItemType,
      position: pos,
      groupId: 'path',
      patternRole: 'while_collect'
    })),
    patternDescription: 'While pathAhead: move, collect',
    expectedSolution: createDefaultSolution({
      hasLoop: true,
      loopType: 'while_condition',
      estimatedSteps: mainSegment.length + 2,
      estimatedBlocks: 5
    }),
    requiredBlocks: meta.blockTypes,
    tags: ['loop', 'while', 'path_ahead'],
    educationalGoal: meta.learningGoal,
    prerequisiteConcepts: ['repeat_until']
  });
  
  // === Pattern 2: While not at goal ===
  const [, end] = getEndpoints(mainSegment);
  placements.push({
    id: 'while_not_goal',
    name: 'While - chưa đến đích',
    concepts: ['while_condition'],
    primaryConcept: 'while_condition',
    difficulty: 5,
    items: [
      ...getPointsOnSegment(mainSegment, 2, 1).map((pos, i) => ({
        type: 'crystal' as ItemType,
        position: pos,
        groupId: 'path',
        patternRole: 'collect'
      })),
      { type: 'goal' as ItemType, position: end, groupId: 'target', patternRole: 'goal' }
    ],
    patternDescription: 'While not atGoal: move, if crystal → collect',
    expectedSolution: createDefaultSolution({
      hasLoop: true,
      loopType: 'while_condition',
      hasConditional: true,
      conditionalType: 'if_simple',
      estimatedSteps: mainSegment.length + 3,
      estimatedBlocks: 8
    }),
    requiredBlocks: meta.blockTypes,
    tags: ['loop', 'while', 'goal'],
    educationalGoal: 'Hiểu sự khác biệt giữa while và repeat_until',
    prerequisiteConcepts: ['repeat_until']
  });
  
  return placements;
}

// ============================================================================
// FOR_EACH GENERATORS (Difficulty 6)
// ============================================================================

/**
 * Generate for_each placements - iterate over collection
 */
export function generateForEachPlacements(context: PlacementContext): AcademicPlacement[] {
  const placements: AcademicPlacement[] = [];
  
  // Need multiple areas or connectors for for_each to make sense
  if (context.areas.length < 2 && context.connectors.length < 2) return placements;
  
  const meta = CONCEPT_CURRICULUM['for_each'];
  
  // === Pattern 1: For each area ===
  if (context.areas.length >= 2) {
    const areaCenters = context.areas.map(a => a.center);
    placements.push({
      id: 'for_each_area',
      name: 'For Each - mỗi vùng',
      concepts: ['for_each', 'collection'],
      primaryConcept: 'for_each',
      difficulty: 6,
      items: areaCenters.map((pos, i) => ({
        type: 'crystal' as ItemType,
        position: { x: Math.round(pos.x), y: Math.round(pos.y) + 1, z: Math.round(pos.z) },
        groupId: `area_${i}`,
        patternRole: 'area_crystal'
      })),
      patternDescription: `For each area in areas: goTo(area), collect`,
      expectedSolution: createDefaultSolution({
        hasLoop: true,
        loopType: 'for_each',
        loopCount: context.areas.length,
        hasVariable: true,
        variableType: 'collection',
        estimatedSteps: context.areas.length * 4,
        estimatedBlocks: 7
      }),
      requiredBlocks: meta.blockTypes,
      tags: ['loop', 'for_each', 'areas', 'collection'],
      educationalGoal: meta.learningGoal,
      prerequisiteConcepts: ['repeat_n', 'collection']
    });
  }
  
  // === Pattern 2: For each connector ===
  if (context.connectors.length >= 2) {
    placements.push({
      id: 'for_each_connector',
      name: 'For Each - mỗi đường nối',
      concepts: ['for_each', 'collection'],
      primaryConcept: 'for_each',
      difficulty: 6,
      items: context.connectors.map((conn, i) => {
        const midpoint = getMidpoint(conn.path);
        return {
          type: 'gem' as ItemType,
          position: { x: midpoint.x, y: midpoint.y + 1, z: midpoint.z },
          groupId: `connector_${i}`,
          patternRole: 'connector_gem'
        };
      }),
      patternDescription: `For each path in connectors: traverse(path), collectGem`,
      expectedSolution: createDefaultSolution({
        hasLoop: true,
        loopType: 'for_each',
        loopCount: context.connectors.length,
        hasVariable: true,
        variableType: 'collection',
        estimatedSteps: context.connectors.length * 5,
        estimatedBlocks: 8
      }),
      requiredBlocks: meta.blockTypes,
      tags: ['loop', 'for_each', 'connectors'],
      educationalGoal: 'Xử lý collection động với for_each',
      prerequisiteConcepts: ['repeat_n', 'collection']
    });
  }
  
  return placements;
}

// ============================================================================
// INFINITE_LOOP GENERATORS (Difficulty 7)
// ============================================================================

/**
 * Generate infinite_loop placements - loop forever with break
 */
export function generateInfiniteLoopPlacements(context: PlacementContext): AcademicPlacement[] {
  const placements: AcademicPlacement[] = [];
  const mainSegment = getMainSegment(context);
  
  if (!mainSegment || mainSegment.length < 5) return placements;
  
  const meta = CONCEPT_CURRICULUM['infinite_loop'];
  const [, end] = getEndpoints(mainSegment);
  
  // === Pattern 1: Loop forever until goal ===
  placements.push({
    id: 'infinite_until_goal',
    name: 'Loop Forever - break khi đến đích',
    concepts: ['infinite_loop', 'if_simple'],
    primaryConcept: 'infinite_loop',
    difficulty: 7,
    items: [
      ...mainSegment.points.slice(1, -1).map((pos, i) => ({
        type: 'crystal' as ItemType,
        position: pos,
        groupId: 'path',
        patternRole: 'collect'
      })),
      { type: 'goal' as ItemType, position: end, groupId: 'target', patternRole: 'break_condition' }
    ],
    patternDescription: 'Loop forever: move, if atGoal → break, if crystal → collect',
    expectedSolution: createDefaultSolution({
      hasLoop: true,
      loopType: 'infinite_loop',
      hasConditional: true,
      conditionalType: 'if_simple',
      estimatedSteps: mainSegment.length + 3,
      estimatedBlocks: 10
    }),
    requiredBlocks: meta.blockTypes,
    tags: ['loop', 'infinite', 'break'],
    educationalGoal: meta.learningGoal,
    prerequisiteConcepts: ['while_condition', 'if_simple']
  });
  
  return placements;
}

// ============================================================================
// NESTED_LOOP GENERATORS (Difficulty 7)
// ============================================================================

/**
 * Generate nested_loop placements - loop inside loop
 */
export function generateNestedLoopPlacements(context: PlacementContext): AcademicPlacement[] {
  const placements: AcademicPlacement[] = [];
  const parallelGroups = getParallelGroups(context);
  const meta = CONCEPT_CURRICULUM['nested_loop'];
  
  // Need parallel segments for grid-like pattern
  for (const group of parallelGroups) {
    if (group.length < 2) continue;
    
    // Sort by position for consistent row ordering
    const sortedGroup = [...group].sort((a, b) => {
      const aStart = a.points[0];
      const bStart = b.points[0];
      return aStart.z - bStart.z || aStart.x - bStart.x;
    });
    
    const rowCount = sortedGroup.length;
    const colCount = sortedGroup[0].length;
    
    // === Pattern 1: Full grid ===
    placements.push({
      id: `nested_loop_grid_${group[0].id}`,
      name: 'Nested Loop - lưới 2D',
      concepts: ['nested_loop'],
      primaryConcept: 'nested_loop',
      difficulty: 7,
      items: sortedGroup.flatMap((seg, rowIdx) =>
        seg.points.map((pos, colIdx) => ({
          type: 'crystal' as ItemType,
          position: pos,
          groupId: `row_${rowIdx}`,
          patternRole: colIdx === 0 ? 'row_start' : 'col_item'
        }))
      ),
      patternDescription: `Outer(${rowCount} rows): Inner(${colCount} cols): move, collect`,
      expectedSolution: createDefaultSolution({
        hasLoop: true,
        loopType: 'repeat_n',
        loopCount: 2, // Nested
        estimatedSteps: rowCount * colCount + rowCount,
        estimatedBlocks: 8
      }),
      requiredBlocks: meta.blockTypes,
      tags: ['nested-loop', 'grid', '2D'],
      educationalGoal: meta.learningGoal,
      prerequisiteConcepts: ['repeat_n']
    });
    
    // === Pattern 2: Grid with alternating ===
    if (rowCount >= 2 && colCount >= 3) {
      placements.push({
        id: `nested_loop_alternating_${group[0].id}`,
        name: 'Nested Loop - lưới xen kẽ',
        concepts: ['nested_loop', 'if_simple'],
        primaryConcept: 'nested_loop',
        difficulty: 8,
        items: sortedGroup.flatMap((seg, rowIdx) =>
          seg.points.filter((_, colIdx) => (rowIdx + colIdx) % 2 === 0).map((pos, i) => ({
            type: 'crystal' as ItemType,
            position: pos,
            groupId: `row_${rowIdx}`,
            patternRole: 'alternating'
          }))
        ),
        patternDescription: `Nested loop với if (row + col) % 2 == 0`,
        expectedSolution: createDefaultSolution({
          hasLoop: true,
          loopType: 'repeat_n',
          loopCount: 2,
          hasConditional: true,
          conditionalType: 'if_simple',
          estimatedSteps: rowCount * colCount + rowCount,
          estimatedBlocks: 12
        }),
        requiredBlocks: [...meta.blockTypes, 'if'],
        tags: ['nested-loop', 'grid', 'alternating'],
        educationalGoal: 'Kết hợp nested loop với điều kiện',
        prerequisiteConcepts: ['repeat_n', 'if_simple']
      });
    }
  }
  
  return placements;
}

// ============================================================================
// COMBINED EXPORT
// ============================================================================

/**
 * Generate all loop-related placements
 */
export function generateAllLoopPlacements(context: PlacementContext): AcademicPlacement[] {
  return [
    ...generateRepeatNPlacements(context),
    ...generateRepeatUntilPlacements(context),
    ...generateWhilePlacements(context),
    ...generateForEachPlacements(context),
    ...generateInfiniteLoopPlacements(context),
    ...generateNestedLoopPlacements(context)
  ];
}

export default generateAllLoopPlacements;
