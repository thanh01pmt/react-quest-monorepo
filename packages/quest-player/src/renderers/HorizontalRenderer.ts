/**
 * Horizontal Renderer - Custom Blockly Renderer for Horizontal Blocks
 * 
 * Extends Zelos renderer to support horizontal block connections.
 * Follows Blockly custom renderer codelab architecture.
 */

import * as Blockly from 'blockly/core';
import { HorizontalDrawer } from './HorizontalDrawer';
import { HorizontalRenderInfo } from './HorizontalRenderInfo';
import { HorizontalConstantProvider } from './HorizontalConstantProvider';

//=
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
  override makeConstants_(): HorizontalConstantProvider {
    return new HorizontalConstantProvider();
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
// Track registration state
// let isRegistered = false;

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
    // isRegistered = true;
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
    // isRegistered = false;
    console.log('[HorizontalRenderer] Unregistered');
  } catch (e) {
    // Ignore if not registered
  }
}

export default HorizontalRenderer;
