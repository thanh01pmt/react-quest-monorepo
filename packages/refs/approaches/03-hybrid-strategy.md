# Hybrid Map Generation Strategy

## 1. Tổng quan

Hybrid Strategy kết hợp ưu điểm của cả hai phương pháp:
- **Core path từ Solution-Driven**: Đảm bảo pedagogy
- **Noise/variations từ Pattern-Based**: Tăng exploration

### Concept

```
┌─────────────────────────────────────────────────────────────┐
│                     HYBRID STRATEGY                        │
│                                                             │
│  ┌─────────────────┐     ┌─────────────────┐               │
│  │ Solution-Driven │ ──→ │   Core Path     │               │
│  │   (Template)    │     │ (Always valid)  │               │
│  └─────────────────┘     └────────┬────────┘               │
│                                   │                         │
│                                   ▼                         │
│  ┌─────────────────┐     ┌─────────────────┐               │
│  │  Pattern-Based  │ ──→ │  Noise Layer    │               │
│  │   (Library)     │     │ (Exploration)   │               │
│  └─────────────────┘     └────────┬────────┘               │
│                                   │                         │
│                                   ▼                         │
│                          ┌─────────────────┐               │
│                          │   Final Map     │               │
│                          │ Core + Noise    │               │
│                          └─────────────────┘               │
└─────────────────────────────────────────────────────────────┘
```

### Workflow

```
1. Generate Core Path (Solution-Driven)
   └─→ Path that matches expected code exactly

2. Identify Noise Opportunities
   └─→ Branch points, dead-end extensions, side paths

3. Apply Noise Patterns (Pattern-Based)
   └─→ Extra items, alternative routes, visual variety

4. Validate Combined Map
   └─→ Core path still valid, noise doesn't break anything

5. Generate Ground & Scenery
   └─→ Cover both core and noise paths
```

## 2. Decision Matrix: When to Use Hybrid

```typescript
type GenerationMode = 'PURE_SOLUTION' | 'HYBRID' | 'PURE_PROCEDURAL';

function decideGenerationMode(template: CodeTemplate): GenerationMode {
  const { gradeLevel, category, constraints } = template;
  
  // K-2: Pure solution (no confusion for beginners)
  if (gradeLevel === 'K-2') {
    return 'PURE_SOLUTION';
  }
  
  // Teaching sensing/conditionals: Need alternatives for real sensing
  if (category === PedagogyConcept.SENSING || 
      category === PedagogyConcept.CONDITIONAL_LOGIC) {
    return 'HYBRID';
  }
  
  // Teaching optimization: Need suboptimal paths for comparison
  if (category === PedagogyConcept.OPTIMIZATION ||
      category === PedagogyConcept.ALGORITHM_DESIGN) {
    return 'HYBRID';
  }
  
  // Pure loops: Solution is sufficient
  if (category === PedagogyConcept.FOR_COUNTED ||
      category === PedagogyConcept.NESTED_FOR) {
    return constraints.noiseLevel === 'none' ? 'PURE_SOLUTION' : 'HYBRID';
  }
  
  // Advanced students: Always hybrid for challenge
  if (gradeLevel === '9-12') {
    return 'HYBRID';
  }
  
  return 'PURE_SOLUTION';
}
```

## 3. Noise Configuration by Grade Level

```typescript
interface NoiseConfig {
  gradeLevel: string;
  noiseType: 'none' | 'visual_only' | 'collectible' | 'full';
  maxNoisePaths: number;
  maxExtraItems: number;
  allowDeadEnds: boolean;
  allowDecoys: boolean;
}

const NOISE_BY_GRADE: Record<string, NoiseConfig> = {
  'K-2': { 
    noiseType: 'none',
    maxNoisePaths: 0,
    maxExtraItems: 0,
    allowDeadEnds: false,
    allowDecoys: false
  },
  '3-5': { 
    noiseType: 'visual_only',  // Branches but NO items
    maxNoisePaths: 2,
    maxExtraItems: 0,
    allowDeadEnds: true,       // Dead ends visible
    allowDecoys: false
  },
  '6-8': { 
    noiseType: 'collectible',  // Extra items in detours
    maxNoisePaths: 3,
    maxExtraItems: 3,
    allowDeadEnds: true,
    allowDecoys: false
  },
  '9-12': { 
    noiseType: 'full',         // Full complexity
    maxNoisePaths: 5,
    maxExtraItems: 5,
    allowDeadEnds: true,
    allowDecoys: true          // Decoy items that waste moves
  }
};
```

## 4. Hybrid Generator Implementation

