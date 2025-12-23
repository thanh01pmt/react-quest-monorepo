/**
 * Default Synthesizer
 * 
 * Fallback synthesizer for cases that don't match specialized synthesizers.
 * Performs basic loop compression.
 * 
 * Ported from Python: synthesizers/default.py
 */

import { SynthesizerStrategy, SynthesisResult, StructuredBlock } from './BaseSynthesizer';

export class DefaultSynthesizer extends SynthesizerStrategy {
    
    /**
     * DefaultSynthesizer can always handle - it's the fallback.
     */
    canHandle(_logicType: string, _world: any): boolean {
        return true;
    }
    
    /**
     * Perform basic loop compression.
     */
    synthesize(actions: string[], world: any): SynthesisResult {
        const availableBlocks = world?.available_blocks ?? new Set<string>();
        const logicType = world?.solution_config?.logic_type ?? 'sequencing';
        
        // Special handling for for_loop_logic
        if (logicType === 'for_loop_logic' || logicType === 'repeat_loop') {
            return this.synthesizeForLoop(actions, availableBlocks);
        }
        
        // Default: basic compression
        return {
            main: SynthesizerStrategy.compressActionsToStructure(actions, availableBlocks),
            procedures: {}
        };
    }
    
    /**
     * Find and create for loop structure from repeating pattern.
     */
    private synthesizeForLoop(actions: string[], availableBlocks: Set<string>): SynthesisResult {
        // Check if maze_repeat is available
        if (!availableBlocks.has('maze_repeat')) {
            console.warn('[DefaultSynthesizer] maze_repeat not in available_blocks, returning sequential');
            return {
                main: SynthesizerStrategy.compressActionsToStructure(actions, availableBlocks),
                procedures: {}
            };
        }
        
        // Find repeating pattern
        const { sequence, repeatCount, length: seqLen, startIndex } = 
            SynthesizerStrategy.findLongestRepeatingSequence(actions);
        
        if (sequence && repeatCount >= 2) {
            const beforeLoop = actions.slice(0, startIndex);
            const loopBody = sequence;
            const afterLoop = actions.slice(startIndex + repeatCount * seqLen);
            
            const mainProgram: StructuredBlock[] = [];
            
            if (beforeLoop.length > 0) {
                mainProgram.push(
                    ...SynthesizerStrategy.compressActionsToStructure(beforeLoop, availableBlocks)
                );
            }
            
            mainProgram.push({
                type: 'maze_repeat',
                times: repeatCount,
                body: SynthesizerStrategy.compressActionsToStructure(loopBody, availableBlocks)
            });
            
            if (afterLoop.length > 0) {
                mainProgram.push(
                    ...SynthesizerStrategy.compressActionsToStructure(afterLoop, availableBlocks)
                );
            }
            
            return { main: mainProgram, procedures: {} };
        }
        
        // No clear pattern, just compress
        return {
            main: SynthesizerStrategy.compressActionsToStructure(actions, availableBlocks),
            procedures: {}
        };
    }
}

// Singleton
let instance: DefaultSynthesizer | null = null;

export function getDefaultSynthesizer(): DefaultSynthesizer {
    if (!instance) {
        instance = new DefaultSynthesizer();
    }
    return instance;
}

export default DefaultSynthesizer;
