# Error Recovery Framework

## 1. Overview

Error recovery is critical for a good user experience when map generation fails.
This document describes the error handling and fallback strategies.

## 2. Error Types

```typescript
/**
 * Classification of errors during map generation
 */
enum ErrorType {
  // Template errors
  TEMPLATE_PARSE_ERROR = 'template_parse_error',
  TEMPLATE_VALIDATION_ERROR = 'template_validation_error',
  PARAMETER_ERROR = 'parameter_error',
  
  // Generation errors
  COMPLEXITY_EXCEEDED = 'complexity_exceeded',
  PATH_COLLISION = 'path_collision',
  DEPENDENCY_UNRESOLVABLE = 'dependency_unresolvable',
  TERMINATION_IMPOSSIBLE = 'termination_impossible',
  
  // Runtime errors
  INFINITE_LOOP = 'infinite_loop',
  MEMORY_EXCEEDED = 'memory_exceeded',
  TIMEOUT = 'timeout',
  
  // Internal errors
  INTERNAL_ERROR = 'internal_error'
}

/**
 * Severity levels
 */
enum ErrorSeverity {
  WARNING = 'warning',      // Can continue with degradation
  ERROR = 'error',          // Cannot continue current approach
  CRITICAL = 'critical'     // Cannot generate any map
}

/**
 * Structured error type
 */
interface GenerationError {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  userFacingMessage: string;
  context?: Record<string, any>;
  suggestions: string[];
  recoverable: boolean;
}
```

## 3. Error Recovery Strategies

### 3.1 Strategy Matrix

| Error Type | Primary Strategy | Fallback Strategy | Last Resort |
|------------|------------------|-------------------|-------------|
| COMPLEXITY_EXCEEDED | Simplify template | Reduce parameters | Pure solution |
| PATH_COLLISION | Retry with offset | Reduce noise | Pattern-only |
| DEPENDENCY_UNRESOLVABLE | Reorder items | Remove dependencies | No gates/switches |
| TERMINATION_IMPOSSIBLE | Adjust iterations | Pre-place terminator | Linear path |
| INFINITE_LOOP | Abort & reduce | Hard iteration limit | Fail gracefully |

### 3.2 Recovery Implementation