```typescript
class HybridGenerator {
  private solutionGenerator: SolutionDrivenGenerator;
  private patternGenerator: PatternBasedGenerator;
  private noiseConfig: NoiseConfig;
  
  constructor(template: CodeTemplate) {
    this.solutionGenerator = new SolutionDrivenGenerator(template);
    this.patternGenerator = new PatternBasedGenerator();
    this.noiseConfig = NOISE_BY_GRADE[template.gradeLevel];
  }
  
  generate(): GeneratedMap {
    // PHASE 1: Generate core path from solution
    const corePath = this.solutionGenerator.generate();
    
    // PHASE 2: Skip noise if config says none
    if (this.noiseConfig.noiseType === 'none') {
      return corePath;
    }
    
    // PHASE 3: Identify noise opportunities
    const opportunities = this.findNoiseOpportunities(corePath);
    
    // PHASE 4: Apply noise based on config
    const noisyMap = this.applyNoise(corePath, opportunities);
    
    // PHASE 5: Validate
    this.validate(noisyMap, corePath);
    
    return noisyMap;
  }
  
  private findNoiseOpportunities(core: GeneratedMap): NoiseOpportunity[] {
    const opportunities: NoiseOpportunity[] = [];
    
    // Find straight segments where branches can be added
    for (const segment of core.straightSegments) {
      if (segment.length >= 3) {
        opportunities.push({
          type: 'branch',
          position: segment.midpoint,
          direction: this.pickBranchDirection(segment)
        });
      }
    }
    
    // Find turn points where extensions can be added
    for (const turnPoint of core.turnPoints) {
      opportunities.push({
        type: 'extension',
        position: turnPoint,
        direction: 'continue'  // Extend before turning
      });
    }
    
    // Find end points for dead-end branches
    opportunities.push({
      type: 'dead_end',
      position: core.endPosition,
      direction: 'any'
    });
    
    return opportunities;
  }
  
  private applyNoise(
    core: GeneratedMap, 
    opportunities: NoiseOpportunity[]
  ): GeneratedMap {
    const map = core.clone();
    
    // Limit opportunities based on config
    const selected = opportunities
      .slice(0, this.noiseConfig.maxNoisePaths);
    
    for (const opp of selected) {
      switch (opp.type) {
        case 'branch':
          this.addBranch(map, opp);
          break;
        case 'extension':
          this.addExtension(map, opp);
          break;
        case 'dead_end':
          if (this.noiseConfig.allowDeadEnds) {
            this.addDeadEnd(map, opp);
          }
          break;
      }
    }
    
    // Add extra items based on config
    if (this.noiseConfig.noiseType === 'collectible' || 
        this.noiseConfig.noiseType === 'full') {
      this.addExtraItems(map);
    }
    
    return map;
  }
  
  private addBranch(map: GeneratedMap, opp: NoiseOpportunity): void {
    const branchLength = this.random.nextInt(2, 4);
    const branchPath = this.generateBranchPath(opp.position, opp.direction, branchLength);
    
    // Add ground for branch
    map.addPath(branchPath);
    
    // Add items if config allows
    if (this.noiseConfig.noiseType !== 'visual_only') {
      const itemPos = branchPath[branchPath.length - 1];
      map.placeItem(itemPos, ItemType.CRYSTAL);
    }
    
    // Mark as optional branch
    map.markAsOptional(branchPath);
  }
  
  private addExtraItems(map: GeneratedMap): void {
    const noisePaths = map.noisePaths;
    let itemsAdded = 0;
    
    for (const path of noisePaths) {
      if (itemsAdded >= this.noiseConfig.maxExtraItems) break;
      
      // Place item at end of noise path
      const pos = path[path.length - 1];
      if (!map.hasItemAt(pos)) {
        map.placeItem(pos, ItemType.CRYSTAL);
        itemsAdded++;
      }
    }
  }
  
  private validate(noisyMap: GeneratedMap, corePath: GeneratedMap): void {
    // Ensure core path is still fully traversable
    for (const coord of corePath.pathCoords) {
      if (!noisyMap.hasGroundAt(coord)) {
        throw new Error(`Core path broken at ${coord}`);
      }
    }
    
    // Ensure core items are still present
    for (const [coord, item] of corePath.items) {
      if (!noisyMap.hasItemAt(coord)) {
        throw new Error(`Core item ${item} missing at ${coord}`);
      }
    }
    
    // Ensure noise doesn't block core path
    for (const coord of corePath.pathCoords) {
      if (noisyMap.hasBlockingItemAt(coord)) {
        throw new Error(`Noise blocking core path at ${coord}`);
      }
    }
  }
}
```

## 5. Noise Types Explained

### 5.1 Visual Only (Grades 3-5)

```
Core path:  Start → C → C → C → End
With noise: Start → C → C → C → End
                    ↓
                    ─── (empty dead end)

Purpose: Student sees there ARE other paths, but learns
         "My code follows the optimal path"
```

### 5.2 Collectible Noise (Grades 6-8)

```
Core path (5 crystals):  Start → C → C → C → C → C → End
With noise (+2 crystals):
                         Start → C → C → C → C → C → End
                                 ↓
                                 C (bonus crystal)
                                     ↓
                                     C (bonus crystal)

Purpose: Student can OPTIMIZE by collecting bonus items
         Teaches: "My code works, but is it the BEST?"
```

### 5.3 Full Noise (Grades 9-12)

```
Core path:       Start → C → C → C → C → C → End
With full noise: Start → C → C → C → C → C → End
                         ↓       ↓       ↓
                         C ← D   C       X (trap/wall)
                         (bonus) (bonus) (dead end with decoy)

Purpose: Real-world complexity - wrong paths waste moves
         Teaches: Sensing, optimization, defensive coding
```

