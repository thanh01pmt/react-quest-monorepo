Phân tích của bạn cực kỳ sắc sảo. Bạn đang chạm đến ngưỡng của **"Procedural Composite Generation"** (Tạo sinh Tổ hợp theo Quy trình).

Nếu cứ mỗi lần đổi hình dáng đảo (Square $\to$ Triangle) lại phải viết một class Topology mới (`PlusShapeTriangle`), thì code sẽ phình to mất kiểm soát (Combinatorial Explosion).

Giải pháp chiến lược là tách biệt **"Cấu trúc Sắp xếp" (Layout)** và **"Nội dung Hình dáng" (Content)**.

Dưới đây là kiến trúc **Module hóa & Tiêu chuẩn hóa** để giải quyết bài toán này:

---

### 1. Kiến trúc: Layout Engine + Modules

Chúng ta sẽ không viết `PlusShapeIslandsTopology` nữa. Chúng ta sẽ viết `RadialLayoutTopology` (Layout tỏa tròn).

Topo này nhận vào một tham số đầu vào là **`module_generator`**.

*   **Layout (Khung xương):** Quy định vị trí đặt, góc xoay, khoảng cách (ví dụ: 4 điểm cách tâm 5 mét, xoay 0, 90, 180, 270).
*   **Module (Thịt):** Quy định hình dáng cụ thể (Vuông, Tam giác, Mũi tên, Xoắn ốc).

### 2. Thiết kế Kỹ thuật (Python Implementation)

#### Bước A: Định nghĩa `BaseModule`
Module không chỉ sinh tọa độ, nó phải sinh ra **Local Metadata** (Metadata trong hệ quy chiếu cục bộ của nó).

```python
class BaseModule:
    def generate(self, params):
        # Trả về coords và local_landmarks (tại gốc tọa độ 0,0,0)
        pass

class ArrowHeadModule(BaseModule):
    def generate(self, size):
        # ... logic vẽ tam giác ...
        return {
            "coords": [...], # Tọa độ cục bộ
            "landmarks": {
                "entrance": (0, 0, 0),
                "tip": (0, 0, size),
                "wing_left": (-size, 0, 0)
            },
            "type": "arrow_head"
        }
```

#### Bước B: Định nghĩa `CompositeTopology` (Layout Engine)
Đây là bộ máy lắp ráp. Nhiệm vụ quan trọng nhất của nó là **Coordinate Transformation** (Biến đổi tọa độ): Nó phải xoay và dịch chuyển cả `coords` lẫn `landmarks` của Module.

```python
class RadialLayoutTopology(BaseTopology):
    def __init__(self, module_class):
        self.module_class = module_class

    def generate_path_info(self, grid_size, params):
        center = (12, 0, 12)
        radius = params.get('arm_length', 5)
        
        layout_metadata = {
            "type": "radial_composite",
            "components": []
        }
        all_coords = []

        # Logic Layout: 4 hướng
        directions = [0, 90, 180, 270] 
        
        for angle in directions:
            # 1. Instantiate Module
            module = self.module_class()
            local_data = module.generate(params)
            
            # 2. Transform Logic (Xoay + Dịch chuyển)
            # Tính vector dịch chuyển từ tâm ra bán kính R theo góc
            offset = self._calc_offset(angle, radius) 
            global_pos = add_vectors(center, offset)
            
            # Xoay và Dịch chuyển Coords
            transformed_coords = self._transform(local_data['coords'], angle, global_pos)
            all_coords.extend(transformed_coords)
            
            # 3. Transform Metadata (QUAN TRỌNG NHẤT)
            # Biến 'tip' cục bộ thành 'tip' toàn cục
            global_landmarks = {}
            for name, local_coord in local_data['landmarks'].items():
                global_landmarks[name] = self._transform_point(local_coord, angle, global_pos)
            
            # 4. Ghi vào Global Metadata
            layout_metadata["components"].append({
                "role": f"arm_{angle}",
                "module_type": local_data['type'],
                "bounds": self._calc_bounds(transformed_coords),
                "landmarks": global_landmarks
            })

        return PathInfo(..., metadata=layout_metadata)
```

### 3. Tiêu chuẩn hóa Kết quả trả về (Standardized Output)

Dù bạn ghép Mũi tên hay Hình vuông, file JSON đầu ra phải tuân thủ một chuẩn chung để `Analyzer` (Typescript) hiểu được mà không cần sửa code.

