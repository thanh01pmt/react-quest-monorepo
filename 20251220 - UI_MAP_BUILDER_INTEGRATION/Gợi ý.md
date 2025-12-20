# Map Builder Tool - Feature Specification

## 🎯 TỔNG QUAN TÍNH NĂNG

### Core Principles
1. **Pedagogy-First Design**: Mọi tính năng đều phục vụ mục tiêu sư phạm
2. **Visual + Intelligent**: Kết hợp chỉnh sửa trực quan với tự động hóa thông minh
3. **Iterative Refinement**: Tạo nhanh → Kiểm tra → Tinh chỉnh → Xuất bản

---

## 📋 PHẦN 1: CORE FEATURES

### 1.1 Canvas / 3D Map Editor

#### A. Visual Editing
```
Tính năng:
├── 3D Grid Visualization
│   ├── Orbital camera controls (zoom, pan, rotate)
│   ├── Grid snapping (1x1, 0.5x0.5)
│   ├── Multiple view modes (Top, Side, Isometric, Free)
│   └── Grid size presets (10x10, 15x15, 20x20)
│
├── Path Drawing
│   ├── Click-to-place waypoints
│   ├── Auto-connect consecutive points
│   ├── Path smoothing / corner detection
│   ├── Path validation (no overlaps, no gaps)
│   └── Visual feedback (valid=green, invalid=red)
│
├── Item Placement
│   ├── Drag-and-drop items (crystal, switch, gem, key)
│   ├── Snap to path positions
│   ├── Bulk placement tools
│   │   ├── Pattern brush (repeat pattern along path)
│   │   ├── Fill tool (place items at interval)
│   │   └── Random scatter (with density control)
│   └── Item counter (shows count per type)
│
└── Object Manipulation
    ├── Select (single / multi-select with box)
    ├── Move (drag or arrow keys)
    ├── Rotate (for directional objects)
    ├── Delete (Del key or trash icon)
    └── Duplicate (Ctrl+D)
```

#### B. Topology Templates
```
Tính năng:
├── Template Gallery
│   ├── Categorized by pedagogy
│   │   ├── Function Reuse (Plus, Star, H)
│   │   ├── Conditionals (T, F)
│   │   ├── Loops (Spiral, Grid, Zigzag)
│   │   └── Mixed (Complex Maze, Islands)
│   │
│   ├── Preview cards
│   │   ├── 3D thumbnail
│   │   ├── Name + description
│   │   ├── Pedagogy tags
│   │   └── Difficulty badge
│   │
│   └── One-click instantiation
│       ├── "Use Template" → loads to canvas
│       ├── Parameterized generation
│       │   ├── arm_length (for Plus/T/L)
│       │   ├── num_turns (for Spiral)
│       │   ├── grid_size (for Grid/Maze)
│       │   └── branch_count (for Star)
│       └── Preserves semantic positions
│
├── Template Customization
│   ├── Adjust parameters via sliders
│   ├── Real-time preview update
│   └── "Apply Changes" → regenerate
│
└── Save as Template
    ├── Export current map as custom template
    ├── Define parameters (what's adjustable)
    └── Share to team library
```

#### C. Layer System
```
Tính năng:
├── Layer Types
│   ├── Path Layer (walkable cells)
│   ├── Items Layer (collectibles)
│   ├── Obstacles Layer (walls, holes)
│   ├── Annotations Layer (notes, highlights)
│   └── Solution Layer (optimal path overlay)
│
├── Layer Controls
│   ├── Show/Hide toggle per layer
│   ├── Lock/Unlock (prevent accidental edits)
│   ├── Opacity control (0-100%)
│   └── Reorder layers (drag to change z-index)
│
└── Smart Layers
    ├── Auto-sync (Items layer snaps to Path layer)
    ├── Conflict detection (Items on non-path cells → warning)
    └── Layer-based filtering (hide non-relevant items)
```

---

### 1.2 Pedagogy Panel (Academic Control)

#### A. Learning Objectives
```
Tính năng:
├── Curriculum Alignment
│   ├── Select target topic
│   │   ├── Dropdown: Functions, Loops, Conditionals, etc.
│   │   ├── Auto-suggests matching topologies
│   │   └── Shows example maps for reference
│   │
│   ├── Bloom Level Selection
│   │   ├── Radio buttons: Remember → Create
│   │   ├── Auto-adjusts complexity
│   │   │   ├── Remember: Simple patterns, no breaks
│   │   │   ├── Apply: Standard patterns
│   │   │   ├── Analyze: Gap fixes, conditionals
│   │   │   └── Create: Complex nested structures
│   │   └── Live preview of expected challenge level
│   │
│   └── Difficulty Tuning
│       ├── Slider: Easy → Medium → Hard
│       ├── Affects:
│       │   ├── Path length
│       │   ├── Item density
│       │   ├── Pattern complexity
│       │   └── Number of item types
│       └── Shows estimated completion time
│
├── Core Skills Checklist
│   ├── Multi-select required skills
│   │   ├── CMD_MOVE_FORWARD
│   │   ├── CMD_TURN_LEFT/RIGHT
│   │   ├── FUNC_DEFINE_SIMPLE
│   │   ├── FUNC_DEFINE_NESTED
│   │   ├── LOOP_FOR_FIXED
│   │   ├── LOOP_WHILE_CONDITION
│   │   ├── LOGIC_IF_ELSE
│   │   └── VAR_COUNTER
│   │
│   ├── Auto-validation
│   │   ├── Checks if map forces required skills
│   │   ├── ⚠️ Warning if skill not exercised
│   │   └── ✅ Green check when validated
│   │
│   └── Skill-to-Pattern mapping
│       └── Suggests patterns that require each skill
│
└── Solution Requirements
    ├── Item Goals
    │   ├── Crystal: All / N items / ≥N items
    │   ├── Switch: All / Specific sequence
    │   ├── Gem: Optional / Required
    │   └── Key: Required for doors
    │
    ├── Function Constraints
    │   ├── Number of functions allowed (1-5)
    │   ├── Function names (pedagogically meaningful)
    │   ├── Nested depth limit (0-3)
    │   └── Parameter requirements
    │
    └── Loop Constraints
        ├── Loop types allowed (for/while/both)
        ├── Max iterations hint
        └── Variable usage requirements
```

