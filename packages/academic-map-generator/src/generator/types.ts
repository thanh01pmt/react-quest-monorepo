/**
 * Generator Types - Compatibility re-exports
 * 
 * This file provides backward compatibility for imports from '../types'
 * that many generator files expect.
 */

// Re-export all types from core
export * from '../core/types';

// Re-export geometry utilities that may be expected
export {
  coordToKey,
  keyToCoord,
  addCoords,
  coordsEqual,
  objectToCoord,
  coordToObject,
  getHorizontalNeighbors,
  findShortestPath,
  deduplicateCoords
} from '../core/geometry';
