
# MAP ANALYSIS REPORT: MAZE

**Created:** 2025-12-23T20:56:56.648Z | **Total Blocks:** 19

## 1. 🗺️ Global Map Structure


**Visualization: Full Map Overview**
```text
    1  2  3  4  5  6  7  
    ---------------------
22 | . ██ ██ ██ ██ ██ ██ 
21 | .  . ██ ██  .  .  . 
20 | .  .  . ██ ██  .  . 
19 | .  .  .  . ██ ██  . 
18 |██ ██ ██ ██ ██ ██  . 
```

### Map Metrics

- Size: medium
- Total Blocks: 18
- Longest Path: 3 blocks
- Segment Count: 2
- Area Count: 2
- Detected Topology: unknown

## 2. 📐 Geometric Decomposition


### Areas (2)

**Area #0** (ID: area_0)

**Visualization: Area #0**
```text
    1  2  3  4  5  6  7  
    ---------------------
22 | . ░░ ░░ ░░ ░░ ░░ ░░ 
21 | .  . ░░ ░░  .  .  . 
20 | .  .  . ░░ ██  .  . 
19 | .  .  .  . ██ ██  . 
18 |░░ ░░ ░░ ██ ██ ██  . 
```
- Size: 6 blocks
- Shape: square
- Holes: 0
- Gateways: 1
**Area #1** (ID: area_1)

**Visualization: Area #1**
```text
    1  2  3  4  5  6  7  
    ---------------------
22 | . ██ ██ ██ ██ ░░ ░░ 
21 | .  . ██ ██  .  .  . 
20 | .  .  . ██ ░░  .  . 
19 | .  .  .  . ░░ ░░  . 
18 |░░ ░░ ░░ ░░ ░░ ░░  . 
```
- Size: 7 blocks
- Shape: rectangle
- Holes: 0
- Gateways: 1

### Path Segments (2)

**Segment #0** (ID: seg_0)

**Visualization: Segment #0**
```text
    1  2  3  4  5  6  7  
    ---------------------
22 | . ░░ ░░ ░░ ░░ ░░ ░░ 
21 | .  . ░░ ░░  .  .  . 
20 | .  .  . ░░ ░░  .  . 
19 | .  .  .  . ░░ ░░  . 
18 |██ ██ ██ ░░ ░░ ░░  . 
```
- Length: 3 blocks
- Direction: [1, 0, 0]
- Plane: xy
**Segment #1** (ID: seg_1)

**Visualization: Segment #1**
```text
    1  2  3  4  5  6  7  
    ---------------------
22 | . ░░ ░░ ░░ ░░ ██ ██ 
21 | .  . ░░ ░░  .  .  . 
20 | .  .  . ░░ ░░  .  . 
19 | .  .  .  . ░░ ░░  . 
18 |░░ ░░ ░░ ░░ ░░ ░░  . 
```
- Length: 2 blocks
- Direction: [1, 0, 0]
- Plane: xy

### Meta-Paths (2)

**Meta-Path #0:** `STRAIGHT_CHAIN`

**Visualization: Meta-Path #0**
```text
    1  2  3  4  5  6  7  
    ---------------------
22 | . ░░ ░░ ░░ ░░ ░░ ░░ 
21 | .  . ░░ ░░  .  .  . 
20 | .  .  . ░░ ░░  .  . 
19 | .  .  .  . ░░ ░░  . 
18 |██ ██ ██ ░░ ░░ ░░  . 
```
- Pattern Regularity: ✅ Yes
- Segments: 1
- Joints (Turns): 0
- Total Length: 3
**Meta-Path #1:** `STRAIGHT_CHAIN`

**Visualization: Meta-Path #1**
```text
    1  2  3  4  5  6  7  
    ---------------------
22 | . ░░ ░░ ░░ ░░ ██ ██ 
21 | .  . ░░ ░░  .  .  . 
20 | .  .  . ░░ ░░  .  . 
19 | .  .  .  . ░░ ░░  . 
18 |░░ ░░ ░░ ░░ ░░ ░░  . 
```
- Pattern Regularity: ✅ Yes
- Segments: 1
- Joints (Turns): 0
- Total Length: 2