**Cấu trúc JSON chuẩn:**

```json
{
  "topology_type": "composite",
  "layout_pattern": "radial_4", // Analyzer nhìn cái này để biết là đối xứng tâm
  "components": [
    {
      "id": "arm_0",
      "type": "arrow_head", // Analyzer nhìn cái này để biết tính chất Module
      "landmarks": {
        "tip": [12, 0, 18],    // Tọa độ đã được transform ra Global
        "entrance": [12, 0, 12]
      }
    },
    {
      "id": "arm_90",
      "type": "arrow_head",
      "landmarks": {
        "tip": [18, 0, 12],
        "entrance": [12, 0, 12]
      }
    }
  ]
}
```

### 4. Tiêu chuẩn hóa Quá trình Phân tích (Standardized Analysis)

Khi Analyzer nhận được JSON trên, nó sẽ chạy theo luồng:

1.  **Macro Analysis (Cấp Layout):**
    *   Thấy `layout_pattern: radial_4` $\to$ Kích hoạt chiến lược "Function Loop" (Viết 1 hàm, lặp 4 lần).
    *   Nó sẽ lấy `landmarks.entrance` của cả 4 components để xác định tâm quay.

2.  **Micro Analysis (Cấp Module):**
    *   Thấy `type: arrow_head` $\to$ Nó tra cứu trong "Library kiến thức" của nó.
    *   Nó biết `arrow_head` thì nên đặt Crystal ở `tip` và Switch ở `wing`.
    *   Nó truy xuất `component.landmarks.tip` (đã là tọa độ thật) để đặt Crystal.

### KẾT LUẬN

Cách tiếp cận **Composite (Tổ hợp)** này mang lại lợi ích kép:

1.  **Với Generator:** Bạn chỉ cần viết module `Triangle`, `Square`, `Spiral` một lần. Sau đó bạn có thể tạo ra hàng trăm biến thể: "Chữ thập Tam giác", "Chữ thập Xoắn ốc", "Lưới Tam giác"... chỉ bằng cách đổi tham số inject.
2.  **Với Analyzer:** Nó không cần phải "dò" xem cái đảo ở hướng Đông hình gì. Nó đọc metadata `type: arrow_head` và áp dụng ngay chiến lược đặt vật phẩm cho mũi tên vào tọa độ hướng Đông đó.

Đây là đỉnh cao của thiết kế **Data-Driven**: Generator tính toán, Analyzer tiêu thụ, không ai phải đoán mò.

---

Tôi hiểu rất rõ! Đây là một bài học quan trọng về **kiến trúc phần mềm có khả năng mở rộng** (scalable architecture). Để minh họa, tôi sẽ cho bạn ví dụ cụ thể:

## 🎯 Vấn đề hiện tại

Code `PlusShapeIslandsTopology` hiện tại đang **hard-code** việc tạo hình vuông (`_create_square_island`). Nếu muốn đổi sang tam giác, bạn phải tạo class mới `PlusShapeTriangleIslandsTopology` → **Combinatorial Explosion**!

## ✨ Giải pháp: Module hóa

### Bước 1: Tạo Base Module

```python
# src/map_generator/modules/base_module.py
from abc import ABC, abstractmethod
from typing import Dict, Any, List
from src.map_generator.models.path_info import Coord

class BaseIslandModule(ABC):
    """Base class cho tất cả các module đảo"""
    
    @abstractmethod
    def generate(self, center: Coord, size: int, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Sinh ra đảo ở tọa độ cục bộ.
        
        Returns:
            {
                "coords": [...],  # Danh sách tọa độ
                "landmarks": {    # Các điểm đặc biệt
                    "center": (x, y, z),
                    "entrance": (x, y, z),
                    "treasure_spot": (x, y, z)
                },
                "type": "square" / "triangle" / "spiral"
            }
        """
        pass
```

### Bước 2: Implement các Module cụ thể

