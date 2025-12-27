# Solution-Driven Input Specification

## 1. Overview

Trong Solution-Driven approach, **Input** là một **Code Template** mô tả:
1. Code mẫu mà student cần viết
2. Parameters có thể random để tạo variations
3. Constraints để đảm bảo pedagogy

## 2. Input Format Options

### Option A: Simplified JSON (Recommended for V1)

```json
{
  "concept": "for_counted",
  "gradeLevel": "3-5",
  "code": "for i in 1 to $N { moveForward(); pickCrystal() }",
  "parameters": {
    "N": { "min": 3, "max": 8, "default": 5 }
  }
}
```

### Option B: Full Template (For Advanced Use)

```json
{
  "id": "for-simple-001",
  "name": "Collect Crystals in Line",
  "gradeLevel": "3-5",
  "concept": "for_counted",
  "difficulty": 2,
  
  "code": "for i in 1 to $N { moveForward(); pickCrystal() }",
  
  "parameters": {
    "N": { 
      "type": "int", 
      "min": 3, 
      "max": 8, 
      "default": 5,
      "description": "Number of crystals"
    }
  },
  
  "constraints": {
    "maxItems": 10,
    "noiseLevel": "none",
    "requiredItems": ["crystal"]
  },
  
  "studentFacing": {
    "title": "💎 Crystal Collector",
    "description": "Use a loop to collect all crystals",
    "hint": "How many times do you need to repeat?"
  }
}
```

### Option C: Block-Based (For Blockly Integration)

```json
{
  "concept": "for_counted",
  "gradeLevel": "3-5",
  "blocks": [
    {
      "type": "controls_repeat_ext",
      "fields": { "TIMES": { "param": "N", "min": 3, "max": 8 } },
      "inputs": {
        "DO": [
          { "type": "move_forward" },
          { "type": "pick_crystal" }
        ]
      }
    }
  ]
}
```

---

## 3. Concrete Input Examples

### 3.1 Simple FOR Loop (Grade 3-5)

**Input:**
```json
{
  "concept": "for_counted",
  "gradeLevel": "3-5",
  "code": "for i in 1 to $N { moveForward(); pickCrystal() }",
  "parameters": {
    "N": { "min": 3, "max": 8 }
  }
}
```

**Generated Map (when N=5):**
```
Start → C → C → C → C → C → End
         ─────────────────→
```

**Expected Student Code:**
```swift
for i in 1...5 {
    moveForward()
    collectCrystal()
}
```

---

### 3.2 Nested FOR Loop (Grade 6-8)

**Input:**
```json
{
  "concept": "nested_for",
  "gradeLevel": "6-8",
  "code": "for row in 1 to $ROWS { for col in 1 to $COLS { moveForward(); pickCrystal() } turnRight(); moveForward(); turnRight() }",
  "parameters": {
    "ROWS": { "min": 2, "max": 4 },
    "COLS": { "min": 3, "max": 5 }
  }
}
```

**Generated Map (when ROWS=3, COLS=4):**
```
Row 1:  Start → C → C → C → C ┐
                              ↓
Row 2:        C ← C ← C ← C ←─┘
              ↓
Row 3:        └→ C → C → C → C → End
```

**Expected Student Code:**
```swift
for row in 1...3 {
    for col in 1...4 {
        moveForward()
        collectCrystal()
    }
    turnRight()
    moveForward()
    turnRight()
}
```

---

### 3.3 Simple IF (Grade 3-5)

**Input:**
```json
{
  "concept": "if_simple",
  "gradeLevel": "3-5",
  "code": "for i in 1 to $N { moveForward(); if crystalAhead { pickCrystal() } }",
  "parameters": {
    "N": { "min": 5, "max": 10 }
  },
  "constraints": {
    "crystalProbability": 0.6
  }
}
```

**Generated Map (when N=6, crystals at positions 1,2,4,6):**
```
Start → C → C → - → C → - → C → End
        ✓   ✓       ✓       ✓
```

**Expected Student Code:**
```swift
for i in 1...6 {
    moveForward()
    if isOnCrystal {
        collectCrystal()
    }
}
```

---

### 3.4 IF-ELSE with Branch (Grade 6-8)

**Input:**
```json
{
  "concept": "if_else",
  "gradeLevel": "6-8",
  "code": "for i in 1 to $N { moveForward(); if crystalAhead { turnLeft(); moveForward(); pickCrystal(); turnRight(); moveForward(); turnRight(); moveForward(); turnLeft() } else { pickKey() } }",
  "parameters": {
    "N": { "min": 3, "max": 5 }
  },
  "constraints": {
    "crystalProbability": 0.5
  }
}
```

