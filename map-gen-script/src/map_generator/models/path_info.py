# src/map_generator/models/path_info.py

from dataclasses import dataclass, field
from typing import List, Tuple, Dict, Any

# --- Định nghĩa các kiểu dữ liệu tùy chỉnh (Type Aliases) ---
Coord = Tuple[int, int, int]
Obstacle = Dict[str, Any]


@dataclass
class PathInfo:
    """
    Một lớp dữ liệu để chứa thông tin cấu trúc "thô" của một bản đồ
    được tạo ra bởi một chiến lược Topology.

    Nó đóng vai trò là một "bản thiết kế" chuẩn để truyền dữ liệu 
    giữa các lớp Topology (Kiến trúc sư) và các lớp Placer (Người trang trí).
    """
    
    # === THÔNG TIN CỐT LÕI ===
    start_pos: Coord
    target_pos: Coord
    
    # === THÔNG TIN VỊ TRÍ ===
    
    # Một danh sách các tọa độ tạo nên con đường chính từ start đến target.
    # Thường được sử dụng để tính toán logic di chuyển hoặc kiểm tra.
    path_coords: List[Coord] = field(default_factory=list)
    
    # (QUAN TRỌNG) Một danh sách tất cả các tọa độ có thể đi được và đặt đối tượng.
    # Nếu rỗng, Placer sẽ mặc định sử dụng path_coords.
    # Bao gồm cả path_coords và các nhánh phụ (nếu có).
    placement_coords: List[Coord] = field(default_factory=list)
    
    # === THÔNG TIN VẬT THỂ BAN ĐẦU ===

    # Một số Topology (ví dụ: staircase, complex_maze) có thể tạo ra chướng ngại vật
    # (bậc thang, tường) như một phần của cấu trúc.
    obstacles: List[Obstacle] = field(default_factory=list)

    # === [NÂNG CẤP] THÔNG TIN CẤU TRÚC PHỨC TẠP ===

    # Một dictionary "tất cả trong một" để chứa thông tin cấu trúc phụ.
    # Điều này giúp PathInfo linh hoạt và không cần thêm trường mới liên tục.
    #
    # QUY ƯỚC VỀ CÁC KEY:
    # - 'islands': List[List[Coord]] -> Cho các map dạng đảo.
    # - 'branches': List[List[Coord]] -> Cho các map dạng nhánh.
    # - 'segments': List[List[Coord]] -> Cho các map dạng đoạn.
    # - 'corners': List[Coord] -> Cho các map có góc cua rõ ràng.
    # - 'platforms': List[List[Coord]] -> Cho các map 3D đa tầng.
    #
    metadata: Dict[str, Any] = field(default_factory=dict)


    def __post_init__(self):
        """
        Phương thức kiểm tra tính hợp lệ của dữ liệu sau khi đối tượng được tạo.
        """
        if not isinstance(self.start_pos, tuple) or len(self.start_pos) != 3:
            raise TypeError("start_pos phải là một tuple (x, y, z)")
        if not isinstance(self.target_pos, tuple) or len(self.target_pos) != 3:
            raise TypeError("target_pos phải là một tuple (x, y, z)")
        
        # [NÂNG CẤP] Đảm bảo placement_coords luôn có dữ liệu nếu path_coords có
        if not self.placement_coords and self.path_coords:
            self.placement_coords = self.path_coords

    def get_path_length(self) -> int:
        """Phương thức tiện ích để tính chiều dài của đường đi chính."""
        return len(self.path_coords)