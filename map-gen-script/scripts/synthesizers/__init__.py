# scripts/synthesizers/__init__.py
"""
SYNTHESIZERS PACKAGE - Strategy Pattern for Code Synthesis

Package chứa các synthesizer strategies để tổng hợp raw actions thành
structured program blocks. Mỗi synthesizer xử lý một loại logic_type cụ thể.

Usage:
    from scripts.synthesizers import get_synthesizer, SYNTHESIZERS
    
    for synth in SYNTHESIZERS:
        if synth.can_handle(logic_type, world):
            return synth.synthesize(actions, world)
"""

from .base import SynthesizerStrategy
from .wall_follower import WallFollowerSynthesizer
from .conditional_while import ConditionalWhileSynthesizer
from .plowing_field import PlowingFieldSynthesizer
from .variable_loop import VariableLoopSynthesizer
from .math_expression import MathExpressionSynthesizer
from .advanced_algorithm import AdvancedAlgorithmSynthesizer
from .function import FunctionSynthesizer
from .default import DefaultSynthesizer

# Registry của các synthesizers theo thứ tự ưu tiên
# Synthesizer đầu tiên match sẽ được sử dụng
SYNTHESIZERS = [
    WallFollowerSynthesizer(),
    ConditionalWhileSynthesizer(),
    PlowingFieldSynthesizer(),
    VariableLoopSynthesizer(),
    MathExpressionSynthesizer(),
    AdvancedAlgorithmSynthesizer(),
    FunctionSynthesizer(),
    DefaultSynthesizer(),  # Fallback
]

def get_synthesizer(logic_type: str, world) -> SynthesizerStrategy:
    """
    Tìm synthesizer phù hợp dựa trên logic_type và world context.
    
    Args:
        logic_type: Loại logic (e.g., 'variable_loop', 'for_loop_logic')
        world: GameWorld instance
        
    Returns:
        SynthesizerStrategy instance phù hợp
    """
    for synth in SYNTHESIZERS:
        if synth.can_handle(logic_type, world):
            return synth
    return DefaultSynthesizer()  # Fallback luôn có sẵn


__all__ = [
    'SynthesizerStrategy',
    'WallFollowerSynthesizer',
    'ConditionalWhileSynthesizer',
    'PlowingFieldSynthesizer',
    'VariableLoopSynthesizer',
    'MathExpressionSynthesizer',
    'AdvancedAlgorithmSynthesizer',
    'FunctionSynthesizer',
    'DefaultSynthesizer',
    'SYNTHESIZERS',
    'get_synthesizer',
]
