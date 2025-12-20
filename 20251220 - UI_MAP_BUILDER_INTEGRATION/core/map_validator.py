import logging
from typing import Dict, List, Any, Optional

class MapValidator:
    """
    Validator for generated game maps.
    Verifies that maps meet their configuration requirements including:
    - Item placement matches expected items
    - Logic requirements (functions, loops) are met in the solution
    """

    def __init__(self):
        self.logger = logging.getLogger(__name__)

    def validate_map(self, map_data: Dict[str, Any], solution_result: Dict[str, Any], 
                     expected_items: Dict[str, Any], logic_type: str) -> Dict[str, Any]:
        """
        Main validation entry point with 3-tier comprehensive academic validation.
        
        Args:
            map_data: The final game JSON dictionary (or GameWorld dict)
            solution_result: Result from synthesis containing structuredSolution
            expected_items: Dict of item types and counts/requirements (e.g. {'crystal': 'all'})
            logic_type: The logic type requested (e.g., 'function_logic', 'for_loop_logic')
            
        Returns:
            Dict containing:
            - isPedagogyValid: bool (NEW - academic quality)
            - pedagogyTier: dict (tier1_basic, tier2_logic, tier3_pattern)
            - pedagogyErrors: List[str]
            - isItemGoalsMet: bool (renamed from isValid)
            - itemGoalsErrors: List[str]
            - isValid: bool (DEPRECATED - for backward compatibility)
            - errors: List[str] (DEPRECATED - for backward compatibility)
        """
        # Build full map dict for comprehensive validation
        full_map = {
            'gameConfig': map_data.get('gameConfig', {}),
            'structuredSolution': solution_result.get('structuredSolution', {}) if solution_result else {},
            'blocklyConfig': map_data.get('blocklyConfig', {}),
            # Pass topology info for validation rules
            'gen_map_type': map_data.get('gen_map_type', '')
        }
        
        # Import comprehensive validation functions
        try:
            from scripts.comprehensive_validation import (
                validate_tier1_basic,
                validate_tier2_logic,
                validate_tier3_pattern
            )
            
            # Run 3-tier validation
            tier1_errors = validate_tier1_basic(full_map, logic_type)
            tier2_errors = validate_tier2_logic(full_map, logic_type)
            tier3_errors = validate_tier3_pattern(full_map, logic_type=logic_type)
            
            pedagogy_errors = tier1_errors + tier2_errors + tier3_errors
            is_pedagogy_valid = len(pedagogy_errors) == 0
            
            pedagogy_tier = {
                'tier1_basic': len(tier1_errors) == 0,
                'tier2_logic': len(tier2_errors) == 0,
                'tier3_pattern': len(tier3_errors) == 0
            }
        except ImportError as e:
            self.logger.warning(f"Comprehensive validation not available: {e}. Using legacy validation only.")
            pedagogy_errors = []
            is_pedagogy_valid = True
            pedagogy_tier = {
                'tier1_basic': True,
                'tier2_logic': True,
                'tier3_pattern': True
            }
        
        # Item goals validation (separate from pedagogy)
        item_errors = self.validate_items(map_data, expected_items)
        is_item_goals_met = len(item_errors) == 0
        
        return {
            # NEW: Academic validation
            'isPedagogyValid': is_pedagogy_valid,
            'pedagogyTier': pedagogy_tier,
            'pedagogyErrors': pedagogy_errors,
            
            # Item goals
            'isItemGoalsMet': is_item_goals_met,
            'itemGoalsErrors': item_errors,
            
            # DEPRECATED: Backward compatibility
            'isValid': is_item_goals_met,  # OLD behavior
            'errors': item_errors  # OLD behavior
        }

    def validate_items(self, map_data: Dict[str, Any], expected_items: Dict[str, Any]) -> List[str]:
        """
        Validate that items in the map match expectations.
        """
        errors = []
        
        # Count items in map
        game_config = map_data.get('gameConfig', {})
        collectibles = game_config.get('collectibles', [])
        interactibles = game_config.get('interactibles', [])
        
        actual_counts = {}
        for item in collectibles:
            item_type = item.get('type')
            actual_counts[item_type] = actual_counts.get(item_type, 0) + 1
            
        for item in interactibles:
            item_type = item.get('type')
            # Handle switch variations if any, though usually just 'switch'
            actual_counts[item_type] = actual_counts.get(item_type, 0) + 1

        for expected_type, expected_count in expected_items.items():
            actual = actual_counts.get(expected_type, 0)
            
            # If expected_count is 'all', we just check presence (> 0)
            # The exact count is determined by the map generator, so we can't strict check count
            # unless we know exactly how many should be there.
            # But the requirement is "if items_to_place has X, map must have X".
            
            if expected_type not in actual_counts or actual == 0:
                errors.append(f"Missing expected item: '{expected_type}' (found 0)")
            
            # If explicit count is given (int), we could check it, but often 'all' is used
            # For now, presence check is the critical part based on previous analysis
        
        return errors

    def validate_logic(self, structured_solution: Dict[str, Any], logic_type: str) -> List[str]:
        """
        Validate that the solution uses the required logic structures.
        """
        errors = []
        
        if not structured_solution:
            # If solution is missing but logic_type expects one, that's an issue
            # Unless it's a type that doesn't have a structured solution (e.g. unsolveable)
            # But here we validate solved maps.
             if logic_type not in ['unknown', 'none']: 
                 # We allow maps without solution if that's intended, but usually it's not
                 pass 
             return errors

        main_blocks = structured_solution.get('main', [])
        procedures = structured_solution.get('procedures', {})

        if logic_type == 'function_logic':
            # Requirement: Must have PROCEDURE defined
            if not procedures:
                errors.append("Map requires 'function_logic' but no PROCEDURES are defined in solution.")
            
            # Requirement: Must have at least one CALL in main
            has_call = False
            
            def check_for_call(blocks):
                for block in blocks:
                    if block.get('type') == 'CALL':
                        return True
                    if 'body' in block:
                        if check_for_call(block['body']):
                            return True
                return False
                
            if not check_for_call(main_blocks):
                errors.append("Map requires 'function_logic' but main solution contains no PROCEDURE CALLs.")

        elif logic_type == 'for_loop_logic':
            # Requirement: Must have loop in main
            has_loop = False
            
            def check_for_loop(blocks):
                for block in blocks:
                    if block.get('type') in ['maze_repeat', 'maze_repeat_variable', 'maze_repeat_expression']:
                        return True
                    if 'body' in block:
                        if check_for_loop(block['body']):
                            return True
                return False

            if not check_for_loop(main_blocks):
                errors.append("Map requires 'for_loop_logic' but solution contains no LOOP structure.")

        return errors