#### B. Pedagogical Strategy Selector
```
Tính năng:
├── Strategy Presets
│   ├── Function Reuse
│   │   ├── Description: "Teach procedural abstraction"
│   │   ├── Auto-applies: force_identical_patterns = True
│   │   ├── Recommended for: Plus, Star, H shapes
│   │   └── Preview: Shows all branches with same pattern
│   │
│   ├── Conditional Branching
│   │   ├── Description: "Teach if/else decision making"
│   │   ├── Auto-applies: Creates decoy vs goal branches
│   │   ├── Recommended for: T, F shapes
│   │   └── Preview: Highlights decision point
│   │
│   ├── While Loop Decreasing
│   │   ├── Description: "Teach while with decrementing counter"
│   │   ├── Auto-applies: density_trend = "decreasing"
│   │   ├── Recommended for: Spiral, Shrinking Grid
│   │   └── Preview: Shows density gradient
│   │
│   ├── Variable Rate Change
│   │   ├── Description: "Teach variable spacing/acceleration"
│   │   ├── Auto-applies: variable_spacing = [1,2,3] or [3,2,1]
│   │   ├── Recommended for: V, S shapes
│   │   └── Preview: Shows spacing changes
│   │
│   ├── Nested Loops
│   │   ├── Description: "Teach loop inside loop"
│   │   ├── Auto-applies: min_diversity = 3, force_pattern_breaks
│   │   ├── Recommended for: Grid, 2D Maze
│   │   └── Preview: Shows nested structure
│   │
│   ├── Pattern Recognition
│   │   ├── Description: "Teach identifying repeating patterns"
│   │   ├── Auto-applies: force_identical_patterns across segments
│   │   ├── Recommended for: Zigzag, S shape
│   │   └── Preview: Highlights repeated pattern
│   │
│   └── Backtracking
│       ├── Description: "Teach exploring dead ends"
│       ├── Auto-applies: Creates tempting dead ends with items
│       ├── Recommended for: Maze, F shape
│       └── Preview: Marks dead ends vs main path
│
├── Strategy Customization
│   ├── Override auto-settings if needed
│   ├── Mix multiple strategies (advanced)
│   └── Save custom strategy preset
│
└── Strategy Validation
    ├── Real-time check: Does map implement strategy?
    ├── Visual indicators:
    │   ├── ✅ Strategy fully implemented
    │   ├── ⚠️ Partial implementation (with suggestions)
    │   └── ❌ Strategy conflicts with current layout
    └── Fix suggestions (clickable auto-fix)
```

#### C. Teaching Concepts Tracker
```
Tính năng:
├── Concept Coverage Matrix
│   ├── Lists all concepts teachable by topology
│   │   ├── Procedural Abstraction
│   │   ├── Radial Exploration
│   │   ├── Decision Points
│   │   ├── Spiral Algorithm
│   │   ├── Variable Spacing
│   │   └── etc.
│   │
│   ├── Shows which concepts are currently taught
│   │   ├── ✅ Explicitly taught (primary concept)
│   │   ├── ⚠️ Indirectly taught (secondary)
│   │   └── ❌ Not taught (suggestion to add)
│   │
│   └── Heatmap view
│       └── Color intensity = teaching emphasis
│
├── Concept-to-Feature Mapping
│   ├── Click concept → highlights relevant parts of map
│   │   ├── "Procedural Abstraction" → highlights all branches
│   │   ├── "Decision Point" → highlights junction
│   │   └── "Variable Spacing" → shows spacing annotations
│   │
│   └── Reverse mapping
│       └── Click map element → shows concepts taught
│
└── Concept Balancing
    ├── Warning if too many concepts (cognitive overload)
    ├── Suggestion to focus on 1-2 primary concepts
    └── Option to split into multiple maps
```

---

### 1.3 Smart Placement Engine

#### A. Auto-Generate Features
```
Tính năng:
├── Full Auto-Generation
│   ├── Input: Pedagogy settings only
│   ├── Process:
│   │   ├── Selects optimal topology
│   │   ├── Generates path with semantic positions
│   │   ├── Applies pedagogical strategy
│   │   ├── Places items intelligently
│   │   └── Generates solution
│   ├── Output: Complete playable map
│   └── User can then refine manually
│
├── Partial Auto-Generation
│   ├── "Auto-place Items" (keep path as-is)
│   │   ├── Analyzes path structure
│   │   ├── Detects segments, corners, branches
│   │   ├── Applies selected strategy
│   │   └── Places items optimally
│   │
│   ├── "Auto-fix Path" (optimize existing path)
│   │   ├── Detects suboptimal sections
│   │   ├── Suggests improvements
│   │   ├── One-click apply or manual review
│   │   └── Preserves semantic positions
│   │
│   └── "Re-generate Solution" (keep everything else)
│       └── Recalculates optimal solution for current layout
│
├── Pattern Library Browser
│   ├── Shows all available patterns
│   │   ├── Filtered by logic_type (function/for/while)
│   │   ├── Preview of pattern sequence
│   │   ├── Diversity score badge
│   │   └── Metadata (min_length, requires_corner)
│   │
│   ├── Pattern Suggestion
│   │   ├── Given current path segment
│   │   ├── Shows top 3 best-fit patterns
│   │   ├── Explains why (diversity, fit, pedagogy)
│   │   └── Click to apply
│   │
│   └── Pattern Tester
│       ├── Select pattern + segment
│       ├── Preview placement (ghost items)
│       ├── Shows resulting solution code
│       └── "Apply" or "Try Another"
│
└── Density Control
    ├── Global density slider (sparse ←→ dense)
    ├── Per-zone density override
    │   ├── Select zone on canvas
    │   ├── Set zone-specific density
    │   └── Visual heatmap of density
    │
    └── Smart density (follows pedagogy)
        ├── Function Reuse: uniform across branches
        ├── While Loop: decreasing toward goal
        ├── Nested Loop: higher in sub-grids
        └── Pattern Recognition: consistent spacing
```

