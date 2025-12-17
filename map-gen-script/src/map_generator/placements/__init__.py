# src/map_generator/placements/__init__.py

from .base_placer import BasePlacer
from .command_obstacle_placer import CommandObstaclePlacer
from .for_loop_placer import ForLoopPlacer
from .function_placer import FunctionPlacer
from .variable_placer import VariablePlacer
from .while_if_placer import WhileIfPlacer
from .algorithm_placer import AlgorithmPlacer
from .swift_playground_placer import SwiftPlaygroundPlacer

# Import các strategy con để chúng có thể được tham chiếu
from .strategies import (
    branch_placer_strategy,
    segment_placer_strategy,
    island_placer_strategy,
    parameter_shape_strategy,
    complex_structure_strategy
)