```python
# src/map_generator/modules/island_modules.py

class SquareIslandModule(BaseIslandModule):
    """Module đảo hình vuông - giống code cũ"""
    
    def generate(self, center: Coord, size: int, params: Dict[str, Any]) -> Dict[str, Any]:
        cx, cy, cz = center
        half = size // 2
        coords = []
        
        for x_offset in range(-half, half + 1):
            for z_offset in range(-half, half + 1):
                coords.append((cx + x_offset, cy, cz + z_offset))
        
        return {
            "coords": coords,
            "landmarks": {
                "center": center,
                "entrance": (cx, cy, cz - half),  # Cổng vào phía Nam
                "treasure_spot": (cx, cy, cz)     # Kho báu ở giữa
            },
            "type": "square"
        }


class TriangleIslandModule(BaseIslandModule):
    """Module đảo hình tam giác"""
    
    def generate(self, center: Coord, size: int, params: Dict[str, Any]) -> Dict[str, Any]:
        cx, cy, cz = center
        coords = []
        
        # Vẽ tam giác đều với đỉnh hướng Bắc
        for row in range(size):
            z_pos = cz - size // 2 + row
            width = row + 1
            for x_offset in range(-width // 2, width // 2 + 1):
                coords.append((cx + x_offset, cy, z_pos))
        
        return {
            "coords": coords,
            "landmarks": {
                "center": center,
                "tip": (cx, cy, cz + size // 2),      # Đỉnh tam giác
                "entrance": (cx, cy, cz - size // 2),  # Đáy tam giác
                "treasure_spot": (cx, cy, cz)
            },
            "type": "triangle"
        }


class SpiralIslandModule(BaseIslandModule):
    """Module đảo hình xoắn ốc"""
    
    def generate(self, center: Coord, size: int, params: Dict[str, Any]) -> Dict[str, Any]:
        cx, cy, cz = center
        coords = [center]
        
        # Vẽ xoắn ốc Fibonacci
        directions = [(1, 0), (0, 1), (-1, 0), (0, -1)]  # E, N, W, S
        current_pos = [cx, cz]
        steps = 1
        
        for direction_idx in range(size):
            dx, dz = directions[direction_idx % 4]
            for _ in range(steps):
                current_pos[0] += dx
                current_pos[1] += dz
                coords.append((current_pos[0], cy, current_pos[1]))
            if direction_idx % 2 == 1:
                steps += 1
        
        return {
            "coords": coords,
            "landmarks": {
                "center": center,
                "entrance": coords[0],
                "outer_end": coords[-1],  # Điểm cuối xoắn ốc
                "treasure_spot": center
            },
            "type": "spiral"
        }
```

### Bước 3: Refactor PlusShapeIslandsTopology thành Layout Engine

```python
# src/map_generator/topologies/radial_layout_topology.py

class RadialLayoutTopology(BaseTopology):
    """
    Layout Engine: Sắp xếp các module theo hình tỏa tròn.
    KHÔNG quan tâm module là hình gì!
    """
    
    def __init__(self, island_module: BaseIslandModule):
        """
        Args:
            island_module: Module sinh đảo (Square/Triangle/Spiral)
        """
        self.island_module = island_module
    
    def generate_path_info(self, grid_size: tuple, params: dict) -> PathInfo:
        print(f"    LOG: Generating radial layout with {self.island_module.__class__.__name__}...")
        
        # Setup giống code cũ
        effective_grid_size = (25, 25, 25)
        island_size = int(params.get('island_size', 2))
        arm_length = self._calculate_arm_length(effective_grid_size, island_size, params)
        center_pos = self._calculate_center(effective_grid_size, arm_length, island_size)
        
        all_path_coords = [center_pos]
        branches = []
        directions = [(1, 0, 0), (-1, 0, 0), (0, 0, 1), (0, 0, -1)]
        direction_names = ['east', 'west', 'south', 'north']
        
        components = []  # [MỚI] Lưu metadata từng component
        
        # Tạo 4 đảo theo 4 hướng
        for idx, direction in enumerate(directions):
            # 1. Tính vị trí đảo
            island_center = add_vectors(center_pos, scale_vector(direction, arm_length))
            
            # 2. GỌI MODULE để sinh đảo
            island_data = self.island_module.generate(
                center=island_center,
                size=island_size,
                params=params
            )
            
            # 3. Transform landmarks từ local → global (đã đúng rồi vì center đã global)
            global_landmarks = island_data['landmarks'].copy()
            
            # 4. Tạo cầu nối
            bridge_path = self._create_bridge(center_pos, island_center, direction, arm_length)
            
            # 5. Gộp vào path chính
            branch_path = bridge_path + island_data['coords']
            all_path_coords.extend(branch_path)
            branches.append(branch_path)
            
            # 6. [QUAN TRỌNG] Lưu metadata component
            components.append({
                "id": f"island_{direction_names[idx]}",
                "module_type": island_data['type'],  # "square"/"triangle"/"spiral"
                "landmarks": global_landmarks,
                "direction": direction_names[idx],
                "coords": island_data['coords']
            })
        
        # Chọn start/end
        start_pos = components[0]['landmarks']['entrance']
        target_pos = components[1]['landmarks']['entrance']
        
        # [MỚI] Metadata chuẩn hóa
        metadata = {
            "topology_type": "composite",
            "layout_pattern": "radial_4",  # Analyzer nhìn đây để biết cấu trúc
            "components": components,      # Chi tiết từng đảo
            "hub": [center_pos],
            "center": center_pos
        }
        
        return PathInfo(
            start_pos=start_pos,
            target_pos=target_pos,
            path_coords=list(dict.fromkeys(all_path_coords)),
            placement_coords=list(dict.fromkeys(all_path_coords)),
            metadata=metadata
        )
    
    def _create_bridge(self, center: Coord, island_center: Coord, 
                       direction: tuple, arm_length: int) -> List[Coord]:
        """Tạo cầu nối từ tâm đến đảo"""
        bridge = []
        current = center
        for _ in range(arm_length):
            current = add_vectors(current, direction)
            bridge.append(current)
        return bridge
```

