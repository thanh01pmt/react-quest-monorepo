# Change: Integrate Intelligent Map Builder (Phase 1 & 2)

## Why
The current manual map builder lacks pedagogical depth. We aim to transform it into a "Pedagogy-First" tool that combines visual editing with intelligent, automated generation. This proposal covers **Phase 1 (Core Creation)** and **Phase 2 (Intelligence)** of the Map Builder roadmap, enabling users to create solvable, academically valid maps in <15 minutes (vs 2+ hours).

## What Changes

### 1. Canvas & Visual Editor (Phase 1)
- **[NEW] Topology Template Gallery**: One-click instantiation of 5+ core shapes (Plus, Star, Grid) with adjustable parameters (arm length, size).
- **[NEW] Layer System**: Distinct layers for Path, Items, and Solution Overlay with "Smart Snap" to ensure valid placement.
- **[MODIFIED] Interaction**: Add 'smart-drag' items that snap to valid semantic positions (e.g., corners, endpoints).

### 2. Pedagogy Panel (Phase 2 - Accelerated)
- **[NEW] Academic Controls**: 
    - **Bloom Level Selection**: (Remember → Create) auto-adjusts puzzle complexity.
    - **Concept Tracker**: Real-time matrix showing which concepts (Decision Points, Loops) are taught.
- **[NEW] Strategy Selector**: Porting 7 strategies (e.g., "Function Reuse", "Conditionals") to auto-configure item patterns.

### 3. Smart Placement Engine
- **[NEW] Auto-Generate Features**: 
    - "Auto-fix Path": Optimize user-drawn paths for solvability.
    - "Smart Density": Auto-place items based on logic type (e.g., decreasing density for `while` loops).
- **[NEW] Real-time Validation**: Continuous check for "Solvability", "Pedagogy Alignment", and "Topology Integrity".

## Impact
- **Specs**: Detailed requirements for "Pedagogy-First Design".
- **Code**:
    - `apps/map-builder-app/src/map-generator/*`: TypeScript port of Python logic.
    - `apps/map-builder-app/src/components/inspector/*`: New Properties Inspector.
    - `apps/map-builder-app/src/components/pedagogy/*`: New Pedagogy Control Panel.
