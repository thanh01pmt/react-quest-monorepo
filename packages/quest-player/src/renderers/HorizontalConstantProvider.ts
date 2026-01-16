/**
 * Horizontal Constant Provider
 * 
 * Custom ConstantProvider for horizontal block layout following Blockly's
 * custom renderer architecture (per codelab best practices).
 * 
 * Based on Scratch Jr source code:
 * - Standard blocks: 76x66
 * - Repeat blocks: 176x82
 * - Connections at height/2 (standard) or height-33 (C-blocks)
 */

import * as Blockly from 'blockly/core';

// =============================================================================
// =============================================================================
// DIMENSION CONSTANTS - Based on scratch-blocks/core/block_render_svg_horizontal.js
// =============================================================================

export const GRID_UNIT = 4;

// Scratch Blocks dimensions (Pixel values)
export const MIN_BLOCK_X = 32;       // 8 * GRID_UNIT
export const MIN_BLOCK_Y = 64;       // 16 * GRID_UNIT
export const STANDARD_BLOCK_WIDTH = MIN_BLOCK_X; // Alias
export const STANDARD_BLOCK_HEIGHT = MIN_BLOCK_Y; // Alias

export const REPEAT_BLOCK_WIDTH = 96; // Approximate default
export const REPEAT_BLOCK_HEIGHT = 72; // Approximate default

// C-Block specific dimensions
export const C_BLOCK_HEAD_WIDTH = 16;  // 4 * GRID_UNIT
export const C_BLOCK_TAIL_WIDTH = 16;  // 4 * GRID_UNIT (Default Tail same as Head thickness?)
// Reference doesn't strictly define "Tail Width" constant, it calculates total width.
// But for our path generator we need a value. 
// Standard blocks use head + gap + tail? Actually reference just adds bayWidth.
// We'll stick to calculated widths in RenderInfo.

// Spacing between elements
export const SEP_SPACE_X = 12; // 3 * GRID_UNIT
export const SEP_SPACE_Y = 12; // 3 * GRID_UNIT

// Connection sizes
const NOTCH_SIZE = 8; // 2 * GRID_UNIT (Reference: NOTCH_WIDTH)
// Reference NOTCH_HEIGHT is 34 (8*GRID + 2)

// Hat block corner
const HAT_CORNER_RADIUS = 32; // 8 * GRID_UNIT

/**
 * Custom ConstantProvider for Horizontal Block Layout
 * 
 * Responsibilities:
 * - Define dimensions in constructor()
 * - Create shape objects in init()
 * - Return correct shapes via shapeFor()
 */
export class HorizontalConstantProvider extends Blockly.zelos.ConstantProvider {
  
  // Shape objects (created in init())
  HORIZONTAL_PREV_NEXT: any;
  
  constructor() {
    super();
    
    // Override Zelos dimensions with Scratch Jr values
    this.NOTCH_WIDTH = NOTCH_SIZE;
    this.NOTCH_HEIGHT = NOTCH_SIZE;
    this.CORNER_RADIUS = GRID_UNIT; // 4px
    
    // Block sizing
    this.MIN_BLOCK_WIDTH = STANDARD_BLOCK_WIDTH;
    // Note: MIN_BLOCK_HEIGHT is not a standard Blockly property, 
    // we'll use it in RenderInfo
  }
  
  /**
   * Initialize shape objects.
   * Called after constructor, allows shapes to use constructor values.
   */
  override init() {
    super.init();
    
    // Create horizontal connection shape
    this.HORIZONTAL_PREV_NEXT = this.makeHorizontalPrevNextShape();
  }
  
