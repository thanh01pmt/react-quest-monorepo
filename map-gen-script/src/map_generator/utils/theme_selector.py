# src/map_generator/utils/theme_selector.py

import random
import logging

# [MỚI] Dữ liệu theme được chuyển về đây để tập trung hóa
GAME_WORLD_DATA = {
    "WALKABLE_GROUNDS": [
        'ground.checker', 'ground.earth', 'ground.earthChecker', 'ground.mud', 'ground.normal', 'ground.snow',
        'stone.stone01', 'stone.stone02', 'stone.stone03', 'stone.stone04', 'stone.stone05', 'stone.stone06', 'stone.stone07', 'ice.ice01'
    ],
    "JUMPABLE_OBSTACLES": [
        'wall.brick01', 'wall.brick02', 'wall.brick03', 'wall.brick04', 'wall.brick05', 'wall.brick06',
        'stone.stone01', 'stone.stone02', 'stone.stone03', 'stone.stone04', 'stone.stone05', 'stone.stone06', 'stone.stone07'
    ],
    "UNJUMPABLE_OBSTACLES": [
        'wall.stone01', 'lava.lava01', 'water.water01'
    ],
    "DEADLY_OBSTACLES": [
        'lava.lava01'
    ]
}

# [NEW] Configuration for theme reuse
MAX_THEME_REUSE = 2  # Maximum times a theme can be reused before warning

def get_new_theme_for_map(map_type: str, used_themes: set, theme_reuse_count: dict = None) -> dict:
    """
    [ENHANCED] Chọn một theme mới chưa được sử dụng, với fallback và logging.
    
    Args:
        map_type: Loại map để xác định constraints
        used_themes: Set các theme đã dùng (ground, obstacle) tuples
        theme_reuse_count: Optional dict để track số lần reuse mỗi theme
    
    Returns:
        dict: {"ground": str, "obstacle": str, "is_reused": bool}
    """
    # [REWRITTEN] Logic chọn theme được viết lại hoàn toàn để tăng độ đa dạng.
    
    # 1. Xác định loại vật cản phù hợp
    # Các map mê cung phức tạp nên có tường chắn không thể nhảy qua.
    is_wall_map = map_type in ['complex_maze_2d']
    if is_wall_map:
        valid_obstacles = GAME_WORLD_DATA["UNJUMPABLE_OBSTACLES"]
    else:
        # Các map khác sử dụng vật cản có thể nhảy qua.
        # [CẢI TIẾN] Gộp cả JUMPABLE_OBSTACLES và WALKABLE_GROUNDS để tăng sự đa dạng.
        valid_obstacles = list(set(GAME_WORLD_DATA["JUMPABLE_OBSTACLES"] + GAME_WORLD_DATA["WALKABLE_GROUNDS"]))

    # 2. Xác định loại nền đất phù hợp
    # Nền đất có thể là bất kỳ khối nào đi được.
    valid_grounds = list(set(GAME_WORLD_DATA["WALKABLE_GROUNDS"] + GAME_WORLD_DATA["JUMPABLE_OBSTACLES"]))

    # 3. Loại bỏ các khối nguy hiểm
    deadly = set(GAME_WORLD_DATA["DEADLY_OBSTACLES"])
    valid_obstacles = [obs for obs in valid_obstacles if obs not in deadly]
    valid_grounds = [g for g in valid_grounds if g not in deadly]

    # 4. Tạo các tổ hợp theme có thể có
    # Đảm bảo ground và obstacle không giống nhau và chưa được sử dụng.
    possible_themes = [(g, o) for g in valid_grounds for o in valid_obstacles if g != o and (g, o) not in used_themes]
    
    is_reused = False
    if not possible_themes:
        # [FIX Issue #2] Fallback: cho phép dùng lại theme với warning
        logging.warning(f"Theme pool exhausted for map_type='{map_type}'. Reusing previously used theme.")
        possible_themes = [(g, o) for g in valid_grounds for o in valid_obstacles if g != o]
        is_reused = True
        
        # [NEW] Track reuse count nếu được cung cấp
        if theme_reuse_count is not None:
            # Sort by reuse count, prefer less reused themes
            possible_themes = sorted(
                possible_themes, 
                key=lambda t: theme_reuse_count.get(t, 0)
            )
            # Limit to themes under MAX_THEME_REUSE
            under_limit = [t for t in possible_themes if theme_reuse_count.get(t, 0) < MAX_THEME_REUSE]
            if under_limit:
                possible_themes = under_limit
            else:
                logging.warning(f"All themes have been reused {MAX_THEME_REUSE}+ times. Proceeding anyway.")

    new_ground, new_obstacle = random.choice(possible_themes)
    
    # Update reuse count if tracking
    if theme_reuse_count is not None:
        key = (new_ground, new_obstacle)
        theme_reuse_count[key] = theme_reuse_count.get(key, 0) + 1
    
    return {"ground": new_ground, "obstacle": new_obstacle, "is_reused": is_reused}