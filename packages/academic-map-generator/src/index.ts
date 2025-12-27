/**
 * Academic Map Generator
 * 
 * A unified package for generating and analyzing educational game maps.
 * 
 * @packageDocumentation
 * 
 * ## Modules
 * 
 * - `core` - Shared types and utilities (Coord, Segment, geometry functions)
 * - `generator` - Create maps from topologies (31 topology types, placement service)
 * - `analyzer` - Analyze existing maps (4-tier analysis, academic concept matching)
 * 
 * ## Quick Start
 * 
 * ### Generate a map from topology
 * ```typescript
 * import { PlacementService, LShapeTopology, PedagogyStrategy } from '@repo/academic-map-generator';
 * 
 * const service = new PlacementService();
 * const topology = new LShapeTopology();
 * 
 * const result = await service.generateMap({
 *   topology,
 *   params: { arm_length: 5 },
 *   strategy: PedagogyStrategy.LOOP_LOGIC,
 *   difficulty: 'simple',
 *   assetMap
 * });
 * ```
 * 
 * ### Analyze an existing map
 * ```typescript
 * import { MapAnalyzer, AcademicPlacementGenerator } from '@repo/academic-map-generator';
 * 
 * const analyzer = new MapAnalyzer(gameConfig);
 * const context = analyzer.analyze();
 * 
 * const generator = new AcademicPlacementGenerator(context);
 * const placements = generator.generateForConcept('repeat_n');
 * ```
 */

// ============================================================================
// CORE MODULE
// ============================================================================

// Types
export type {
  Coord,
  Direction,
  Vector3Object,
  Segment,
  PathSegment,
  PathInfo,
  IPathInfo,
  Obstacle,
  IObstacle,
  Item,
  IItem,
  MapData,
  IMapData,
  Area,
  Hole,
  Gateway,
  MetaPath,
  SegmentAnalysis,
  ISegmentAnalysis,
  GeometricType,
  PathRelation,
  SpecialPoint,
  Connector,
  Pattern,
  CoordCategory,
  PrioritizedCoord,
  Block,
  GameConfig
} from './core';

// Geometry utilities
export {
  // Direction constants
  FORWARD_X, BACKWARD_X,
  FORWARD_Y, BACKWARD_Y,
  FORWARD_Z, BACKWARD_Z,
  DIRECTIONS_2D, DIRECTIONS_3D,
  
  // Conversion functions
  objectToCoord, coordToObject,
  coordToKey, keyToCoord,
  coord2DToKey, keyToCoord2D,
  
  // Vector operations
  addCoords, subCoords, scaleCoord,
  dotCoords, crossCoords,
  magnitude, normalize, distance, manhattanDistance,
  coordsEqual, areAdjacent,
  
  // Bounding box
  getBoundingBox, getCentroid,
  
  // Neighbors
  getHorizontalNeighbors, getNeighbors,
  
  // Legacy aliases
  addVectors, areVectorsEqual, vectorToString
} from './core';

// Segment utilities
export {
  computeSegments,
  createSegments,
  analyzeSegments,
  findSymmetricSegments,
  mergeShortSegments,
  getPlacementPositions,
  getIntervalPositions
} from './core';

// ============================================================================
// GENERATOR MODULE
// ============================================================================

// Topologies
export {
  BaseTopology,
  StraightLineTopology,
  LShapeTopology,
  UShapeTopology,
  TShapeTopology,
  HShapeTopology,
  VShapeTopology,
  SShapeTopology,
  ZShapeTopology,
  ArrowShapeTopology,
  EFShapeTopology,
  PlusShapeTopology,
  StarShapeTopology,
  SpiralTopology,
  Spiral3DTopology,
  GridTopology,
  GridWithHolesTopology,
  SquareTopology,
  TriangleTopology,
  ZigzagTopology,
  PlowingFieldTopology,
  StaircaseTopology,
  Staircase3DTopology,
  SimplePathTopology,
  ComplexMazeTopology,
  SwiftPlaygroundMazeTopology,
  PlusShapeIslandsTopology,
  SymmetricalIslandsTopology,
  HubWithSteppedIslandsTopology,
  SteppedIslandClustersTopology,
  InterspersedPathTopology
} from './generator';

