/**
 * Horizontal Drawer - Custom Drawing Logic for Horizontal Blocks
 * 
 * Key Strategy: Let the parent Zelos drawer do its work, then REPLACE
 * the final path by directly modifying the SVG path element's 'd' attribute.
 */

import * as Blockly from 'blockly/core';
import {
  MIN_BLOCK_X,
  MIN_BLOCK_Y,
  C_BLOCK_HEAD_WIDTH,
  C_BLOCK_TAIL_WIDTH
} from './HorizontalConstantProvider';
import {
  generateHatBlockPath,
  generateStackBlockPath,
  generateCBlockPath,
} from './HorizontalConstants';

/**
 * Custom drawer that generates paths for horizontal blocks.
 * Overrides draw() to replace the SVG path after Zelos builds its default.
 */
export class HorizontalDrawer extends Blockly.zelos.Drawer {
  
  constructor(block: Blockly.BlockSvg, info: Blockly.zelos.RenderInfo) {
    super(block, info);
  }

  /**
   * Override draw() to let parent build, then replace SVG path directly.
   */
  override draw() {
    try {
      // 1. Draw the block outline path (Standard Zelos)
      super.draw();
      
      // 2. Generate custom path for Horizontal Block
      const customPath = this.getHorizontalBlockPath_();
      
      // 3. Apply custom path to all path elements
      this.applyCustomPath_(customPath);
      
      // 4. Force Position Fields based on RenderInfo (RIGHT-BOTTOM aligned)
      // Reference: block_render_svg_horizontal.js renders fields explicitly.
      const info = this.info_ as any;
      if (info.rows && info.rows[0]) {
         for (const elem of info.rows[0].elements) {
             // Check if element has 'field' property and calculated xPos/yPos
             if (elem.xPos !== undefined && elem.yPos !== undefined) {
                 // The element might be a wrapper, actual field is elem.field
                 const field = elem.field || (elem instanceof Blockly.Field ? elem : null);
                 if (field && field.getSvgRoot) {
                     const root = field.getSvgRoot();
                     if (root) {
                        root.setAttribute('transform', 
                            `translate(${elem.xPos}, ${elem.yPos})`);
                     }
                 }
             }
         }
      }
      
      // 5. Position connections (Match new width/height)
      this.positionConnections_();
      
    } catch (e) {
      console.error('[HorizontalDrawer] Error applying path:', e);
      // Fallback
       const w = this.info_.width || 32;
       const h = this.info_.height || 64;
       const cr = 4;
       const fallback = `M 0,${cr} a ${cr},${cr} 0 0,1 ${cr},-${cr} H ${w-cr} a ${cr},${cr} 0 0,1 ${cr},${cr} V ${h-cr} a ${cr},${cr} 0 0,1 -${cr},${cr} H ${cr} a ${cr},${cr} 0 0,1 -${cr},-${cr} z`;
       this.applyCustomPath_(fallback);
    }
  }
  
