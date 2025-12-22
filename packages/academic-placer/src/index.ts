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
  CoordCategory,
  SelectableElement
} from './MapAnalyzer';

// Selectable Elements (for UI selection)
export type {
  Coord,
  ElementType,
  ElementCategory,
  ElementDisplay,
  ElementRelationships,
  ElementSelector
} from './SelectableElement';

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
} from './SelectableElement';

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

// Placement Templates (for saving/applying placement patterns)
export type {
  PlacementRule,
  PlacementRuleOptions,
  PlacementTemplate,
  TemplateItemPlacement
} from './PlacementTemplate';

export {
  PlacementTemplateRegistry,
  getTemplateRegistry,
  initializeDefaultTemplates,
  DEFAULT_TEMPLATES
} from './PlacementTemplate';

// Generators
export * from './generators';

// Strategy (optional, for advanced usage)
// Note: PlacementStrategy is now integrated into MapAnalyzer
