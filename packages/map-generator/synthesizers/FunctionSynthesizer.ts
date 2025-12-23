/**
 * Function Synthesizer
 * 
 * Creates PROCEDURE blocks from repeating sequences.
 * Used for function_logic maps where procedures should be identified and extracted.
 * 
 * Ported from Python: synthesizers/function.py
 */

import { SynthesizerStrategy, SynthesisResult, StructuredBlock } from './BaseSynthesizer';

export class FunctionSynthesizer extends SynthesizerStrategy {
    
    private static HANDLED_LOGIC_TYPES = new Set([
        'function_logic',
        'procedure_logic',
        'function_call'
    ]);
    
    /**
     * Check if this synthesizer can handle the input.
     */
    canHandle(logicType: string, world: any): boolean {
        if (FunctionSynthesizer.HANDLED_LOGIC_TYPES.has(logicType)) {
            return true;
        }
        
        // Check force_function flag
        if (world?.solution_config?.force_function) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Create program with extracted procedures.
     */
    synthesize(actions: string[], world: any): SynthesisResult {
        const availableBlocks = world?.available_blocks ?? new Set<string>();
        const forceFunction = world?.solution_config?.force_function ?? false;
        
        // Check if procedures are available
        if (!availableBlocks.has('PROCEDURE')) {
            // Cannot create procedures, fallback
            return {
                main: SynthesizerStrategy.compressActionsToStructure(actions, availableBlocks),
                procedures: {}
            };
        }
        
        const procedures: Record<string, StructuredBlock[]> = {};
        let remainingActions = [...actions];
        
        // Try to create up to 3 procedures
        for (let i = 0; i < 3; i++) {
            // Find most frequent sequence (min_len=2 to capture shorter patterns)
            const result = SynthesizerStrategy.findMostFrequentSequence(
                remainingActions,
                2,  // min_len
                10, // max_len
                forceFunction
            );
            
            if (!result) {
                break;
            }
            
            const { sequence, frequency } = result;
            
            // Frequency threshold
            const MIN_FREQ_DEFAULT = 2;
            const MIN_FREQ_FORCED = 1;
            
            const minFreq = forceFunction ? MIN_FREQ_FORCED : MIN_FREQ_DEFAULT;
            if (frequency < minFreq) {
                break;
            }
            
            // Validate sequence length
            if (sequence.length < 2) {
                break;
            }
            
            // Create procedure name
            const procName = `PROCEDURE_${i + 1}`;
            
            // Compress sequence into procedure body
            procedures[procName] = SynthesizerStrategy.compressActionsToStructure(
                sequence,
                availableBlocks
            );
            
            // Replace occurrences with CALL
            const newActions: string[] = [];
            let j = 0;
            
            while (j < remainingActions.length) {
                // Check if sequence matches at position j
                let matches = true;
                if (j + sequence.length <= remainingActions.length) {
                    for (let k = 0; k < sequence.length; k++) {
                        if (remainingActions[j + k] !== sequence[k]) {
                            matches = false;
                            break;
                        }
                    }
                } else {
                    matches = false;
                }
                
                if (matches) {
                    newActions.push(`CALL:${procName}`);
                    j += sequence.length;
                } else {
                    newActions.push(remainingActions[j]);
                    j++;
                }
            }
            
            remainingActions = newActions;
        }
        
        return {
            main: SynthesizerStrategy.compressActionsToStructure(remainingActions, availableBlocks),
            procedures
        };
    }
}

// Singleton
let instance: FunctionSynthesizer | null = null;

export function getFunctionSynthesizer(): FunctionSynthesizer {
    if (!instance) {
        instance = new FunctionSynthesizer();
    }
    return instance;
}

export default FunctionSynthesizer;
