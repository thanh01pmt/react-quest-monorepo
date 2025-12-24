import { describe, it, expect } from 'vitest';
import { SelectionEngine } from './SelectionEngine';
import { PlacedObject, BuildableAsset } from '../types';

// Helper to create test objects
function createTestObject(
  id: string,
  position: [number, number, number],
  assetKey: string = 'ground.normal'
): PlacedObject {
  const asset: BuildableAsset = {
    key: assetKey,
    name: assetKey,
    type: 'block',
    model: `/models/${assetKey}.glb`,
    thumbnail: `/thumbnails/${assetKey}.png`
  };
  
  return {
    id,
    asset,
    position,
    rotation: [0, 0, 0],
    properties: {}
  };
}

describe('SelectionEngine', () => {
  describe('selectConnected', () => {
    it('selects all connected tiles in a line', () => {
      // Arrange: 5 tiles in a row
      const objects: PlacedObject[] = [
        createTestObject('t0', [0, 0, 0]),
        createTestObject('t1', [1, 0, 0]),
        createTestObject('t2', [2, 0, 0]),
        createTestObject('t3', [3, 0, 0]),
        createTestObject('t4', [4, 0, 0]),
      ];
      
      const engine = new SelectionEngine();
      
      // Act: Start from middle
      const selected = engine.selectConnected('t2', objects);
      
      // Assert: All 5 should be selected
      expect(selected).toHaveLength(5);
      expect(selected).toEqual(expect.arrayContaining(['t0', 't1', 't2', 't3', 't4']));
    });
    
    it('selects all tiles in a 3x3 grid', () => {
      // Arrange: 3x3 grid (9 tiles)
      const objects: PlacedObject[] = [];
      let id = 0;
      for (let x = 0; x < 3; x++) {
        for (let z = 0; z < 3; z++) {
          objects.push(createTestObject(`t${id++}`, [x, 0, z]));
        }
      }
      
      const engine = new SelectionEngine();
      
      // Act: Select from center
      const selected = engine.selectConnected('t4', objects); // Center of 3x3
      
      // Assert: All 9 tiles selected
      expect(selected).toHaveLength(9);
    });
    
    it('stops at walls (different asset type)', () => {
      // Arrange: Room with walls
      const objects: PlacedObject[] = [
        // Floor tiles
        createTestObject('floor1', [1, 0, 1], 'ground.normal'),
        createTestObject('floor2', [2, 0, 1], 'ground.normal'),
        createTestObject('floor3', [3, 0, 1], 'ground.normal'),
        
        // Wall blocks (different asset)
        createTestObject('wall1', [0, 0, 1], 'wall.brick02'),
        createTestObject('wall2', [4, 0, 1], 'wall.brick02'),
      ];
      
      const engine = new SelectionEngine();
      
      // Act: Select floor tile
      const selected = engine.selectConnected('floor1', objects);
      
      // Assert: Only floor tiles, walls excluded
      expect(selected).toHaveLength(3);
      expect(selected).toEqual(expect.arrayContaining(['floor1', 'floor2', 'floor3']));
      expect(selected).not.toContain('wall1');
      expect(selected).not.toContain('wall2');
    });
    
    it('handles isolated tiles (single tile selection)', () => {
      // Arrange: Isolated tiles (no adjacent tiles of same type)
      const objects: PlacedObject[] = [
        createTestObject('isolated', [5, 0, 5], 'ground.normal'),
        createTestObject('other1', [10, 0, 10], 'ground.mud'), // Different asset
        createTestObject('other2', [6, 0, 6], 'ground.mud'), // Different asset, but adjacent
      ];
      
      const engine = new SelectionEngine();
      
      // Act
      const selected = engine.selectConnected('isolated', objects);
      
      // Assert: Only the single tile
      expect(selected).toHaveLength(1);
      expect(selected).toEqual(['isolated']);
    });
    
    it('handles vertical adjacency (3D selection)', () => {
      // Arrange: Vertical stack of tiles
      const objects: PlacedObject[] = [
        createTestObject('b0', [5, 0, 5]),
        createTestObject('b1', [5, 1, 5]),
        createTestObject('b2', [5, 2, 5]),
        createTestObject('b3', [5, 3, 5]),
      ];
      
      const engine = new SelectionEngine();
      
      // Act: Select bottom
      const selected = engine.selectConnected('b0', objects);
      
      // Assert: All vertical tiles selected
      expect(selected).toHaveLength(4);
      expect(selected).toEqual(expect.arrayContaining(['b0', 'b1',' b2', 'b3']));
    });
    
    it('does not select diagonally adjacent tiles', () => {
      // Arrange: Diagonal arrangement
      const objects: PlacedObject[] = [
        createTestObject('center', [5, 0, 5]),
        createTestObject('diag1', [6, 0, 6]), // Diagonal, should NOT connect
        createTestObject('diag2', [4, 0, 4]), // Diagonal, should NOT connect
        createTestObject('adjacent', [6, 0, 5]), // Adjacent, SHOULD connect
      ];
      
      const engine = new SelectionEngine();
      
      // Act
      const selected = engine.selectConnected('center', objects);
      
      // Assert: Only center + adjacent (not diagonals)
      expect(selected).toHaveLength(2);
      expect(selected).toEqual(expect.arrayContaining(['center', 'adjacent']));
      expect(selected).not.toContain('diag1');
      expect(selected).not.toContain('diag2');
    });
    
    it('returns empty array for non-existent start ID', () => {
      // Arrange
      const objects: PlacedObject[] = [
        createTestObject('t1', [0, 0, 0]),
      ];
      
      const engine = new SelectionEngine();
      
      // Act
      const selected = engine.selectConnected('nonexistent', objects);
      
      // Assert
      expect(selected).toEqual([]);
    });
    
    it('handles large selections efficiently', () => {
      // Arrange: 20x20 grid (400 tiles)
      const objects: PlacedObject[] = [];
      let id = 0;
      for (let x = 0; x < 20; x++) {
        for (let z = 0; z < 20; z++) {
          objects.push(createTestObject(`t${id++}`, [x, 0, z]));
        }
      }
      
      const engine = new SelectionEngine();
      
      // Act with timing
      const startTime = performance.now();
      const selected = engine.selectConnected('t0', objects);
      const duration = performance.now() - startTime;
      
      // Assert: All tiles selected, completes fast
      expect(selected).toHaveLength(400);
      expect(duration).toBeLessThan(100); // Should be very fast (<100ms)
    });
    
    it('handles L-shaped structure correctly', () => {
      // Arrange: L-shape
      const objects: PlacedObject[] = [
        // Vertical part of L
        createTestObject('L0', [0, 0, 0]),
        createTestObject('L1', [0, 0, 1]),
        createTestObject('L2', [0, 0, 2]),
        // Horizontal part of L
        createTestObject('L3', [1, 0, 2]),
        createTestObject('L4', [2, 0, 2]),
        createTestObject('L5', [3, 0, 2]),
      ];
      
      const engine = new SelectionEngine();
      
      // Act: Select from corner
      const selected = engine.selectConnected('L2', objects);
      
      // Assert: All 6 tiles of L-shape
      expect(selected).toHaveLength(6);
      expect(selected).toEqual(expect.arrayContaining(['L0', 'L1', 'L2', 'L3', 'L4', 'L5']));
    });
  });
  
  describe('getSelectionPreview', () => {
    it('returns same result as selectConnected', () => {
      // Arrange
      const objects: PlacedObject[] = [
        createTestObject('t0', [0, 0, 0]),
        createTestObject('t1', [1, 0, 0]),
        createTestObject('t2', [2, 0, 0]),
      ];
      
      const engine = new SelectionEngine();
      
      // Act
      const preview = engine.getSelectionPreview('t1', objects);
      const actual = engine.selectConnected('t1', objects);
      
      // Assert: Same result
      expect(preview).toEqual(actual);
    });
  });
});
