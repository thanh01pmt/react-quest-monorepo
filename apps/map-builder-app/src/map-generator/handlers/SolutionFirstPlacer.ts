/**
 * Solution-First Placer
 * 
 * Main placer class that uses topology metadata (segments, corners, segment_analysis)
 * to place items according to predefined patterns for predictable PROCEDURE generation.
 * 
 * Key Insight: Topology metadata is the GROUND TRUTH - it contains the exact segments
 * that were generated, not guessed from blocks.
 * 
 * Ported from Python: solution_first_placer.py
 */

import { IPathInfo, Coord } from '../types';
import { PlacedObject, BuildableAsset } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { 
    getPedagogicalStrategyHandler, 
    LayoutResult,
    PedagogicalItemPlacement
} from './index';
import { getSemanticPositionHandler } from './SemanticPositionHandler';
import { PatternLibrary, getPatternLibrary } from './PatternLibrary';
import { PlacementCalculator, getPlacementCalculator } from './PlacementCalculator';
import { SymmetricPlacer, getSymmetricPlacer } from './SymmetricPlacer';
import { FallbackHandler, getFallbackHandler } from './FallbackHandler';

// Configuration flags
const SKIP_SOLVER = false;
const GENERATE_EXPECTED_SOLUTION = true;

export interface PlacementResult {
    items: PedagogicalItemPlacement[];
    collectibles: PlacedObject[];
    interactibles: PlacedObject[];
    metadata?: Record<string, any>;
    expected_solution?: Record<string, any>;
}

/**
 * Pattern match result
 */
interface PatternMatch {
    segmentIdx: number;
    pattern: {
        id: string;
        length: number;
        item_types: string[];
    };
}

/**
 * Solution-First Placer
 * Places items using Solution-First approach:
 * 1. Analyze topology segments from metadata
 * 2. Match patterns to segments
 * 3. Calculate item positions
 * 4. Verify placements
 */
export class SolutionFirstPlacer {
    private patternLibrary: PatternLibrary;
    private calculator: PlacementCalculator;
    private symmetricPlacer: SymmetricPlacer;
    private fallbackHandler: FallbackHandler;

    constructor() {
        this.patternLibrary = getPatternLibrary();
        this.calculator = getPlacementCalculator();
        this.symmetricPlacer = getSymmetricPlacer();
        this.fallbackHandler = getFallbackHandler();
    }

