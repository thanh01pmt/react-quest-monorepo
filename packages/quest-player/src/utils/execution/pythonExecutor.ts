
// packages/quest-player/src/utils/execution/pythonExecutor.ts

import { GameState, MazeConfig } from '../../types';
import { IMazeEngine } from '../../games/maze/MazeEngine';

declare global {
  interface Window {
    loadPyodide: any;
  }
}

let pyodideInstance: any = null;
let isLoading = false;

const PYODIDE_CDN_URL = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js';

export const loadPyodideEngine = async (): Promise<any> => {
  if (pyodideInstance) return pyodideInstance;
  if (isLoading) {
    // Wait for existing load
    while (isLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
      if (pyodideInstance) return pyodideInstance;
    }
  }

  isLoading = true;
  try {
    if (!window.loadPyodide) {
      const script = document.createElement('script');
      script.src = PYODIDE_CDN_URL;
      document.body.appendChild(script);
      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = reject;
      });
    }

    pyodideInstance = await window.loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/",
    });
    console.log("Pyodide loaded successfully");
    return pyodideInstance;
  } catch (err) {
    console.error("Failed to load Pyodide:", err);
    throw err;
  } finally {
    isLoading = false;
  }
};

export const executePython = async (code: string, engine: IMazeEngine): Promise<GameState[]> => {
  const pyodide = await loadPyodideEngine();
  
  // Log container
  const executionLog: GameState[] = [];
  executionLog.push(engine.getInitialState());

  // Helper to record state
  const recordState = () => {
    executionLog.push(engine.getCurrentState());
  };

  // Bindings
  // We explicitly bind engine methods to Python globals using PUBLIC API
  const bindings = {
    moveForward: () => {
      const before = engine.getCurrentState();
      const player = (before as any).players?.[(before as any).activePlayerId];
      console.log(`[DEBUG] moveForward BEFORE: x=${player?.x}, z=${player?.z}, dir=${player?.direction}`);
      engine.doMoveForward();
      const after = engine.getCurrentState();
      const playerAfter = (after as any).players?.[(after as any).activePlayerId];
      console.log(`[DEBUG] moveForward AFTER: x=${playerAfter?.x}, z=${playerAfter?.z}, pose=${playerAfter?.pose}`);
      recordState();
      console.log(`[DEBUG] executionLog now has ${executionLog.length} states`);
    },
    turnLeft: () => { engine.doTurnLeft(); recordState(); },
    turnRight: () => {
      console.log('[DEBUG] turnRight called');
      engine.doTurnRight();
      recordState();
    },
    jump: () => {
      const before = engine.getCurrentState();
      const player = (before as any).players?.[(before as any).activePlayerId];
      console.log(`[DEBUG] jump BEFORE: x=${player?.x}, z=${player?.z}, y=${player?.y}`);
      engine.doJump();
      const after = engine.getCurrentState();
      const playerAfter = (after as any).players?.[(after as any).activePlayerId];
      console.log(`[DEBUG] jump AFTER: x=${playerAfter?.x}, z=${playerAfter?.z}, y=${playerAfter?.y}, pose=${playerAfter?.pose}`);
      recordState();
    },
    collect: () => { engine.doCollectItem(); recordState(); },
    toggleSwitch: () => { engine.doToggleSwitch(); recordState(); },
    
    // Wrapper for generator output: turn("turnLeft") or turn("turnRight")
    turn: (direction: string) => {
      if (direction === 'turnLeft' || direction === 'left') {
        engine.doTurnLeft();
      } else {
        engine.doTurnRight();
      }
      recordState();
    },
    
    // Checks (return boolean/int)
    isPathForward: () => (engine as any).isPath(0),
    isPathRight: () => (engine as any).isPath(1),
    isPathLeft: () => (engine as any).isPath(3),
    isPathBackward: () => (engine as any).isPath(2),
    
    // Wrapper for generator output: isPath("forward") etc.
    isPath: (direction: string) => {
      const dirMap: Record<string, number> = { 'forward': 0, 'right': 1, 'backward': 2, 'left': 3 };
      return (engine as any).isPath(dirMap[direction] ?? 0);
    },
    
    isItemPresent: () => (engine as any).isItemPresent(),
    itemCount: () => (engine as any).getItemCount(),
    atFinish: () => !(engine as any).notDone(),
    isSwitchState: (state: string) => (engine as any).isSwitchState?.(state) ?? false,
    
    // Utils
    print: (msg: string) => console.log("[Python]", msg),
  };

  // Register bindings
  Object.keys(bindings).forEach(key => {
    pyodide.globals.set(key, (bindings as any)[key]);
  });

  // Run the code
  try {
    // Reset engine first? The caller should handle resetting the engine/providing a fresh one.
    // Ideally user provides a fresh engine or we reset it here. 
    // engine.reset() should be called by caller.
    
    // Pyodide run
    await pyodide.runPythonAsync(code);
    
    return executionLog;
  } catch (err: any) {
    console.error("Python execution error:", err);
    // Create an error state
    const errorState = engine.getCurrentState();
    errorState.result = 'error'; // You might need to add 'error' to GameState result type if not present
    executionLog.push(errorState);
    throw err;
  }
};