### Gateways

- **Gateway gateway_0:** At [3, 0, 18] → Path: seg_0, Area: area_0
- **Gateway gateway_1:** At [6, 0, 22] → Path: seg_1, Area: area_1

### Geometric Relations

- **parallel_axis**: seg_0 ↔ seg_1

## 3. 🔄 Pattern Analysis

**Pattern #0:** `repeat`
- Unit Elements: area_0_zigzag_edge_raw_0
- Repetitions: 2
**Pattern #1:** `repeat`
- Unit Elements: area_0_zigzag_edge_raw_2
- Repetitions: 1
**Pattern #2:** `repeat`
- Unit Elements: area_1_zigzag_edge_raw_1
- Repetitions: 1
**Pattern #3:** `repeat`
- Unit Elements: area_1_zigzag_edge_raw_3
- Repetitions: 2
**Pattern #4:** `mirror`
- Unit Elements: area_0_left_mass, area_0_right_mass
- Repetitions: 2
**Pattern #5:** `mirror`
- Unit Elements: area_1_left_mass, area_1_right_mass
- Repetitions: 2

## 4. 📍 Prioritized Coordinates


**Visualization: Top Priority Positions**
```text
    1  2  3  4  5  6  7  
    ---------------------
22 | . ██ ░░ ██ ██ ██ ██ 
21 | .  . ░░ ░░  .  .  . 
20 | .  .  . ░░ ██  .  . 
19 | .  .  .  . ░░ ░░  . 
18 |██ ██ ██ ██ ░░ ██  . 
```
| Priority | Position | Category | Reasons |
|----------|----------|----------|---------|
| 10 | [5, 0, 20] | critical | Area Apex (Goal Position) |
| 10 | [4, 0, 22] | critical | Area Apex (Goal Position) |
| 9 | [4, 0, 18] | critical | Left Wing Tip (Area Extremity) |
| 9 | [6, 0, 18] | critical | Right Wing Tip (Area Extremity) |
| 9 | [2, 0, 22] | critical | Left Wing Tip (Area Extremity) |
| 9 | [5, 0, 22] | critical | Right Wing Tip (Area Extremity) |
| 7 | [1, 0, 18] | important | Segment endpoint (start) |
| 7 | [3, 0, 18] | important | Segment endpoint (end) |
| 7 | [6, 0, 22] | important | Segment endpoint (start) |
| 7 | [7, 0, 22] | important | Segment endpoint (end) |
| 6 | [2, 0, 18] | recommended | Segment midpoint |

## 5. 🎛️ Selectable Elements

**Element Distribution:**
- segment: 15
- position: 1
- keypoint: 5

### Detailed Element List

