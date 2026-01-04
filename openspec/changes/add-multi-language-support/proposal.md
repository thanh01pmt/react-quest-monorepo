# Change: Add Multi-Language Code Generation Support

## Why

The Quest Player currently only generates JavaScript code from Blockly blocks. To support diverse educational curricula and expose students to multiple programming languages, we need to:
1. Generate code in Python, Lua (languages with native Blockly support)
2. Generate and **execute** code in C++, Swift using WebAssembly
3. **[Future]** Support OOP concepts with multi-character control

This enables students to see how the same visual program translates to different programming paradigms, execute real code in multiple languages, and learn advanced features like functions, variables, and object-oriented programming.

## What Changes

### Phase 1: Native Language Generators (Python, Lua) ✅ COMPLETED

> [!IMPORTANT]
> **Implementation Decision**: Python/Lua/JavaScript code all use the **same execution path**.
> Since all languages generate identical function names (`moveForward()`, `turnLeft()`, etc.),
> we simply transpile Python/Lua code through Babel and execute via the existing JS interpreter.
> No Pyodide or Fengari required.

**What was built:**
- Python and Lua code generators for all Maze blocks
- Language selector tabs (Khởi lệnh, JavaScript, Python, Lua)
- Unified execution: All languages → Babel transpile → JS Interpreter → MazeEngine
- Code indentation fix for Python-generated code

### Phase 2: WebAssembly Execution (C++, Swift) [PLANNED]
- Implement compilation service for C++ (Emscripten) and Swift (SwiftWasm)
- Create WASM runtime bridge to connect compiled code with game engine APIs
- Implement caching layer to avoid recompilation on every run
- Build API shim layer from WASM to JavaScript engine
- **Support**: User-defined functions, variables, and complex control flow
- **Runtime Size**: ~5-9MB for Swift WASM (optimized), ~2-4MB for C++ WASM
- **Compilation Time**: 10-30s client-side (first time), 2-5s server-side (if configured)

**Architecture:**
```
Blockly → Swift/C++ Code → Compilation Service → WASM Binary
  → Download (~5MB, cached) → Execute in Browser with API Bridge → Game Engine
```

### Phase 3: OOP & Multi-Character Support [FUTURE]

> [!IMPORTANT]
> **Unified OOP Architecture**: All languages use the SAME execution path.
> OOP *syntax* is generated per language, but *execution* is always JavaScript with injected Character objects.

**Why Unified Approach:**
- No separate runtimes needed (Brython ~500KB, Pyodide ~15MB avoided)
- Single Character class implementation
- Consistent behavior across all languages
- Easy to maintain and extend

**Architecture:**
```
Blockly (any language) → Generate OOP syntax → Babel/WASM → JS Runtime
                                                            ↓
                                            Character class wraps doAction()
```

**Syntax per Language:**
| Language | Generated Code | Execution |
|----------|----------------|-----------|
| JavaScript | `robot1.moveForward()` | Direct JS |
| Python | `robot1.moveForward()` | Babel → JS |
| Lua | `robot1:moveForward()` | `:` → `.` transform → JS |
| C++ | `robot1.moveForward();` | WASM imports JS Character |
| Swift | `robot1.moveForward()` | WASM imports JS Character |

**JS Runtime Injection (before user code):**
```javascript
class Character {
  constructor(id) { this.id = id; }
  moveForward() { doAction(this.id, 'MoveForward'); }
  turnLeft() { doAction(this.id, 'TurnLeft'); }
  turnRight() { doAction(this.id, 'TurnRight'); }
  jump() { doAction(this.id, 'Jump'); }
  collect() { doAction(this.id, 'CollectItem'); }
  toggleSwitch() { doAction(this.id, 'ToggleSwitch'); }
  isPathForward() { return checkPath(this.id, 0); }
  isPathRight() { return checkPath(this.id, 1); }
  isPathLeft() { return checkPath(this.id, 3); }
}
// Inject characters from quest config
const robot1 = new Character("player1");
const robot2 = new Character("player2");
```

**Engine Extension:**
```typescript
// MazeEngine new public methods
public doAction(characterId: string, action: string): void {
  const prev = this.currentState.activePlayerId;
  this.currentState.activePlayerId = characterId;
  (this as any)["do" + action]?.();
  this.currentState.activePlayerId = prev;
}

public checkPath(characterId: string, direction: 0 | 1 | 3): boolean {
  const prev = this.currentState.activePlayerId;
  this.currentState.activePlayerId = characterId;
  const result = this.isPath(direction);
  this.currentState.activePlayerId = prev;
  return result;
}
```

**Benefits of Unified Approach:**
1. ✅ Single codebase for OOP support
2. ✅ No language-specific runtimes (lighter bundles)
3. ✅ Consistent behavior across all 5 languages
4. ✅ Easy to add new characters via quest config
5. ✅ Works with existing Phase 2 WASM architecture

