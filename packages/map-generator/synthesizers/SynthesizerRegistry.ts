/**
 * Synthesizer Registry
 * 
 * Manages all available synthesizers and selects the appropriate one
 * based on logic type and world configuration.
 */

import { SynthesizerStrategy, SynthesisResult } from './BaseSynthesizer';
import { FunctionSynthesizer, getFunctionSynthesizer } from './FunctionSynthesizer';
import { DefaultSynthesizer, getDefaultSynthesizer } from './DefaultSynthesizer';

export class SynthesizerRegistry {
    private synthesizers: SynthesizerStrategy[] = [];
    private defaultSynthesizer: SynthesizerStrategy;
    
    constructor() {
        // Register synthesizers in priority order
        this.synthesizers = [
            getFunctionSynthesizer(),
            // Add more specialized synthesizers here as they are ported
        ];
        
        // Default fallback
        this.defaultSynthesizer = getDefaultSynthesizer();
    }
    
    /**
     * Find appropriate synthesizer for given logic type.
     */
    getSynthesizer(logicType: string, world: any): SynthesizerStrategy {
        for (const synthesizer of this.synthesizers) {
            if (synthesizer.canHandle(logicType, world)) {
                console.log(`[SynthesizerRegistry] Selected: ${synthesizer.name}`);
                return synthesizer;
            }
        }
        
        console.log(`[SynthesizerRegistry] Using default synthesizer`);
        return this.defaultSynthesizer;
    }
    
    /**
     * Synthesize actions into structured program.
     */
    synthesize(actions: string[], world: any): SynthesisResult {
        const logicType = world?.solution_config?.logic_type ?? 'sequencing';
        const synthesizer = this.getSynthesizer(logicType, world);
        return synthesizer.synthesize(actions, world);
    }
    
    /**
     * Register a new synthesizer.
     */
    register(synthesizer: SynthesizerStrategy): void {
        this.synthesizers.push(synthesizer);
    }
    
    /**
     * List all registered synthesizers.
     */
    list(): string[] {
        return [
            ...this.synthesizers.map(s => s.name),
            this.defaultSynthesizer.name
        ];
    }
}

// Singleton
let registryInstance: SynthesizerRegistry | null = null;

export function getSynthesizerRegistry(): SynthesizerRegistry {
    if (!registryInstance) {
        registryInstance = new SynthesizerRegistry();
    }
    return registryInstance;
}

export default SynthesizerRegistry;
