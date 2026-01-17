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
  ShapeType,
  BiasDirection,
  LevelMode,
  Coord3D,
  GeneratedBlock,
  BoundingBox
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

// Main executor
import { PostProcessorConfig, Coord3D, GeneratedBlock } from './types';
import { fillBoundingBox, FillBoundingBoxResult } from './fillBoundingBox';
import { extendShape, ExtendShapeResult } from './extendShape';
import { addTrees, AddTreesResult } from './addTrees';

export interface PostProcessorContext {
  pathCoords: Coord3D[];
  blocks: GeneratedBlock[];
  interactibles: Array<{ type: string; position: { x: number; y: number; z: number } }>;
  rng?: () => number;
}

export interface PostProcessorResult {
  newBlocks: GeneratedBlock[];
  metadata: {
    type: string;
    details: FillBoundingBoxResult | ExtendShapeResult | AddTreesResult | null;
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

/**
 * Execute multiple post-processors in sequence
 */
export function executePostProcessors(
  context: PostProcessorContext,
  configs: PostProcessorConfig[]
): GeneratedBlock[] {
  let currentBlocks = [...context.blocks];
  const allNewBlocks: GeneratedBlock[] = [];
  
  for (const config of configs) {
    const result = executePostProcessor(
      { ...context, blocks: currentBlocks },
      config
    );
    
    allNewBlocks.push(...result.newBlocks);
    currentBlocks = [...currentBlocks, ...result.newBlocks];
  }
  
  return allNewBlocks;
}
