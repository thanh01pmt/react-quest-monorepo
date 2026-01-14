/**
 * Horizontal Renderer - Custom Blockly Renderer for Horizontal Blocks
 * 
 * Extends Zelos renderer to support horizontal block connections.
 * Ported algorithms from scratch-blocks/core/block_render_svg_horizontal.js
 */

import * as Blockly from 'blockly/core';
import { HorizontalDrawer } from './HorizontalDrawer';
import { HorizontalRenderInfo } from './HorizontalRenderInfo';
import { 
  GRID_UNIT,
  CORNER_RADIUS,
  HAT_CORNER_RADIUS,
  NOTCH_HEIGHT,
  NOTCH_WIDTH,
  NOTCH_PATH_DOWN,
  NOTCH_PATH_UP,
  MIN_BLOCK_X,
  MIN_BLOCK_Y,
} from './HorizontalConstants';

// =============================================================================
// HORIZONTAL CONSTANTS PROVIDER
// =============================================================================

/**
 * Custom constants for horizontal block layout
 */
export class HorizontalConstantsProvider extends Blockly.zelos.ConstantProvider {
  
  constructor() {
    super();
  }

  override init() {
    super.init();
    
    // Override with horizontal-specific values
    (this as any).GRID_UNIT = GRID_UNIT;
    this.CORNER_RADIUS = CORNER_RADIUS;
    this.NOTCH_HEIGHT = NOTCH_HEIGHT;
    this.NOTCH_WIDTH = NOTCH_WIDTH;
    
    // Larger minimum block size for icon-only blocks
    this.MIN_BLOCK_WIDTH = MIN_BLOCK_X;
    this.MIN_BLOCK_HEIGHT = MIN_BLOCK_Y;
    
    // Hat block corner radius
    this.START_HAT_HEIGHT = HAT_CORNER_RADIUS;
    
    // Enable start hats
    this.ADD_START_HATS = true;
  }

  /**
   * Override notch shape for horizontal connectors (left/right instead of top/bottom)
   */
  override makeNotch() {
    const width = NOTCH_WIDTH;
    const height = NOTCH_HEIGHT;
    
    // Path for next connection (right side of block)
    const pathRight = NOTCH_PATH_UP;
    
    // Path for previous connection (left side of block) 
    const pathLeft = NOTCH_PATH_DOWN;
    
    return {
      type: this.SHAPES.NOTCH,
      width: width,
      height: height,
      pathLeft: pathLeft,
      pathRight: pathRight,
    };
  }

  /**
   * Override puzzle tab for horizontal connections
   */
  override makePuzzleTab() {
    const width = NOTCH_WIDTH;
    const height = NOTCH_HEIGHT;
    
    return {
      type: this.SHAPES.PUZZLE,
      width: width,
      height: height,
      pathUp: NOTCH_PATH_UP,
      pathDown: NOTCH_PATH_DOWN,
    };
  }

  /**
   * Create hat shape (semicircle on left)
   */
  override makeStartHat() {
    const height = HAT_CORNER_RADIUS * 2;
    const width = HAT_CORNER_RADIUS;
    
    // Semicircle path for left side of hat block
    const path = `
      A ${HAT_CORNER_RADIUS},${HAT_CORNER_RADIUS} 0 0,0 0,${HAT_CORNER_RADIUS}
      a ${HAT_CORNER_RADIUS},${HAT_CORNER_RADIUS} 0 0,0 ${HAT_CORNER_RADIUS},${HAT_CORNER_RADIUS}
    `.replace(/\s+/g, ' ').trim();
    
    return {
      height: height,
      width: width,
      path: path,
    };
  }
}

// =============================================================================
// HORIZONTAL RENDERER
// =============================================================================

/**
 * Custom renderer for horizontal block layout
 */
export class HorizontalRenderer extends Blockly.zelos.Renderer {
  
  constructor(name: string) {
    super(name);
  }

  /**
   * Create the constants provider for this renderer
   */
  override makeConstants_(): HorizontalConstantsProvider {
    return new HorizontalConstantsProvider();
  }

  /**
   * Create custom RenderInfo for horizontal layout.
   * THIS IS CRITICAL for connection positioning!
   */
  override makeRenderInfo_(block: Blockly.BlockSvg): HorizontalRenderInfo {
    return new HorizontalRenderInfo(this, block);
  }

  /**
   * Create a custom drawer for horizontal blocks
   * @param block The block to render
   * @param info Rendering information
   */
  override makeDrawer_(block: Blockly.BlockSvg, info: Blockly.zelos.RenderInfo): HorizontalDrawer {
    return new HorizontalDrawer(block, info);
  }
}

// Track registration state
let isRegistered = false;

// =============================================================================
// REGISTRATION
// =============================================================================

/**
 * Register the horizontal renderer with Blockly
 */
export function registerHorizontalRenderer() {
  // Check if already registered using Blockly's registry
  try {
    // Try to get from registry - if it exists, skip registration
    const existing = Blockly.registry.getClass(
      Blockly.registry.Type.RENDERER, 
      'horizontal',
      false // Don't throw if not found
    );
    if (existing) {
      console.log('[HorizontalRenderer] Already registered, skipping');
      return;
    }
  } catch (e) {
    // Registry check failed, try to register anyway
  }
  
  try {
    Blockly.blockRendering.register('horizontal', HorizontalRenderer);
    isRegistered = true;
    console.log('[HorizontalRenderer] Registered successfully');
  } catch (e) {
    // Already registered - this is OK
    console.log('[HorizontalRenderer] Registration skipped (already exists)');
  }
}

/**
 * Unregister the horizontal renderer
 */
export function unregisterHorizontalRenderer() {
  try {
    Blockly.blockRendering.unregister('horizontal');
    isRegistered = false;
    console.log('[HorizontalRenderer] Unregistered');
  } catch (e) {
    // Ignore if not registered
  }
}

export default HorizontalRenderer;
