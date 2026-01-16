/**
 * Horizontal Render Info
 * 
 * Custom RenderInfo for Horizontal Blocks.
 * Based on Scratch Blocks block_render_svg_horizontal.js
 * 
 * Key differences from vertical Blockly:
 * - Previous/Next connections are LEFT/RIGHT (not top/bottom)
 * - Icon field is RIGHT-BOTTOM aligned (not centered)
 * - C-blocks expand horizontally (not vertically)
 */

import * as Blockly from 'blockly/core';

// Constants matching Scratch Blocks (GRID_UNIT = 4)
const GRID_UNIT = 4;
const SEP_SPACE_X = 3 * GRID_UNIT;  // 12
const SEP_SPACE_Y = 3 * GRID_UNIT;  // 12
const IMAGE_FIELD_WIDTH = 10 * GRID_UNIT;  // 40
const IMAGE_FIELD_HEIGHT = 10 * GRID_UNIT; // 40
const MIN_BLOCK_X = 0.5 * 16 * GRID_UNIT;  // 32
const MIN_BLOCK_Y = 16 * GRID_UNIT;         // 64
const CORNER_RADIUS = 1 * GRID_UNIT;        // 4
const NOTCH_WIDTH = 2 * GRID_UNIT;          // 8
const STATEMENT_BLOCK_SPACE = 3 * GRID_UNIT; // 12

export class HorizontalRenderInfo extends Blockly.zelos.RenderInfo {
  
  constructor(renderer: Blockly.zelos.Renderer, block: Blockly.BlockSvg) {
    super(renderer, block);
  }

  /**
   * Override measure to compute horizontal block metrics.
   * Reference: block_render_svg_horizontal.js renderCompute_ (lines 429-526)
   */
  override measure() {
    // Run standard Zelos measure to initialize fields
    super.measure();
    
    if (this.rows.length === 0) return;
    
    // Keep only the first row (header) and statement row
    const originalRows = this.rows;
    const headerRow = originalRows[0];
    const statementRow = originalRows.find(r => r.hasStatement);
    this.rows = [headerRow];
    if (statementRow) this.rows.push(statementRow);

    // --- Compute metrics exactly like Scratch Blocks ---
    let bayHeight = 0;
    let bayWidth = 0;
    const hasStatement = !!statementRow;
    const isStartHat = this.block_.nextConnection && !this.block_.previousConnection;
    const isEndCap = !this.block_.nextConnection && this.block_.previousConnection && 
                     !this.block_.outputConnection && !hasStatement;

    // Compute bay dimensions if C-block
    if (hasStatement && this.block_ instanceof Blockly.BlockSvg) {
      const input = this.block_.inputList.find(i => i.type === (Blockly.NEXT_STATEMENT as any));
      if (input) {
        bayHeight = MIN_BLOCK_Y;
        bayWidth = MIN_BLOCK_X;
        
        if (input.connection && input.connection.targetConnection) {
          const linkedBlock = input.connection.targetBlock() as Blockly.BlockSvg;
          let curr: Blockly.BlockSvg | null = linkedBlock;
          let stackWidth = 0;
          let stackHeight = 0;
          
          while (curr) {
            const w = (curr as any).width || MIN_BLOCK_X;
            const h = (curr as any).height || MIN_BLOCK_Y;
            stackWidth += w;
            stackWidth -= NOTCH_WIDTH; // Exclude connected notch width
            stackHeight = Math.max(stackHeight, h);
            curr = curr.getNextBlock() as Blockly.BlockSvg;
          }
          
          bayHeight = Math.max(bayHeight, stackHeight);
          bayWidth = Math.max(bayWidth, stackWidth);
        }
      }
    }

    // Reference: lines 502-524
    // Standard block: width = SEP*2 + IMAGE = 64, height = 64
    let width = SEP_SPACE_X * 2 + IMAGE_FIELD_WIDTH;  // 12*2 + 40 = 64
    let height = SEP_SPACE_Y * 2 + IMAGE_FIELD_HEIGHT; // 12*2 + 40 = 64

    if (hasStatement) {
      // C-block: width += bayWidth + 4*CORNER + 2*GRID
      width += bayWidth + 4 * CORNER_RADIUS + 2 * GRID_UNIT;  // +bayW +16 +8 = +bayW +24
      height = bayHeight + STATEMENT_BLOCK_SPACE;  // bayH + 12
    }

    if (isStartHat) {
      // Hat blocks are 1 grid unit wider
      width += GRID_UNIT;  // +4
    }

    if (isEndCap) {
      // End caps are 1 grid unit wider
      width += GRID_UNIT;  // +4
    }

    // Store dimensions
    this.width = width;
    this.height = height;
    headerRow.width = width;
    headerRow.height = MIN_BLOCK_Y;

    if (statementRow) {
      statementRow.width = bayWidth;
      statementRow.height = bayHeight;
    }

    // --- Position Image Field: RIGHT-BOTTOM aligned ---
    // Reference: renderDraw_ lines 558-591
    // imageFieldX = width - imageFieldSize.width - SEP_SPACE_X / 1.5
    // imageFieldY = height - imageFieldSize.height - SEP_SPACE_Y
    for (const elem of headerRow.elements) {
      if ((elem as any).field) {
        const fieldWidth = elem.width || IMAGE_FIELD_WIDTH;
        const fieldHeight = elem.height || IMAGE_FIELD_HEIGHT;
        
        let imageX = width - fieldWidth - SEP_SPACE_X / 1.5;
        let imageY = height - fieldHeight - SEP_SPACE_Y;
        
        if (isEndCap) {
          // End caps offset image by 1 grid unit
          imageX -= GRID_UNIT;
        }
        
        (elem as any).xPos = imageX;
        (elem as any).yPos = imageY;
      }
    }
  }

  /**
   * Finalize the rendering info.
   */
  override finalize_() {
    super.finalize_();
    
    // CRITICAL: Apply NOTCH_WIDTH after all calculations
    // Reference: line 802 - this.width += Blockly.BlockSvg.NOTCH_WIDTH
    if (this.block_.nextConnection) {
      this.width += NOTCH_WIDTH;  // +8
    }
    
    (this as any).widthWithChildren = this.width;
    (this as any).heightWithChildren = this.height;
    (this.block_ as any).height = this.height;
    (this.block_ as any).width = this.width;
  }
}
