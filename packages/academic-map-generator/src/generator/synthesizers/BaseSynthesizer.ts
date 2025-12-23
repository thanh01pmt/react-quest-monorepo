/**
 * Base Synthesizer Strategy
 * 
 * Abstract base class for all synthesizers.
 * Provides shared utility functions for action compression and pattern detection.
 * 
 * Ported from Python: synthesizers/base.py
 */

export interface StructuredBlock {
    type: string;
    times?: number;
    body?: StructuredBlock[];
    name?: string;
    direction?: string;
}

export interface SynthesisResult {
    main: StructuredBlock[];
    procedures: Record<string, StructuredBlock[]>;
}

/**
 * Abstract base class for all synthesizer strategies.
 */
export abstract class SynthesizerStrategy {
    
    /**
     * Check if this synthesizer can handle the given input.
     */
    abstract canHandle(logicType: string, world: any): boolean;
    
    /**
     * Synthesize raw actions into structured program.
     */
    abstract synthesize(actions: string[], world: any): SynthesisResult;
    
    /**
     * Name of synthesizer for logging.
     */
    get name(): string {
        return this.constructor.name;
    }
    
    // =========================================================================
    // SHARED UTILITY FUNCTIONS
    // =========================================================================
    
    /**
     * Compress actions to structure with loops.
     * Recursive function to find repeating patterns.
     */
    static compressActionsToStructure(
        actions: string[], 
        availableBlocks: Set<string>
    ): StructuredBlock[] {
        if (!actions || actions.length === 0) {
            return [];
        }
        
        const structuredCode: StructuredBlock[] = [];
        let i = 0;
        const canUseRepeat = availableBlocks.has('maze_repeat');
        
        while (i < actions.length) {
            let bestSeqLen = 0;
            let bestRepeats = 0;
            
            if (canUseRepeat) {
                // Find longest repeating sequence starting at i
                for (let seqLen = 1; seqLen <= Math.floor(actions.length / 2); seqLen++) {
                    if (i + 2 * seqLen > actions.length) break;
                    
                    let repeats = 1;
                    while (
                        i + (repeats + 1) * seqLen <= actions.length &&
                        this.arraysEqual(
                            actions.slice(i, i + seqLen),
                            actions.slice(i + repeats * seqLen, i + (repeats + 1) * seqLen)
                        )
                    ) {
                        repeats++;
                    }
                    
                    // Check if this is a good pattern
                    if (repeats > 1 && 
                        (repeats * seqLen) > (1 + seqLen) && 
                        seqLen >= bestSeqLen) {
                        bestSeqLen = seqLen;
                        bestRepeats = repeats;
                    }
                }
            }
            
            if (bestRepeats > 0) {
                structuredCode.push({
                    type: 'maze_repeat',
                    times: bestRepeats,
                    body: SynthesizerStrategy.compressActionsToStructure(
                        actions.slice(i, i + bestSeqLen),
                        availableBlocks
                    )
                });
                i += bestRepeats * bestSeqLen;
            } else {
                const actionStr = actions[i];
                
                if (actionStr.startsWith('CALL:')) {
                    structuredCode.push({
                        type: 'CALL',
                        name: actionStr.split(':')[1]
                    });
                } else if (actionStr === 'turnLeft' || actionStr === 'turnRight') {
                    structuredCode.push({
                        type: 'maze_turn',
                        direction: actionStr
                    });
                } else {
                    structuredCode.push({
                        type: `maze_${actionStr}`
                    });
                }
                i++;
            }
        }
        
        return structuredCode;
    }
    
    /**
     * Find most frequent sequence to suggest creating a Procedure.
     */
    static findMostFrequentSequence(
        actions: string[],
        minLen: number = 2,
        maxLen: number = 10,
        forceFunction: boolean = false
    ): { sequence: string[]; frequency: number } | null {
        const sequenceCounts = new Map<string, { seq: string[]; count: number }>();
        
        for (let length = minLen; length <= maxLen; length++) {
            for (let i = 0; i <= actions.length - length; i++) {
                const sequence = actions.slice(i, i + length);
                const key = sequence.join('|');
                
                const existing = sequenceCounts.get(key);
                if (existing) {
                    existing.count++;
                } else {
                    sequenceCounts.set(key, { seq: sequence, count: 1 });
                }
            }
        }
        
        // Find best sequence
        let bestSequence: string[] | null = null;
        let maxFreq = 1;
        let bestSavings = -3; // Accept freq=2 patterns for educational purposes
        
        for (const { seq, count } of sequenceCounts.values()) {
            if (count > 1) {
                const savings = forceFunction 
                    ? count 
                    : (count - 1) * seq.length - (seq.length + count);
                    
                if (savings >= bestSavings) {
                    bestSavings = savings;
                    bestSequence = seq;
                    maxFreq = count;
                }
            }
        }
        
        if (forceFunction && bestSequence) {
            // Prefer sequences with 'jump' for function logic
            for (const { seq, count } of sequenceCounts.values()) {
                if (count > 1 && seq.some(a => a.includes('jump'))) {
                    return { sequence: seq, frequency: count };
                }
            }
        }
        
        return bestSequence ? { sequence: bestSequence, frequency: maxFreq } : null;
    }
    
    /**
     * Find longest repeating consecutive sequence.
     */
    static findLongestRepeatingSequence(
        actions: string[]
    ): { sequence: string[] | null; repeatCount: number; length: number; startIndex: number } {
        let bestSeq: string[] | null = null;
        let bestRepeats = 0;
        let bestLen = 0;
        let bestStart = 0;
        
        for (let start = 0; start < actions.length; start++) {
            for (let length = 1; length <= Math.floor((actions.length - start) / 2); length++) {
                const pattern = actions.slice(start, start + length);
                let count = 1;
                let pos = start + length;
                
                while (pos + length <= actions.length) {
                    if (this.arraysEqual(actions.slice(pos, pos + length), pattern)) {
                        count++;
                        pos += length;
                    } else {
                        break;
                    }
                }
                
                if (count > 1 && count * length > bestRepeats * bestLen) {
                    bestSeq = pattern;
                    bestRepeats = count;
                    bestLen = length;
                    bestStart = start;
                }
            }
        }
        
        return {
            sequence: bestSeq,
            repeatCount: bestRepeats,
            length: bestLen,
            startIndex: bestStart
        };
    }
    
    /**
     * Helper to compare arrays.
     */
    private static arraysEqual(a: string[], b: string[]): boolean {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }
}

export default SynthesizerStrategy;
