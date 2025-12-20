# src/map_generator/topologies/base_topology.py

# 'abc' là viết tắt của Abstract Base Classes (Lớp cơ sở trừu tượng).
# Chúng ta dùng nó để tạo ra các "lớp khuôn mẫu" hay "interfaces".
from abc import ABC, abstractmethod
from typing import List, Iterator
# Import lớp PathInfo để sử dụng trong type hinting, đảm bảo tính nhất quán.
# Điều này giúp các công cụ lập trình hiểu rõ kiểu dữ liệu trả về.
from src.map_generator.models.path_info import PathInfo

class BaseTopology(ABC):
    """
    Lớp cơ sở trừu tượng (Interface) cho tất cả các chiến lược tạo hình dạng map.
    
    Mỗi lớp con kế thừa từ BaseTopology BẮT BUỘC phải hiện thực hóa
    phương thức generate_path_info(). Nếu không, Python sẽ báo lỗi khi
    khởi tạo đối tượng của lớp con đó.
    """
    
    @abstractmethod
    def generate_path_info(self, grid_size: tuple, params: dict) -> PathInfo:
        """
        Phương thức cốt lõi để tạo ra thông tin đường đi thô (chưa có logic game).

        Args:
            grid_size (tuple): Kích thước của lưới game (ví dụ: (10, 10, 10)).
            params (dict): Một dictionary chứa các tham số bổ sung để tùy chỉnh
                           việc sinh map (ví dụ: {'num_items': 5, 'difficulty': 'hard'}).

        Returns:
            PathInfo: Một đối tượng PathInfo chứa dữ liệu đường đi đã được sinh ra,
                      bao gồm vị trí bắt đầu, đích, và các tọa độ trên đường đi.
        """
        # Phương thức này không có code bên trong. 
        # Nó chỉ định nghĩa "chữ ký" (tên, tham số, kiểu trả về)
        # mà các lớp con phải tuân theo.
        pass

    @abstractmethod
    def generate_path_info_variants(self, grid_size: tuple, params: dict, max_variants: int) -> Iterator[PathInfo]:
        """
        [KIẾN TRÚC MỚI] Tạo ra một chuỗi các biến thể cấu trúc (PathInfo).

        Thay vì trả về một PathInfo duy nhất, phương thức này trả về một
        iterator, cho phép sinh ra nhiều biến thể về kích thước hoặc hình dạng
        một cách hiệu quả.

        Args:
            grid_size (tuple): Kích thước của lưới game.
            params (dict): Các tham số gốc từ curriculum.
            max_variants (int): Số lượng biến thể tối đa cần tạo.

        Yields:
            Iterator[PathInfo]: Lần lượt trả về các đối tượng PathInfo biến thể.
        """
        pass

    def _manhattan_distance_3d(self, p1: tuple, p2: tuple) -> int:
        """Calculate 3D Manhattan distance between two points."""
        return abs(p1[0] - p2[0]) + abs(p1[1] - p2[1]) + abs(p1[2] - p2[2])

    def _get_farthest_endpoints(self, endpoints: List[tuple]) -> tuple:
        """
        Find two endpoints with maximum Manhattan distance.
        
        Args:
            endpoints: List of coordinate tuples
            
        Returns:
            (endpoint1, endpoint2) with max distance
        """
        if len(endpoints) < 2:
            return (endpoints[0], endpoints[0]) if endpoints else ((0,0,0), (0,0,0))
        
        max_dist = 0
        best_pair = (endpoints[0], endpoints[1])
        
        for i in range(len(endpoints)):
            for j in range(i+1, len(endpoints)):
                dist = self._manhattan_distance_3d(endpoints[i], endpoints[j])
                if dist > max_dist:
                    max_dist = dist
                    best_pair = (endpoints[i], endpoints[j])
        
        return best_pair

    def _get_start_end_positions(self, metadata: dict, all_endpoints: List[tuple]) -> tuple:
        """
        Get optimal start/end from semantic positions or fallback to farthest.
        
        Args:
            metadata: Topology metadata containing semantic_positions dict
            all_endpoints: List of all valid endpoint coordinates
            
        Returns:
            (start_pos, end_pos) tuple
        """
        semantic = metadata.get('semantic_positions', {})
        
        # Try to use semantic positions
        if 'optimal_start' in semantic and 'optimal_end' in semantic:
            start_key = semantic['optimal_start']
            end_key = semantic['optimal_end']
            
            if start_key and end_key and start_key in semantic and end_key in semantic:
                return semantic[start_key], semantic[end_key]
        
        # Fallback: use farthest endpoints
        return self._get_farthest_endpoints(all_endpoints)