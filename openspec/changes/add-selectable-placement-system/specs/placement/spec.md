# Selectable Placement Capability

## Overview

System cho phép user thấy, chọn và lưu các vị trí đặt item trên map.

---

## ADDED Requirements

### Requirement: MapAnalyzer Bridge

MapAnalyzer SHALL provide a static method `fromTopology(pathInfo: IPathInfo)` that converts Topology output to PlacementContext.

The method SHALL:
- Accept `IPathInfo` from any Topology class
- Reuse `metadata.segments` instead of re-detecting segments
- Extract keypoints from `metadata.semantic_positions`
- Return `PlacementContext` with `selectableElements` populated

#### Scenario: Convert V-Shape topology output
- **GIVEN** a `IPathInfo` from VShapeTopology with 2 segments and apex keypoint
- **WHEN** calling `MapAnalyzer.fromTopology(pathInfo)`
- **THEN** returned PlacementContext SHALL contain:
  - 2 segment elements
  - 3 keypoint elements (left_end, apex, right_end)
  - Multiple position elements along each segment

---

### Requirement: Selectable Elements

PlacementContext SHALL include a `selectableElements` field containing all positions/segments that can receive items.

Each SelectableElement SHALL have:
- Unique `id` (e.g., 'keypoint:apex', 'position:left_arm[2]')
- `type` indicating keypoint, segment, or position
- `display` object with name, icon, color for UI
- `relationships` object indicating mirror or parent relationships

#### Scenario: Keypoint elements have critical priority
- **GIVEN** a topology with apex junction
- **WHEN** extracting selectable elements
- **THEN** apex element SHALL have:
  - `display.color` = 'red'
  - `display.priority` >= 8

#### Scenario: Mirror relationships detected
- **GIVEN** a symmetric topology (V-shape, U-shape)
- **WHEN** extracting selectable elements
- **THEN** corresponding positions on symmetric segments SHALL have `relationships.mirrorOf` linking to each other

---

### Requirement: Placement Rules

A PlacementRule SHALL define how to place items using selectors.

Supported selector types:
- `keypoint` - select by keypoint name
- `segment` - select entire segment
- `position` - select specific position in segment by offset
- `interval` - select every N positions in segment

Rule options SHALL support:
- `symmetric: true` - automatically place on mirror element too
- `skipFirst: true` - exclude start position
- `skipLast: true` - exclude end position

#### Scenario: Interval selector with symmetric option
- **GIVEN** a rule `{ selector: { type: 'interval', segment: 'left_arm', every: 2 }, itemType: 'crystal', options: { symmetric: true } }`
- **WHEN** applying rule to V-shape with arm_length=5
- **THEN** crystals SHALL be placed at:
  - left_arm[2], left_arm[4]
  - right_arm[2], right_arm[4] (symmetric)

---

### Requirement: Placement Templates

A PlacementTemplate SHALL store a collection of rules for a specific topology type.

Templates SHALL:
- Have unique `id` (UUID)
- Have user-friendly `name`
- Be associated with a `topologyType`
- Contain ordered list of `rules`

#### Scenario: Save and retrieve template
- **GIVEN** user creates rules for V-shape topology
- **WHEN** saving as template with name "V-Shape Function Reuse"
- **THEN** template SHALL be persisted
- **AND** retrievable by `findByTopology('v_shape')`

---

### Requirement: Template Registry

PlacementTemplateRegistry SHALL manage template storage and application.

The registry SHALL support:
- `save(template)` - persist template
- `findByTopology(type)` - list templates for topology type
- `apply(pathInfo, templateId)` - resolve rules and return ItemPlacement[]

#### Scenario: Apply template to topology
- **GIVEN** a saved template "V-Shape Basic" with apex=switch, arm[2]=crystal rules
- **WHEN** calling `apply(vShapePathInfo, templateId)`
- **THEN** returned ItemPlacement[] SHALL contain:
  - 1 switch at apex position
  - 2 crystals at arm[2] positions (symmetric)

#### Scenario: Template applied to different arm_length
- **GIVEN** template with `{ type: 'interval', segment: 'left_arm', every: 2 }` rule
- **WHEN** applying to V-shape with arm_length=3 vs arm_length=6
- **THEN** arm_length=3 SHALL place 1 crystal (at [2])
- **AND** arm_length=6 SHALL place 2 crystals (at [2, 4])

---

## Requirements Dependencies

```
MapAnalyzer Bridge
       ↓
Selectable Elements
       ↓
Placement Rules
       ↓
Placement Templates
       ↓
Template Registry
```

Each requirement builds on the previous one.