#### B. Manual Placement Assistance
```
Tính năng:
├── Smart Snap
│   ├── Items snap to valid positions only
│   ├── Highlights valid positions when dragging
│   ├── Shows "forbidden zones" (non-path cells)
│   └── Snap-to-pattern (align with existing items)
│
├── Placement Hints
│   ├── Hover over position → shows suggestion
│   │   ├── "Good for crystal" (matches pattern)
│   │   ├── "Switch recommended" (semantic position)
│   │   └── "Already dense" (density warning)
│   │
│   └── Context menu
│       ├── Right-click position → "What should go here?"
│       └── Shows top 3 suggestions with reasoning
│
├── Conflict Detection
│   ├── Real-time validation as you place
│   ├── Warnings:
│   │   ├── "Item blocks optimal path"
│   │   ├── "Density too high (>80%)"
│   │   ├── "Pattern inconsistency"
│   │   └── "Breaks pedagogical strategy"
│   │
│   └── Auto-fix suggestions
│       └── Click warning → shows fix options
│
└── Batch Operations
    ├── "Fill selected segment with pattern"
    │   ├── Select segment on canvas
    │   ├── Choose pattern from library
    │   └── Auto-places items
    │
    ├── "Replicate across branches"
    │   ├── Place items on one branch
    │   ├── Click "Replicate" → applies to all branches
    │   └── Ensures function_reuse pedagogy
    │
    └── "Mirror placement"
        ├── For symmetric topologies (U, V, H)
        ├── Place items on one side
        └── Auto-mirrors to other side
```

---

### 1.4 Solution Generator & Path Optimizer

#### A. Auto-Solution Generation
```
Tính năng:
├── Generate Optimal Solution
│   ├── Finds shortest valid path
│   ├── Collects all required items
│   ├── Activates switches in correct order
│   ├── Respects item_goals constraints
│   └── Outputs:
│       ├── Action sequence (move, collect, toggle)
│       ├── Estimated steps count
│       ├── Function structure (if applicable)
│       └── Loop structure (if applicable)
│
├── Generate Pedagogical Solution
│   ├── Not shortest, but teaches target concept
│   ├── Example: Function Reuse
│   │   ├── Forces calling explore_branch() 4 times
│   │   ├── Even if direct path exists
│   │   └── Highlights procedural abstraction
│   │
│   ├── Example: Nested Loop
│   │   ├── Forces row-by-row iteration
│   │   ├── Even if zigzag is shorter
│   │   └── Teaches nested structure
│   │
│   └── Comparison view
│       ├── Shows optimal vs pedagogical side-by-side
│       └── Explains trade-offs
│
├── Multiple Solution Variants
│   ├── Generate N different valid solutions
│   ├── Compare complexity (steps, functions, loops)
│   ├── Select best for learning objective
│   └── Save alternatives for testing
│
└── Solution Validation
    ├── Checks if solution is achievable
    ├── Simulates execution step-by-step
    ├── Detects impossible states
    │   ├── Unreachable items
    │   ├── Missing required switches
    │   └── Infinite loops
    └── Provides fix suggestions
```

#### B. Path Visualization & Analysis
```
Tính năng:
├── Optimal Path Overlay
│   ├── Shows solution path on canvas
│   ├── Color-coded by action type
│   │   ├── Blue: move_forward
│   │   ├── Green: collect
│   │   ├── Orange: toggle_switch
│   │   └── Red: conditional branch
│   │
│   ├── Step counter overlay
│   │   ├── Numbers on each position (1, 2, 3...)
│   │   └── Shows execution order
│   │
│   └── Animation player
│       ├── Play button → animates solution
│       ├── Speed control (0.5x, 1x, 2x)
│       ├── Pause/Resume
│       └── Step forward/backward
│
├── Path Metrics Dashboard
│   ├── Total steps: 45
│   ├── Items collected: 12/12 crystals, 3/3 switches
│   ├── Functions used: 1 (explore_branch)
│   ├── Loops: 4 repetitions
│   ├── Complexity score: Medium (based on nesting)
│   └── Estimated solve time: 3-5 minutes
│
├── Path Comparison
│   ├── Compare multiple solutions
│   ├── Metrics comparison table
│   │   ├── Steps: 45 vs 38 vs 52
│   │   ├── Functions: 1 vs 2 vs 0
│   │   ├── Pedagogical value: High vs Medium vs Low
│   │   └── Recommended: Solution 1 (best pedagogy)
│   │
│   └── Visual diff
│       └── Overlay paths with different colors
│
└── Hotspot Analysis
    ├── Identifies "busy" areas (many traversals)
    ├── Identifies "dead ends" (never visited)
    ├── Heatmap visualization
    │   ├── Red: high traffic
    │   ├── Yellow: medium
    │   └── Blue: low/none
    └── Optimization suggestions
        └── "Dead end detected: add item or remove"
```

#### C. Path Optimization Tools
```
Tính năng:
├── Simplify Path
│   ├── Removes unnecessary detours
│   ├── Straightens zigzags (if pedagogically OK)
│   ├── Merges redundant segments
│   └── Preserves semantic positions
│
├── Balance Path
│   ├── Equalizes branch lengths (for function reuse)
│   ├── Distributes items evenly
│   ├── Adjusts density gradients
│   └── One-click apply
│
├── Validate Topology Integrity
│   ├── Checks all semantic positions exist
│   ├── Verifies path connectivity
│   ├── Ensures no isolated sections
│   └── Flags violations with visual markers
│
└── Export Path Data
    ├── JSON format (coordinates + metadata)
    ├── Python code (for topology testing)
    ├── 3D model (OBJ/FBX for game engine)
    └── Curriculum document (learning objectives)
```

---

### 1.5 Bug Injection System

