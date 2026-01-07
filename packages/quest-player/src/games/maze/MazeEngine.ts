// src/games/maze/MazeEngine.ts

import Interpreter from 'js-interpreter';
import type { IGameEngine, GameConfig, GameState, MazeConfig, SolutionConfig, StepResult, PlayerConfig, Block, Portal, Direction } from '../../types';
import type { MazeGameState, PlayerState, WorldGridCell } from './types';

import { GameAssets } from './config/gameAssets';
import { randomizeItems, isRandomMode } from '../../utils/randomizeItems';

export interface IMazeEngine extends IGameEngine {
  triggerInteraction(): MazeGameState | null;
  completeTeleport(): void;
  getCurrentState(): MazeGameState;
  
  // Public API for external executors (Python/Lua)
  doMoveForward(): void;
  doTurnLeft(): void;
  doTurnRight(): void;
  doJump(): void;
  doCollectItem(): void;
  doToggleSwitch(): void;
  checkIsPath(direction: 0 | 1 | 3): boolean;
  checkIsItemPresent(): boolean;
  checkNotDone(): boolean;
  
  // Random Item Mode API
  setItemGoals(goals: { crystal?: number; key?: number }): void;
  countItemsRemaining(itemType?: 'any' | 'crystal' | 'key'): number;
  
  // Speech API
  doSay(characterId: string, text: string): void;
  
  // OOP-Lite API for multi-character support (Phase 3)
  doActionForCharacter(characterId: string, action: string): void;
  checkPathForCharacter(characterId: string, direction: 0 | 1 | 3): boolean;
}

// [FIX] Define walkable and non-walkable blocks explicitly to ensure consistency.
// Automatic generation from GameAssets can lead to name mismatches (e.g., 'wallStone' vs 'wall.stone01').

// These are blocks that the character can walk and jump on.
const WALKABLE_MODELS = [
  'ground.checker', 'ground.earth', 'ground.earthChecker', 'ground.mud', 'ground.normal', 'ground.snow',
  'stone.stone01', 'stone.stone02', 'stone.stone03', 'stone.stone04', 'stone.stone05', 'stone.stone06', 'stone.stone07',
  'wall.brick01', 'wall.brick02', 'wall.brick03', 'wall.brick04', 'wall.brick05', 'wall.brick06', 'ice.ice01'
];

// These are blocks that act as solid obstacles but cannot be walked or jumped on.
const NON_WALKABLE_MODELS = [
  'wall.stone01', // Explicitly define the wall stone
  'water',        // Corresponds to water.glb
  'lava',         // Corresponds to lava.glb
];

// All solid blocks are a combination of the two lists above.
const SOLID_BLOCK_MODELS = [...WALKABLE_MODELS, ...NON_WALKABLE_MODELS];

export class MazeEngine implements IMazeEngine {
  public readonly gameType = 'maze';

  private readonly initialGameState: MazeGameState;
  private readonly finish: { x: number; y: number; z: number };
  
  private currentState!: MazeGameState;
  private interpreter: any | null = null;
  private highlightedBlockId: string | null = null;
  private executedAction: boolean = false;
  
  // Item goals for Random Item Mode (itemGoals < totalItems)
  private itemGoals: { crystal?: number; key?: number } = {};

  // Store original config for re-randomization on reset
  private originalConfig: MazeConfig;

