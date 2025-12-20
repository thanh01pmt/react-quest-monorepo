/**
 * Pattern Recognition Strategy
 * 
 * Teaching Goal: Identify and replicate repeating patterns
 * Pattern: Identical sequences across multiple segments
 * Best for: Zigzag, S-shape, any topology with repeating segments
 */

import { IPathInfo, Coord } from '../types';
import { BaseStrategy } from './BaseStrategy';
import { StrategyContext, StrategyResult, DensityMode, PedagogyStrategy } from './types';

export class PatternRecognitionStrategy extends BaseStrategy {
    constructor() {
        super(
            'Pattern Recognition',
            'Teach pattern identification by creating identical sequences across segments'
        );
    }

    getDefaultDensityMode(): DensityMode {
        return DensityMode.UNIFORM;
    }

    isCompatible(topologyType: string): boolean {
        const compatibleTypes = [
            'zigzag', 's_shape', 'z_shape', 
            'simple_path', 'spiral', 'square'
        ];
        return compatibleTypes.includes(topologyType);
    }

    apply(pathInfo: IPathInfo, context: StrategyContext): StrategyResult {
        console.log('[PatternRecognitionStrategy] Applying...');
        
        const objects = [...(context as any).existingObjects || []];
        let itemsPlaced = 0;
        const validationNotes: string[] = [];

        // Get segments
        let segments: Coord[][] = pathInfo.metadata?.segments;
        if (!segments) {
            segments = this.computeSegments(pathInfo.path_coords);
        }

        if (segments.length < 2) {
            validationNotes.push('Warning: Need multiple segments for pattern recognition');
            return this.createResult(objects, 0, 0, validationNotes);
        }

        // Find segments of similar length to apply identical pattern
        const segmentGroups = this.groupByLength(segments);
        
        const gemAsset = this.getAsset(context.assetMap, 'gem');
        const crystalAsset = this.getAsset(context.assetMap, 'crystal');
        if (!gemAsset) {
            validationNotes.push('Error: Could not find gem asset');
            return this.createResult(objects, 0, 0, validationNotes);
        }

        let groupsProcessed = 0;

        // For each group of similar-length segments, create an identical pattern
        Object.entries(segmentGroups).forEach(([lenStr, segs]) => {
            const len = parseInt(lenStr);
            if (segs.length >= 2 && len >= 2) {
                groupsProcessed++;
                
                // Generate a fixed pattern for this length
                const pattern = this.generatePattern(len, context.difficulty);
                validationNotes.push(`Pattern for length ${len}: positions [${pattern.join(',')}] applied to ${segs.length} segments`);

                // Apply IDENTICAL pattern to all segments in this group
                segs.forEach((segment, segIdx) => {
                    const asset = segIdx % 2 === 0 ? gemAsset : (crystalAsset || gemAsset);
                    pattern.forEach(idx => {
                        if (idx < segment.length) {
                            const pos = segment[idx];
                            if (!this.isOccupied(objects, pos)) {
                                objects.push(this.createObject(pos, asset));
                                itemsPlaced++;
                            }
                        }
                    });
                });
            }
        });

        if (groupsProcessed === 0) {
            validationNotes.push('No matching segment groups found, falling back to regular placement');
            // Fallback: place on every segment uniformly
            segments.forEach(segment => {
                for (let i = 0; i < segment.length; i += 2) {
                    if (!this.isOccupied(objects, segment[i])) {
                        objects.push(this.createObject(segment[i], gemAsset));
                        itemsPlaced++;
                    }
                }
            });
        }

        console.log(`[PatternRecognitionStrategy] Placed ${itemsPlaced} items across ${groupsProcessed} pattern groups`);
        return this.createResult(objects, itemsPlaced, groupsProcessed, validationNotes);
    }

    private groupByLength(segments: Coord[][]): Record<number, Coord[][]> {
        const groups: Record<number, Coord[][]> = {};
        segments.forEach(seg => {
            const len = seg.length;
            if (!groups[len]) groups[len] = [];
            groups[len].push(seg);
        });
        return groups;
    }

    private generatePattern(length: number, difficulty: 'intro' | 'simple' | 'complex'): number[] {
        const pattern: number[] = [];
        
        // Create a deterministic pattern based on length
        // This ensures same-length segments get IDENTICAL patterns
        const step = difficulty === 'intro' ? 1 : 2;
        const start = difficulty === 'complex' ? 1 : 0;
        
        for (let i = start; i < length; i += step) {
            pattern.push(i);
        }
        
        // Ensure at least one item
        if (pattern.length === 0 && length > 0) {
            pattern.push(Math.floor(length / 2));
        }
        
        return pattern;
    }

    private computeSegments(pathCoords: Coord[]): Coord[][] {
        if (!pathCoords || pathCoords.length === 0) return [];
        
        const segments: Coord[][] = [];
        let currentSegment = [pathCoords[0]];
        
        if (pathCoords.length > 1) {
            let lastDiff = [
                pathCoords[1][0] - pathCoords[0][0],
                pathCoords[1][2] - pathCoords[0][2]
            ];
            
            for (let i = 1; i < pathCoords.length; i++) {
                const curr = pathCoords[i];
                const prev = pathCoords[i-1];
                const currDiff = [curr[0] - prev[0], curr[2] - prev[2]];

                if (currDiff[0] === lastDiff[0] && currDiff[1] === lastDiff[1]) {
                    currentSegment.push(curr);
                } else {
                    segments.push(currentSegment);
                    currentSegment = [prev, curr];
                    lastDiff = currDiff;
                }
            }
            segments.push(currentSegment);
        }
        
        return segments;
    }

    private createResult(objects: any[], itemsPlaced: number, groupsProcessed: number, notes: string[]): StrategyResult {
        return {
            objects,
            metadata: {
                strategy_applied: PedagogyStrategy.PATTERN_RECOGNITION,
                items_placed: itemsPlaced,
                segments_processed: groupsProcessed,
                validation_notes: notes
            }
        };
    }
}
