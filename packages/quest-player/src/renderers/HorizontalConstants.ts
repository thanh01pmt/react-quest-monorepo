/**
 * Horizontal Block Constants
 * 
 * Ported from scratch-blocks/core/block_render_svg_horizontal.js
 * These constants define the SVG paths and dimensions for horizontal blocks.
 */

// Grid unit (4px base)
export const GRID_UNIT = 4;

// =============================================================================
// BLOCK DIMENSIONS
// =============================================================================

/** Horizontal space between elements */
export const SEP_SPACE_X = 3 * GRID_UNIT; // 12px

/** Vertical space between elements */
export const SEP_SPACE_Y = 3 * GRID_UNIT; // 12px

/** Statement block vertical space */
export const STATEMENT_BLOCK_SPACE = 3 * GRID_UNIT; // 12px

/** Field height for inputs */
export const FIELD_HEIGHT = 8 * GRID_UNIT; // 32px

// Corner & Notch
export const CORNER_RADIUS = 1 * GRID_UNIT; // 4px
export const HAT_CORNER_RADIUS = 8 * GRID_UNIT; // 32px

// Notch Logic (Centered Vertically)
// Block Height = 64. Notch Height = ~34.
// Top/Bottom Padding = (64 - 34) / 2 = 15.
// Scratch-blocks uses ~14px offset.
export const NOTCH_WIDTH = 2 * GRID_UNIT; // 8px
export const NOTCH_HEIGHT = 8 * GRID_UNIT + 2; // 34px
export const NOTCH_START_Y = 14; 

/** Icon field dimensions */
export const IMAGE_FIELD_WIDTH = 8 * GRID_UNIT; // 32px
export const IMAGE_FIELD_HEIGHT = 8 * GRID_UNIT; // 32px

// Need to export this for proper referencing in other files
export const FIELD_WIDTH = 12 * GRID_UNIT; 

// Block Dimensions - Based on Scratch Jr source code
// Standard blocks: 76x66
// Repeat blocks: 176x82 (base size, expands with content)
export const MIN_BLOCK_X = 76; // Standard block width
export const MIN_BLOCK_Y = 66; // Standard block height

// Repeat block dimensions
export const REPEAT_BLOCK_WIDTH = 176; // Base width (expands with nested blocks)
export const REPEAT_BLOCK_HEIGHT = 82; // Fixed height 

// =============================================================================
// SVG PATHS
// =============================================================================

/**
 * SVG path for drawing next/previous notch from top to bottom.
 * This creates the puzzle-piece connector on the LEFT/RIGHT of horizontal blocks.
 */
export const NOTCH_PATH_DOWN = 'c 0,2 1,3 2,4 l 4,4 c 1,1 2,2 2,4 v 12 c 0,2 -1,3 -2,4 l -4,4 c -1,1 -2,2 -2,4';

/**
 * SVG path for drawing next/previous notch from bottom to top.
 */
export const NOTCH_PATH_UP = 'c 0,-2 1,-3 2,-4 l 4,-4 c 1,-1 2,-2 2,-4 v -12 c 0,-2 -1,-3 -2,-4 l -4,-4 c -1,-1 -2,-2 -2,-4';

// SVG Corner Starts
export const TOP_LEFT_CORNER_START = `m ${CORNER_RADIUS},0`;
export const TOP_LEFT_CORNER = `A ${CORNER_RADIUS},${CORNER_RADIUS} 0 0,0 0,${CORNER_RADIUS}`;

export const HAT_TOP_LEFT_CORNER_START = `m ${HAT_CORNER_RADIUS},0`;
export const HAT_TOP_LEFT_CORNER = `A ${HAT_CORNER_RADIUS},${HAT_CORNER_RADIUS} 0 0,0 0,${HAT_CORNER_RADIUS}`;

// =============================================================================
// COMPLETE BLOCK PATH TEMPLATES
// =============================================================================

/**
 * Generate a HAT block path (Start block with pill-left shape)
 */