```typescript
/**
 * Result of generation with recovery info
 */
interface GenerationResult {
  success: boolean;
  map: GeneratedMap | null;
  
  // Recovery info
  mode: 'full' | 'simplified' | 'fallback' | 'failed';
  attemptedStrategies: string[];
  appliedRecoveries: RecoveryAction[];
  
  // Error info
  errors: GenerationError[];
  warnings: GenerationError[];
  
  // Stats
  totalAttempts: number;
  generationTimeMs: number;
}

/**
 * Recovery action taken
 */
interface RecoveryAction {
  strategy: string;
  description: string;
  impact: string;
}

/**
 * Resilient generator with error recovery
 */
class ResilientGenerator {
  private maxAttempts = 3;
  private timeoutMs = 30000;
  
  async generate(template: CodeTemplate): Promise<GenerationResult> {
    const startTime = Date.now();
    const errors: GenerationError[] = [];
    const warnings: GenerationError[] = [];
    const attemptedStrategies: string[] = [];
    const appliedRecoveries: RecoveryAction[] = [];
    let attempts = 0;
    
    // ATTEMPT 1: Full generation
    attemptedStrategies.push('full_generation');
    attempts++;
    
    try {
      const map = await this.fullGeneration(template);
      return {
        success: true,
        map,
        mode: 'full',
        attemptedStrategies,
        appliedRecoveries,
        errors: [],
        warnings,
        totalAttempts: attempts,
        generationTimeMs: Date.now() - startTime
      };
    } catch (e) {
      errors.push(this.classifyError(e));
    }
    
    // ATTEMPT 2: Simplified generation
    attemptedStrategies.push('simplified_generation');
    attempts++;
    
    try {
      const simplifiedTemplate = this.simplifyTemplate(template);
      appliedRecoveries.push({
        strategy: 'simplify_template',
        description: 'Reduced template complexity',
        impact: 'Some features may be limited'
      });
      
      const map = await this.fullGeneration(simplifiedTemplate);
      return {
        success: true,
        map,
        mode: 'simplified',
        attemptedStrategies,
        appliedRecoveries,
        errors,
        warnings,
        totalAttempts: attempts,
        generationTimeMs: Date.now() - startTime
      };
    } catch (e) {
      errors.push(this.classifyError(e));
    }
    
    // ATTEMPT 3: Fallback generation
    attemptedStrategies.push('fallback_generation');
    attempts++;
    
    try {
      const fallbackMap = await this.fallbackGeneration(template);
      appliedRecoveries.push({
        strategy: 'fallback_mode',
        description: 'Generated basic map without advanced features',
        impact: 'Educational features limited'
      });
      
      return {
        success: true,
        map: fallbackMap,
        mode: 'fallback',
        attemptedStrategies,
        appliedRecoveries,
        errors,
        warnings,
        totalAttempts: attempts,
        generationTimeMs: Date.now() - startTime
      };
    } catch (e) {
      errors.push(this.classifyError(e));
    }
    
    // All attempts failed
    return {
      success: false,
      map: null,
      mode: 'failed',
      attemptedStrategies,
      appliedRecoveries,
      errors,
      warnings,
      totalAttempts: attempts,
      generationTimeMs: Date.now() - startTime
    };
  }
  
  /**
   * Simplify template for recovery
   */
  private simplifyTemplate(template: CodeTemplate): CodeTemplate {
    return {
      ...template,
      parameters: template.parameters.map(p => {
        if (p.type === 'int' && p.range) {
          // Reduce ranges by 50%
          const mid = Math.floor((p.range[0] + p.range[1]) / 2);
          return { ...p, range: [p.range[0], mid] as [number, number] };
        }
        return p;
      }),
      constraints: {
        ...template.constraints,
        maxNestingDepth: Math.min(2, template.constraints.maxNestingDepth),
        noiseLevel: 'none'
      }
    };
  }
  
  /**
   * Fallback generation - simplest possible map
   */
  private async fallbackGeneration(template: CodeTemplate): Promise<GeneratedMap> {
    // Extract basic structure from template
    const basicPath = this.extractBasicPath(template);
    
    // Generate simple linear map
    return {
      id: `fallback-${Date.now()}`,
      templateId: template.id,
      seed: 'fallback',
      pathCoords: new Set(basicPath.map(p => `${p.x},${p.y}`)),
      placementCoords: new Map(),
      groundBlocks: basicPath.map(p => ({ 
        position: { ...p, z: 0 }, 
        type: 'walkable' as const
      })),
      items: [],
      coreItems: [],
      noiseItems: [],
      startPosition: basicPath[0],
      startDirection: Direction.NORTH,
      goalPosition: basicPath[basicPath.length - 1],
      optimalPathLength: basicPath.length,
      complexity: 5,
      bounds: this.calculateBounds(basicPath),
      noisePaths: [],
      visualHints: []
    };
  }
  
  /**
   * Classify error into structured format
   */
  private classifyError(e: any): GenerationError {
    if (e instanceof ComplexityExceededError) {
      return {
        type: ErrorType.COMPLEXITY_EXCEEDED,
        severity: ErrorSeverity.ERROR,
        message: e.message,
        userFacingMessage: 'Template too complex for selected grade level',
        context: { complexity: e.complexity, limit: e.limit },
        suggestions: [
          'Reduce loop iterations',
          'Simplify nested structures',
          'Use a higher grade level'
        ],
        recoverable: true
      };
    }
    
    if (e instanceof PathCollisionError) {
      return {
        type: ErrorType.PATH_COLLISION,
        severity: ErrorSeverity.ERROR,
        message: e.message,
        userFacingMessage: 'Could not place all items without overlap',
        context: { position: e.position },
        suggestions: [
          'Reduce number of items',
          'Use different pattern arrangement',
          'Increase map size'
        ],
        recoverable: true
      };
    }
    
    if (e instanceof TimeoutError) {
      return {
        type: ErrorType.TIMEOUT,
        severity: ErrorSeverity.CRITICAL,
        message: 'Generation timed out',
        userFacingMessage: 'Map generation took too long',
        suggestions: [
          'Simplify the template',
          'Reduce parameters'
        ],
        recoverable: false
      };
    }
    
    // Unknown error
    return {
      type: ErrorType.INTERNAL_ERROR,
      severity: ErrorSeverity.CRITICAL,
      message: e.message ?? 'Unknown error',
      userFacingMessage: 'An unexpected error occurred',
      suggestions: ['Please try again or contact support'],
      recoverable: false
    };
  }
}
```

