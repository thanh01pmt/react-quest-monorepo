
# MAP ANALYSIS REPORT: MAZE

**Created:** 2025-12-23T20:56:56.626Z | **Total Blocks:** 18

## 1. 🗺️ Global Map Structure


**Visualization: Full Map Overview**
```text
    9  10 11 12 13 14 15 
    ---------------------
23 |██ ██ ██ ██ ██ ██ ██ 
22 | .  .  .  .  .  . ██ 
21 | .  .  .  .  .  . ██ 
20 | .  .  .  .  .  . ██ 
19 | .  .  .  .  .  . ██ 
18 |██ ██ ██ ██ ██ ██ ██ 
```

### Map Metrics

- Size: medium
- Total Blocks: 18
- Longest Path: 7 blocks
- Segment Count: 3
- Area Count: 0
- Detected Topology: unknown

## 2. 📐 Geometric Decomposition

> No Areas detected. Map consists entirely of Paths.

### Path Segments (3)

**Segment #0** (ID: seg_0)

**Visualization: Segment #0**
```text
    9  10 11 12 13 14 15 
    ---------------------
23 |░░ ░░ ░░ ░░ ░░ ░░ ░░ 
22 | .  .  .  .  .  . ░░ 
21 | .  .  .  .  .  . ░░ 
20 | .  .  .  .  .  . ░░ 
19 | .  .  .  .  .  . ░░ 
18 |██ ██ ██ ██ ██ ██ ██ 
```
- Length: 7 blocks
- Direction: [1, 0, 0]
- Plane: xy
**Segment #1** (ID: seg_1)

**Visualization: Segment #1**
```text
    9  10 11 12 13 14 15 
    ---------------------
23 |░░ ░░ ░░ ░░ ░░ ░░ ██ 
22 | .  .  .  .  .  . ██ 
21 | .  .  .  .  .  . ██ 
20 | .  .  .  .  .  . ██ 
19 | .  .  .  .  .  . ██ 
18 |░░ ░░ ░░ ░░ ░░ ░░ ░░ 
```
- Length: 5 blocks
- Direction: [0, 0, 1]
- Plane: xz
**Segment #2** (ID: seg_2)

**Visualization: Segment #2**
```text
    9  10 11 12 13 14 15 
    ---------------------
23 |██ ██ ██ ██ ██ ██ ░░ 
22 | .  .  .  .  .  . ░░ 
21 | .  .  .  .  .  . ░░ 
20 | .  .  .  .  .  . ░░ 
19 | .  .  .  .  .  . ░░ 
18 |░░ ░░ ░░ ░░ ░░ ░░ ░░ 
```
- Length: 6 blocks
- Direction: [1, 0, 0]
- Plane: xy

### Meta-Paths (3)

**Meta-Path #0:** `STRAIGHT_CHAIN`

**Visualization: Meta-Path #0**
```text
    9  10 11 12 13 14 15 
    ---------------------
23 |░░ ░░ ░░ ░░ ░░ ░░ ░░ 
22 | .  .  .  .  .  . ░░ 
21 | .  .  .  .  .  . ░░ 
20 | .  .  .  .  .  . ░░ 
19 | .  .  .  .  .  . ░░ 
18 |██ ██ ██ ██ ██ ██ ██ 
```
- Pattern Regularity: ✅ Yes
- Segments: 1
- Joints (Turns): 0
- Total Length: 7
**Meta-Path #1:** `STRAIGHT_CHAIN`

**Visualization: Meta-Path #1**
```text
    9  10 11 12 13 14 15 
    ---------------------
23 |░░ ░░ ░░ ░░ ░░ ░░ ██ 
22 | .  .  .  .  .  . ██ 
21 | .  .  .  .  .  . ██ 
20 | .  .  .  .  .  . ██ 
19 | .  .  .  .  .  . ██ 
18 |░░ ░░ ░░ ░░ ░░ ░░ ░░ 
```
- Pattern Regularity: ✅ Yes
- Segments: 1
- Joints (Turns): 0
- Total Length: 5
**Meta-Path #2:** `STRAIGHT_CHAIN`