  /**
   * Force connection locations to match Horizontal Layout.
   * 
   * For Scratch Jr C-blocks with UPWARD-OPENING BAY:
   * - Main body is at bottom, bay extends upward
   * - Prev/Next connections are on the main body walls
   * - Statement connection is inside the bay (where nested blocks connect)
   */
  private positionConnections_() {
    const info = this.info_ as any; 
    const xy = this.block_.getRelativeToSurfaceXY();
    // const isCBlock = this.block_.type === 'junior_repeat'; // Unused
    // Removing to fix TS6133
    // const isCBlock = this.block_.type === 'junior_repeat';
    
    // Scratch Blocks Core Logic: Connections are Bottom-Aligned
    // See block_render_svg_horizontal.js line 674
    // var connectionY = connectionsXY.y + metrics.height - Blockly.BlockSvg.CORNER_RADIUS * 2;
    
    // CORNER_RADIUS is 4px. Offset is 8px from bottom.
    // For Standard Block (64px): ConnY = 56.
    // For C-Block (Height H): ConnY = H - 8.
    
    const CORNER_RADIUS = 4;
    const connY = info.height - 2 * CORNER_RADIUS;
    
    // 1. Previous Connection (Left-Edge)
    if (this.block_.previousConnection) {
      const conn = this.block_.previousConnection as Blockly.RenderedConnection;
      conn.setOffsetInBlock(0, connY);
      conn.moveTo(xy.x + 0, xy.y + connY);
    }
    
    // 2. Next Connection (Right-Edge)
    if (this.block_.nextConnection) {
      const conn = this.block_.nextConnection as Blockly.RenderedConnection;
      const xOffset = info.width;
      conn.setOffsetInBlock(xOffset, connY);
      conn.moveTo(xy.x + xOffset, xy.y + connY);
    }
    
    // 3. Output Connection
    if (this.block_.outputConnection) {
      const conn = this.block_.outputConnection as Blockly.RenderedConnection;
      conn.setOffsetInBlock(0, connY);
      conn.moveTo(xy.x + 0, xy.y + connY);
    }
    
    // 4. Statement Connection (for C-blocks - in the bay)
    // Core Logic: Statement connection is also BOTTOM aligned relative to the block's height?
    // See block_render_svg_horizontal.js:
    // var connectionY = connectionsXY.y + metrics.height - Blockly.BlockSvg.CORNER_RADIUS * 2;
    // So Statement Connection Y is SAME as Next Connection Y!
    // This allows the nested block (which is also bottom-aligned) to sit on the floor of the bay.
    
    for (const input of this.block_.inputList) {
      if ((input.type as number) === 3 && input.connection) { // NEXT_STATEMENT
         const conn = input.connection as Blockly.RenderedConnection;
         // Stick to C_BLOCK_HEAD_WIDTH (16px) as the header width
         // This ensures the nested block starts right after the thin "Head"
         const HEADER_WIDTH = C_BLOCK_HEAD_WIDTH; 
         
         conn.setOffsetInBlock(HEADER_WIDTH, connY);
         conn.moveTo(xy.x + HEADER_WIDTH, xy.y + connY);
      }
    }
  }

  /**
   * Apply our custom path to ALL of the block's SVG path elements.
   * CRITICAL: Blockly/Zelos has multiple paths (main, light, dark, selected).
   * We must update ALL of them to ensure drag highlight uses correct dimensions.
   */
  private applyCustomPath_(customPath: string) {
    let appliedCount = 0;
    
    try {
      const pathObject = (this.block_ as any).pathObject;
      
      if (pathObject) {
        // Update svgPath (main path) - this holds the color
        if (pathObject.svgPath && pathObject.svgPath.setAttribute) {
          pathObject.svgPath.setAttribute('d', customPath);
          appliedCount++;
        }
        
        // HIDE/CLEAR svgPathDark (3D effect dark line)
        // This was likely causing the "Black Block" issue by overlaying the main path
        if (pathObject.svgPathDark && pathObject.svgPathDark.setAttribute) {
          pathObject.svgPathDark.setAttribute('d', ''); // Clear path
        }
        
        // HIDE/CLEAR svgPathLight (3D effect light line)
        if (pathObject.svgPathLight && pathObject.svgPathLight.setAttribute) {
          pathObject.svgPathLight.setAttribute('d', ''); // Clear path
        }
        
        // Update svgPathSelected (selection highlight)
        if (pathObject.svgPathSelected && pathObject.svgPathSelected.setAttribute) {
          pathObject.svgPathSelected.setAttribute('d', customPath);
          appliedCount++;
        }
        
        // We do NOT use setPath() anymore as it might reset Dark/Light paths
      }
      
      // DO NOT use querySelectorAll('path') - that would update CHILD blocks too!
      // Each block's draw() method is responsible for its own path only.
      
      console.log('[HorizontalDrawer] Applied custom path to', appliedCount, 'elements for:', this.block_.type);
      
    } catch (e) {
      console.error('[HorizontalDrawer] Error applying path:', e);
       // Fallback: Apply a basic rect path so block is visible
       const w = this.info_.width || 100;
       const h = this.info_.height || 64;
       const cr = 4;
       // Simple rounded rect
       const fallback = `M 0,${cr} a ${cr},${cr} 0 0,1 ${cr},-${cr} H ${w-cr} a ${cr},${cr} 0 0,1 ${cr},${cr} V ${h-cr} a ${cr},${cr} 0 0,1 -${cr},${cr} H ${cr} a ${cr},${cr} 0 0,1 -${cr},-${cr} z`;
       this.applyCustomPath_(fallback);
    }
  }




