/**
 * Academic Placer - Main Exports
 * 
 * A system for analyzing map structure and generating academic placements
 * for teaching programming concepts through game mechanics.
 */

// Core analyzer
export { MapAnalyzer, testMapAnalyzer } from './MapAnalyzer';
export type {
  Vector3,
  Block,
  GameConfig,
  PathSegment,
  Area,
  Connector,
  Pattern,
  PathRelation,
  SpecialPoint,
  PlacementContext,
  PrioritizedCoord,
  MapMetrics,
  PlacementConstraints,
  CoordCategory
} from './MapAnalyzer';

// Academic concepts
export type {
  AcademicConcept,
  ConceptCategory,
  ConceptMetadata
} from './AcademicConceptTypes';

export {
  CONCEPT_CURRICULUM,
  getConceptMetadata,
  getConceptsByCategory,
  getPrerequisites,
  checkPrerequisites,
  getNextConcepts,
  createDefaultSolution
} from './AcademicConceptTypes';

// Placement generator
export { AcademicPlacementGenerator, testAcademicGenerator } from './AcademicPlacementGenerator';
export type {
  AcademicPlacement,
  ItemPlacement,
  ItemType,
  ExpectedSolution
} from './AcademicPlacementGenerator';

// Generators
export * from './generators';

// Strategy (optional, for advanced usage)
// Note: PlacementStrategy is now integrated into MapAnalyzer