  constructor(gameConfig: GameConfig) {
    // Deep clone config to preserve the original pool for reset() randomization
    // This prevents the constructor's initial randomization from permanently truncating the item pool in originalConfig
    this.originalConfig = JSON.parse(JSON.stringify(gameConfig));
    
    // Work with a mutable copy for initialization (or just use gameConfig if we don't care about side effects on the passed arg)
    const config = gameConfig as MazeConfig;

    // Apply initial randomization if needed
    if (isRandomMode(config)) {
      const { collectibles, interactiveStates, itemGoals } = randomizeItems(config);
      // OVERRIDE initialization data
      config.collectibles = collectibles; // Note: This mutates local 'config' ref, not original prop deep clone if passed by val
      // To strictly avoid side-effects on the passed prop, we should have cloned it. 
      // But assuming 'config' is already a structured object we can modify for this instance.
      // Better: we update the initial state construction below using these values.
    }
    
    const players: PlayerConfig[] = config.players || (config.player ? [{ ...config.player, id: 'player1' }] : []);
    const playerStates: { [id: string]: PlayerState } = {};
    for (const p of players) {
      playerStates[p.id] = {
        id: p.id,
        x: p.start.x,
        y: p.start.y ?? 1,
        z: p.start.z ?? p.start.y,
        direction: p.start.direction ?? 1,
        pose: 'Idle',
        xPrev: p.start.x,
        zPrev: p.start.z ?? p.start.y,
      };
    }

    const unbuiltState: Omit<MazeGameState, 'worldGrid'> = {
      blocks: this.normalizeBlocks(config),
      collectibles: config.collectibles || [], // Will be randomized if mode=random
      interactibles: config.interactibles || [],
      players: playerStates,
      activePlayerId: players[0]?.id || '',
      collectedIds: [],
      interactiveStates: (config.interactibles || []).reduce((acc, item) => {
        if (item.type === 'switch') {
           // If random mode, use randomized state. Otherwise use initial.
           // However, randomizeItems wrapper above mutated 'config' or we need to apply it here.
           // Let's rely on reset() to handle the rigorous randomization, 
           // but for constructor we need to do it once.
           // Since we can't easily change the implementation above without heavy diffs, 
           // lets use the helper inside constructor logic properly.
           acc[item.id] = item.initialState;
        }
        return acc;
      }, {} as { [id: string]: string }),
      result: 'unset',
      isFinished: false,
    };
    
    // Apply Randomization Logic (Constructor)
    if (isRandomMode(config)) {
       const { collectibles, interactiveStates, itemGoals } = randomizeItems(config);
       unbuiltState.collectibles = collectibles; // Only show visible
       unbuiltState.interactiveStates = { ...unbuiltState.interactiveStates, ...interactiveStates };
       this.itemGoals = itemGoals;
    }

    this.initialGameState = {
      ...unbuiltState,
      worldGrid: this._buildWorldGrid(unbuiltState),
    };

    this.finish = {
      x: config.finish.x,
      y: config.finish.y,
      z: config.finish.z ?? config.finish.y,
    };

    this.currentState = this.getInitialState();
  }

  private _buildWorldGrid(state: Omit<MazeGameState, 'worldGrid'>): Record<string, WorldGridCell> {
    const grid: Record<string, WorldGridCell> = {};
    
    for (const block of state.blocks) {
      const key = `${block.position.x},${block.position.y},${block.position.z}`;
      grid[key] = { type: 'block', isSolid: true };
    }
    for (const item of state.collectibles) {
      const key = `${item.position.x},${item.position.y},${item.position.z}`;
      grid[key] = { type: 'collectible', isSolid: false, id: item.id };
    }
    for (const item of state.interactibles) {
      const key = `${item.position.x},${item.position.y},${item.position.z}`;
      grid[key] = { type: item.type, isSolid: false, id: item.id };
    }
    
    return grid;
  }

  private normalizeBlocks(config: MazeConfig): Block[] {
    if (config.blocks) return config.blocks;
    if (config.map) {
      const blocks: Block[] = [];
      for (let y = 0; y < config.map.length; y++) {
        for (let x = 0; x < config.map[y].length; x++) {
          const cell = config.map[y][x];
          if (cell === 0) {
            blocks.push({ modelKey: 'wall.brick01', position: { x, y: 0, z: y } });
          } else if (cell !== 0) {
            blocks.push({ modelKey: 'ground.normal', position: { x, y: 0, z: y } });
          }
        }
      }
      return blocks;
    }
    return [];
  }