| ID | Type | Role | Label | Coordinates |
|----|------|------|-------|-------------|
| **segment:seg_0** | segment | N/A | N/A | `-` |
| **position:seg_0[1]** | position | N/A | N/A | `-` |
| **segment:seg_1** | segment | N/A | N/A | `-` |
| **area_0_left_mass** | segment | wing_mass | N/A | `[4,0,18]` |
| **area_0_right_mass** | segment | wing_mass | N/A | `[6,0,18], [6,0,19]` |
| **area_0_zigzag_edge_raw_0** | segment | boundary_edge | Zigzag Edge (Staircase) | `[4,0,18], [4,0,18], [5,0,19]` |
| **area_0_base_edge_raw_1** | segment | boundary_edge | Base Edge (Parallel) | `[5,0,19], [5,0,20]` |
| **area_0_zigzag_edge_raw_2** | segment | boundary_edge | Zigzag Edge (Staircase) | `[5,0,20], [6,0,19]` |
| **area_0_base_edge_raw_3** | segment | boundary_edge | Base Edge (Parallel) | `[6,0,19], [6,0,18]` |
| **area_0_base_edge_raw_4_straight** | segment | boundary_edge | Base Edge (Parallel) | `[6,0,18], [5,0,18], [4,0,18]` |
| **area_1_left_mass** | segment | wing_mass | N/A | `[3,0,21], [3,0,22], [2,0,22]` |
| **area_1_right_mass** | segment | wing_mass | N/A | `[4,0,21], [4,0,22], [4,0,20], [5,0,22]` |
| **area_1_base_edge_raw_0_base** | segment | boundary_edge | Base Edge (Parallel) | `[2,0,22], [2,0,22], [3,0,22], [4,0,22], [5,0,22]` |
| **area_1_zigzag_edge_raw_1** | segment | boundary_edge | Zigzag Edge (Staircase) | `[5,0,22], [4,0,21]` |
| **area_1_base_edge_raw_2** | segment | boundary_edge | Base Edge (Parallel) | `[4,0,21], [4,0,20]` |
| **area_1_zigzag_edge_raw_3** | segment | boundary_edge | Zigzag Edge (Staircase) | `[4,0,20], [3,0,21], [2,0,22]` |
| **keypoint:endpoint_1** | keypoint | N/A | N/A | `-` |
| **keypoint:endpoint_2** | keypoint | N/A | N/A | `-` |
| **keypoint:endpoint_3** | keypoint | N/A | N/A | `-` |
| **keypoint:endpoint_4** | keypoint | N/A | N/A | `-` |
| **keypoint:center** | keypoint | N/A | N/A | `-` |

### Element Visualizations

**area_0_left_mass** (segment)

**Visualization: area_0_left_mass**
```text
    1  2  3  4  5  6  7  
    ---------------------
22 | . ░░ ░░ ░░ ░░ ░░ ░░ 
21 | .  . ░░ ░░  .  .  . 
20 | .  .  . ░░ ░░  .  . 
19 | .  .  .  . ░░ ░░  . 
18 |░░ ░░ ░░ ██ ░░ ░░  . 
```
**area_0_right_mass** (segment)

**Visualization: area_0_right_mass**
```text
    1  2  3  4  5  6  7  
    ---------------------
22 | . ░░ ░░ ░░ ░░ ░░ ░░ 
21 | .  . ░░ ░░  .  .  . 
20 | .  .  . ░░ ░░  .  . 
19 | .  .  .  . ░░ ██  . 
18 |░░ ░░ ░░ ░░ ░░ ██  . 
```
**area_0_zigzag_edge_raw_0** (Zigzag Edge (Staircase))

**Visualization: area_0_zigzag_edge_raw_0**
```text
    1  2  3  4  5  6  7  
    ---------------------
22 | . ░░ ░░ ░░ ░░ ░░ ░░ 
21 | .  . ░░ ░░  .  .  . 
20 | .  .  . ░░ ░░  .  . 
19 | .  .  .  . ██ ░░  . 
18 |░░ ░░ ░░ ██ ░░ ░░  . 
```
**area_0_base_edge_raw_1** (Base Edge (Parallel))

**Visualization: area_0_base_edge_raw_1**
```text
    1  2  3  4  5  6  7  
    ---------------------
22 | . ░░ ░░ ░░ ░░ ░░ ░░ 
21 | .  . ░░ ░░  .  .  . 
20 | .  .  . ░░ ██  .  . 
19 | .  .  .  . ██ ░░  . 
18 |░░ ░░ ░░ ░░ ░░ ░░  . 
```
**area_0_zigzag_edge_raw_2** (Zigzag Edge (Staircase))

**Visualization: area_0_zigzag_edge_raw_2**
```text
    1  2  3  4  5  6  7  
    ---------------------
22 | . ░░ ░░ ░░ ░░ ░░ ░░ 
21 | .  . ░░ ░░  .  .  . 
20 | .  .  . ░░ ██  .  . 
19 | .  .  .  . ░░ ██  . 
18 |░░ ░░ ░░ ░░ ░░ ░░  . 
```
**area_0_base_edge_raw_3** (Base Edge (Parallel))