### Bước 4: Sử dụng - Tạo biến thể chỉ bằng 1 dòng!

```python
# src/map_generator/topology_registry.py

from .modules.island_modules import (
    SquareIslandModule, 
    TriangleIslandModule, 
    SpiralIslandModule
)
from .topologies.radial_layout_topology import RadialLayoutTopology

# Đăng ký các biến thể
TOPOLOGIES = {
    # Biến thể cũ
    "plus_shape_islands": RadialLayoutTopology(SquareIslandModule()),
    
    # [MỚI] Biến thể mới - CHỈ 1 DÒNG!
    "plus_shape_triangles": RadialLayoutTopology(TriangleIslandModule()),
    "plus_shape_spirals": RadialLayoutTopology(SpiralIslandModule()),
    
    # Tương lai: Thêm module mới
    "plus_shape_hexagons": RadialLayoutTopology(HexagonIslandModule()),
    "plus_shape_stars": RadialLayoutTopology(StarIslandModule()),
}
```

## 🎨 Analyzer (TypeScript) tiêu thụ dữ liệu

```typescript
// analyzer/strategies/composite_analyzer.ts

function analyzeComposite(metadata: any) {
  const { layout_pattern, components } = metadata;
  
  // MACRO: Phân tích layout
  if (layout_pattern === "radial_4") {
    console.log("✓ Detected radial symmetry with 4 arms");
    // Gợi ý: Function reuse strategy
  }
  
  // MICRO: Phân tích từng component
  components.forEach((comp: any) => {
    const { module_type, landmarks, direction } = comp;
    
    switch(module_type) {
      case "triangle":
        console.log(`Place crystal at tip: ${landmarks.tip}`);
        console.log(`Place switch at entrance: ${landmarks.entrance}`);
        break;
        
      case "spiral":
        console.log(`Place treasure at outer_end: ${landmarks.outer_end}`);
        break;
        
      case "square":
        console.log(`Place treasure at center: ${landmarks.treasure_spot}`);
        break;
    }
  });
}
```

## 🎁 Lợi ích

1. **Generator**: Muốn thêm hình lục giác? Chỉ cần viết `HexagonIslandModule` → Tự động có 4 biến thể (Plus, Grid, Ring, Random)
2. **Analyzer**: Không cần đoán, đọc `module_type` trong JSON là biết cách xử lý
3. **Scalability**: Từ 1 layout + 3 modules = 3 maps → 5 layouts + 10 modules = **50 maps** mà không cần viết thêm code!

Đây chính là sức mạnh của **Dependency Injection** và **Strategy Pattern**! 🚀

---

Tôi thấy sẽ có nhiều dạng layout. Các shape cụ thể được tạo ra bởi 1 module cụ thể (ví dụ TriangleIslandModule) cũng có thể có biến thể. Khi ghép chúng lại với nhau, chúng ta thu được rất nhiều biến thể khác biệt. Ví dụ: trong plus_shape_island thì các đảo có thể có kích thước khác nhau và path đến đảo dài khác nhau. Chúng ta cũng có thể chỉ tạo ra 2-3 đảo chứ không phải 4.