#### A. Manual Bug Creation
```
Tính năng:
├── Bug Type Library
│   ├── Syntax Bugs (for debugging challenges)
│   │   ├── Missing semicolon
│   │   ├── Unclosed bracket
│   │   ├── Typo in function name
│   │   └── Wrong operator
│   │
│   ├── Logic Bugs (for analysis challenges)
│   │   ├── Off-by-one error
│   │   │   └── Example: loop 3 times instead of 4
│   │   ├── Wrong direction (turn_left vs turn_right)
│   │   ├── Missing collect action
│   │   ├── Incorrect condition (< vs <=)
│   │   └── Infinite loop (missing decrement)
│   │
│   ├── Placement Bugs (map-level)
│   │   ├── Remove 1 required item
│   │   ├── Add extra switch (confusing)
│   │   ├── Move item to unreachable position
│   │   └── Swap item types
│   │
│   └── Pedagogical Bugs (teaching-specific)
│       ├── Break pattern consistency (for pattern recognition)
│       ├── Remove branch symmetry (for function reuse)
│       ├── Invert density gradient (for while loop)
│       └── Block optimal path (for problem solving)
│
├── Bug Placement Interface
│   ├── "Add Bug" button → opens bug wizard
│   ├── Step 1: Select bug type category
│   ├── Step 2: Choose specific bug
│   ├── Step 3: Set bug parameters
│   │   ├── Severity: Minor / Moderate / Critical
│   │   ├── Visibility: Obvious / Subtle / Hidden
│   │   └── Hint level: None / Vague / Specific
│   │
│   ├── Step 4: Preview bug effect
│   │   ├── Shows before/after comparison
│   │   ├── Highlights affected area on canvas
│   │   └── Explains expected student behavior
│   │
│   └── Step 5: Apply bug
│       ├── Marks as "bug version" (separate from clean version)
│       └── Generates bug report (for solution key)
│
└── Bug Management
    ├── Bug list panel
    │   ├── Shows all bugs in current map
    │   ├── Each bug entry has:
    │   │   ├── Type + description
    │   │   ├── Location (highlight on canvas)
    │   │   ├── Severity badge
    │   │   └── Expected fix
    │   │
    │   ├── Edit/Remove bug
    │   └── Toggle bug on/off (for A/B testing)
    │
    └── Bug verification
        ├── Test if bug is solvable
        ├── Check if fix is unique (only one correct fix)
        └── Validate hint sufficiency
```

#### B. Intelligent Auto-Bug Generation
```
Tính năng:
├── Context-Aware Bug Injection
│   ├── Analyzes map structure
│   ├── Identifies "bug-able" points
│   │   ├── Loop repetition counts
│   │   ├── Conditional branches
│   │   ├── Item collection points
│   │   └── Function calls
│   │
│   ├── Suggests bugs appropriate for Bloom level
│   │   ├── Remember/Apply: Syntax bugs
│   │   ├── Analyze: Logic bugs
│   │   └── Evaluate: Pedagogical bugs
│   │
│   └── Generates bug with:
│       ├── Bug code (incorrect solution)
│       ├── Fix code (correct solution)
│       ├── Hint progression (3 levels)
│       └── Explanation (why it's wrong)
│
├── Bug Difficulty Calibration
│   ├── Easy bugs:
│   │   ├── Obvious location (clearly marked)
│   │   ├── Single fix needed
│   │   ├── Error message available
│   │   └── Example: Missing 1 collect action
│   │
│   ├── Medium bugs:
│   │   ├── Requires analysis
│   │   ├── Multiple fix candidates
│   │   ├── Vague error message
│   │   └── Example: Loop 3 times instead of 4
│   │
│   └── Hard bugs:
│       ├── No error message (silent failure)
│       ├── Non-obvious location
│       ├── Requires understanding pedagogy
│       └── Example: Pattern inconsistency across branches
│
├── Multi-Bug Scenarios
│   ├── Generate N bugs at once
│   ├── Options:
│   │   ├── Independent bugs (each can be fixed separately)
│   │   ├── Cascading bugs (fix A to see B)
│   │   └── Interacting bugs (both must be fixed)
│   │
│   ├── Complexity management
│   │   ├── Warning if too many bugs
│   │   └── Suggests splitting into multiple challenges
│   │
│   └── Solution tree
│       └── Shows all possible fix sequences
│
└── Bug Templates
    ├── Saved bug patterns for reuse
    │   ├── "Off-by-one in Plus Shape"
    │   ├── "Missing branch in T Shape"
    │   ├── "Inverted spiral density"
    │   └── Custom templates
    │
    ├── Apply template to new map
    │   ├── Adapts to map structure
    │   └── Preserves bug characteristics
    │
    └── Share bug templates
        └── Team library of proven bugs
```

#### C. Bug Testing & Validation
```
Tính năng:
├── Bug Solvability Check
│   ├── Simulates student attempting to solve
│   ├── Checks if bug is:
│   │   ├── Detectable (student can notice it)
│   │   ├── Diagnosable (student can identify cause)
│   │   ├── Fixable (student can correct it)
│   │   └── Verifiable (fix is unambiguous)
│   │
│   └── Flags problematic bugs
│       ├── "Bug too subtle" → increase visibility
│       ├── "Multiple valid fixes" → narrow scope
│       └── "Unsolvable" → adjust or remove
│
├── Expected Misconceptions Tracker
│   ├── Lists common student mistakes for bug type
│   ├── Example: Loop off-by-one
│   │   ├── Misconception 1: "Loop should be 5, not 4"
│   │   ├── Misconception 2: "Need to add break statement"
│   │   └── Misconception 3: "Function is wrong, not loop"
│   │
│   ├── For each misconception:
│   │   ├── Likelihood (based on data)
│   │   ├── Hint that addresses it
│   │   └── Teaching moment explanation
│   │
│   └── Use for:
│       ├── Hint generation
│       ├── Assessment design
│       └── Teacher dashboard insights
│
└── Bug Impact Analysis
    ├── Simulates bug execution
    ├── Shows:
    │   ├── Where execution fails (visual on canvas)
    │   ├── What goes wrong (missing items, wrong path)
    │   ├── Why it fails (pedagogical reason)
    │   └── How to fix (step-by-step guide)
    │
    └── Exports:
        ├── Bug report (for teacher)
        ├── Hint sequence (for students)
        └── Solution key (for auto-grading)
```

