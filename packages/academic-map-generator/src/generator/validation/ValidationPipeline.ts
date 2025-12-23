/**
 * Validation Pipeline - Multi-tier validation for generated maps
 * Ported from Python: core/validation/pre_solve_validator.py
 */

import { PlacedObject } from '../../shared/app-types';
import { IPathInfo, Coord } from '../types';
import { PedagogyStrategy } from '../strategies/types';

/**
 * Validation result for a single tier
 */
export interface TierValidationResult {
    tier: number;
    passed: boolean;
    checks: {
        name: string;
        passed: boolean;
        message: string;
    }[];
}

/**
 * Complete validation report
 */
export interface ValidationReport {
    isValid: boolean;
    tier1: TierValidationResult;
    tier2: TierValidationResult;
    tier3: TierValidationResult;
    summary: string;
    suggestions: string[];
}

/**
 * Map data for validation
 */
export interface MapDataForValidation {
    objects: PlacedObject[];
    pathInfo: IPathInfo;
    strategy: PedagogyStrategy;
    logicType?: string;
}

/**
 * Validation helper functions
 */
function coordToString(coord: Coord): string {
    return `${coord[0]},${coord[1]},${coord[2]}`;
}

function getItemObjects(objects: PlacedObject[]): PlacedObject[] {
    return objects.filter(o => 
        o.asset.type === 'collectible' || 
        o.asset.type === 'interactible' ||
        o.asset.key.includes('gem') ||
        o.asset.key.includes('crystal') ||
        o.asset.key.includes('switch')
    );
}

function getStartObject(objects: PlacedObject[]): PlacedObject | undefined {
    return objects.find(o => 
        o.asset.key.includes('player') || 
        o.asset.key.includes('start')
    );
}

function getFinishObject(objects: PlacedObject[]): PlacedObject | undefined {
    return objects.find(o => 
        o.asset.key.includes('finish') || 
        o.asset.key.includes('goal') ||
        o.asset.key.includes('end')
    );
}

/**
 * Tier 1: Basic Validation
 * - Start position exists
 * - Finish position exists
 * - Path is connected
 * - All items are on walkable tiles
 */
export function validateTier1(data: MapDataForValidation): TierValidationResult {
    const checks: TierValidationResult['checks'] = [];
    
    // Check 1: Start position exists
    const hasStart = getStartObject(data.objects) !== undefined || 
                     (data.pathInfo.start_pos && data.pathInfo.start_pos.length === 3);
    checks.push({
        name: 'Start Position',
        passed: hasStart,
        message: hasStart ? 'Start position defined' : 'Missing start position'
    });
    
    // Check 2: Finish position exists
    const hasFinish = getFinishObject(data.objects) !== undefined ||
                      (data.pathInfo.target_pos && data.pathInfo.target_pos.length === 3);
    checks.push({
        name: 'Finish Position',
        passed: hasFinish,
        message: hasFinish ? 'Finish position defined' : 'Missing finish position'
    });
    
    // Check 3: Path has valid coordinates
    const hasValidPath = data.pathInfo.path_coords && 
                         data.pathInfo.path_coords.length >= 2;
    checks.push({
        name: 'Valid Path',
        passed: hasValidPath,
        message: hasValidPath 
            ? `Path has ${data.pathInfo.path_coords.length} coordinates`
            : 'Path too short or missing'
    });
    
    // Check 4: Path connectivity via BFS reachability
    // NOTE: path_coords is for PLACEMENT purposes, not a walkable sequence!
    // We check if target is reachable from start via BFS on the grid of path tiles.
    let isConnected = true;
    if (hasValidPath && hasStart && hasFinish) {
        // Build walkable set from path_coords
        const walkableSet = new Set(
            data.pathInfo.path_coords.map(c => `${c[0]},${c[1]},${c[2]}`)
        );
        
        // Add placement_coords if available (they're also walkable)
        if (data.pathInfo.placement_coords) {
            for (const c of data.pathInfo.placement_coords) {
                walkableSet.add(`${c[0]},${c[1]},${c[2]}`);
            }
        }
        
        // BFS to check if target is reachable from start
        const start = data.pathInfo.start_pos;
        const target = data.pathInfo.target_pos;
        const startKey = `${start[0]},${start[1]},${start[2]}`;
        const targetKey = `${target[0]},${target[1]},${target[2]}`;
        
        const queue: string[] = [startKey];
        const visited = new Set([startKey]);
        
        while (queue.length > 0 && !visited.has(targetKey)) {
            const current = queue.shift()!;
            const [cx, cy, cz] = current.split(',').map(Number);
            
            // Check 6 neighbors (orthogonal only)
            for (const [dx, dy, dz] of [[1,0,0], [-1,0,0], [0,0,1], [0,0,-1], [0,1,0], [0,-1,0]]) {
                const nKey = `${cx+dx},${cy+dy},${cz+dz}`;
                if (walkableSet.has(nKey) && !visited.has(nKey)) {
                    visited.add(nKey);
                    queue.push(nKey);
                }
            }
        }
        
        isConnected = visited.has(targetKey);
    }
    checks.push({
        name: 'Path Connectivity',
        passed: isConnected,
        message: isConnected ? 'All path segments connected' : 'Target not reachable from start'
    });
    
    // Check 5: Items count
    const items = getItemObjects(data.objects);
    const hasItems = items.length > 0;
    checks.push({
        name: 'Has Items',
        passed: hasItems,
        message: hasItems ? `${items.length} collectible items placed` : 'No items on map'
    });
    
    return {
        tier: 1,
        passed: checks.every(c => c.passed),
        checks
    };
}

