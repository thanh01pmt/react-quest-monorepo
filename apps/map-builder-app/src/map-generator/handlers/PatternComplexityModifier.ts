/**
 * Pattern Complexity Modifier
 * 
 * Modifies item patterns based on difficulty level WITHOUT changing item count.
 * - EASY: Patterns are obvious and immediately recognizable
 * - MEDIUM: Patterns are clear but have minor variations/exceptions
 * - HARD: Patterns exist but require discovery (hidden regularity)
 * 
 * Ported from Python: pattern_complexity_modifier.py
 */

import { Coord } from '../types';

export interface ItemPlacement {
    type: string;
    pos?: Coord;
    position?: number[];
    pattern_id?: string;
    pattern_complexity?: string;
    pattern_visibility?: string;
    spacing_regularity?: string;
    grouping?: string;
    is_exception?: boolean;
    original_type?: string;
    exception_type?: string;
    has_variation?: boolean;
    spacing_pattern?: string;
    position_in_sequence?: number;
    spacing_hint?: number;
    interleaving_index?: number;
    interleaving_type?: string;
    hidden_pattern_marker?: boolean;
    pattern_sequence?: number;
    is_potential_decoy?: boolean;
    zone?: string;
    [key: string]: any;
}

/**
 * Pattern Complexity Modifier
 * Key principle: Difficulty is increased by making patterns harder to recognize,
 * NOT by increasing item count or density.
 */
export class PatternComplexityModifier {
    private seed: number | null = null;

    /**
     * Set random seed for reproducible modifications.
     */
    setSeed(seed: number): void {
        this.seed = seed;
    }

    /**
     * Apply difficulty-based pattern modifications.
     */
    applyDifficulty(
        items: ItemPlacement[],
        difficultyCode: string,
        patternType: string = 'default'
    ): ItemPlacement[] {
        if (!items || items.length === 0) {
            return items;
        }

        const difficulty = (difficultyCode || 'MEDIUM').toUpperCase();
        
        // Deep copy to avoid mutating original
        let modifiedItems = items.map(item => ({ ...item }));
        
        switch (difficulty) {
            case 'EASY':
                modifiedItems = this.makePatternsObvious(modifiedItems, patternType);
                break;
            case 'HARD':
                modifiedItems = this.obscurePatterns(modifiedItems, patternType);
                break;
            default: // MEDIUM
                modifiedItems = this.addMinorVariations(modifiedItems, patternType);
                break;
        }
        
        // Add pattern_complexity metadata
        modifiedItems.forEach(item => {
            item.pattern_complexity = difficulty;
        });
        
        // Ensure item count is preserved
        const originalCount = items.length;
        const finalCount = modifiedItems.length;
        
        if (originalCount !== finalCount) {
            console.warn(`[PatternComplexityModifier] Item count changed: ${originalCount} → ${finalCount}`);
            if (finalCount > originalCount) {
                modifiedItems = modifiedItems.slice(0, originalCount);
            } else {
                while (modifiedItems.length < originalCount) {
                    modifiedItems.push({ ...modifiedItems[modifiedItems.length - 1] });
                }
            }
        }
        
        console.log(`[PatternComplexityModifier] Applied ${difficulty} difficulty to ${modifiedItems.length} items`);
        return modifiedItems;
    }

    /**
     * EASY: Make patterns immediately recognizable.
     */
    private makePatternsObvious(items: ItemPlacement[], patternType: string): ItemPlacement[] {
        if (items.length < 2) return items;
        
        // Strategy 1: Ensure identical patterns per zone/branch
        const zones = this.groupByZone(items);
        
        if (Object.keys(zones).length > 1) {
            const referenceZone = Object.values(zones)[0];
            const referencePattern = this.extractPattern(referenceZone);
            
            for (const zoneItems of Object.values(zones)) {
                this.applyPattern(zoneItems, referencePattern);
            }
        }
        
        // Strategy 2: Regularize spacing
        items = this.regularizeSpacing(items);
        
        // Strategy 3: Group item types
        items = this.groupItemTypes(items);
        
        // Mark as obvious
        items.forEach(item => {
            item.pattern_visibility = 'obvious';
        });
        
        return items;
    }

    /**
     * MEDIUM: Add minor variations while keeping pattern clear.
     */
    private addMinorVariations(items: ItemPlacement[], patternType: string): ItemPlacement[] {
        if (items.length < 3) return items;
        
        // Strategy 1: Add one exception item
        items = this.addPatternException(items);
        
        // Strategy 2: Vary one zone slightly
        const zones = this.groupByZone(items);
        const zoneNames = Object.keys(zones);
        
        if (zoneNames.length > 2) {
            const variedZone = zoneNames.length > 2 
                ? zoneNames[Math.floor(zoneNames.length / 2)]
                : zoneNames[zoneNames.length - 1];
            
            const zoneItems = zones[variedZone];
            if (zoneItems && zoneItems.length > 0) {
                this.introduceVariation(zoneItems);
            }
        }
        
        // Mark as clear with variation
        items.forEach(item => {
            item.pattern_visibility = 'clear_with_variation';
        });
        
        return items;
    }

    /**
     * HARD: Make patterns discoverable but not obvious.
     */
    private obscurePatterns(items: ItemPlacement[], patternType: string): ItemPlacement[] {
        if (items.length < 4) return items;
        
        // Strategy 1: Apply progressive spacing
        items = this.applyProgressiveSpacing(items);
        
        // Strategy 2: Interleave item types
        items = this.interleaveTypes(items);
        
        // Strategy 3: Add hidden regularity markers
        items = this.addHiddenRegularity(items);
        
        // Strategy 4: Mark decoys
        items = this.markDecoys(items);
        
        // Mark as hidden
        items.forEach(item => {
            item.pattern_visibility = 'hidden_regularity';
        });
        
        return items;
    }