export const generateHatBlockPath = (width: number, height: number, _rtl: boolean) => {
  const cr = CORNER_RADIUS;
  const hatCr = HAT_CORNER_RADIUS;
  
  // Left Side (Hat Curve):
  const leftSide = `
    ${HAT_TOP_LEFT_CORNER_START}
    ${HAT_TOP_LEFT_CORNER}
    A ${hatCr},${hatCr} 0 0,0 ${hatCr},${height}
  `;

  // Right Side (With Notch out):
  const rightSide = `
    H ${width - cr}
    a ${cr},${cr} 0 0,0 ${cr},-${cr}
    V ${NOTCH_START_Y + NOTCH_HEIGHT}
    ${NOTCH_PATH_UP}
    V ${cr}
    a ${cr},${cr} 0 0,0 -${cr},-${cr}
    H ${hatCr}
  `;

  return `${leftSide} ${rightSide} z`;
};

/**
 * Generate a STACK block path (standard horizontal block with left/right connectors)
 */
export const generateStackBlockPath = (width: number, height: number, _rtl: boolean) => {
  const cr = CORNER_RADIUS;
  
  // Left Side (With Notch in/down):
  const leftSide = `
    ${TOP_LEFT_CORNER_START}
    ${TOP_LEFT_CORNER}
    V ${NOTCH_START_Y}
    ${NOTCH_PATH_DOWN}
    V ${height - cr}
    a ${cr},${cr} 0 0,0 ${cr},${cr}
  `;

  // Right Side (With Notch out/up):
  const rightSide = `
    H ${width - cr}
    a ${cr},${cr} 0 0,0 ${cr},-${cr}
    V ${NOTCH_START_Y + NOTCH_HEIGHT}
    ${NOTCH_PATH_UP}
    V ${cr}
    a ${cr},${cr} 0 0,0 -${cr},-${cr}
    z
  `;

  return `${leftSide} ${rightSide}`;
};

/**
 * Generate a C-BLOCK path for Scratch Jr horizontal layout
 * 
 * SCRATCH JR C-BLOCK SHAPE:
 * The bay opens UPWARD - nested blocks protrude from the TOP of the loop block.
 * 
 *      ┌─────────────────┐
 *      │  Nested Blocks  │  ← Bay (nested blocks go here)
 *   ═══╪═════════════════╪═══
 *   │  Icon        Num   │  ← Main body (header + tail with icon/number)
 *   └────────────────────┘
 * 
 * The path draws:
 * 1. Left wall of header (with left notch)
 * 2. Up to bay opening
 * 3. Across bay top (where nested blocks connect)
 * 4. Down from bay to tail
 * 5. Right wall of tail (with right notch)
 * 6. Bottom back to start
 * 
 * @param totalWidth Total width of block (header + bay + tail)
 * @param mainBodyHeight Height of the bottom main body (contains icon/number)
 * @param bayWidth Width of the bay opening
 * @param bayHeight Height of the bay (how tall nested blocks extend upward)
 */
export const generateCBlockPath = (
  totalWidth: number, 
  mainBodyHeight: number, 
  bayWidth: number,
  bayHeight: number,
  _rtl: boolean
) => {
  const cr = CORNER_RADIUS;
  
  // HORIZONTAL C-BLOCK for Scratch Jr
  // Main body at TOP (icon/number), Bay at BOTTOM (nested blocks)
  // 
  // Shape visualization:
  // ┌───────────────────────────────┐
  // │       Main body (icon + 4)    │  <- TOP (y=0 to mainBodyHeight)
  // ├────────┬─────────────────┬────┤
  // │ ▼ tab  │                 │tab▲│  <- Bay walls with notches
  // │        │   (bay/empty)   │    │
  // └────────┴─────────────────┴────┘  <- BOTTOM (y=mainBodyHeight to totalHeight)
  //
  // Total height = mainBodyHeight (top) + bayHeight (bottom)
  
  const headerWidth = 40;  // Left section
  const tailWidth = 60;    // Right section (holds number)
  const actualBayWidth = Math.max(bayWidth, MIN_BLOCK_X);
  
  // X coordinates
  const bayStartX = headerWidth;
  const bayEndX = headerWidth + actualBayWidth;
  
  // Y coordinates - MAIN BODY ON TOP
  const totalHeight = mainBodyHeight + bayHeight;
  const mainBodyTopY = 0;
  const mainBodyBottomY = mainBodyHeight;  // Where main body ends, bay starts
  const bayBottomY = totalHeight;
  
  // Notch positions
  // Outer walls: centered in totalHeight
  const outerNotchY = (totalHeight - NOTCH_HEIGHT) / 2;
  // Inner bay walls: centered in bayHeight, offset by mainBodyHeight
  const innerNotchY = mainBodyHeight + (bayHeight - NOTCH_HEIGHT) / 2;
  
  // Build path CLOCKWISE from top-left
  const path = `
    M ${cr},${mainBodyTopY}
    
    H ${totalWidth - cr}
    a ${cr},${cr} 0 0,1 ${cr},${cr}
    
    V ${outerNotchY}
    ${NOTCH_PATH_DOWN}
    V ${bayBottomY - cr}
    
    a ${cr},${cr} 0 0,1 -${cr},${cr}
    
    H ${bayEndX + cr}
    
    a ${cr},${cr} 0 0,0 -${cr},-${cr}
    
    V ${innerNotchY + NOTCH_HEIGHT}
    ${NOTCH_PATH_UP}
    V ${mainBodyBottomY + cr}
    
    a ${cr},${cr} 0 0,1 -${cr},-${cr}
    
    H ${bayStartX + cr}
    
    a ${cr},${cr} 0 0,1 -${cr},${cr}
    
    V ${innerNotchY}
    ${NOTCH_PATH_DOWN}
    V ${bayBottomY - cr}
    
    a ${cr},${cr} 0 0,1 -${cr},${cr}
    
    H ${cr}
    a ${cr},${cr} 0 0,1 -${cr},-${cr}
    
    V ${outerNotchY + NOTCH_HEIGHT}
    ${NOTCH_PATH_UP}
    V ${cr}
    
    a ${cr},${cr} 0 0,1 ${cr},-${cr}
    
    z
  `;
  
  return path;
};