---

## 📋 PHẦN 2: INSPECTOR & PROPERTIES

### 2.1 Map Properties Inspector
```
Tính năng:
├── Basic Info
│   ├── Map Name (editable)
│   ├── Description (multi-line)
│   ├── Author
│   ├── Created/Modified dates
│   └── Version number
│
├── Topology Info (Read-Only)
│   ├── Type: Plus Shape
│   ├── Category: Hub-Spoke
│   ├── Complexity Score: 7/10
│   └── Recommended for: Grades 3-4
│
├── Academic Metadata
│   ├── Topic: Functions
│   ├── Bloom Level: Apply + Create
│   ├── Difficulty: Medium
│   ├── Core Skills: [FUNC_DEFINE_SIMPLE, CMD_MOVE]
│   ├── Estimated Time: 5-7 minutes
│   └── Prerequisite Maps: [Map A, Map B]
│
├── Path Statistics
│   ├── Total Path Length: 45 cells
│   ├── Segments: 5 (4 branches + center)
│   ├── Corners: 8
│   ├── Longest Segment: 12 cells
│   ├── Shortest Segment: 8 cells
│   └── Semantic Positions: 5 defined
│
├── Item Statistics
│   ├── Crystals: 12 (density: 27%)
│   ├── Switches: 3 (density: 7%)
│   ├── Gems: 0
│   ├── Keys: 0
│   └── Total Density: 33%
│
└── Solution Statistics
    ├── Optimal Steps: 52
    ├── Pedagogical Steps: 58
    ├── Functions: 1 (explore_branch)
    ├── Loops: for × 4
    ├── Conditionals: 0
    └── Complexity: Medium
```

### 2.2 Selected Object Inspector
```
Tính năng:
├── When Path Cell Selected
│   ├── Position: (5, 0, 3)
│   ├── Segment: Segment 2
│   ├── Step Number: 12 (in solution)
│   ├── Has Item: Yes (Crystal)
│   ├── Is Corner: No
│   ├── Is Semantic Position: Yes (center)
│   └── Actions:
│       ├── Add Item Here
│       ├── Remove from Path
│       └── Mark as Waypoint
│
├── When Item Selected
│   ├── Type: Crystal
│   ├── Position: (5, 0, 3)
│   ├── ID: crystal_007
│   ├── Collection Order: 7th
│   ├── Pattern: PATTERN_MCT_3 (2nd in sequence)
│   ├── Pedagogical Role: Reinforces function reuse
│   └── Actions:
│       ├── Change Type
│       ├── Move
│       ├── Delete
│       └── Duplicate
│
├── When Segment Selected
│   ├── Segment: 2
│   ├── Name: Right Branch
│   ├── Length: 10 cells
│   ├── Items: 3 crystals
│   ├── Pattern Applied: PATTERN_MCT_3
│   ├── Pedagogical Strategy: Function Reuse
│   └── Actions:
│       ├── Apply Pattern
│       ├── Clear Items
│       ├── Replicate to Other Segments
│       └── Edit Pattern
│
└── When Multiple Objects Selected
    ├── Count: 5 items
    ├── Types: 3 crystals, 2 switches
    ├── Bounding Box: 10×1×8
    └── Batch Actions:
        ├── Move All
        ├── Delete All
        ├── Change Type (if same type)
        └── Align/Distribute
```

---

## 📋 PHẦN 3: VALIDATION & TESTING

### 3.1 Real-Time Validation System
```
Tính năng:
├── Continuous Validation
│   ├── Runs automatically as user edits
│   ├── Shows validation status in status bar
│   │   ├── ✅ All checks passed (green)
│   │   ├── ⚠️ N warnings (yellow)
│   │   └── ❌ N errors (red)
│   └── Update frequency: 500ms debounce
│
├── Validation Categories
│   ├── Topology Integrity (Critical)
│   │   ├── Path connectivity
│   │   ├── Semantic positions exist
│   │   ├── No isolated sections
│   │   └── Start/End defined
│   │
│   ├── Pedagogical Alignment (Important)
│   │   ├── Strategy implemented correctly
│   │   ├── Teaching concepts present
│   │   ├── Core skills exercised
│   │   └── Bloom level appropriate
│   │
│   ├── Playability (Important)
│   │   ├── Solution exists
│   │   ├── All items reachable
│   │   ├── Item goals achievable
│   │   └── No dead ends (unless intentional)
│   │
│   ├── Balance (Warning)
│   │   ├── Density within range
│   │   ├── Branch lengths similar (if required)
│   │   ├── Difficulty calibrated
│   │   └── Time estimate reasonable
│   │
│   └── Best Practices (Info)
│       ├── Clear visual flow
│       ├── Meaningful semantic names
│       ├── Consistent item spacing
│       └── Optimal path not too obvious
│
├── Validation Panel
│   ├── Expandable list of all validations
│   ├── Each validation shows:
│   │   ├── Status icon (✅⚠️❌)
│   │   ├── Category tag
│   │   ├── Description
│   │   ├── Severity
│   │   └── Action buttons
│   │
│   ├── Click validation → highlights issue on canvas
│   ├── Click "Fix" → applies auto-fix (if available)
│   └── Click "Ignore" → suppresses warning
│
└── Validation Reports
    ├── Export validation summary
    ├── Share with team for review
    └── Archive for quality tracking
```

