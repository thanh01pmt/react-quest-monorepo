
# MAP ANALYSIS REPORT: MAZE

**Created:** 2025-12-23T09:14:34.768Z | **Total Blocks:** 15

## 1. 🗺️ Global Map Structure


**Visualization: Full Map Overview**
```text
    8  9  10 11 12 
    ---------------
14 | .  . ██  .  . 
13 | . ██ ██ ██  . 
12 |██ ██ ██ ██ ██ 
11 | .  . ██  .  . 
10 | .  . ██  .  . 
9  | .  . ██  .  . 
8  | .  . ██  .  . 
7  | .  . ██  .  . 
6  | .  . ██  .  . 
```

### Map Metrics

- Size: tiny
- Total Blocks: 15
- Longest Path: 6 blocks
- Segment Count: 1
- Area Count: 1
- Detected Topology: arrow_shape

## 2. 📐 Geometric Decomposition


### Areas (1)

**Area #0** (ID: area_0)

**Visualization: Area #0**
```text
    8  9  10 11 12 
    ---------------
14 | .  . ██  .  . 
13 | . ██ ██ ██  . 
12 |██ ██ ██ ██ ██ 
11 | .  . ░░  .  . 
10 | .  . ░░  .  . 
9  | .  . ░░  .  . 
8  | .  . ░░  .  . 
7  | .  . ░░  .  . 
6  | .  . ░░  .  . 
```
- Size: 9 blocks
- Shape: irregular
- Holes: 0
- Gateways: 1

### Path Segments (1)

**Segment #0** (ID: seg_0)

**Visualization: Segment #0**
```text
    8  9  10 11 12 
    ---------------
14 | .  . ░░  .  . 
13 | . ░░ ░░ ░░  . 
12 |░░ ░░ ░░ ░░ ░░ 
11 | .  . ██  .  . 
10 | .  . ██  .  . 
9  | .  . ██  .  . 
8  | .  . ██  .  . 
7  | .  . ██  .  . 
6  | .  . ██  .  . 
```
- Length: 6 blocks
- Direction: [0, 0, 1]
- Plane: xz

### Meta-Paths (1)

**Meta-Path #0:** `STRAIGHT_CHAIN`

**Visualization: Meta-Path #0**
```text
    8  9  10 11 12 
    ---------------
14 | .  . ░░  .  . 
13 | . ░░ ░░ ░░  . 
12 |░░ ░░ ░░ ░░ ░░ 
11 | .  . ██  .  . 
10 | .  . ██  .  . 
9  | .  . ██  .  . 
8  | .  . ██  .  . 
7  | .  . ██  .  . 
6  | .  . ██  .  . 
```
- Pattern Regularity: ✅ Yes
- Segments: 1
- Joints (Turns): 0
- Total Length: 6

### Gateways

- **Gateway gateway_0:** At [10, 0, 11] → Path: seg_0, Area: area_0

## 3. 🔄 Pattern Analysis

**Pattern #0:** `mirror`
- Unit Elements: area_0_left_wing, area_0_right_wing
- Repetitions: 2

## 4. 📍 Prioritized Coordinates


**Visualization: Top Priority Positions**
```text
    8  9  10 11 12 
    ---------------
14 | .  . ██  .  . 
13 | . ░░ ░░ ░░  . 
12 |██ ░░ ░░ ░░ ██ 
11 | .  . ██  .  . 
10 | .  . ██  .  . 
9  | .  . ██  .  . 
8  | .  . ██  .  . 
7  | .  . ██  .  . 
6  | .  . ██  .  . 
```
| Priority | Position | Category | Reasons |
|----------|----------|----------|---------|
| 10 | [10, 0, 14] | critical | Area Apex (Goal Position) |
| 9 | [8, 0, 12] | critical | Left Wing Tip (Area Extremity) |
| 9 | [12, 0, 12] | critical | Right Wing Tip (Area Extremity) |
| 7 | [10, 0, 6] | important | Segment endpoint (start) |
| 7 | [10, 0, 11] | important | Segment endpoint (end) |
| 4 | [10, 0, 7] | optional | Interval point (every 1 steps) |
| 4 | [10, 0, 8] | optional | Interval point (every 1 steps) |
| 4 | [10, 0, 9] | optional | Interval point (every 1 steps) |
| 4 | [10, 0, 10] | optional | Interval point (every 1 steps) |

## 5. 🎛️ Selectable Elements

**Element Distribution:**
- segment: 4
- position: 4
- keypoint: 2

## 📊 Summary

```
Total Blocks: 15
Areas: 1
Path Segments: 1
Meta-Paths: 1
Patterns: 1
Priority Coords: 9
Selectable Elements: 10
```