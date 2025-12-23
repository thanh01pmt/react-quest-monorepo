/**
 * Analyzer Module - Exports for map analysis and academic placement
 */

// Core analysis
export { MapAnalyzer, testMapAnalyzer } from './MapAnalyzer';

// Types from MapAnalyzer
export type {
  PlacementContext,
  MapMetrics,
  Vector3,
  PathSegment,
  Area,
  Pattern,
  Tier1Result,
  Tier2Result,
  Tier3Result
} from './MapAnalyzer';
// Academic concepts
export {
  CONCEPT_CURRICULUM,
  getConceptMetadata,
  getConceptsByCategory,
  getPrerequisites,
  checkPrerequisites,
  getNextConcepts,
  createDefaultSolution
} from './AcademicConceptTypes';

export type {
  AcademicConcept,
  ConceptCategory,
  ConceptMetadata
} from './AcademicConceptTypes';

// Placement generator
export { AcademicPlacementGenerator, testAcademicGenerator } from './AcademicPlacementGenerator';

export type {
  AcademicPlacement,
  ItemPlacement,
  ItemType,
  ExpectedSolution
} from './AcademicPlacementGenerator';

// Markdown reporter
export { MarkdownReporter, MapAnalysisService } from './MarkdownReporter';

// Coordinate prioritizer
export {
  prioritizeCoordinates,
  getTopPriorityCoords,
  getCoordsByCategory,
  TOPOLOGY_KEY_POINTS
} from './CoordinatePrioritizer';

// Placement templates
export {
  PlacementTemplateRegistry,
  getTemplateRegistry,
  initializeDefaultTemplates,
  DEFAULT_TEMPLATES
} from './PlacementTemplate';

export type {
  PlacementRule,
  PlacementRuleOptions,
  PlacementTemplate,
  TemplateItemPlacement
} from './PlacementTemplate';

// Selectable elements (for UI integration)
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

export type {
  Coord as SECoord,
  ElementType,
  ElementCategory,
  ElementDisplay,
  ElementRelationships,
  ElementSelector,
  SelectableElement
} from './SelectableElement';

// Generators
export * from './generators';
