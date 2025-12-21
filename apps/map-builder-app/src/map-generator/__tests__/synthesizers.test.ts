/**
 * Unit Tests for Synthesizers
 * 
 * Tests for ported synthesizers: BaseSynthesizer, FunctionSynthesizer,
 * DefaultSynthesizer, SynthesizerRegistry
 */

import { describe, it, expect, beforeEach } from 'vitest';

// Import synthesizers
import { 
    SynthesizerStrategy, 
    StructuredBlock 
} from '../synthesizers/BaseSynthesizer';
import { 
    FunctionSynthesizer, 
    getFunctionSynthesizer 
} from '../synthesizers/FunctionSynthesizer';
import { 
    DefaultSynthesizer, 
    getDefaultSynthesizer 
} from '../synthesizers/DefaultSynthesizer';
import { 
    SynthesizerRegistry, 
    getSynthesizerRegistry 
} from '../synthesizers/SynthesizerRegistry';

// ============================================================================
// SynthesizerStrategy Static Methods Tests
// ============================================================================
describe('SynthesizerStrategy Static Methods', () => {
    
    describe('compressActionsToStructure', () => {
        it('should compress repeating actions into loops', () => {
            const actions = ['moveForward', 'moveForward', 'moveForward', 'moveForward'];
            const availableBlocks = new Set(['maze_repeat', 'maze_moveForward']);
            
            const result = SynthesizerStrategy.compressActionsToStructure(actions, availableBlocks);
            
            // Should find the repeating pattern
            expect(result.length).toBeGreaterThanOrEqual(1);
        });
        
        it('should handle turns correctly', () => {
            const actions = ['moveForward', 'turnLeft', 'moveForward'];
            const availableBlocks = new Set(['maze_moveForward', 'maze_turn']);
            
            const result = SynthesizerStrategy.compressActionsToStructure(actions, availableBlocks);
            
            expect(result.length).toBe(3);
            expect(result[1].type).toBe('maze_turn');
            expect(result[1].direction).toBe('turnLeft');
        });
        
        it('should handle CALL actions', () => {
            const actions = ['CALL:PROCEDURE_1', 'moveForward'];
            const availableBlocks = new Set(['maze_moveForward']);
            
            const result = SynthesizerStrategy.compressActionsToStructure(actions, availableBlocks);
            
            expect(result[0].type).toBe('CALL');
            expect(result[0].name).toBe('PROCEDURE_1');
        });
        
        it('should return empty for empty actions', () => {
            const result = SynthesizerStrategy.compressActionsToStructure([], new Set());
            expect(result).toEqual([]);
        });
    });
    
    describe('findMostFrequentSequence', () => {
        it('should find repeating sequence', () => {
            const actions = [
                'moveForward', 'turnLeft',
                'moveForward', 'turnLeft',
                'moveForward', 'turnLeft'
            ];
            
            const result = SynthesizerStrategy.findMostFrequentSequence(actions);
            
            expect(result).not.toBeNull();
            if (result) {
                expect(result.frequency).toBeGreaterThanOrEqual(2);
                expect(result.sequence.length).toBeGreaterThanOrEqual(2);
            }
        });
        
        it('should return null for no repeating sequence', () => {
            const actions = ['moveForward', 'turnLeft', 'jump'];
            
            const result = SynthesizerStrategy.findMostFrequentSequence(actions, 3, 10, false);
            
            // No sequence of length 3+ repeats
            expect(result).toBeNull();
        });
        
        it('should respect minLen parameter', () => {
            const actions = ['a', 'b', 'a', 'b', 'a', 'b'];
            
            const result = SynthesizerStrategy.findMostFrequentSequence(actions, 2, 10, false);
            
            if (result) {
                expect(result.sequence.length).toBeGreaterThanOrEqual(2);
            }
        });
    });
    
    describe('findLongestRepeatingSequence', () => {
        it('should find consecutive repeating sequence', () => {
            const actions = ['a', 'b', 'a', 'b', 'a', 'b', 'c'];
            
            const result = SynthesizerStrategy.findLongestRepeatingSequence(actions);
            
            expect(result.sequence).not.toBeNull();
            expect(result.repeatCount).toBeGreaterThanOrEqual(2);
        });
        
        it('should return empty for no repeating sequence', () => {
            const actions = ['a', 'b', 'c', 'd'];
            
            const result = SynthesizerStrategy.findLongestRepeatingSequence(actions);
            
            expect(result.repeatCount).toBe(0);
        });
    });
});

