/**
 * Base Strategy Class
 * Abstract base for all pedagogical placement strategies
 */

import { v4 as uuidv4 } from 'uuid';
import { Coord, IPathInfo } from '../types';
import { PlacedObject, BuildableAsset } from '../../../apps/map-builder-app/src/types';
import { StrategyContext, StrategyResult, DensityMode } from './types';

export abstract class BaseStrategy {
    protected name: string;
    protected description: string;
    
    constructor(name: string, description: string) {
        this.name = name;
        this.description = description;
    }

    /**
     * Apply the strategy to place items on the path
     */
    abstract apply(
        pathInfo: IPathInfo,
        context: StrategyContext
    ): StrategyResult;

    /**
     * Check if this strategy is compatible with the given topology
     */
    isCompatible(topologyType: string): boolean {
        return true; // Override in subclasses
    }

    /**
     * Get the recommended density mode for this strategy
     */
    abstract getDefaultDensityMode(): DensityMode;

    /**
     * Helper: Create a PlacedObject
     */
    protected createObject(
        pos: Coord,
        asset: BuildableAsset,
        yOffset: number = 1
    ): PlacedObject {
        return {
            id: uuidv4(),
            position: [pos[0], pos[1] + yOffset, pos[2]],
            rotation: [0, 0, 0],
            asset: asset,
            properties: { ...asset.defaultProperties }
        };
    }

    /**
     * Helper: Get asset from map with fallback
     */
    protected getAsset(
        assetMap: Map<string, BuildableAsset>,
        key: string,
        fallbackKeys: string[] = ['crystal', 'crystal']
    ): BuildableAsset | null {
        let asset = assetMap.get(key);
        if (!asset) {
            for (const fallback of fallbackKeys) {
                asset = assetMap.get(fallback);
                if (asset) break;
            }
        }
        return asset || null;
    }

    /**
     * Helper: Check if position is already occupied
     */
    protected isOccupied(objects: PlacedObject[], pos: Coord, yOffset: number = 1): boolean {
        const checkY = pos[1] + yOffset;
        return objects.some(o => 
            o.position[0] === pos[0] && 
            o.position[1] === checkY && 
            o.position[2] === pos[2] &&
            (o.asset.type === 'collectible' || o.asset.type === 'interactible')
        );
    }

    /**
     * Helper: Calculate density for a position based on mode
     * Returns probability (0-1) of placing an item at this position
     */
    protected calculateDensity(
        mode: DensityMode,
        index: number,
        total: number,
        baseDensity: number = 0.5
    ): number {
        const progress = total > 1 ? index / (total - 1) : 0;

        switch (mode) {
            case DensityMode.UNIFORM:
                return baseDensity;
                
            case DensityMode.DECREASING:
                // High at start (0.8), low at end (0.2)
                return 0.8 - (progress * 0.6);
                
            case DensityMode.INCREASING:
                // Low at start (0.2), high at end (0.8)
                return 0.2 + (progress * 0.6);
                
            case DensityMode.ZIGZAG:
                // Alternating high (0.8) and low (0.3)
                return index % 2 === 0 ? 0.8 : 0.3;
                
            case DensityMode.CLUSTERED:
                // Create clusters: high at multiples of 3, low otherwise
                return index % 3 === 0 ? 0.9 : 0.1;
                
            default:
                return baseDensity;
        }
    }

    /**
     * Helper: Apply density-based placement to a segment
     */
    protected applyDensityPlacement(
        segment: Coord[],
        context: StrategyContext,
        objects: PlacedObject[],
        itemKey: string = 'crystal'
    ): number {
        let itemsAdded = 0;
        const asset = this.getAsset(context.assetMap, itemKey);
        if (!asset) return 0;

        const densityMode = context.densityMode || DensityMode.UNIFORM;
        const baseDensity = context.difficulty === 'complex' ? 0.7 : 
                           (context.difficulty === 'simple' ? 0.5 : 0.3);

        segment.forEach((pos, index) => {
            const density = this.calculateDensity(densityMode, index, segment.length, baseDensity);
            
            if (Math.random() < density && !this.isOccupied(objects, pos)) {
                objects.push(this.createObject(pos, asset));
                itemsAdded++;
            }
        });

        return itemsAdded;
    }

    /**
     * Helper: Place items at regular intervals (for loop logic)
     */
    protected placeAtIntervals(
        segment: Coord[],
        context: StrategyContext,
        objects: PlacedObject[],
        interval: number = 1,
        itemKey: string = 'crystal'
    ): number {
        let itemsAdded = 0;
        const asset = this.getAsset(context.assetMap, itemKey);
        if (!asset) return 0;

        for (let i = 0; i < segment.length; i += interval) {
            const pos = segment[i];
            if (!this.isOccupied(objects, pos)) {
                objects.push(this.createObject(pos, asset));
                itemsAdded++;
            }
        }

        return itemsAdded;
    }

    /**
     * Helper: Apply identical pattern to multiple segments (for function reuse)
     */
    protected applyIdenticalPattern(
        segments: Coord[][],
        context: StrategyContext,
        objects: PlacedObject[],
        pattern: number[], // Indices within segment to place items
        itemKey: string = 'crystal'
    ): number {
        let itemsAdded = 0;
        const asset = this.getAsset(context.assetMap, itemKey);
        if (!asset) return 0;

        segments.forEach(segment => {
            pattern.forEach(index => {
                if (index < segment.length) {
                    const pos = segment[index];
                    if (!this.isOccupied(objects, pos)) {
                        objects.push(this.createObject(pos, asset));
                        itemsAdded++;
                    }
                }
            });
        });

        return itemsAdded;
    }
}