  getInitialState(): MazeGameState {
    return JSON.parse(JSON.stringify(this.initialGameState));
  }


  getCurrentState(): MazeGameState {
    return JSON.parse(JSON.stringify(this.currentState));
  }

  reset(): void {
    // If Random Mode, re-randomize on reset!
    if (isRandomMode(this.originalConfig)) {
       const { collectibles, interactiveStates, itemGoals } = randomizeItems(this.originalConfig);
       
       // Update initialGameState to reflect new random seed
       this.itemGoals = itemGoals;
       // We must accept that this.initialGameState is effectively MUTABLE for Random Mode resets
       this.initialGameState.collectibles = collectibles;
       this.initialGameState.interactiveStates = { ...this.initialGameState.interactiveStates, ...interactiveStates };
       
       // Rebuild world grid because collectibles changed
       this.initialGameState.worldGrid = this._buildWorldGrid({
         ...this.initialGameState,
         // Pass collectibles explicitly as they were just updated
         collectibles: collectibles 
       });
    }

    this.currentState = this.getInitialState();
    this.interpreter = null;
    this.highlightedBlockId = null;
    this.executedAction = false;
  }

  // ============================================
  // PUBLIC API for external executors (Python/Lua)
  // ============================================
  
  /** Move the active player forward one unit */
  public doMoveForward(): void {
    this.moveForward();
  }

  /** Turn the active player left */
  public doTurnLeft(): void {
    this.turnLeft();
  }

  /** Turn the active player right */
  public doTurnRight(): void {
    this.turnRight();
  }

  /** Make the active player jump */
  public doJump(): void {
    this.jump();
  }

  /** Collect item at current position */
  public doCollectItem(): void {
    this.collectItem();
  }

  /** Toggle switch at current position */
  public doToggleSwitch(): void {
    this.toggleSwitch();
  }

  /** Check if path is open in given direction (0=forward, 1=right, 3=left) */
  public checkIsPath(direction: 0 | 1 | 3): boolean {
    return this.isPath(direction);
  }

  public doSay(characterId: string, text: string): void {
    if (!characterId) characterId = this.currentState.activePlayerId;
    const player = this.currentState.players[characterId];
    if (player) {
      player.speech = text;
    }
  }

  public doWait(seconds: number): void {
    const player = this.getActivePlayer();
    player.waitEndTime = Date.now() + (seconds * 1000);
  }

  /** Check if there is an item at current position */
  public checkIsItemPresent(): boolean {
    return this.isItemPresent();
  }

  /** Check if player has reached the finish */
  public checkNotDone(): boolean {
    return this.notDone();
  }

  /** Set item goals for Random Item Mode (when itemGoals < totalItems on map) */
  public setItemGoals(goals: { crystal?: number; key?: number }): void {
    this.itemGoals = goals;
  }

  /** Get remaining items to collect (goal - collected). Only meaningful when itemGoals < totalItems. */
  public countItemsRemaining(itemType: 'any' | 'crystal' | 'key' = 'crystal'): number {
    const totalOnMap = this.initialGameState.collectibles.filter(
      c => itemType === 'any' || c.type === itemType
    ).length;
    const goal = this.itemGoals[itemType as 'crystal' | 'key'] ?? totalOnMap;
    const collected = this.getItemCount(itemType);
    return Math.max(0, goal - collected);
  }

  // ============================================
  // OOP-Lite API for multi-character support (Phase 3)
  // ============================================