    // =========================================================================
    // HELPER METHODS
    // =========================================================================

    private groupByZone(items: ItemPlacement[]): Record<string, ItemPlacement[]> {
        const zones: Record<string, ItemPlacement[]> = {};
        
        for (const item of items) {
            const zone = item.zone || 
                        (item.pattern_id ? item.pattern_id.split('_')[0] : 'default');
            
            if (!zones[zone]) {
                zones[zone] = [];
            }
            zones[zone].push(item);
        }
        
        return zones;
    }

    private extractPattern(items: ItemPlacement[]): { index: number; type: string; relativePos: number }[] {
        return items.map((item, i) => ({
            index: i,
            type: item.type || 'crystal',
            relativePos: i
        }));
    }

    private applyPattern(
        items: ItemPlacement[], 
        pattern: { index: number; type: string; relativePos: number }[]
    ): void {
        for (let i = 0; i < items.length && i < pattern.length; i++) {
            items[i].type = pattern[i].type;
        }
    }

    private regularizeSpacing(items: ItemPlacement[]): ItemPlacement[] {
        items.forEach(item => {
            item.spacing_regularity = 'perfect';
        });
        return items;
    }

    private groupItemTypes(items: ItemPlacement[]): ItemPlacement[] {
        items.forEach(item => {
            item.grouping = 'type_grouped';
        });
        return items;
    }

    private addPatternException(items: ItemPlacement[]): ItemPlacement[] {
        if (items.length < 3) return items;
        
        const exceptionIdx = Math.floor(items.length / 2);
        const exceptionItem = items[exceptionIdx];
        
        exceptionItem.is_exception = true;
        
        const types = ['crystal', 'switch'];
        const currentType = exceptionItem.type || 'crystal';
        
        if (types.includes(currentType)) {
            const otherType = types.find(t => t !== currentType) || 'crystal';
            exceptionItem.original_type = currentType;
            exceptionItem.exception_type = otherType;
        }
        
        return items;
    }

    private introduceVariation(items: ItemPlacement[]): void {
        items.forEach(item => {
            item.has_variation = true;
        });
    }

    private applyProgressiveSpacing(items: ItemPlacement[]): ItemPlacement[] {
        const fibonacci = [1, 1, 2, 3, 5, 8, 13];
        
        items.forEach((item, i) => {
            item.spacing_pattern = 'progressive';
            item.position_in_sequence = i;
            
            if (i < fibonacci.length) {
                item.spacing_hint = fibonacci[i];
            }
        });
        
        return items;
    }

    private interleaveTypes(items: ItemPlacement[]): ItemPlacement[] {
        items.forEach((item, i) => {
            item.interleaving_index = i;
            item.interleaving_type = i % 2 === 0 ? 'type_a' : 'type_b';
        });
        
        return items;
    }

    private addHiddenRegularity(items: ItemPlacement[]): ItemPlacement[] {
        const n = Math.max(2, Math.floor(items.length / 3));
        
        items.forEach((item, i) => {
            if (i % n === 0) {
                item.hidden_pattern_marker = true;
                item.pattern_sequence = Math.floor(i / n);
            }
        });
        
        return items;
    }

    private markDecoys(items: ItemPlacement[]): ItemPlacement[] {
        if (items.length < 5) return items;
        
        const numDecoys = Math.max(1, Math.floor(items.length / 5));
        const indices = this.randomSample(items.length, numDecoys);
        
        indices.forEach(i => {
            items[i].is_potential_decoy = true;
        });
        
        return items;
    }

    private randomSample(max: number, count: number): number[] {
        const indices: number[] = [];
        const available = Array.from({ length: max }, (_, i) => i);
        
        for (let i = 0; i < count && available.length > 0; i++) {
            const randomIdx = Math.floor(Math.random() * available.length);
            indices.push(available[randomIdx]);
            available.splice(randomIdx, 1);
        }
        
        return indices;
    }

    // =========================================================================
    // VALIDATION
    // =========================================================================

    /**
     * Verify that modification preserved item count.
     */
    validateItemCountPreserved(original: ItemPlacement[], modified: ItemPlacement[]): boolean {
        return original.length === modified.length;
    }

    /**
     * Get summary statistics of pattern modifications.
     */
    getModificationSummary(items: ItemPlacement[]): Record<string, any> {
        const summary: Record<string, any> = {
            total_items: items.length,
            difficulty_levels: {},
            visibility_types: {},
            exceptions: 0,
            decoys: 0
        };
        
        for (const item of items) {
            // Count by difficulty
            const diff = item.pattern_complexity || 'unknown';
            summary.difficulty_levels[diff] = (summary.difficulty_levels[diff] || 0) + 1;
            
            // Count by visibility
            const vis = item.pattern_visibility || 'unknown';
            summary.visibility_types[vis] = (summary.visibility_types[vis] || 0) + 1;
            
            // Count exceptions and decoys
            if (item.is_exception) summary.exceptions++;
            if (item.is_potential_decoy) summary.decoys++;
        }
        
        return summary;
    }
}

// Singleton instance
let modifierInstance: PatternComplexityModifier | null = null;

export function getPatternComplexityModifier(): PatternComplexityModifier {
    if (!modifierInstance) {
        modifierInstance = new PatternComplexityModifier();
    }
    return modifierInstance;
}

/**
 * Convenience function to apply difficulty modification.
 */
export function applyDifficultyToItems(
    items: ItemPlacement[],
    difficultyCode: string
): ItemPlacement[] {
    const modifier = new PatternComplexityModifier();
    return modifier.applyDifficulty(items, difficultyCode);
}
