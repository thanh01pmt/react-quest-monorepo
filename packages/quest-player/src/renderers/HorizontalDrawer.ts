/**
 * Horizontal Drawer - Custom Drawing Logic for Horizontal Blocks
 * 
 * Key Strategy: Let the parent Zelos drawer do its work, then REPLACE
 * the final path by directly modifying the SVG path element's 'd' attribute.
 */

import * as Blockly from 'blockly/core';
import {
  generateHatBlockPath,
  generateStackBlockPath,
  generateCBlockPath,
  MIN_BLOCK_X,
  MIN_BLOCK_Y,
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
    // Let the parent do its default drawing
    super.draw();
    
    // Now replace the path with our custom horizontal path
    const customPath = this.getHorizontalBlockPath_();
    
    // DEBUG: Log the actual path content
    console.log('[HorizontalDrawer] Block:', this.block_.type, 
                'Width:', this.info_.width, 
                'Height:', this.info_.height);
    console.log('[HorizontalDrawer] Path preview (first 200 chars):', customPath.substring(0, 200));
    
    // Apply custom path to all path elements
    this.applyCustomPath_(customPath);
    
    // Center field icons in the block (now DOM exists)
    this.centerFieldIcons_();
  }
  
  /**
   * Center all field icons within the 64x64 block bounds.
   * This runs AFTER super.draw() so DOM elements exist.
   */
  private centerFieldIcons_() {
    try {
      const svgRoot = this.block_.getSvgRoot();
      if (!svgRoot) return;
      
      // Block dimensions (what we forced)
      const blockWidth = this.info_.width;
      const blockHeight = this.info_.height;
      
      // Find all field groups (.blocklyEditableText or image containers)
      for (const input of this.block_.inputList) {
        for (const field of input.fieldRow) {
          const fieldSvg = field.getSvgRoot?.();
          if (!fieldSvg) continue;
          
          // Get the field's actual size
          const size = field.getSize?.();
          if (!size) continue;
          
          // Calculate centered position
          // For 64x64 block with ~40x40 icon: (64-40)/2 = 12
          const centerX = (blockWidth - size.width) / 2;
          const centerY = (blockHeight - size.height) / 2;
          
          // Apply the transform
          fieldSvg.setAttribute('transform', `translate(${centerX}, ${centerY})`);
        }
      }
    } catch (e) {
      console.warn('[HorizontalDrawer] Error centering icons:', e);
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
        // Update svgPath (main path)
        if (pathObject.svgPath && pathObject.svgPath.setAttribute) {
          pathObject.svgPath.setAttribute('d', customPath);
          appliedCount++;
        }
        
        // Update svgPathDark (3D effect dark line)
        if (pathObject.svgPathDark && pathObject.svgPathDark.setAttribute) {
          pathObject.svgPathDark.setAttribute('d', customPath);
          appliedCount++;
        }
        
        // Update svgPathLight (3D effect light line)
        if (pathObject.svgPathLight && pathObject.svgPathLight.setAttribute) {
          pathObject.svgPathLight.setAttribute('d', customPath);
          appliedCount++;
        }
        
        // Update svgPathSelected (selection highlight)
        if (pathObject.svgPathSelected && pathObject.svgPathSelected.setAttribute) {
          pathObject.svgPathSelected.setAttribute('d', customPath);
          appliedCount++;
        }
        
        // Try setPath method if exists (updates all paths internally)
        if (typeof pathObject.setPath === 'function') {
          pathObject.setPath(customPath);
          appliedCount++;
        }
      }
      
      // Fallback: Query ALL path elements in the block's SVG group
      const svgRoot = this.block_.getSvgRoot();
      if (svgRoot) {
        const allPaths = svgRoot.querySelectorAll('path');
        allPaths.forEach((pathEl: Element) => {
          // Update any path that looks like a block path (has 'd' attribute)
          if (pathEl.hasAttribute('d')) {
            pathEl.setAttribute('d', customPath);
            appliedCount++;
          }
        });
      }
      
      // Also try block.svgPath_ directly
      const directSvgPath = (this.block_ as any).svgPath_;
      if (directSvgPath && directSvgPath.setAttribute) {
        directSvgPath.setAttribute('d', customPath);
        appliedCount++;
      }
      
      console.log('[HorizontalDrawer] Applied custom path to', appliedCount, 'elements for:', this.block_.type);
      
    } catch (e) {
      console.error('[HorizontalDrawer] Error applying path:', e);
    }
  }

  /**
   * Generate the complete SVG path for this block based on its type.
   */
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
      return generateCBlockPath(
        width, 
        height, 
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
    if (this.block_.type === 'junior_start') {
      return true;
    }
    // Generic: has next but no previous = hat block
    return !!this.block_.nextConnection && 
           !this.block_.previousConnection && 
           !this.block_.outputConnection;
  }

  /**
   * Helper to check if this block has a statement input (C-Block)
   */
  private hasStatementInput_(): boolean {
    for (const input of this.block_.inputList) {
      if ((input.type as number) === 3) { // NEXT_STATEMENT
        return true;
      }
    }
    return false;
  }

  /**
   * Helper to get dimensions of the statement bay
   */
  private getStatementBayDimensions_(): { width: number, height: number } {
    let bayWidth = 0;
    let bayHeight = 0;

    for (const row of this.info_.rows) {
      if (row.hasStatement) {
        bayHeight = row.height;
        bayWidth = row.width; 
        break;
      }
    }

    if (bayHeight === 0) bayHeight = 32; 
    if (bayWidth === 0) bayWidth = 64;   

    return { width: bayWidth, height: bayHeight };
  }
}
