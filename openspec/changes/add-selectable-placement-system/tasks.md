# Tasks: Add Selectable Placement System

## Overview

Implement a system that allows users to see, select, and save placement patterns for map items.

---

## 1. Phase 1: MapAnalyzer Bridge ✅

### 1.1 Add fromTopology() method
- [x] 1.1.1 Create `MapAnalyzer.fromTopology(pathInfo: IPathInfo): PlacementContext` static method
- [x] 1.1.2 Convert `pathInfo.path_coords` to internal block format
- [x] 1.1.3 Reuse `pathInfo.metadata.segments` instead of re-detecting
- [x] 1.1.4 Extract keypoints from `pathInfo.metadata.semantic_positions`
- [x] 1.1.5 Calculate relations between segments (parallel, symmetric)
- [x] 1.1.6 Add unit tests for fromTopology()

### 1.2 Update PlacementContext interface
- [x] 1.2.1 Add `selectableElements: SelectableElement[]` field
- [x] 1.2.2 Ensure backward compatibility with existing code

---

## 2. Phase 2: Selectable Elements ✅

### 2.1 Define SelectableElement types
- [x] 2.1.1 Create `packages/academic-placer/src/SelectableElement.ts`
- [x] 2.1.2 Define `SelectableElement` interface
- [x] 2.1.3 Define `ElementSelector` union type for rule matching
- [x] 2.1.4 Add helper functions: `findBySelector()`, `findMirror()`

### 2.2 Extract selectable elements from topology
- [x] 2.2.1 Implement element extraction in `generateSelectableElements()`
- [x] 2.2.2 Generate keypoint elements from semantic_positions
- [x] 2.2.3 Generate segment elements with interval positions
- [x] 2.2.4 Detect mirror relationships from symmetric segments
- [x] 2.2.5 Assign display properties based on element type

---

## 3. Phase 3: Placement Template System ✅

### 3.1 Define PlacementTemplate interface
- [x] 3.1.1 Create `packages/academic-placer/src/PlacementTemplate.ts`
- [x] 3.1.2 Define `PlacementRule` interface
- [x] 3.1.3 Define `PlacementTemplate` interface

### 3.2 Implement PlacementTemplateRegistry
- [x] 3.2.1 Implement registry class in `PlacementTemplate.ts`
- [x] 3.2.2 Implement `save(template)` method
- [x] 3.2.3 Implement `findByTopology(topologyType)` method
- [x] 3.2.4 Implement `apply(templateId, selectableElements)` method
- [x] 3.2.5 Implement `applyRules()` for selector resolution
- [x] 3.2.6 Symmetric placement support via `getMirrorElement()`
- [x] 3.2.7 Add localStorage persistence for templates

### 3.3 Create default templates
- [x] 3.3.1 Create "V-Shape Function Reuse" template
- [x] 3.3.2 Create "L-Shape Corner" template
- [x] 3.3.3 Create "Linear Interval" template

---

## 4. Phase 4: UI Integration ✅

### 4.1 PlacementSelector component
- [x] 4.1.1 Create `apps/map-builder-app/src/components/PlacementSelector/PlacementSelector.tsx`
- [x] 4.1.2 Display list of selectableElements with checkboxes
- [x] 4.1.3 Dropdown to assign itemType when selected
- [x] 4.1.4 CSS styles for component
- [x] 4.1.5 Show mirror relationships (symmetric toggle)

### 4.2 TemplateManager component
- [x] 4.2.1 Create `apps/map-builder-app/src/components/TemplateManager/TemplateManager.tsx`
- [x] 4.2.2 List available templates for current topology
- [x] 4.2.3 "Apply Template" button
- [x] 4.2.4 "Save as Template" dialog (name input)
- [x] 4.2.5 "Delete Template" confirmation
- [x] 4.2.6 Export/Import functionality

### 4.3 Integration with existing UI
- [x] 4.3.1 Add "Placement" tab to map builder left sidebar
- [x] 4.3.2 Integrate PlacementSelector and TemplateManager in Placement panel
- [x] 4.3.3 Compute selectableElements from pathInfo using MapAnalyzer.fromTopology()
- [x] 4.3.4 Handle template application to place items on map

---

## 5. Testing & Documentation ✅

### 5.1 Unit tests
- [x] 5.1.1 Test fromTopology() with various topologies (test-from-topology.ts)
- [x] 5.1.2 Test selector resolution
- [x] 5.1.3 Test template apply with symmetric rules (test-templates.ts)
- [x] 5.1.4 Test registry persistence

### 5.2 Documentation
- [x] 5.2.1 Update packages/academic-placer/README.md with new APIs
- [x] 5.2.2 Add usage examples for template creation
- [ ] 5.2.3 Document UI workflow

---

## Definition of Done

- [x] All core phases implemented and tested
- [x] User can see selectable elements via Placement tab in UI
- [x] User can select elements and assign item types
- [x] User can save and load placement templates
- [x] Templates persist across sessions (localStorage)
- [x] Existing functionality unchanged (backward compatible)
- [x] Full UI integration with map builder sidebar
