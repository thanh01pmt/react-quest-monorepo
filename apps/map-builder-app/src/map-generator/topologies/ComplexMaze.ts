/**
 * Complex Maze Topology
 * Creates a complex maze using Randomized Depth-First Search algorithm
 */

import { BaseTopology } from './BaseTopology';
import { IPathInfo, Coord } from '../types';

export class ComplexMazeTopology extends BaseTopology {
  *generatePathInfoVariants(
    gridSize: [number, number, number],
    params: Record<string, any>,
    maxVariants: number
  ): Generator<IPathInfo> {
    let baseSize = params.maze_width || 7;
    if (baseSize % 2 === 0) baseSize++;

    for (let i = 0; i < maxVariants; i++) {
      const size = baseSize + i * 2;
      if (size > 15) break;
      
      yield this.generatePathInfo(gridSize, {
        ...params,
        maze_width: size,
        maze_depth: size
      });
    }
  }

  generatePathInfo(gridSize: [number, number, number], params: Record<string, any>): IPathInfo {
    let width = params.maze_width || 9;
    let depth = params.maze_depth || 9;
    
    // Ensure odd dimensions
    if (width % 2 === 0) width--;
    if (depth % 2 === 0) depth--;
    
    const y = 0;

    // Create grid filled with walls (1 = wall, 0 = path)
    const grid: number[][] = [];
    for (let x = 0; x < width; x++) {
      grid[x] = [];
      for (let z = 0; z < depth; z++) {
        grid[x][z] = 1;
      }
    }

    // Randomized DFS maze generation
    const startX = 1 + Math.floor(Math.random() * Math.floor((width - 1) / 2)) * 2;
    const startZ = 1 + Math.floor(Math.random() * Math.floor((depth - 1) / 2)) * 2;
    
    const stack: [number, number][] = [[startX, startZ]];
    grid[startX][startZ] = 0;

    while (stack.length > 0) {
      const [cx, cz] = stack[stack.length - 1];
      
      // Find unvisited neighbors
      const neighbors: [number, number][] = [];
      const directions: [number, number][] = [[0, 2], [0, -2], [2, 0], [-2, 0]];
      
      for (const [dx, dz] of directions) {
        const nx = cx + dx;
        const nz = cz + dz;
        if (nx >= 0 && nx < width && nz >= 0 && nz < depth && grid[nx][nz] === 1) {
          neighbors.push([nx, nz]);
        }
      }

      if (neighbors.length > 0) {
        const [nx, nz] = neighbors[Math.floor(Math.random() * neighbors.length)];
        
        // Remove wall between current and neighbor
        const wallX = (cx + nx) / 2;
        const wallZ = (cz + nz) / 2;
        grid[wallX][wallZ] = 0;
        grid[nx][nz] = 0;
        
        stack.push([nx, nz]);
      } else {
        stack.pop();
      }
    }

    // Collect walkable coords
    const walkableCoords: Coord[] = [];
    for (let x = 0; x < width; x++) {
      for (let z = 0; z < depth; z++) {
        if (grid[x][z] === 0) {
          walkableCoords.push([x, y, z]);
        }
      }
    }

    // Set start and target at opposite corners
    const startPos: Coord = [1, y, 1];
    const targetPos: Coord = [width - 2, y, depth - 2];
    
    // Ensure start and target are walkable
    grid[1][1] = 0;
    grid[width - 2][depth - 2] = 0;

    // Find path using BFS
    const pathCoords = this.findPath(grid, startPos, targetPos, width, depth);

    // Find dead ends
    const deadEnds: Coord[] = [];
    for (const coord of walkableCoords) {
      let neighbors = 0;
      for (const [dx, dz] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
        const nx = coord[0] + dx;
        const nz = coord[2] + dz;
        if (nx >= 0 && nx < width && nz >= 0 && nz < depth && grid[nx][nz] === 0) {
          neighbors++;
        }
      }
      if (neighbors === 1) {
        deadEnds.push(coord);
      }
    }

    return {
      start_pos: startPos,
      target_pos: targetPos,
      path_coords: pathCoords.length > 0 ? pathCoords : walkableCoords,
      placement_coords: walkableCoords,
      obstacles: [],
      metadata: {
        topology_type: 'complex_maze',
        dead_ends: deadEnds,
        width: width,
        depth: depth,
      },
    };
  }

  private findPath(grid: number[][], start: Coord, end: Coord, width: number, depth: number): Coord[] {
    const y = start[1];
    const queue: { pos: [number, number]; path: Coord[] }[] = [
      { pos: [start[0], start[2]], path: [start] }
    ];
    const visited = new Set<string>([`${start[0]},${start[2]}`]);

    while (queue.length > 0) {
      const { pos, path } = queue.shift()!;
      const [cx, cz] = pos;

      if (cx === end[0] && cz === end[2]) return path;

      for (const [dx, dz] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
        const nx = cx + dx;
        const nz = cz + dz;
        const key = `${nx},${nz}`;

        if (nx >= 0 && nx < width && nz >= 0 && nz < depth &&
            grid[nx][nz] === 0 && !visited.has(key)) {
          visited.add(key);
          queue.push({
            pos: [nx, nz],
            path: [...path, [nx, y, nz]]
          });
        }
      }
    }
    return [];
  }
}
