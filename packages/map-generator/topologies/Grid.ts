
import { BaseTopology } from './BaseTopology';
import { IPathInfo, Coord } from '../types';

export class GridTopology extends BaseTopology {
  *generatePathInfoVariants(
    gridSize: [number, number, number],
    params: Record<string, any>,
    maxVariants: number
  ): Generator<IPathInfo> {
    let count = 0;
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
    const width = params.grid_width || 10;
    const depth = params.grid_depth || 10;

    const pathCoords: Coord[] = [];
    for (let x = 1; x <= width; x++) {
        for (let z = 1; z <= depth; z++) {
            pathCoords.push([x, 0, z]);
        }
    }

    // Random start/end
    const startX = Math.floor(Math.random() * (width / 2)) + 1;
    const startZ = Math.floor(Math.random() * (depth / 2)) + 1;
    const startPos: Coord = [startX, 0, startZ];

    const targetX = Math.floor(Math.random() * (width / 2)) + (width / 2) + 1;
    const targetZ = Math.floor(Math.random() * (depth / 2)) + (depth / 2) + 1;
    const targetPos: Coord = [Math.min(targetX, width), 0, Math.min(targetZ, depth)];

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

    const validPairs = [
        {
            name: 'row_based_easy',
            start: 'start',
            end: 'end',
            path_type: 'row_traversal',
            strategies: ['row_column_iteration', 'alternating_patterns'],
            difficulty: 'EASY',
            teaching_goal: 'Items along rows'
        }
    ];

    const semanticPositions = {
        start: startPos,
        end: targetPos,
        optimal_start: 'start',
        optimal_end: 'end',
        valid_pairs: validPairs
    };

    // Segment analysis based on rows
    const segment_analysis = {
        num_segments: rows.length,
        lengths: rows.map(r => r.length),
        types: rows.map(() => 'grid_row'),
        min_length: width,
        max_length: width,
        avg_length: width
    };

    const metadata = {
        topology_type: "grid",
        rows: rows,
        columns: columns,
        width: width,
        depth: depth,
        segments: rows,
        segment_analysis,
        semantic_positions: semanticPositions
    };

    return {
        start_pos: startPos,
        target_pos: targetPos,
        path_coords: pathCoords,
        placement_coords: pathCoords,
        obstacles: [],
        metadata: metadata
    };
  }
}
