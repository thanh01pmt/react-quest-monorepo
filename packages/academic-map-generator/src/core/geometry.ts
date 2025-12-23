/**
 * Geometry Utilities
 * 
 * Vector operations and coordinate conversions.
 * All operations use the Coord tuple format [x, y, z].
 */

import type { Coord, Vector3Object } from './types';

// ============================================================================
// DIRECTION CONSTANTS
// ============================================================================

export const FORWARD_X: Coord = [1, 0, 0];
export const BACKWARD_X: Coord = [-1, 0, 0];
export const FORWARD_Y: Coord = [0, 1, 0];
export const BACKWARD_Y: Coord = [0, -1, 0];
export const FORWARD_Z: Coord = [0, 0, 1];
export const BACKWARD_Z: Coord = [0, 0, -1];

export const DIRECTIONS_2D: Coord[] = [
  FORWARD_X, BACKWARD_X, FORWARD_Z, BACKWARD_Z
];

export const DIRECTIONS_3D: Coord[] = [
  FORWARD_X, BACKWARD_X,
  FORWARD_Y, BACKWARD_Y,
  FORWARD_Z, BACKWARD_Z
];

// ============================================================================
// CONVERSION FUNCTIONS
// ============================================================================

/**
 * Convert a Vector3Object {x, y, z} to a Coord tuple [x, y, z]
 */
export function objectToCoord(v: Vector3Object): Coord {
  return [v.x, v.y, v.z];
}

/**
 * Convert a Coord tuple [x, y, z] to a Vector3Object {x, y, z}
 */
export function coordToObject(c: Coord): Vector3Object {
  return { x: c[0], y: c[1], z: c[2] };
}

/**
 * Convert a Coord to a string key for use in Sets/Maps
 */
export function coordToKey(c: Coord): string {
  return `${c[0]},${c[1]},${c[2]}`;
}

/**
 * Convert a 2D coord (x, z) to a string key
 */
export function coord2DToKey(x: number, z: number): string {
  return `${x},${z}`;
}

/**
 * Parse a string key back to a Coord
 */
export function keyToCoord(key: string): Coord {
  const [x, y, z] = key.split(',').map(Number);
  return [x, y, z];
}

/**
 * Parse a 2D key back to {x, z}
 */
export function keyToCoord2D(key: string): { x: number; z: number } {
  const [x, z] = key.split(',').map(Number);
  return { x, z };
}

// ============================================================================
// VECTOR OPERATIONS
// ============================================================================

/**
 * Add two vectors
 */
export function addCoords(a: Coord, b: Coord): Coord {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

/**
 * Subtract vector b from vector a
 */
export function subCoords(a: Coord, b: Coord): Coord {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

/**
 * Scale a vector by a scalar
 */
export function scaleCoord(v: Coord, s: number): Coord {
  return [v[0] * s, v[1] * s, v[2] * s];
}

/**
 * Dot product of two vectors
 */
export function dotCoords(a: Coord, b: Coord): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/**
 * Cross product of two vectors
 */
export function crossCoords(a: Coord, b: Coord): Coord {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ];
}

/**
 * Calculate the magnitude (length) of a vector
 */
export function magnitude(v: Coord): number {
  return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
}

/**
 * Normalize a vector to unit length
 */
export function normalize(v: Coord): Coord {
  const mag = magnitude(v);
  if (mag === 0) return [0, 0, 0];
  return [v[0] / mag, v[1] / mag, v[2] / mag];
}

/**
 * Calculate distance between two points
 */
export function distance(a: Coord, b: Coord): number {
  return magnitude(subCoords(b, a));
}

/**
 * Manhattan distance between two points
 */
export function manhattanDistance(a: Coord, b: Coord): number {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
}

/**
 * Check if two coordinates are equal
 */
export function coordsEqual(a: Coord, b: Coord): boolean {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}

/**
 * Check if two coordinates are adjacent (1 step away in any direction)
 */
export function areAdjacent(a: Coord, b: Coord): boolean {
  return manhattanDistance(a, b) === 1;
}

// ============================================================================
// BOUNDING BOX OPERATIONS
// ============================================================================

/**
 * Calculate bounding box from a list of coordinates
 */
export function getBoundingBox(coords: Coord[]): { min: Coord; max: Coord } {
  if (coords.length === 0) {
    return { min: [0, 0, 0], max: [0, 0, 0] };
  }

  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  for (const c of coords) {
    minX = Math.min(minX, c[0]);
    minY = Math.min(minY, c[1]);
    minZ = Math.min(minZ, c[2]);
    maxX = Math.max(maxX, c[0]);
    maxY = Math.max(maxY, c[1]);
    maxZ = Math.max(maxZ, c[2]);
  }

  return {
    min: [minX, minY, minZ],
    max: [maxX, maxY, maxZ]
  };
}

/**
 * Calculate centroid from a list of coordinates
 */
export function getCentroid(coords: Coord[]): Coord {
  if (coords.length === 0) return [0, 0, 0];
  
  let sumX = 0, sumY = 0, sumZ = 0;
  for (const c of coords) {
    sumX += c[0];
    sumY += c[1];
    sumZ += c[2];
  }
  
  return [
    sumX / coords.length,
    sumY / coords.length,
    sumZ / coords.length
  ];
}

// ============================================================================
// NEIGHBOR OPERATIONS
// ============================================================================

/**
 * Get 4-directional horizontal neighbors (XZ plane)
 */
export function getHorizontalNeighbors(c: Coord): Coord[] {
  return [
    [c[0] + 1, c[1], c[2]],
    [c[0] - 1, c[1], c[2]],
    [c[0], c[1], c[2] + 1],
    [c[0], c[1], c[2] - 1]
  ];
}

/**
 * Get 6-directional neighbors (all directions)
 */
export function getNeighbors(c: Coord): Coord[] {
  return [
    [c[0] + 1, c[1], c[2]],
    [c[0] - 1, c[1], c[2]],
    [c[0], c[1] + 1, c[2]],
    [c[0], c[1] - 1, c[2]],
    [c[0], c[1], c[2] + 1],
    [c[0], c[1], c[2] - 1]
  ];
}

// ============================================================================
// LEGACY FUNCTION ALIASES (for backward compatibility with map-generator)
// ============================================================================

/**
 * @deprecated Use addCoords instead
 */
export const addVectors = addCoords;

/**
 * @deprecated Use coordsEqual instead
 */
export const areVectorsEqual = coordsEqual;

/**
 * @deprecated Use coordToKey instead
 */
export function vectorToString(v: Coord): string {
  return v.join(',');
}
