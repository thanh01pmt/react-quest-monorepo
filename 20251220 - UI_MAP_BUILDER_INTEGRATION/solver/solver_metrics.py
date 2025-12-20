# scripts/solver_metrics.py
"""
SOLVER METRICS - Performance metrics collection for gameSolver.py

Provides a dataclass to collect and report solver performance metrics.

Usage:
    from solver_metrics import SolverMetrics, solve_level_with_metrics
    
    solution, metrics = solve_level_with_metrics(world)
    print(f"Solved in {metrics.time_ms}ms, {metrics.iterations} iterations")
"""

from dataclasses import dataclass, asdict
import time
from typing import Optional, List, Tuple, Any


@dataclass
class SolverMetrics:
    """
    [NEW Best Practice 2.2] Collect solver performance metrics.
    """
    iterations: int = 0          # Number of A* iterations
    states_explored: int = 0     # Number of unique states visited
    cache_hits: int = 0          # Number of state cache hits (duplicates skipped)
    solution_length: int = 0     # Number of actions in solution
    time_ms: float = 0.0         # Total solving time in milliseconds
    
    # Additional info
    heuristic_type: str = 'max'  # 'max' or 'mst'
    goal_count: int = 0          # Number of goals in the problem
    
    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization."""
        return asdict(self)
    
    def summary(self) -> str:
        """Return human-readable summary."""
        return (
            f"Solver completed in {self.time_ms:.2f}ms, "
            f"{self.iterations} iterations, "
            f"{self.states_explored} states explored"
        )


def create_metrics_wrapper(solve_level_func):
    """
    Decorator factory to wrap solve_level with metrics collection.
    
    Args:
        solve_level_func: The original solve_level function
        
    Returns:
        A wrapper function that returns (solution, metrics) tuple
    """
    def solve_level_with_metrics(world: Any, **kwargs) -> Tuple[Optional[List[str]], SolverMetrics]:
        """
        [NEW Best Practice 2.2] Wrapper that collects metrics during solving.
        
        Args:
            world: GameWorld instance
            **kwargs: Additional arguments for solve_level
            
        Returns:
            Tuple of (solution, SolverMetrics)
        """
        # Import here to avoid circular imports
        try:
            from scripts.solver_config import SOLVER_CONFIG
        except ImportError:
            from solver_config import SOLVER_CONFIG
        
        metrics = SolverMetrics()
        metrics.heuristic_type = SOLVER_CONFIG['heuristic'].get('type', 'max')
        
        # Count goals
        collectible_count = len(getattr(world, 'collectibles_by_id', {}))
        switch_count = len(getattr(world, 'switches', {}))
        metrics.goal_count = collectible_count + switch_count
        
        # Time the solve
        start_time = time.time()
        
        solution = solve_level_func(world, **kwargs)
        
        metrics.time_ms = (time.time() - start_time) * 1000
        
        if solution:
            metrics.solution_length = len(solution)
        
        # Log summary
        print(f"    METRICS: {metrics.summary()}")
        
        return solution, metrics
    
    return solve_level_with_metrics


# Convenience export for future use
__all__ = ['SolverMetrics', 'create_metrics_wrapper']
