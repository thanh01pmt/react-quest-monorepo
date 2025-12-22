# Design: Selectable Placement System

## Context

Current placement flow:
```
Topology → SolutionFirstPlacer → PatternLibrary → Items placed
           (segments)            (hardcoded offsets)
```

User cannot see or influence WHERE items are placed beyond changing topology parameters.

## Goals

1. **Visibility** - User sees exactly what positions are available for placement
2. **Control** - User selects which positions get which items
3. **Reusability** - User saves patterns to apply to similar topologies

## Non-Goals

- Replacing PatternLibrary entirely (templates use selectors, not patterns)
- Changing how Topology generates structure
- Real-time 3D manipulation of items (that's a different feature)

---

## Decisions

### Decision 1: MapAnalyzer Bridge (not Topology enhancement)

**Options considered:**
- A) Modify each Topology class to emit enhanced data
- B) Create MapAnalyzer.fromTopology() bridge method

**Chosen: B**

**Rationale:**
- Topology classes already work well - minimize changes
- MapAnalyzer has analysis logic we can reuse
- Single point of conversion, easier to maintain

### Decision 2: Selector-based rules (not position-based)

**Options considered:**
- A) Store absolute coordinates in templates
- B) Store selectors that resolve to positions at runtime

**Chosen: B**

**Rationale:**
- Templates work across different arm_lengths, sizes
- Selectors like `segment:left_arm[interval:2]` are topology-agnostic
- More flexible and reusable

### Decision 3: Client-side template storage (localStorage)

**Options considered:**
- A) Server-side template storage
- B) localStorage with export/import

**Chosen: B (for now)**

**Rationale:**
- Simpler implementation
- No backend changes needed
- Export/import allows sharing
- Can migrate to server later if needed

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        map-builder-app                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌────────────────────┐                     │
│  │   Topology   │───▶│ MapAnalyzer.from   │                     │
│  │  (IPathInfo) │    │    Topology()      │                     │
│  └──────────────┘    └─────────┬──────────┘                     │
│                                │                                 │
│                                ▼                                 │
│                    ┌───────────────────────┐                     │
│                    │   PlacementContext    │                     │
│                    │  + selectableElements │                     │
│                    └───────────┬───────────┘                     │
│                                │                                 │
│           ┌────────────────────┼────────────────────┐            │
│           ▼                    ▼                    ▼            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ PlacementSelect │  │ TemplateManager │  │ SolutionFirst   │  │
│  │      (UI)       │  │      (UI)       │  │     Placer      │  │
│  └────────┬────────┘  └────────┬────────┘  └─────────────────┘  │
│           │                    │                                 │
│           └────────┬───────────┘                                 │
│                    ▼                                             │
│           ┌─────────────────────┐                                │
│           │ PlacementTemplate   │                                │
│           │     Registry        │                                │
│           └─────────────────────┘                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Structures

### SelectableElement

```typescript
interface SelectableElement {
  // Identity
  id: string;                    // 'keypoint:apex', 'segment:left_arm', 'position:left_arm[2]'
  type: 'keypoint' | 'segment' | 'position';
  
  // Geometry
  position?: Coord;              // For keypoint/position
  segment?: Coord[];             // For segment type
  
  // Display (for UI)
  display: {
    name: string;                // 'Apex', 'Left Arm', 'Left Arm [2]'
    icon: '●' | '─' | '○';       // Point, segment, position
    color: 'red' | 'blue' | 'gray';  // Critical, important, optional
    priority: number;            // 1-10 for sorting
  };
  
  // Relationships
  relationships: {
    mirrorOf?: string;           // ID of symmetric element
    partOf?: string;             // ID of parent segment (for positions)
  };
}
```

### ElementSelector

```typescript
type ElementSelector =
  | { type: 'keypoint'; name: string }
  // { type: 'keypoint', name: 'apex' }
  
  | { type: 'segment'; name: string }
  // { type: 'segment', name: 'left_arm' }
  
  | { type: 'position'; segment: string; offset: number }
  // { type: 'position', segment: 'left_arm', offset: 2 }
  
  | { type: 'interval'; segment: string; every: number; skip?: number }
  // { type: 'interval', segment: 'left_arm', every: 2, skip: 0 }
  
  | { type: 'relative'; anchor: 'start' | 'end' | 'center'; offset: number }
  // { type: 'relative', anchor: 'center', offset: 0 }
```

### PlacementTemplate

```typescript
interface PlacementRule {
  selector: ElementSelector;
  itemType: 'crystal' | 'switch' | 'gem';
  options?: {
    symmetric?: boolean;         // Also place on mirror element
    skipFirst?: boolean;         // Skip start position
    skipLast?: boolean;          // Skip end position
  };
}

interface PlacementTemplate {
  id: string;                    // UUID
  name: string;                  // User-friendly name
  description?: string;
  topologyType: string;          // 'v_shape', 'l_shape', etc.
  rules: PlacementRule[];
  createdAt: string;             // ISO timestamp
  updatedAt: string;
}
```

---

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Selector resolution might fail for edge cases | Fallback to no placement + warning |
| localStorage lost if cleared | Add export/import functionality |
| Performance with many selectable elements | Limit to top 50 by priority |
| Complex selector syntax for users | UI generates selectors, users don't write |

---

## Migration Plan

1. **Phase 1**: Add fromTopology() - no breaking changes
2. **Phase 2**: Add selectableElements field - additive
3. **Phase 3**: Add template system - new feature, opt-in
4. **Phase 4**: UI integration - new components, doesn't change existing

No migration needed - all changes are additive.

---

## Open Questions

1. Should templates be shareable across users? (export/import design)
2. Should templates support versioning?
3. How to handle when topology changes and saved template selectors don't match?