// =============================================================================
// COLORS
// =============================================================================

export const HORIZONTAL_COLORS = {
  start: {
    primary: '#14A795',
    secondary: '#108677',
    tertiary: '#338c7b',
  },
  movement: {
    primary: '#A4DD4A',
    secondary: '#009444',
    tertiary: '#54b947',
  },
  turn: {
    primary: '#26A2F6',
    secondary: '#007ec4',
    tertiary: '#0e79b2',
  },
  loop: {
    primary: '#F7941D',
    secondary: '#c16500',
    tertiary: '#c56101',
  },
  workspace: {
    background: '#72D4C8',
    border: '#5BBFB3',
  },
};

// =============================================================================
// BLOCK METRICS
// =============================================================================

export type HorizontalBlockShape = 'hat' | 'stack' | 'c-block' | 'end' | 'argument';

export interface HorizontalBlockMetrics {
  width: number;
  height: number;
  shape: HorizontalBlockShape;
  hasStatement: boolean;
  bayWidth?: number;
  bayHeight?: number;
  startHat: boolean;
  endCap: boolean;
}

export function calculateBlockMetrics(
  hasOutput: boolean,
  hasPrevious: boolean,
  hasNext: boolean,
  hasStatement: boolean,
  statementBaySize?: { width: number; height: number }
): HorizontalBlockMetrics {
  let shape: HorizontalBlockShape = 'stack';
  let width = SEP_SPACE_X * 2 + IMAGE_FIELD_WIDTH; // Default width
  let height = SEP_SPACE_Y * 2 + IMAGE_FIELD_HEIGHT; // Default height
  
  // Enforce Minimum Dimensions from Doodle Specs
  width = Math.max(width, MIN_BLOCK_X);
  height = Math.max(height, MIN_BLOCK_Y);

  const startHat = hasNext && !hasPrevious;
  const endCap = !hasNext && hasPrevious && !hasOutput && !hasStatement;
  
  if (hasOutput) {
    shape = 'argument';
    height = FIELD_HEIGHT;
    width = FIELD_WIDTH;
  } else if (startHat) {
    shape = 'hat';
    // Hat block usually wider or has special left offset
    // Metrics handling logic usually implicit in renderer
  } else if (hasStatement) {
    shape = 'c-block';
  } else if (endCap) {
    shape = 'end';
    // End cap adjustment
  }
  
  if (hasStatement && statementBaySize) {
    // Basic logic for C-Block metrics addition
    // Ideally this matches the SVG path logic
    width += statementBaySize.width;
    height = Math.max(height, statementBaySize.height + STATEMENT_BLOCK_SPACE);
  }
  
  return {
    width,
    height,
    shape,
    hasStatement,
    bayWidth: statementBaySize?.width,
    bayHeight: statementBaySize?.height,
    startHat,
    endCap,
  };
}
