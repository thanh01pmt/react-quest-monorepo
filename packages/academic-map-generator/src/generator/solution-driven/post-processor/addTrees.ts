/**
 * AddTrees Post-Processor
 * 
 * Adds tree blocks to non-path positions on the map.
 * Trees are placed on top of the highest available block at each (x, z) position.
 */

import { Coord3D, GeneratedBlock, coordKey } from './types';

export interface AddTreesConfig {
  type: 'addTrees';
  count?: number | [number, number];  // Default: [3, 5] - min and max tree count
  treeTypes?: string[];               // Default: ['tree01', 'tree02', 'tree03', 'tree04', 'tree05']
  excludePath?: boolean;              // Default: true - don't place on path
}

export interface AddTreesResult {
  addedCount: number;
  treePositions: Coord3D[];
}

/**
 * Add trees to non-path positions in the map
 */
export function addTrees(
  pathCoords: Coord3D[],
  blocks: GeneratedBlock[],
  config: AddTreesConfig
): { blocks: GeneratedBlock[]; result: AddTreesResult } {
  // Default config
  const countConfig = config.count ?? [3, 5];
  const treeTypes = config.treeTypes ?? ['tree.tree01', 'tree.tree02', 'tree.tree03', 'tree.tree04', 'tree.tree05'];
  const excludePath = config.excludePath ?? true;

  // Calculate actual tree count
  const treeCount = Array.isArray(countConfig)
    ? Math.floor(Math.random() * (countConfig[1] - countConfig[0] + 1)) + countConfig[0]
    : countConfig;

  // Create set of path coordinates for quick lookup
  const pathSet = new Set<string>();
  for (const coord of pathCoords) {
    pathSet.add(`${coord.x},${coord.z}`);
  }

  // Find highest Y for each (x, z) position
  const highestY = new Map<string, number>();
  for (const block of blocks) {
    const key = `${block.x},${block.z}`;
    const currentHighest = highestY.get(key) ?? -Infinity;
    if (block.y > currentHighest) {
      highestY.set(key, block.y);
    }
  }

  // Filter valid positions (blocks with tops, excluding path if configured)
  const availablePositions: { x: number; z: number; y: number }[] = [];
  for (const [key, y] of highestY.entries()) {
    const [x, z] = key.split(',').map(Number);
    
    // Skip if on path and excludePath is true
    if (excludePath && pathSet.has(key)) {
      continue;
    }
    
    availablePositions.push({ x, z, y });
  }

  // Shuffle and select positions
  const shuffled = [...availablePositions].sort(() => Math.random() - 0.5);
  const selectedPositions = shuffled.slice(0, Math.min(treeCount, shuffled.length));

  // Create tree blocks
  const treeBlocks: GeneratedBlock[] = selectedPositions.map(pos => {
    const randomTreeType = treeTypes[Math.floor(Math.random() * treeTypes.length)];
    return {
      x: pos.x,
      y: pos.y + 1, // Trees sit on top of the highest block
      z: pos.z,
      model: randomTreeType,
      walkable: false
    };
  });

  return {
    blocks: treeBlocks,
    result: {
      addedCount: treeBlocks.length,
      treePositions: treeBlocks.map(b => ({ x: b.x, y: b.y, z: b.z }))
    }
  };
}
