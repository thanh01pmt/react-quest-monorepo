# src/map_generator/placements/strategies/segment_placer_strategy.py
"""
SEGMENT PLACER STRATEGY (Nâng cấp)

- Chuyên gia xử lý các map có cấu trúc "phân đoạn" (square_shape, zigzag, etc.).
- [NÂNG CẤP] Kế thừa trực tiếp từ BasePlacer.
- [NÂNG CẤP] Đọc cấu trúc 'segments' và 'corners' từ `path_info.metadata`.
- [NÂNG CẤP] Xử lý đầy đủ các challenge_type: APPLY, REFACTOR, DEBUG.
- [NÂNG CẤP v2] Hỗ trợ đa dạng Function Patterns cho maps có gấp khúc.
"""

import random
import logging
from enum import Enum
from typing import List, Tuple, Dict, Set, Any, Iterator, Optional
from src.map_generator.models.path_info import PathInfo
# Import BasePlacer từ thư mục cha
from ..base_placer import BasePlacer

logger = logging.getLogger(__name__)
Coord = Tuple[int, int, int]


class FunctionPattern(Enum):
    """
    Các patterns đặt item cho function logic trên maps có gấp khúc.
    
    - CORNER_CENTRIC: Items đối xứng quanh góc
    - SYMMETRIC: Cùng pattern trên mỗi segment  
    - TURN_START: Function bắt đầu bằng turn
    - CORNER_CHECKPOINT: Góc là checkpoint
    - PROPORTIONAL: Số items tỷ lệ với độ dài segment (independent scaling)
    - AUTO: Random chọn với tỷ lệ đều 20%
    """
    CORNER_CENTRIC = "corner_centric"      # Pattern B
    SYMMETRIC = "symmetric"                 # Pattern C
    TURN_START = "turn_start"               # Pattern D
    CORNER_CHECKPOINT = "corner_checkpoint" # Pattern E
    PROPORTIONAL = "proportional"           # Pattern F - NEW
    AUTO = "auto"


# Minimum items required for each pattern based on map complexity
PATTERN_MIN_ITEMS = {
    FunctionPattern.CORNER_CENTRIC: 2,      # Cần ít nhất 2 items đối xứng
    FunctionPattern.SYMMETRIC: 2,           # Cần ít nhất 1 item per segment × 2 segments
    FunctionPattern.TURN_START: 2,          # Cần ít nhất 2 items cho repeat pattern
    FunctionPattern.CORNER_CHECKPOINT: 1,   # Có thể chỉ 1 item tại corner
    FunctionPattern.PROPORTIONAL: 2,        # Tối thiểu 1 item per segment
}


