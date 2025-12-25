
// ============================================================================
// GEOMETRY UTILITIES
// ============================================================================
import { Vector3 } from './types';

export function vectorEquals(a: Vector3, b: Vector3): boolean {
  return a.x === b.x && a.y === b.y && a.z === b.z;
}

export function vectorAdd(a: Vector3, b: Vector3): Vector3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

export function vectorSub(a: Vector3, b: Vector3): Vector3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

export function vectorScale(v: Vector3, s: number): Vector3 {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}

export function vectorDot(a: Vector3, b: Vector3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function vectorCross(a: Vector3, b: Vector3): Vector3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x
  };
}

export function vectorMagnitude(v: Vector3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

export function vectorNormalize(v: Vector3): Vector3 {
  const mag = vectorMagnitude(v);
  if (mag === 0) return { x: 0, y: 0, z: 0 };
  return { x: v.x / mag, y: v.y / mag, z: v.z / mag };
}

/**
 * Check if a vector is zero vector (all components are 0)
 * Useful for validating direction vectors after normalization
 */
export function isZeroVector(v: Vector3): boolean {
  return v.x === 0 && v.y === 0 && v.z === 0;
}

/**
 * Safely normalize a vector, returning null if the input is a zero vector.
 * Use this when you need to validate that the direction is valid.
 */
export function vectorNormalizeSafe(v: Vector3): Vector3 | null {
  const mag = vectorMagnitude(v);
  if (mag === 0) return null;
  return { x: v.x / mag, y: v.y / mag, z: v.z / mag };
}

export function vectorDistance(a: Vector3, b: Vector3): number {
  return vectorMagnitude(vectorSub(b, a));
}

export function vectorToKey(v: Vector3): string {
  return `${v.x},${v.y},${v.z}`;
}

export function keyToVector(key: string): Vector3 {
  const [x, y, z] = key.split(',').map(Number);
  return { x, y, z };
}