Trong 1 layout khác, thay vì xếp các đảo xoay quanh 1 diểm thì chúng ta có thể xếp chúng dọc theo 1 đường, đảo này nối đảo khác....

Vậy theo bạn có các layout nào có thể tạo, các dạng module nào, cách thức kết nối là gì?

---

Xuất sắc! Bạn đã nhìn thấy toàn bộ **design space**. Để hệ thống thực sự mạnh mẽ, chúng ta cần phân loại và chuẩn hóa cả 3 chiều:

## 🏗️ Architecture: 3-Dimensional Design Space

```
MAP = LAYOUT × MODULE × CONNECTION
```

---

## 1️⃣ LAYOUT PATTERNS (Cấu trúc Sắp xếp)

### A. **Centralized Layouts** (Tập trung vào tâm)

```python
class RadialLayoutTopology(BaseTopology):
    """4 đảo xoay quanh 1 tâm (Plus shape hiện tại)"""
    params:
        - arm_count: 2-8 (số cánh)
        - arm_length: 3-10
        - rotation_offset: 0-360 (xoay toàn bộ pattern)
```

```python
class ConcentricRingsLayout(BaseTopology):
    """Đảo xếp thành các vòng tròn đồng tâm"""
    params:
        - ring_count: 2-4
        - islands_per_ring: [4, 8, 12] (mỗi vòng có bao nhiêu đảo)
        - ring_radius: [5, 10, 15]
```

### B. **Linear Layouts** (Sắp xếp theo đường thẳng)

```python
class LinearChainLayout(BaseTopology):
    """Đảo nối đảo theo 1 đường thẳng"""
    params:
        - island_count: 3-7
        - spacing: 3-8 (khoảng cách giữa các đảo)
        - direction: 'horizontal' | 'vertical' | 'diagonal'
    
    # Ví dụ: A---B---C---D---E
```

```python
class ZigZagChainLayout(BaseTopology):
    """Đảo nối nhau theo đường zigzag"""
    params:
        - island_count: 4-8
        - amplitude: 3-6 (độ lệch ngang)
        - wavelength: 4-8 (chu kỳ zigzag)
    
    # Ví dụ:
    #     C     E
    #    /     /
    #   B     D
    #  /     /
    # A     F
```

### C. **Grid Layouts** (Sắp xếp theo lưới)

```python
class GridLayout(BaseTopology):
    """Đảo xếp thành lưới 2D"""
    params:
        - rows: 2-4
        - cols: 2-4
        - spacing_x: 5-10
        - spacing_z: 5-10
    
    # Ví dụ 2x3:
    # A  B  C
    # D  E  F
```

```python
class HexGridLayout(BaseTopology):
    """Lưới lục giác (honeycomb)"""
    params:
        - hex_rings: 1-3
        - hex_size: 4-8
```

### D. **Tree Layouts** (Cấu trúc cây)

```python
class BinaryTreeLayout(BaseTopology):
    """Đảo xếp thành cây nhị phân"""
    params:
        - depth: 2-4
        - branch_angle: 30-60
        - level_spacing: 5-10
    
    # Ví dụ depth=2:
    #       A
    #      / \
    #     B   C
    #    / \ / \
    #   D  E F  G
```

### E. **Organic Layouts** (Tự nhiên, không đối xứng)

```python
class ClusterLayout(BaseTopology):
    """Các cụm đảo ngẫu nhiên"""
    params:
        - cluster_count: 2-4
        - islands_per_cluster: 2-5
        - cluster_spread: 8-15
```

```python
class RiverLayout(BaseTopology):
    """Đảo dọc theo dòng sông uốn lượn"""
    params:
        - river_segments: 5-10
        - island_density: 0.3-0.7
        - river_width: 3-5
```

---

## 2️⃣ MODULE TYPES (Hình dạng Đảo)

### A. **Geometric Modules** (Hình học cơ bản)

```python
class SquareIslandModule(BaseIslandModule):
    """Vuông - Cân bằng, 4 hướng tiếp cận"""
    params:
        - size: 2-6
        - hollow: bool (rỗng giữa?)
    landmarks: ['center', 'entrance', 'north_edge', 'south_edge', 'east_edge', 'west_edge']
```