## 4. Specific Recovery Strategies

### 4.1 Complexity Exceeded Recovery

```typescript
class ComplexityRecovery {
  recover(template: CodeTemplate, error: ComplexityExceededError): CodeTemplate {
    const strategies = [
      this.reduceIterations,
      this.flattenNesting,
      this.removeNoise,
      this.simplifyConditions
    ];
    
    let current = template;
    
    for (const strategy of strategies) {
      current = strategy(current);
      
      const newComplexity = calculateComplexity(current);
      if (newComplexity <= error.limit) {
        return current;
      }
    }
    
    throw new Error('Could not reduce complexity enough');
  }
  
  private reduceIterations(template: CodeTemplate): CodeTemplate {
    return {
      ...template,
      parameters: template.parameters.map(p => {
        if (p.type === 'int' && p.range) {
          // Cap at 50% of original max
          const newMax = Math.ceil((p.range[0] + p.range[1]) / 2);
          return { ...p, range: [p.range[0], newMax] as [number, number] };
        }
        return p;
      })
    };
  }
  
  private flattenNesting(template: CodeTemplate): CodeTemplate {
    // Parse AST and remove one level of nesting
    const ast = parse(template.code);
    const flattened = flattenAST(ast, 1);
    
    return {
      ...template,
      code: unparse(flattened),
      constraints: {
        ...template.constraints,
        maxNestingDepth: Math.max(1, template.constraints.maxNestingDepth - 1)
      }
    };
  }
  
  private removeNoise(template: CodeTemplate): CodeTemplate {
    return {
      ...template,
      constraints: {
        ...template.constraints,
        noiseLevel: 'none'
      }
    };
  }
  
  private simplifyConditions(template: CodeTemplate): CodeTemplate {
    // Replace complex conditions with simple ones
    let code = template.code;
    
    // Remove nested ifs
    code = code.replace(/if\s*\([^)]+\)\s*{\s*if/g, 'if');
    
    return { ...template, code };
  }
}
```

### 4.2 While Loop Termination Recovery