## 6. Scoring System with Noise

```typescript
interface ScoringConfig {
  baseScore: number;          // For completing level
  coreItemScore: number;      // Per core item
  bonusItemScore: number;     // Per noise item
  stepPenalty: number;        // Per extra step used
  optimalBonus: number;       // For using optimal solution
}

const DEFAULT_SCORING: ScoringConfig = {
  baseScore: 100,
  coreItemScore: 10,
  bonusItemScore: 5,         // Less than core
  stepPenalty: 1,
  optimalBonus: 50
};

class ScoreCalculator {
  calculate(
    result: PlayResult, 
    map: GeneratedMap,
    config: ScoringConfig
  ): number {
    let score = config.baseScore;
    
    // Core items
    const coreItems = map.coreItems.length;
    const coreCollected = result.coreItemsCollected;
    score += coreCollected * config.coreItemScore;
    
    // Bonus items (from noise)
    const bonusCollected = result.bonusItemsCollected;
    score += bonusCollected * config.bonusItemScore;
    
    // Step penalty
    const optimalSteps = map.optimalPathLength;
    const extraSteps = Math.max(0, result.stepsUsed - optimalSteps);
    score -= extraSteps * config.stepPenalty;
    
    // Optimal bonus
    if (result.stepsUsed <= optimalSteps && coreCollected === coreItems) {
      score += config.optimalBonus;
    }
    
    return Math.max(0, score);
  }
}
```

## 7. Pedagogy Impact of Noise

### Without Noise (Pure Solution)
```
Student code: for i in 1..5 { move(); pick() }
Map: Exactly 5 crystals in a line
Learning: "My code works because map was made for it"
Risk: Memorization, not understanding
```

### With Noise (Hybrid)
```
Student code: for i in 1..5 { move(); pick() }
Map: 5 core crystals + 2 bonus crystals in branches
Learning: "My code works for the main goal, but I could do MORE"
Benefit: Encourages exploration, optimization thinking
```

## 8. Error Recovery in Hybrid Mode

```typescript
interface HybridGenerationResult {
  success: boolean;
  map: GeneratedMap;
  mode: 'full_hybrid' | 'reduced_noise' | 'pure_solution';
  warnings: string[];
}

class ResilientHybridGenerator extends HybridGenerator {
  async generate(): Promise<HybridGenerationResult> {
    try {
      // Try full hybrid
      const map = await super.generate();
      return { success: true, map, mode: 'full_hybrid', warnings: [] };
      
    } catch (noiseError) {
      console.warn('Noise generation failed:', noiseError);
      
      try {
        // Fallback: reduced noise
        const reducedConfig = this.reduceNoiseConfig();
        const map = await this.generateWithConfig(reducedConfig);
        return { 
          success: true, 
          map, 
          mode: 'reduced_noise',
          warnings: ['Noise reduced due to generation issues']
        };
        
      } catch (reducedError) {
        console.warn('Reduced noise also failed:', reducedError);
        
        // Final fallback: pure solution
        const map = await this.solutionGenerator.generate();
        return {
          success: true,
          map,
          mode: 'pure_solution',
          warnings: ['Fell back to pure solution mode']
        };
      }
    }
  }
  
  private reduceNoiseConfig(): NoiseConfig {
    return {
      ...this.noiseConfig,
      maxNoisePaths: Math.max(1, Math.floor(this.noiseConfig.maxNoisePaths / 2)),
      maxExtraItems: Math.max(1, Math.floor(this.noiseConfig.maxExtraItems / 2)),
      allowDecoys: false
    };
  }
}
```

## 9. Comparison Summary

| Aspect | Pattern-Based | Solution-Driven | Hybrid |
|--------|---------------|-----------------|--------|
| Pedagogy Control | Low | High | High |
| Exploration | High | Low | Medium |
| Variety | High | Medium | Medium-High |
| Validation | Hard | Easy | Medium |
| Complexity | Medium | High | Very High |
| Best for Grades | All | K-5 | 6-12 |
| Best Use Case | Adventure | Tutorial | Mixed |

## 10. Recommended Usage by Level Type

```typescript
const RECOMMENDED_APPROACH: Record<string, GenerationMode> = {
  // Tutorial levels: Pure solution
  'tutorial_sequence': 'PURE_SOLUTION',
  'tutorial_loop': 'PURE_SOLUTION',
  'tutorial_conditional': 'PURE_SOLUTION',
  
  // Practice levels: Hybrid with low noise
  'practice_loop': 'HYBRID',          // noiseLevel: 'low'
  'practice_conditional': 'HYBRID',   // noiseLevel: 'low'
  
  // Challenge levels: Hybrid with high noise
  'challenge_optimization': 'HYBRID', // noiseLevel: 'high'
  'challenge_puzzle': 'HYBRID',       // noiseLevel: 'high'
  
  // Adventure/Exploration: Pure procedural
  'adventure_explore': 'PURE_PROCEDURAL',
  'bonus_stage': 'PURE_PROCEDURAL'
};
```