```python
class TriangleIslandModule(BaseIslandModule):
    """Tam giác - Có hướng rõ ràng"""
    params:
        - size: 3-7
        - orientation: 'N'|'S'|'E'|'W' (đỉnh hướng đâu)
    landmarks: ['tip', 'base_center', 'left_corner', 'right_corner']
```

```python
class CircleIslandModule(BaseIslandModule):
    """Hình tròn - Đối xứng hoàn toàn"""
    params:
        - radius: 2-5
    landmarks: ['center', 'cardinal_points'] (4 điểm N/S/E/W)
```

```python
class HexagonIslandModule(BaseIslandModule):
    """Lục giác - 6 cạnh đều"""
    params:
        - size: 2-5
    landmarks: ['center', 'vertices'] (6 đỉnh)
```

### B. **Directional Modules** (Có hướng đặc biệt)

```python
class ArrowIslandModule(BaseIslandModule):
    """Mũi tên - Chỉ hướng rõ ràng"""
    params:
        - length: 4-8
        - wing_span: 2-4
    landmarks: ['tip', 'base', 'left_wing', 'right_wing']
```

```python
class LShapeIslandModule(BaseIslandModule):
    """Hình chữ L - 2 cánh vuông góc"""
    params:
        - arm1_length: 3-6
        - arm2_length: 3-6
        - thickness: 1-2
    landmarks: ['corner', 'arm1_end', 'arm2_end']
```

### C. **Path-Based Modules** (Đảo kiểu đường đi)

```python
class SpiralIslandModule(BaseIslandModule):
    """Xoắn ốc - Đường đi dài, phức tạp"""
    params:
        - turns: 2-4
        - tightness: 0.5-1.5
    landmarks: ['center', 'entrance', 'outer_end']
```

```python
class MazeIslandModule(BaseIslandModule):
    """Mê cung mini - Nhiều ngã rẽ"""
    params:
        - size: 5-9
        - complexity: 0.3-0.7
    landmarks: ['entrance', 'center', 'dead_ends[]']
```

### D. **Composite Modules** (Module phức hợp)

```python
class DonutIslandModule(BaseIslandModule):
    """Vòng tròn rỗng giữa"""
    params:
        - outer_radius: 4-6
        - inner_radius: 2-3
    landmarks: ['outer_edge[]', 'inner_edge[]']
```

```python
class BridgedIslandsModule(BaseIslandModule):
    """2 đảo nhỏ nối bằng cầu"""
    params:
        - sub_island_size: 2-3
        - bridge_length: 2-4
    landmarks: ['island1_center', 'island2_center', 'bridge_mid']
```

---

## 3️⃣ CONNECTION STRATEGIES (Cách thức Kết nối)

### A. **Direct Connections** (Nối trực tiếp)

```python
class StraightBridgeConnection:
    """Cầu thẳng ngắn nhất"""
    params:
        - width: 1-2 (độ rộng cầu)
```

```python
class ArchBridgeConnection:
    """Cầu cong, đẹp hơn nhưng dài hơn"""
    params:
        - arc_height: 1-3
```

### B. **Indirect Connections** (Nối gián tiếp)

```python
class HubSpokeConnection:
    """Tất cả đảo nối về 1 điểm trung tâm"""
    # Dùng cho RadialLayout
```

```python
class SequentialConnection:
    """Nối tuần tự A→B→C→D"""
    # Dùng cho LinearChainLayout
```

```python
class NearestNeighborConnection:
    """Mỗi đảo nối với đảo gần nhất"""
    params:
        - max_connections_per_island: 2-4
```

### C. **Conditional Connections** (Nối có điều kiện)

```python
class GatedConnection:
    """Phải qua cổng/switch mới mở đường"""
    params:
        - gate_type: 'pressure_plate' | 'lever'
```

```python
class BidirectionalConnection:
    """Có thể đi cả 2 chiều"""
```

```python
class OneWayConnection:
    """Chỉ đi 1 chiều (có dốc, cầu sập...)"""
```

---

## 🎯 COMPOSITION EXAMPLES (Ví dụ Kết hợp)

### Example 1: **Island Hopping Challenge**
```python
map_config = {
    "layout": LinearChainLayout(
        island_count=5,
        spacing=[3, 5, 4, 6],  # Khoảng cách khác nhau
        direction='horizontal'
    ),
    "modules": [
        TriangleIslandModule(size=3, orientation='E'),
        CircleIslandModule(radius=3),
        SquareIslandModule(size=4, hollow=True),
        ArrowIslandModule(length=5),
        HexagonIslandModule(size=4)
    ],
    "connections": StraightBridgeConnection(width=1)
}
# Teaching: Function parameters (spacing varies)
```

