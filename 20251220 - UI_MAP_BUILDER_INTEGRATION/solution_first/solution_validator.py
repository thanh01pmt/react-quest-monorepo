"""
Solution Validator

Compares expected solution (from SolutionFirstPlacer) with actual solution (from A* Solver).
Used to validate that pattern-based solution generation is accurate.
"""

from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass


@dataclass
class ComparisonResult:
    """Result of comparing expected vs actual solution."""
    match: bool
    match_type: str  # 'EXACT', 'OPTIMAL', 'EQUIVALENT', 'MISMATCH', 'LOGIC_ISSUE'
    raw_actions_match: bool
    procedure_match: bool
    action_count_diff: int
    expected_action_count: int
    actual_action_count: int
    expected_procedure_count: int
    actual_procedure_count: int
    discrepancies: List[str]
    similarity_score: float  # 0.0 to 1.0


class SolutionValidator:
    """
    Validates expected solution against actual solver output.
    
    Usage:
        validator = SolutionValidator()
        result = validator.compare(expected_solution, actual_raw_actions, actual_structured)
        
        if not result.match:
            print(f"Discrepancies found: {result.discrepancies}")
    """
    
    def compare(
        self,
        expected: Dict,
        actual_raw_actions: List[str],
        actual_structured: Dict
    ) -> ComparisonResult:
        """
        Compare expected solution with actual solver output.
        
        Args:
            expected: Dict from layout['expected_solution']
            actual_raw_actions: List of actions from solver
            actual_structured: Dict with main/procedures from synthesizer
        
        Returns:
            ComparisonResult with detailed comparison data
        """
        discrepancies = []
        
        expected_actions = expected.get('rawActions', [])
        expected_structured = expected.get('structuredSolution', {})
        
        # 1. Compare raw action counts
        action_count_diff = len(actual_raw_actions) - len(expected_actions)
        
        if action_count_diff != 0:
            discrepancies.append(
                f"Action count mismatch: expected {len(expected_actions)}, "
                f"actual {len(actual_raw_actions)} (diff: {action_count_diff:+d})"
            )
        
        # 2. Compare raw actions sequence
        raw_match = self._compare_action_sequences(
            expected_actions, 
            actual_raw_actions,
            discrepancies
        )
        
        # 3. Compare procedure structures
        expected_procs = expected_structured.get('procedures', {})
        actual_procs = actual_structured.get('procedures', {})
        
        proc_match = self._compare_procedures(
            expected_procs,
            actual_procs,
            discrepancies
        )
        
        # 4. Calculate similarity score
        similarity = self._calculate_similarity(
            expected_actions,
            actual_raw_actions,
            expected_procs,
            actual_procs
        )
        
        # Determine overall match
        # Consider MATCH if:
        # 1. First/main procedure matches (most important for function_logic)
        # 2. OR action counts are equivalent (same semantic result)
        # 3. OR solver found SHORTER path (optimal - that's good!)
        action_counts_match = self._compare_action_counts(expected_actions, actual_raw_actions)
        
        # Solver finding shorter path is VALID (it's more optimal)
        # Only flag if EXPECTED is shorter than ACTUAL (would indicate logic issue)
        solver_is_optimal = len(actual_raw_actions) <= len(expected_actions)
        expected_is_shorter = len(expected_actions) < len(actual_raw_actions)
        
        if expected_is_shorter:
            discrepancies.insert(0, 
                f"⚠️ LOGIC ISSUE: Expected path ({len(expected_actions)}) is shorter than "
                f"Solver path ({len(actual_raw_actions)}). Expected should not be more optimal!"
            )
        
        # Determine match type
        if raw_match and proc_match:
            match_type = 'EXACT'
            is_match = True
        elif action_counts_match and action_count_diff == 0:
            match_type = 'EQUIVALENT'
            is_match = True
        elif solver_is_optimal and proc_match:
            match_type = 'OPTIMAL'
            is_match = True
        elif solver_is_optimal:
            match_type = 'OPTIMAL'  # Solver found shorter path - valid
            is_match = True
        elif expected_is_shorter:
            match_type = 'LOGIC_ISSUE'
            is_match = False
        else:
            match_type = 'MISMATCH'
            is_match = False
        
        return ComparisonResult(
            match=is_match,
            match_type=match_type,
            raw_actions_match=raw_match,
            procedure_match=proc_match,
            action_count_diff=action_count_diff,
            expected_action_count=len(expected_actions),
            actual_action_count=len(actual_raw_actions),
            expected_procedure_count=len(expected_procs),
            actual_procedure_count=len(actual_procs),
            discrepancies=discrepancies,
            similarity_score=similarity
        )
    
    def _compare_action_counts(self, expected: List[str], actual: List[str]) -> bool:
        """Check if action counts are equivalent (same semantic actions)."""
        expected_counts = self._count_actions(expected)
        actual_counts = self._count_actions(actual)
        return expected_counts == actual_counts
    
    def _compare_action_sequences(
        self,
        expected: List[str],
        actual: List[str],
        discrepancies: List[str]
    ) -> bool:
        """Compare two action sequences."""
        if expected == actual:
            return True
        
        # Find first difference
        min_len = min(len(expected), len(actual))
        first_diff_idx = None
        
        for i in range(min_len):
            if expected[i] != actual[i]:
                first_diff_idx = i
                break
        
        if first_diff_idx is not None:
            discrepancies.append(
                f"First action mismatch at index {first_diff_idx}: "
                f"expected '{expected[first_diff_idx]}', actual '{actual[first_diff_idx]}'"
            )
        
        # Count differences by action type
        expected_counts = self._count_actions(expected)
        actual_counts = self._count_actions(actual)
        
        all_action_types = set(expected_counts.keys()) | set(actual_counts.keys())
        for action_type in all_action_types:
            exp_count = expected_counts.get(action_type, 0)
            act_count = actual_counts.get(action_type, 0)
            if exp_count != act_count:
                discrepancies.append(
                    f"'{action_type}' count: expected {exp_count}, actual {act_count}"
                )
        
        return False
    
    def _compare_procedures(
        self,
        expected: Dict,
        actual: Dict,
        discrepancies: List[str]
    ) -> bool:
        """Compare procedure definitions with format normalization."""
        # Normalize both to comparable format
        expected_normalized = self._normalize_procedures(expected)
        actual_normalized = self._normalize_procedures(actual)
        
        # Check if first/main procedure matches (most important)
        if expected_normalized and actual_normalized:
            exp_first = list(expected_normalized.values())[0]
            act_first = list(actual_normalized.values())[0]
            
            if exp_first == act_first:
                # Main procedure matches - good enough!
                return True
            else:
                discrepancies.append(
                    f"First procedure differs: expected {exp_first[:5]}..., "
                    f"actual {act_first[:5]}..."
                )
                return False
        
        if len(expected_normalized) != len(actual_normalized):
            discrepancies.append(
                f"Procedure count mismatch: expected {len(expected_normalized)}, actual {len(actual_normalized)}"
            )
            return False
        
        return True
    
    def _normalize_procedures(self, procedures: Dict) -> Dict:
        """
        Normalize procedure bodies to comparable string format.
        
        Converts:
        - [{'type': 'maze_moveForward'}, ...] to ['moveForward', ...]
        - ['moveForward', ...] stays as is
        """
        normalized = {}
        for name, body in procedures.items():
            if isinstance(body, list):
                normalized[name] = [self._normalize_action(a) for a in body]
            else:
                normalized[name] = body
        return normalized
    
    def _normalize_action(self, action) -> str:
        """Normalize a single action to string format."""
        if isinstance(action, str):
            return action
        if isinstance(action, dict):
            action_type = action.get('type', '')
            # Handle maze_turn
            if action_type == 'maze_turn':
                return action.get('direction', 'turn')
            # Handle CALL
            if action_type == 'CALL':
                return f"CALL:{action.get('name', '')}"
            # Handle maze_* types
            if action_type.startswith('maze_'):
                return action_type.replace('maze_', '')
            return action_type
        return str(action)
    
    def _count_actions(self, actions: List[str]) -> Dict[str, int]:
        """Count occurrences of each action type."""
        counts = {}
        for action in actions:
            counts[action] = counts.get(action, 0) + 1
        return counts
    
    def _calculate_similarity(
        self,
        expected_actions: List[str],
        actual_actions: List[str],
        expected_procs: Dict,
        actual_procs: Dict
    ) -> float:
        """
        Calculate similarity score between expected and actual.
        
        Returns float from 0.0 (completely different) to 1.0 (identical).
        """
        if not expected_actions and not actual_actions:
            return 1.0
        
        if not expected_actions or not actual_actions:
            return 0.0
        
        # Action sequence similarity using LCS-like approach
        action_similarity = self._sequence_similarity(expected_actions, actual_actions)
        
        # Procedure similarity
        proc_similarity = 1.0
        if expected_procs or actual_procs:
            if len(expected_procs) == len(actual_procs) == 0:
                proc_similarity = 1.0
            elif expected_procs and actual_procs:
                # Compare procedure bodies
                exp_body = list(expected_procs.values())[0] if expected_procs else []
                act_body = list(actual_procs.values())[0] if actual_procs else []
                proc_similarity = self._sequence_similarity(exp_body, act_body)
            else:
                proc_similarity = 0.5  # One has procs, other doesn't
        
        # Weighted average
        return 0.7 * action_similarity + 0.3 * proc_similarity
    
    def _sequence_similarity(self, seq1: List, seq2: List) -> float:
        """Calculate similarity between two sequences."""
        if not seq1 and not seq2:
            return 1.0
        if not seq1 or not seq2:
            return 0.0
        
        # Use longest common subsequence ratio
        lcs_len = self._lcs_length(seq1, seq2)
        max_len = max(len(seq1), len(seq2))
        
        return lcs_len / max_len
    
    def _lcs_length(self, seq1: List, seq2: List) -> int:
        """Calculate length of longest common subsequence."""
        m, n = len(seq1), len(seq2)
        dp = [[0] * (n + 1) for _ in range(m + 1)]
        
        for i in range(1, m + 1):
            for j in range(1, n + 1):
                if seq1[i-1] == seq2[j-1]:
                    dp[i][j] = dp[i-1][j-1] + 1
                else:
                    dp[i][j] = max(dp[i-1][j], dp[i][j-1])
        
        return dp[m][n]