  /**
   * Execute an action for a specific character by ID.
   * Temporarily switches activePlayerId, executes action, then restores.
   * @param characterId - The ID of the character (e.g., "player1", "player2")
   * @param action - The action name (e.g., "MoveForward", "TurnLeft")
   */
  public doActionForCharacter(characterId: string, action: string): void {
    const previousActiveId = this.currentState.activePlayerId;
    
    // Switch to the target character
    if (this.currentState.players[characterId]) {
      this.currentState.activePlayerId = characterId;
    } else {
      console.warn(`[OOP-Lite] Character "${characterId}" not found`);
      return;
    }
    
    // Execute the action
    const actionMap: Record<string, () => void> = {
      'MoveForward': () => this.doMoveForward(),
      'TurnLeft': () => this.doTurnLeft(),
      'TurnRight': () => this.doTurnRight(),
      'Jump': () => this.doJump(),
      'CollectItem': () => this.doCollectItem(),
      'ToggleSwitch': () => this.doToggleSwitch(),
    };
    
    const actionFn = actionMap[action];
    if (actionFn) {
      actionFn();
    } else {
      console.warn(`[OOP-Lite] Unknown action "${action}"`);
    }
    
    // Restore previous active player (optional, depending on game design)
    // this.currentState.activePlayerId = previousActiveId;
  }

  /**
   * Check if path is open for a specific character.
   * @param characterId - The ID of the character
   * @param direction - 0=forward, 1=right, 3=left
   */
  public checkPathForCharacter(characterId: string, direction: 0 | 1 | 3): boolean {
    const previousActiveId = this.currentState.activePlayerId;
    
    if (this.currentState.players[characterId]) {
      this.currentState.activePlayerId = characterId;
    } else {
      console.warn(`[OOP-Lite] Character "${characterId}" not found`);
      return false;
    }
    
    const result = this.checkIsPath(direction);
    
    // Restore previous active player
    this.currentState.activePlayerId = previousActiveId;
    
    return result;
  }

