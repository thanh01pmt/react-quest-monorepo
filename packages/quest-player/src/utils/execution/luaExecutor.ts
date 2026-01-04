
// packages/quest-player/src/utils/execution/luaExecutor.ts

import { GameState } from '../../types';
import { IMazeEngine } from '../../games/maze/MazeEngine';
import * as fengari from 'fengari-web';

export const executeLua = async (code: string, engine: IMazeEngine): Promise<GameState[]> => {
  // Lua state is lightweight, we can create a new one or use a shared one.
  // fengari-web provides 'lua' object which is a wrapper.
  // Ideally we use the raw lua C-API via fengari to be robust, but fengari-web has `load` and `interop`.

  const executionLog: GameState[] = [];
  executionLog.push(engine.getInitialState());

  const recordState = () => {
    executionLog.push(engine.getCurrentState());
  };

  // Define bindings
  // In Fengari-web, global functions can be set on window (bad) or passed via interop.
  // A cleaner way with `fengari` is creating a state, but `fengari-web` simplifies this by using JS interop.
  // However, `fengari-web` executes in the browser context. 
  
  // Let's use the low-level API from fengari (lauxlib, lualib) if possible, 
  // but `fengari-web` is easier.
  // Important: fengari-web usually expects a script tag or direct string execution.
  
  // Strategy: We will inject the functions into the *Lua* global environment.
  // With `fengari-web`, we can use `fengari.interop.push(L, func)`.
  
  const L = fengari.lauxlib.luaL_newstate();
  fengari.lualib.luaL_openlibs(L);
  const lua = fengari.lua;
  const interop = fengari.interop;

  const registerFunc = (name: string, func: Function) => {
    lua.lua_pushstring(L, name);
    interop.push(L, func);
    lua.lua_settable(L, lua.LUA_GLOBALSINDEX);
  };

  // Bindings using PUBLIC API
  registerFunc("moveForward", () => { engine.doMoveForward(); recordState(); });
  registerFunc("turnLeft", () => { engine.doTurnLeft(); recordState(); });
  registerFunc("turnRight", () => { engine.doTurnRight(); recordState(); });
  registerFunc("jump", () => { engine.doJump(); recordState(); });
  registerFunc("collect", () => { engine.doCollectItem(); recordState(); });
  registerFunc("toggleSwitch", () => { engine.doToggleSwitch(); recordState(); });
  
  // Wrapper for generator output: turn("turnLeft") or turn("turnRight")
  registerFunc("turn", (direction: string) => {
    if (direction === 'turnLeft' || direction === 'left') {
      engine.doTurnLeft();
    } else {
      engine.doTurnRight();
    }
    recordState();
  });
  
  registerFunc("isPathForward", () => engine.checkIsPath(0));
  registerFunc("isPathRight", () => engine.checkIsPath(1));
  registerFunc("isPathLeft", () => engine.checkIsPath(3));
  registerFunc("atFinish", () => !engine.checkNotDone());
  registerFunc("isItemPresent", () => engine.checkIsItemPresent());
  
  // Wrapper for generator output: isPath("forward") etc.
  registerFunc("isPath", (direction: string) => {
    const dirMap: Record<string, 0 | 1 | 3> = { 'forward': 0, 'right': 1, 'left': 3 };
    return engine.checkIsPath(dirMap[direction] ?? 0);
  });
  
  // Execute
  // luaL_dostring returns 0 on success
  const encoder = new TextEncoder();
  const bytes = encoder.encode(code);
  
  // fengari expects wrapper or byte array
  const status = fengari.lauxlib.luaL_dostring(L, bytes);
  
  if (status !== 0) {
    const errorMsg = lua.lua_tojsstring(L, -1);
    console.error("Lua execution error:", errorMsg);
    const errorState = engine.getCurrentState();
    errorState.result = 'error';
    executionLog.push(errorState);
    throw new Error(errorMsg);
  }

  return executionLog;
};