class SegmentPlacerStrategy(BasePlacer):
    """
    Strategy đặt items trên maps có cấu trúc phân đoạn (L-shape, U-shape, Square, etc.)
    
    [NEW v2] Hỗ trợ đa dạng Function Patterns:
    - CORNER_CENTRIC: Items đối xứng quanh góc
    - SYMMETRIC: Cùng pattern trên mỗi segment
    - TURN_START: Function bắt đầu bằng turn
    - CORNER_CHECKPOINT: Góc là checkpoint giữa các segments
    """
    
    # ==================================================================
    # FUNCTION PATTERN HELPERS
    # ==================================================================
    
    def _parse_function_pattern(self, params: dict) -> FunctionPattern:
        """Parse function_pattern từ params, default là AUTO."""
        pattern_str = params.get('function_pattern', 'auto').lower()
        try:
            return FunctionPattern(pattern_str)
        except ValueError:
            logger.warning(f"Unknown function_pattern '{pattern_str}', using AUTO")
            return FunctionPattern.AUTO
    
    def _select_random_pattern(self) -> FunctionPattern:
        """Chọn random pattern với tỷ lệ đều 20% mỗi pattern."""
        patterns = [
            FunctionPattern.CORNER_CENTRIC,
            FunctionPattern.SYMMETRIC,
            FunctionPattern.TURN_START,
            FunctionPattern.CORNER_CHECKPOINT,
            FunctionPattern.PROPORTIONAL  # NEW
        ]
        return random.choice(patterns)
    
    def _can_use_pattern(self, pattern: FunctionPattern, segments: List[List[Coord]], 
                          corners: List[Coord], item_count: int) -> bool:
        """Kiểm tra xem pattern có khả thi với map hiện tại không."""
        min_items = PATTERN_MIN_ITEMS.get(pattern, 1)
        
        if item_count < min_items:
            return False
        
        # Pattern-specific checks
        if pattern == FunctionPattern.CORNER_CENTRIC:
            # Cần ít nhất 1 góc và 2 segments để đối xứng
            if len(corners) < 1 or len(segments) < 2:
                return False
            # Mỗi segment cần đủ dài để đặt item
            for seg in segments[:2]:  # Chỉ check 2 segments đầu
                if len(seg) < 3:  # Cần ít nhất 3 ô để có vị trí giữa
                    return False
        
        elif pattern == FunctionPattern.SYMMETRIC:
            # Cần ít nhất 2 segments có độ dài tương đương
            if len(segments) < 2:
                return False
            items_per_seg = item_count // len(segments)
            if items_per_seg < 1:
                return False
        
        elif pattern == FunctionPattern.TURN_START:
            # Cần ít nhất 2 segments
            if len(segments) < 2:
                return False
        
        elif pattern == FunctionPattern.CORNER_CHECKPOINT:
            # Cần ít nhất 1 góc
            if len(corners) < 1:
                return False
        
        return True
    
    def _get_valid_patterns(self, segments: List[List[Coord]], corners: List[Coord], 
                            item_count: int) -> List[FunctionPattern]:
        """Trả về danh sách các patterns khả thi."""
        valid = []
        for pattern in [FunctionPattern.CORNER_CENTRIC, FunctionPattern.SYMMETRIC,
                       FunctionPattern.TURN_START, FunctionPattern.CORNER_CHECKPOINT]:
            if self._can_use_pattern(pattern, segments, corners, item_count):
                valid.append(pattern)
        return valid
    
    def _get_corner_indices(self, path: List[Coord], corners: List[Coord]) -> List[int]:
        """Trả về indices của các góc trong path."""
        corner_set = set(corners)
        return [i for i, coord in enumerate(path) if coord in corner_set]
    
    # ==================================================================
    # FUNCTION PATTERN IMPLEMENTATIONS
    # ==================================================================
    
    def _place_corner_centric(self, segments: List[List[Coord]], corners: List[Coord],
                               item_count: int, params: dict) -> List[Dict]:
        """
        Pattern B: Items đối xứng quanh góc.
        
        Ví dụ với L-shape:
            [Start]
               |
               ● Item 1 (cách góc D bước)
               |
            [GÓC] ← optional item
               |
               ● Item 2 (cách góc D bước)
               |
            [Finish]
        """
        items = []
        corner_placement = params.get('corner_placement', 'auto')
        place_at_corner = corner_placement == 'true' or (corner_placement == 'auto' and random.choice([True, False]))
        
        if not corners or len(segments) < 2:
            return items
        
        # Số items còn lại sau khi đặt tại corners (nếu có)
        remaining_items = item_count
        
        # Đặt tại corners nếu được yêu cầu
        if place_at_corner:
            for corner in corners:
                if remaining_items <= 0:
                    break
                items.append({"type": "crystal", "pos": corner})
                remaining_items -= 1
        
        # Phân bổ items đối xứng trên các segments quanh corners
        if remaining_items > 0:
            items_per_side = remaining_items // 2
            
            for i, segment in enumerate(segments[:2]):  # Chỉ lấy 2 segments đầu quanh góc
                seg_len = len(segment)
                if seg_len < 3:
                    continue
                
                # Đặt item cách góc một khoảng đều
                # Segment[0] thường là góc hoặc điểm gần góc
                # Segment[-1] là đầu/cuối segment xa góc
                distance_from_corner = max(1, seg_len // 3)
                
                for j in range(items_per_side):
                    idx = min(distance_from_corner * (j + 1), seg_len - 2)
                    if 0 < idx < seg_len:
                        items.append({"type": "crystal", "pos": segment[idx]})
        
        return items
    
    def _place_symmetric(self, segments: List[List[Coord]], corners: List[Coord],
                          item_count: int, params: dict) -> List[Dict]:
        """
        Pattern C: Cùng pattern trên mỗi segment - items ở CÙNG SỐ BƯỚC.
        
        Có 2 modes (random chọn):
        - symmetric_start: Số bước ĐẦU giống nhau → N bước → toggle → (còn lại)
        - symmetric_end: Số bước CUỐI giống nhau → (còn lại) → toggle → M bước
        
        Ví dụ với leg1=7, leg2=5, min_valid=3:
            symmetric_start: leg1 = 2→toggle→4, leg2 = 2→toggle→2 (cùng 2 bước đầu)
            symmetric_end:   leg1 = 4→toggle→2, leg2 = 2→toggle→2 (cùng 2 bước cuối)
        """
        items = []
        
        if not segments or len(segments) < 2:
            return items
        
        # 1. Tìm min valid range và segment info
        min_valid_range = float('inf')
        segment_info = []  # [(seg_len, valid_start, valid_end)]
        
        for segment in segments:
            seg_len = len(segment)
            if seg_len < 3:
                continue
            valid_start = 1
            valid_end = seg_len - 2
            if valid_end > valid_start:
                v_range = valid_end - valid_start + 1
                segment_info.append((seg_len, valid_start, valid_end, v_range))
                min_valid_range = min(min_valid_range, v_range)
        
        if min_valid_range == float('inf') or min_valid_range < 1:
            return items
        
        # 2. Random chọn mode: 'start' hoặc 'end'
        symmetric_mode = params.get('symmetric_mode', 'auto')
        if symmetric_mode == 'auto':
            symmetric_mode = random.choice(['start', 'end'])
        
        logger.info(f"SegmentPlacer: symmetric mode = '{symmetric_mode}'")
        
        # 3. Tính vị trí tuyệt đối cho switch
        steps_offset = 1 + min_valid_range // 2  # Số bước từ anchor point
        
        items_per_segment = max(1, item_count // len(segments))
        
        for seg_idx, segment in enumerate(segments):
            seg_len = len(segment)
            if seg_len < 3:
                continue
            
            valid_start = 1
            valid_end = seg_len - 2
            
            if valid_end <= valid_start:
                continue
            
            for i in range(items_per_segment):
                if items_per_segment == 1:
                    if symmetric_mode == 'start':
                        # Anchor từ đầu: idx = steps_offset từ đầu
                        idx = steps_offset
                    else:  # symmetric_mode == 'end'
                        # Anchor từ cuối: idx = (seg_len - 1) - steps_offset
                        idx = seg_len - 1 - steps_offset
                else:
                    # Nhiều items: chia đều trong min valid range
                    step = min_valid_range / (items_per_segment + 1)
                    if symmetric_mode == 'start':
                        idx = valid_start + int(step * (i + 1))
                    else:
                        idx = valid_end - int(step * (items_per_segment - i))
                
                # Đảm bảo trong valid range của segment này
                idx = max(valid_start, min(idx, valid_end))
                items.append({"type": "crystal", "pos": segment[idx]})
                
                if len(items) >= item_count:
                    return items
        
        return items
    
    def _place_turn_start(self, segments: List[List[Coord]], corners: List[Coord],
                           item_count: int, params: dict) -> List[Dict]:
        """
        Pattern D: Function bắt đầu bằng turn.
        
        Items đặt sao cho mỗi lần collect xong là đến vị trí cần turn.
        
        Ví dụ:
            turnLeft → repeat N { turnRight → moveForward(X) → collect }
        """
        items = []
        
        if len(segments) < 2:
            return items
        
        corner_placement = params.get('corner_placement', 'auto')
        place_at_corner = corner_placement == 'true' or (corner_placement == 'auto' and random.choice([True, False]))
        
        items_distributed = 0
        
        for i, segment in enumerate(segments):
            if items_distributed >= item_count:
                break
            
            seg_len = len(segment)
            if seg_len < 2:
                continue
            
            # Đặt item gần CUỐI segment (trước góc)
            # Điều này tạo pattern: move → move → collect → turn
            if place_at_corner and i < len(corners):
                # Đặt tại góc nếu được phép
                items.append({"type": "crystal", "pos": corners[i]})
            else:
                # Đặt cách góc 1 bước
                idx = seg_len - 2 if seg_len > 2 else seg_len - 1
                items.append({"type": "crystal", "pos": segment[idx]})
            
            items_distributed += 1
        
        return items
    
    def _place_corner_checkpoint(self, segments: List[List[Coord]], corners: List[Coord],
                                   item_count: int, params: dict) -> List[Dict]:
        """
        Pattern E: Góc là checkpoint.
        
        Items phân bổ đều trên mỗi leg, góc là điểm transition.
        
        Ví dụ:
            doLeg1() → atCorner() → doLeg2()
            với doLeg() = repeat { moveForward(X) → collect }
        """
        items = []
        
        if not segments:
            return items
        
        corner_placement = params.get('corner_placement', 'auto')
        place_at_corner = corner_placement == 'true' or (corner_placement == 'auto' and random.choice([True, False]))
        
        # Đặt items tại corners trước (như checkpoint)
        if place_at_corner:
            for corner in corners[:item_count]:
                items.append({"type": "crystal", "pos": corner})
        
        # Phân bổ items còn lại đều trên các segments
        remaining = item_count - len(items)
        if remaining > 0:
            items_per_seg = max(1, remaining // len(segments))
            
            for segment in segments:
                seg_len = len(segment)
                if seg_len < 3:
                    continue
                
                # Đặt ở giữa segment
                mid = seg_len // 2
                items.append({"type": "crystal", "pos": segment[mid]})
                
                if len(items) >= item_count:
                    break
        
        return items
    
    def _place_proportional(self, segments: List[List[Coord]], corners: List[Coord],
                            item_count: int, params: dict) -> List[Dict]:
        """
        Pattern F: Proportional - số items tỷ lệ với độ dài segment (INDEPENDENT scaling).
        
        CONSTRAINT: Khoảng cách giữa các items liền kề GIỐNG NHAU trên tất cả segments.
        Điều này cho phép reuse function với cùng spacing.
        
        Ví dụ với leg1=7 (valid=5), leg2=5 (valid=3), spacing=2:
            Leg1: 3 items at positions 1, 3, 5 (3 items fit)
            Leg2: 2 items at positions 1, 3 (2 items fit)
        
        Kết quả: function có thể reuse:
            function collect() { repeat 2: moveForward(); toggleSwitch(); }
            // Gọi 3 lần cho leg1, 2 lần cho leg2
        """
        items = []
        
        if not segments or len(segments) < 2:
            return items
        
        # 1. Tính valid range cho mỗi segment
        segment_info = []
        for segment in segments:
            seg_len = len(segment)
            if seg_len < 3:
                continue
            valid_start = 1
            valid_end = seg_len - 2
            valid_range = valid_end - valid_start + 1
            segment_info.append({
                'segment': segment,
                'valid_start': valid_start,
                'valid_end': valid_end,
                'valid_range': valid_range
            })
        
        if not segment_info:
            return items
        
        # 2. Tính spacing tối ưu (common spacing across all segments)
        # Spacing phải đủ nhỏ để fit ≥1 item trên segment ngắn nhất
        min_valid_range = min(info['valid_range'] for info in segment_info)
        
        # Lấy spacing từ params hoặc tính tự động
        spacing = params.get('item_spacing', 'auto')
        if spacing == 'auto':
            # Tự động tính: spacing = 2 cho pattern đẹp, hoặc 1 nếu range nhỏ
            if min_valid_range >= 3:
                spacing = 2  # Positions: 1, 3, 5, ...
            else:
                spacing = 1  # Positions: 1, 2, 3, ...
        else:
            spacing = max(1, int(spacing))
        
        logger.info(f"SegmentPlacer: PROPORTIONAL pattern with spacing={spacing}")
        
        # 3. Đặt items trên mỗi segment với cùng spacing
        for info in segment_info:
            segment = info['segment']
            valid_start = info['valid_start']
            valid_end = info['valid_end']
            
            # Tính số items có thể fit với spacing này
            pos = valid_start
            while pos <= valid_end:
                items.append({"type": "crystal", "pos": segment[pos]})
                pos += spacing
                
                if len(items) >= item_count:
                    return items
        
        return items
    
    def _place_for_function_logic(self, segments: List[List[Coord]], corners: List[Coord],
                                   item_count: int, params: dict) -> List[Dict]:
        """
        Main routing method cho function pattern placement.
        """
        # Parse pattern từ params
        pattern = self._parse_function_pattern(params)
        
        # Nếu AUTO, chọn random từ các patterns khả thi
        if pattern == FunctionPattern.AUTO:
            valid_patterns = self._get_valid_patterns(segments, corners, item_count)
            if not valid_patterns:
                logger.warning("Không có pattern nào khả thi, skip placement")
                return []
            pattern = random.choice(valid_patterns)
            logger.info(f"SegmentPlacer: AUTO selected pattern '{pattern.value}'")
        
        # Kiểm tra tính khả thi
        if not self._can_use_pattern(pattern, segments, corners, item_count):
            # Fallback: thử các pattern khác
            valid_patterns = self._get_valid_patterns(segments, corners, item_count)
            if not valid_patterns:
                logger.error(f"Pattern '{pattern.value}' không khả thi và không có fallback")
                return []
            pattern = random.choice(valid_patterns)
            logger.warning(f"Pattern fallback to '{pattern.value}'")
        # Route đến implementation tương ứng
        logger.info(f"SegmentPlacer: Applying function pattern '{pattern.value}'")
        
        if pattern == FunctionPattern.CORNER_CENTRIC:
            return self._place_corner_centric(segments, corners, item_count, params)
        elif pattern == FunctionPattern.SYMMETRIC:
            return self._place_symmetric(segments, corners, item_count, params)
        elif pattern == FunctionPattern.TURN_START:
            return self._place_turn_start(segments, corners, item_count, params)
        elif pattern == FunctionPattern.CORNER_CHECKPOINT:
            return self._place_corner_checkpoint(segments, corners, item_count, params)
        elif pattern == FunctionPattern.PROPORTIONAL:
            return self._place_proportional(segments, corners, item_count, params)
        
        return []

    # ==================================================================
    # LEGACY LOGIC: Interval on Segment
    # ==================================================================
    def _place_interval_on_segments(self, segments: List[List[Coord]], count_per_segment: int, include_corners: bool) -> List[Dict]:
        """
        Đặt item rải đều trên từng segment.
        """
        items = []
        
        for i, segment in enumerate(segments):
            # Tính toán indices giống LinearPlacer
            seg_len = len(segment)
            if seg_len < 2: continue
            
            # Nếu include_corners=True, ta muốn đặt cả ở đầu và cuối segment
            # Tuy nhiên, đầu segment i thường là cuối segment i-1.
            # Để tránh trùng, ta có thể chỉ đặt ở ĐẦU (hoặc CUỐI) mỗi segment, 
            # hoặc xử lý set ở cấp độ cao hơn.
            # Ở đây ta sẽ tính toán vị trí, việc lọc trùng do caller (place_items) lo.
            
            # Logic chia đều:
            # Anchor Start & End = include_corners
            stride = (seg_len - 1) / (count_per_segment + 1) if not include_corners else (seg_len - 1) / (count_per_segment - 1) if count_per_segment > 1 else (seg_len-1)/2
            
            # Fix lại logic tính toán cho segment
            # Nếu count=3, include_corners=True: Start, Mid, End.
            indices = []
            if include_corners:
                if count_per_segment == 1:
                    indices = [seg_len // 2]
                else:
                    step = (seg_len - 1) / (count_per_segment - 1)
                    for k in range(count_per_segment):
                        indices.append(int(round(k * step)))
            else:
                # Không include corners -> chia khoảng bên trong
                # total_slots = count + 1 (Start -> I1 -> ... -> Ic -> End)
                step = (seg_len - 1) / (count_per_segment + 1)
                for k in range(count_per_segment):
                    indices.append(int(round((k + 1) * step)))
            
            for idx in indices:
                if 0 <= idx < seg_len:
                    pos = segment[idx]
                    items.append({"type": "crystal", "pos": pos}) # Type sẽ được override ở ngoài
                    
        return items


    def place_item_variants(self, path_info: PathInfo, params: dict, max_variants: int) -> Iterator[Dict[str, Any]]:
        """
        [KIẾN TRÚC MỚI] Tạo ra các biến thể layout.
        Hiện tại, nó chỉ tạo ra một biến thể duy nhất bằng cách gọi place_items.
        """
        # Logic tạo nhiều biến thể có thể được thêm vào đây sau.
        yield self.place_items(path_info, params)

    def place_items(self, path_info: PathInfo, params: dict, **kwargs) -> Dict[str, Any]:
        self.path_info = path_info
        items = []
        used_coords = set()
        
        # 1. Nhận diện segments & corners từ Metadata (do Topology cung cấp)
        segments = path_info.metadata.get('segments', [])
        corners = path_info.metadata.get('corners', [])
        
        # [FIX] L-shape uses 'corner' (singular), other topologies use 'corners' (plural)
        if not corners:
            single_corner = path_info.metadata.get('corner')
            if single_corner:
                corners = [single_corner]
        
        # 2. Xác định logic type và placement pattern
        logic_type = params.get('logic_type', params.get('gen_logic_type', ''))
        placement_pattern = params.get('placement_pattern', 'corners_and_segments')
        
        # ==================================================================
        # [NEW v2] Function Logic với diverse patterns
        # ==================================================================
        if logic_type == 'function_logic' and segments:
            logger.info("---> SegmentPlacer: Detecting function_logic, using diverse patterns")
            
            # Calculate available slots (excluding start, end, corners)
            total_path_len = sum(len(seg) for seg in segments)
            # Remove overlapping corner and start/end
            available_slots = total_path_len - len(segments) - 1  # subtract corners + start + end
            available_slots = max(available_slots, len(segments) * 2)  # at least 2 slots per segment
            
            # [FIX] Calculate items based on valid range with spacing of 1
            # For function_logic, we want items that can form reusable patterns
            # Valid range = seg_len - 2 (excluding start/corner and end/corner)
            # With spacing of 1 between items: max_items = (valid_range + 1) // 2
            # E.g., leg=5: valid=[1,2,3], max_items = (3+1)//2 = 2 (positions 1 and 3)
            min_seg_len = min(len(seg) for seg in segments)
            valid_range = min_seg_len - 2  # e.g., 5-2=3
            max_items_per_seg = max(1, (valid_range + 1) // 2)  # With spacing of 1
            
            # Use smart quantity logic with segment-aware overrides
            quantity_mode = params.get('quantity_mode', 'auto')  # Default to auto for function_logic
            
            if quantity_mode in ('auto', 'ratio'):
                # For function_logic, calculate based on segments
                # Default: 1-2 items per segment based on space
                items_per_segment = max(1, min(max_items_per_seg, 3))  # Cap at 3 per segment
                total_items = len(segments) * items_per_segment
                
                # Get item types from items_to_place
                items_to_place = params.get('items_to_place', ['switch'])
                if isinstance(items_to_place, list) and items_to_place:
                    item_type = items_to_place[0] if isinstance(items_to_place[0], str) else 'switch'
                else:
                    item_type = 'switch'
                items_to_place_list = [item_type] * total_items
                
                logger.info(f"SegmentPlacer: Smart quantity calculated {total_items} items ({items_per_segment}/segment, mode={quantity_mode})")
            else:
                # Legacy: explicit mode
                item_counts = self._get_item_counts(params)
                
                def safe_int(val):
                    if isinstance(val, int):
                        return val
                    if isinstance(val, str):
                        if val.lower() == 'all':
                            return len(segments) * 2  # 2 items per segment when 'all'
                        try:
                            return int(val)
                        except ValueError:
                            return 0
                    return 0
                
                total_items = sum(safe_int(c) for t, c in item_counts.items() if t != 'obstacle')
                
                # Fallback nếu không có item counts
                if total_items == 0:
                    total_items = safe_int(params.get('item_count', len(segments) * 2))
            
            logger.info(f"SegmentPlacer: Placing {total_items} items across {len(segments)} segments")
            
            # Gọi function pattern placement
            generated_items = self._place_for_function_logic(segments, corners, total_items, params)
            
            if not generated_items:
                logger.warning("SegmentPlacer: No valid function pattern, falling back to legacy")
            else:
                # Assign item types từ pool
                if quantity_mode in ('auto', 'ratio'):
                    # Use the resolved list directly
                    types_pool = items_to_place_list if items_to_place_list else ['switch'] * total_items
                else:
                    # Legacy: build from item_counts
                    def safe_int(val):
                        if isinstance(val, int):
                            return val
                        if isinstance(val, str):
                            try:
                                return int(val)
                            except ValueError:
                                return 0
                        return 0
                    
                    types_pool = []
                    for t, c in item_counts.items():
                        if t != 'obstacle':
                            count = safe_int(c)
                            types_pool.extend([t] * count)
                
                for i, g_item in enumerate(generated_items):
                    pos = g_item['pos']
                    if pos in used_coords:
                        continue
                    if pos == path_info.start_pos or pos == path_info.target_pos:
                        continue
                    
                    # Determine item type
                    if types_pool:
                        item_type = types_pool[i % len(types_pool)]
                    else:
                        item_type = 'switch'
                    
                    items.append({"type": item_type, "pos": pos})
                    used_coords.add(pos)
                
                # Đặt obstacles nếu có
                if quantity_mode in ('auto', 'ratio'):
                    obstacle_count = 0  # No obstacles in auto mode for function_logic
                else:
                    obstacle_count = item_counts.get('obstacle', 0)
                
                all_coords = [coord for seg in segments for coord in seg] + corners
                obstacles = self._place_obstacles(path_info, all_coords, used_coords, obstacle_count)
                
                logger.info(f"--> SegmentPlacer: Placed {len(items)} items with function pattern")
                return self._base_layout(path_info, items, obstacles)
        
        # ==================================================================
        # [LEGACY] Mode: Interval on Segment (Systemic Fix)
        # ==================================================================
        if placement_pattern == 'interval_on_segment':
            # Lấy số lượng item mong muốn trên mỗi cạnh (hoặc tổng rồi chia)
            # Giả sử item_count là tổng -> chia cho số segments
            total_items_counter = self._get_item_counts(params)
            total_items = total_items_counter.get('crystal', 0)

            # [LEGACY FALLBACK]
            if total_items == 0 and params.get('item_count'):
                 total_items = int(params.get('item_count'))
                 logger.info(f"SegmentPlacer: Using legacy item_count={total_items}")

            if total_items > 0 and segments:
                count_per_segment = max(1, total_items // len(segments))
                # Logic: Nếu user muốn rải đều, thường họ muốn cả corners
                include_corners = params.get('include_corners', True)
                
                generated_items = self._place_interval_on_segments(segments, count_per_segment, include_corners)
                
                # Assign type và add
                # (Hiện tại assume crystal, có thể mở rộng logic type)
                original_item_counts = self._get_item_counts(params)
                types_pool = []
                for t, c in original_item_counts.items():
                    if t != 'obstacle': types_pool.extend([t]*c)
                
                # Nếu pool ít hơn generated, lặp lại (hoặc random type từ pool)
                import random
                
                for i, g_item in enumerate(generated_items):
                    pos = g_item['pos']
                    if pos in used_coords: continue
                    if pos == path_info.start_pos or pos == path_info.target_pos: continue
                    
                    if types_pool:
                        if i < len(types_pool):
                            item_type = types_pool[i]
                        else:
                            item_type = types_pool[-1] # Hết pool thì dùng cái cuối hoặc random
                    else:
                        item_type = 'crystal'
                        
                    items.append({"type": item_type, "pos": pos})
                    used_coords.add(pos)

            item_counts = self._get_item_counts(params)
            obstacles = self._place_obstacles(path_info, self._get_coords(path_info), used_coords, item_counts.get('obstacle', 0))
            return self._base_layout(path_info, items, obstacles)

        # ... (Giữ code cũ làm fallback hoặc mode khác) ...
        # logic cũ: place_on_corners, place_on_segments (random middle)
        elif placement_pattern == 'corners_only':
            # ... existing logic ...
            pass
        else:
            # Default behavior (Corner + Random Middle)
            # ... existing logic ...
            pass
            
        # [FIX] Tạm thời return luôn để test logic mới, 
        # Cần merge khéo léo với code cũ nếu muốn giữ tương thích ngược hoàn toàn.
        # Ở đây tôi replace logic cũ nếu pattern match, nếu không match thì chạy code cũ.
        # Legacy logic continuation (removed for brevity in this Snippet, 
        # but in real file I should keep it accessible or wrap it).
        # Since I am using replace_file_content on the class, I need to be careful not to delete existing methods 
        # unless I intend to rewrite them. 
        # The prompt implies I am editing.
        # Let's inspect the file content again to be sure where to insert.
        return self._legacy_place_items(path_info, params, segments, corners, used_coords, items)

    def _legacy_place_items(self, path_info: PathInfo, params: dict, segments: List[List[Coord]], corners: List[Coord], used_coords: Set[Coord], items: List[Dict]) -> Dict[str, Any]:
        # This method contains the original logic of place_items before the new interval_on_segment logic was added.
        # It's called if the new 'interval_on_segment' pattern is not used.
        self.path_info = path_info # Cần thiết để các hàm từ BasePlacer hoạt động
        challenge_type = params.get('challenge_type', 'SIMPLE_APPLY')
        
        # items và used_coords được truyền vào từ place_items mới, có thể đã có item từ interval_on_segment
        # Nếu không, chúng sẽ rỗng.

        # 1. Lấy thông tin cấu trúc từ metadata
        # segments và corners đã được lấy ở place_items mới và truyền vào đây.
        
        if not segments and not corners:
            logger.warning(f"Cảnh báo: Segment Placer không tìm thấy 'segments' hoặc 'corners' cho map '{params.get('map_type')}'.")
            return self._base_layout(path_info, [], path_info.obstacles)
            
        # 2. Xử lý logic đặt item dựa trên challenge_type
        logger.info(f"-> SegmentPlacer: Áp dụng kịch bản '{challenge_type}'")

        if challenge_type == 'REFACTOR':
            # Đặt item trên TẤT CẢ các segment/corner để tạo ra một giải pháp dài dòng,
            # buộc người chơi phải trừu tượng hóa hành động "xử lý một đoạn".
            self._place_on_all_segments(items, used_coords, segments, corners, params)
        
        elif challenge_type == 'DEBUG_FIX_LOGIC':
            # Cố tình đặt sai vị trí trên segment (ví dụ: đáng lẽ đặt ở cuối thì lại đặt ở đầu)
            # để tạo ra lỗi logic trong hàm của người chơi.
            buggy_params = params.copy()
            placement_pattern = buggy_params.get('placement_pattern', 'end_of_segment')
            if placement_pattern == 'end_of_segment':
                 buggy_params['placement_pattern'] = 'start_of_segment'
                 logger.info(f"  -> DEBUG: Đảo ngược placement_pattern từ 'end' sang 'start'.")
            self._place_on_segments(items, used_coords, segments, corners, buggy_params)

        else: # Mặc định là SIMPLE_APPLY / COMPLEX_APPLY
            # Đặt item theo các quy tắc trong params
            self._place_on_segments(items, used_coords, segments, corners, params)

        # 3. Đặt các obstacles phụ (nếu có) bằng hàm từ BasePlacer
        item_counts = self._get_item_counts(params)
        obstacle_count = item_counts.get('obstacle', 0)
        all_coords = [coord for seg in segments for coord in seg] + corners
        obstacles = self._place_obstacles(path_info, all_coords, used_coords, obstacle_count)

        # 4. Đóng gói và trả về layout hoàn chỉnh bằng hàm từ BasePlacer
        return self._base_layout(path_info, items, obstacles)

    def _place_on_all_segments(self, items: List[Dict], used_coords: Set[Coord], segments: List[List[Coord]], corners: List[Coord], params: dict):
        """Hàm này đặt item trên mọi segment/corner, dùng cho REFACTOR."""
        item_types = params.get('items_to_place', ['crystal'])
        item_type_index = 0
        
        # Đặt trên các góc trước
        for pos in corners:
            if pos not in used_coords:
                item_type = item_types[item_type_index % len(item_types)]
                items.append({"type": item_type, "pos": pos})
                used_coords.add(pos)
                item_type_index += 1
        
        # Đặt ở giữa mỗi segment
        for segment in segments:
            if segment:
                pos = segment[len(segment) // 2]
                if pos not in used_coords:
                    item_type = item_types[item_type_index % len(item_types)]
                    items.append({"type": item_type, "pos": pos})
                    used_coords.add(pos)
                    item_type_index += 1

    def _place_on_segments(self, items: List[Dict], used_coords: Set[Coord], segments: List[List[Coord]], corners: List[Coord], params: dict):
        """Hàm này đặt item theo các quy tắc trong params, dùng cho APPLY và DEBUG."""
        item_types = params.get('items_to_place', ['crystal'])
        placement_pattern = params.get('placement_pattern', 'middle_of_segment')
        item_type_index = 0

        target_coords = []
        if placement_pattern == 'at_corners' and corners:
            target_coords = corners
        elif segments:
            for seg in segments:
                if not seg: continue
                if placement_pattern in ['on_each_step', 'middle_of_segment']:
                    target_coords.append(seg[len(seg) // 2])
                elif placement_pattern in ['end_of_segment', 'at_each_turn']:
                    target_coords.append(seg[-1])
                elif placement_pattern == 'start_of_segment':
                    target_coords.append(seg[0])
                else: # Ngẫu nhiên
                    target_coords.append(random.choice(seg))
        
        for pos in target_coords:
            if pos not in used_coords:
                item_type = item_types[item_type_index % len(item_types)]
                items.append({"type": item_type, "pos": pos})
                used_coords.add(pos)
                item_type_index += 1

# Tạo một instance để FunctionPlacer có thể import và sử dụng
segment_placer_strategy = SegmentPlacerStrategy()