def validate_solution_first_accuracy(
    layout: Dict,
    actual_raw_actions: List[str],
    actual_structured: Dict,
    verbose: bool = True
) -> Tuple[bool, ComparisonResult]:
    """
    Convenience function to validate SolutionFirst expected solution.
    
    Args:
        layout: Layout dict from SolutionFirstPlacer.place_items()
        actual_raw_actions: Raw actions from A* solver
        actual_structured: Structured solution from synthesizer
        verbose: Print comparison details
    
    Returns:
        Tuple of (match: bool, result: ComparisonResult)
    """
    expected = layout.get('expected_solution')
    
    if not expected:
        if verbose:
            print("⚠️  No expected_solution in layout (GENERATE_EXPECTED_SOLUTION might be False)")
        return False, None
    
    validator = SolutionValidator()
    result = validator.compare(expected, actual_raw_actions, actual_structured)
    
    if verbose:
        print(f"\n{'='*60}")
        print("SOLUTION VALIDATION REPORT")
        print(f"{'='*60}")
        print(f"Match: {'✅ YES' if result.match else '❌ NO'}")
        print(f"Similarity Score: {result.similarity_score:.1%}")
        print(f"\nAction Counts:")
        print(f"  Expected: {result.expected_action_count}")
        print(f"  Actual:   {result.actual_action_count}")
        print(f"  Diff:     {result.action_count_diff:+d}")
        print(f"\nProcedure Counts:")
        print(f"  Expected: {result.expected_procedure_count}")
        print(f"  Actual:   {result.actual_procedure_count}")
        
        if result.discrepancies:
            print(f"\nDiscrepancies ({len(result.discrepancies)}):")
            for d in result.discrepancies[:5]:  # Show first 5
                print(f"  • {d}")
            if len(result.discrepancies) > 5:
                print(f"  ... and {len(result.discrepancies) - 5} more")
        
        print(f"{'='*60}\n")
    
    return result.match, result
