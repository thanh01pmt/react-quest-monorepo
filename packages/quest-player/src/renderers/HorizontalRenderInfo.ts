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
  MIN_BLOCK_X,
  MIN_BLOCK_Y,
  REPEAT_BLOCK_WIDTH,
  SEP_SPACE_X,
} from './HorizontalConstantProvider';

export class HorizontalRenderInfo extends Blockly.zelos.RenderInfo {
  
  constructor(renderer: Blockly.zelos.Renderer, block: Blockly.BlockSvg) {
    super(renderer, block);
  }

  /**
   * Override measure to manually build the horizontal row layout.
   * Strategy: Recycle the first row created by super.measure() (which contains the fields)
   * and discard the rest (vertical stack), then force-layout the elements horizontally.
   */
  override measure() {
    // 1. Run standard Zelos measure to init fields
    super.measure();
    
    // 2. Clear rows but keep references
    if (this.rows.length === 0) return;
    const originalRows = this.rows;
    const headerRow = originalRows[0];
    const statementRow = originalRows.find(r => r.hasStatement);
    this.rows = [headerRow];
    if (statementRow) this.rows.push(statementRow);

    // 3. Init Metrics (matching Scratch metric structure conceptually)
    let width = 0;
    let height = 0;
    let bayHeight = 0;
    let bayWidth = 0;
    let bayNotchAtRight = true;
    const isCBlock = !!statementRow; // Has statement = C-Block candidate

    // 4. Compute Bay Dimensions (if C-Block)
    if (isCBlock && this.block_ instanceof Blockly.BlockSvg) {
        // Find statement input
        const input = this.block_.inputList.find(i => i.type === Blockly.NEXT_STATEMENT);
        if (input) {
             bayHeight = MIN_BLOCK_Y; // Base Bay Height
             bayWidth = MIN_BLOCK_X;  // Base Bay Width

             if (input.connection && input.connection.targetConnection) {
                 const linkedBlock = input.connection.targetBlock() as Blockly.BlockSvg;
                 // Get dimensions of linked stack
                 const bBox = linkedBlock.getHeightWidth(); // This returns Max Width, Sum Height (Standard)
                 // Wait, Scratch Horizontal needs Sum Width, Max Height?
                 // Actually Scratch Core uses bBox.height/width directly. 
                 // In Horizontal Scratch, standard blocks are W:64, H:64. 
                 // A stack of 2 blocks has W:128, H:64.
                 // Zelos.getHeightWidth() might behave differently.
                 // We will trust our custom traverse logic if needed, but let's try bBox first.
                 // Actually, let's use the traversal logic from before as it's safer for Horizontal.
                 
                 let stackWidth = 0;
                 let stackHeight = 0;
                 let curr: Blockly.BlockSvg | null = linkedBlock;
                 while(curr) {
                     // [Fix] Use cached dimensions instead of recursive getHeightWidth()
                     // getHeightWidth() sums the stack height (Vertical logic), causing C-Block to grow indefinetely.
                     // We want individual block dimensions: Width accumulates, Height is MAX.
                     // Children are rendered before parents, so .width/.height are populated.
                     const w = (curr as any).width || MIN_BLOCK_X;
                     const h = (curr as any).height || MIN_BLOCK_Y;
                     
                     stackWidth += w;
                     stackHeight = Math.max(stackHeight, h);
                     
                     // Notch Compensation: If block has a next connection, it likely added NOTCH_WIDTH.
                     // We typically want the visuals to abut effectively.
                     // If we sum widths, we get the total row length. This is correct.
                     
                     curr = curr.getNextBlock() as Blockly.BlockSvg;
                 }
                 
                 bayHeight = Math.max(bayHeight, stackHeight);
                 bayWidth = Math.max(bayWidth, stackWidth);
                 
                 // Check notch at right
                 // var linkedBlock = input.connection.targetBlock();
                 // if (linkedBlock && !linkedBlock.lastConnectionInStack()) { ... }
             } else {
                 // Empty bay: Reduce width by Notch Width?
                 // Core: metrics.bayWidth -= Blockly.BlockSvg.NOTCH_WIDTH;
                 // But MIN_BLOCK_X is 32. 
                 // Let's stick to base bay width.
             }
        }
    }

    // 5. Compute Width/Height (Core Logic)
    // Always render image field at 40x40 px 
    // Normal block sizing: SEP * 2 + FIELD_WIDTH
    // Core: metrics.width = SEP_SPACE_X * 2 + IMAGE_FIELD_WIDTH
    // SEP=12, IMG=40 => 24+40 = 64. Correct.
    width = MIN_BLOCK_X; 
    height = MIN_BLOCK_Y;

    // Is C-Block?
    if (isCBlock) {
        // metrics.width += metrics.bayWidth + 4 * CORNER_RADIUS + 2 * GRID_UNIT;
        // CORNER_RADIUS=4, GRID=4. 
        // 4*4 + 2*4 = 16 + 8 = 24.
        const CORNER_RADIUS = 4; // match constants
        const GRID_UNIT = 4;
        width += bayWidth + 4 * CORNER_RADIUS + 2 * GRID_UNIT; 
        
        // metrics.height = metrics.bayHeight + STATEMENT_BLOCK_SPACE;
        // STATEMENT_BLOCK_SPACE = 12 (3 * GRID)
        const STATEMENT_BLOCK_SPACE = 12;
        height = bayHeight + STATEMENT_BLOCK_SPACE;
    }

    // 6. Loop Block Specifics (Junior Repeat)
    // The previous logic added TAIL_WIDTH (60) for the number.
    // Core doesn't mention tails because it puts fields as shadow blocks.
    // Since we put field inside, we need space.
    if (this.block_.type === 'junior_repeat') {
        const TAIL_WIDTH = 64; // Approx space for number
        width += TAIL_WIDTH;
    }

    // 7. Store Dimensions
    this.width = width;
    this.height = height;
    
    // 8. Update Rows
    headerRow.width = this.width;
    headerRow.height = MIN_BLOCK_Y; // The 'spine' is always 64

    if (statementRow) {
        statementRow.width = bayWidth;
        statementRow.height = bayHeight;
        // Positioning handled in HorizontalConstants/Drawer via SVG
    }

    // 9. Element Positioning (Recycled from previous working logic)
    // We keep the "Icon Left, Number Tail" logic as it visually matches.
     if (this.block_.type === 'junior_repeat') {
           const TAIL_WIDTH = 60;
           headerRow.elements.forEach((elem, index) => {
              if (index === 0) {
                 (elem as any).xPos = SEP_SPACE_X;
              } else {
                 // Fixed Tail Position
                 // We need to calculate based on the Visual Width (without next connection)
                 // But wait, width is about to be modified by finalize/draw?
                 // Let's safe-guard:
                 const visualWidth = width; 
                 (elem as any).xPos = visualWidth - TAIL_WIDTH + (TAIL_WIDTH - elem.width) / 2;
              }
              (elem as any).yPos = Math.floor((MIN_BLOCK_Y - elem.height) / 2) + 2;
           });
    } else {
        // Standard centering
        let xCursor = SEP_SPACE_X;
        for (const elem of headerRow.elements) {
            (elem as any).xPos = xCursor;
            (elem as any).yPos = Math.floor((MIN_BLOCK_Y - elem.height) / 2) + 2;
            xCursor += elem.width + SEP_SPACE_X;
        }
    }
  }