// Registry & Service
export {
  TopologyRegistry,
  getTopologyRegistry,
  PlacementService
} from './generator';

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
  getSolutionFirstPlacer,
  PedagogyStrategy,
  DensityMode
} from './generator';

// Strategies
export {
  StrategyRegistry,
  getStrategyRegistry
} from './generator';

// Synthesizers
export {
  getSynthesizerRegistry,
  getFunctionSynthesizer,
  getDefaultSynthesizer
} from './generator';

// Validation
export {
  getPathVerifier,
  verifyPath,
  verifyPathConnectivity,
  verifyPathReachability,
  verifyPathWithObjects,
  validateMap,
  validateTier1,
  validateTier2,
  validateTier3
} from './generator';

export type {
  TierValidationResult,
  ValidationReport,
  MapDataForValidation,
  PathVerificationResult
} from './generator';

// Solution-Driven Generator
export {
  SolutionDrivenGenerator,
  TemplateFactory,
  generateFromCode,
  TemplateInterpreter,
  SolutionBuilder
} from './generator';

export type {
  CodeTemplate,
  ParameterConfig,
  GradeLevel,
  SolutionDrivenResult,
  GeneratedGameConfig,
  GenerationMetadata,
  ExecutionTrace,
  StructuredSolution,
  BlockAction
} from './generator';

// ============================================================================
// ANALYZER MODULE
// ============================================================================

// Core analysis
export {
  MapAnalyzer
} from './analyzer';

// Types from MapAnalyzer (needed by UI components)
export type {
  PlacementContext,
  MapMetrics,
  Vector3,
  PathSegment as AnalyzerPathSegment,
  Area as AnalyzerArea,
  Pattern as AnalyzerPattern,
  Tier1Result,
  Tier2Result,
  Tier3Result
} from './analyzer';

// Academic concepts
export {
  CONCEPT_CURRICULUM,
  getConceptMetadata,
  getConceptsByCategory,
  getPrerequisites,
  checkPrerequisites,
  getNextConcepts,
  createDefaultSolution
} from './analyzer';

export type {
  AcademicConcept,
  ConceptCategory,
  ConceptMetadata
} from './analyzer';

// Placement generator
export {
  AcademicPlacementGenerator,
  testAcademicGenerator
} from './analyzer';

export type {
  AcademicPlacement,
  ItemPlacement,
  ItemType,
  ExpectedSolution
} from './analyzer';

// Markdown reporter
export {
  MarkdownReporter,
  MapAnalysisService
} from './analyzer';

// Coordinate prioritizer
export {
  prioritizeCoordinates,
  getTopPriorityCoords,
  getCoordsByCategory,
  TOPOLOGY_KEY_POINTS
} from './analyzer';

// Placement templates
export {
  PlacementTemplateRegistry,
  getTemplateRegistry,
  initializeDefaultTemplates,
  DEFAULT_TEMPLATES,
  SEGMENT_PATTERNS,
  applySegmentPattern,
  getApplicablePatterns
} from './analyzer';

export type {
  PlacementRule,
  PlacementRuleOptions,
  PlacementTemplate,
  TemplateItemPlacement,
  SegmentPattern
} from './analyzer';

// Selectable elements
export {
  generateElementId,
  parseElementId,
  getCategoryColor,
  getTypeIcon,
  createKeypointElement,
  createSegmentElement,
  createPositionElements,
  findElementById,
  findElementsBySelector,
  getMirrorElement
} from './analyzer';

export type {
  SECoord,
  ElementType,
  ElementCategory,
  ElementDisplay,
  ElementRelationships,
  ElementSelector,
  SelectableElement
} from './analyzer';