    /**
     * Main entry point for Solution-First placement.
     */
    placeItems(
        pathInfo: IPathInfo,
        params: Record<string, any>,
        assetMap: Map<string, BuildableAsset>,
        gridSize?: [number, number, number]
    ): PlacementResult {
        const logicType = params.logic_type || 'function_logic';
        const metadata = pathInfo.metadata || {};
        let segments = metadata.segments || [];

        // Handle singular 'segment' from linear topologies
        if (!segments.length && metadata.segment) {
            console.log("[SolutionFirstPlacer] Converting singular 'segment' to 'segments' list");
            segments = [metadata.segment];
            metadata.segments = segments;
            metadata.segment_analysis = {
                num_segments: 1,
                lengths: [metadata.segment.length],
                types: ['linear'],
                min_length: metadata.segment.length,
                max_length: metadata.segment.length,
                avg_length: metadata.segment.length
            };
        }

        const segmentAnalysis = metadata.segment_analysis || {};
        const corners = metadata.corners || [];
        const topologyType = metadata.topology_type || '';

        // =========================================================
        // PEDAGOGICAL STRATEGY PLACEMENT (Highest Priority)
        // =========================================================
        const pedagogicalHandler = getPedagogicalStrategyHandler();
        const semanticHandler = getSemanticPositionHandler();

        if (metadata.pedagogical_strategy || topologyType) {
            const result = pedagogicalHandler.applyStrategy(
                pathInfo,
                params,
                (pInfo, items, logicT) => this.buildLayout(pInfo, items, logicT, assetMap)
            );

            if (result) {
                // Apply semantic positions to enhance placement
                const enhancedItems = semanticHandler.applySemanticPlacements(
                    pathInfo,
                    result.items,
                    params
                );
                result.items = enhancedItems;
                
                console.log(`[SolutionFirstPlacer] Using pedagogical strategy for '${topologyType}'`);
                return result as PlacementResult;
            }
        }

        // =========================================================
        // SYMMETRIC PLACEMENT STRATEGIES (Secondary)
        // =========================================================

        // Strategy 1: Hub-Spoke (plus_shape, star_shape)
        if (this.symmetricPlacer.isHubSpoke(metadata)) {
            const result = this.symmetricPlacer.symmetricHubSpokePlacement(
                pathInfo,
                params,
                (pInfo, items, logicT) => this.buildLayout(pInfo, items, logicT, assetMap)
            );
            if (result) {
                console.log("[SolutionFirstPlacer] Using Hub-Spoke symmetric placement");
                return result;
            }
        }

        // Strategy 2: Island Array (symmetrical_islands)
        if (this.symmetricPlacer.isIslandArray(metadata)) {
            const result = this.symmetricPlacer.symmetricIslandPlacement(
                pathInfo,
                params,
                (pInfo, items, logicT) => this.buildLayout(pInfo, items, logicT, assetMap)
            );
            if (result) {
                console.log("[SolutionFirstPlacer] Using Island-Replication symmetric placement");
                return result;
            }
        }

        // =========================================================
        // STANDARD SEGMENT-BASED PLACEMENT
        // =========================================================

        // Fallback if no segment metadata
        if (!segments.length && !segmentAnalysis.num_segments) {
            console.warn("[SolutionFirstPlacer] No segment metadata found. Using fallback.");
            return this.fallbackHandler.fallbackPlacement(
                pathInfo,
                params,
                (pInfo, items, logicT) => this.buildLayout(pInfo, items, logicT, assetMap)
            );
        }

        // If segments not explicit but segment_analysis exists, reconstruct
        if (!segments.length && segmentAnalysis.lengths) {
            segments = this.reconstructSegments(pathInfo.path_coords, segmentAnalysis);
        }

        // Linear Merge for fragmented topologies
        if (segments.length) {
            const avgLen = segments.reduce((sum: number, s: Coord[]) => sum + s.length, 0) / segments.length;
            if (avgLen < 4.0) {
                console.log(`[SolutionFirstPlacer] Topology fragmented (avg=${avgLen.toFixed(1)}). Merging.`);
                const mergedCoords: Coord[] = [];
                for (const seg of segments) {
                    if (!seg) continue;
                    if (mergedCoords.length && this.coordsEqual(seg[0], mergedCoords[mergedCoords.length - 1])) {
                        mergedCoords.push(...seg.slice(1));
                    } else {
                        mergedCoords.push(...seg);
                    }
                }
                segments = [mergedCoords];
            }
        }

        // Determine Max Density Constraint
        const numBlocks = pathInfo.path_coords.length;
        let maxPatternDensity = 1.0;
        if (numBlocks > 30) {
            maxPatternDensity = 0.30;
            console.log(`[SolutionFirstPlacer] Large map (${numBlocks} blocks). Max density: ${(maxPatternDensity*100).toFixed(0)}%`);
        }

        // Match patterns to segments
        const patternMatches = this.matchPatternsToSegments(
            segments,
            segmentAnalysis,
            corners,
            logicType,
            maxPatternDensity
        );

        // Calculate placements
        let placements = this.calculator.calculateForAllSegments(segments, patternMatches);

        // Filter out invalid placements
        placements = this.calculator.filterInvalidPlacements(
            placements,
            pathInfo.start_pos,
            pathInfo.target_pos,
            pathInfo.path_coords
        );

        // Verify placements
        const { success, errors } = this.calculator.verifyPlacements(
            placements,
            pathInfo.path_coords,
            pathInfo.start_pos,
            pathInfo.target_pos
        );

        if (!success) {
            console.warn(`[SolutionFirstPlacer] Verification failed: ${errors.join(', ')}`);
            return this.fallbackHandler.fallbackPlacement(
                pathInfo,
                params,
                (pInfo, items, logicT) => this.buildLayout(pInfo, items, logicT, assetMap)
            );
        }

        // Convert to item dicts
        const items = this.calculator.toItemDicts(placements);

        // Build final layout
        return this.buildLayout(pathInfo, items, logicType, assetMap);
    }

