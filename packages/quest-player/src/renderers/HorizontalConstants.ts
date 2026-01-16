// Unused Blockly import removed

// ...

// Unused Blockly import removed

// Grid unit (4px)

// Grid unit (4px)
export const GRID_UNIT = 4;

// Block Dimensions
export const MIN_BLOCK_X = 32; // 8 * GRID_UNIT (Derived from 1/2 * 16 * 4)
export const MIN_BLOCK_Y = 64; // 16 * GRID_UNIT

export const SEP_SPACE_X = 12; // 3 * GRID_UNIT
export const SEP_SPACE_Y = 12; // 3 * GRID_UNIT

export const CORNER_RADIUS = 4; // 1 * GRID_UNIT
export const HAT_CORNER_RADIUS = 32; // 8 * GRID_UNIT

export const NOTCH_WIDTH = 8; // 2 * GRID_UNIT
export const NOTCH_HEIGHT = 34; // 8 * GRID_UNIT + 2

// Calculated offsets
// Left Notch starts at Top + 14px (height - corner - sep - notch)
// 64 - 4 - 12 - 34 = 14.
export const NOTCH_START_Y = 14; 

// SVG Paths from Core
export const NOTCH_PATH_DOWN = 'c 0,2 1,3 2,4 l 4,4 c 1,1 2,2 2,4 v 12 c 0,2 -1,3 -2,4 l -4,4 c -1,1 -2,2 -2,4';
export const NOTCH_PATH_UP = 'c 0,-2 1,-3 2,-4 l 4,-4 c 1,-1 2,-2 2,-4 v -12 c 0,-2 -1,-3 -2,-4 l -4,-4 c -1,-1 -2,-2 -2,-4';

export const TOP_LEFT_CORNER_START = `m ${CORNER_RADIUS},0`;
export const TOP_LEFT_CORNER = `A ${CORNER_RADIUS},${CORNER_RADIUS} 0 0,0 0,${CORNER_RADIUS}`;
export const HAT_TOP_LEFT_CORNER_START = `m ${HAT_CORNER_RADIUS},0`;
export const HAT_TOP_LEFT_CORNER = `A ${HAT_CORNER_RADIUS},${HAT_CORNER_RADIUS} 0 0,0 0,${HAT_CORNER_RADIUS}`;

// Generate Path Functions (Replicating renderDraw_ logic)

export const generateStackBlockPath = (width: number, height: number, _rtl: boolean) => {
  const cr = CORNER_RADIUS;
  // Dynamic Notch Y (Bottom Aligned logic from Core)
  const cursorY = height - CORNER_RADIUS - SEP_SPACE_Y - NOTCH_HEIGHT;
  
  // Left Edge
  let path = `
    ${TOP_LEFT_CORNER_START}
    ${TOP_LEFT_CORNER}
    V ${cursorY}
    ${NOTCH_PATH_DOWN}
    V ${height - cr}
  `;

  // Bottom Edge
  path += `a ${cr},${cr} 0 0,0 ${cr},${cr}`;

  // Right Edge
  path += `
    H ${width - cr}
    a ${cr},${cr} 0 0,0 ${cr},-${cr}
    v -${2.5 * GRID_UNIT} 
    ${NOTCH_PATH_UP}
    V ${cr}
    a ${cr},${cr} 0 0,0 -${cr},-${cr}
    z
  `;
  return path;
};

