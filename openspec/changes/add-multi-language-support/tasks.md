# Implementation Tasks

## Phase 1: Native Generators (Python, Lua) ✅ COMPLETED

### 1.1 Setup
- [x] Verify blockly package includes python/lua generators
- [x] Create `src/games/maze/generators/` directory
- [x] Add `CodeLanguage` type to types/index.ts

### 1.2 Python & Lua Generators
- [x] Implement Python generator with all Maze blocks
- [x] Implement Lua generator with all Maze blocks
- [x] Test generation for both languages
- [x] Fix indentation issue (maze_start block strips leading whitespace)

### 1.3 UI Integration
- [x] Add language selector tabs to QuestPlayer (Khởi lệnh, JavaScript, Python, Lua)
- [x] Update code viewer to show selected language
- [x] Add i18n (en, vi) for language names
- [x] Test switching between JS/Python/Lua

### 1.4 Execution Integration (Key Decision)
- [x] **Unified execution path**: All languages use Babel transpile → JS Interpreter
- [x] No separate runtimes (Pyodide/Fengari) needed for Phase 1
- [x] Verify character movement works correctly for all languages
- [x] Remove debug logging after verification

---

## Phase 2: WebAssembly Execution (C++, Swift) [PLANNED]

### 2.1 Client-side Compilation (Default)
- [ ] Integrate Emception library for C++ compilation
- [ ] Integrate SwiftWasm browser compilation
- [ ] Implement IndexedDB caching for compiled WASM
- [ ] Progress indicators for compilation
- [ ] Error handling for compilation failures
- [ ] Fallback to server-side if configured

### 2.2 WASM Runtime Bridge
- [ ] Create `runtime/wasmBridge.ts`
- [ ] Define game API interface for WASM
- [ ] Implement API import object (moveForward, sensors, etc.)
- [ ] WASM module instantiation logic
- [ ] Memory management
- [ ] Error handling for WASM execution

### 2.3 Optional Server-side Compilation
- [ ] Create `runtime/compilationService.ts`
- [ ] Environment variable `COMPILATION_SERVICE_URL` detection
- [ ] HTTP client for backend API (when configured)
- [ ] Fallback to client-side if server unavailable
- [ ] Server-side cache coordination

### 2.4 Backend Service (Optional - Separate Task)
- [ ] Create Node.js compilation service repo
- [ ] Docker: SwiftWasm (Swift 6.1+)
- [ ] Docker: Emscripten for C++
- [ ] API endpoints: `/compile/swift`, `/compile/cpp`
- [ ] Redis caching
- [ ] Deploy with HTTPS

### 2.5 C++ & Swift Generators
- [ ] C++ generator with Emscripten-compatible output
- [ ] Swift generator with SwiftWasm exports
- [ ] Include API declarations (extern "C" for C++, @_cdecl for Swift)
- [ ] Test compilation pipeline end-to-end

### 2.6 Integration & Testing
- [ ] Language selector includes C++/Swift
- [ ] Show compilation progress
- [ ] Handle compilation errors gracefully
- [ ] Test functions, variables, loops
- [ ] Performance testing (compilation time, runtime)
- [ ] Cache effectiveness testing

---

## Phase 3: Unified OOP & Multi-Character Support [FUTURE]

> **Key Decision**: All languages use the SAME JavaScript Character class at runtime.
> OOP syntax is generated per language, but execution is always JS.

### 3.1 Engine Enhancements
- [ ] Add `doAction(characterId: string, action: string)` to MazeEngine
- [ ] Add `checkPath(characterId: string, direction)` to MazeEngine
- [ ] Support multiple players in quest config
- [ ] Camera strategy for multi-character (follow active, overview, split-screen?)

### 3.2 JS Runtime Character Class
- [ ] Create `Character` class with all game methods
- [ ] Inject character instances before user code based on quest config
- [ ] Register `doAction()` and `checkPath()` in JS interpreter

### 3.3 Code Generators Update (OOP Syntax)
- [ ] JavaScript: `robot1.moveForward()` (native)
- [ ] Python: `robot1.moveForward()` (Babel compatible)
- [ ] Lua: `robot1:moveForward()` → transform `:` to `.`
- [ ] C++: `robot1.moveForward();` → WASM imports Character
- [ ] Swift: `robot1.moveForward()` → WASM imports Character

### 3.4 Blockly Blocks (OOP)
- [ ] Character selector dropdown in movement blocks
- [ ] Character-specific sensor blocks
- [ ] Variable blocks for character references

### 3.5 Advanced Concepts (Future Ideas)
- [ ] Events: `onCollision(crystal, callback)`
- [ ] Async/Await: `await robot1.moveForward()`
- [ ] State Machine: Idle → Walking → Collecting
- [ ] Multi-threading simulation: Two robots sync at checkpoints

---

## Documentation
- [ ] Update README with multi-language feature
- [ ] Phase 2: Backend deployment guide
- [ ] Phase 2: WASM bridge architecture doc
- [ ] Phase 3: OOP concepts teaching guide

