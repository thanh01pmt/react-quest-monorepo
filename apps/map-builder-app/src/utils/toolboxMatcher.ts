/**
 * Suggest appropriate toolbox preset based on template tags and concept
 * 
 * Matching logic (priority order):
 * 1. Check for advanced concepts (conditionals, algorithms)
 * 2. Check for loop/repeat tags
 * 3. Check for function/procedure tags  
 * 4. Fall back to commands_lX based on movement/action tags
 */
export function suggestToolboxPreset(
  tags: string[],
  concept: string
): string {
  const lowerTags = tags.map(t => t.toLowerCase());
  const lowerConcept = concept.toLowerCase();
  
  const hasTag = (keyword: string) => 
    lowerTags.some(t => t.includes(keyword));
  const hasAnyTag = (...keywords: string[]) =>
    keywords.some(k => hasTag(k));
  
  // === Check for advanced concepts first ===
  
  // Conditionals
  if (lowerConcept.includes('if') || lowerConcept.includes('conditional') ||
      hasAnyTag('if', 'conditional', 'sensor')) {
    if (hasAnyTag('collect', 'crystal', 'switch', 'toggle')) {
      return 'conditionals_l2_interaction_sensing';
    }
    return 'conditionals_l1_movement_sensing';
  }
  
  // While loops
  if (lowerConcept.includes('while') || hasAnyTag('while', 'until')) {
    if (hasAnyTag('variable', 'comparison')) {
      return 'while_l3_full_logic';
    }
    if (hasAnyTag('sensor', 'conditional')) {
      return 'while_l2_conditional_custom';
    }
    return 'while_l1_until_goal';
  }
  
  // Algorithms
  if (lowerConcept.includes('algorithm') || hasAnyTag('algorithm', 'solver')) {
    return 'algorithms_full_solver';
  }
  
  // Variables
  if (lowerConcept.includes('variable') || hasAnyTag('variable')) {
    return 'variables_comprehensive';
  }
  
  // === Loop concepts ===
  if (lowerConcept.includes('loop') || lowerConcept.includes('repeat') ||
      lowerConcept.includes('nested') || hasAnyTag('loop', 'repeat')) {
    // With functions
    if (hasAnyTag('function', 'procedure')) {
      return 'loops_l3_functions_integration';
    }
    // With actions
    if (hasAnyTag('collect', 'crystal', 'switch', 'toggle')) {
      return 'loops_l2_with_actions';
    }
    return 'loops_l1_basic_movement';
  }
  
  // === Function concepts ===
  if (lowerConcept.includes('function') || lowerConcept.includes('procedure') ||
      hasAnyTag('function', 'procedure')) {
    if (hasAnyTag('switch', 'toggle')) {
      return 'functions_l3_toggle_switch';
    }
    if (hasAnyTag('collect', 'crystal')) {
      return 'functions_l2_collect_gem';
    }
    return 'functions_l1_movement_only';
  }
  
  // === Sequential (commands only) ===
  // Level 6: Full actions (collect + switch)
  if (hasTag('collect') && hasTag('switch')) {
    return 'commands_l6_comprehensive';
  }
  
  // Level 5: Switch only
  if (hasAnyTag('switch', 'toggle')) {
    return 'commands_l5_switch';
  }
  
  // Level 4: Collect (crystal/key)
  if (hasAnyTag('collect', 'crystal', 'key')) {
    return 'commands_l4_collect';
  }
  
  // Level 3: Jump
  if (hasTag('jump')) {
    return 'commands_l3_jump';
  }
  
  // Level 2: Turn
  if (hasAnyTag('turn', 'turnleft', 'turnright')) {
    return 'commands_l2_turn';
  }
  
  // Level 1: Move only
  if (hasAnyTag('move', 'moveforward')) {
    return 'commands_l1_move';
  }
  
  // Default fallback based on concept type
  if (lowerConcept === 'sequential') {
    // Check for action items in tags  
    if (hasAnyTag('collectitem')) {
      if (hasAnyTag('turn', 'turnleft', 'turnright')) {
        if (hasTag('jump')) {
          return 'commands_l4_collect'; // full movement + collect
        }
        return 'commands_l4_collect';
      }
      return 'commands_l4_collect';
    }
    return 'commands_l2_turn';
  }
  
  // Ultimate fallback
  return 'full_toolbox';
}
