/**
 * Extend Shape Processor
 * 
 * Creates shape extensions at switch positions.
 */

import {
  ExtendShapeConfig,
  GeneratedBlock,
  Coord3D,
  generateShapeCoords,
  generateConnectorCoords,
  getMovementDirection,
  coordKey
} from './types';

export interface SwitchPosition {
  coord: Coord3D;
  pathIndex: number;
}

export interface ExtendShapeResult {
  blocks: GeneratedBlock[];
  extensions: Array<{
    switchPosition: Coord3D;
    shapeCoords: Coord3D[];
    connectorCoords: Coord3D[];
  }>;
}

/**
 * Find all switch positions in the map
 * 
 * @param interactibles - Array of interactible items (switches)
 * @param pathCoords - Path coordinates to find closest path index
 * @returns Array of switch positions with path index
 */
export function findSwitchPositions(
  interactibles: Array<{ type: string; position: { x: number; y: number; z: number } }>,
  pathCoords: Coord3D[]
): SwitchPosition[] {
  const switches = interactibles.filter(i => i.type === 'switch');
  
  return switches.map(sw => {
    const coord: Coord3D = {
      x: sw.position.x,
      y: sw.position.y,
      z: sw.position.z
    };
    
    // Find closest path index
    let closestIndex = 0;
    let closestDist = Infinity;
    for (let i = 0; i < pathCoords.length; i++) {
      const p = pathCoords[i];
      const dist = Math.abs(p.x - coord.x) + Math.abs(p.z - coord.z);
      if (dist < closestDist) {
        closestDist = dist;
        closestIndex = i;
      }
    }
    
    return { coord, pathIndex: closestIndex };
  });
}

/**
 * Extend shapes at switch positions
 * 
 * @param pathCoords - Coordinates of the path
 * @param interactibles - Interactible items in the map
 * @param existingBlocks - Blocks already in the map
 * @param config - Configuration options
 * @returns New blocks and extension details
 */
export function extendShape(
  pathCoords: Coord3D[],
  interactibles: Array<{ type: string; position: { x: number; y: number; z: number } }>,
  existingBlocks: GeneratedBlock[],
  config: ExtendShapeConfig
): ExtendShapeResult {
  const shape = config.shape ?? 'square';
  const size = config.size ?? 3;
  const bias = config.bias ?? 'center';
  const levelMode = config.levelMode ?? 'same';
  const material = config.material ?? 'grass';
  const connectPath = config.connectPath ?? false;

  // Find switch positions
  const switchPositions = findSwitchPositions(interactibles, pathCoords);
  
  if (switchPositions.length === 0) {
    return { blocks: [], extensions: [] };
  }

  // Create set of existing positions
  const existingPositions = new Set<string>();
  for (const block of existingBlocks) {
    existingPositions.add(coordKey({ x: block.x, y: block.y, z: block.z }));
  }

  const allNewBlocks: GeneratedBlock[] = [];
  const extensions: ExtendShapeResult['extensions'] = [];

  for (const { coord, pathIndex } of switchPositions) {
    // Determine movement direction at this point
    const movementDir = getMovementDirection(pathCoords, pathIndex);
    
    // Adjust Y level based on levelMode
    const shapeY = levelMode === 'stepDown' ? coord.y - 1 : coord.y;
    const shapeCenter: Coord3D = { x: coord.x, y: shapeY, z: coord.z };
    
    // Generate shape coordinates
    const shapeCoords = generateShapeCoords(
      shape,
      size,
      shapeCenter,
      bias,
      movementDir
    );
    
    // Generate connector if needed
    let connectorCoords: Coord3D[] = [];
    if (connectPath && bias !== 'center') {
      connectorCoords = generateConnectorCoords(
        coord,
        shapeCoords,
        movementDir,
        bias
      );
    }

    // Add blocks for shape (skip existing)
    for (const c of shapeCoords) {
      const key = coordKey(c);
      if (!existingPositions.has(key)) {
        allNewBlocks.push({
          x: c.x,
          y: c.y,
          z: c.z,
          model: material,
          walkable: true
        });
        existingPositions.add(key);
      }
    }

    // Add blocks for connector (skip existing)
    for (const c of connectorCoords) {
      const key = coordKey(c);
      if (!existingPositions.has(key)) {
        allNewBlocks.push({
          x: c.x,
          y: c.y,
          z: c.z,
          model: material,
          walkable: true
        });
        existingPositions.add(key);
      }
    }

    extensions.push({
      switchPosition: coord,
      shapeCoords,
      connectorCoords
    });
  }

  return {
    blocks: allNewBlocks,
    extensions
  };
}
