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
- [x] Add language selector tabs to QuestPlayer
- [x] Update code viewer to show selected language
- [x] Add i18n (en, vi) for language names

### 1.4 Execution Integration
- [x] **Unified execution path**: Display Python/Lua → Execute JavaScript
- [x] No separate runtimes (Pyodide/Fengari) needed

---

## Phase 2: C++ & Swift Generators (Simplified) [PLANNED]

> **Same approach as Phase 1**: Display C++/Swift syntax, execute JavaScript.

### 2.1 C++ Generator
- [ ] Create `generators/cpp.ts`
- [ ] Implement all Maze block generators with C++ syntax
- [ ] Handle semicolons, braces, type declarations
- [ ] Test code generation

### 2.2 Swift Generator
- [ ] Create `generators/swift.ts`
- [ ] Implement all Maze block generators with Swift syntax
- [ ] Handle Swift function syntax
- [ ] Test code generation

### 2.3 UI Integration
- [ ] Add C++ tab to EditorToolbar
- [ ] Add Swift tab to EditorToolbar
- [ ] Add i18n for C++/Swift labels (en, vi)
- [ ] Update `handleRun()` to use `blocklyGeneratedCode` for C++/Swift

### 2.4 Testing
- [ ] Test C++ code display
- [ ] Test Swift code display
- [ ] Verify execution works (uses JS)
- [ ] Compare syntax across all 5 languages

---

## Phase 3: OOP & Multi-Character Support (Simplified) [FUTURE]

> **Unified OOP**: All languages use JS Character class at runtime.

### 3.1 Engine Enhancements
- [ ] Add `doAction(characterId: string, action: string)` to MazeEngine
- [ ] Add `checkPath(characterId: string, direction)` to MazeEngine
- [ ] Support multiple players in quest config
- [ ] Camera strategy for multi-character

### 3.2 JS Runtime Character Class
- [ ] Create `Character` class with all game methods
- [ ] Inject character instances before user code
- [ ] Register `doAction()` in JS interpreter

### 3.3 Code Generators Update (OOP Syntax)
- [ ] JavaScript: `robot1.moveForward()`
- [ ] Python: `robot1.moveForward()`
- [ ] Lua: `robot1:moveForward()`
- [ ] C++: `robot1.moveForward();`
- [ ] Swift: `robot1.moveForward()`

### 3.4 Blockly Blocks (OOP)
- [ ] Character selector dropdown in movement blocks
- [ ] Character-specific sensor blocks

---

## Phase 4: WASM Real Execution [FUTURE - OPTIONAL]

> Only implement when advanced teaching is required.

### 4.1 Evaluate Need
- [ ] Survey: Do students need real type checking?
- [ ] Decide: C++ only? Swift only? Both?
- [ ] Budget: Can afford server hosting?

### 4.2 C++ WASM (Client-side with Emception)
- [ ] Integrate Emception library
- [ ] Implement IndexedDB caching
- [ ] Handle compile errors

### 4.3 Swift WASM (Server-side)
- [ ] Create compilation server repo
- [ ] Docker with SwiftWasm
- [ ] API endpoints
- [ ] Deploy with caching

### 4.4 WASM Runtime Bridge
- [ ] Create `runtime/wasmBridge.ts`
- [ ] Define WASM imports (game APIs)
- [ ] Instantiate and execute WASM

---

## Documentation
- [ ] Update README with multi-language feature
- [ ] Phase 2: Add C++/Swift syntax examples
- [ ] Phase 3: OOP concepts guide
- [ ] Phase 4: WASM architecture doc (if implemented)