```typescript
class TerminationRecovery {
  /**
   * Ensure while loop will terminate
   */
  ensureTermination(
    ast: WhileLoopNode, 
    maxIterations: number
  ): { ast: WhileLoopNode; terminatorPos: Vector2 } {
    // Strategy 1: Generate path first, then place terminator
    const simulatedPath = this.simulateLoop(ast, maxIterations);
    
    // Place terminator at last position
    const terminatorPos = simulatedPath[simulatedPath.length - 1];
    
    // Inject terminator into AST
    const modifiedAST = this.injectTerminator(ast, terminatorPos);
    
    return { ast: modifiedAST, terminatorPos };
  }
  
  private simulateLoop(ast: WhileLoopNode, maxIterations: number): Vector2[] {
    const path: Vector2[] = [];
    let pos = { x: 0, y: 0 };
    let dir = Direction.NORTH;
    
    for (let i = 0; i < maxIterations; i++) {
      // Execute body once
      const { newPos, newDir } = this.executeBody(ast.body, pos, dir);
      path.push(newPos);
      pos = newPos;
      dir = newDir;
    }
    
    return path;
  }
  
  private injectTerminator(ast: WhileLoopNode, pos: Vector2): WhileLoopNode {
    // Add a check at the end of body that stops at terminator position
    return {
      ...ast,
      condition: {
        type: 'Condition',
        operator: 'and',
        condition: ast.condition.condition,
        left: ast.condition,
        right: {
          type: 'Condition',
          operator: 'not',
          condition: ConditionType.AT_PORTAL,
          left: {
            type: 'Condition',
            operator: 'none',
            condition: ConditionType.AT_PORTAL
          }
        }
      }
    };
  }
}
```

### 4.3 Path Collision Recovery

```typescript
class CollisionRecovery {
  private maxRetries = 10;
  
  /**
   * Resolve path collision by adjusting placement
   */
  resolveCollision(
    existingPath: Set<string>,
    newPattern: Pattern,
    startPos: Vector2,
    startDir: Direction
  ): { success: boolean; adjustedStart?: Vector2; adjustedDir?: Direction } {
    
    for (let retry = 0; retry < this.maxRetries; retry++) {
      // Strategy 1: Offset start position
      const offsetPos = this.offsetPosition(startPos, retry);
      if (this.canPlaceAt(existingPath, newPattern, offsetPos, startDir)) {
        return { success: true, adjustedStart: offsetPos, adjustedDir: startDir };
      }
      
      // Strategy 2: Rotate direction
      const rotatedDir = this.rotateDirection(startDir, retry);
      if (this.canPlaceAt(existingPath, newPattern, startPos, rotatedDir)) {
        return { success: true, adjustedStart: startPos, adjustedDir: rotatedDir };
      }
      
      // Strategy 3: Both offset and rotate
      if (this.canPlaceAt(existingPath, newPattern, offsetPos, rotatedDir)) {
        return { success: true, adjustedStart: offsetPos, adjustedDir: rotatedDir };
      }
    }
    
    return { success: false };
  }
  
  private offsetPosition(pos: Vector2, attempt: number): Vector2 {
    // Spiral outward
    const offsets = [
      { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 0, y: -1 },
      { x: 1, y: 1 }, { x: -1, y: 1 }, { x: -1, y: -1 }, { x: 1, y: -1 },
      { x: 2, y: 0 }, { x: 0, y: 2 }
    ];
    
    const offset = offsets[attempt % offsets.length];
    const multiplier = Math.floor(attempt / offsets.length) + 1;
    
    return {
      x: pos.x + offset.x * multiplier,
      y: pos.y + offset.y * multiplier
    };
  }
  
  private rotateDirection(dir: Direction, times: number): Direction {
    const directions = [Direction.NORTH, Direction.EAST, Direction.SOUTH, Direction.WEST];
    const idx = directions.indexOf(dir);
    return directions[(idx + times) % 4];
  }
  
  private canPlaceAt(
    existing: Set<string>,
    pattern: Pattern,
    pos: Vector2,
    dir: Direction
  ): boolean {
    const patternCoords = this.simulatePattern(pattern, pos, dir);
    return patternCoords.every(coord => !existing.has(`${coord.x},${coord.y}`));
  }
}
```

## 5. User Feedback

### 5.1 Error Messages