**Generated Map (showing branches):**
```
         C           C
         ↑           ↑
Start → [?] → K → [?] → K → End
         ↓           ↓
        (if crystal) (if crystal)
```

---

### 3.5 WHILE Loop with Terminator (Grade 6-8)

**Input:**
```json
{
  "concept": "while_condition",
  "gradeLevel": "6-8",
  "code": "while !atPortal { moveForward(); if crystalAhead { pickCrystal() } }",
  "parameters": {
    "pathLength": { "min": 5, "max": 12 }
  },
  "constraints": {
    "terminator": "portal",
    "terminatorPosition": "end"
  }
}
```

**Generated Map (when pathLength=8):**
```
Start → C → C → - → C → - → C → C → P (Portal)
```

**Expected Student Code:**
```swift
while !isAtPortal {
    moveForward()
    if isOnCrystal {
        collectCrystal()
    }
}
```

---

### 3.6 Function Definition (Grade 6-8)

**Input:**
```json
{
  "concept": "function_definition",
  "gradeLevel": "6-8",
  "code": "func turnAround() { turnRight(); turnRight() }; for i in 1 to $N { moveForward(); pickCrystal(); turnAround(); moveForward(); turnAround() }",
  "parameters": {
    "N": { "min": 3, "max": 6 }
  }
}
```

**Generated Map (N=4, back-and-forth pattern):**
```
Start → C → C → C → C
        ↔   ↔   ↔   ↔
       (back and forth at each)
```

**Expected Student Code:**
```swift
func turnAround() {
    turnRight()
    turnRight()
}

for i in 1...4 {
    moveForward()
    collectCrystal()
    turnAround()
    moveForward()
    turnAround()
}
```

---

### 3.7 Key-Gate Pattern (Grade 6-8)

**Input:**
```json
{
  "concept": "sequence_with_dependency",
  "gradeLevel": "6-8",
  "code": "for i in 1 to 3 { moveForward() }; pickKey(); for i in 1 to 3 { moveForward() }; openGate(); moveForward(); pickCrystal()",
  "parameters": {},
  "constraints": {
    "requiredItems": ["key", "gate", "crystal"],
    "itemOrder": ["key", "gate", "crystal"]
  }
}
```

**Generated Map:**
```
Start → - → - → - → K → - → - → - → G → C → End
                    ↑               ↑   ↑
                   Key            Gate Crystal
```

---

## 4. Input Validation

```typescript
interface InputValidation {
  /**
   * Validate input before generation
   */
  validate(input: TemplateInput): ValidationResult;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

// Example validation rules
const VALIDATION_RULES = {
  // Code must have at least one action
  hasActions: (input) => {
    const actions = ['moveForward', 'turnLeft', 'turnRight', 'pick', 'open'];
    return actions.some(a => input.code.includes(a));
  },
  
  // Parameters must be defined if used
  parametersComplete: (input) => {
    const usedParams = input.code.match(/\$(\w+)/g) ?? [];
    return usedParams.every(p => {
      const name = p.slice(1);
      return input.parameters[name] !== undefined;
    });
  },
  
  // Grade level constraints
  gradeAppropriate: (input) => {
    const concept = input.concept;
    const grade = input.gradeLevel;
    return ALLOWED_CONCEPTS[grade].includes(concept);
  }
};
```

---

## 5. Output Specification

### 5.1 Standard Output Format

Với **Standard Input**, output là một **GeneratedMap** chứa:

