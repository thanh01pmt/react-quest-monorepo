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