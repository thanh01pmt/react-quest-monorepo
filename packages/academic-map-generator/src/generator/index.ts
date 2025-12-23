/**
 * Generator Module - Exports for map generation from topologies
 */

// Core types (re-export for convenience)
export type { Coord, PathInfo, Segment, SegmentAnalysis, IPathInfo } from '../core/types';

// Topologies
export { BaseTopology } from './topologies/BaseTopology';
export { StraightLineTopology } from './topologies/StraightLine';
export { LShapeTopology } from './topologies/LShape';
export { UShapeTopology } from './topologies/UShape';
export { TShapeTopology } from './topologies/TShape';
export { HShapeTopology } from './topologies/HShape';
export { VShapeTopology } from './topologies/VShape';
export { SShapeTopology } from './topologies/SShape';
export { ZShapeTopology } from './topologies/ZShape';
export { ArrowShapeTopology } from './topologies/ArrowShape';
export { EFShapeTopology } from './topologies/EFShape';
export { PlusShapeTopology } from './topologies/PlusShape';
export { StarShapeTopology } from './topologies/StarShape';
export { SpiralTopology } from './topologies/Spiral';
export { Spiral3DTopology } from './topologies/Spiral3D';
export { GridTopology } from './topologies/Grid';
export { GridWithHolesTopology } from './topologies/GridWithHoles';
export { SquareTopology } from './topologies/Square';
export { TriangleTopology } from './topologies/Triangle';
export { ZigzagTopology } from './topologies/Zigzag';
export { PlowingFieldTopology } from './topologies/PlowingField';
export { StaircaseTopology } from './topologies/Staircase';
export { Staircase3DTopology } from './topologies/Staircase3D';
export { SimplePathTopology } from './topologies/SimplePath';
export { ComplexMazeTopology } from './topologies/ComplexMaze';
export { SwiftPlaygroundMazeTopology } from './topologies/SwiftPlaygroundMaze';
export { PlusShapeIslandsTopology } from './topologies/PlusShapeIslands';
export { SymmetricalIslandsTopology } from './topologies/SymmetricalIslands';
export { HubWithSteppedIslandsTopology } from './topologies/HubWithSteppedIslands';
export { SteppedIslandClustersTopology } from './topologies/SteppedIslandClusters';
export { InterspersedPathTopology } from './topologies/InterspersedPath';

// Registry
export { TopologyRegistry } from './TopologyRegistry';

// Singleton accessor for TopologyRegistry
import { TopologyRegistry as _TR } from './TopologyRegistry';
export function getTopologyRegistry() {
  return _TR.getInstance();
}

// Main service
export { PlacementService } from './PlacementService';

// Handlers
export {
  getStrategySelector,
  getSemanticPositionHandler,
  getPedagogicalStrategyHandler,
  getPatternComplexityModifier,
  getPatternLibrary,
  getPlacementCalculator,
  getSymmetricPlacer,
  getFallbackHandler,
  getSolutionFirstPlacer
} from './handlers';

export type {
  PlannedSolution,
  PlacementResult
} from './handlers';

// Strategies - includes PedagogyStrategy and DensityMode enums
export {
  StrategyRegistry,
  getStrategyRegistry
} from './strategies';

export {
  PedagogyStrategy,
  DensityMode
} from './strategies/types';

// Synthesizers
export {
  getSynthesizerRegistry,
  getFunctionSynthesizer,
  getDefaultSynthesizer
} from './synthesizers';

// Validation  
export {
  getPathVerifier,
  verifyPath,
  verifyPathConnectivity,
  verifyPathReachability,
  verifyPathWithObjects
} from './validation/PathVerifier';

export {
  validateMap,
  validateTier1,
  validateTier2,
  validateTier3
} from './validation/ValidationPipeline';

export type {
  PathVerificationResult
} from './validation/PathVerifier';

export type {
  TierValidationResult,
  ValidationReport,
  MapDataForValidation
} from './validation/ValidationPipeline';
