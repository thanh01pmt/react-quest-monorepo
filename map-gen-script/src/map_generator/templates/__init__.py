# src/map_generator/templates/__init__.py
"""
Map Templates Package - Template-based map generation

This package provides predefined map templates that can be parameterized
to generate varied but consistent map layouts.

Usage:
    from src.map_generator.templates import MAP_TEMPLATES, Range, generate_from_template
    
    # Get list of available templates
    print(MAP_TEMPLATES.keys())
    
    # Generate from template
    map_data = generate_from_template('zigzag_collect', {'segments': 5})
"""

from .map_templates import MAP_TEMPLATES, Range, generate_from_template

__all__ = ['MAP_TEMPLATES', 'Range', 'generate_from_template']