### Example 2: **Symmetry Garden**
```python
map_config = {
    "layout": RadialLayoutTopology(
        arm_count=6,  # 6 cánh thay vì 4
        arm_length=[4, 4, 6, 6, 4, 4],  # 2 cánh dài hơn
        rotation_offset=30
    ),
    "modules": [
        TriangleIslandModule(size=3, orientation='inward'),  # Tất cả đều chỉ vào tâm
        TriangleIslandModule(size=3, orientation='inward'),
        TriangleIslandModule(size=4, orientation='inward'),  # 2 cái to hơn
        TriangleIslandModule(size=4, orientation='inward'),
        TriangleIslandModule(size=3, orientation='inward'),
        TriangleIslandModule(size=3, orientation='inward')
    ],
    "connections": HubSpokeConnection()
}
# Teaching: Mirror symmetry, loop with rotation
```

### Example 3: **Binary Decision Tree**
```python
map_config = {
    "layout": BinaryTreeLayout(
        depth=3,
        branch_angle=45,
        level_spacing=6
    ),
    "modules": [
        # Root
        CircleIslandModule(radius=3),
        # Level 1
        LShapeIslandModule(arm1_length=4, arm2_length=3),
        LShapeIslandModule(arm1_length=3, arm2_length=4),
        # Level 2 - 4 leaf nodes
        SquareIslandModule(size=2),
        SquareIslandModule(size=2),
        SquareIslandModule(size=2),
        SquareIslandModule(size=2)
    ],
    "connections": OneWayConnection()  # Chỉ đi xuống, không lên
}
# Teaching: Recursive functions, binary search
```

### Example 4: **Spiral Galaxy**
```python
map_config = {
    "layout": ConcentricRingsLayout(
        ring_count=3,
        islands_per_ring=[4, 6, 8],
        ring_radius=[5, 10, 15]
    ),
    "modules": {
        "ring_0": [SquareIslandModule(size=3)] * 4,
        "ring_1": [TriangleIslandModule(size=2)] * 6,
        "ring_2": [CircleIslandModule(radius=2)] * 8
    },
    "connections": NearestNeighborConnection(max_connections_per_island=3)
}
# Teaching: Nested loops, radial coordinates
```

---

## 📐 STANDARDIZED METADATA OUTPUT

Để Analyzer hiểu được, mỗi layout phải xuất JSON theo format:

```json
{
  "topology_type": "composite",
  "layout_pattern": "linear_chain",
  "layout_params": {
    "island_count": 5,
    "spacing": [3, 5, 4, 6]
  },
  "components": [
    {
      "id": "island_0",
      "module_type": "triangle",
      "module_params": {"size": 3, "orientation": "E"},
      "position": [5, 0, 12],
      "landmarks": {
        "tip": [8, 0, 12],
        "entrance": [5, 0, 12]
      }
    },
    {
      "id": "island_1",
      "module_type": "circle",
      "position": [13, 0, 12],
      "landmarks": {
        "center": [13, 0, 12],
        "north": [13, 0, 16]
      }
    }
  ],
  "connections": [
    {
      "from": "island_0",
      "to": "island_1",
      "type": "straight_bridge",
      "path": [[9,0,12], [10,0,12], [11,0,12], [12,0,12]]
    }
  ],
  "teaching_strategy": {
    "primary": "function_parameters",
    "difficulty": "MEDIUM",
    "key_concepts": ["varying_spacing", "shape_sequence"]
  }
}
```

---

## 🎨 IMPLEMENTATION PRIORITY

**Phase 1** (Làm ngay):
- `RadialLayoutTopology` (đã có)
- `LinearChainLayout`
- `SquareIslandModule` (đã có)
- `TriangleIslandModule`
- `CircleIslandModule`

**Phase 2**:
- `GridLayout`
- `ZigZagChainLayout`
- `ArrowIslandModule`
- `SpiralIslandModule`

**Phase 3**:
- `BinaryTreeLayout`
- `ConcentricRingsLayout`
- `MazeIslandModule`
- `GatedConnection`

Với kiến trúc này, bạn có thể tạo ra **hàng trăm biến thể map** mà chỉ cần viết ~10 layouts + ~15 modules! 🚀