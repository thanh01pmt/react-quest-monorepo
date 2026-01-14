import * as Blockly from 'blockly/core';

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

export const generateStackBlockPath = (width: number, height: number, rtl: boolean) => {
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

export const generateCBlockPath = (totalWidth: number, mainBodyHeight: number, bayWidth: number, bayHeight: number, rtl: boolean) => {
  const cr = CORNER_RADIUS;
  const notchH = NOTCH_HEIGHT;
  
  // Calculate CursorY for Left edge first
  // In our RenderInfo, mainBodyHeight is just 64. But real geometry depends on Bay.
  // Actually, let's just use total logic.
  // Left Edge Logic: V totalHeight-8 -> Notch -> V totalHeight-CR.
  // We need Total Height passed in? 
  // We can re-derive it: main + bay? 
  // Wait, in measure(), we set height = bayHeight + 12 (STATEMENT_SPACE).
  // Let's pass 'height' instead of 'mainBodyHeight' to be safe?
  // No, let's stick to the args but interpret carefully.
  // Actually, looking at renderDrawBottom_, it uses 'metrics.height' for connectionsXY.
  
  // Let's assume mainBodyHeight represents the top bar H (64).
  // We need the ACTUAL TOTAL HEIGHT for the left edge.
  // In RenderInfo, 'this.height' was set to bayHeight + 12.
  
  // Re-deriving Total Height from parts matching RenderInfo logic:
  // Height = bayHeight + 12 (STATEMENT_BLOCK_SPACE).
  const STATEMENT_BLOCK_SPACE = 12; // 3 * GRID
  // But wait, renderDrawRight uses height for v moves.
  // Let's rely on the passed MainBodyHeight being the "Header Height" (64)
  // And we need to construct the full path.
  
  // Actually, simpler: The function should take (width, height, bayWidth, bayHeight).
  // But interface takes mainBodyHeight. Let's fix the call site later if needed.
  // For now, let's assume valid inputs.
  
  // RE-READING renderDrawBottom_:
  // It draws the bottom of the top bar, then the bay.
  // Sequence:
  // 1. h 4*GRID (16)
  // 2. Corner down-left (a 4,4 0 0,0 4,-4) --> Wait, this is 'a' command?
  //    Core: a 4,4 0 0,0 4,-4. (Corner Radius is 4).
  // 3. v -2.5*GRID (-10)
  // 4. NOTCH_UP
  // 5. v -bayHeight + 3*CR + NotchH + 2*GRID
  // 6. a 4,4 0 0,1 4,-4 (Inner corner top-left)
  // 7. h bayWidth - 2*CR
  // 8. a 4,4 0 0,1 4,4 (Inner corner top-right)
  // 9. v bayHeight - 3*CR - NotchH - 2*GRID (if notch at right) OR just v...
  //    Actually core checks bayNotchAtRight. We assume YES always for now.
  // 10. NOTCH_DOWN
  // 11. V ... (down to bottom)
  
  // Let's execute this sequence.
  
  // Left Edge (Standard)
  // It needs Total Height. 
  const totalHeight = bayHeight + STATEMENT_BLOCK_SPACE;
  const cursorY = totalHeight - cr - SEP_SPACE_Y - notchH;
  
  let path = `
    ${TOP_LEFT_CORNER_START}
    ${TOP_LEFT_CORNER}
    V ${cursorY}
    ${NOTCH_PATH_DOWN}
    V ${totalHeight - cr}
  `;
  
  // Bottom Edge (Strict Core Sequence):
  // 1. h 16
  path += `a ${cr},${cr} 0 0,0 ${cr},${cr}`; // Bottom-Left Corner of Stack
  path += `h ${4 * GRID_UNIT}`; 
  
  // 2. Corner into Bay (Outer -> Inner)
  // Core Line 723: a 4,4 0 0,0 4,-4
  path += `a ${cr},${cr} 0 0,0 ${cr},-${cr}`;
  
  // 3. v -10
  path += `v ${-2.5 * GRID_UNIT}`;
  
  // 4. NOTCH UP (The "Ceiling" of the bay has a notch for nested block)
  path += `${NOTCH_PATH_UP}`;
  
  // 5. v up-into-bay
  // Core Line 730: v -bayHeight + 3*CR + NotchH + 2*GRID
  const vUp = -bayHeight + (cr * 3) + notchH + (2 * GRID_UNIT);
  path += `v ${vUp}`;
  
  // 6. Inner Corner Top-Left
  // Core Line 732: a 4,4 0 0,1 4,-4
  path += `a ${cr},${cr} 0 0,1 ${cr},-${cr}`;
  
  // 7. h bayWidth
  // Core Line 736: h bayWidth - 2*CR
  path += `h ${bayWidth - (cr * 2)}`;
  
  // 8. Inner Corner Top-Right
  // Core Line 737: a 4,4 0 0,1 4,4
  path += `a ${cr},${cr} 0 0,1 ${cr},${cr}`;
  
  // 9. v down-from-bay
  // Core Line 742: v bayHeight - 3*CR - NotchH - 2*GRID
  // Note: Core checks bayNotchAtRight. We assume True.
  const vDown = bayHeight - (cr * 3) - notchH - (2 * GRID_UNIT);
  path += `v ${vDown}`;
  
  // 10. NOTCH DOWN (The "Floor" of the bay connection? No, this is the right wall of bay?)
  // Wait, in Horizontal, the bay is the space between the "C".
  // The notch is on the right wall of the C.
  path += `${NOTCH_PATH_DOWN}`;
  
  // 11. V to bottom
  // Core Line 746: V bayHeight + 2*GRID
  // Wait, V implies absolute Y? 
  // Core uses 'V'. "V metrics.bayHeight + 2 * GRID_UNIT".
  // Let's double check coordinates.
  // SVG 'V' is absolute Y. 
  // If we utilize relative 'v', we need to close the shape.
  // Core uses absolute V to finish the leg?
  // "V bayHeight + 2*GRID" -> This brings us to the bottom of the top arm?
  // No, "bayHeight" is the height of the inner content.
  // 
  // Actually, 'renderDrawBottom_' draws the ENTIRE bottom profile.
  // After the notch, it does a corner a 4,4 0 0,0 4,4.
  // Let's assume relative commands for safety or match Core's absolute context.
  // Core's context: (0,0) is top-left.
  // If we use V, we need exact Y.
  // Core: V bayHeight + 8.
  // RenderInfo Height formula: bayHeight + 12.
  // So V (TotalHeight - 4).
  // This matches V ${totalHeight - cr}.
  path += `V ${totalHeight - cr}`;
  
  // Bottom-Right Corner of C-Block Leg
  path += `a ${cr},${cr} 0 0,0 ${cr},${cr}`;
  
  // Right Edge (Standard Stack-like)
  // H totalWidth - CR
  path += `H ${totalWidth - cr}`;
  
  // Corner Up-Right
  path += `a ${cr},${cr} 0 0,0 ${cr},-${cr}`;
  
  // v -10
  path += `v ${-2.5 * GRID_UNIT}`;
  
  // Notch Up (Connection to next block)
  path += `${NOTCH_PATH_UP}`;
  
  // V CR (Go to top)
  path += `V ${cr}`;
  
  // Top-Right Corner
  path += `a ${cr},${cr} 0 0,0 -${cr},-${cr}`;
  
  path += `z`;
  
  return path;
};

export const generateHatBlockPath = (width: number, height: number, rtl: boolean) => {
   // Similar to Stack but with HAT_TOP_LEFT_CORNER
   const cr = CORNER_RADIUS;
   const hatCr = HAT_CORNER_RADIUS;
   let path = `
     ${HAT_TOP_LEFT_CORNER_START}
     ${HAT_TOP_LEFT_CORNER}
     V ${height - cr}
   `; // No Notch Down on left
   
    path += `a ${cr},${cr} 0 0,0 ${cr},${cr}`; // Bottom left corner
    
    // Right Edge (same as Stack)
    path += `
    H ${width - cr}
    a ${cr},${cr} 0 0,0 ${cr},-${cr}
    v -10
    ${NOTCH_PATH_UP}
    V ${cr}
    a ${cr},${cr} 0 0,0 -${cr},-${cr}
    z
  `;
  return path;
};
