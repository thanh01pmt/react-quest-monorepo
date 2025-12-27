/**
 * Solution Builder
 * 
 * Converts execution trace to game output format.
 */

import {
  CodeTemplate,
  ExecutionTrace,
  ExecutionAction,
  SolutionConfig,
  StructuredSolution,
  BlockAction,
  GeneratedGameConfig,
  Coord,
  coordToVector3
} from './types';
import { Block, Item, PathInfo } from '../../core';

// ============================================================================
// SOLUTION BUILDER
// ============================================================================

export class SolutionBuilder {
  /**
   * Build rawActions array from execution trace
   */
  buildRawActions(trace: ExecutionTrace): string[] {
    return trace.actions.map(action => {
      switch (action.type) {
        case 'move': return 'moveForward';
        case 'turn_left': return 'turnLeft';
        case 'turn_right': return 'turnRight';
        case 'collect': return 'collect';
        case 'interact': return `toggle_${action.item}`;
        default: return action.type;
      }
    });
  }

  /**
   * Build basic solution (fully expanded, no procedures)
   */
  buildBasicSolution(trace: ExecutionTrace): StructuredSolution {
    const main: BlockAction[] = trace.actions.map(action => {
      switch (action.type) {
        case 'move':
          return { type: 'maze_moveForward' };
        case 'turn_left':
          return { type: 'maze_turn', direction: 'turnLeft' };
        case 'turn_right':
          return { type: 'maze_turn', direction: 'turnRight' };
        case 'collect':
          return { type: 'maze_collect' };
        case 'interact':
          return { type: 'maze_toggle_switch' };
        default:
          return { type: action.type };
      }
    });

    return { main, procedures: {} };
  }

  /**
   * Build structured solution (with loops/procedures if applicable)
   */
  buildStructuredSolution(template: CodeTemplate, trace: ExecutionTrace): StructuredSolution {
    // For Phase 1, just detect if there's a simple FOR loop pattern
    // and represent it as controls_repeat_ext
    
    const concept = template.concept;
    
    if (concept === 'repeat_n' || concept === 'repeat_until') {
      // Try to find repeated pattern
      const pattern = this.detectRepeatedPattern(trace.actions);
      if (pattern) {
        const loopBlock: BlockAction = {
          type: 'controls_repeat_ext',
          times: pattern.repetitions,
          do: pattern.body.map(action => this.actionToBlock(action))
        };
        return { main: [loopBlock], procedures: {} };
      }
    }
    
    // Fallback to basic solution
    return this.buildBasicSolution(trace);
  }

  /**
   * Build complete solution config
   */
  buildSolutionConfig(
    template: CodeTemplate,
    trace: ExecutionTrace
  ): SolutionConfig {
    const rawActions = this.buildRawActions(trace);
    const basicSolution = this.buildBasicSolution(trace);
    const structuredSolution = this.buildStructuredSolution(template, trace);

    // Count items
    const itemGoals: Record<string, number> = {};
    trace.items.forEach(item => {
      itemGoals[item.type] = (itemGoals[item.type] || 0) + 1;
    });

    return {
      type: 'reach_target',
      itemGoals,
      optimalBlocks: this.countBlocks(structuredSolution),
      optimalLines: this.countBlocks(structuredSolution),
      rawActions,
      structuredSolution,
      basicSolution
    };
  }

  /**
   * Build PathInfo from execution trace
   */
  buildPathInfo(trace: ExecutionTrace): PathInfo {
    return {
      start_pos: trace.startPosition,
      target_pos: trace.endPosition,
      path_coords: trace.pathCoords,
      placement_coords: trace.pathCoords, // In solution-driven, path = placement
      obstacles: [],
      metadata: {
        totalMoves: trace.totalMoves,
        totalCollects: trace.totalCollects,
        loopIterations: trace.loopIterations
      }
    };
  }

  /**
   * Build Item array from execution trace
   */
  buildItems(trace: ExecutionTrace): Item[] {
    return trace.items.map((item, index) => ({
      type: item.type,
      pos: item.position,
      pattern_id: `item_${index}`
    }));
  }

  /**
   * Build ground blocks from path coordinates
   * Ground blocks are placed at path Y minus 1 (one level below player level)
   */
  buildGroundBlocks(trace: ExecutionTrace, modelKey: string = 'ground.earthChecker'): Block[] {
    return trace.pathCoords.map(coord => ({
      modelKey,
      position: {
        x: coord[0],
        y: coord[1] - 1, // Ground is one level below path level
        z: coord[2]
      }
    }));
  }