  private getHorizontalBlockPath_(): string {
    // Ensure minimum dimensions
    const width = Math.max(this.info_.width, MIN_BLOCK_X);
    const height = Math.max(this.info_.height, MIN_BLOCK_Y);
    const rtl = this.block_.RTL || false;
    
    // Determine block type and get the appropriate path
    if (this.isHatBlock_()) {
      return generateHatBlockPath(width, height, rtl);
    } else if (this.hasStatementInput_()) {
      const bayDimensions = this.getStatementBayDimensions_();
      
      // CRITICAL FIX: Use the calculated width from RenderInfo
      // RenderInfo.measure() already handles Header + Bay + Tail + NOTCH_WIDTH logic.
      // Recalculating it here caused desync (missing Notch Width).
      const totalWidth = this.info_.width;
      
      return generateCBlockPath(
        totalWidth,        // Use authoritative width
        C_BLOCK_HEAD_WIDTH, // 16px
        C_BLOCK_TAIL_WIDTH, // 76px
        bayDimensions.width,
        bayDimensions.height,
        rtl
      );
    } else {
      // Standard Stack Block (Command) or Reporter
      return generateStackBlockPath(width, height, rtl);
    }
  }

  /**
   * Helper to check if this is a hat block (Start block)
   */
  private isHatBlock_(): boolean {
    // Strict check: Only 'junior_start' is a hat.
    return this.block_.type === 'junior_start';
  }

  /**
   * Helper to check if this block has a statement input (C-Block)
   */
  private hasStatementInput_(): boolean {
    // Only junior_repeat (Loop) should render as C-Block
    if (this.block_.type !== 'junior_repeat') {
      return false;
    }
    // Verify it actually has a statement input
    return this.block_.inputList.some(i => (i.type as number) === 3);
  }

  /**
   * Helper to get dimensions of the statement bay by iterating connected blocks
   * For HORIZONTAL layout: width expands, height is FIXED at MIN_BLOCK_Y
   */
  private getStatementBayDimensions_(): { width: number, height: number } {
    let bayWidth = 0;

    // Find the statement input
    const statementInput = this.block_.inputList.find(i => (i.type as number) === 3);
    
    console.log('[HorizontalDrawer] getStatementBayDimensions_ for:', this.block_.type);
    console.log('[HorizontalDrawer] statementInput:', statementInput ? 'found' : 'NOT FOUND');
    
    if (statementInput && statementInput.connection) {
      const targetBlock = statementInput.connection.targetBlock();
      console.log('[HorizontalDrawer] targetBlock:', targetBlock ? targetBlock.type : 'NONE');
      
      if (targetBlock) {
        // Iterate through connected blocks to calculate HORIZONTAL width only
        let curr = targetBlock as Blockly.BlockSvg | null;
        let blockCount = 0;
        while (curr) {
          const dim = curr.getHeightWidth();
          console.log('[HorizontalDrawer] Child block:', curr.type, 'width:', dim.width, 'height:', dim.height);
          bayWidth += dim.width;
          // Height is FIXED - don't accumulate from nested blocks
          curr = curr.getNextBlock() as Blockly.BlockSvg | null;
          blockCount++;
        }
        console.log('[HorizontalDrawer] Total blocks:', blockCount, 'bayWidth:', bayWidth);
      }
    }

    // Ensure minimum bay size
    if (bayWidth === 0) bayWidth = MIN_BLOCK_X; // 76px minimum
    
    // Height is FIXED at MIN_BLOCK_Y for horizontal layout
    const bayHeight = MIN_BLOCK_Y; // 66px FIXED

    console.log('[HorizontalDrawer] Final bay dimensions:', bayWidth, 'x', bayHeight);
    return { width: bayWidth, height: bayHeight };
  }
}
