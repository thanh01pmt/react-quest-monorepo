# src/map_generator/templates/map_templates.py
"""
MAP TEMPLATES - Predefined templates for map generation

Provides parameterized templates that define common map patterns.
Each template specifies:
- topology: The base topology to use
- placer: The placement strategy
- params: Default parameters with optional Range for variation
- item_pattern: How items should be placed

Usage:
    from map_templates import MAP_TEMPLATES, Range, generate_from_template
    
    # List templates
    for name in MAP_TEMPLATES:
        print(f"Template: {name}")
    
    # Generate with defaults
    map_data = generate_from_template('zigzag_collect')
    
    # Generate with overrides
    map_data = generate_from_template('zigzag_collect', {'segments': 7})
"""

from dataclasses import dataclass
from typing import Dict, Any, Tuple, Optional, Iterator
import random
import logging


@dataclass
class Range:
    """
    [NEW Part 3.2] Helper class for parameterized ranges.
    
    Allows defining min/max bounds for template params that can vary.
    
    Usage:
        segments = Range(3, 7)  # Random between 3-7
        value = segments.sample()  # Get random value
    """
    min_val: int
    max_val: int
    
    def sample(self) -> int:
        """Return random value within range (inclusive)."""
        return random.randint(self.min_val, self.max_val)
    
    def __repr__(self):
        return f"Range({self.min_val}, {self.max_val})"


# ===========================================================================
# MAP TEMPLATES DICTIONARY
# ===========================================================================

MAP_TEMPLATES: Dict[str, Dict[str, Any]] = {
    # Template for zigzag collecting patterns
    'zigzag_collect': {
        'description': 'Zigzag path with collectibles at each turn',
        'topology': 'zigzag',
        'placer': 'for_loop_logic',
        'params': {
            'segments': Range(3, 7),
            'segment_length': Range(3, 5),
        },
        'item_pattern': 'on_each_turn',
        'logic_type': 'for_loop',
    },
    
    # Template for spiral challenge
    'spiral_challenge': {
        'description': 'Spiral path with items at layer ends',
        'topology': 'spiral_3d',
        'placer': 'function_logic',
        'params': {
            'layers': Range(2, 4),
            'layer_width': Range(3, 5),
        },
        'item_pattern': 'at_layer_end',
        'logic_type': 'function',
    },
    
    # Template for grid/plowing field
    'grid_pattern': {
        'description': 'Grid pattern for plowing field challenges',
        'topology': 'grid',
        'placer': 'for_loop_logic',
        'params': {
            'grid_width': Range(3, 5),
            'grid_depth': Range(3, 5),
        },
        'item_pattern': 'on_each_cell',
        'logic_type': 'nested_loop',
    },
    
    # Template for staircase climbing
    'staircase_climb': {
        'description': 'Staircase with items to collect',
        'topology': 'staircase_3d',
        'placer': 'for_loop_logic',
        'params': {
            'num_steps': Range(4, 8),
            'step_height': 1,
        },
        'item_pattern': 'on_each_step',
        'logic_type': 'for_loop',
    },
    
    # Template for L-shape path
    'l_shape_journey': {
        'description': 'L-shaped path for sequencing practice',
        'topology': 'l_shape',
        'placer': 'command_obstacle',
        'params': {
            'arm_length': Range(3, 6),
        },
        'item_pattern': 'at_turn',
        'logic_type': 'sequencing',
    },
    
    # Template for conditional path with switches
    'switch_maze': {
        'description': 'Maze with switches to toggle',
        'topology': 'complex_maze_2d',
        'placer': 'conditional_logic',
        'params': {
            'maze_width': Range(6, 10),
            'maze_height': Range(6, 10),
            'switch_count': Range(2, 4),
        },
        'item_pattern': 'at_intersections',
        'logic_type': 'conditional',
    },
}


def _resolve_params(template_params: Dict[str, Any], overrides: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Resolve template params by sampling Ranges and applying overrides.
    
    Args:
        template_params: Default params from template (may contain Range objects)
        overrides: User-provided param overrides
    
    Returns:
        Dict with all params resolved to concrete values
    """
    resolved = {}
    
    for key, value in template_params.items():
        if isinstance(value, Range):
            resolved[key] = value.sample()
        else:
            resolved[key] = value
    
    # Apply overrides
    if overrides:
        for key, value in overrides.items():
            resolved[key] = value
    
    return resolved


def generate_from_template(
    template_name: str, 
    param_overrides: Dict[str, Any] = None,
    service = None
) -> 'MapData':
    """
    [NEW Part 3.2] Generate a map from a predefined template.
    
    Args:
        template_name: Name of template from MAP_TEMPLATES
        param_overrides: Optional dict to override default params
        service: Optional MapGeneratorService instance
    
    Returns:
        MapData instance
        
    Raises:
        ValueError: If template_name not found
    """
    if template_name not in MAP_TEMPLATES:
        available = ', '.join(MAP_TEMPLATES.keys())
        raise ValueError(
            f"Template '{template_name}' not found. "
            f"Available templates: {available}"
        )
    
    template = MAP_TEMPLATES[template_name]
    
    # Resolve params
    resolved_params = _resolve_params(
        template.get('params', {}),
        param_overrides
    )
    
    # Add template metadata
    resolved_params['template_name'] = template_name
    resolved_params['item_pattern'] = template.get('item_pattern', 'default')
    
    logging.info(f"Generating from template '{template_name}' with params: {resolved_params}")
    
    # Get topology and placer names
    topology_name = template['topology']
    placer_name = template['placer']
    
    # If service provided, use it; otherwise return config for manual use
    if service:
        # Use service to generate single map
        map_data = service.generate_map(
            map_type=topology_name,
            logic_type=placer_name,
            params=resolved_params
        )
        return map_data
    else:
        # Return generation config for external use
        return {
            'topology': topology_name,
            'placer': placer_name,
            'params': resolved_params,
            'logic_type': template.get('logic_type', 'sequencing'),
            'template': template_name,
        }


def list_templates() -> Dict[str, str]:
    """
    List all available templates with descriptions.
    
    Returns:
        Dict mapping template name to description
    """
    return {
        name: template.get('description', 'No description')
        for name, template in MAP_TEMPLATES.items()
    }