  execute(userCode: string): void {
    this.currentState = this.getInitialState();
    this.highlightedBlockId = null;

    const initApi = (interpreter: any, globalObject: any) => {
      const createWrapper = (func: Function, isAction: boolean) => {
        return interpreter.createNativeFunction((...args: any[]) => {
          const blockId = args.pop();
          this.highlight(blockId);
          if (isAction) this.executedAction = true;
          return func.apply(this, args);
        });
      };

      interpreter.setProperty(globalObject, 'moveForward', createWrapper(this.moveForward.bind(this), true));
      interpreter.setProperty(globalObject, 'turnLeft', createWrapper(this.turnLeft.bind(this), true));
      interpreter.setProperty(globalObject, 'turnRight', createWrapper(this.turnRight.bind(this), true));
      interpreter.setProperty(globalObject, 'jump', createWrapper(this.jump.bind(this), true));
      interpreter.setProperty(globalObject, 'isPathForward', createWrapper(this.isPath.bind(this, 0), false));
      interpreter.setProperty(globalObject, 'isPathRight', createWrapper(this.isPath.bind(this, 1), false));
      interpreter.setProperty(globalObject, 'isPathLeft', createWrapper(this.isPath.bind(this, 3), false));
      interpreter.setProperty(globalObject, 'notDone', createWrapper(this.notDone.bind(this), false));
      interpreter.setProperty(globalObject, 'collectItem', createWrapper(this.collectItem.bind(this), true));
      interpreter.setProperty(globalObject, 'isItemPresent', createWrapper(this.isItemPresent.bind(this), false));
      interpreter.setProperty(globalObject, 'getItemCount', createWrapper(this.getItemCount.bind(this), false));
      interpreter.setProperty(globalObject, 'countItemsRemaining', createWrapper(this.countItemsRemaining.bind(this), false));
      interpreter.setProperty(globalObject, 'placeBlock', createWrapper(() => {}, true));
      interpreter.setProperty(globalObject, 'removeBlock', createWrapper(() => {}, true));
      interpreter.setProperty(globalObject, 'toggleSwitch', createWrapper(this.toggleSwitch.bind(this), true));
      // SỬA LỖI: Các hàm điều kiện cần trả về một đối tượng boolean của interpreter, không phải giá trị boolean gốc.
      const createConditionalWrapper = (func: (...args: any[]) => boolean) => {
        return interpreter.createNativeFunction(func.bind(this));
      };
      interpreter.setProperty(globalObject, 'isSwitchState', createConditionalWrapper(this.isSwitchState));
      
      // Speech API
      interpreter.setProperty(globalObject, 'say', interpreter.createNativeFunction((text: string, blockId: string) => {
        if (blockId) this.highlight(blockId);
        this.doSay('', text);
        this.executedAction = true; 
      }));

      interpreter.setProperty(globalObject, 'wait', interpreter.createNativeFunction((seconds: number, blockId: string) => {
        if (blockId) this.highlight(blockId);
        this.doWait(seconds);
        this.executedAction = true; 
      }));

      // ============================================
      // OOP-Lite: Create Character objects (Phase 3)
      // ============================================
      
      // Helper to create a Character object with methods
      const createCharacterObject = (characterId: string) => {
        const charObj = interpreter.nativeToPseudo({});
        
        // Store the character ID
        interpreter.setProperty(charObj, 'id', interpreter.nativeToPseudo(characterId));
        
        // Create method wrappers that use doActionForCharacter
        const createCharMethod = (action: string, isAction: boolean) => {
          return interpreter.createNativeFunction((...args: any[]) => {
            const blockId = args.pop();
            this.highlight(blockId);
            if (isAction) this.executedAction = true;
            this.doActionForCharacter(characterId, action);
          });
        };
        
        const createSensorMethod = (direction: 0 | 1 | 3) => {
          return interpreter.createNativeFunction(() => {
            return this.checkPathForCharacter(characterId, direction);
          });
        };
        
        // Action methods
        interpreter.setProperty(charObj, 'moveForward', createCharMethod('MoveForward', true));
        interpreter.setProperty(charObj, 'turnLeft', createCharMethod('TurnLeft', true));
        interpreter.setProperty(charObj, 'turnRight', createCharMethod('TurnRight', true));
        interpreter.setProperty(charObj, 'jump', createCharMethod('Jump', true));
        interpreter.setProperty(charObj, 'collect', createCharMethod('CollectItem', true));
        interpreter.setProperty(charObj, 'toggleSwitch', createCharMethod('ToggleSwitch', true));
        
        interpreter.setProperty(charObj, 'say', interpreter.createNativeFunction((text: string, blockId: string) => {
            if (blockId) this.highlight(blockId);
            this.doSay(characterId, text);
            this.executedAction = true;
        }));
        
        // Sensor methods
        interpreter.setProperty(charObj, 'isPathForward', createSensorMethod(0));
        interpreter.setProperty(charObj, 'isPathRight', createSensorMethod(1));
        interpreter.setProperty(charObj, 'isPathLeft', createSensorMethod(3));
        
        return charObj;
      };
      
      // Create default character objects
      // In the future, this can be populated from quest config
      interpreter.setProperty(globalObject, 'robot1', createCharacterObject('player1'));
      interpreter.setProperty(globalObject, 'robot2', createCharacterObject('player2'));
    };

    this.interpreter = new Interpreter(userCode, initApi);
  }
  
