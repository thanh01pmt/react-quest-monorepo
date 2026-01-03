# Change: Add Multi-Language Code Generation Support

## Why

The Quest Player currently only generates JavaScript code from Blockly blocks. To support diverse educational curricula and expose students to multiple programming languages, we need to:
1. Generate code in Python, Lua (languages with native Blockly support)
2. Generate and **execute** code in C++, Swift using WebAssembly

This enables students to see how the same visual program translates to different programming paradigms, execute real code in multiple languages, and learn advanced features like functions and variables.

## What Changes

### Phase 1: Native Language Generators (Python, Lua)
- Add Python and Lua code generators using Blockly's built-in `python` and `lua` generator packages
- Implement custom block generators for all Maze-specific blocks (~20 blocks)
- Add language selector UI component
- Dual-generation architecture: JavaScript for execution, selected language for display

### Phase 2: WebAssembly Execution (C++, Swift) **[REAL EXECUTION]**
- Implement compilation service for C++ (Emscripten) and Swift (SwiftWasm)
- Create WASM runtime bridge to connect compiled code with game engine APIs
- Implement caching layer to avoid recompilation on every run
- Build API shim layer (moveForward, isPathForward, etc.) from WASM to JavaScript engine
- **Support**: User-defined functions, variables, and complex control flow
- **Runtime Size**: ~5-9MB for Swift WASM (optimized), ~2-4MB for C++ WASM
- **Compilation Time**: 10-30s client-side (first time), 2-5s server-side (if configured)

**Architecture:**
```
Blockly → Swift/C++ Code → Compilation Service → WASM Binary
  → Download (~5MB, cached) → Execute in Browser with API Bridge → Game Engine
```

### UI Changes
- Language selector dropdown in QuestPlayer
- Code viewer updates to show selected language
- Compilation progress indicator for WASM languages
- Error handling for compilation failures

## Impact

### Specs
- **NEW**: `code-generation` - Multi-language code generation and execution

### Code
- `packages/quest-player/src/games/maze/generators/` (new)
  - `python.ts`, `lua.ts`, `cpp.ts`, `swift.ts`
- `packages/quest-player/src/runtime/` (new)
  - `wasmBridge.ts` - WASM API bridge to game engine
  - `compilationService.ts` - Client for backend compilation API
- `packages/quest-player/src/components/QuestPlayer/index.tsx` - Language selector
- `packages/quest-player/src/types/index.ts` - Add `CodeLanguage` type
- **[NEW]** Backend compilation service (separate repository)
  - Endpoints: `/compile/swift`, `/compile/cpp`
  - Docker: SwiftWasm (Swift 6.1+) and Emscripten
  - Redis cache for compiled WASM

### Infrastructure Requirements

**Default: Client-side Compilation (No Server Required)**
- Use Emception (Emscripten in browser) for C++
- Use SwiftWasm in-browser compilation for Swift
- **Tradeoff**: Slower first compile (~10-30s), larger initial download (~20-30MB toolchain)
- **Benefit**: Zero infrastructure cost, works offline, privacy-friendly
- **Caching**: IndexedDB caches compiled WASM for instant subsequent runs

**Optional: Server-side Compilation (Advanced)**
- Configurable via environment variable `COMPILATION_SERVICE_URL`
- Node.js/Express compilation API
- Docker with SwiftWasm and Emscripten toolchains
- Redis for caching compiled WASM modules
- **Benefit**: Faster compilation (2-5s), smaller client download
- **Use case**: Production deployments with budget for infrastructure

### Technical Approach

**Phase 1 - Dual Generation:**
- **Execution**: JavaScript (current)
- **Display**: Python/Lua (for viewing)

**Phase 2 - WebAssembly Execution:**
- **Display**: C++/Swift source code
- **Compilation**: Backend service or client-side
- **Execution**: WASM module in browser with API bridge
- **Integration**: WASM calls game APIs via JavaScript imports

**API Bridge (WASM Imports):**
```javascript
const wasmImports = {
  env: {
    moveForward: () => gameEngine.moveForward(),
    isPathForward: () => gameEngine.isPathForward(),
    collectItem: () => gameEngine.collectItem(),
    // ... all maze APIs
  }
};
```

**Benefits:**
- Real execution (not simulated)
- Functions, variables, loops work correctly
- Near-native performance
- WASM sandbox security
- No game engine refactor needed
