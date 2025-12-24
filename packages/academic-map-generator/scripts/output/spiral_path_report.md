
# MAP ANALYSIS REPORT: MAZE

**Created:** 2025-12-23T20:56:56.623Z | **Total Blocks:** 7

## 1. 🗺️ Global Map Structure


**Visualization: Full Map Overview**
```text
    14 15 16 17 
    ------------
16 | .  . ██ ██ 
15 | .  .  . ██ 
14 |██ ██ ██ ██ 
```

### Map Metrics

- Size: small
- Total Blocks: 6
- Longest Path: 4 blocks
- Segment Count: 2
- Area Count: 0
- Detected Topology: l_shape

## 2. 📐 Geometric Decomposition

> No Areas detected. Map consists entirely of Paths.

### Path Segments (2)

**Segment #0** (ID: seg_0)

**Visualization: Segment #0**
```text
    14 15 16 17 
    ------------
16 | .  . ░░ ░░ 
15 | .  .  . ░░ 
14 |██ ██ ██ ██ 
```
- Length: 4 blocks
- Direction: [1, 0, 0]
- Plane: xy
**Segment #1** (ID: seg_1)

**Visualization: Segment #1**
```text
    14 15 16 17 
    ------------
16 | .  . ░░ ██ 
15 | .  .  . ██ 
14 |░░ ░░ ░░ ░░ 
```
- Length: 2 blocks
- Direction: [0, 0, 1]
- Plane: xz

### Meta-Paths (2)

**Meta-Path #0:** `STRAIGHT_CHAIN`

**Visualization: Meta-Path #0**
```text
    14 15 16 17 
    ------------
16 | .  . ░░ ░░ 
15 | .  .  . ░░ 
14 |██ ██ ██ ██ 
```
- Pattern Regularity: ✅ Yes
- Segments: 1
- Joints (Turns): 0
- Total Length: 4
**Meta-Path #1:** `STRAIGHT_CHAIN`

**Visualization: Meta-Path #1**
```text
    14 15 16 17 
    ------------
16 | .  . ░░ ██ 
15 | .  .  . ██ 
14 |░░ ░░ ░░ ░░ 
```
- Pattern Regularity: ✅ Yes
- Segments: 1
- Joints (Turns): 0
- Total Length: 2

### Geometric Relations

- **perpendicular**: seg_0 ↔ seg_1

## 3. 🔄 Pattern Analysis

_No repeating patterns detected._

## 4. 📍 Prioritized Coordinates


**Visualization: Top Priority Positions**
```text
    14 15 16 17 
    ------------
16 | .  . ░░ ██ 
15 | .  .  . ██ 
14 |██ ░░ ██ ██ 
```
| Priority | Position | Category | Reasons |
|----------|----------|----------|---------|
| 7 | [14, 0, 14] | important | Segment endpoint (start) |
| 7 | [17, 0, 14] | important | Segment endpoint (end) |
| 7 | [17, 0, 15] | important | Segment endpoint (start) |
| 7 | [17, 0, 16] | important | Segment endpoint (end) |
| 4 | [16, 0, 14] | optional | Interval point (every 2 steps) |

## 5. 🎛️ Selectable Elements

**Element Distribution:**
- segment: 2
- position: 2
- keypoint: 5

### Detailed Element List

| ID | Type | Role | Label | Coordinates |
|----|------|------|-------|-------------|
| **segment:seg_0** | segment | N/A | N/A | `-` |
| **position:seg_0[1]** | position | N/A | N/A | `-` |
| **position:seg_0[2]** | position | N/A | N/A | `-` |
| **segment:seg_1** | segment | N/A | N/A | `-` |
| **keypoint:endpoint_1** | keypoint | N/A | N/A | `-` |
| **keypoint:endpoint_2** | keypoint | N/A | N/A | `-` |
| **keypoint:endpoint_3** | keypoint | N/A | N/A | `-` |
| **keypoint:endpoint_4** | keypoint | N/A | N/A | `-` |
| **keypoint:center** | keypoint | N/A | N/A | `-` |

## 📊 Summary

```
Total Blocks: 7
Areas: 0
Path Segments: 2
Meta-Paths: 2
Patterns: 0
Priority Coords: 5
Selectable Elements: 9
```