  /**
   * Build full GameConfig JSON
   */
  buildGameConfig(
    template: CodeTemplate,
    trace: ExecutionTrace,
    seed: string
  ): GeneratedGameConfig {
    const solution = this.buildSolutionConfig(template, trace);
    const groundBlocks = this.buildGroundBlocks(trace);
    
    // Build collectibles
    const collectibles = trace.items
      .filter(item => item.type === 'crystal' || item.type === 'key')
      .map((item, index) => ({
        id: `${item.type[0]}${index + 1}`,
        type: item.type,
        position: coordToVector3(item.position)
      }));

    // Build interactibles
    const interactibles = trace.items
      .filter(item => item.type === 'switch' || item.type === 'gate' || item.type === 'portal')
      .map((item, index) => ({
        id: `${item.type}${index + 1}`,
        type: item.type,
        position: coordToVector3(item.position)
      }));

    // Generate ID
    const conceptUpper = template.concept.toUpperCase().replace(/_/g, '');
    const gradeUpper = template.gradeLevel.replace('-', '');
    const baseId = template.id || `${conceptUpper}_G${gradeUpper}`;
    const id = `${baseId}-${seed}`;

    // Translation keys
    const titleKey = `Challenge.${baseId}.Title`;
    const descKey = `Challenge.${baseId}.Description`;
    const topicKey = `topic-title-${template.meta?.topic || template.concept}`;

    return {
      id,
      gameType: 'maze',
      topic: topicKey,
      level: 1,
      titleKey,
      questTitleKey: descKey,
      descriptionKey: descKey,
      translations: {
        vi: {
          [titleKey]: template.meta?.titleVi || template.concept,
          [descKey]: template.meta?.descVi || `Complete the maze using ${template.concept}`,
          [topicKey]: template.meta?.topic || template.concept
        },
        en: {
          [titleKey]: template.meta?.titleEn || template.concept,
          [descKey]: template.meta?.descEn || `Complete the maze using ${template.concept}`,
          [topicKey]: template.meta?.topic || template.concept
        }
      },
      supportedEditors: ['blockly', 'monaco'],
      blocklyConfig: {
        toolbox: this.buildToolbox(template),
        maxBlocks: solution.optimalBlocks + 5
      },
      gameConfig: {
        type: 'maze',
        renderer: '3d',
        blocks: groundBlocks,
        players: [{
          id: 'player1',
          start: {
            ...coordToVector3(trace.startPosition),
            direction: trace.startDirection
          }
        }],
        collectibles,
        interactibles,
        finish: coordToVector3(trace.endPosition)
      },
      solution,
      sounds: {
        win: '/assets/maze/win.mp3',
        fail: '/assets/maze/fail_pegman.mp3'
      }
    };
  }

  // === Private helpers ===

  private actionToBlock(action: ExecutionAction): BlockAction {
    switch (action.type) {
      case 'move':
        return { type: 'maze_moveForward' };
      case 'turn_left':
        return { type: 'maze_turn', direction: 'turnLeft' };
      case 'turn_right':
        return { type: 'maze_turn', direction: 'turnRight' };
      case 'collect':
        return { type: 'maze_collect' };
      case 'interact':
        return { type: 'maze_toggle_switch' };
      case 'jump':
        return { type: 'maze_jump' };
      default:
        return { type: action.type };
    }
  }

  private detectRepeatedPattern(actions: ExecutionAction[]): { body: ExecutionAction[]; repetitions: number } | null {
    if (actions.length < 2) return null;

    // Try pattern lengths from 1 to half the actions
    for (let patternLen = 1; patternLen <= Math.floor(actions.length / 2); patternLen++) {
      const pattern = actions.slice(0, patternLen);
      let matches = 0;

      for (let i = 0; i < actions.length; i += patternLen) {
        const segment = actions.slice(i, i + patternLen);
        if (segment.length !== patternLen) break;
        
        const isMatch = segment.every((action, j) => 
          action.type === pattern[j].type
        );
        
        if (isMatch) matches++;
        else break;
      }

      if (matches >= 2 && matches * patternLen === actions.length) {
        return { body: pattern, repetitions: matches };
      }
    }

    return null;
  }

  private countBlocks(solution: StructuredSolution): number {
    let count = 0;
    
    const countInBlocks = (blocks: BlockAction[]) => {
      for (const block of blocks) {
        count++;
        if (block.do) countInBlocks(block.do);
      }
    };
    
    countInBlocks(solution.main);
    Object.values(solution.procedures).forEach(proc => countInBlocks(proc));
    
    return count;
  }

  private buildToolbox(template: CodeTemplate): any {
    // Build appropriate toolbox based on concept
    const contents: any[] = [
      {
        kind: 'category',
        name: '%{BKY_GAMES_CATMOVEMENT}',
        categorystyle: 'movement_category',
        contents: [
          { kind: 'block', type: 'maze_moveForward' },
          { kind: 'block', type: 'maze_turn' },
          ...(template.code.includes('jump') ? [{ kind: 'block', type: 'maze_jump' }] : [])
        ]
      },
      {
        kind: 'category',
        name: '%{BKY_GAMES_CATACTIONS}',
        categorystyle: 'actions_category',
        contents: [
          { kind: 'block', type: 'maze_collect' }
        ]
      }
    ];

    // Add loops category if concept involves loops
    if (template.concept.includes('loop') || template.concept.includes('repeat')) {
      contents.push({ kind: 'sep' });
      contents.push({
        kind: 'category',
        name: '%{BKY_GAMES_CATLOOPS}',
        categorystyle: 'loop_category',
        contents: [
          { kind: 'block', type: 'controls_repeat_ext' }
        ]
      });
    }

    return { kind: 'categoryToolbox', contents };
  }
}