  step(): StepResult {
    const player = this.getActivePlayer();

    // Handle Wait
    if (player.waitEndTime) {
       if (Date.now() < player.waitEndTime) {
           return {
             done: false,
             state: JSON.parse(JSON.stringify(this.currentState)),
             highlightedBlockId: this.highlightedBlockId
           };
       } else {
           player.waitEndTime = undefined;
       }
    }

    const currentPlayerPose = player.pose;
    
    const oneShotPoses = [
      'TeleportIn',
      'Bump', 
      'Victory', 
      'TurningLeft', 
      'TurningRight',
      'Collecting',
      'Toggling'
    ];

    if (currentPlayerPose && oneShotPoses.includes(currentPlayerPose)) {
      this.getActivePlayer().pose = 'Idle';
      const stateToReturn = JSON.parse(JSON.stringify(this.currentState));
      
      return {
        done: this.currentState.isFinished,
        state: stateToReturn,
        highlightedBlockId: this.highlightedBlockId
      };
    }

    if (!this.interpreter || this.currentState.isFinished) return null;

    this.highlightedBlockId = null;
    this.executedAction = false;
    let hasMoreCode = true;

    while (hasMoreCode && !this.executedAction) {
      try {
        hasMoreCode = this.interpreter.step();
      } catch (e) {
        this.currentState.result = 'error';
        this.currentState.isFinished = true;
        return { done: true, state: this.currentState, highlightedBlockId: this.highlightedBlockId };
      }
    }

    if (!hasMoreCode && !this.executedAction) {
      this.currentState.isFinished = true;
      if (this.notDone()) {
        this.getActivePlayer().pose = 'Idle'
        this.currentState.result = 'failure';
      } else {
        this.currentState.result = 'success';
        this.logVictoryAnimation();
      }

      return {
        done: true,
        state: JSON.parse(JSON.stringify(this.currentState)),
        highlightedBlockId: this.highlightedBlockId
      };
    }

    if (!hasMoreCode) {
      this.currentState.result = this.notDone() ? 'failure' : 'success';
      if (this.currentState.result === 'success') this.logVictoryAnimation();
      this.currentState.isFinished = true;
    }
    
    return {
      done: this.currentState.isFinished,
      state: JSON.parse(JSON.stringify(this.currentState)),
      highlightedBlockId: this.highlightedBlockId
    };
  }

  checkWinCondition(finalState: GameState, _solutionConfig: SolutionConfig): boolean {
    const state = finalState as MazeGameState;
    const activePlayer = state.players[state.activePlayerId];
    return activePlayer.x === this.finish.x && activePlayer.y === this.finish.y && activePlayer.z === this.finish.z;
  }
  
  private highlight(id?: any): void {
    if (typeof id === 'string' && id.startsWith('block_id_')) {
      this.highlightedBlockId = id.replace('block_id_', '');
    }
  }

  private getActivePlayer(): PlayerState {
    return this.currentState.players[this.currentState.activePlayerId];
  }

  private getNextPosition(x: number, z: number, direction: Direction): { x: number, z: number } {
    if (direction === 0) z--;      // South (-Z)
    else if (direction === 1) x++; // West (+X)
    else if (direction === 2) z++; // North (+Z)
    else if (direction === 3) x--; // East (-X)
    return { x, z };
  }
  
  private _getBlockModelAt(x: number, y: number, z: number): string | null {
    const cell = this.currentState.worldGrid[`${x},${y},${z}`];
    if (!cell || cell.type !== 'block') return null;
    // Tìm block tương ứng trong danh sách blocks để lấy modelKey
    const blockData = this.initialGameState.blocks.find(b => 
      b.position.x === x && b.position.y === y && b.position.z === z
    );
    return blockData?.modelKey || null;
  }

  private _isGroundAt(x: number, y: number, z: number): boolean {
    const model = this._getBlockModelAt(x, y, z);
    if (!model) return false;
    // A block is considered "ground" if it is explicitly defined as walkable.
    return WALKABLE_MODELS.includes(model);
  }

  private _isWalkable(x: number, y: number, z: number): boolean {
    // A position is walkable if there's no block at that level, and a walkable ground block one level below.
    const modelAtDest = this._getBlockModelAt(x, y, z);
    return modelAtDest === null && this._isGroundAt(x, y - 1, z);
  }

  private moveForward(): void {
    const player = this.getActivePlayer();
    const { x: nextX, z: nextZ } = this.getNextPosition(player.x, player.z, player.direction);

    let targetY: number | null = null;
    if (this._isWalkable(nextX, player.y, nextZ)) {
      targetY = player.y;
    }

    if (targetY === null) {
      player.pose = 'Bump';
      return;
    }

    player.xPrev = player.x;
    player.zPrev = player.z;

    player.pose = 'Walking';
    player.x = nextX;
    player.y = targetY;
    player.z = nextZ;
  }

