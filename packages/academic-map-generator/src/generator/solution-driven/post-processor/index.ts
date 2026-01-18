/**
 * Post-Processor Module Entry Point
 * 
 * Exports all post-processor types and functions.
 */

// Types
export type {
  PostProcessorConfig,
  FillBoundingBoxConfig,
  ExtendShapeConfig,
  SidewalkConfig,
  ColumnSupportConfig,
  WallExtrusionConfig,
  AddTreesConfig,
  AddFogZoneConfig,
  ShapeType,
  BiasDirection,
  LevelMode,
  Coord3D,
  GeneratedBlock,
  BoundingBox,
  FogZoneData
} from './types';

export {
  calculateBoundingBox,
  getPerpendicularDirection,
  getMovementDirection,
  generateShapeCoords,
  generateConnectorCoords,
  coordKey,
  DIRECTION_VECTORS
} from './types';

// Processors
export { fillBoundingBox } from './fillBoundingBox';
export type { FillBoundingBoxResult } from './fillBoundingBox';

export { extendShape, findSwitchPositions } from './extendShape';
export type { ExtendShapeResult, SwitchPosition } from './extendShape';

export { addTrees } from './addTrees';
export type { AddTreesResult } from './addTrees';

export { addFogZone } from './addFogZone';
export type { AddFogZoneResult } from './addFogZone';

// Main executor
import { PostProcessorConfig, Coord3D, GeneratedBlock, FogZoneData } from './types';
import { fillBoundingBox, FillBoundingBoxResult } from './fillBoundingBox';
import { extendShape, ExtendShapeResult } from './extendShape';
import { addTrees, AddTreesResult } from './addTrees';
import { addFogZone, AddFogZoneResult } from './addFogZone';

export interface PostProcessorContext {
  pathCoords: Coord3D[];
  blocks: GeneratedBlock[];
  interactibles: Array<{ type: string; position: { x: number; y: number; z: number } }>;
  rng?: () => number;
}

export interface PostProcessorResult {
  newBlocks: GeneratedBlock[];
  newFogZones?: FogZoneData[];
  metadata: {
    type: string;
    details: FillBoundingBoxResult | ExtendShapeResult | AddTreesResult | AddFogZoneResult | null;
  };
}

/**
 * Execute a single post-processor configuration
 */
export function executePostProcessor(
  context: PostProcessorContext,
  config: PostProcessorConfig
): PostProcessorResult {
  switch (config.type) {
    case 'fillBoundingBox': {
      const result = fillBoundingBox(context.pathCoords, context.blocks, config);
      return {
        newBlocks: result.blocks,
        metadata: { type: 'fillBoundingBox', details: result }
      };
    }
    
    case 'extendShape': {
      const result = extendShape(
        context.pathCoords, 
        context.interactibles, 
        context.blocks, 
        config,
        context.rng // Pass the seeded RNG
      );
      return {
        newBlocks: result.blocks,
        metadata: { type: 'extendShape', details: result }
      };
    }
    
    case 'addTrees': {
      const result = addTrees(
        context.pathCoords,
        context.blocks,
        config,
        context.rng // Pass the seeded RNG
      );
      return {
        newBlocks: result.blocks,
        metadata: { type: 'addTrees', details: result.result }
      };
    }

    case 'addFogZone': {
      const result = addFogZone(
        context.pathCoords,
        context.blocks,
        config,
        context.rng
      );
      return {
        newBlocks: result.blocks,
        newFogZones: result.result.zones,
        metadata: { type: 'addFogZone', details: result }
      };
    }
    
    // Future processors
    case 'sidewalk':
    case 'columnSupport':
    case 'wallExtrusion':
      console.warn(`PostProcessor '${config.type}' is not yet implemented.`);
      return { newBlocks: [], metadata: { type: config.type, details: null } };
    
    default:
      console.warn(`Unknown PostProcessor type: ${(config as any).type}`);
      return { newBlocks: [], metadata: { type: 'unknown', details: null } };
  }
}

export interface PostProcessingSummary {
  blocks: GeneratedBlock[];
  fogZones: FogZoneData[];
}

/**
 * Execute multiple post-processors in sequence
 */
export function executePostProcessors(
  context: PostProcessorContext,
  configs: PostProcessorConfig[]
): PostProcessingSummary {
  let currentBlocks = [...context.blocks];
  const allNewBlocks: GeneratedBlock[] = [];
  const allFogZones: FogZoneData[] = [];
  
  for (const config of configs) {
    const result = executePostProcessor(
      { ...context, blocks: currentBlocks },
      config
    );
    
    allNewBlocks.push(...result.newBlocks);
    currentBlocks = [...currentBlocks, ...result.newBlocks];
    
    if (result.newFogZones) {
      allFogZones.push(...result.newFogZones);
    }
  }
  
  return { blocks: allNewBlocks, fogZones: allFogZones };
}
