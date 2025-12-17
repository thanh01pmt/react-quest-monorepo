# Map Generation Files

This document lists the key files and directories involved in the map generation process for the project.

## 1. Entry Points & Pipelines
These scripts orchestrate the generation process.

*   **`main.py`**: The primary entry point for the map generation pipeline.
*   **`scripts/generate_all_maps.py`**: Script to generate a batch of maps.
*   **`scripts/generate_variants.py`**: Handles generation of map variants.
*   **`scripts/process_curriculum.py`**: Processes curriculum data to drive map generation.
*   **`scripts/refine_and_generate_variants.py`**: Refines and generates variants.

## 2. Core Generation Logic (`src/map_generator`)
This directory contains the business logic for creating the maps.

*   **`src/map_generator/service.py`**: Contains `MapGeneratorService`, likely the main coordinator for generation tasks.
*   **`src/map_generator/generator.py`**: Core generator logic.
*   **`src/map_generator/constraints.py`**: Defines constraints used during generation.

### Sub-components
*   **`src/map_generator/topologies/`**:
    *   Contains definitions for map shapes and structures (e.g., `s_shape.py`, `u_shape.py`, `grid_with_holes`).
    *   *(Contains ~99 files determining map layout)*.
*   **`src/map_generator/placements/`**:
    *   Contains strategies for placing objects on the map (e.g., obstacles, collectibles).
    *   *(Contains ~117 files for placement logic)*.
*   **`src/map_generator/templates/`**:
    *   Likely contains template definitions for maps.

## 3. Solvers & Verification
Used to verify that generated maps are solvable and to calculate solutions.

*   **`scripts/gameSolver.py`**: The Python-based game solver.
*   **`gameSolver.ts`**: The TypeScript-based game solver (likely for the exact same logic but in TS).
*   **`scripts/solver_context.py`**: Context management for the solver.
*   **`scripts/map_validator.py`**: Validates generated maps against rules.

## 4. Utilities & Helpers
*   **`scripts/extract_map_info.py`**: Extracts metadata from generated maps.
*   **`scripts/skill_mapper.py`**: Maps generated content to educational skills.
*   **`src/map_generator/utils/`**: General utility functions for the generator.

## 5. Other Relevant Scripts
*   `scripts/check_duplicates_and_report.py`: Checks for duplicate maps.
*   `scripts/generate_curriculum.py`: Generates the curriculum structure.