```typescript
interface GeneratedMapOutput {
  // === MAP DATA ===
  map: {
    // Dimensions
    size: { width: number; height: number };
    
    // Player start
    startPosition: Vector2;
    startDirection: 'NORTH' | 'EAST' | 'SOUTH' | 'WEST';
    
    // Goal/end
    goalPosition?: Vector2;
    
    // Items placed on map
    items: PlacedItem[];
    
    // Ground blocks (walkable tiles)
    groundBlocks: Vector2[];
    
    // Walls/obstacles (optional)
    obstacles?: Vector2[];
  };
  
  // === METADATA ===
  metadata: {
    // Template info
    templateId?: string;
    concept: PedagogyConcept;
    gradeLevel: GradeLevel;
    
    // Generation info
    seed: string;
    generatedAt: string;
    
    // Metrics
    complexity: number;
    optimalSteps: number;
    itemCount: number;
    pathLength: number;
  };
  
  // === SOLUTION (for validation) ===
  solution: {
    // Expected code
    expectedCode: string;
    
    // Step-by-step actions
    actions: Action[];
    
    // Path taken
    solutionPath: Vector2[];
  };
  
  // === PEDAGOGY INFO ===
  pedagogy: {
    // What this teaches
    concepts: PedagogyConcept[];
    
    // Difficulty
    difficulty: 1 | 2 | 3 | 4 | 5;
    
    // Estimated time
    estimatedMinutes: number;
    
    // Hints for student
    hints?: string[];
  };
}

interface PlacedItem {
  type: 'crystal' | 'key' | 'switch' | 'portal' | 'gate';
  position: Vector2;
  state?: any;  // e.g., switch on/off
}

interface Action {
  type: 'moveForward' | 'turnLeft' | 'turnRight' | 'collect' | 'interact';
  position: Vector2;
  direction: Direction;
  item?: string;
}
```

---

### 5.2 Concrete Example: Input → Output

#### Input:
```json
{
  "concept": "for_counted",
  "gradeLevel": "3-5",
  "code": "for i in 1 to $N { moveForward(); pickCrystal() }",
  "parameters": {
    "N": { "min": 3, "max": 8 }
  }
}
```

#### Output (when N is randomized to 5):
```json
{
  "map": {
    "size": { "width": 6, "height": 1 },
    "startPosition": { "x": 0, "y": 0 },
    "startDirection": "EAST",
    "goalPosition": { "x": 5, "y": 0 },
    "items": [
      { "type": "crystal", "position": { "x": 1, "y": 0 } },
      { "type": "crystal", "position": { "x": 2, "y": 0 } },
      { "type": "crystal", "position": { "x": 3, "y": 0 } },
      { "type": "crystal", "position": { "x": 4, "y": 0 } },
      { "type": "crystal", "position": { "x": 5, "y": 0 } }
    ],
    "groundBlocks": [
      { "x": 0, "y": 0 },
      { "x": 1, "y": 0 },
      { "x": 2, "y": 0 },
      { "x": 3, "y": 0 },
      { "x": 4, "y": 0 },
      { "x": 5, "y": 0 }
    ]
  },
  "metadata": {
    "concept": "for_counted",
    "gradeLevel": "3-5",
    "seed": "abc123",
    "generatedAt": "2025-12-27T09:15:00Z",
    "complexity": 8,
    "optimalSteps": 10,
    "itemCount": 5,
    "pathLength": 5
  },
  "solution": {
    "expectedCode": "for i in 1...5 {\n    moveForward()\n    collectCrystal()\n}",
    "actions": [
      { "type": "moveForward", "position": { "x": 1, "y": 0 }, "direction": "EAST" },
      { "type": "collect", "position": { "x": 1, "y": 0 }, "direction": "EAST", "item": "crystal" },
      { "type": "moveForward", "position": { "x": 2, "y": 0 }, "direction": "EAST" },
      { "type": "collect", "position": { "x": 2, "y": 0 }, "direction": "EAST", "item": "crystal" },
      { "type": "moveForward", "position": { "x": 3, "y": 0 }, "direction": "EAST" },
      { "type": "collect", "position": { "x": 3, "y": 0 }, "direction": "EAST", "item": "crystal" },
      { "type": "moveForward", "position": { "x": 4, "y": 0 }, "direction": "EAST" },
      { "type": "collect", "position": { "x": 4, "y": 0 }, "direction": "EAST", "item": "crystal" },
      { "type": "moveForward", "position": { "x": 5, "y": 0 }, "direction": "EAST" },
      { "type": "collect", "position": { "x": 5, "y": 0 }, "direction": "EAST", "item": "crystal" }
    ],
    "solutionPath": [
      { "x": 0, "y": 0 },
      { "x": 1, "y": 0 },
      { "x": 2, "y": 0 },
      { "x": 3, "y": 0 },
      { "x": 4, "y": 0 },
      { "x": 5, "y": 0 }
    ]
  },
  "pedagogy": {
    "concepts": ["for_counted", "sequence"],
    "difficulty": 2,
    "estimatedMinutes": 3,
    "hints": [
      "Count how many crystals you need to collect",
      "Use a for loop to repeat the same actions"
    ]
  }
}
```

---

### 5.3 Visual Representation

