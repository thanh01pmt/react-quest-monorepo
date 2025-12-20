# Solution-First Placer Module

## Overview

The Solution-First Placer module implements pedagogical item placement for educational game maps. It uses topology metadata to place items according to teaching strategies that encourage specific code patterns like PROCEDURES, loops, and conditionals.

## Architecture

```
solution_first/
├── __init__.py
├── solution_first_placer.py      # Main placer orchestrating all components
├── pedagogical_strategy_handler.py  # Strategy-based placement
├── semantic_position_handler.py   # Semantic position processing
├── strategy_selector.py          # [NEW] Context-aware strategy selection
├── pattern_complexity_modifier.py # [NEW] Difficulty-based modifications
├── pattern_library.py            # Pattern templates
├── placement_calculator.py       # Position calculations
├── solution_generator.py         # Expected solution generation
├── symmetric_placer.py           # Hub-spoke and island placement
├── fallback_handler.py           # Fallback strategies
└── topology_classifier.py        # Topology type detection
```

## Key Components

### 1. StrategySelector

Context-aware strategy selection based on curriculum parameters.

#### Usage

```python
from src.map_generator.placements.solution_first.strategy_selector import StrategySelector

selector = StrategySelector()

# Get strategy configuration
config = selector.get_config('plus_shape')
# Returns: StrategyConfig(primary='function_reuse', secondary=['l_shape_logic', ...])

# Select with curriculum context
config = selector.select_strategy('plus_shape', {
    'difficulty_code': 'HARD',
    'bloom_level_codes': ['CREATE'],
    'context_codes': ['FUNCTION_USAGE']
})

# Get difficulty-specific pattern
pattern = selector.get_difficulty_pattern('plus_shape', 'EASY')
# Returns: 'identical_per_branch'
```

#### StrategyConfig Schema

```python
@dataclass
class StrategyConfig:
    primary: str              # Main strategy (e.g., 'function_reuse')
    secondary: List[str]      # Alternative strategies
    inherits_from: List[str]  # Topologies to inherit from
    difficulty_patterns: Dict[str, str]  # Difficulty -> pattern mapping
```

#### SemanticPair Schema

```python
@dataclass
class SemanticPair:
    name: str           # Descriptive name (e.g., 'center_to_corner_easy')
    start: str          # Start position key
    end: str            # End position key
    path_type: str      # Traversal type
    strategies: List[str]  # Compatible strategies
    difficulty: str     # EASY, MEDIUM, or HARD
    teaching_goal: str  # Pedagogical intent
```

### 2. PatternComplexityModifier

Adjusts pattern recognition difficulty without changing item count.

#### Difficulty Levels

| Level | Effect | Example |
|-------|--------|---------|
| EASY | Obvious patterns | Items grouped by type: [crystal, crystal, switch, switch] |
| MEDIUM | Minor variations | Slight spacing changes |
| HARD | Hidden regularity | Interleaved types with underlying pattern |

#### Usage

```python
from src.map_generator.placements.solution_first.pattern_complexity_modifier import PatternComplexityModifier

modifier = PatternComplexityModifier()

# Apply difficulty
modified_items = modifier.apply_difficulty(items, 'HARD', 'hidden_progressive_pattern')
```

### 3. SemanticPositionHandler

Handles item placement using semantic positions and valid_pairs.

#### New Methods

```python
handler = SemanticPositionHandler()

# Select pair by difficulty
pair = handler.select_start_end_pair(path_info, {'difficulty_code': 'EASY'})

# Get all valid pairs
pairs = handler.get_valid_pairs(metadata)

# Get pair for specific difficulty
pair = handler.get_pair_for_difficulty(metadata, 'HARD')

# Check if topology has valid_pairs
has_pairs = handler.has_valid_pairs(metadata)
```

#### Deprecation Note

`get_optimal_path_positions()` is deprecated. Use `select_start_end_pair()` instead.

## Topology Metadata Requirements

All topologies should export `semantic_positions` with `valid_pairs`:

```python
semantic_positions = {
    'center': (15, 0, 15),
    'left_end': (0, 0, 15),
    'right_end': (30, 0, 15),
    'optimal_start': 'center',  # [DEPRECATED]
    'optimal_end': 'right_end',  # [DEPRECATED]
    'valid_pairs': [
        {
            'name': 'center_to_right_easy',
            'start': 'center',
            'end': 'right_end',
            'path_type': 'single_branch',
            'strategies': ['function_reuse', 'radial_iteration'],
            'difficulty': 'EASY',
            'teaching_goal': 'Simple branch traversal'
        },
        # ... more pairs for MEDIUM, HARD
    ]
}
```

## Supported Strategies

| Strategy | Topologies | Teaching Goal |
|----------|------------|---------------|
| `function_reuse` | plus_shape, star_shape, h_shape, u_shape | PROCEDURE reuse |
| `conditional_branching` | t_shape, ef_shape | IF/ELSE logic |
| `variable_rate_change` | v_shape | Variable spacing |
| `alternating_patterns` | s_shape, straight_line | Pattern recognition |
| `decreasing_loop` | spiral | Loop with decreasing count |
| `radial_iteration` | star_shape | Radial arm iteration |
| `segment_based` | l_shape, zigzag | Segment-based placement |

## Examples for Curriculum Authors

### Example 1: Function Logic Map (EASY)

```json
{
    "gen_topology": "plus_shape",
    "gen_logic_type": "function_logic",
    "difficulty_code": "EASY",
    "items_to_place": ["crystal", "switch"]
}
```

Expected behavior:
- Items placed identically on all 4 branches
- Pattern is obvious (grouped types)
- Solution uses PROCEDURE called 4 times

### Example 2: Loop Logic Map (MEDIUM)

```json
{
    "gen_topology": "spiral",
    "gen_logic_type": "loop_logic",
    "difficulty_code": "MEDIUM",
    "items_to_place": ["crystal"]
}
```

Expected behavior:
- Items decrease per layer (3→2→1)
- Minor variations in spacing
- Solution uses decreasing loop

### Example 3: Conditional Map (HARD)

```json
{
    "gen_topology": "t_shape",
    "gen_logic_type": "function_logic",
    "difficulty_code": "HARD",
    "bloom_level_codes": ["ANALYZE"],
    "items_to_place": ["crystal", "switch", "gem"]
}
```

Expected behavior:
- Decoy items on wrong branches
- Hidden pattern regularity
- Requires path optimization

## Testing

```bash
# Run all placement tests
python -m pytest tests/smart_placement/ -v

# Run specific test categories
python -m pytest tests/smart_placement/test_strategy_selector.py -v
python -m pytest tests/smart_placement/test_pattern_complexity.py -v
python -m pytest tests/smart_placement/test_phase3_integration.py -v

# Run academic flow tests
python -m pytest tests/academic_flow/ -v
```

## Migration Guide

### From legacy optimal_start/optimal_end

**Before:**
```python
semantic_positions = {
    'optimal_start': 'center',
    'optimal_end': 'branch_end'
}
```

**After:**
```python
semantic_positions = {
    'valid_pairs': [
        {
            'name': 'default_easy',
            'start': 'center',
            'end': 'branch_end',
            'difficulty': 'EASY',
            # ...
        }
    ]
}
```

### From direct strategy lookup

**Before:**
```python
strategy = TOPOLOGY_STRATEGIES.get(topology_type)
```

**After:**
```python
handler = PedagogicalStrategyHandler()
strategy = handler.get_strategy_for_topology(topology_type, params)
```
