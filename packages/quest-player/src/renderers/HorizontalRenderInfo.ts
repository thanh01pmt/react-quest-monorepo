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
    // 1. Run standard Zelos measurement to generate Field/Input instances
    super.measure();
    
    // 2. Filter Rows: Keep Header (0) and optionally the Statement Row
    if (this.rows.length > 0) {
        const originalRows = this.rows;
        const headerRow = originalRows[0];
        const statementRow = originalRows.find(r => r.hasStatement);
        
        // Rebuild rows list: always header, plus statement if found
        this.rows = [headerRow];
        if (statementRow) {
           this.rows.push(statementRow);
        }
        
        // 3. Recalculate HEADER Width
        let headerWidth = SEP_SPACE_X;
        for (const elem of headerRow.elements) {
           headerWidth += elem.width + SEP_SPACE_X;
        }
        
        // Check if this is explicitly a C-Block (Loop/Conditional)
        const isCBlock = this.block_.type === 'junior_repeat';
        let bayWidth = 0;
        let bayHeight = 0;
        
        console.log(`[HorizontalDebug] Measure ${this.block_.type} | IsCBlock: ${isCBlock}`);
        
        if (isCBlock) {
           console.log(`[HorizontalDebug] C-Block Logic Active for ${this.block_.type}`);
           // C-BLOCK LOGIC: Calculate Dimensions based on Content
           
           // Find the actual statement input to check for connected blocks
           const statementInput = this.block_.inputList.find(i => (i.type as number) === 3);
           
           if (statementInput && statementInput.connection && statementInput.connection.targetBlock()) {
              const startBlock = statementInput.connection.targetBlock() as Blockly.BlockSvg;
              
              // Force measurement of the stack to ensure dims are fresh
              startBlock.getHeightWidth(); 
              
              // Manually traverse the stack to calculate HORIZONTAL dimensions.
              // Standard getHeightWidth() uses vertical stacking logic (Max Width, Sum Height).
              // We need Sum Width, Max Height.
              let curr: Blockly.BlockSvg | null = startBlock;
              while (curr) {
                 // Force render if dirty to get accurate dimensions
                 // Use getHeightWidth() which triggers render() if needed
                 const dim = curr.getHeightWidth();
                 const w = dim.width;
                 const h = dim.height;
                 
                 bayWidth += w;
                 bayHeight = Math.max(bayHeight, h);
                 
                 curr = curr.getNextBlock() as Blockly.BlockSvg;
              }
           }
           // Ensure Bay is at least the minimum needed for one standard block
           bayWidth = Math.max(bayWidth, MIN_BLOCK_X);
           bayHeight = MIN_BLOCK_Y; // FIXED for horizontal layout
           
           // Scratch Jr C-BLOCK with UPWARD-OPENING BAY:
           // Total height = main body + bay (nested blocks extend UP from main body)
           
           const MAIN_BODY_HEIGHT = 40; // Bottom section
           const HEADER_WIDTH = 40;     // Left section with icon
           const TAIL_WIDTH = 60;       // Right section with repeat count (increased for visibility)
           
           // Total width = header + bay + tail
           this.width = Math.max(REPEAT_BLOCK_WIDTH, HEADER_WIDTH + bayWidth + TAIL_WIDTH);
           // SCRATCH JR: Total height = main body + bay (nested blocks extend UPWARD)
           this.height = MAIN_BODY_HEIGHT + bayHeight;
           
           // Update Header Row (main body section)
           headerRow.width = this.width; // Full width for top bar
           headerRow.height = MAIN_BODY_HEIGHT;
           
           // Update Statement Row (bay area - at TOP of block)
           if (statementRow) {
             statementRow.width = bayWidth; 
             statementRow.height = bayHeight;
             (statementRow as any).xPos = HEADER_WIDTH; // Starts after header
             // Bay is at Y=0 (top of block), nested blocks sit inside
             (statementRow as any).yPos = MAIN_BODY_HEIGHT; // Bay at BOTTOM
           }
           
        } else {
           // STANDARD BLOCK LOGIC - Fixed 64x64 size
           this.height = MIN_BLOCK_Y;
           this.width = MIN_BLOCK_X; // Force 64px width - elements will be centered inside
           
           headerRow.width = MIN_BLOCK_X;
           headerRow.height = MIN_BLOCK_Y;
        }
        
        const mainBodyHeight = isCBlock ? 40 : MIN_BLOCK_Y;
        const mainBodyY = 0; // Main body always at TOP

        // Position Header Row (Bottom for C-blocks, Top for others)
        (headerRow as any).xPos = 0;
        (headerRow as any).yPos = mainBodyY;
        
        // Center elements in header
        if (isCBlock && this.block_.type === 'junior_repeat') {
           // Custom layout for Loop: Icon in Header, Number in Tail
           const TAIL_WIDTH = 60;
           
           headerRow.elements.forEach((elem, index) => {
              // Element 0 is Icon, Element 1 is Number Input
              if (index === 0) {
                 // Icon in Header (Left)
                 (elem as any).xPos = SEP_SPACE_X;
              } else {
                 // Number in Tail (Right)
                 const tailStartX = this.width - TAIL_WIDTH;
                 // Center horizontally in tail
                 (elem as any).xPos = tailStartX + (TAIL_WIDTH - elem.width) / 2;
              }
              // Center vertically
              (elem as any).yPos = (mainBodyHeight - elem.height) / 2;
           });
        } else {
           // Standard sequential layout
           let xCursor = SEP_SPACE_X;
           for (const elem of headerRow.elements) {
              (elem as any).xPos = xCursor;
              // Center element vertically within the main body height
              (elem as any).yPos = (mainBodyHeight - elem.height) / 2;
              xCursor += elem.width + SEP_SPACE_X;
           }
        }
        
        console.log('[HorizontalRenderInfo] Recycled Measure (Dynamic):', this.block_.type, 
                'W:', this.width, 'H:', this.height, 'Rows:', this.rows.length);
    } else {
        // Fallback for empty blocks
        this.width = MIN_BLOCK_X;
        this.height = MIN_BLOCK_Y;
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
                'W:', this.width, 'H:', this.height);  }
}