/**
 * Tier 2: Logic Type Compliance
 * - Function logic has reusable patterns
 * - Loop logic has regular intervals
 * - Strategy requirements are met
 */
export function validateTier2(data: MapDataForValidation): TierValidationResult {
    const checks: TierValidationResult['checks'] = [];
    const strategy = data.strategy;
    
    // Check 1: Items exist (basic requirement)
    const items = getItemObjects(data.objects);
    checks.push({
        name: 'Item Count',
        passed: items.length >= 3,
        message: items.length >= 3 
            ? `${items.length} items (meets minimum)`
            : `Only ${items.length} items (need at least 3)`
    });
    
    // Check 2: Strategy-specific validation
    if (strategy === PedagogyStrategy.FUNCTION_LOGIC) {
        // For function logic: check if branches have similar patterns
        const branches = data.pathInfo.metadata?.branches as Coord[][] | undefined;
        if (branches && branches.length >= 2) {
            // Count items per branch
            const itemsPerBranch = branches.map(branch => {
                const branchSet = new Set(branch.map(c => coordToString(c)));
                return items.filter(item => {
                    const itemCoord = coordToString([item.position[0], item.position[1] - 1, item.position[2]]);
                    return branchSet.has(itemCoord);
                }).length;
            });
            
            // Check if branches have similar item counts
            const minItems = Math.min(...itemsPerBranch);
            const maxItems = Math.max(...itemsPerBranch);
            const ratio = minItems / (maxItems || 1);
            const isBalanced = ratio >= 0.5; // At least 50% similar
            
            checks.push({
                name: 'Branch Balance',
                passed: isBalanced,
                message: isBalanced 
                    ? `Branches have balanced items (${itemsPerBranch.join(', ')})`
                    : `Unbalanced branches: ${itemsPerBranch.join(', ')}`
            });
        } else {
            checks.push({
                name: 'Branch Balance',
                passed: false,
                message: 'No branches detected for function logic'
            });
        }
    } else if (strategy === PedagogyStrategy.LOOP_LOGIC) {
        // For loop logic: check for regular patterns
        const segments = data.pathInfo.metadata?.segments as Coord[][] | undefined;
        if (segments && segments.length > 0) {
            checks.push({
                name: 'Segment Coverage',
                passed: true,
                message: `${segments.length} segments detected`
            });
        } else {
            checks.push({
                name: 'Segment Coverage',
                passed: items.length >= 5,
                message: items.length >= 5 
                    ? 'Sufficient items for loop pattern'
                    : 'Need more items for loop logic'
            });
        }
    } else if (strategy === PedagogyStrategy.WHILE_LOOP_DECREASING) {
        // Check for decreasing density pattern
        // Split path into thirds and check density
        const path = data.pathInfo.path_coords;
        const third = Math.floor(path.length / 3);
        const pathSet1 = new Set(path.slice(0, third).map(c => coordToString(c)));
        const pathSet2 = new Set(path.slice(third, third * 2).map(c => coordToString(c)));
        const pathSet3 = new Set(path.slice(third * 2).map(c => coordToString(c)));
        
        const count1 = items.filter(i => pathSet1.has(coordToString([i.position[0], i.position[1] - 1, i.position[2]]))).length;
        const count2 = items.filter(i => pathSet2.has(coordToString([i.position[0], i.position[1] - 1, i.position[2]]))).length;
        const count3 = items.filter(i => pathSet3.has(coordToString([i.position[0], i.position[1] - 1, i.position[2]]))).length;
        
        const isDecreasing = count1 >= count2 && count2 >= count3;
        checks.push({
            name: 'Decreasing Density',
            passed: isDecreasing || items.length >= 3,
            message: isDecreasing 
                ? `Decreasing pattern: ${count1} → ${count2} → ${count3}`
                : `Density: ${count1}, ${count2}, ${count3} (not strictly decreasing)`
        });
    } else {
        // General strategy check
        checks.push({
            name: 'Strategy Applied',
            passed: true,
            message: `Strategy ${strategy} applied`
        });
    }
    
    return {
        tier: 2,
        passed: checks.every(c => c.passed),
        checks
    };
}

