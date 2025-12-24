/**
 * Grid Topology (PORTED FROM PYTHON)
 * Creates a flat grid structure where all cells are walkable.
 */

import { BaseTopology } from './BaseTopology';
import { IPathInfo, Coord } from '../types';

export class GridTopology extends BaseTopology {
  *generatePathInfoVariants(
    gridSize: [number, number, number],
    params: Record<string, any>,
    maxVariants: number
  ): Generator<IPathInfo> {
    let count = 0;
    // Loop sizes 5..12
    for (let size = 5; size < 13; size++) {
        if (count >= maxVariants) return;
        
        const variantParams = { ...params };
        variantParams.grid_width = size;
        variantParams.grid_depth = size;
        yield this.generatePathInfo(gridSize, variantParams);
        count++;
    }
  }

  generatePathInfo(
    gridSize: [number, number, number],
    params: Record<string, any>
  ): IPathInfo {
    console.log("    LOG: Generating 'grid' topology...");

    const width = params.grid_width || 10;
    const depth = params.grid_depth || 10;

    // Create walkable plane
    const pathCoords: Coord[] = [];
    for (let x = 1; x <= width; x++) {
        for (let z = 1; z <= depth; z++) {
            pathCoords.push([x, 0, z]);
        }
    }

    // Random Start/End
    // Start: 1 .. width/2
    const startX = Math.floor(Math.random() * (Math.floor(width / 2))) + 1;
    const startZ = Math.floor(Math.random() * (Math.floor(depth / 2))) + 1;
    const startPos: Coord = [startX, 0, startZ];

    // End: width/2+1 .. width
    // range: (width//2 + 1) to width
    const minEndX = Math.floor(width / 2) + 1;
    const minEndZ = Math.floor(depth / 2) + 1;
    
    // Safety check if width < 2
    const safeMinEndX = Math.min(minEndX, width);
    const safeMinEndZ = Math.min(minEndZ, depth);

    const targetX = Math.floor(Math.random() * (width - safeMinEndX + 1)) + safeMinEndX;
    const targetZ = Math.floor(Math.random() * (depth - safeMinEndZ + 1)) + safeMinEndZ;
    const targetPos: Coord = [targetX, 0, targetZ];

    // Handle 'items_to_place' params (origin conversion) - logic only relevant if passing config down
    // Since TS generator might not be mutating params object for caller, we skip explicit mutation
    // unless strictly needed. The Python code mutates 'item_config' in place. 
    // We assume TS caller handles config separate or doesn't use this side-effect.

    // Metadata
    const rows: Coord[][] = [];
    for (let z = 1; z <= depth; z++) {
        const row: Coord[] = [];
        for (let x = 1; x <= width; x++) row.push([x, 0, z]);
        rows.push(row);
    }
    
    const columns: Coord[][] = [];
    for (let x = 1; x <= width; x++) {
        const col: Coord[] = [];
        for (let z = 1; z <= depth; z++) col.push([x, 0, z]);
        columns.push(col);
    }

    const metadata = {
        topology_type: "grid",
        rows: rows,
        columns: columns,
        width: width,
        depth: depth,
        semantic_positions: {
            start: startPos,
            end: targetPos,
            optimal_start: 'start',
            optimal_end: 'end',
            valid_pairs: [
                {
                    name: 'row_based_easy',
                    start: 'start',
                    end: 'end',
                    path_type: 'row_traversal',
                    strategies: ['row_column_iteration', 'alternating_patterns'],
                    difficulty: 'EASY',
                    teaching_goal: 'Items along rows'
                },
                {
                    name: 'diagonal_pattern_medium',
                    start: 'start',
                    end: 'end',
                    path_type: 'diagonal',
                    strategies: ['row_column_iteration', 'diagonal_patterns'],
                    difficulty: 'MEDIUM',
                    teaching_goal: 'Diagonal placement'
                },
                {
                    name: 'checkerboard_hard',
                    start: 'start',
                    end: 'end',
                    path_type: 'checkerboard',
                    strategies: ['row_column_iteration', 'alternating_patterns'],
                    difficulty: 'HARD',
                    teaching_goal: 'Complex grid pattern'
                }
            ]
        }
    };

    return {
        start_pos: startPos,
        target_pos: targetPos,
        path_coords: pathCoords,
        placement_coords: pathCoords, // Grid: path is placement
        obstacles: [],
        metadata: metadata
    };
  }
}
