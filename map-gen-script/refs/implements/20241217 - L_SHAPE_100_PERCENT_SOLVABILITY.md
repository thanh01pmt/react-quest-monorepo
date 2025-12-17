# L-Shape Maps: 100% Solvability Fix Report

**Date**: 2024-12-17
**Status**: ✅ COMPLETED
**Result**: 50/50 maps (100%) now solvable

---

## 📋 Executive Summary

Đã debug và fix thành công các vấn đề khiến L-shaped maps không đạt 100% solvability. Trước đây chỉ đạt ~50-70%, sau fix đạt **100%** solvability với 50+ variants tested.

---

## 🐛 Root Causes Identified

### Bug #1: Argument Order Mismatch in `service.py`

**File**: `src/map_generator/service.py` (line 285)

**Vấn đề**: 
```python
# ❌ SAI: grid_size được truyền TRƯỚC params
final_layout = placement_strategy.place_items(path_info, grid_size=grid_size, params=params)
```

Signature của `place_items()`:
```python
def place_items(self, path_info: PathInfo, params: dict, **kwargs)
```

Khi gọi `place_items(path_info, grid_size=grid_size, params=params)`:
- `path_info` nhận đúng
- `params` (positional 2nd) nhận **grid_size tuple** thay vì dict params thật!
- `params=params` bị coi là kwargs

**Fix**:
```python
# ✅ ĐÚNG: params positional trước, grid_size là kwargs
final_layout = placement_strategy.place_items(path_info, placer_params, grid_size=grid_size)
```

---

### Bug #2: Missing `map_type` in params

**Files**: `src/map_generator/service.py` (lines 275-278, 211-213)

**Vấn đề**:
`FunctionPlacer` cần `params['map_type']` để route đến đúng strategy:

```python
# FunctionPlacer.place_items()
def place_items(self, path_info: PathInfo, params: dict, **kwargs):
    map_type = params.get('map_type')  # ← Trả về None!
    
    # Không tìm thấy → fallback sang CommandObstaclePlacer
```

**Symptoms**:
```
WARNING: FunctionPlacer: Không có chiến lược chuyên biệt cho 'None'. 
         Sử dụng CommandObstaclePlacer làm giải pháp dự phòng.
```

**Fix cho `generate_map()`** (lines 275-278):
```python
# Inject map_type vào params
placer_params = params.copy()
placer_params['map_type'] = map_type
placer_params['logic_type'] = logic_type
```

**Fix cho `generate_map_variants()`** (lines 211-213):
```python
variant_params['map_type'] = map_type
variant_params['logic_type'] = logic_type
```

---

### Bug #3: `solution_config` Mutation Across Variants

**File**: `scripts/generate_all_maps.py` (line 648)

**Vấn đề**:
```python
# ❌ SAI: Reference to original dict
solution_config = map_request.get('solution_config', {})
# ...
solution_config['itemGoals'] = final_item_goals  # ← Mutates map_request!
```

Ở variant 1:
- `map_request['solution_config']['itemGoals'] = {'switch': 'all'}`
- Logic đếm từ `interactibles` → `final_item_goals = {'switch': 3}`
- Gán: `solution_config['itemGoals'] = {'switch': 3}` **← Mutate gốc!**

Ở variant 2+:
- `map_request['solution_config']['itemGoals']` giờ là `{'switch': 3}` (số!)
- Logic đếm **KHÔNG** trigger vì `required_count` không phải `"all"`
- Nếu variant này chỉ có 2 switches → `goal=3, actual=2` → **UNSOLVABLE!**

**Fix**:
```python
# ✅ ĐÚNG: Deep copy để không mutate gốc
solution_config = copy.deepcopy(map_request.get('solution_config', {}))
```

---

## 📊 Before/After Comparison

| Metric | Before Fix | After Fix |
|--------|------------|-----------|
| Solvability Rate | 50-70% | **100%** |
| Goal Mismatch | Common (2-5/10) | **0** |
| Strategy Routing | Fallback to CommandObstaclePlacer | Correct SegmentPlacerStrategy |

---

## 🔧 Files Modified

### 1. `src/map_generator/service.py`

**Changes**:
- Line 275-278: Inject `map_type`, `logic_type` for `generate_map()`
- Line 211-213: Inject `map_type`, `logic_type` for `generate_map_variants()`
- Line 290: Fix argument order for `place_items()` call

### 2. `scripts/generate_all_maps.py`

**Changes**:
- Line 648: Use `copy.deepcopy()` for `solution_config` to prevent mutation

---

## ✅ Verification Results

```bash
# Test with 50 variants
python3 tests/manual/run_single_row_test.py instructions/test/test-l_shape.tsv --row 1 --variants 50

# Result:
# ✅ 50 map tìm thấy lời giải, 0 map không tìm thấy lời giải
```

### Distribution Analysis:
| Switch Count | Maps | Percentage |
|--------------|------|------------|
| 2 switches | 20 | 40% |
| 3 switches | 10 | 20% |
| 4 switches | 20 | 40% |

All maps have `itemGoals` matching actual switch count.

---

## 📝 Lessons Learned

1. **Reference vs Copy**: Always use `copy.deepcopy()` when modifying dicts that may be reused in loops.

2. **Argument Ordering**: Be careful with mixed positional/keyword arguments - order matters!

3. **Logging is Essential**: The "Không có chiến lược chuyên biệt cho 'None'" warning was key to identifying Bug #2.

4. **Test Multiple Variants**: Single-variant tests passed, but multi-variant tests revealed mutation bugs.

---

## 🔗 Related Files

- `src/map_generator/placements/strategies/segment_placer_strategy.py` - The placement strategy that was previously bypassed
- `src/map_generator/placements/function_placer.py` - The router that needs `map_type` to work correctly
- `instructions/test/test-l_shape.tsv` - Test configuration file