  private _isJumpable(modelKey: string | null): boolean {    
    if (!modelKey) return false;
    // A block can be jumped on if it is explicitly defined as walkable.
    return WALKABLE_MODELS.includes(modelKey);
  }

  private jump(): void {
    const player = this.getActivePlayer();
    const { x: nextX, z: nextZ } = this.getNextPosition(player.x, player.z, player.direction);

    let targetY: number | null = null;

    // Ưu tiên 1: Nhảy LÊN một khối
    const obstacleModel = this._getBlockModelAt(nextX, player.y, nextZ);
    const modelAtLandingSpot = this._getBlockModelAt(nextX, player.y + 1, nextZ);
    if (this._isJumpable(obstacleModel) && modelAtLandingSpot === null) {
      // Có thể nhảy lên
      targetY = player.y + 1;
    }
    // Ưu tiên 2: Nhảy BẰNG (qua một khoảng trống)
    else if (this._isWalkable(nextX, player.y, nextZ)) {
      // Có thể nhảy bằng (giữ nguyên độ cao)
      targetY = player.y;
    }
    // Ưu tiên 3: Nhảy XUỐNG một bậc
    else if (this._isWalkable(nextX, player.y - 1, nextZ)) {
      targetY = player.y - 1;
    }

    if (targetY === null) {
      // Không thể nhảy, va vào tường
      player.pose = 'Bump';
      return;
    }

    player.xPrev = player.x;
    player.zPrev = player.z;

    player.pose = 'Jumping';
    player.x = nextX;
    player.y = targetY;
    player.z = nextZ;
  }

  private turnLeft(): void {
    this.getActivePlayer().direction = this.constrainDirection(this.getActivePlayer().direction - 1);
    this.getActivePlayer().pose = 'TurningLeft';
  }

  private turnRight(): void {
    this.getActivePlayer().direction = this.constrainDirection(this.getActivePlayer().direction + 1);
    this.getActivePlayer().pose = 'TurningRight';
  }

  private isPath(relativeDirection: 0 | 1 | 3): boolean {
    const player = this.getActivePlayer();
    const effectiveDirection = this.constrainDirection(player.direction + relativeDirection);
    const { x: nextX, z: nextZ } = this.getNextPosition(player.x, player.z, effectiveDirection);

    // Kiểm tra có thể đi thẳng (trên cùng mặt phẳng hoặc đi xuống)
    if (this._isWalkable(nextX, player.y, nextZ) || this._isWalkable(nextX, player.y - 1, nextZ)) {
      return true;
    }

    // Kiểm tra có thể nhảy qua 'wall.brick01' để đi lên
    const obstacleModel = this._getBlockModelAt(nextX, player.y, nextZ);
    const canJumpUp = this._isJumpable(obstacleModel) && this._isWalkable(nextX, player.y + 1, nextZ);
    return canJumpUp;
  }

  private notDone(): boolean {
    const player = this.getActivePlayer();
    return player.x !== this.finish.x || player.y !== this.finish.y || player.z !== this.finish.z;
  }
  
  private logVictoryAnimation(): void {
    this.getActivePlayer().pose = 'Victory';
  }

  private constrainDirection(d: number): Direction {
    d = Math.round(d) % 4;
    if (d < 0) d += 4;
    return d as Direction;
  }

  private collectItem(): boolean {
    const player = this.getActivePlayer();
    const cell = this.currentState.worldGrid[`${player.x},${player.y},${player.z}`];

    if (cell && cell.type === 'collectible' && cell.id && !this.currentState.collectedIds.includes(cell.id)) {
      this.currentState.collectedIds.push(cell.id);
      this.currentState.collectibles = this.currentState.collectibles.filter(c => c.id !== cell.id);
      this.currentState.worldGrid = this._buildWorldGrid(this.currentState);
      
      player.pose = 'Collecting';

      return true;
    }
    return false;
  }

