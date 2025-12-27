/**
 * Solution-Driven Generator Module
 * 
 * Generates maps from code templates (solution-first approach).
 */

// Types
export type {
  CodeTemplate,
  ParameterConfig,
  GradeLevel,
  GenerationConstraints,
  TemplateMeta,
  ExecutionContext,
  ExecutionTrace,
  ExecutionAction,
  SolutionDrivenResult,
  GeneratedGameConfig,
  GenerationMetadata,
  StructuredSolution,
  SolutionConfig,
  BlockAction,
  Direction,
  ASTNode,
  BlockNode,
  ForLoopNode,
  FunctionCallNode
} from './types';

// Helper functions
export {
  turnRight,
  turnLeft,
  moveForward,
  coordToKey,
  coordToVector3,
  createInitialContext,
  DIRECTION_NAMES,
  DIRECTION_DELTAS
} from './types';

// Classes
export { TemplateInterpreter } from './TemplateInterpreter';
export { SolutionBuilder } from './SolutionBuilder';
export { SolutionDrivenGenerator, TemplateFactory, generateFromCode } from './SolutionDrivenGenerator';
