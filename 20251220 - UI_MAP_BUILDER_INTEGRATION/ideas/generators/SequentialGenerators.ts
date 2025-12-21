/**
 * Sequential Generators
 * 
 * Concepts covered:
 * - sequential (Difficulty 1)
 * 
 * Map features used:
 * - Main segment (longest path)
 * - Endpoints
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
// SEQUENTIAL GENERATORS
// ============================================================================

/**
 * Generate sequential placements
 * Difficulty: 1-2
 */
export function generateSequentialPlacements(context: PlacementContext): AcademicPlacement[] {
  const placements: AcademicPlacement[] = [];
  const mainSegment = getMainSegment(context);
  
  if (!mainSegment) return placements;
  
  const [start, end] = getEndpoints(mainSegment);
  const meta = CONCEPT_CURRICULUM['sequential'];
  
  // === LEVEL 1: Basic straight line ===
  placements.push({
    id: 'sequential_basic',
    name: 'Đường thẳng cơ bản',
    concepts: ['sequential'],
    primaryConcept: 'sequential',
    difficulty: 1,
    items: [
      { type: 'crystal', position: end, groupId: 'main' }
    ],
    patternDescription: 'Di chuyển thẳng đến crystal',
    expectedSolution: createDefaultSolution({
      estimatedSteps: mainSegment.length,
      estimatedBlocks: mainSegment.length
    }),
    requiredBlocks: meta.blockTypes,
    tags: ['beginner', 'tutorial'],
    educationalGoal: meta.learningGoal,
    prerequisiteConcepts: []
  });
  
  // === LEVEL 2: Multiple crystals ===
  const alternatePositions = getPointsOnSegment(mainSegment, 2, 1);
  if (alternatePositions.length >= 2) {
    placements.push({
      id: 'sequential_multiple',
      name: 'Thu thập nhiều crystal',
      concepts: ['sequential', 'pattern_recognition'],
      primaryConcept: 'sequential',
      difficulty: 2,
      items: alternatePositions.map((pos, i) => ({
        type: 'crystal' as ItemType,
        position: pos,
        groupId: 'collect',
        patternRole: `crystal_${i + 1}`
      })),
      patternDescription: 'Di chuyển và thu thập nhiều crystal trên đường thẳng',
      expectedSolution: createDefaultSolution({
        estimatedSteps: mainSegment.length + alternatePositions.length,
        estimatedBlocks: mainSegment.length + alternatePositions.length
      }),
      requiredBlocks: [...meta.blockTypes, 'collect'],
      tags: ['beginner', 'collect'],
      educationalGoal: 'Học cách lập trình tuần tự với nhiều lệnh',
      prerequisiteConcepts: []
    });
  }
  
  // === LEVEL 2: With simple turns ===
  // If there are multiple segments connected, create a path with turns
  if (context.segments.length >= 2) {
    const secondSegment = context.segments.find(s => s.id !== mainSegment.id);
    if (secondSegment) {
      const [, secondEnd] = getEndpoints(secondSegment);
      placements.push({
        id: 'sequential_with_turn',
        name: 'Đường có rẽ',
        concepts: ['sequential'],
        primaryConcept: 'sequential',
        difficulty: 2,
        items: [
          { type: 'crystal', position: end, groupId: 'path' },
          { type: 'crystal', position: secondEnd, groupId: 'path' }
        ],
        patternDescription: 'Di chuyển, rẽ, tiếp tục đến crystal',
        expectedSolution: createDefaultSolution({
          estimatedSteps: mainSegment.length + secondSegment.length + 1,
          estimatedBlocks: mainSegment.length + secondSegment.length + 2
        }),
        requiredBlocks: meta.blockTypes,
        tags: ['beginner', 'turn'],
        educationalGoal: 'Học cách kết hợp lệnh di chuyển và xoay',
        prerequisiteConcepts: []
      });
    }
  }
  
  return placements;
}

export default generateSequentialPlacements;
