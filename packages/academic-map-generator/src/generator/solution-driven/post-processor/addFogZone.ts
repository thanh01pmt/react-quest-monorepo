
import { 
  AddFogZoneConfig, 
  Coord3D, 
  GeneratedBlock,
  calculateBoundingBox,
  BoundingBox
} from './types';

export interface AddFogZoneResult {
  result: {
    zoneCount: number;
    zones: Array<{
      position: { x: number; y: number; z: number };
      scale: { x: number; y: number; z: number };
      color: string;
      density: number;
      opacity: number;
      noiseSpeed: number;
    }>;
  };
  blocks: GeneratedBlock[]; // No new blocks added, but required by signature
}

/**
 * Add Fog Zone Post Processor
 * 
 * Adds a volumetric fog zone covering the generated map or path.
 */
export function addFogZone(
  pathCoords: Coord3D[],
  blocks: GeneratedBlock[],
  config: AddFogZoneConfig,
  rng?: () => number
): AddFogZoneResult {
  const color = config.color || '#eeeeee';
  const density = config.density ?? 0.5;
  const opacity = config.opacity ?? 0.5;
  const noiseSpeed = config.noiseSpeed ?? 0.1;
  const padding = config.padding ?? 2;
  const height = config.height ?? 10;
  const yOffset = config.yOffset ?? 0;
  const boundsMode = config.boundsMode || 'auto';

  // Determine coordinates to bound
  let coordsToBound: Coord3D[] = [];
  
  if (boundsMode === 'path') {
    coordsToBound = pathCoords;
  } else {
    // Auto: use all blocks (including ground)
    coordsToBound = blocks.map(b => ({ x: b.x, y: b.y, z: b.z }));
    // If no blocks, fallback to path
    if (coordsToBound.length === 0) {
      coordsToBound = pathCoords;
    }
  }

  const bbox = calculateBoundingBox(coordsToBound);
  
  // Calculate center and size
  const width = (bbox.maxX - bbox.minX) + (padding * 2) + 1; // +1 for single block width
  const depth = (bbox.maxZ - bbox.minZ) + (padding * 2) + 1;
  
  const centerX = (bbox.minX + bbox.maxX) / 2;
  const centerZ = (bbox.minZ + bbox.maxZ) / 2;
  const centerY = (bbox.minY + bbox.maxY) / 2 + yOffset; // Center vertically relative to map? 
  // FogZone renders centered.
  // If we want it to sit on ground, Y should be adjusted.
  // Usually fog starts slightly above ground or covers it.
  // Let's position it at map's average Y + height/2 + yOffset?
  // User might expect Y to be ground level.
  // Let's use bounding box Y center + offset.
  
  // Or maybe just fixed Y? 
  // bbox.minY is usually -1 (ground). bbox.maxY is usually player level (0 or higher).
  // Let's center it vertically around the map content, but with configured height.
  // Center Y = (minY + maxY) / 2 + yOffset.
  // We want the bottom to be roughly at minY - padding?
  
  const zone = {
    position: { x: centerX, y: centerY + (height / 2), z: centerZ }, // Shift up so bottom is near center Y?
    // Actually, Cloud component centers at position.
    // If we want it to cover the map from minY to maxY:
    // We should place center at (minY+maxY)/2.
    scale: { x: width, y: height, z: depth },
    color,
    density,
    opacity,
    noiseSpeed
  };
  
  // Adjust position.y to be center of the volume.
  // If we want the volume to start at `bbox.minY - padding`, then:
  // center.y = (bbox.minY - padding) + height / 2 + yOffset;
  // Let's use this logic for more predictable placement.
  // Default padding 2, so it starts slightly below ground.
  zone.position.y = (bbox.minY - padding) + (height / 2) + yOffset;

  return {
    blocks: [], // No blocks added
    result: {
      zoneCount: 1,
      zones: [zone]
    }
  };
}
