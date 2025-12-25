/**
 * SymmetryMode Utility
 * 
 * Handles symmetrical placement of objects in the map builder.
 * Features:
 * - Mirror position calculation across X or Z axis
 * - Duplicate mode (place original + mirrored copy)
 * - Configurable center line
 * - Mirror rotation for correct orientation
 */

// Types
export type SymmetryAxis = 'x' | 'z' | 'both';

export interface SymmetryConfig {
  /** Whether symmetry mode is enabled */
  enabled: boolean;
  /** Axis to mirror across */
  axis: SymmetryAxis;
  /** Center line position (in grid units) */
  centerX: number;
  centerZ: number;
}

export interface MirroredPosition {
  position: [number, number, number];
  rotation: [number, number, number];
}

/**
 * SymmetryMode class for handling symmetrical object placement
 */
export class SymmetryMode {
  private config: SymmetryConfig;
  
  constructor(config?: Partial<SymmetryConfig>) {
    this.config = {
      enabled: false,
      axis: 'x',
      centerX: 7, // Default center (14/2)
      centerZ: 7,
      ...config
    };
  }
  
  /**
   * Get current configuration
   */
  getConfig(): SymmetryConfig {
    return { ...this.config };
  }
  
  /**
   * Update configuration
   */
  setConfig(config: Partial<SymmetryConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * Enable/disable symmetry mode
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }
  
  /**
   * Check if symmetry is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }
  
  /**
   * Set symmetry axis
   */
  setAxis(axis: SymmetryAxis): void {
    this.config.axis = axis;
  }
  
  /**
   * Set center line positions
   */
  setCenter(centerX: number, centerZ: number): void {
    this.config.centerX = centerX;
    this.config.centerZ = centerZ;
  }
  
  /**
   * Calculate mirrored position across the configured axis
   */
  getMirroredPosition(
    position: [number, number, number],
    rotation: [number, number, number] = [0, 0, 0]
  ): MirroredPosition | null {
    if (!this.config.enabled) return null;
    
    const [x, y, z] = position;
    const [rx, ry, rz] = rotation;
    
    let mirroredPos: [number, number, number];
    let mirroredRot: [number, number, number];
    
    switch (this.config.axis) {
      case 'x':
        // Mirror across X axis (flip Z coordinate)
        const mirroredZ = 2 * this.config.centerZ - z;
        mirroredPos = [x, y, Math.round(mirroredZ)];
        // Mirror Y rotation (flip direction)
        mirroredRot = [rx, -ry, rz];
        break;
        
      case 'z':
        // Mirror across Z axis (flip X coordinate)
        const mirroredX = 2 * this.config.centerX - x;
        mirroredPos = [Math.round(mirroredX), y, z];
        // Mirror Y rotation (flip direction)
        mirroredRot = [rx, Math.PI - ry, rz];
        break;
        
      case 'both':
        // Mirror across both axes (point reflection through center)
        const mirX = 2 * this.config.centerX - x;
        const mirZ = 2 * this.config.centerZ - z;
        mirroredPos = [Math.round(mirX), y, Math.round(mirZ)];
        // Rotate 180 degrees
        mirroredRot = [rx, ry + Math.PI, rz];
        break;
        
      default:
        return null;
    }
    
    return {
      position: mirroredPos,
      rotation: mirroredRot
    };
  }
  
  /**
   * Check if a position is on the symmetry axis (edge case)
   */
  isOnAxis(position: [number, number, number]): boolean {
    const [x, , z] = position;
    
    switch (this.config.axis) {
      case 'x':
        return Math.abs(z - this.config.centerZ) < 0.5;
      case 'z':
        return Math.abs(x - this.config.centerX) < 0.5;
      case 'both':
        return Math.abs(x - this.config.centerX) < 0.5 && 
               Math.abs(z - this.config.centerZ) < 0.5;
      default:
        return false;
    }
  }
  
  /**
   * Get positions for the symmetry axis line (for visualization)
   */
  getAxisLinePoints(
    gridWidth: number,
    gridDepth: number
  ): { start: [number, number, number]; end: [number, number, number] }[] {
    const lines: { start: [number, number, number]; end: [number, number, number] }[] = [];
    const y = 0.1; // Slightly above ground
    
    if (this.config.axis === 'x' || this.config.axis === 'both') {
      // Horizontal line across X axis at centerZ
      lines.push({
        start: [0, y, this.config.centerZ],
        end: [gridWidth, y, this.config.centerZ]
      });
    }
    
    if (this.config.axis === 'z' || this.config.axis === 'both') {
      // Vertical line across Z axis at centerX
      lines.push({
        start: [this.config.centerX, y, 0],
        end: [this.config.centerX, y, gridDepth]
      });
    }
    
    return lines;
  }
  
  /**
   * Get all positions for placement (original + mirrored if enabled)
   */
  getPlacementPositions(
    position: [number, number, number],
    rotation: [number, number, number] = [0, 0, 0]
  ): { position: [number, number, number]; rotation: [number, number, number] }[] {
    const positions = [{ position, rotation }];
    
    if (!this.config.enabled) return positions;
    
    // Don't duplicate if on the axis
    if (this.isOnAxis(position)) return positions;
    
    const mirrored = this.getMirroredPosition(position, rotation);
    if (mirrored) {
      positions.push(mirrored);
    }
    
    return positions;
  }
}

export default SymmetryMode;
