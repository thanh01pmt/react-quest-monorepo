/**
 * Arrow Shape Topology (PORTED FROM PYTHON)
 * Creates an arrow-shaped path with triangular head
 * 
 * ARCHITECTURE:
 * - placement_coords: Full arrow shape (all tiles for ground rendering)
 * - path_coords: Unique walkable tiles in "Row Scan" order for placer
 * - segments: [shaft_segment, head_segment] for segment-based placement
 * - semantic_positions: Key points (tail, junction, tip, wings) for strategy
 */

import { BaseTopology } from './BaseTopology';
import { IPathInfo, Coord } from '../types';

export class ArrowShapeTopology extends BaseTopology {
  *generatePathInfoVariants(
    gridSize: [number, number, number],
    params: Record<string, any>,
    maxVariants: number
  ): Generator<IPathInfo> {
    let count = 0;
    for (let shaft = 3; shaft <= 8 && count < maxVariants; shaft++) {
      for (let head = 2; head <= 4 && count < maxVariants; head++) {
        yield this.generatePathInfo(gridSize, {
          ...params,
          shaft_length: shaft,
          head_size: head
        });
        count++;
      }
    }
  }

  generatePathInfo(gridSize: [number, number, number], params: Record<string, any>): IPathInfo {
    const shaftLen = params.shaft_length || 5;
    const headSize = params.head_size || 3;
    
    // Calculate required space
    const requiredWidth = headSize * 2 + 1;
    const requiredDepth = shaftLen + headSize;
    
    // Safe start position - center the arrow in grid
    const startX = Math.max(headSize + 1, Math.min(gridSize[0] - headSize - 2, 
                   Math.floor(gridSize[0] / 2)));
    const startZ = params.start_z || Math.max(1, Math.floor((gridSize[2] - requiredDepth) / 2));
    const y = 0;

    // Start position (bottom of shaft)
    const startPos: Coord = [startX, y, startZ];
    
    const placementCoords: Set<string> = new Set();
    const pathCoords: Coord[] = [];
    const straightPathCoords: Coord[] = [startPos];
    
    const addToPlacement = (coord: Coord) => {
      placementCoords.add(`${coord[0]},${coord[1]},${coord[2]}`);
    };
    
    addToPlacement(startPos);
    pathCoords.push(startPos);
    
    // 1. Create shaft (vertical line going +Z)
    const shaft: Coord[] = [startPos];
    let currentPos: Coord = [...startPos];
    
    for (let i = 0; i < shaftLen; i++) {
      currentPos = [currentPos[0], currentPos[1], currentPos[2] + 1];
      shaft.push([...currentPos]);
      pathCoords.push([...currentPos]);
      addToPlacement(currentPos);
      straightPathCoords.push([...currentPos]);
    }
    
    // Junction point (top of shaft)
    const junctionPos: Coord = [...shaft[shaft.length - 1]];
    
    // 2. Create triangular head
    // Head has headSize rows, each row has decreasing width
    const headRows: Coord[][] = [];
    
    for (let row = 1; row <= headSize; row++) {
      const currentZ = junctionPos[2] + row;
      const rowWidth = headSize - row; // Half-width from center
      const rowCoords: Coord[] = [];
      
      for (let dx = -rowWidth; dx <= rowWidth; dx++) {
        const coord: Coord = [junctionPos[0] + dx, y, currentZ];
        rowCoords.push(coord);
        addToPlacement(coord);
      }
      
      headRows.push(rowCoords);
    }
    // 3. Build path_coords: Unique positions in LAYER-BY-LAYER scan order
    // NOTE: This is for PLACEMENT purposes, not a walkable path sequence!
    // The solver uses BFS on placement_coords grid to find actual walkable path.
    //
    // APPROACH: Layer-by-layer scan (like Python's dict.fromkeys result)
    // For each row of head:
    //   Add all tiles from left to right (sorted by X)
    // This gives unique positions in a logical order for placer.
    
    const centerX = junctionPos[0];
    
    for (let rIdx = 0; rIdx < headRows.length; rIdx++) {
      const row = headRows[rIdx];
      // Sort row by X (left to right)
      const sortedRow = [...row].sort((a, b) => a[0] - b[0]);
      
      // Add all tiles in this row (no duplicates since each row has unique tiles)
      for (const coord of sortedRow) {
        pathCoords.push(coord);
      }
    }
    
    // Target position is the tip of the arrow
    const targetPos: Coord = [junctionPos[0], y, junctionPos[2] + headSize];
    
    // Ensure target is last in path
    if (!pathCoords.some(c => c[0] === targetPos[0] && c[1] === targetPos[1] && c[2] === targetPos[2])) {
      pathCoords.push(targetPos);
    }
    
    // Build wing paths for branches metadata (for item placement strategies)
    const wingLeftCoords: Coord[] = [];
    const wingRightCoords: Coord[] = [];
    
    // Wings are on the base row of the head (widest row)
    const baseRowZ = junctionPos[2] + 1;
    const maxWidth = headSize - 1; // Half-width of base row
    
    // Build connected wing paths from center outward
    for (let i = 1; i <= maxWidth; i++) {
      wingLeftCoords.push([centerX - i, y, baseRowZ]);
      wingRightCoords.push([centerX + i, y, baseRowZ]);
    }
    
    // Remove duplicates while preserving order (for placement lookup)
    // Note: path_coords WITH duplicates is kept for actual traversal order
    // uniquePathCoords is for ground/item placement reference
    const seen = new Set<string>();
    const uniquePathCoords: Coord[] = [];
    for (const coord of pathCoords) {
      const key = `${coord[0]},${coord[1]},${coord[2]}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniquePathCoords.push(coord);
      }
    }
    
    // Convert placement set back to coords
    const allPlacementCoords: Coord[] = [];
    placementCoords.forEach(key => {
      const [x, yy, z] = key.split(',').map(Number);
      allPlacementCoords.push([x, yy, z]);
    });
    
    // Calculate wing tips for semantic positions (reuse baseRowZ, maxWidth from above)
    const leftWingTip: Coord = [junctionPos[0] - maxWidth, y, baseRowZ];
    const rightWingTip: Coord = [junctionPos[0] + maxWidth, y, baseRowZ];
    
    // Wing paths already built above as wingLeftCoords, wingRightCoords
    
    // =========================================================================
    // SEGMENTS: Build proper walkable segments including wings
    // For function_logic: Player should visit wings to collect items
    // 
    // Full traversal order for Arrow Shape:
    //   1. Walk up shaft: start → junction 
    //   2. Explore left wing: junction → left tip → back to junction
    //   3. Explore right wing: junction → right tip → back to junction
    //   4. Walk to tip: junction → arrow tip
    //
    // This creates 4 segments with identical patterns on wings (function reuse!)
    // =========================================================================
    
    // Segment 1: Shaft (start to junction)
    const shaftSegment: Coord[] = shaft.slice(0, shaftLen + 1);  // Include junction
    
    // Segment 2: Left wing (junction → left tip)
    // Build path from junction going left
    const leftWingSegment: Coord[] = [junctionPos];
    for (let i = 1; i <= maxWidth; i++) {
      leftWingSegment.push([centerX - i, y, baseRowZ]);
    }
    
    // Segment 3: Right wing (junction → right tip)
    // Build path from junction going right  
    const rightWingSegment: Coord[] = [junctionPos];
    for (let i = 1; i <= maxWidth; i++) {
      rightWingSegment.push([centerX + i, y, baseRowZ]);
    }
    
    // Segment 4: Head/Tip (junction → tip)
    const tipSegment: Coord[] = [junctionPos];
    for (let row = 1; row <= headSize; row++) {
      tipSegment.push([centerX, y, junctionPos[2] + row]);
    }
    
    // Build full walkable path_coords for the intended traversal
    // Order: shaft → left wing → (backtrack) → right wing → (backtrack) → tip
    const walkablePath: Coord[] = [];
    
    // Add shaft
    for (const c of shaftSegment) {
      walkablePath.push(c);
    }
    
    // Add left wing (outbound), then backtrack to junction
    for (let i = 1; i < leftWingSegment.length; i++) {
      walkablePath.push(leftWingSegment[i]);
    }
    // Backtrack from left wing tip to junction
    for (let i = leftWingSegment.length - 2; i >= 0; i--) {
      walkablePath.push(leftWingSegment[i]);
    }
    
    // Add right wing (outbound), then backtrack to junction
    for (let i = 1; i < rightWingSegment.length; i++) {
      walkablePath.push(rightWingSegment[i]);
    }
    // Backtrack from right wing tip to junction
    for (let i = rightWingSegment.length - 2; i >= 0; i--) {
      walkablePath.push(rightWingSegment[i]);
    }
    
    // Add tip segment (excluding junction since already there)
    for (let i = 1; i < tipSegment.length; i++) {
      walkablePath.push(tipSegment[i]);
    }
    
    // Update path_coords to be this walkable path
    const finalPathCoords = walkablePath;

    return {
      start_pos: startPos,
      target_pos: targetPos,
      path_coords: finalPathCoords,  // Full walkable path including wings
      placement_coords: allPlacementCoords,
      obstacles: [],
      metadata: {
        topology_type: 'arrow_shape',
        shaft: shaft,
        head_rows: headRows,
        junction: junctionPos,
        // Segments for pattern matching - each wing is identical for function reuse
        segments: [shaftSegment, leftWingSegment, rightWingSegment, tipSegment],
        branches: [shaft, headRows.flat()],
        corners: [junctionPos],
        landmarks: {
          tail: startPos,
          junction: junctionPos,
          tip: targetPos,
          wing_left: leftWingTip,
          wing_right: rightWingTip,
          wing_left_path: wingLeftCoords,
          wing_right_path: wingRightCoords
        },
        semantic_positions: {
          tail: startPos,
          junction: junctionPos,
          tip: targetPos,
          wing_left: leftWingTip,
          wing_right: rightWingTip,
          optimal_start: 'tail',
          optimal_end: 'tip',
          valid_pairs: [
            {
              name: 'tail_to_tip_easy',
              start: 'tail',
              end: 'tip',
              path_type: 'shaft_then_head',
              strategies: ['strategic_zones', 'segment_based'],
              difficulty: 'EASY',
              teaching_goal: 'Simple arrow traversal through shaft to tip'
            },
            {
              name: 'wing_to_wing_medium',
              start: 'wing_left',
              end: 'wing_right',
              path_type: 'parallel_wings',
              strategies: ['strategic_zones', 'v_shape_convergence'],
              difficulty: 'MEDIUM',
              teaching_goal: 'Cross arrow head through junction'
            },
            {
              name: 'tail_all_zones_hard',
              start: 'tail',
              end: 'tip',  // Changed to tip - full traversal ends at tip
              path_type: 'full_traversal',
              strategies: ['function_reuse', 'parallel_wings'],
              difficulty: 'HARD',
              teaching_goal: 'Visit all zones: shaft, both wings (backtrack), tip'
            }
          ]
        },
        segment_analysis: {
          num_segments: 4,
          lengths: [shaftSegment.length, leftWingSegment.length, rightWingSegment.length, tipSegment.length],
          types: ['linear_shaft', 'linear_wing', 'linear_wing', 'linear_tip'],
          min_length: Math.min(shaftSegment.length, leftWingSegment.length, rightWingSegment.length, tipSegment.length),
          max_length: Math.max(shaftSegment.length, leftWingSegment.length, rightWingSegment.length, tipSegment.length),
          avg_length: (shaftSegment.length + leftWingSegment.length + rightWingSegment.length + tipSegment.length) / 4,
          suggested_patterns: ['function_reuse', 'segment_pattern_reuse', 'interval_fill'],
          // Wing segments are IDENTICAL - perfect for function_logic!
          identical_segments: [1, 2],  // leftWingSegment and rightWingSegment indices
          reusable_pattern_segments: 'wings'
        }
      },
    };
  }
}