```
MAP LAYOUT:
┌───┬───┬───┬───┬───┬───┐
│ S │ C │ C │ C │ C │ C │
│ → │   │   │   │   │   │
└───┴───┴───┴───┴───┴───┘
  0   1   2   3   4   5

S = Start (facing East →)
C = Crystal

EXPECTED CODE:
┌────────────────────────────────┐
│ for i in 1...5 {               │
│     moveForward()              │
│     collectCrystal()           │
│ }                              │
└────────────────────────────────┘
```

---

### 5.4 Nested FOR Loop Output Example

#### Input:
```json
{
  "concept": "nested_for",
  "gradeLevel": "6-8",
  "code": "for row in 1 to $ROWS { for col in 1 to $COLS { moveForward(); pickCrystal() } turnRight(); moveForward(); turnRight() }",
  "parameters": {
    "ROWS": { "min": 2, "max": 4 },
    "COLS": { "min": 3, "max": 5 }
  }
}
```

#### Output (when ROWS=3, COLS=4):
```json
{
  "map": {
    "size": { "width": 5, "height": 3 },
    "startPosition": { "x": 0, "y": 0 },
    "startDirection": "EAST",
    "items": [
      { "type": "crystal", "position": { "x": 1, "y": 0 } },
      { "type": "crystal", "position": { "x": 2, "y": 0 } },
      { "type": "crystal", "position": { "x": 3, "y": 0 } },
      { "type": "crystal", "position": { "x": 4, "y": 0 } },
      { "type": "crystal", "position": { "x": 4, "y": 1 } },
      { "type": "crystal", "position": { "x": 3, "y": 1 } },
      { "type": "crystal", "position": { "x": 2, "y": 1 } },
      { "type": "crystal", "position": { "x": 1, "y": 1 } },
      { "type": "crystal", "position": { "x": 1, "y": 2 } },
      { "type": "crystal", "position": { "x": 2, "y": 2 } },
      { "type": "crystal", "position": { "x": 3, "y": 2 } },
      { "type": "crystal", "position": { "x": 4, "y": 2 } }
    ],
    "groundBlocks": [
      { "x": 0, "y": 0 }, { "x": 1, "y": 0 }, { "x": 2, "y": 0 }, { "x": 3, "y": 0 }, { "x": 4, "y": 0 },
      { "x": 4, "y": 1 }, { "x": 3, "y": 1 }, { "x": 2, "y": 1 }, { "x": 1, "y": 1 }, { "x": 0, "y": 1 },
      { "x": 0, "y": 2 }, { "x": 1, "y": 2 }, { "x": 2, "y": 2 }, { "x": 3, "y": 2 }, { "x": 4, "y": 2 }
    ]
  },
  "metadata": {
    "concept": "nested_for",
    "gradeLevel": "6-8",
    "complexity": 22,
    "optimalSteps": 24,
    "itemCount": 12,
    "pathLength": 14
  },
  "solution": {
    "expectedCode": "for row in 1...3 {\n    for col in 1...4 {\n        moveForward()\n        collectCrystal()\n    }\n    turnRight()\n    moveForward()\n    turnRight()\n}"
  },
  "pedagogy": {
    "concepts": ["nested_for", "for_counted", "grid_pattern"],
    "difficulty": 3,
    "estimatedMinutes": 5
  }
}
```

#### Visual:
```
MAP LAYOUT:
┌───┬───┬───┬───┬───┐
│ S │ C │ C │ C │ C │  Row 1: →→→→
│ → │   │   │   │ ↓ │
├───┼───┼───┼───┼───┤
│ ↓ │ C │ C │ C │ C │  Row 2: ←←←←
│   │   │   │   │ ← │
├───┼───┼───┼───┼───┤
│   │ C │ C │ C │ C │  Row 3: →→→→
│ → │   │   │   │   │
└───┴───┴───┴───┴───┘

Total crystals: 3 rows × 4 cols = 12
```

---

### 5.5 Output Variations

Có thể generate nhiều variations từ cùng input:

```typescript
// Generate 10 variations
const variations = await generator.generateVariations(input, count: 10);

// Each variation has different parameter values
variations[0].metadata.seed === "seed-001"  // N=5
variations[1].metadata.seed === "seed-002"  // N=3
variations[2].metadata.seed === "seed-003"  // N=7
// ...
```

---

## 6. Minimal Input → Full Generation

### Quick Start: Minimal Input

```json
{
  "code": "for i in 1 to 5 { moveForward(); pickCrystal() }"
}
```

