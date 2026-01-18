/**
 * App Types Shim
 * 
 * These types are synced with apps/map-builder-app/src/types.ts
 * to ensure compatibility between the package and app.
 */

import type { Coord } from '../core/types';

export type PrimitiveShape = 'torus' | 'cone' | 'sphere' | 'box';

/**
 * A buildable asset definition - synced with app
 */
export interface BuildableAsset {
  key: string;
  name: string;
  thumbnail: string;
  path?: string;
  primitiveShape?: PrimitiveShape;
  type: 'block' | 'collectible' | 'interactible' | 'special' | 'zone';
  defaultProperties?: Record<string, any>;
}

/**
 * A placed object on the map - synced with app
 */
export interface PlacedObject {
  id: string;
  position: Coord;
  rotation: [number, number, number];
  asset: BuildableAsset;
  properties: Record<string, any>;
}

/**
 * Game config for map-builder compatibility
 */
export interface MapBuilderConfig {
  gridSize: [number, number, number];
  objects: PlacedObject[];
  start: Coord;
  finish: Coord;
  metadata?: Record<string, any>;
}
