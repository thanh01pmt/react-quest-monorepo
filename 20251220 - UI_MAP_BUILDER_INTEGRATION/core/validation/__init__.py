# src/map_generator/validation/__init__.py
"""
PRE-SOLVE VALIDATION PACKAGE

Provides validation utilities to ensure maps are solvable before
expensive A* solving. Reduces unsolvable rate from ~10% to <1%.

Usage:
    from src.map_generator.validation import (
        PathConnectivityChecker,
        quick_solvability_check,
        is_toolbox_compatible,
        PreSolveValidator
    )
"""

from .pre_solve_validator import (
    PathConnectivityChecker,
    quick_solvability_check,
    get_required_blocks,
    is_toolbox_compatible,
    PreSolveValidator,
    ValidationResult,
)

__all__ = [
    'PathConnectivityChecker',
    'quick_solvability_check',
    'get_required_blocks',
    'is_toolbox_compatible',
    'PreSolveValidator',
    'ValidationResult',
]