// Header Width IS THE LEFT PART (Head)
export const generateCBlockPath = (totalWidth: number, headWidth: number, _tailWidth: number, bayWidth: number, bayHeight: number, _rtl: boolean) => {
  const cr = CORNER_RADIUS;
  const notchH = NOTCH_HEIGHT;
  
  // Total Height for path calculation
  // We assume bayHeight is the inner height.
  // The 'spine' (top bar) adds thickness. 
  // Reference: height = bayHeight + STATEMENT_BLOCK_SPACE
  const STATEMENT_BLOCK_SPACE = 12; // 3 * GRID
  const totalHeight = bayHeight + STATEMENT_BLOCK_SPACE;
  
  // Start Top-Left
  let path = `
    ${TOP_LEFT_CORNER_START}
    ${TOP_LEFT_CORNER}
  `;
  
  // Left Edge (with Notch)
  // Determine cursorY for notch start (same as stack block)
  // notchStartY = 14px from top?
  const cursorY = totalHeight - cr - SEP_SPACE_Y - notchH;
  // Actually, left edge length depends on totalHeight.
  // We use V commands to standard notch positions?
  // Reference renderDrawLeft_ uses `V cursorY`, `NOTCH`, `V height-cr`.
  
  path += `
    V ${cursorY}
    ${NOTCH_PATH_DOWN}
    V ${totalHeight - cr}
  `;
  
  // Bottom-Left Corner
  path += `a ${cr},${cr} 0 0,0 ${cr},${cr}`;
  
  // --------------------------------------------------
  // BOTTOM PROFILE: Head -> Bay -> Tail
  // Reference renderDrawBottom_
  // --------------------------------------------------
  
  // 1. Head Bottom
  // h 4*GRID (16px)
  path += `h ${headWidth}`; 
  
  // 2. Turn UP into Bay (Corner In)
  // Reference: a 4,4 0 0,0 4,-4  (Counter-clockwise: dx=4, dy=-4)
  // Scratch uses relative arc.
  path += `a ${cr},${cr} 0 0,0 ${cr},-${cr}`;
  
  // 3. Inner Left Wall (Up)
  // v -2.5*GRID (-10px)
  path += `v -10`;
  
  // Statement Notch (on Inner Left Wall)
  // Reference uses NOTCH_PATH_UP.
  // It effectively draws a notch on the vertical wall?
  // NOTCH_PATH_UP is: c 0,-2 1,-3 2,-4 ... (Moves 4px right, 4px up...?)
  path += NOTCH_PATH_UP;
  
  // Continue Up to Ceiling
  // v -bayHeight ... 
  // We need to reach Top Bar thickness (12px from top).
  // Current Y is roughly (totalHeight - 4 - 10 - 8 - ...).
  const topThick = STATEMENT_BLOCK_SPACE; // 12
  // We want to stop at Y = topThick + cr?
  // Actually, let's execute the 'Ceiling' at Y = 12?
  // Calculate remaining vertical distance to Ceiling Corner.
  // The Wall height is (totalHeight - topThick - bottomCorner - notchArea).
  // Let's rely on simple geometry:
  // We went Up 10, then Notch (~? height).
  // Let's just draw line to Ceiling Y.
  // Ceiling Y = topThick.
  // Corner radius consideration: Ceiling line is at Y=topThick. Corner starts at Y=topThick+cr.
  // So V to `topThick + cr`.
  path += `V ${topThick + cr}`;
  
  // 4. Ceiling Corner (Left)
  // Turn Right: a cr,cr 0 0,1 cr,-cr  (dx=4, dy=-4) -> Ends at Y=topThick.
  path += `a ${cr},${cr} 0 0,1 ${cr},-${cr}`;
  
  // 5. Ceiling (Right)
  // h bayWidth - 2*cr
  path += `h ${bayWidth - 2*cr}`;
  
  // 6. Ceiling Corner (Right)
  // Turn Down: a cr,cr 0 0,1 cr,cr (dx=4, dy=4)
  path += `a ${cr},${cr} 0 0,1 ${cr},${cr}`;
  
  // 7. Inner Right Wall (Down)
  // V to bottom corner start.
  // Bottom inner corner starts at Y = totalHeight - cr - 4 (corner radius offset).
  // Actually the corner is `a cr,cr 0 0,0 cr,cr` (dx=4, dy=4).
  // Ends at Y = totalHeight.
  // So we V to `totalHeight - cr`.
  path += `V ${totalHeight - cr}`;
  
  // 8. Turn Out (Corner Out)
  // a cr,cr 0 0,0 cr,cr  (dx=4, dy=4)
  path += `a ${cr},${cr} 0 0,0 ${cr},${cr}`;
  
  // 9. Tail Bottom
  // Leftover width.
  // totalWidth = head + 4 + bay + 4 + tail.
  // Or roughly.
  // We just H to right edge corner.
  path += `H ${totalWidth - cr}`;
  
  // --------------------------------------------------
  // Right Edge
  // --------------------------------------------------
  
  // Bottom-Right Corner
  path += `a ${cr},${cr} 0 0,0 ${cr},-${cr}`;
  
  // Edge Up
  // V to notch start?
  // Use generateStackBlockPath logic for right edge
  path += `v -${2.5 * GRID_UNIT}`; 
  path += NOTCH_PATH_UP;
  path += `V ${cr}`;
  
  // Top-Right Corner
  path += `a ${cr},${cr} 0 0,0 -${cr},-${cr}`;
  
  // Top Edge
  path += `z`; // Close path (H 0 implies implicit close)
  
  return path;
};

export const generateHatBlockPath = (width: number, height: number, _rtl: boolean) => {
   // Similar to Stack but with HAT_TOP_LEFT_CORNER
   const cr = CORNER_RADIUS;
   
   return `
    ${HAT_TOP_LEFT_CORNER_START}
    ${HAT_TOP_LEFT_CORNER}
    V ${height - cr}
    a ${cr},${cr} 0 0,0 ${cr},${cr}
    H ${width - cr}
    a ${cr},${cr} 0 0,0 ${cr},-${cr}
    v -10
    ${NOTCH_PATH_UP}
    V ${cr}
    a ${cr},${cr} 0 0,0 -${cr},-${cr}
    H ${HAT_CORNER_RADIUS}
    a ${HAT_CORNER_RADIUS},${HAT_CORNER_RADIUS} 0 0,1 -${HAT_CORNER_RADIUS},-${HAT_CORNER_RADIUS}
    z`;
};
