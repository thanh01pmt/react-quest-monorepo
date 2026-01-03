# Implementation Tasks

## Phase 1: Native Generators (Python, Lua)

### 1.1 Setup
- [ ] Verify blockly package includes python/lua generators
- [ ] Create `src/games/maze/generators/` directory
- [ ] Add `CodeLanguage` type to types/index.ts

### 1.2 Python & Lua Generators
- [ ] Implement Python generator with all Maze blocks
- [ ] Implement Lua generator with all Maze blocks
- [ ] Test generation for both languages

### 1.3 UI Integration
- [ ] Add language selector dropdown to QuestPlayer
- [ ] Update code viewer to show selected language
- [ ] Add i18n (en, vi) for language names
- [ ] Test switching between JS/Python/Lua

## Phase 2: WebAssembly Execution

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

### 2.4 C++ & Swift Generators
- [ ] C++ generator with Emscripten-compatible output
- [ ] Swift generator with SwiftWasm exports
- [ ] Include API declarations (extern "C" for C++, @_cdecl for Swift)
- [ ] Test compilation pipeline end-to-end

### 2.5 Integration & Testing
- [ ] Language selector includes C++/Swift
- [ ] Show compilation progress
- [ ] Handle compilation errors gracefully
- [ ] Test functions, variables, loops
- [ ] Performance testing (compilation time, runtime)
- [ ] Cache effectiveness testing

### 2.6 Documentation
- [ ] Backend service deployment guide
- [ ] API documentation  
- [

] WASM bridge architecture doc
- [ ] Troubleshooting guide