```typescript
const ERROR_MESSAGES: Record<ErrorType, { 
  title: string; 
  description: string; 
  icon: string;
}> = {
  [ErrorType.COMPLEXITY_EXCEEDED]: {
    title: 'Template Too Complex',
    description: 'This template exceeds the complexity limit for the selected grade level.',
    icon: '⚠️'
  },
  [ErrorType.PATH_COLLISION]: {
    title: 'Layout Conflict',
    description: 'Some items could not be placed without overlapping.',
    icon: '🔄'
  },
  [ErrorType.DEPENDENCY_UNRESOLVABLE]: {
    title: 'Missing Requirements',
    description: 'Some items depend on others that could not be placed.',
    icon: '🔗'
  },
  [ErrorType.TERMINATION_IMPOSSIBLE]: {
    title: 'Loop Cannot End',
    description: 'The while loop condition cannot be satisfied.',
    icon: '♾️'
  },
  [ErrorType.TIMEOUT]: {
    title: 'Generation Timeout',
    description: 'Map generation took too long and was cancelled.',
    icon: '⏱️'
  },
  [ErrorType.INTERNAL_ERROR]: {
    title: 'Unexpected Error',
    description: 'Something went wrong. Please try again.',
    icon: '❌'
  }
};
```

### 5.2 Recovery Notification

```typescript
interface RecoveryNotification {
  title: string;
  description: string;
  impact: string;
  action?: {
    label: string;
    handler: () => void;
  };
}

function createRecoveryNotification(result: GenerationResult): RecoveryNotification | null {
  if (result.mode === 'full') return null;
  
  if (result.mode === 'simplified') {
    return {
      title: 'Simplified Template Used',
      description: 'Some parameters were reduced to generate a valid map.',
      impact: 'The map may be smaller or simpler than requested.',
      action: {
        label: 'View Details',
        handler: () => showRecoveryDetails(result.appliedRecoveries)
      }
    };
  }
  
  if (result.mode === 'fallback') {
    return {
      title: 'Basic Map Generated',
      description: 'Advanced features were disabled to generate a map.',
      impact: 'Educational features may be limited.',
      action: {
        label: 'Try Different Settings',
        handler: () => openSettingsPanel()
      }
    };
  }
  
  if (result.mode === 'failed') {
    return {
      title: 'Generation Failed',
      description: 'Could not generate a map with the current settings.',
      impact: 'Please adjust your template or parameters.',
      action: {
        label: 'View Suggestions',
        handler: () => showSuggestions(result.errors)
      }
    };
  }
  
  return null;
}
```

## 6. Logging and Monitoring

```typescript
interface GenerationLog {
  timestamp: Date;
  templateId: string;
  gradeLevel: GradeLevel;
  mode: GenerationResult['mode'];
  success: boolean;
  durationMs: number;
  attempts: number;
  errors: string[];
  recoveries: string[];
}

class GenerationLogger {
  private logs: GenerationLog[] = [];
  
  log(result: GenerationResult, template: CodeTemplate): void {
    this.logs.push({
      timestamp: new Date(),
      templateId: template.id,
      gradeLevel: template.gradeLevel,
      mode: result.mode,
      success: result.success,
      durationMs: result.generationTimeMs,
      attempts: result.totalAttempts,
      errors: result.errors.map(e => e.type),
      recoveries: result.appliedRecoveries.map(r => r.strategy)
    });
  }
  
  getStats(): {
    totalGenerations: number;
    successRate: number;
    avgDuration: number;
    recoveryRate: number;
    commonErrors: { type: string; count: number }[];
  } {
    const total = this.logs.length;
    const successes = this.logs.filter(l => l.success).length;
    const recoveries = this.logs.filter(l => l.mode !== 'full' && l.success).length;
    
    const errorCounts = new Map<string, number>();
    for (const log of this.logs) {
      for (const error of log.errors) {
        errorCounts.set(error, (errorCounts.get(error) ?? 0) + 1);
      }
    }
    
    return {
      totalGenerations: total,
      successRate: successes / total,
      avgDuration: this.logs.reduce((sum, l) => sum + l.durationMs, 0) / total,
      recoveryRate: recoveries / successes,
      commonErrors: Array.from(errorCounts.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
    };
  }
}
```