  /**
   * Finalize the rendering info.
   * This is where we calculate the final geometry and connection locations.
   */
  override finalize_() {
    super.finalize_();
    
    // NOTE: Dimension overrides provided in measure() are authoritative.
    // We do NOT override them here anymore.
    // Connection offsets are now enforced in HorizontalDrawer.draw() 
    // to prevent Zelos from resetting them.
    
    (this as any).widthWithChildren = this.width;
    (this as any).heightWithChildren = this.height;
    (this.block_ as any).height = this.height;
    (this.block_ as any).width = this.width;
    
    console.log('[HorizontalRenderInfo] Finalized', this.block_.type, 
                'W:', this.width, 'H:', this.height);

    // [Fix] Defer Loop Number Positioning to ensure it sticks to the tail
    // This is necessary because Layout phase runs before Width is expanded by children
    if ((this as any).isCBlock && this.block_.type === 'junior_repeat') {
        const headerRow = this.rows[0];
        console.log('[HorizontalRenderInfo] Deferred Position Junior Repeat:', this.width);
        if (headerRow && headerRow.elements.length > 1) {
            const numField = headerRow.elements[1]; 
            const TAIL_WIDTH = 60;
            // Center in tail relative to FINAL width
            // Force update
            const newX = this.width - TAIL_WIDTH + (TAIL_WIDTH - numField.width) / 2;
            console.log('[HorizontalRenderInfo] Moving Number Field to:', newX, 'Width:', this.width);
            (numField as any).xPos = newX;
        }
    }
  }
}
