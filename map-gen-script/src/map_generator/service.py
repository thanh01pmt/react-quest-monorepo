# src/map_generator/service.py
"""
MAP GENERATOR SERVICE - PHIÊN BẢN TÁI CẤU TRÚC TOÀN DIỆN

- [NÂNG CẤP] Dọn dẹp và tinh gọn danh sách Placements để phản ánh kiến trúc mới.
- [NÂNG CẤP] Chuẩn hóa tên `logic_type` cho nhất quán và dễ sử dụng.
- [NÂNG CẤP] Thêm phương thức `generate_map_variants` để hỗ trợ quy trình sinh biến thể mới.
- Đăng ký đầy đủ tất cả Topologies và các Placer chính đã được nâng cấp.

CẬP NHẬT (12/12/2025):
- [FIX] Sửa lỗi trong `generate_map_variants` để đảm bảo mỗi biến thể cấu trúc
  (path_info) nhận được một `asset_theme` ngẫu nhiên và duy nhất trước khi được
  chuyển đến Placer.
"""

# Import các Models và Topologies (không thay đổi nhiều)
from .models.map_data import MapData
from .models.path_info import PathInfo
from .topologies import (
    SimplePathTopology, StraightLineTopology, StaircaseTopology, SquareTopology,
    PlowingFieldTopology, GridTopology, SymmetricalIslandsTopology, SpiralTopology,
    InterspersedPathTopology, GridWithHolesTopology, ComplexMazeTopology,
    HubWithSteppedIslandsTopology, SteppedIslandClustersTopology, PlusShapeIslandsTopology,
    LShapeTopology, UShapeTopology, SShapeTopology, ZigzagTopology, HShapeTopology,
    EFShapeTopology, PlusShapeTopology, ArrowShapeTopology, TShapeTopology,
    VShapeTopology, StarShapeTopology, ZShapeTopology, Staircase3DTopology,
    Spiral3DTopology, SwiftPlaygroundMazeTopology, TriangleTopology
)

# [NÂNG CẤP] Chỉ import các Placer chính, đã được tái cấu trúc.
from .placements.command_obstacle_placer import CommandObstaclePlacer
from .placements.for_loop_placer import ForLoopPlacer
from .placements.function_placer import FunctionPlacer
from .placements.variable_placer import VariablePlacer
from .placements.while_if_placer import WhileIfPlacer
from .placements.algorithm_placer import AlgorithmPlacer
# [REMOVED] PathSearchingPlacer deprecated - use PathSearchingSwiftPlacer instead
from .placements.path_searching_swift_placer import PathSearchingSwiftPlacer
# Các Placer đặc biệt cho map_type cụ thể vẫn có thể giữ lại nếu cần
from .placements.swift_playground_placer import SwiftPlaygroundPlacer
from typing import Iterator, Optional # [MỚI] Import Iterator để type hint cho generator
import logging # [MỚI] Import logging
import copy # [MỚI] Import copy để tạo bản sao sâu
import random # [MỚI] Import random

from src.map_generator.utils.theme_selector import get_new_theme_for_map # [FIX] Sử dụng import tuyệt đối để tránh lỗi ModuleNotFound
from src.map_generator.constraints import VariationConstraints, ConstraintValidator, DIFFICULTY_PRESETS  # [NEW] Import constraints
from src.map_generator.validation import PreSolveValidator, quick_solvability_check, ValidationResult  # [NEW] Import validation