**Visualization: Meta-Path #2**
```text
    9  10 11 12 13 14 15 
    ---------------------
23 |██ ██ ██ ██ ██ ██ ░░ 
22 | .  .  .  .  .  . ░░ 
21 | .  .  .  .  .  . ░░ 
20 | .  .  .  .  .  . ░░ 
19 | .  .  .  .  .  . ░░ 
18 |░░ ░░ ░░ ░░ ░░ ░░ ░░ 
```
- Pattern Regularity: ✅ Yes
- Segments: 1
- Joints (Turns): 0
- Total Length: 6

### Geometric Relations

- **perpendicular**: seg_0 ↔ seg_1
- **parallel_axis**: seg_0 ↔ seg_2
- **perpendicular**: seg_1 ↔ seg_2

## 3. 🔄 Pattern Analysis

_No repeating patterns detected._

## 4. 📍 Prioritized Coordinates


**Visualization: Top Priority Positions**
```text
    9  10 11 12 13 14 15 
    ---------------------
23 |██ ░░ ██ ██ ██ ██ ██ 
22 | .  .  .  .  .  . ░░ 
21 | .  .  .  .  .  . ██ 
20 | .  .  .  .  .  . ░░ 
19 | .  .  .  .  .  . ██ 
18 |██ ░░ ██ ██ ██ ░░ ██ 
```
| Priority | Position | Category | Reasons |
|----------|----------|----------|---------|
| 7 | [9, 0, 18] | important | Segment endpoint (start) |
| 7 | [15, 0, 18] | important | Segment endpoint (end) |
| 7 | [15, 0, 19] | important | Segment endpoint (start) |
| 7 | [15, 0, 23] | important | Segment endpoint (end) |
| 7 | [9, 0, 23] | important | Segment endpoint (start) |
| 7 | [14, 0, 23] | important | Segment endpoint (end) |
| 6 | [12, 0, 18] | recommended | Segment midpoint |
| 6 | [12, 0, 23] | recommended | Segment midpoint |
| 4 | [11, 0, 18] | optional | Interval point (every 2 steps) |
| 4 | [13, 0, 18] | optional | Interval point (every 2 steps) |
| 4 | [15, 0, 21] | optional | Interval point (every 2 steps) |
| 4 | [11, 0, 23] | optional | Interval point (every 2 steps) |
| 4 | [13, 0, 23] | optional | Interval point (every 2 steps) |

## 5. 🎛️ Selectable Elements

**Element Distribution:**
- segment: 3
- position: 12
- keypoint: 7

### Detailed Element List

| ID | Type | Role | Label | Coordinates |
|----|------|------|-------|-------------|
| **segment:seg_0** | segment | N/A | N/A | `-` |
| **position:seg_0[1]** | position | N/A | N/A | `-` |
| **position:seg_0[2]** | position | N/A | N/A | `-` |
| **position:seg_0[3]** | position | N/A | N/A | `-` |
| **position:seg_0[4]** | position | N/A | N/A | `-` |
| **position:seg_0[5]** | position | N/A | N/A | `-` |
| **segment:seg_1** | segment | N/A | N/A | `-` |
| **position:seg_1[1]** | position | N/A | N/A | `-` |
| **position:seg_1[2]** | position | N/A | N/A | `-` |
| **position:seg_1[3]** | position | N/A | N/A | `-` |
| **segment:seg_2** | segment | N/A | N/A | `-` |
| **position:seg_2[1]** | position | N/A | N/A | `-` |
| **position:seg_2[2]** | position | N/A | N/A | `-` |
| **position:seg_2[3]** | position | N/A | N/A | `-` |
| **position:seg_2[4]** | position | N/A | N/A | `-` |
| **keypoint:endpoint_1** | keypoint | N/A | N/A | `-` |
| **keypoint:endpoint_2** | keypoint | N/A | N/A | `-` |
| **keypoint:endpoint_3** | keypoint | N/A | N/A | `-` |
| **keypoint:endpoint_4** | keypoint | N/A | N/A | `-` |
| **keypoint:endpoint_5** | keypoint | N/A | N/A | `-` |
| **keypoint:endpoint_6** | keypoint | N/A | N/A | `-` |
| **keypoint:center** | keypoint | N/A | N/A | `-` |

## 📊 Summary

```
Total Blocks: 18
Areas: 0
Path Segments: 3
Meta-Paths: 3
Patterns: 0
Priority Coords: 13
Selectable Elements: 22
```