**Visualization: area_0_base_edge_raw_3**
```text
    1  2  3  4  5  6  7  
    ---------------------
22 | . ░░ ░░ ░░ ░░ ░░ ░░ 
21 | .  . ░░ ░░  .  .  . 
20 | .  .  . ░░ ░░  .  . 
19 | .  .  .  . ░░ ██  . 
18 |░░ ░░ ░░ ░░ ░░ ██  . 
```
**area_0_base_edge_raw_4_straight** (Base Edge (Parallel))

**Visualization: area_0_base_edge_raw_4_straight**
```text
    1  2  3  4  5  6  7  
    ---------------------
22 | . ░░ ░░ ░░ ░░ ░░ ░░ 
21 | .  . ░░ ░░  .  .  . 
20 | .  .  . ░░ ░░  .  . 
19 | .  .  .  . ░░ ░░  . 
18 |░░ ░░ ░░ ██ ██ ██  . 
```
**area_1_left_mass** (segment)

**Visualization: area_1_left_mass**
```text
    1  2  3  4  5  6  7  
    ---------------------
22 | . ██ ██ ░░ ░░ ░░ ░░ 
21 | .  . ██ ░░  .  .  . 
20 | .  .  . ░░ ░░  .  . 
19 | .  .  .  . ░░ ░░  . 
18 |░░ ░░ ░░ ░░ ░░ ░░  . 
```
**area_1_right_mass** (segment)

**Visualization: area_1_right_mass**
```text
    1  2  3  4  5  6  7  
    ---------------------
22 | . ░░ ░░ ██ ██ ░░ ░░ 
21 | .  . ░░ ██  .  .  . 
20 | .  .  . ██ ░░  .  . 
19 | .  .  .  . ░░ ░░  . 
18 |░░ ░░ ░░ ░░ ░░ ░░  . 
```
**area_1_base_edge_raw_0_base** (Base Edge (Parallel))

**Visualization: area_1_base_edge_raw_0_base**
```text
    1  2  3  4  5  6  7  
    ---------------------
22 | . ██ ██ ██ ██ ░░ ░░ 
21 | .  . ░░ ░░  .  .  . 
20 | .  .  . ░░ ░░  .  . 
19 | .  .  .  . ░░ ░░  . 
18 |░░ ░░ ░░ ░░ ░░ ░░  . 
```
**area_1_zigzag_edge_raw_1** (Zigzag Edge (Staircase))

**Visualization: area_1_zigzag_edge_raw_1**
```text
    1  2  3  4  5  6  7  
    ---------------------
22 | . ░░ ░░ ░░ ██ ░░ ░░ 
21 | .  . ░░ ██  .  .  . 
20 | .  .  . ░░ ░░  .  . 
19 | .  .  .  . ░░ ░░  . 
18 |░░ ░░ ░░ ░░ ░░ ░░  . 
```
**area_1_base_edge_raw_2** (Base Edge (Parallel))

**Visualization: area_1_base_edge_raw_2**
```text
    1  2  3  4  5  6  7  
    ---------------------
22 | . ░░ ░░ ░░ ░░ ░░ ░░ 
21 | .  . ░░ ██  .  .  . 
20 | .  .  . ██ ░░  .  . 
19 | .  .  .  . ░░ ░░  . 
18 |░░ ░░ ░░ ░░ ░░ ░░  . 
```
**area_1_zigzag_edge_raw_3** (Zigzag Edge (Staircase))

**Visualization: area_1_zigzag_edge_raw_3**
```text
    1  2  3  4  5  6  7  
    ---------------------
22 | . ██ ░░ ░░ ░░ ░░ ░░ 
21 | .  . ██ ░░  .  .  . 
20 | .  .  . ██ ░░  .  . 
19 | .  .  .  . ░░ ░░  . 
18 |░░ ░░ ░░ ░░ ░░ ░░  . 
```

## 📊 Summary

```
Total Blocks: 19
Areas: 2
Path Segments: 2
Meta-Paths: 2
Patterns: 6
Priority Coords: 11
Selectable Elements: 21
```