  private isItemPresent(itemType: 'any' | 'crystal' | 'key' = 'any'): boolean {
    const player = this.getActivePlayer();
    const cell = this.currentState.worldGrid[`${player.x},${player.y},${player.z}`];
    
    if (!cell || cell.type !== 'collectible') return false;
    if (itemType === 'any') return true;

    const item = this.initialGameState.collectibles.find(c => c.id === cell.id);
    return item?.type === itemType;
  }

  private getItemCount(itemType: 'any' | 'crystal' | 'key' = 'any'): number {
    if (itemType === 'any') return this.currentState.collectedIds.length;
    
    const collectedTypes = this.initialGameState.collectibles
      .filter(c => this.currentState.collectedIds.includes(c.id))
      .map(c => c.type);
    
    return collectedTypes.filter(type => type === itemType).length;
  }

  private toggleSwitch(): boolean {
    const player = this.getActivePlayer();
    const cell = this.currentState.worldGrid[`${player.x},${player.y},${player.z}`];

    if (cell && cell.type === 'switch' && cell.id) {
        const currentState = this.currentState.interactiveStates[cell.id];
        this.currentState.interactiveStates[cell.id] = currentState === 'on' ? 'off' : 'on';

        player.pose = 'Toggling';

        return true;
    }
    return false;
  }

  isSwitchState(state: 'on' | 'off'): boolean {
    const player = this.getActivePlayer();
    const cell = this.currentState.worldGrid[`${player.x},${player.y},${player.z}`];
    
    if (cell && cell.type === 'switch' && cell.id) {
        return this.currentState.interactiveStates[cell.id] === state;
    }
    return false;
  }

  public triggerInteraction(): MazeGameState | null {
    const player = this.getActivePlayer();
    const cell = this.currentState.worldGrid[`${player.x},${player.y},${player.z}`];
    
    if (cell && cell.type === 'portal') {
      const portalConfig = this.initialGameState.interactibles.find(i => i.id === cell.id) as Portal | undefined;

      // Check if portal is enabled by a switch
      if (portalConfig?.controlSwitchId) {
        const switchState = this.currentState.interactiveStates[portalConfig.controlSwitchId];
        if (switchState !== 'on') {
            // Disabled
            return null;
        }
      }

      const justMoved = (player.xPrev !== player.x) || (player.zPrev !== player.z);
      
      if (justMoved) {
        player.pose = 'TeleportOut';
        console.log(`%c[MazeEngine] Triggered TeleportOut at position {x:${player.x}, y:${player.y}, z:${player.z}}`, 'color: #3498db; font-weight: bold;');
        return this.getCurrentState();
      }
    }
    return null;
  }

  public completeTeleport(): void {
    const player = this.getActivePlayer();
    const posKey = `${player.x},${player.y},${player.z}`;
    const cell = this.currentState.worldGrid[posKey];

    if (cell && cell.type === 'portal' && cell.id) {
      const sourcePortal = this.initialGameState.interactibles.find(i => i.id === cell.id) as Portal | undefined;
      if (sourcePortal) {
        const targetPortal = this.initialGameState.interactibles.find(i => i.id === sourcePortal.targetId) as Portal | undefined;
        if (targetPortal) {
          player.x = targetPortal.position.x;
          player.y = targetPortal.position.y;
          player.z = targetPortal.position.z;
          player.direction = targetPortal.exitDirection ?? player.direction;
          
          player.xPrev = player.x;
          player.zPrev = player.z;
          
          player.pose = 'TeleportIn';
          console.log(`%c[MazeEngine] Completed Teleport to new position {x:${player.x}, y:${player.y}, z:${player.z}}`, 'color: #3498db; font-weight: bold;');
        }
      }
    }
  }
}