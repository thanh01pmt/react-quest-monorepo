# Implementation Tasks

## Phase 1: Core Visual & Topology (Foundation)
- [x] **1.1 Topology Template System**
    - [x] Create `TopologyTemplateRegistry` with 5 core shapes (Plus, Star, L, Grid, Spiral).
    - [x] Implement `ParameterControl` UI (sliders for arm_length, size).
    - [x] Implement "One-click Instantiation" to load templates into the canvas.
- [ ] **1.2 Canvas Enhancements**
    - [x] Implement **Layer System** (Path vs Items).
    - [x] Add **Smart Snap**: Restrict item placement to valid path coordinates.
    - [x] Add **Solution Overlay**: Visualizing `A*` path with step numbers.
- [x] **1.3 Basic Inspector**
    - [x] Show map stats: Path length, Item count, Complexity score.

## Phase 2: Intelligence & Pedagogy (The "Smart" Layer)
- [x] **2.1 TS Logic Porting (High Priority)**
    - [x] Port `MapGeneratorService` and `StrategySelector` to TypeScript.
    - [x] Port `SolutionFirstPlacer` logic (for "Auto-place" features).
    - [x] Integrate `gameSolver.ts` for client-side validation.
- [x] **2.2 Pedagogy Panel**
    - [x] Create "Learning Objectives" UI (Bloom level, Strategy selection).
    - [x] Implement **Strategy Logic**:
        - [x] `Function Reuse`: Logic to enforce identical branch patterns.
        - [x] `Loop Logic`: Logic to generate repetitive item sequences.
- [x] **2.3 Smart Placement Features**
    - [x] Implement "Suggest Placement" button (Auto-fill segment).
    - [x] Implement "Validate" button (Runs solver & pedagogy checks).
    - [x] Display Validation Report (Solvability, Pedagogy Compliance).

## Phase 3: Refinement (Polish)
- [ ] **3.1 Experience**
    - [ ] Continuous Validation (Debounced background check).
    - [ ] "Heatmap" visualization (density/traffic).
- [ ] **3.2 Import/Export**
    - [ ] Export to Game-Ready JSON.
    - [ ] Export "Teacher Guide" metadata.
