/**
 * CloneEngine Utility
 * 
 * Handles cloning/copying of selected objects in the map builder.
 * Features:
 * - Deep clone selected objects
 * - Preserve relative positions
 * - Generate new unique IDs
 * - Transform options (offset, rotate, flip)
 * - Multi-paste (array) support
 */

import type { PlacedObject } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Types
export interface CloneTransform {
  /** Offset in grid units */
  offset: { x: number; y: number; z: number };
  /** Rotation around Y axis (0, 90, 180, 270 degrees) */
  rotation: 0 | 90 | 180 | 270;
  /** Flip axes */
  flipX: boolean;
  flipZ: boolean;
}

export interface MultiPasteOptions {
  /** Number of copies */
  count: number;
  /** Spacing between copies */
  spacing: number;
  /** Direction of array */
  direction: 'x' | 'y' | 'z';
}

export interface CloneResult {
  /** Cloned objects ready to be placed */
  objects: PlacedObject[];
  /** Bounding box of cloned objects */
  bounds: {
    min: [number, number, number];
    max: [number, number, number];
  };
}

/**
 * CloneEngine class for handling copy/paste operations
 */
export class CloneEngine {
  private clipboard: PlacedObject[] = [];
  private clipboardCenter: [number, number, number] = [0, 0, 0];
  
  /**
   * Copy objects to clipboard
   */
  copy(objects: PlacedObject[]): void {
    if (objects.length === 0) return;
    
    // Deep clone objects
    this.clipboard = objects.map(obj => ({
      ...obj,
      properties: { ...obj.properties }
    }));
    
    // Calculate center of selection
    const minX = Math.min(...objects.map(o => o.position[0]));
    const maxX = Math.max(...objects.map(o => o.position[0]));
    const minY = Math.min(...objects.map(o => o.position[1]));
    const maxY = Math.max(...objects.map(o => o.position[1]));
    const minZ = Math.min(...objects.map(o => o.position[2]));
    const maxZ = Math.max(...objects.map(o => o.position[2]));
    
    this.clipboardCenter = [
      (minX + maxX) / 2,
      (minY + maxY) / 2,
      (minZ + maxZ) / 2
    ];
  }
  
  /**
   * Check if clipboard has content
   */
  hasContent(): boolean {
    return this.clipboard.length > 0;
  }
  
  /**
   * Get clipboard content count
   */
  getCount(): number {
    return this.clipboard.length;
  }
  
  /**
   * Paste objects with optional transform
   */
  paste(
    targetPosition: [number, number, number],
    transform?: Partial<CloneTransform>
  ): CloneResult {
    if (this.clipboard.length === 0) {
      return { objects: [], bounds: { min: [0, 0, 0], max: [0, 0, 0] } };
    }
    
    const defaultTransform: CloneTransform = {
      offset: { x: 0, y: 0, z: 0 },
      rotation: 0,
      flipX: false,
      flipZ: false,
      ...transform
    };
    
    // Clone and transform objects
    const clonedObjects = this.clipboard.map(obj => {
      // Calculate relative position from center
      let relX = obj.position[0] - this.clipboardCenter[0];
      let relY = obj.position[1] - this.clipboardCenter[1];
      let relZ = obj.position[2] - this.clipboardCenter[2];
      
      // Apply rotation
      [relX, relZ] = this.rotatePoint(relX, relZ, defaultTransform.rotation);
      
      // Apply flip
      if (defaultTransform.flipX) relX = -relX;
      if (defaultTransform.flipZ) relZ = -relZ;
      
      // Calculate new position
      const newPos: [number, number, number] = [
        Math.round(targetPosition[0] + relX + defaultTransform.offset.x),
        Math.round(targetPosition[1] + relY + defaultTransform.offset.y),
        Math.round(targetPosition[2] + relZ + defaultTransform.offset.z)
      ];
      
      // Calculate new rotation
      const rotationRadians = (defaultTransform.rotation * Math.PI) / 180;
      let newRot: [number, number, number] = [
        obj.rotation[0],
        obj.rotation[1] + rotationRadians,
        obj.rotation[2]
      ];
      
      // Adjust rotation for flip
      if (defaultTransform.flipX) {
        newRot[1] = Math.PI - newRot[1];
      }
      if (defaultTransform.flipZ) {
        newRot[1] = -newRot[1];
      }
      
      // Generate new unique ID
      const newId = this.generateNewId(obj);
      
      return {
        ...obj,
        id: newId,
        position: newPos,
        rotation: newRot,
        properties: { ...obj.properties }
      };
    });
    
    // Calculate bounds
    const bounds = this.calculateBounds(clonedObjects);
    
    return { objects: clonedObjects, bounds };
  }
  
  /**
   * Paste multiple copies in array pattern
   */
  pasteArray(
    startPosition: [number, number, number],
    options: MultiPasteOptions,
    transform?: Partial<CloneTransform>
  ): CloneResult {
    const allObjects: PlacedObject[] = [];
    
    for (let i = 0; i < options.count; i++) {
      const offset = {
        x: options.direction === 'x' ? i * options.spacing : 0,
        y: options.direction === 'y' ? i * options.spacing : 0,
        z: options.direction === 'z' ? i * options.spacing : 0
      };
      
      const result = this.paste(
        startPosition,
        { ...transform, offset: { 
          x: (transform?.offset?.x || 0) + offset.x,
          y: (transform?.offset?.y || 0) + offset.y,
          z: (transform?.offset?.z || 0) + offset.z
        }}
      );
      
      // Make IDs unique per copy
      result.objects.forEach(obj => {
        obj.id = `${obj.id}-copy${i}`;
      });
      
      allObjects.push(...result.objects);
    }
    
    const bounds = this.calculateBounds(allObjects);
    return { objects: allObjects, bounds };
  }
  
  /**
   * Get preview of paste operation
   */
  getPreview(
    targetPosition: [number, number, number],
    transform?: Partial<CloneTransform>
  ): [number, number, number][] {
    const result = this.paste(targetPosition, transform);
    return result.objects.map(obj => obj.position);
  }
  
  /**
   * Clear clipboard
   */
  clear(): void {
    this.clipboard = [];
    this.clipboardCenter = [0, 0, 0];
  }
  
  // --- Private helpers ---
  
  private rotatePoint(x: number, z: number, degrees: number): [number, number] {
    const radians = (degrees * Math.PI) / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    return [
      Math.round(x * cos - z * sin),
      Math.round(x * sin + z * cos)
    ];
  }
  
  private generateNewId(obj: PlacedObject): string {
    // Special handling for switches
    if (obj.asset.key === 'switch') {
      return `s-${uuidv4().substring(0, 6)}`;
    }
    // Special handling for portals
    if (obj.properties?.type === 'portal') {
      return `${obj.asset.key}_${uuidv4().substring(0, 4)}`;
    }
    return uuidv4();
  }
  
  private calculateBounds(objects: PlacedObject[]): {
    min: [number, number, number];
    max: [number, number, number];
  } {
    if (objects.length === 0) {
      return { min: [0, 0, 0], max: [0, 0, 0] };
    }
    
    return {
      min: [
        Math.min(...objects.map(o => o.position[0])),
        Math.min(...objects.map(o => o.position[1])),
        Math.min(...objects.map(o => o.position[2]))
      ],
      max: [
        Math.max(...objects.map(o => o.position[0])),
        Math.max(...objects.map(o => o.position[1])),
        Math.max(...objects.map(o => o.position[2]))
      ]
    };
  }
}

export default CloneEngine;