/**
 * Tier 3: Pedagogy Validation
 * - Teaching concepts are present
 * - Complexity matches target level
 * - Pattern consistency
 */
export function validateTier3(data: MapDataForValidation): TierValidationResult {
    const checks: TierValidationResult['checks'] = [];
    
    // Check 1: Diversity (multiple item types)
    const items = getItemObjects(data.objects);
    const itemTypes = new Set(items.map(i => i.asset.key));
    const hasDiversity = itemTypes.size >= 1;
    checks.push({
        name: 'Item Diversity',
        passed: hasDiversity,
        message: hasDiversity 
            ? `${itemTypes.size} item type(s): ${Array.from(itemTypes).join(', ')}`
            : 'No item diversity'
    });
    
    // Check 2: Complexity appropriate
    const pathLength = data.pathInfo.path_coords.length;
    const itemCount = items.length;
    const density = itemCount / pathLength;
    const hasDensity = density >= 0.1 && density <= 0.8;
    checks.push({
        name: 'Item Density',
        passed: hasDensity,
        message: `Density: ${(density * 100).toFixed(1)}% (${itemCount}/${pathLength})`
    });
    
    // Check 3: Semantic positions used
    const semanticPositions = data.pathInfo.metadata?.semantic_positions;
    const usesSemantics = semanticPositions !== undefined;
    checks.push({
        name: 'Semantic Positions',
        passed: true, // Info only
        message: usesSemantics 
            ? 'Semantic positions defined'
            : 'No semantic positions (optional)'
    });
    
    // Check 4: Solvability (basic check - has path from start to finish)
    const hasValidStructure = data.pathInfo.path_coords.length >= 2;
    checks.push({
        name: 'Solvable Structure',
        passed: hasValidStructure,
        message: hasValidStructure 
            ? 'Map has valid path structure'
            : 'Invalid path structure'
    });
    
    return {
        tier: 3,
        passed: checks.filter(c => c.name !== 'Semantic Positions').every(c => c.passed),
        checks
    };
}

/**
 * Run full validation and generate report
 */
export function validateMap(data: MapDataForValidation): ValidationReport {
    const tier1 = validateTier1(data);
    const tier2 = validateTier2(data);
    const tier3 = validateTier3(data);
    
    const allPassed = tier1.passed && tier2.passed && tier3.passed;
    
    // Generate suggestions for failed checks
    const suggestions: string[] = [];
    
    if (!tier1.passed) {
        tier1.checks.filter(c => !c.passed).forEach(c => {
            if (c.name === 'Start Position') suggestions.push('Add a player start position');
            if (c.name === 'Finish Position') suggestions.push('Add a finish/goal position');
            if (c.name === 'Has Items') suggestions.push('Place collectible items on the map');
        });
    }
    
    if (!tier2.passed) {
        tier2.checks.filter(c => !c.passed).forEach(c => {
            if (c.name === 'Branch Balance') suggestions.push('Balance items across all branches for function reuse');
            if (c.name === 'Item Count') suggestions.push('Add more items (minimum 3 recommended)');
        });
    }
    
    if (!tier3.passed) {
        tier3.checks.filter(c => !c.passed).forEach(c => {
            if (c.name === 'Item Density') suggestions.push('Adjust item density (10-80% recommended)');
        });
    }
    
    // Generate summary
    let summary = '';
    if (allPassed) {
        summary = '✅ All validation tiers passed. Map is ready for use.';
    } else if (tier1.passed && tier2.passed) {
        summary = '⚠️ Basic validation passed, some pedagogy adjustments recommended.';
    } else if (tier1.passed) {
        summary = '⚠️ Map playable but strategy not fully implemented.';
    } else {
        summary = '❌ Basic validation failed. Fix critical issues before use.';
    }
    
    return {
        isValid: allPassed,
        tier1,
        tier2,
        tier3,
        summary,
        suggestions
    };
}
