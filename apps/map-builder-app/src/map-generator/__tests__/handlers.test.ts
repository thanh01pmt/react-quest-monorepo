/**
 * Unit Tests for Handlers
 * 
 * Tests for ported handlers: PatternLibrary, PlacementCalculator,
 * SymmetricPlacer, FallbackHandler, SolutionFirstPlacer
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Coord } from '../types';

// Import handlers
import { 
    getPatternLibrary, 
    PatternLibrary 
} from '../handlers/PatternLibrary';
import { 
    getPlacementCalculator, 
    PlacementCalculator 
} from '../handlers/PlacementCalculator';
import { 
    getSymmetricPlacer, 
    SymmetricPlacer 
} from '../handlers/SymmetricPlacer';
import { 
    getFallbackHandler, 
    FallbackHandler 
} from '../handlers/FallbackHandler';
import { 
    getSolutionFirstPlacer, 
    SolutionFirstPlacer 
} from '../handlers/SolutionFirstPlacer';

// ============================================================================
// PatternLibrary Tests
// ============================================================================
describe('PatternLibrary', () => {
    let library: PatternLibrary;
    
    beforeEach(() => {
        library = getPatternLibrary();
    });
    
    it('should return singleton instance', () => {
        const instance1 = getPatternLibrary();
        const instance2 = getPatternLibrary();
        expect(instance1).toBe(instance2);
    });
    
    it('should get patterns for function_logic', () => {
        const patterns = library.getPatterns('function_logic');
        expect(Array.isArray(patterns)).toBe(true);
        expect(patterns.length).toBeGreaterThan(0);
    });
    
    it('should get patterns for loop_logic', () => {
        const patterns = library.getPatterns('loop_logic');
        expect(Array.isArray(patterns)).toBe(true);
    });
    
    it('should filter patterns by segment length', () => {
        const patterns = library.getPatterns('function_logic');
        const filtered = library.filterBySegmentLength(patterns, 5);
        
        filtered.forEach(p => {
            expect(p.length).toBeLessThanOrEqual(5);
        });
    });
    
    it('should select best pattern for segment', () => {
        const patterns = library.getPatterns('function_logic');
        const filtered = library.filterBySegmentLength(patterns, 8);
        const best = library.selectBestPattern(filtered, 8);
        
        if (best) {
            expect(best.id).toBeDefined();
            expect(best.length).toBeLessThanOrEqual(8);
        }
    });
});

// ============================================================================
// PlacementCalculator Tests
// ============================================================================
describe('PlacementCalculator', () => {
    let calculator: PlacementCalculator;
    
    beforeEach(() => {
        calculator = getPlacementCalculator();
    });
    
    it('should return singleton instance', () => {
        const instance1 = getPlacementCalculator();
        const instance2 = getPlacementCalculator();
        expect(instance1).toBe(instance2);
    });
    
    it('should calculate placements for segment', () => {
        const segment: Coord[] = [
            [0, 0, 0], [1, 0, 0], [2, 0, 0], [3, 0, 0], [4, 0, 0]
        ];
        const pattern = {
            id: 'test_pattern',
            length: 5,
            item_types: ['gem', 'crystal'],
            offsets: [1, 3]
        };
        
        const placements = calculator.calculateForSegment(segment, pattern, 0);
        
        expect(Array.isArray(placements)).toBe(true);
        expect(placements.length).toBe(2);
        placements.forEach(p => {
            expect(p.type).toBeDefined();
            expect(p.pos).toBeDefined();
        });
    });
    
    it('should filter invalid placements', () => {
        const placements = [
            { type: 'gem', pos: [0, 0, 0] as Coord, pattern_id: 'p1', segment_idx: 0, offset_in_segment: 0 },
            { type: 'gem', pos: [5, 0, 0] as Coord, pattern_id: 'p1', segment_idx: 0, offset_in_segment: 5 },  // at target
        ];
        const startPos: Coord = [0, 0, 0];
        const targetPos: Coord = [5, 0, 0];
        const pathCoords: Coord[] = [[0, 0, 0], [1, 0, 0], [2, 0, 0], [3, 0, 0], [4, 0, 0], [5, 0, 0]];
        
        const filtered = calculator.filterInvalidPlacements(placements, startPos, targetPos, pathCoords);
        
        // Should filter out placement at start and target
        expect(filtered.length).toBeLessThan(placements.length);
    });
    
    it('should verify placements', () => {
        const placements = [
            { type: 'gem', pos: [2, 0, 0] as Coord, pattern_id: 'p1', segment_idx: 0, offset_in_segment: 2 },
        ];
        const pathCoords: Coord[] = [[0, 0, 0], [1, 0, 0], [2, 0, 0], [3, 0, 0]];
        const startPos: Coord = [0, 0, 0];
        const targetPos: Coord = [3, 0, 0];
        
        const result = calculator.verifyPlacements(placements, pathCoords, startPos, targetPos);
        
        expect(result.success).toBe(true);
        expect(result.errors).toHaveLength(0);
    });
});

// ============================================================================
// SymmetricPlacer Tests
// ============================================================================
describe('SymmetricPlacer', () => {
    let placer: SymmetricPlacer;
    
    beforeEach(() => {
        placer = getSymmetricPlacer();
    });
    
    it('should return singleton instance', () => {
        const instance1 = getSymmetricPlacer();
        const instance2 = getSymmetricPlacer();
        expect(instance1).toBe(instance2);
    });
    
    it('should detect hub-spoke topology', () => {
        const hubSpokeMetadata = {
            topology_type: 'plus_shape',
            hub: [[5, 0, 5]],
            branches: [[[5, 0, 6]], [[5, 0, 4]], [[6, 0, 5]], [[4, 0, 5]]]
        };
        
        expect(placer.isHubSpoke(hubSpokeMetadata)).toBe(true);
    });
    
    it('should detect island array topology', () => {
        const islandMetadata = {
            topology_type: 'symmetrical_islands',
            islands: [[[0, 0, 0]], [[0, 0, 5]], [[5, 0, 0]], [[5, 0, 5]]]
        };
        
        expect(placer.isIslandArray(islandMetadata)).toBe(true);
    });
    
    it('should not detect hub-spoke for linear topology', () => {
        const linearMetadata = {
            topology_type: 'straight_line',
            segment: [[0, 0, 0], [1, 0, 0], [2, 0, 0]]
        };
        
        expect(placer.isHubSpoke(linearMetadata)).toBe(false);
    });
});

// ============================================================================
// FallbackHandler Tests
// ============================================================================
describe('FallbackHandler', () => {
    let handler: FallbackHandler;
    
    beforeEach(() => {
        handler = getFallbackHandler();
    });
    
    it('should return singleton instance', () => {
        const instance1 = getFallbackHandler();
        const instance2 = getFallbackHandler();
        expect(instance1).toBe(instance2);
    });
    
    it('should provide fallback placement', () => {
        const pathInfo = {
            start_pos: [0, 0, 0] as Coord,
            target_pos: [5, 0, 0] as Coord,
            path_coords: [
                [0, 0, 0], [1, 0, 0], [2, 0, 0], [3, 0, 0], [4, 0, 0], [5, 0, 0]
            ] as Coord[],
            placement_coords: [],
            obstacles: [],
            metadata: {}
        };
        
        const buildLayoutFn = (pInfo: any, items: any[], logicType: string) => ({
            items,
            collectibles: [],
            interactibles: [],
            metadata: { logic_type: logicType }
        });
        
        const result = handler.fallbackPlacement(pathInfo, {}, buildLayoutFn);
        
        expect(result).toBeDefined();
        expect(result.items).toBeDefined();
        expect(Array.isArray(result.items)).toBe(true);
    });
});

// ============================================================================
// SolutionFirstPlacer Tests
// ============================================================================
describe('SolutionFirstPlacer', () => {
    let placer: SolutionFirstPlacer;
    
    beforeEach(() => {
        placer = getSolutionFirstPlacer();
    });
    
    it('should return singleton instance', () => {
        const instance1 = getSolutionFirstPlacer();
        const instance2 = getSolutionFirstPlacer();
        expect(instance1).toBe(instance2);
    });
    
    it('should place items on simple path', () => {
        const pathInfo = {
            start_pos: [0, 0, 0] as Coord,
            target_pos: [5, 0, 0] as Coord,
            path_coords: [
                [0, 0, 0], [1, 0, 0], [2, 0, 0], [3, 0, 0], [4, 0, 0], [5, 0, 0]
            ] as Coord[],
            placement_coords: [
                [1, 0, 0], [2, 0, 0], [3, 0, 0], [4, 0, 0]
            ] as Coord[],
            obstacles: [],
            metadata: {
                topology_type: 'straight_line',
                segments: [[[0, 0, 0], [1, 0, 0], [2, 0, 0], [3, 0, 0], [4, 0, 0], [5, 0, 0]]],
                segment_analysis: {
                    num_segments: 1,
                    lengths: [6],
                    types: ['linear'],
                    min_length: 6,
                    max_length: 6,
                    avg_length: 6
                },
                semantic_positions: {
                    start: [0, 0, 0],
                    end: [5, 0, 0],
                    optimal_start: 'start',
                    optimal_end: 'end',
                    valid_pairs: []
                }
            }
        };
        
        const assetMap = new Map([
            ['gem', { key: 'gem', name: 'Gem', type: 'collectible', primitiveShape: 'sphere', defaultProperties: {}, thumbnail: '' }],
            ['crystal', { key: 'crystal', name: 'Crystal', type: 'collectible', primitiveShape: 'sphere', defaultProperties: {}, thumbnail: '' }]
        ]);
        
        const result = placer.placeItems(pathInfo, { logic_type: 'function_logic' }, assetMap as any);
        
        expect(result).toBeDefined();
        expect(result.items).toBeDefined();
        expect(Array.isArray(result.items)).toBe(true);
    });
    
    it('should handle topology with segments', () => {
        const pathInfo = {
            start_pos: [0, 0, 0] as Coord,
            target_pos: [5, 0, 5] as Coord,
            path_coords: [
                [0, 0, 0], [1, 0, 0], [2, 0, 0], [3, 0, 0],
                [3, 0, 1], [3, 0, 2], [3, 0, 3], [3, 0, 4], [3, 0, 5],
                [4, 0, 5], [5, 0, 5]
            ] as Coord[],
            placement_coords: [],
            obstacles: [],
            metadata: {
                topology_type: 'l_shape',
                segments: [
                    [[0, 0, 0], [1, 0, 0], [2, 0, 0], [3, 0, 0]],
                    [[3, 0, 0], [3, 0, 1], [3, 0, 2], [3, 0, 3], [3, 0, 4], [3, 0, 5]],
                    [[3, 0, 5], [4, 0, 5], [5, 0, 5]]
                ],
                segment_analysis: {
                    num_segments: 3,
                    lengths: [4, 6, 3],
                    types: ['horizontal', 'vertical', 'horizontal'],
                    min_length: 3,
                    max_length: 6,
                    avg_length: 4.33
                }
            }
        };
        
        const assetMap = new Map([
            ['gem', { key: 'gem', name: 'Gem', type: 'collectible', primitiveShape: 'sphere', defaultProperties: {}, thumbnail: '' }]
        ]);
        
        const result = placer.placeItems(pathInfo, {}, assetMap as any);
        
        expect(result).toBeDefined();
        expect(result.metadata).toBeDefined();
    });
});