### 3.2 Playability Testing
```
Tính năng:
├── Test Play Mode
│   ├── "Play Map" button → launches in-editor tester
│   ├── Student perspective view
│   │   ├── Shows only visible elements (no solution overlay)
│   │   ├── Interactive: use arrow keys to move
│   │   ├── Collect items by walking over them
│   │   └── Toggle switches by pressing space
│   │
│   ├── Developer overlay (toggle-able)
│   │   ├── Shows optimal path (dimmed)
│   │   ├── Step counter
│   │   ├── Items collected counter
│   │   └── Elapsed time
│   │
│   └── Test completion
│       ├── Success: All item goals met, reached end
│       ├── Failure: Got stuck, missed items
│       └── Feedback: Time taken, steps vs optimal
│
├── Automated Playability Tests
│   ├── Bot Solver
│   │   ├── Runs pathfinding algorithm
│   │   ├── Checks if solution exists
│   │   ├── Reports time complexity
│   │   └── Flags impossible states
│   │
│   ├── Edge Case Testing
│   │   ├── Try all possible starting moves
│   │   ├── Test branch permutations
│   │   ├── Verify switch ordering
│   │   └── Check for soft-locks
│   │
│   └── Performance Testing
│       ├── Measure solution generation time
│       ├── Check canvas rendering fps
│       └── Test with max item count
│
├── User Testing Framework
│   ├── Export map as test link
│   ├── Share with beta testers
│   ├── Collect playtest data:
│   │   ├── Completion rate
│   │   ├── Average time
│   │   ├── Common mistakes
│   │   └── Qualitative feedback
│   │
│   └── Playtest Analytics Dashboard
│       ├── Heatmap of where players get stuck
│       ├── Item collection order distribution
│       ├── Hints requested (if enabled)
│       └── Satisfaction rating
│
└── A/B Testing
    ├── Create variant of map (e.g., different bug)
    ├── Randomly assign testers to A or B
    ├── Compare metrics:
    │   ├── Completion rate
    │   ├── Time to solve
    │   ├── Pedagogical effectiveness (post-test)
    │   └── Engagement (replay rate)
    └── Statistical significance checker
```

### 3.3 Curriculum Alignment Checker
```
Tính năng:
├── Standards Mapping
│   ├── Link map to curriculum standards
│   │   ├── CS Standards (e.g., CSTA K-12)
│   │   ├── Math Standards (e.g., Common Core)
│   │   ├── Custom school curriculum
│   │   └── Custom progression path
│   │
│   ├── Check coverage
│   │   ├── Which standards are addressed
│   │   ├── Proficiency level (Introduce/Practice/Master)
│   │   └── Gap analysis (what's missing)
│   │
│   └── Generate alignment report
│       └── For administrators/curriculum coordinators
│
├── Prerequisite Checker
│   ├── Define prerequisite skills/concepts
│   ├── Check if student has completed prerequisite maps
│   ├── Suggest learning path
│   │   ├── "Complete Map A first"
│   │   ├── "Or practice concept X"
│   │   └── Alternative paths if available
│   │
│   └── Adaptive sequencing
│       └── Recommend next map based on performance
│
├── Learning Objective Validator
│   ├── For each stated learning objective:
│   │   ├── Check if map actually teaches it
│   │   ├── Verify through solution analysis
│   │   └── Flag misalignment
│   │
│   ├── Example: Objective = "Teach function reuse"
│   │   ├── ✅ Map has 4 identical branches
│   │   ├── ✅ Solution calls same function 4 times
│   │   ├── ⚠️ But branches are very short (only 2 steps)
│   │   └── Suggestion: "Increase branch length to 5+"
│   │
│   └── Objective difficulty calibration
│       ├── Check if difficulty matches objective
│       └── Suggest adjustments
│
└── Progression Coherence
    ├── If part of a series:
    │   ├── Check consistency with previous maps
    │   ├── Verify gradual difficulty increase
    │   ├── Ensure concepts build on each other
    │   └── Flag sudden jumps or repetition
    │
    └── Series analytics
        ├── Completion rate across series
        ├── Dropout points
        └── Concept mastery progression
```

---

## 📋 PHẦN 4: EXPORT & INTEGRATION

### 4.1 Export Formats
```
Tính năng:
├── Game-Ready Format
│   ├── JSON (for web game)
│   │   ├── Complete map data
│   │   ├── Path coordinates
│   │   ├── Item placements
│   │   ├── Solution (optional, for hints)
│   │   └── Metadata
│   │
│   ├── 3D Model (for Unity/Unreal)
│   │   ├── FBX/OBJ format
│   │   ├── Separated layers (path, items, obstacles)
│   │   ├── Materials/Textures included
│   │   └── Prefab configurations
│   │
│   └── Blockly Workspace
│       ├── Pre-configured toolbox
│       ├── Initial blocks (if starter code)
│       └── Validation rules
│
├── Educational Format
│   ├── Lesson Plan Document
│   │   ├── Learning objectives
│   │   ├── Standards alignment
│   │   ├── Estimated time
│   │   ├── Prerequisite knowledge
│   │   ├── Teaching notes
│   │   └── Expected challenges
│   │
│   ├── Student Worksheet
│   │   ├── Map visualization (top-down)
│   │   ├── Instructions
│   │   ├── Planning space (code skeleton)
│   │   └── Reflection questions
│   │
│   ├── Teacher Guide
│   │   ├── Solution walkthrough
│   │   ├── Common mistakes to watch for
│   │   ├── Extension activities
│   │   └── Assessment rubric
│   │
│   └── Assessment Package
│       ├── Pre-test (checks prerequisites)
│       ├── Post-test (checks learning)
│       ├── Auto-grading script
│       └── Performance analytics
│
├── Documentation Format
│   ├── Technical Spec
│   │   ├── Topology definition
│   │   ├── Semantic positions table
│   │   ├── Pattern details
│   │   ├── Algorithm pseudocode
│   │   └── Complexity analysis
│   │
│   ├── Visual Documentation
│   │   ├── Annotated screenshots
│   │   ├── Path flow diagrams
│   │   ├── Solution animation GIF
│   │   └── Concept illustrations
│   │
│   └── API Documentation
│       └── For programmatic access to map data
│
└── Sharing Format
    ├── .mapbuilder file (native format)
    │   ├── All layers preserved
    │   ├── Edit history
    │   ├── Validation state
    │   └── Can be reopened in tool
    │
    ├── Template Package
    │   ├── Parameterized version
    │   ├── Customization guide
    │   └── Usage examples
    │
    └── Public Gallery Submission
        ├── Map preview
        ├── Metadata
        ├── Author info
        └── Download count tracking
```

