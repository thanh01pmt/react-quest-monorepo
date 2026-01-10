/**
 * Fill Bounding Box Processor
 * 
 * Fills all empty cells within the path's bounding box.
 */

import {
  FillBoundingBoxConfig,
  GeneratedBlock,
  Coord3D,
  BoundingBox,
  calculateBoundingBox,
  coordKey
} from './types';

export interface FillBoundingBoxResult {
  blocks: GeneratedBlock[];
  boundingBox: BoundingBox;
}

/**
 * Fill bounding box with blocks
 * 
 * @param pathCoords - Coordinates of the existing path
 * @param existingBlocks - Blocks already in the map
 * @param config - Configuration options
 * @returns New blocks to add to the map
 */
export function fillBoundingBox(
  pathCoords: Coord3D[],
  existingBlocks: GeneratedBlock[],
  config: FillBoundingBoxConfig
): FillBoundingBoxResult {
  const offset = config.offset ?? 0;
  const material = config.material ?? 'grass';
  const walkable = config.walkable ?? true;

  // Calculate bounding box
  const box = calculateBoundingBox(pathCoords);
  
  // Expand by offset
  const expandedBox: BoundingBox = {
    minX: box.minX - offset,
    maxX: box.maxX + offset,
    minY: box.minY,
    maxY: box.maxY,
    minZ: box.minZ - offset,
    maxZ: box.maxZ + offset
  };

  // Create set of existing block positions for fast lookup
  const existingPositions = new Set<string>();
  for (const block of existingBlocks) {
    existingPositions.add(coordKey({ x: block.x, y: block.y, z: block.z }));
  }

  // Generate new blocks for empty positions
  const newBlocks: GeneratedBlock[] = [];
  const y = box.minY; // Fill at ground level

  for (let x = expandedBox.minX; x <= expandedBox.maxX; x++) {
    for (let z = expandedBox.minZ; z <= expandedBox.maxZ; z++) {
      const key = coordKey({ x, y, z });
      if (!existingPositions.has(key)) {
        newBlocks.push({
          x,
          y,
          z,
          model: material,
          walkable
        });
      }
    }
  }

  return {
    blocks: newBlocks,
    boundingBox: expandedBox
  };
}
