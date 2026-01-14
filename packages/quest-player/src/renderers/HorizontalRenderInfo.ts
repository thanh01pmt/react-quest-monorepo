/**
 * Horizontal Render Info
 * 
 * Custom RenderInfo for Horizontal Blocks.
 * Overrides the geometry calculation to map connections horizontally:
 * - Previous Connection -> Left (x=0, y=NOTCH_START_Y)
 * - Next Connection -> Right (x=width, y=NOTCH_START_Y)
 * 
 * Also centers icons (fields) within the block.
 */

import * as Blockly from 'blockly/core';
import {
  SEP_SPACE_X,
  MIN_BLOCK_X,
  MIN_BLOCK_Y,
} from './HorizontalConstants';

export class HorizontalRenderInfo extends Blockly.zelos.RenderInfo {
  
  constructor(renderer: Blockly.zelos.Renderer, block: Blockly.BlockSvg) {
    super(renderer, block);
  }

  /**
   * Override measure to adjust connection locations for horizontal layout
   * AND force internal element layout.
   * 
   * CRITICAL: For horizontal blocks, we FORCE the height to be MIN_BLOCK_Y (64px)
   * instead of letting Zelos calculate based on vertical row stacking.
   */
  override measure() {
    // Run standard measurement first to get base row/field dimensions
    super.measure();
    
    // Check if this is a C-block (has statement input)
    const hasStatementInput = this.block_.inputList.some(
      input => (input.type as number) === 3 // NEXT_STATEMENT
    );
    
    // CRITICAL FIX: For horizontal layout, FORCE dimensions to square blocks
    // Standard blocks should be ~64x64, C-blocks can be taller
    if (hasStatementInput) {
      // C-blocks: allow taller but enforce minimum
      this.width = Math.max(this.width, MIN_BLOCK_X * 2); // Wider for statement bay
      this.height = Math.max(this.height, MIN_BLOCK_Y * 2); // Taller for nested blocks
    } else {
      // Standard blocks: FORCE to 64x64 (not just minimum!)
      this.width = MIN_BLOCK_X;  // Force width to 64
      this.height = MIN_BLOCK_Y; // Force height to 64
    }
    
    console.log('[HorizontalRenderInfo] Measured', this.block_.type, 
                'Width:', this.width, 'Height:', this.height,
                'HasStatement:', hasStatementInput);

    // AGGRESSIVE LAYOUT OVERRIDE
    // Iterate over rows and force element positions
    // This bypasses any standard alignment logic that might be failing
    
    for (const row of this.rows) {
       // Force row to match block metrics if single row
       // (Simplified logic for basic blocks)
       if (this.rows.length === 1) {
           row.width = this.width;
           row.height = this.height;
           // Force row to start at top-left
           (row as any).yPos = 0;
           (row as any).xPos = 0;
       }
       
       // Center elements horizontally and vertically
       let xCursor = SEP_SPACE_X;
       
       for (const elem of row.elements) {
          // Re-position element
          // Cast to any because Measurable type definition might lack xPos/yPos 
          // but internal renderer usage expects it.
          (elem as any).xPos = xCursor;
          
          // Center vertically
          (elem as any).yPos = (this.height - elem.height) / 2;
          
          // Advance cursor
          xCursor += elem.width + SEP_SPACE_X;
       }
     }
  }

  /**
   * Finalize the geometric information and position connections.
   * 
   * CRITICAL: For horizontal layout, both previous and next connections
   * must have the SAME Y coordinate but different X coordinates.
   * 
   * From logo17.2.js lines 1046-1049:
   *   previousConnection: (x, y + height - 8)        // LEFT side
   *   nextConnection:     (x + width, y + height - 8) // RIGHT side
   * 
   * The "8" offset centers the notch vertically in the connection area.
   */
  override finalize_() {
    super.finalize_();
    
    // CRITICAL FIX: super.finalize_() recalculates this.width and this.height from rows!
    // We MUST force our dimensions immediately after calling super.
    
    // Check if this is a C-block (has statement input)
    const hasStatementInput = this.block_.inputList.some(
      input => (input.type as number) === 3 // NEXT_STATEMENT
    );
    
    // Force dimensions AGAIN (super.finalize_() overwrote them!)
    if (hasStatementInput) {
      this.width = Math.max(MIN_BLOCK_X * 2, this.width);
      this.height = Math.max(MIN_BLOCK_Y * 2, this.height);
    } else {
      this.width = MIN_BLOCK_X;  // Force to 64
      this.height = MIN_BLOCK_Y; // Force to 64
    }
    
    // CRITICAL: Also force widthWithChildren and heightWithChildren
    // These are what Blockly uses for highlight/drag bounding box calculations
    (this as any).widthWithChildren = this.width;
    (this as any).heightWithChildren = this.height;
    
    // Also ensure the block's own properties are set correctly
    // Some Blockly operations read these directly
    (this.block_ as any).height = this.height;
    (this.block_ as any).width = this.width;
    
    console.log('[HorizontalRenderInfo] Finalized', this.block_.type, 
                'Width:', this.width, 'Height:', this.height,
                'WidthWithChildren:', (this as any).widthWithChildren, 
                'HeightWithChildren:', (this as any).heightWithChildren);
    
    // Calculate the Y offset for connections (same for both)
    // This positions the notch center at height - 8 from top of block
    const connectionYOffset = this.height - 8;
    
    // Previous Connection → LEFT side at X=0
    if (this.block_.previousConnection) {
      this.block_.previousConnection.setOffsetInBlock(0, connectionYOffset);
    }
    
    // Next Connection → RIGHT side at X=width
    if (this.block_.nextConnection) {
      this.block_.nextConnection.setOffsetInBlock(this.width, connectionYOffset);
    }
    
    // Output Connection (if any) → LEFT side, same as previous
    if (this.block_.outputConnection) {
      this.block_.outputConnection.setOffsetInBlock(0, connectionYOffset);
    }
    
    // Statement inputs (for C-blocks) - position on bottom
    for (const input of this.block_.inputList) {
      // NEXT_STATEMENT = 3 in Blockly (for statement inputs)
      // Use direct number comparison to avoid type issues
      if ((input.type as number) === 3 && input.connection) {
        // Statement connection goes at bottom-left inside the bay
        // Cast to RenderedConnection to access setOffsetInBlock
        (input.connection as Blockly.RenderedConnection).setOffsetInBlock(16, this.height);
      }
    }
    
    // NOTE: Icon positioning is done in HorizontalDrawer.centerFieldIcons_()
    // because RenderInfo runs BEFORE DOM exists
  }
}