    /**
     * Match patterns to each segment.
     */
    private matchPatternsToSegments(
        segments: Coord[][],
        segmentAnalysis: Record<string, any>,
        corners: Coord[],
        logicType: string,
        maxDensity: number = 1.0
    ): PatternMatch[] {
        const matches: PatternMatch[] = [];
        const patterns = this.patternLibrary.getPatterns(logicType);
        const segmentLengths = segmentAnalysis.lengths || [];

        for (let segIdx = 0; segIdx < segments.length; segIdx++) {
            const segLength = segIdx < segmentLengths.length 
                ? segmentLengths[segIdx] 
                : segments[segIdx].length;
            const hasCornerAfter = segIdx < corners.length;

            // Filter valid patterns
            let valid = this.patternLibrary.filterBySegmentLength(patterns, segLength);
            valid = this.patternLibrary.filterByCorner(valid, hasCornerAfter);

            // Filter by density
            if (maxDensity < 1.0) {
                valid = valid.filter(p => (p.item_types.length / p.length) <= maxDensity);
            }

            // Select best
            const best = this.patternLibrary.selectBestPattern(valid, segLength);

            if (best) {
                matches.push({
                    segmentIdx: segIdx,
                    pattern: best
                });
            }
        }

        return matches;
    }

    /**
     * Reconstruct segment coordinate lists from path_coords and segment_analysis.
     */
    private reconstructSegments(
        pathCoords: Coord[],
        segmentAnalysis: Record<string, any>
    ): Coord[][] {
        const segments: Coord[][] = [];
        const lengths = segmentAnalysis.lengths || [];

        let currentIdx = 0;
        for (const segLen of lengths) {
            const endIdx = currentIdx + segLen;
            if (endIdx <= pathCoords.length) {
                segments.push(pathCoords.slice(currentIdx, endIdx));
            }
            currentIdx = endIdx;
        }

        return segments;
    }

    /**
     * Build final layout dict from path_info and items.
     */
    private buildLayout(
        pathInfo: IPathInfo,
        items: PedagogicalItemPlacement[],
        logicType: string,
        assetMap: Map<string, BuildableAsset>
    ): PlacementResult {
        const collectibles: PlacedObject[] = [];
        const interactibles: PlacedObject[] = [];

        for (const item of items) {
            const pos = item.pos || item.position;
            if (!pos) continue;

            const asset = this.findAsset(item.type, assetMap);
            if (!asset) {
                console.warn(`[SolutionFirstPlacer] Asset not found for type: ${item.type}`);
                continue;
            }

            const placedObj: PlacedObject = {
                id: uuidv4(),
                asset,
                position: Array.isArray(pos) ? pos : [pos[0], pos[1], pos[2]],
                rotation: [0, 0, 0],
                scale: [1, 1, 1]
            };

            // Categorize
            if (asset.type === 'collectible') {
                collectibles.push(placedObj);
            } else if (asset.type === 'interactible') {
                interactibles.push(placedObj);
            }
        }

        const result: PlacementResult = {
            items,
            collectibles,
            interactibles,
            metadata: {
                logic_type: logicType,
                placement_count: items.length,
                collectible_count: collectibles.length,
                interactible_count: interactibles.length
            }
        };

        // Generate expected solution if enabled
        if (GENERATE_EXPECTED_SOLUTION) {
            result.expected_solution = this.generateExpectedSolution(pathInfo, items, logicType);
        }

        return result;
    }

    /**
     * Find asset in asset map by type.
     */
    private findAsset(itemType: string, assetMap: Map<string, BuildableAsset>): BuildableAsset | null {
        // Try direct lookup
        if (assetMap.has(itemType)) {
            return assetMap.get(itemType)!;
        }

        // Case-insensitive search
        const lowerType = itemType.toLowerCase();
        for (const [key, asset] of assetMap) {
            if (key.toLowerCase() === lowerType) {
                return asset;
            }
        }

        // Search by key pattern
        for (const [key, asset] of assetMap) {
            if (key.toLowerCase().includes(lowerType)) {
                return asset;
            }
        }

        return null;
    }

    /**
     * Generate expected solution based on placed items.
     */
    private generateExpectedSolution(
        pathInfo: IPathInfo,
        items: PedagogicalItemPlacement[],
        logicType: string
    ): Record<string, any> {
        // Simplified expected solution generation
        // In real implementation, this would use A* solver
        return {
            logic_type: logicType,
            item_count: items.length,
            path_length: pathInfo.path_coords.length,
            has_procedures: logicType === 'function_logic',
            generated_at: new Date().toISOString()
        };
    }

    /**
     * Helper to check coordinate equality.
     */
    private coordsEqual(a: Coord, b: Coord): boolean {
        return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
    }
}

// Singleton instance
let placerInstance: SolutionFirstPlacer | null = null;

export function getSolutionFirstPlacer(): SolutionFirstPlacer {
    if (!placerInstance) {
        placerInstance = new SolutionFirstPlacer();
    }
    return placerInstance;
}