### 4.2 Integration Features
```
Tính năng:
├── LMS Integration
│   ├── Export to Google Classroom
│   │   ├── As assignment
│   │   ├── With due date
│   │   └── Auto-import submissions
│   │
│   ├── Export to Canvas/Moodle
│   │   ├── SCORM package
│   │   ├── Grade passback
│   │   └── Progress tracking
│   │
│   └── Custom LMS API
│       ├── OAuth authentication
│       ├── Roster sync
│       └── Analytics integration
│
├── Game Engine Integration
│   ├── Unity Plugin
│   │   ├── Import .mapbuilder files
│   │   ├── Auto-generate terrain
│   │   ├── Place prefabs
│   │   └── Configure objectives
│   │
│   ├── Unreal Engine Plugin
│   │   └── Similar to Unity
│   │
│   └── Custom Engine SDK
│       ├── REST API
│       ├── WebSocket for real-time updates
│       └── Documentation
│
├── Version Control Integration
│   ├── Git-friendly format
│   │   ├── Text-based diff
│   │   ├── Merge conflict resolution
│   │   └── Branching support
│   │
│   ├── Collaboration Features
│   │   ├── Multi-user editing (with locking)
│   │   ├── Comment threads
│   │   ├── Revision history
│   │   └── Change notifications
│   │
│   └── CI/CD Pipeline
│       ├── Automated validation on commit
│       ├── Automated playability tests
│       └── Auto-publish on merge
│
└── Analytics Integration
    ├── Google Analytics
    │   ├── Track usage patterns
    │   ├── Popular features
    │   └── Conversion funnel
    │
    ├── Custom Analytics Dashboard
    │   ├── Map creation metrics
    │   ├── Validation pass/fail rates
    │   ├── Feature usage heatmap
    │   └── User feedback aggregation
    │
    └── Learning Analytics
        ├── Student performance data
        ├── Concept mastery tracking
        ├── Intervention recommendations
        └── Predictive modeling
```

---

## 📋 PHẦN 5: ADVANCED FEATURES

### 5.1 AI-Assisted Features
```
Tính năng:
├── Natural Language Map Generation
│   ├── Text input: "Create a Plus Shape map for teaching functions, medium difficulty"
│   ├── AI parses:
│   │   ├── Topology: Plus Shape
│   │   ├── Pedagogy: Function Reuse
│   │   ├── Difficulty: Medium
│   │   └── Logic type: function_logic
│   │
│   ├── Auto-generates complete map
│   └── User refines with follow-up prompts
│       └── "Make branches longer" → regenerates
│
├── Intelligent Suggestions
│   ├── "This map looks unbalanced. Suggestions?"
│   │   ├── AI analyzes structure
│   │   ├── Identifies issues (branch length variance)
│   │   └── Proposes fixes with rationale
│   │
│   ├── "What pedagogy fits this path?"
│   │   ├── AI detects path structure
│   │   ├── Suggests compatible strategies
│   │   └── Explains why
│   │
│   └── "Improve this map's learning value"
│       ├── AI evaluates current pedagogy
│       ├── Suggests enhancements
│       └── Shows before/after comparison
│
├── Automated Difficulty Calibration
│   ├── Input target difficulty: Easy/Medium/Hard
│   ├── AI adjusts:
│   │   ├── Path complexity
│   │   ├── Item density
│   │   ├── Pattern sophistication
│   │   └── Number of concepts
│   │
│   ├── Validation:
│   │   ├── Predicts solve time
│   │   ├── Estimates success rate
│   │   └── Suggests further tweaks
│   │
│   └── Personalized difficulty
│       └── Adapts to specific student data
│
└── Content Generation
    ├── Generate N similar maps (variants)
    │   ├── Same pedagogy, different layouts
    │   ├── For A/B testing
    │   └── For practice sets
    │
    ├── Generate progression series
    │   ├── Start: Simple version
    │   ├── Middle: Add complexity
    │   ├── End: Full concept
    │   └── Auto-aligns objectives
    │
    └── Generate challenge extensions
        ├── "Make a harder version"
        ├── "Add a debugging variant"
        └── "Create inverse problem"
```

### 5.2 Collaborative Features
```
Tính năng:
├── Team Workspaces
│   ├── Shared map library
│   ├── Role-based access
│   │   ├── Admin: Full control
│   │   ├── Editor: Create/Edit maps
│   │   ├── Reviewer: Comment only
│   │   └── Viewer: Read-only
│   │
│   └── Team templates
│       └── Standardized starting points
│
├── Real-Time Collaboration
│   ├── See other users' cursors
│   ├── Live updates (like Google Docs)
│   ├── Conflict resolution
│   │   ├── Last-write-wins (default)
│   │   ├── Lock mechanism (for critical edits)
│   │   └── Merge suggestions (AI-assisted)
│   │
│   └── Chat/Comments
│       ├── In-line comments on map elements
│       ├── General discussion thread
│       └── @mentions for notifications
│
├── Review Workflow
│   ├── Submit map for review
│   ├── Reviewer adds feedback
│   │   ├── Annotate directly on canvas
│   │   ├── Add comment threads
│   │   └── Suggest changes
│   │
│   ├── Author addresses feedback
│   │   ├── Mark comments as resolved
│   │   ├── Request re-review
│   │   └── Track revision history
│   │
│   └── Approval process
│       ├── Required approvals (1-3 reviewers)
│       ├── Final sign-off
│       └── Publish to production
│
└── Knowledge Sharing
    ├── Public Gallery
    │   ├── Browse community maps
    │   ├── Filter by topology/pedagogy/difficulty
    │   ├── Preview before download
    │   └── Rate/Review maps
    │
    ├── Fork/Remix
    │   ├── Clone existing map
    │   ├── Modify for your needs
    │   ├── Credit original author
    │   └── Share your version
    │
    └── Templates Marketplace
        ├── Free and premium templates
        ├── Curated collections
        └── Usage statistics
```