// ============================================================================
// FunctionSynthesizer Tests
// ============================================================================
describe('FunctionSynthesizer', () => {
    let synthesizer: FunctionSynthesizer;
    
    beforeEach(() => {
        synthesizer = getFunctionSynthesizer();
    });
    
    it('should return singleton instance', () => {
        const instance1 = getFunctionSynthesizer();
        const instance2 = getFunctionSynthesizer();
        expect(instance1).toBe(instance2);
    });
    
    it('should handle function_logic', () => {
        expect(synthesizer.canHandle('function_logic', {})).toBe(true);
    });
    
    it('should handle procedure_logic', () => {
        expect(synthesizer.canHandle('procedure_logic', {})).toBe(true);
    });
    
    it('should not handle sequencing by default', () => {
        expect(synthesizer.canHandle('sequencing', {})).toBe(false);
    });
    
    it('should handle force_function flag', () => {
        const world = { solution_config: { force_function: true } };
        expect(synthesizer.canHandle('sequencing', world)).toBe(true);
    });
    
    it('should synthesize with procedure extraction', () => {
        const actions = [
            'moveForward', 'turnLeft',
            'moveForward', 'turnLeft',
            'moveForward', 'turnLeft'
        ];
        
        const world = {
            available_blocks: new Set(['maze_moveForward', 'maze_turn', 'PROCEDURE']),
            solution_config: { logic_type: 'function_logic' }
        };
        
        const result = synthesizer.synthesize(actions, world);
        
        expect(result).toBeDefined();
        expect(result.main).toBeDefined();
        expect(result.procedures).toBeDefined();
    });
    
    it('should fallback when PROCEDURE not available', () => {
        const actions = ['moveForward', 'moveForward'];
        
        const world = {
            available_blocks: new Set(['maze_moveForward']),
            solution_config: {}
        };
        
        const result = synthesizer.synthesize(actions, world);
        
        expect(result.procedures).toEqual({});
    });
});

// ============================================================================
// DefaultSynthesizer Tests
// ============================================================================
describe('DefaultSynthesizer', () => {
    let synthesizer: DefaultSynthesizer;
    
    beforeEach(() => {
        synthesizer = getDefaultSynthesizer();
    });
    
    it('should return singleton instance', () => {
        const instance1 = getDefaultSynthesizer();
        const instance2 = getDefaultSynthesizer();
        expect(instance1).toBe(instance2);
    });
    
    it('should always handle (fallback)', () => {
        expect(synthesizer.canHandle('anything', {})).toBe(true);
        expect(synthesizer.canHandle('unknown_type', {})).toBe(true);
    });
    
    it('should synthesize basic actions', () => {
        const actions = ['moveForward', 'turnLeft', 'moveForward'];
        
        const world = {
            available_blocks: new Set(['maze_moveForward', 'maze_turn']),
            solution_config: { logic_type: 'sequencing' }
        };
        
        const result = synthesizer.synthesize(actions, world);
        
        expect(result.main).toBeDefined();
        expect(result.main.length).toBe(3);
        expect(result.procedures).toEqual({});
    });
    
    it('should synthesize for_loop_logic with loops', () => {
        const actions = ['moveForward', 'moveForward', 'moveForward', 'moveForward'];
        
        const world = {
            available_blocks: new Set(['maze_moveForward', 'maze_repeat']),
            solution_config: { logic_type: 'for_loop_logic' }
        };
        
        const result = synthesizer.synthesize(actions, world);
        
        expect(result.main).toBeDefined();
    });
});

// ============================================================================
// SynthesizerRegistry Tests
// ============================================================================
describe('SynthesizerRegistry', () => {
    let registry: SynthesizerRegistry;
    
    beforeEach(() => {
        registry = getSynthesizerRegistry();
    });
    
    it('should return singleton instance', () => {
        const instance1 = getSynthesizerRegistry();
        const instance2 = getSynthesizerRegistry();
        expect(instance1).toBe(instance2);
    });
    
    it('should list registered synthesizers', () => {
        const list = registry.list();
        
        expect(Array.isArray(list)).toBe(true);
        expect(list.length).toBeGreaterThan(0);
        expect(list).toContain('FunctionSynthesizer');
        expect(list).toContain('DefaultSynthesizer');
    });
    
    it('should get FunctionSynthesizer for function_logic', () => {
        const world = { solution_config: { logic_type: 'function_logic' } };
        const synthesizer = registry.getSynthesizer('function_logic', world);
        
        expect(synthesizer.name).toBe('FunctionSynthesizer');
    });
    
    it('should get DefaultSynthesizer for unknown type', () => {
        const world = { solution_config: {} };
        const synthesizer = registry.getSynthesizer('unknown_type', world);
        
        expect(synthesizer.name).toBe('DefaultSynthesizer');
    });
    
    it('should synthesize actions', () => {
        const actions = ['moveForward', 'moveForward'];
        const world = {
            available_blocks: new Set(['maze_moveForward']),
            solution_config: { logic_type: 'sequencing' }
        };
        
        const result = registry.synthesize(actions, world);
        
        expect(result).toBeDefined();
        expect(result.main).toBeDefined();
        expect(result.procedures).toBeDefined();
    });
});