### System Auto-Infers:
- `concept`: `for_counted` (detected from `for...to`)
- `gradeLevel`: `3-5` (based on complexity)
- `parameters`: `{}` (no $PARAMS found)
- `constraints`: defaults for grade level

### Output:
```json
{
  "map": {
    "size": { "width": 6, "height": 1 },
    "startPosition": { "x": 0, "y": 0 },
    "startDirection": "EAST",
    "items": [
      { "type": "crystal", "position": { "x": 1, "y": 0 } },
      { "type": "crystal", "position": { "x": 2, "y": 0 } },
      { "type": "crystal", "position": { "x": 3, "y": 0 } },
      { "type": "crystal", "position": { "x": 4, "y": 0 } },
      { "type": "crystal", "position": { "x": 5, "y": 0 } }
    ],
    "groundBlocks": [
      { "x": 0, "y": 0 }, { "x": 1, "y": 0 }, { "x": 2, "y": 0 },
      { "x": 3, "y": 0 }, { "x": 4, "y": 0 }, { "x": 5, "y": 0 }
    ]
  },
  "metadata": {
    "concept": "for_counted",
    "complexity": 8,
    "optimalSteps": 10,
    "crystalCount": 5
  }
}
```

---

## 6. Input Schema (TypeScript)

```typescript
/**
 * Minimal input - just code
 */
interface MinimalInput {
  code: string;
}

/**
 * Standard input - with parameters
 */
interface StandardInput extends MinimalInput {
  concept?: PedagogyConcept;
  gradeLevel?: GradeLevel;
  parameters?: Record<string, ParameterRange>;
}

/**
 * Full input - complete template
 */
interface FullInput extends StandardInput {
  id?: string;
  name?: string;
  constraints?: GenerationConstraints;
  studentFacing?: StudentFacingInfo;
}

/**
 * Parameter range definition
 */
interface ParameterRange {
  min: number;
  max: number;
  default?: number;
  step?: number;
}

/**
 * Unified input type
 */
type TemplateInput = MinimalInput | StandardInput | FullInput;

/**
 * Normalize any input to full template
 */
function normalizeInput(input: TemplateInput): FullInput {
  // Start with defaults
  const result: FullInput = {
    code: input.code,
    concept: inferConcept(input.code),
    gradeLevel: inferGradeLevel(input.code),
    parameters: {},
    constraints: {}
  };
  
  // Override with provided values
  if ('concept' in input) result.concept = input.concept;
  if ('gradeLevel' in input) result.gradeLevel = input.gradeLevel;
  if ('parameters' in input) result.parameters = input.parameters;
  if ('constraints' in input) result.constraints = input.constraints;
  
  // Auto-extract parameters from code
  const extractedParams = extractParameters(input.code);
  result.parameters = { ...extractedParams, ...result.parameters };
  
  // Apply grade-level defaults
  const gradeDefaults = GRADE_DEFAULTS[result.gradeLevel!];
  result.constraints = { ...gradeDefaults, ...result.constraints };
  
  return result;
}
```

---

## 7. UI Integration Example

```typescript
// In map-builder-app, user fills a form:
interface MapGeneratorForm {
  concept: PedagogyConcept;      // Dropdown
  gradeLevel: GradeLevel;        // Dropdown
  codeTemplate: string;          // Code editor
  parameterOverrides: Record<string, number>;  // Sliders
}

// On submit:
async function generateMap(form: MapGeneratorForm) {
  const input: StandardInput = {
    code: form.codeTemplate,
    concept: form.concept,
    gradeLevel: form.gradeLevel,
    parameters: extractParameters(form.codeTemplate)
  };
  
  // Apply user's parameter overrides
  for (const [name, value] of Object.entries(form.parameterOverrides)) {
    input.parameters[name] = { min: value, max: value };
  }
  
  // Generate
  const result = await solutionDrivenGenerator.generate(input);
  
  if (result.success) {
    displayMap(result.map);
  } else {
    showError(result.errors);
  }
}
```

---

## 8. Summary: Recommended Input Format

| Scenario | Input Format | Example |
|----------|--------------|---------|
| Quick prototype | Minimal (just code) | `{ "code": "..." }` |
| Production template | Standard (code + params) | `{ "code": "...", "parameters": {...} }` |
| Full curriculum | Full (complete template) | Full JSON with all fields |
| Blockly integration | Block-based | Block tree JSON |

**Recommendation cho V1:** Bắt đầu với **Standard Input** format - đủ flexible mà không quá phức tạp.