  /**
   * Create the horizontal previous/next connection shape.
   * 
   * For horizontal layout, connections are on LEFT/RIGHT sides (not top/bottom).
   * The notch path goes vertically (down for previous, up for next).
   */
  private makeHorizontalPrevNextShape() {
    const width = this.NOTCH_WIDTH;
    const height = 34; // Scratch Jr notch height (vertical extent of the puzzle piece)
    
    // Notch path going DOWN (for left side / previous connection)
    const pathDown = 'c 0,2 1,3 2,4 l 4,4 c 1,1 2,2 2,4 v 12 c 0,2 -1,3 -2,4 l -4,4 c -1,1 -2,2 -2,4';
    
    // Notch path going UP (for right side / next connection)
    const pathUp = 'c 0,-2 1,-3 2,-4 l 4,-4 c 1,-1 2,-2 2,-4 v -12 c 0,-2 -1,-3 -2,-4 l -4,-4 c -1,-1 -2,-2 -2,-4';
    
    return {
      width: width,
      height: height,
      pathDown: pathDown,
      pathUp: pathUp,
      // Blockly standard shape properties
      pathLeft: pathDown,  // When drawing left-to-right (going down the left wall)
      pathRight: pathUp,   // When drawing right-to-left (going up the right wall)
    };
  }
  
  /**
   * Return the shape object for a connection.
   * 
   * @param connection The connection to get shape for
   * @returns Shape object with path and dimension info
   */
  override shapeFor(connection: Blockly.RenderedConnection): any {
    const type = connection.type;
    
    switch (type) {
      case Blockly.ConnectionType.INPUT_VALUE:
      case Blockly.ConnectionType.OUTPUT_VALUE:
        // Use horizontal puzzle tab
        return this.HORIZONTAL_PREV_NEXT;
        
      case Blockly.ConnectionType.PREVIOUS_STATEMENT:
      case Blockly.ConnectionType.NEXT_STATEMENT:
        // Use horizontal notch
        return this.HORIZONTAL_PREV_NEXT;
        
      default:
        return super.shapeFor(connection);
    }
  }
  
  /**
   * Generate the outline path for a hat block (Start block).
   * Hat blocks have a rounded left edge (pill shape).
   */
  makeHatBlockPath(width: number, height: number): string {
    const cr = this.CORNER_RADIUS;
    const hatCr = HAT_CORNER_RADIUS;
    const shape = this.HORIZONTAL_PREV_NEXT;
    const notchStartY = (height - shape.height) / 2; // Center notch vertically
    
    return `
      m ${hatCr},0
      A ${hatCr},${hatCr} 0 0,0 0,${hatCr}
      A ${hatCr},${hatCr} 0 0,0 ${hatCr},${height}
      H ${width - cr}
      a ${cr},${cr} 0 0,0 ${cr},-${cr}
      V ${notchStartY + shape.height}
      ${shape.pathUp}
      V ${cr}
      a ${cr},${cr} 0 0,0 -${cr},-${cr}
      H ${hatCr}
      z
    `;
  }
  
  /**
   * Generate the outline path for a standard stack block.
   * Stack blocks have notches on both left and right sides.
   */
  makeStackBlockPath(width: number, height: number): string {
    const cr = this.CORNER_RADIUS;
    const shape = this.HORIZONTAL_PREV_NEXT;
    const notchStartY = (height - shape.height) / 2; // Center notch vertically
    
    return `
      m ${cr},0
      a ${cr},${cr} 0 0,0 -${cr},${cr}
      V ${notchStartY}
      ${shape.pathDown}
      V ${height - cr}
      a ${cr},${cr} 0 0,0 ${cr},${cr}
      H ${width - cr}
      a ${cr},${cr} 0 0,0 ${cr},-${cr}
      V ${notchStartY + shape.height}
      ${shape.pathUp}
      V ${cr}
      a ${cr},${cr} 0 0,0 -${cr},-${cr}
      z
    `;
  }
  
  /**
   * Generate the outline path for a C-block (Loop/Repeat block).
   * C-blocks have an extended body to contain nested blocks.
   */
  makeCBlockPath(totalWidth: number, height: number): string {
    // For now, C-block is same as stack block but wider
    // TODO: Add visual bay markers if desired
    return this.makeStackBlockPath(totalWidth, height);
  }
}

// Export alias constants for compatibility with existing code
// Removed duplicates since they are exported directly above.