class MapGeneratorService:
    def __init__(self):
        print("⚙️  Khởi tạo MapGeneratorService (Phiên bản Tái cấu trúc)...")
        
        # Danh sách Topologies không thay đổi
        self.topologies = {
            'simple_path': SimplePathTopology(), 'straight_line': StraightLineTopology(),
            'staircase': StaircaseTopology(), 'square_shape': SquareTopology(),
            'plowing_field': PlowingFieldTopology(), 'grid': GridTopology(),
            'symmetrical_islands': SymmetricalIslandsTopology(), 'spiral_path': SpiralTopology(),
            'interspersed_path': InterspersedPathTopology(), 'grid_with_holes': GridWithHolesTopology(),
            'complex_maze_2d': ComplexMazeTopology(), 'hub_with_stepped_islands': HubWithSteppedIslandsTopology(),
            'stepped_island_clusters': SteppedIslandClustersTopology(), 'plus_shape_islands': PlusShapeIslandsTopology(),
            'l_shape': LShapeTopology(), 'u_shape': UShapeTopology(), 's_shape': SShapeTopology(),
            'zigzag': ZigzagTopology(), 'h_shape': HShapeTopology(), 'ef_shape': EFShapeTopology(),
            'plus_shape': PlusShapeTopology(), 'arrow_shape': ArrowShapeTopology(),
            't_shape': TShapeTopology(), 'v_shape': VShapeTopology(), 'star_shape': StarShapeTopology(),
            'z_shape': ZShapeTopology(), 'staircase_3d': Staircase3DTopology(),
            'spiral_3d': Spiral3DTopology(), 'triangle': TriangleTopology(),
            'swift_playground_maze': SwiftPlaygroundMazeTopology(),
        }

        # [NÂNG CẤP] Tái cấu trúc hoàn toàn danh sách Placements
        self.placements = {
            # Placer mặc định cho các bài tập di chuyển cơ bản (Topic 1)
            'command_obstacle': CommandObstaclePlacer(),

            # Placer chuyên dụng cho các bài tập về Hàm và Tham số (Topic 2, 9)
            'function_logic': FunctionPlacer(),

            # Placer chuyên dụng cho các bài tập về Vòng lặp For (Topic 3)
            'for_loop_logic': ForLoopPlacer(),

            # Placer chuyên dụng cho các bài tập về Biến số (Topic 4)
            'variable_logic': VariablePlacer(),

            # "Siêu Placer" cho các bài tập về Logic có điều kiện (Topic 5, 6, 7)
            'conditional_logic': WhileIfPlacer(),

            # Placer chuyên dụng cho các bài tập về Thuật toán (Topic 8)
            'algorithm_logic': AlgorithmPlacer(),

            # [MỚI] Placer tìm kiếm một đoạn thẳng trong một path có sẵn
            'path_searching': PathSearchingSwiftPlacer(),  # [FIX] Use updated placer

            # [MỚI] Placer tìm kiếm đường thẳng, nhưng an toàn cho swift_playground_maze
            'path_searching_swift': PathSearchingSwiftPlacer(),

            # Các Placer đặc biệt, gắn liền với một map_type duy nhất
            'swift_playground_maze': SwiftPlaygroundPlacer(),
        }
        
        # [NEW Issue #3] Fallback placer chains for smart selection
        self.fallback_placers = {
            'for_loop_logic': ['algorithm_logic', 'path_searching'],
            'function_logic': ['algorithm_logic', 'for_loop_logic'],
            'variable_logic': ['for_loop_logic', 'algorithm_logic'],
            'conditional_logic': ['algorithm_logic', 'for_loop_logic'],
            'algorithm_logic': ['for_loop_logic', 'command_obstacle'],
            'path_searching': ['path_searching_swift', 'for_loop_logic'],
        }
        
        print(f"👍 Đã đăng ký thành công {len(self.topologies)} topologies và {len(self.placements)} placements.")

    def _get_default_grid_size(self, map_type: str) -> tuple:
        """
        [NEW] Centralized grid size configuration.
        Đảm bảo cùng một map_type luôn sử dụng cùng grid size bất kể method nào được gọi.
        """
        GRID_SIZE_CONFIG = {
            'swift_playground_maze': (40, 40, 40),
            'complex_maze_2d': (35, 35, 35),
            'grid_with_holes': (35, 35, 35),
            'hub_with_stepped_islands': (35, 35, 35),
            'stepped_island_clusters': (35, 35, 35),
        }
        return GRID_SIZE_CONFIG.get(map_type, (30, 30, 30))

    def _select_placer(self, logic_type: str, map_type: str = None, params: dict = None):
        """
        [NEW Issue #3] Smart placer selection with fallback chain.
        
        Args:
            logic_type: Primary placer logic type
            map_type: Optional map type for compatibility check
            params: Optional params for compatibility check
            
        Returns:
            Selected placer instance
            
        Raises:
            ValueError if no compatible placer found
        """
        # Try primary placer first
        primary_placer = self.placements.get(logic_type)
        
        if primary_placer:
            # Check if placer supports the request (if it has supports method)
            if hasattr(primary_placer, 'supports'):
                if primary_placer.supports(map_type, params):
                    return primary_placer
                else:
                    logging.info(f"Primary placer '{logic_type}' does not support map_type='{map_type}'")
            else:
                # No supports method, assume compatible
                return primary_placer
        
        # Try fallback placers
        fallback_chain = self.fallback_placers.get(logic_type, [])
        for fallback_name in fallback_chain:
            fallback_placer = self.placements.get(fallback_name)
            if fallback_placer:
                if hasattr(fallback_placer, 'supports'):
                    if fallback_placer.supports(map_type, params):
                        logging.warning(f"Using fallback placer '{fallback_name}' for logic_type='{logic_type}'")
                        return fallback_placer
                else:
                    logging.warning(f"Using fallback placer '{fallback_name}' for logic_type='{logic_type}'")
                    return fallback_placer
        
        # No compatible placer found
        raise ValueError(
            f"No compatible placer for logic_type='{logic_type}', map_type='{map_type}'. "
            f"Tried: ['{logic_type}'] + {fallback_chain}"
        )

    def generate_map_variants(self, map_type: str, logic_type: str, params: dict, max_variants: int) -> Iterator[MapData]:
        """
        [KIẾN TRÚC MỚI] Quy trình sinh map biến thể theo 2 giai đoạn.
        Đây là một generator, nó sẽ `yield` các đối tượng MapData hoàn chỉnh.
        """
        logging.info(f"\n--- Bắt đầu sinh BIẾN THỂ cho: [Topology: '{map_type}', Placer: '{logic_type}'] ---")

        # Giai đoạn 0: Lấy các chiến lược và cấu hình
        topology_strategy = self.topologies.get(map_type)
        placement_strategy = self.placements.get(logic_type)
        if not topology_strategy or not placement_strategy:
            raise ValueError(f"Không tìm thấy Topology '{map_type}' hoặc Placer '{logic_type}'.")

        grid_size = self._get_default_grid_size(map_type)  # [FIX] Centralized grid size
        variants_generated_count = 0

        # [FIX] Khởi tạo bộ theo dõi theme đã sử dụng cho toàn bộ quá trình sinh biến thể này.
        used_themes_for_challenge = set()

        # Giai đoạn 1: Topology tạo ra các biến thể về cấu trúc (PathInfo)
        # `generate_path_info_variants` trả về một iterator.
        path_info_iterator = topology_strategy.generate_path_info_variants(grid_size, params, max_variants)

        # [REFACTOR] Sử dụng một vòng lặp duy nhất để kéo các biến thể từ cả hai tầng (topology và placer)
        # Điều này đảm bảo logic gán theme và đếm biến thể được áp dụng một cách nhất quán.
        while variants_generated_count < max_variants:
            try:
                # Giai đoạn 1: Lấy một biến thể cấu trúc từ Topology
                path_info_variant = next(path_info_iterator)

                # [FIX] Với mỗi biến thể cấu trúc, tạo một bản sao params và gán theme mới.
                # Điều này đảm bảo mỗi biến thể có một theme riêng.
                variant_params = copy.deepcopy(params)
                new_theme = get_new_theme_for_map(map_type, used_themes_for_challenge)
                variant_params['asset_theme'] = new_theme
                
                # [FIX] Inject map_type và logic_type để placer route đúng strategy
                variant_params['map_type'] = map_type
                variant_params['logic_type'] = logic_type
                
                used_themes_for_challenge.add((new_theme.get("ground"), new_theme.get("obstacle")))
                logging.info(f"    -> Đã áp dụng theme mới cho biến thể cấu trúc: {new_theme['ground']} / {new_theme['obstacle']}")

                logging.info(f"    -> Đã nhận biến thể cấu trúc (PathInfo) từ '{map_type}'. Bắt đầu tạo các biến thể layout...")

                # Giai đoạn 2: Với mỗi cấu trúc, Placer tạo ra các biến thể về layout (vật phẩm/chướng ngại vật)
                # `place_item_variants` cũng trả về một iterator.
                layout_iterator = placement_strategy.place_item_variants(path_info_variant, variant_params, max_variants)
                
                # Lấy một biến thể layout từ Placer
                layout_variant = next(layout_iterator)
                
                if variants_generated_count >= max_variants:
                    return

                # Giai đoạn 3: Kết hợp cấu trúc và layout để tạo MapData hoàn chỉnh
                map_data = MapData(
                    grid_size=grid_size,
                    start_pos=layout_variant.get('start_pos'),
                    target_pos=layout_variant.get('target_pos'),
                    items=layout_variant.get('items', []),
                    obstacles=layout_variant.get('obstacles', []),
                    placement_coords=path_info_variant.placement_coords,
                    map_type=map_type,
                    logic_type=logic_type, # Giữ nguyên logic_type
                    params=variant_params, # [FIX] Sử dụng params đã được gán theme
                    path_coords=path_info_variant.path_coords,
                    branch_coords=path_info_variant.metadata.get('branches', [])
                )
                yield map_data
                variants_generated_count += 1
            
            except StopIteration:
                # Khi một trong hai iterator (path_info_iterator hoặc layout_iterator) hết biến thể,
                # vòng lặp sẽ dừng lại một cách tự nhiên.
                logging.info("--- Đã hết các biến thể có thể tạo. Dừng quy trình sinh biến thể. ---")
                break

    def generate_map(self, map_type: str, logic_type: str, params: dict, path_info_override: PathInfo = None) -> MapData:
        print(f"\n--- Bắt đầu sinh map: [Topology: '{map_type}', Placer: '{logic_type}'] ---")
        
        placement_strategy = self.placements.get(logic_type)
        if not placement_strategy:
            raise ValueError(f"Không tìm thấy Placer '{logic_type}'.")

        # [CẬP NHẬT] Tăng kích thước lưới mặc định để hỗ trợ các biến thể lớn hơn.
        grid_size = self._get_default_grid_size(map_type)  # [FIX] Centralized grid size
        print(f"    LOG: Đã cấp phát không gian lưới ({grid_size}) cho map '{map_type}'.")
        # [REFACTOR] Logic sinh PathInfo được tách ra để hỗ trợ kiến trúc mới
        if path_info_override:
            print("    LOG: Sử dụng PathInfo được cung cấp sẵn (từ quy trình sinh biến thể).")
            path_info = path_info_override
        else:
            print("    LOG: Sinh PathInfo mới (quy trình sinh map đơn lẻ).")
            topology_strategy = self.topologies.get(map_type)
            if not topology_strategy:
                raise ValueError(f"Không tìm thấy Topology '{map_type}'.")
            path_info: PathInfo = topology_strategy.generate_path_info(grid_size=grid_size, params=params.copy())

        # [FIX] Tạo một bản sao của params để truyền cho topology.
        # Điều này đảm bảo rằng `params` gốc, được truyền cho placer sau đó,
        # vẫn còn nguyên vẹn và chứa 'map_type'.
        topology_params = params.copy()
        # topology_params.pop('map_type', None) # [VÔ HIỆU HÓA] Dòng này gây lỗi vì xóa map_type quá sớm

        # [FIX] Inject map_type vào params để placer có thể route đúng strategy
        placer_params = params.copy()
        placer_params['map_type'] = map_type
        placer_params['logic_type'] = logic_type

        # Gọi Placer đã được chọn
        # [CẢI TIẾN] Truyền thêm grid_size vào placer để nó có thể đưa ra quyết định
        # dựa trên kích thước thực tế của map, thay vì phải giả định.
        # [SỬA LỖI] Một số placer cũ không nhận grid_size, cần kiểm tra.
        # Để đơn giản, ta sẽ truyền nó vào và các placer cũ sẽ bỏ qua.
        # Tuy nhiên, các placer mới trong kiến trúc này đều kế thừa BasePlacer và có thể nhận grid_size.
        # Để an toàn, ta sẽ truyền nó như một keyword argument.
        # [FIX] Pass params as second positional argument (matching signature),
        # then grid_size as keyword argument
        final_layout: dict = placement_strategy.place_items(path_info, placer_params, grid_size=grid_size)

        
        # Tạo đối tượng MapData cuối cùng
        map_data = MapData(
            grid_size=grid_size,
            start_pos=final_layout.get('start_pos'),
            target_pos=final_layout.get('target_pos'),
            items=final_layout.get('items', []),
            obstacles=final_layout.get('obstacles', []),
            path_coords=path_info.path_coords,
            params=params,
            placement_coords=path_info.placement_coords,
            map_type=map_type,
            logic_type=logic_type,
            branch_coords=path_info.metadata.get('branches', []) # [MỚI] Truyền thông tin nhánh
        )
        
        print(f"--- Hoàn thành sinh map: '{map_type}' ---")
        return map_data

    # =========================================================================
    # [NEW] CONSTRAINT-BASED GENERATION
    # =========================================================================
    
    def generate_constrained_variants(
        self,
        map_type: str,
        logic_type: str,
        params: dict,
        constraints: VariationConstraints,
        max_variants: int = 5,
        max_attempts: int = 50
    ) -> Iterator[MapData]:
        """
        [NEW] Generate map variants that satisfy constraints.
        
        Only yields maps that pass constraint validation.
        
        Args:
            map_type: Topology name
            logic_type: Placer logic type
            params: Generation parameters
            constraints: VariationConstraints to satisfy
            max_variants: Maximum valid maps to generate
            max_attempts: Maximum generation attempts before giving up
            
        Yields:
            MapData instances that satisfy constraints
        """
        logging.info(f"\n--- Constrained Generation: {map_type}/{logic_type} ---")
        logging.info(f"    Constraints: {constraints.to_dict()}")
        
        validator = ConstraintValidator()
        generated = 0
        attempts = 0
        
        # Use generate_map_variants as the base generator
        base_generator = self.generate_map_variants(map_type, logic_type, params, max_attempts)
        
        for map_data in base_generator:
            attempts += 1
            
            if attempts > max_attempts:
                logging.warning(
                    f"Stopped after {max_attempts} attempts. "
                    f"Generated {generated}/{max_variants} valid maps. "
                    f"Consider relaxing constraints."
                )
                break
            
            # Validate against constraints
            if validator.satisfies(map_data, constraints):
                generated += 1
                logging.info(f"    ✓ Valid map #{generated} (attempt {attempts})")
                yield map_data
                
                if generated >= max_variants:
                    break
            else:
                violations = validator.get_violations(map_data, constraints)
                logging.debug(f"    ✗ Rejected (attempt {attempts}): {violations[:2]}")
        
        logging.info(f"--- Constrained Generation Complete: {generated} valid maps ---")
    
    def generate_for_difficulty(
        self,
        map_type: str,
        logic_type: str,
        params: dict,
        difficulty: str = 'medium',
        max_variants: int = 5
    ) -> Iterator[MapData]:
        """
        [NEW] Convenience method to generate maps for a difficulty level.
        
        Args:
            map_type: Topology name
            logic_type: Placer logic type
            params: Generation parameters
            difficulty: 'easy', 'medium', 'hard', or 'expert'
            max_variants: Maximum maps to generate
            
        Yields:
            MapData instances matching difficulty constraints
        """
        if difficulty not in DIFFICULTY_PRESETS:
            available = ', '.join(DIFFICULTY_PRESETS.keys())
            raise ValueError(f"Unknown difficulty '{difficulty}'. Available: {available}")
        
        constraints = DIFFICULTY_PRESETS[difficulty]
        
        yield from self.generate_constrained_variants(
            map_type=map_type,
            logic_type=logic_type,
            params=params,
            constraints=constraints,
            max_variants=max_variants
        )

    # =========================================================================
    # [NEW] PRE-SOLVE VALIDATION METHODS
    # =========================================================================
    
    # Fallback chain for complex topologies
    TOPOLOGY_FALLBACKS = {
        'complex_maze_2d': ['grid_with_holes', 'grid', 'simple_path'],
        'swift_playground_maze': ['hub_with_stepped_islands', 'staircase_3d', 'staircase'],
        'hub_with_stepped_islands': ['staircase_3d', 'staircase'],
        'spiral_3d': ['spiral_path', 'simple_path'],
        'staircase_3d': ['staircase', 'simple_path'],
    }
    
    def generate_with_retry(
        self,
        map_type: str,
        logic_type: str,
        params: dict,
        toolbox_blocks: set = None,
        max_retries: int = 5,
        use_fallback: bool = True
    ) -> Optional['MapData']:
        """
        [NEW] Generate map with retry and validation.
        
        Attempts to generate a solvable map up to max_retries times.
        If all attempts fail and use_fallback=True, tries simpler topologies.
        
        Args:
            map_type: Topology name
            logic_type: Placer logic type
            params: Generation parameters
            toolbox_blocks: Available Blockly blocks (for validation)
            max_retries: Max attempts before giving up
            use_fallback: Try simpler topology on failure
            
        Returns:
            MapData if successful, None if all attempts fail
        """
        logging.info(f"\n--- Generate with Retry: {map_type}/{logic_type} ---")
        
        topologies_to_try = [map_type]
        if use_fallback and map_type in self.TOPOLOGY_FALLBACKS:
            topologies_to_try.extend(self.TOPOLOGY_FALLBACKS[map_type])
        
        for topo in topologies_to_try:
            if topo != map_type:
                logging.info(f"    Fallback to topology: {topo}")
            
            for attempt in range(max_retries):
                try:
                    map_data = self.generate_map(topo, logic_type, params)
                    
                    # Validate
                    result = quick_solvability_check(map_data, toolbox_blocks)
                    
                    if result.is_valid:
                        logging.info(f"    ✓ Valid map on attempt {attempt + 1}")
                        return map_data
                    else:
                        logging.debug(f"    ✗ Attempt {attempt + 1}: {result.reason}")
                        
                except Exception as e:
                    logging.debug(f"    ✗ Attempt {attempt + 1} error: {e}")
        
        logging.warning(f"    Failed after all attempts and fallbacks")
        return None
    
    def generate_validated_variants(
        self,
        map_type: str,
        logic_type: str,
        params: dict,
        toolbox_blocks: set = None,
        max_variants: int = 5,
        max_attempts_per_variant: int = 5
    ) -> Iterator['MapData']:
        """
        [NEW] Generate multiple validated map variants.
        
        Only yields maps that pass pre-solve validation.
        
        Args:
            map_type: Topology name
            logic_type: Placer logic type
            params: Generation parameters
            toolbox_blocks: Available Blockly blocks
            max_variants: Maximum valid maps to generate
            max_attempts_per_variant: Max attempts per variant
            
        Yields:
            MapData instances that pass validation
        """
        logging.info(f"\n--- Validated Variants: {map_type}/{logic_type} ---")
        
        validator = PreSolveValidator(toolbox_blocks)
        generated = 0
        total_attempts = 0
        max_total_attempts = max_variants * max_attempts_per_variant * 2
        
        while generated < max_variants and total_attempts < max_total_attempts:
            total_attempts += 1
            
            try:
                map_data = self.generate_map(map_type, logic_type, params)
                result = validator.validate(map_data)
                
                if result.is_valid:
                    generated += 1
                    logging.info(f"    ✓ Valid variant #{generated} (attempt {total_attempts})")
                    yield map_data
                else:
                    logging.debug(f"    ✗ Attempt {total_attempts}: {result.reason}")
                    
            except Exception as e:
                logging.debug(f"    ✗ Attempt {total_attempts} error: {e}")
        
        stats = validator.get_stats()
        logging.info(f"--- Validated Variants Complete ---")
        logging.info(f"    Generated: {generated}/{max_variants}")
        logging.info(f"    Success rate: {stats['valid_percentage']:.1f}%")