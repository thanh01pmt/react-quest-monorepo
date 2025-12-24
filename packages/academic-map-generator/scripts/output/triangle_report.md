
# MAP ANALYSIS REPORT: MAZE

**Created:** 2025-12-23T20:56:56.646Z | **Total Blocks:** 16

## 1. 🗺️ Global Map Structure


**Visualization: Full Map Overview**
```text
    11 12 13 14 15 16 
    ------------------
14 |██  .  .  .  .  . 
13 |██ ██  .  .  .  . 
12 |██ ██ ██  .  .  . 
11 |██ ██ ██ ██  .  . 
10 |██ ██ ██ ██ ██ ██ 
```

### Map Metrics

- Size: tiny
- Total Blocks: 15
- Longest Path: 2 blocks
- Segment Count: 1
- Area Count: 1
- Detected Topology: arrow_shape

## 2. 📐 Geometric Decomposition


### Areas (1)

**Area #0** (ID: area_0)

**Visualization: Area #0**
```text
    11 12 13 14 15 16 
    ------------------
14 |░░  .  .  .  .  . 
13 |██ ██  .  .  .  . 
12 |██ ██ ██  .  .  . 
11 |██ ██ ██ ██  .  . 
10 |██ ██ ██ ██ ░░ ░░ 
```
- Size: 13 blocks
- Shape: square
- Holes: 0
- Gateways: 1

### Path Segments (1)

**Segment #0** (ID: seg_0)

**Visualization: Segment #0**
```text
    11 12 13 14 15 16 
    ------------------
14 |░░  .  .  .  .  . 
13 |░░ ░░  .  .  .  . 
12 |░░ ░░ ░░  .  .  . 
11 |░░ ░░ ░░ ░░  .  . 
10 |░░ ░░ ░░ ░░ ██ ██ 
```
- Length: 2 blocks
- Direction: [1, 0, 0]
- Plane: xy

### Meta-Paths (1)

**Meta-Path #0:** `STRAIGHT_CHAIN`

**Visualization: Meta-Path #0**
```text
    11 12 13 14 15 16 
    ------------------
14 |░░  .  .  .  .  . 
13 |░░ ░░  .  .  .  . 
12 |░░ ░░ ░░  .  .  . 
11 |░░ ░░ ░░ ░░  .  . 
10 |░░ ░░ ░░ ░░ ██ ██ 
```
- Pattern Regularity: ✅ Yes
- Segments: 1
- Joints (Turns): 0
- Total Length: 2

### Gateways

- **Gateway gateway_0:** At [15, 0, 10] → Path: seg_0, Area: area_0

## 3. 🔄 Pattern Analysis

**Pattern #0:** `repeat`
- Unit Elements: area_0_zigzag_edge_raw_2
- Repetitions: 2

## 4. 📍 Prioritized Coordinates


**Visualization: Top Priority Positions**
```text
    11 12 13 14 15 16 
    ------------------
14 |░░  .  .  .  .  . 
13 |░░ ██  .  .  .  . 
12 |░░ ░░ ░░  .  .  . 
11 |██ ░░ ░░ ██  .  . 
10 |░░ ░░ ░░ ░░ ██ ██ 
```
| Priority | Position | Category | Reasons |
|----------|----------|----------|---------|
| 10 | [12, 0, 13] | critical | Area Apex (Goal Position) |
| 9 | [11, 0, 11] | critical | Left Wing Tip (Area Extremity) |
| 9 | [14, 0, 11] | critical | Right Wing Tip (Area Extremity) |
| 7 | [15, 0, 10] | important | Segment endpoint (start) |
| 7 | [16, 0, 10] | important | Segment endpoint (end) |

## 5. 🎛️ Selectable Elements

**Element Distribution:**
- segment: 6
- keypoint: 2

### Detailed Element List

| ID | Type | Role | Label | Coordinates |
|----|------|------|-------|-------------|
| **segment:seg_0** | segment | N/A | N/A | `-` |
| **area_0_side_edge_raw_0** | segment | boundary_edge | Internal Path | `[11,0,10], [11,0,10], [11,0,11], [11,0,12], [11,0,13]` |
| **area_0_base_edge_raw_1_straight** | segment | boundary_edge | Base Edge (Parallel) | `[11,0,13], [12,0,13]` |
| **area_0_zigzag_edge_raw_2** | segment | boundary_edge | Zigzag Edge (Staircase) | `[12,0,13], [13,0,12], [14,0,11]` |
| **area_0_base_edge_raw_3** | segment | boundary_edge | Base Edge (Parallel) | `[14,0,11], [14,0,10]` |
| **area_0_base_edge_raw_4_base** | segment | boundary_edge | Base Edge (Parallel) | `[14,0,10], [13,0,10], [12,0,10], [11,0,10]` |
| **keypoint:endpoint_1** | keypoint | N/A | N/A | `-` |
| **keypoint:endpoint_2** | keypoint | N/A | N/A | `-` |

### Element Visualizations

**area_0_side_edge_raw_0** (Internal Path)

**Visualization: area_0_side_edge_raw_0**
```text
    11 12 13 14 15 16 
    ------------------
14 |░░  .  .  .  .  . 
13 |██ ░░  .  .  .  . 
12 |██ ░░ ░░  .  .  . 
11 |██ ░░ ░░ ░░  .  . 
10 |██ ░░ ░░ ░░ ░░ ░░ 
```
**area_0_base_edge_raw_1_straight** (Base Edge (Parallel))

**Visualization: area_0_base_edge_raw_1_straight**
```text
    11 12 13 14 15 16 
    ------------------
14 |░░  .  .  .  .  . 
13 |██ ██  .  .  .  . 
12 |░░ ░░ ░░  .  .  . 
11 |░░ ░░ ░░ ░░  .  . 
10 |░░ ░░ ░░ ░░ ░░ ░░ 
```
**area_0_zigzag_edge_raw_2** (Zigzag Edge (Staircase))

**Visualization: area_0_zigzag_edge_raw_2**
```text
    11 12 13 14 15 16 
    ------------------
14 |░░  .  .  .  .  . 
13 |░░ ██  .  .  .  . 
12 |░░ ░░ ██  .  .  . 
11 |░░ ░░ ░░ ██  .  . 
10 |░░ ░░ ░░ ░░ ░░ ░░ 
```
**area_0_base_edge_raw_3** (Base Edge (Parallel))

**Visualization: area_0_base_edge_raw_3**
```text
    11 12 13 14 15 16 
    ------------------
14 |░░  .  .  .  .  . 
13 |░░ ░░  .  .  .  . 
12 |░░ ░░ ░░  .  .  . 
11 |░░ ░░ ░░ ██  .  . 
10 |░░ ░░ ░░ ██ ░░ ░░ 
```
**area_0_base_edge_raw_4_base** (Base Edge (Parallel))

**Visualization: area_0_base_edge_raw_4_base**
```text
    11 12 13 14 15 16 
    ------------------
14 |░░  .  .  .  .  . 
13 |░░ ░░  .  .  .  . 
12 |░░ ░░ ░░  .  .  . 
11 |░░ ░░ ░░ ░░  .  . 
10 |██ ██ ██ ██ ░░ ░░ 
```

## 📊 Summary

```
Total Blocks: 16
Areas: 1
Path Segments: 1
Meta-Paths: 1
Patterns: 1
Priority Coords: 5
Selectable Elements: 8
```