### 5.3 Data-Driven Optimization
```
Tính năng:
├── Performance Analytics
│   ├── Aggregate student data
│   │   ├── Completion rates per map
│   │   ├── Average solve time
│   │   ├── Common failure points
│   │   └── Hint usage patterns
│   │
│   ├── Map comparison
│   │   ├── Which topology works best for concept X?
│   │   ├── Which pedagogy improves mastery?
│   │   └── Optimal difficulty progression
│   │
│   └── Predictive models
│       ├── Predict student success probability
│       ├── Identify at-risk students early
│       └── Recommend interventions
│
├── Automated Refinement
│   ├── ML model suggests improvements
│   │   ├── "90% of students get stuck here" → add hint
│   │   ├── "This pattern is too hard" → simplify
│   │   └── "Engagement drops after 5 min" → shorten
│   │
│   ├── A/B test results integration
│   │   ├── "Version A has 20% higher completion"
│   │   └── "Adopt Version A changes"
│   │
│   └── Continuous improvement loop
│       ├── Deploy map
│       ├── Collect data
│       ├── Analyze
│       ├── Refine
│       └── Redeploy
│
└── Learning Science Integration
    ├── Apply research-backed principles
    │   ├── Spacing effect (progressive difficulty)
    │   ├── Interleaving (mix concepts)
    │   ├── Retrieval practice (challenge modes)
    │   └── Productive failure (strategic bugs)
    │
    ├── Cognitive load monitoring
    │   ├── Estimate working memory load
    │   ├── Flag overload risk
    │   └── Suggest chunking
    │
    └── Engagement mechanics
        ├── Gamification elements (optional)
        ├── Flow state optimization
        └── Motivation scaffolding
```

---

## 📋 PHẦN 6: TECHNICAL INFRASTRUCTURE

### 6.1 Architecture Requirements
```
Tính năng:
├── Frontend (React + Three.js)
│   ├── 3D Canvas (Three.js)
│   │   ├── OrbitControls
│   │   ├── Raycasting for selection
│   │   ├── Custom shaders (path highlight)
│   │   └── LOD for performance
│   │
│   ├── UI Components (React)
│   │   ├── Topology selector
│   │   ├── Pedagogy panel
│   │   ├── Inspector
│   │   └── Validation panel
│   │
│   └── State Management (Redux/Zustand)
│       ├── Map state (path, items, metadata)
│       ├── UI state (selected objects, active panels)
│       └── Validation state (errors, warnings)
│
├── Backend (Python FastAPI)
│   ├── Map Generator Service
│   │   ├── Topology generators
│   │   ├── Academic enrichment layer
│   │   ├── Placement engine
│   │   └── Solution generator
│   │
│   ├── Validation Service
│   │   ├── Metadata validator
│   │   ├── Pedagogy checker
│   │   ├── Playability tester
│   │   └── Curriculum aligner
│   │
│   ├── Bug Injection Service
│   │   ├── Bug library
│   │   ├── Intelligent injector
│   │   └── Validation simulator
│   │
│   └── Analytics Service
│       ├── Performance tracking
│       ├── A/B test management
│       └── Recommendation engine
│
├── Database (PostgreSQL + Redis)
│   ├── Maps (versioned)
│   ├── Templates
│   ├── User data
│   ├── Analytics events
│   └── Cache (Redis for hot data)
│
└── Storage (S3/CloudStorage)
    ├── 3D models
    ├── Exported files
    └── Backups
```

### 6.2 Performance Considerations
```
Tính năng:
├── Rendering Optimization
│   ├── Instanced rendering (for repeated objects)
│   ├── Frustum culling
│   ├── Occlusion culling
│   └── LOD (Level of Detail)
│
├── Computation Optimization
│   ├── Web Workers for heavy tasks
│   │   ├── Solution generation
│   │   ├── Pathfinding
│   │   └── Validation
│   │
│   ├── Debouncing/Throttling
│   │   ├── Real-time validation (500ms delay)
│   │   ├── Canvas updates (60fps max)
│   │   └── Auto-save (5s interval)
│   │
│   └── Caching
│       ├── Pattern library
│       ├── Topology templates
│       └── Validation results
│
├── Network Optimization
│   ├── WebSocket for real-time collaboration
│   ├── Compression (gzip)
│   ├── CDN for static assets
│   └── Progressive loading
│
└── Scalability
    ├── Horizontal scaling (load balancer)
    ├── Database sharding (by team/org)
    ├── Queue system (for batch operations)
    └── Rate limiting
```

---

## 🎯 IMPLEMENTATION PRIORITY

### Phase 1 (MVP): Core Creation
```
3 months
├── Canvas + basic path drawing
├── Template gallery (5 topologies)
├── Manual item placement
├── Basic solution generation
└── Export to JSON
```

### Phase 2: Intelligence
```
3 months
├── Pedagogy panel + enrichment layer
├── Smart placement engine
├── Auto-generate features
├── Validation system
└── Bug injection (manual)
```

### Phase 3: Refinement
```
3 months
├── Path optimizer
├── Playability testing
├── Intelligent auto-bug
├── Analytics integration
└── Collaboration features
```

### Phase 4: Advanced
```
3 months
├── AI-assisted generation
├── Learning analytics
├── Advanced exports (3D models, lesson plans)
└── Marketplace
```

---

## 💡 KEY SUCCESS METRICS

1. **Time to Create Quality Map**: <15 minutes (vs 2+ hours manual)
2. **Pedagogical Alignment Score**: >90% (from validation)
3. **User Adoption**: 80% of content creators prefer tool vs manual
4. **Map Quality**: 95%+ pass playability tests on first try
5. **Student Outcomes**: 20%+ improvement in concept mastery

---

Đây là specification chi tiết cho Map Builder Tool.