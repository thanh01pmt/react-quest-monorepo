# Change: Add Multi-Language Code Generation Support

## Why

The Quest Player currently only generates JavaScript code from Blockly blocks. To support diverse educational curricula and expose students to multiple programming languages, we need to:
1. Generate code in Python, Lua (languages with native Blockly support)
2. Generate code in C++, Swift (display syntax for educational purposes)
3. **[Future]** Support OOP concepts with multi-character control
4. **[Future]** Real WASM execution for advanced type system teaching

This enables students to see how the same visual program translates to different programming paradigms.

---

## Roadmap

```
Phase 1: Python, Lua generators (✅ COMPLETED)
    ↓
Phase 2: C++, Swift generators (Simplified - display only)
    ↓
Phase 3: OOP & Multi-Character (Unified JS runtime)
    ↓
Phase 4: WASM Execution (Future - for real type checking)
```

---

## What Changes

### Phase 1: Native Language Generators (Python, Lua) ✅ COMPLETED

> [!IMPORTANT]
> **Implementation Decision**: All languages use the **same execution path**.
> Display language-specific syntax, but execute JavaScript from Blockly.

**What was built:**
- Python and Lua code generators for all Maze blocks
- Language selector tabs (Khởi lệnh, JavaScript, Python, Lua)
- Unified execution: Display Python/Lua → Execute JavaScript
- Code indentation fix

---

### Phase 2: C++ & Swift Generators (Simplified) [PLANNED]

> [!NOTE]
> **Same approach as Phase 1**: Display C++/Swift syntax, execute JavaScript.
> No WASM compilation required.

**What will be built:**
- C++ generator with all Maze blocks
- Swift generator with all Maze blocks
- Add C++ and Swift tabs to UI
- Execution uses `blocklyGeneratedCode` (JavaScript)

**Architecture:**
```
Blockly Blocks
    ↓
┌─────────────────────────────────────────────────┐
│  JavaScript Generator → blocklyGeneratedCode   │ (EXECUTION)
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│  C++/Swift Generators → aceCode                │ (DISPLAY ONLY)
└─────────────────────────────────────────────────┘
```

**Pros:**
- ✅ Fast implementation (1-2 days)
- ✅ No server required
- ✅ Students see syntax comparison across 5 languages
- ✅ Consistent with Phase 1 architecture

**Limitations:**
- ❌ No compile-time type errors
- ❌ OOP inheritance is display-only, not enforced

---

### Phase 3: OOP-Lite & Multi-Character Support (Simplified) [FUTURE]

> [!IMPORTANT]
> **OOP-Lite Architecture**: Teach OOP concepts at instance-level using JS runtime.
> Full class-level OOP (inheritance, polymorphism) deferred to Phase 4 WASM.

**What is OOP-Lite:**
A simplified approach to teach basic OOP concepts without requiring real language runtimes.

**Goals:**
- Select and control multiple characters
- Teach object and method concepts
- Custom properties and methods at instance level

---

#### New Blockly Blocks:

**1. Character Selector Block:**
```
┌─────────────────────────────────┐
│ [robot1 ▼] di chuyển tới       │
└─────────────────────────────────┘
```
Generates: `robot1.moveForward()`

**2. Property Block:**
```
┌─────────────────────────────────┐
│ đặt [speed ▼] của [robot1 ▼]   │
│ thành [5]                       │
└─────────────────────────────────┘
```
Generates: `robot1.speed = 5`

**3. Custom Method Block:**
```
┌─────────────────────────────────┐
│ tạo hành động [dance] cho      │
│ [robot1 ▼]                      │
│ ┌───────────────────────────┐   │
│ │ quay trái                 │   │
│ │ quay phải                 │   │
│ └───────────────────────────┘   │
└─────────────────────────────────┘
```
Generates:
```javascript
robot1.dance = function() {
    robot1.turnLeft();
    robot1.turnRight();
}
```

---

#### OOP Concepts Coverage:

| Concept | OOP-Lite (Phase 3) | WASM (Phase 4) |
|---------|-------------------|----------------|
| **Objects** | ✅ `robot1`, `robot2` | ✅ |
| **Properties** | ✅ `robot1.speed = 5` | ✅ Type-safe |
| **Method calls** | ✅ `robot1.moveForward()` | ✅ |
| **Custom methods** | ✅ Instance-level | ✅ Class-level |
| **Encapsulation** | ⚠️ Display only | ✅ `private` enforced |
| **Abstraction** | ✅ Hide implementation | ✅ |
| **Inheritance** | ❌ Not available | ✅ `class Robot extends Character` |
| **Polymorphism** | ❌ Not available | ✅ Virtual methods |

---

#### JS Runtime (Injected):
```javascript
class Character {
    constructor(id) { 
        this.id = id;
        this.speed = 1;  // Default property
    }
    moveForward() { doAction(this.id, 'MoveForward'); }
    turnLeft() { doAction(this.id, 'TurnLeft'); }
    turnRight() { doAction(this.id, 'TurnRight'); }
    // ... all game actions
}

// Inject from quest config
const robot1 = new Character("player1");
const robot2 = new Character("player2");
```

**Pros:**
- ✅ Single codebase for all languages
- ✅ No extra runtimes needed
- ✅ Teaches basic OOP concepts
- ✅ Multiple characters on map

**Limitations (addressed in Phase 4):**
- ❌ No `private`/`public` enforcement
- ❌ No class-level method definition
- ❌ No inheritance (`extends`)
- ❌ No polymorphism (`override`)

---

### Phase 4: WASM Real Execution [FUTURE - OPTIONAL]

> [!CAUTION]
> Only implement when advanced teaching is required.
> Significant infrastructure investment.

**When to consider:**
- When teaching type systems (`int x = "hello"` should error)
- When teaching real OOP enforcement (private, override)
- When teaching performance concepts

**Options:**
| Language | Approach | Feasibility |
|----------|----------|-------------|
| C++ | Client-side (Emception) | ✅ ~20MB download, 5-15s compile |
| Swift | Server-side (SwiftWasm Docker) | ⚠️ Requires infrastructure |

**Infrastructure Required:**
- Docker container with SwiftWasm (~3GB)
- VPS with 2+ vCPU, 4GB+ RAM
- ~$10-50/month hosting cost

---

## Summary

| Phase | Languages | Approach | Status |
|-------|-----------|----------|--------|
| 1 | Python, Lua | Simplified (Display + JS exec) | ✅ DONE |
| 2 | C++, Swift | Simplified (Display + JS exec) | PLANNED |
| 3 | All + OOP | Simplified (JS Character class) | FUTURE |
| 4 | C++? Swift? | WASM (Real compilation) | OPTIONAL |
