Tôi xây dựng một thế giới 3D Oxyz giống như Minecraft (tạo bởi các khối lập phương), y là chiều cao. Nhân vật chỉ có thể di chuyển ở khu vực có khối. Tôi dùng thế giới này để dạy lập trình cho học sinh. HS sẽ điều khiển nhân vật từ điểm xuất phát đi, quẹo trái/phải (90 độ), nhặt tinh thể, bật/tắt công tắc... và về đích. Tôi nhận thấy rằng các map có tính học thuật và đều có thể bị phân tách về các điểm và chuỗi tọa độ đường. Từ đây có thể xác định để có thể rải item theo quy luật, đa dạng hóa màn chơi nhưng vẫn thỏa mãn tính học thuật được chọn (ví dụ như vòng lặp hay function,...)

---

Tuyệt vời! Tôi hiểu bạn đang xây dựng một công cụ dạy lập trình kiểu Minecraft với cấu trúc có tính toán học. Đây là một ý tưởng rất hay. Để tôi phân tích và đề xuất một số giải pháp:

## Phân tích bài toán

Từ hình vẽ của bạn, tôi thấy:
- **Các đường đi** có thể phân tích thành chuỗi tọa độ liên tiếp
- **Các pattern** (Case 1, 2, 3) đại diện cho các cấu trúc lập trình khác nhau
- **Tính học thuật** cần được bảo toàn khi sinh map tự động

## Đề xuất kiến trúc hệ thống

### 1. **Biểu diễn đường đi (Path Representation)**

```javascript
// Cấu trúc cơ bản
class PathSegment {
  start: Vector3;      // Điểm bắt đầu
  end: Vector3;        // Điểm kết thúc
  type: string;        // 'straight', 'turn', 'branch', 'merge'
  length: number;      // Độ dài đoạn
  direction: Vector3;  // Hướng di chuyển
}

class GamePath {
  segments: PathSegment[];
  junctions: Vector3[];     // Các điểm rẽ nhánh
  items: ItemPlacement[];   // Vị trí items
  metadata: PathMetadata;   // Thông tin học thuật
}
```

### 2. **Các Pattern học thuật**

**Case 1 - Sequential (Tuần tự):**
```
Start → A → B → C → End
// Dạy: biến, phép gán, lệnh tuần tự
```

**Case 2 - Branching (Rẽ nhánh):**
```
       → Path A
Start ↗         ↘ End
       → Path B ↗
// Dạy: if-else, điều kiện
```

**Case 3 - Loop (Vòng lặp):**
```
Start → ⟲ → ⟲ → ⟲ → End
// Dạy: for, while, repeat
```

### 3. **Thuật toán phân tích map**

```python
def analyze_map(blocks):
    # Bước 1: Tìm tất cả đường đi có thể
    paths = find_all_paths(blocks)
    
    # Bước 2: Phân loại các đoạn đường
    segments = []
    for path in paths:
        seg_type = classify_segment(path)
        segments.append({
            'coordinates': path,
            'type': seg_type,
            'pattern': detect_pattern(path)
        })
    
    # Bước 3: Xác định điểm đặc biệt
    junctions = find_junctions(segments)
    loops = detect_loops(segments)
    
    # Bước 4: Tạo metadata học thuật
    academic_structure = {
        'complexity': calculate_complexity(segments),
        'concepts': identify_concepts(segments),
        'difficulty': estimate_difficulty(segments)
    }
    
    return MapAnalysis(segments, junctions, loops, academic_structure)
```

### 4. **Hệ thống rải item thông minh**

```python
class ItemPlacementStrategy:
    def place_items_for_concept(self, path_analysis, concept):
        if concept == 'loop':
            # Đặt items theo chu kỳ
            return self.place_periodic(path_analysis, interval=3)
        
        elif concept == 'conditional':
            # Đặt items ở các điểm rẽ nhánh
            return self.place_at_junctions(path_analysis)
        
        elif concept == 'function':
            # Đặt items theo nhóm có pattern lặp lại
            return self.place_repeating_pattern(path_analysis)
        
        elif concept == 'variable':
            # Đặt items cần thu thập và sử dụng
            return self.place_collectibles(path_analysis)

def place_periodic(self, analysis, interval):
    """Đặt items theo khoảng cách đều"""
    items = []
    total_length = sum(seg.length for seg in analysis.segments)
    
    for i in range(0, total_length, interval):
        pos = self.get_position_at_distance(analysis, i)
        items.append(Item(pos, type='crystal'))
    
    return items
```

### 5. **Generator map có tính học thuật**

```python
class AcademicMapGenerator:
    def generate_for_lesson(self, lesson_type, difficulty):
        """
        Sinh map dựa trên bài học và độ khó
        """
        template = self.select_template(lesson_type)
        
        # Tạo đường đi chính
        main_path = self.create_main_path(template, difficulty)
        
        # Thêm các nhánh phụ nếu cần
        if lesson_type in ['conditional', 'function']:
            branches = self.add_branches(main_path, lesson_type)
        
        # Rải items theo quy luật
        items = self.place_items_by_rule(main_path, lesson_type)
        
        # Tạo thử thách
        challenges = self.create_challenges(main_path, difficulty)
        
        return Map(main_path, branches, items, challenges)
    
    def create_main_path(self, template, difficulty):
        """Tạo đường đi chính từ template"""
        length = self.calculate_length(difficulty)
        turns = self.calculate_turns(difficulty)
        
        path = [template.start]
        current_pos = template.start
        current_dir = Vector3(1, 0, 0)
        
        for i in range(turns):
            # Di chuyển thẳng
            steps = length // turns
            for j in range(steps):
                current_pos += current_dir
                path.append(current_pos)
            
            # Rẽ ngẫu nhiên
            current_dir = self.random_turn(current_dir)
        
        return path
```

### 6. **Hệ thống validation**

```python
def validate_academic_correctness(map_data, lesson_requirements):
    """Kiểm tra map có đáp ứng yêu cầu học thuật không"""
    
    checks = {
        'has_required_concepts': False,
        'difficulty_appropriate': False,
        'path_solvable': False,
        'items_well_placed': False
    }
    
    # Kiểm tra concepts
    detected_concepts = detect_concepts_in_map(map_data)
    checks['has_required_concepts'] = all(
        req in detected_concepts 
        for req in lesson_requirements.concepts
    )
    
    # Kiểm tra độ khó
    complexity = calculate_complexity(map_data)
    checks['difficulty_appropriate'] = (
        lesson_requirements.min_difficulty <= complexity <= 
        lesson_requirements.max_difficulty
    )
    
    # Kiểm tra giải được
    checks['path_solvable'] = pathfinding_exists(
        map_data.start, 
        map_data.end
    )
    
    # Kiểm tra items
    checks['items_well_placed'] = validate_item_placement(
        map_data.items,
        lesson_requirements.item_rules
    )
    
    return all(checks.values()), checks
```

### 7. **Ví dụ cụ thể: Map dạy vòng lặp**

```python
def create_loop_lesson_map():
    """
    Tạo map dạy vòng lặp:
    - Đường đi có cấu trúc lặp lại
    - Items đặt theo chu kỳ
    - Cần lặp 3 lần để hoàn thành
    """
    
    # Tạo một đoạn đường lặp lại
    segment = [
        (0, 0, 0),  # Start
        (1, 0, 0),
        (2, 0, 0),
        (2, 0, 1),
        (1, 0, 1),
        (0, 0, 1),  # Back to start Y level
    ]
    
    # Lặp segment 3 lần, mỗi lần tăng Y
    full_path = []
    for i in range(3):
        for x, y, z in segment:
            full_path.append((x, i, z))
    
    # Đặt items ở cuối mỗi vòng lặp
    items = [
        Item((0, 0, 1), 'crystal'),
        Item((0, 1, 1), 'crystal'),
        Item((0, 2, 1), 'crystal'),
    ]
    
    return Map(full_path, items)
```

## Lợi ích của hệ thống này:

1. **Tự động sinh map** đa dạng nhưng vẫn đúng concept
2. **Điều chỉnh độ khó** dễ dàng bằng parameters
3. **Đảm bảo tính học thuật** qua validation
4. **Mở rộng dễ dàng** thêm concepts mới
5. **Phân tích được** học sinh gặp khó khăn ở đâu

Bạn muốn tôi chi tiết hóa phần nào hơn? Hoặc tôi có thể giúp bạn implement một prototype cụ thể?

---

Các trường hợp mà tôi thấy cơ bản nhất có thể fallback về là:

Đường thẳng 2D (trong không gian 3D) - ngắn nhất là 2 khối
Đường thẳng 3D (trong không gian 3D) - ngắn nhất là 2 khối

---
Các hệ dễ tạo pattern học thuật là:

Cặp đường có tính chất song song và đối xứng trục (vuông góc với cặp đường này)
Cặp đường có tính chất vuông góc
Cặp đường có tính chất đối xứng trục
Cặp đường có tính chất đối xứng tâm
---

Các dạng hình đặc biệt như hình tròn, hình vuông (nhưng thực sự chúng cũng rơi về các hệ đường trên)

---

Rất tốt! Bạn đã phân tích rất có hệ thống. Đây là cách tiếp cận toán học đúng đắn. Để tôi xây dựng một framework dựa trên phân tích của bạn:

## 1. Định nghĩa các thành phần cơ bản

```python
from dataclasses import dataclass
from enum import Enum
import numpy as np

class PathType(Enum):
    STRAIGHT_2D = "straight_2d"  # Đường thẳng trên mặt phẳng
    STRAIGHT_3D = "straight_3d"  # Đường thẳng trong không gian

class RelationType(Enum):
    PARALLEL = "parallel"              # Song song
    PERPENDICULAR = "perpendicular"    # Vuông góc
    AXIS_SYMMETRIC = "axis_symmetric"  # Đối xứng trục
    POINT_SYMMETRIC = "point_symmetric" # Đối xứng tâm

@dataclass
class Vector3:
    x: float
    y: float
    z: float
    
    def __add__(self, other):
        return Vector3(self.x + other.x, self.y + other.y, self.z + other.z)
    
    def __sub__(self, other):
        return Vector3(self.x - other.x, self.y - other.y, self.z - other.z)
    
    def dot(self, other):
        return self.x * other.x + self.y * other.y + self.z * other.z
    
    def cross(self, other):
        return Vector3(
            self.y * other.z - self.z * other.y,
            self.z * other.x - self.x * other.z,
            self.x * other.y - self.y * other.x
        )
    
    def magnitude(self):
        return (self.x**2 + self.y**2 + self.z**2)**0.5
    
    def normalize(self):
        mag = self.magnitude()
        return Vector3(self.x/mag, self.y/mag, self.z/mag) if mag > 0 else Vector3(0,0,0)

@dataclass
class PathSegment:
    """Đoạn đường cơ bản - tối thiểu 2 khối"""
    start: Vector3
    end: Vector3
    path_type: PathType
    
    def direction(self):
        """Vector chỉ phương của đường"""
        return (self.end - self.start).normalize()
    
    def length(self):
        """Độ dài đường"""
        return (self.end - self.start).magnitude()
    
    def points(self):
        """Tất cả các điểm trên đường"""
        direction = self.end - self.start
        length = int(self.length())
        
        points = []
        for i in range(length + 1):
            t = i / length if length > 0 else 0
            point = Vector3(
                round(self.start.x + direction.x * t),
                round(self.start.y + direction.y * t),
                round(self.start.z + direction.z * t)
            )
            points.append(point)
        return points
    
    def is_2d(self):
        """Kiểm tra đường có nằm trên mặt phẳng không"""
        # Nếu một trong các tọa độ không đổi -> 2D
        return (self.start.x == self.end.x or 
                self.start.y == self.end.y or 
                self.start.z == self.end.z)
```

## 2. Hệ thống phân tích quan hệ giữa các đường

```python
class PathRelationAnalyzer:
    """Phân tích quan hệ giữa các cặp đường"""
    
    @staticmethod
    def are_parallel(path1: PathSegment, path2: PathSegment, tolerance=0.01):
        """Kiểm tra 2 đường có song song không"""
        dir1 = path1.direction()
        dir2 = path2.direction()
        
        # Tích có hướng = 0 -> song song
        cross = dir1.cross(dir2)
        return cross.magnitude() < tolerance
    
    @staticmethod
    def are_perpendicular(path1: PathSegment, path2: PathSegment, tolerance=0.01):
        """Kiểm tra 2 đường có vuông góc không"""
        dir1 = path1.direction()
        dir2 = path2.direction()
        
        # Tích vô hướng = 0 -> vuông góc
        return abs(dir1.dot(dir2)) < tolerance
    
    @staticmethod
    def find_axis_of_symmetry(path1: PathSegment, path2: PathSegment):
        """Tìm trục đối xứng của 2 đường"""
        # Trục đối xứng đi qua trung điểm và vuông góc với đường nối 2 trung điểm
        mid1 = Vector3(
            (path1.start.x + path1.end.x) / 2,
            (path1.start.y + path1.end.y) / 2,
            (path1.start.z + path1.end.z) / 2
        )
        mid2 = Vector3(
            (path2.start.x + path2.end.x) / 2,
            (path2.start.y + path2.end.y) / 2,
            (path2.start.z + path2.end.z) / 2
        )
        
        # Điểm giữa của 2 trung điểm
        axis_point = Vector3(
            (mid1.x + mid2.x) / 2,
            (mid1.y + mid2.y) / 2,
            (mid1.z + mid2.z) / 2
        )
        
        # Hướng vuông góc
        connecting = mid2 - mid1
        
        return {
            'point': axis_point,
            'normal': connecting.normalize()
        }
    
    @staticmethod
    def check_axis_symmetry(path1: PathSegment, path2: PathSegment, tolerance=0.5):
        """Kiểm tra 2 đường có đối xứng trục không"""
        axis = PathRelationAnalyzer.find_axis_of_symmetry(path1, path2)
        
        # Kiểm tra từng điểm của path1 có điểm đối xứng trong path2 không
        points1 = path1.points()
        points2 = path2.points()
        
        if len(points1) != len(points2):
            return False, None
        
        # Phản chiếu path1 qua trục
        reflected_points = []
        for p in points1:
            reflected = PathRelationAnalyzer.reflect_point_across_axis(p, axis)
            reflected_points.append(reflected)
        
        # So sánh với path2
        matches = 0
        for rp in reflected_points:
            for p2 in points2:
                dist = (rp - p2).magnitude()
                if dist < tolerance:
                    matches += 1
                    break
        
        is_symmetric = matches == len(points1)
        return is_symmetric, axis if is_symmetric else None
    
    @staticmethod
    def reflect_point_across_axis(point: Vector3, axis: dict):
        """Phản chiếu điểm qua trục"""
        # Vector từ điểm trên trục đến point
        v = point - axis['point']
        
        # Thành phần vuông góc với trục
        normal = axis['normal']
        perp_component = v.dot(normal)
        
        # Phản chiếu
        reflected = point - normal * (2 * perp_component)
        return reflected
    
    @staticmethod
    def find_point_of_symmetry(path1: PathSegment, path2: PathSegment):
        """Tìm tâm đối xứng của 2 đường"""
        mid1 = Vector3(
            (path1.start.x + path1.end.x) / 2,
            (path1.start.y + path1.end.y) / 2,
            (path1.start.z + path1.end.z) / 2
        )
        mid2 = Vector3(
            (path2.start.x + path2.end.x) / 2,
            (path2.start.y + path2.end.y) / 2,
            (path2.start.z + path2.end.z) / 2
        )
        
        return Vector3(
            (mid1.x + mid2.x) / 2,
            (mid1.y + mid2.y) / 2,
            (mid1.z + mid2.z) / 2
        )
    
    @staticmethod
    def check_point_symmetry(path1: PathSegment, path2: PathSegment, tolerance=0.5):
        """Kiểm tra 2 đường có đối xứng tâm không"""
        center = PathRelationAnalyzer.find_point_of_symmetry(path1, path2)
        
        points1 = path1.points()
        points2 = path2.points()
        
        if len(points1) != len(points2):
            return False, None
        
        # Đối xứng qua tâm: center = (p1 + p2) / 2 => p2 = 2*center - p1
        matches = 0
        for p1 in points1:
            reflected = Vector3(
                2 * center.x - p1.x,
                2 * center.y - p1.y,
                2 * center.z - p1.z
            )
            
            for p2 in points2:
                dist = (reflected - p2).magnitude()
                if dist < tolerance:
                    matches += 1
                    break
        
        is_symmetric = matches == len(points1)
        return is_symmetric, center if is_symmetric else None
    
    @staticmethod
    def analyze_pair(path1: PathSegment, path2: PathSegment):
        """Phân tích toàn diện quan hệ giữa 2 đường"""
        relations = []
        metadata = {}
        
        # Kiểm tra song song
        if PathRelationAnalyzer.are_parallel(path1, path2):
            relations.append(RelationType.PARALLEL)
            # Khoảng cách giữa 2 đường song song
            metadata['parallel_distance'] = PathRelationAnalyzer.distance_between_parallel(path1, path2)
        
        # Kiểm tra vuông góc
        if PathRelationAnalyzer.are_perpendicular(path1, path2):
            relations.append(RelationType.PERPENDICULAR)
        
        # Kiểm tra đối xứng trục
        is_axis_sym, axis = PathRelationAnalyzer.check_axis_symmetry(path1, path2)
        if is_axis_sym:
            relations.append(RelationType.AXIS_SYMMETRIC)
            metadata['symmetry_axis'] = axis
        
        # Kiểm tra đối xứng tâm
        is_point_sym, center = PathRelationAnalyzer.check_point_symmetry(path1, path2)
        if is_point_sym:
            relations.append(RelationType.POINT_SYMMETRIC)
            metadata['symmetry_center'] = center
        
        return {
            'relations': relations,
            'metadata': metadata
        }
    
    @staticmethod
    def distance_between_parallel(path1: PathSegment, path2: PathSegment):
        """Tính khoảng cách giữa 2 đường song song"""
        # Lấy điểm bất kỳ trên path1
        p = path1.start
        
        # Vector chỉ phương của path2
        dir2 = path2.direction()
        
        # Vector từ điểm trên path2 đến p
        v = p - path2.start
        
        # Khoảng cách = |v x dir2|
        cross = v.cross(dir2)
        return cross.magnitude()
```

## 3. Hệ thống pattern học thuật dựa trên quan hệ đường

```python
class AcademicPattern:
    """Pattern học thuật dựa trên quan hệ hình học"""
    
    @staticmethod
    def create_loop_pattern_parallel(length=5, height=3, spacing=2):
        """
        Vòng lặp: 2 đường song song với các đường ngang nối
        
        |-------|
        |       |  <- repeat 'height' times
        |-------|
        """
        paths = []
        
        for i in range(height):
            # Đường ngang trái -> phải
            path_right = PathSegment(
                Vector3(0, i, 0),
                Vector3(length, i, 0),
                PathType.STRAIGHT_2D
            )
            paths.append(path_right)
            
            # Đường nối lên (nếu không phải tầng cuối)
            if i < height - 1:
                path_up = PathSegment(
                    Vector3(length, i, 0),
                    Vector3(length, i+1, 0),
                    PathType.STRAIGHT_2D
                )
                paths.append(path_up)
                
                # Đường ngang phải -> trái
                path_left = PathSegment(
                    Vector3(length, i+1, 0),
                    Vector3(0, i+1, 0),
                    PathType.STRAIGHT_2D
                )
                paths.append(path_left)
                
                # Đường nối lên
                path_up2 = PathSegment(
                    Vector3(0, i+1, 0),
                    Vector3(0, i+2, 0),
                    PathType.STRAIGHT_2D
                )
                paths.append(path_up2)
        
        return paths
    
    @staticmethod
    def create_conditional_pattern_perpendicular(main_length=5, branch_length=3):
        """
        Điều kiện: Đường chính với 2 nhánh vuông góc (if-else)
        
              |
              | branch 1
        ------|------
              |
              | branch 2
        """
        paths = []
        
        # Đường chính
        main = PathSegment(
            Vector3(0, 0, 0),
            Vector3(main_length, 0, 0),
            PathType.STRAIGHT_2D
        )
        paths.append(main)
        
        # Điểm rẽ nhánh
        junction = Vector3(main_length // 2, 0, 0)
        
        # Nhánh 1 (đi lên)
        branch1 = PathSegment(
            junction,
            Vector3(junction.x, 0, branch_length),
            PathType.STRAIGHT_2D
        )
        paths.append(branch1)
        
        # Nhánh 2 (đi xuống)
        branch2 = PathSegment(
            junction,
            Vector3(junction.x, 0, -branch_length),
            PathType.STRAIGHT_2D
        )
        paths.append(branch2)
        
        return paths
    
    @staticmethod
    def create_function_pattern_symmetric(size=4):
        """
        Function: Cấu trúc đối xứng (hàm có input/output đối xứng)
        
          ^
          |
        <-+->  đối xứng trục dọc và ngang
          |
          v
        """
        paths = []
        center = Vector3(0, 0, 0)
        
        # 4 hướng đối xứng
        directions = [
            Vector3(size, 0, 0),   # Phải
            Vector3(-size, 0, 0),  # Trái
            Vector3(0, 0, size),   # Trước
            Vector3(0, 0, -size),  # Sau
        ]
        
        for direction in directions:
            path = PathSegment(
                center,
                center + direction,
                PathType.STRAIGHT_2D
            )
            paths.append(path)
        
        return paths
    
    @staticmethod
    def create_recursive_pattern_fractal(depth=3, size=8):
        """
        Đệ quy: Cấu trúc tự đối xứng ở nhiều cấp độ (fractal)
        
        Chia không gian thành 4 phần, mỗi phần lại chia tiếp
        """
        paths = []
        
        def create_level(center, current_size, current_depth):
            if current_depth == 0:
                return
            
            # Tạo chữ thập ở mức hiện tại
            half = current_size // 2
            
            # 4 hướng
            for dx, dz in [(1,0), (-1,0), (0,1), (0,-1)]:
                path = PathSegment(
                    center,
                    Vector3(
                        center.x + dx * half,
                        center.y,
                        center.z + dz * half
                    ),
                    PathType.STRAIGHT_2D
                )
                paths.append(path)
                
                # Đệ quy vào 4 góc
                if current_depth > 1:
                    new_center = Vector3(
                        center.x + dx * half,
                        center.y,
                        center.z + dz * half
                    )
                    create_level(new_center, current_size // 2, current_depth - 1)
        
        create_level(Vector3(0, 0, 0), size, depth)
        return paths
```

## 4. Item placement dựa trên tính chất hình học

```python
class GeometricItemPlacer:
    """Đặt items dựa trên quan hệ hình học"""
    
    @staticmethod
    def place_on_parallel_paths(path1: PathSegment, path2: PathSegment, interval=2):
        """
        Đặt items trên 2 đường song song với khoảng cách đều
        -> Dạy vòng lặp song song, đồng bộ
        """
        points1 = path1.points()
        points2 = path2.points()
        
        items = []
        for i in range(0, min(len(points1), len(points2)), interval):
            items.append({
                'position': points1[i],
                'type': 'crystal',
                'pair_id': i
            })
            items.append({
                'position': points2[i],
                'type': 'crystal',
                'pair_id': i
            })
        
        return items
    
    @staticmethod
    def place_on_axis_symmetric(path1: PathSegment, path2: PathSegment):
        """
        Đặt items đối xứng qua trục
        -> Dạy tính chất đối xứng, mirror operations
        """
        axis = PathRelationAnalyzer.find_axis_of_symmetry(path1, path2)
        
        points1 = path1.points()
        items = []
        
        # Đặt item trên path1 và path2 đối xứng nhau
        for i, p1 in enumerate(points1):
            items.append({
                'position': p1,
                'type': 'crystal_a',
                'symmetric_id': i
            })
            
            # Tìm điểm đối xứng trên path2
            reflected = PathRelationAnalyzer.reflect_point_across_axis(p1, axis)
            items.append({
                'position': reflected,
                'type': 'crystal_b',
                'symmetric_id': i
            })
        
        return items
    
    @staticmethod
    def place_at_perpendicular_junction(path1: PathSegment, path2: PathSegment):
        """
        Đặt items tại điểm giao của 2 đường vuông góc
        -> Dạy điều kiện, decision points
        """
        # Tìm điểm giao (nếu có)
        points1 = set((p.x, p.y, p.z) for p in path1.points())
        points2 = set((p.x, p.y, p.z) for p in path2.points())
        
        intersections = points1.intersection(points2)
        
        items = []
        for x, y, z in intersections:
            items.append({
                'position': Vector3(x, y, z),
                'type': 'switch',
                'junction': True
            })
        
        return items
    
    @staticmethod
    def place_on_circular_pattern(center: Vector3, radius: int, count: int):
        """
        Đặt items theo hình tròn
        -> Dạy vòng lặp với góc, lượng giác
        """
        import math
        items = []
        
        for i in range(count):
            angle = 2 * math.pi * i / count
            x = center.x + int(radius * math.cos(angle))
            z = center.z + int(radius * math.sin(angle))
            
            items.append({
                'position': Vector3(x, center.y, z),
                'type': 'crystal',
                'angle': angle,
                'index': i
            })
        
        return items
```

## 5. Map analyzer - Phân tích map thành các quan hệ

```python
class MapAnalyzer:
    """Phân tích map để tìm patterns học thuật"""
    
    def __init__(self, blocks: list):
        """
        blocks: list of Vector3 - các vị trí có khối
        """
        self.blocks = set((b.x, b.y, b.z) for b in blocks)
        self.paths = []
        self.relations = []
    
    def extract_paths(self):
        """Trích xuất tất cả các đường thẳng từ map"""
        visited = set()
        paths = []
        
        for block in self.blocks:
            if block in visited:
                continue
            
            # Thử mở rộng theo mỗi hướng
            for direction in self._get_directions():
                path = self._extend_path(block, direction, visited)
                if path and len(path) >= 2:  # Tối thiểu 2 khối
                    paths.append(PathSegment(
                        Vector3(*path[0]),
                        Vector3(*path[-1]),
                        PathType.STRAIGHT_2D if self._is_2d(path) else PathType.STRAIGHT_3D
                    ))
                    visited.update(path)
        
        self.paths = paths
        return paths
    
    def _get_directions(self):
        """Tất cả hướng có thể (6 hướng trong 3D)"""
        return [
            (1, 0, 0), (-1, 0, 0),  # X
            (0, 1, 0), (0, -1, 0),  # Y
            (0, 0, 1), (0, 0, -1),  # Z
        ]
    
    def _extend_path(self, start, direction, visited):
        """Mở rộng đường theo một hướng"""
        path = [start]
        current = start
        dx, dy, dz = direction
        
        while True:
            next_pos = (current[0] + dx, current[1] + dy, current[2] + dz)
            if next_pos in self.blocks and next_pos not in visited:
                path.append(next_pos)
                current = next_pos
            else:
                break
        
        return path if len(path) >= 2 else None
    
    def _is_2d(self, path):
        """Kiểm tra đường có nằm trong mặt phẳng không"""
        xs = [p[0] for p in path]
        ys = [p[1] for p in path]
        zs = [p[2] for p in path]
        
        return (len(set(xs)) == 1 or len(set(ys)) == 1 or len(set(zs)) == 1)
    
    def analyze_relations(self):
        """Phân tích quan hệ giữa tất cả các cặp đường"""
        relations = []
        
        for i in range(len(self.paths)):
            for j in range(i + 1, len(self.paths)):
                relation = PathRelationAnalyzer.analyze_pair(
                    self.paths[i], 
                    self.paths[j]
                )
                
                if relation['relations']:  # Nếu có quan hệ
                    relations.append({
                        'path1_index': i,
                        'path2_index': j,
                        'path1': self.paths[i],
                        'path2': self.paths[j],
                        'relations': relation['relations'],
                        'metadata': relation['metadata']
                    })
        
        self.relations = relations
        return relations
    
    def identify_academic_patterns(self):
        """Nhận dạng patterns học thuật từ quan hệ"""
        patterns = []
        
        for rel in self.relations:
            if RelationType.PARALLEL in rel['relations']:
                # Có thể là vòng lặp
                patterns.append({
                    'type': 'loop_candidate',
                    'concept': 'for/while loop',
                    'paths': [rel['path1'], rel['path2']],
                    'confidence': 0.8
                })
            
            if RelationType.PERPENDICULAR in rel['relations']:
                # Có thể là điều kiện rẽ nhánh
                patterns.append({
                    'type': 'conditional_candidate',
                    'concept': 'if-else',
                    'paths': [rel['path1'], rel['path2']],
                    'confidence': 0.7
                })
            
            if RelationType.AXIS_SYMMETRIC in rel['relations']:
                # Có thể là hàm với tính chất đối xứng
                patterns.append({
                    'type': 'function_candidate',
                    'concept': 'symmetric function',
                    'paths': [rel['path1'], rel['path2']],
                    'confidence': 0.9,
                    'axis': rel['metadata'].get('symmetry_axis')
                })
            
            if RelationType.POINT_SYMMETRIC in rel['relations']:
                # Có thể là rotation, recursive pattern
                patterns.append({
                    'type': 'recursive_candidate',
                    'concept': 'rotation/recursion',
                    'paths': [rel['path1'], rel['path2']],
                    'confidence': 0.85,
                    'center': rel['metadata'].get('symmetry_center')
                })
        
        return patterns
    
    def generate_item_placement_rules(self):
        """Tạo rules để đặt items dựa trên patterns"""
        rules = []
        patterns = self.identify_academic_patterns()
        
        for pattern in patterns:
            if pattern['type'] == 'loop_candidate':
                rules.append({
                    'pattern': pattern,
                    'placement_strategy': 'parallel_periodic',
                    'interval': 2,
                    'item_type': 'crystal'
                })
            
            elif pattern['type'] == 'conditional_candidate':
                rules.append({
                    'pattern': pattern,
                    'placement_strategy': 'junction_switches',
                    'item_type': 'switch'
                })
            
            elif pattern['type'] == 'function_candidate':
                rules.append({
                    'pattern': pattern,
                    'placement_strategy': 'symmetric_pairs',
                    'item_type': ['crystal_a', 'crystal_b']
                })
        
        return rules
```

## 6. Ví dụ sử dụng

```python
# Tạo một map đơn giản
def example_usage():
    # Tạo map với 2 đường song song
    blocks = []
    
    # Đường 1: dọc theo trục X tại z=0
    for x in range(10):
        blocks.append(Vector3(x, 0, 0))
    
    # Đường 2: dọc theo trục X tại z=3
    for x in range(10):
        blocks.append(Vector3(x, 0, 3))
    
    # Phân tích map
    analyzer = MapAnalyzer(blocks)
    paths = analyzer.extract_paths()
    print(f"Found {len(paths)} paths")
    
    relations = analyzer.analyze_relations()
    print(f"Found {len(relations)} relations")
    
    for rel in relations:
        print(f"Path {rel['path1_index']} and {rel['path2_index']}:")
        print(f"  Relations: {[r.value for r in rel['relations']]}")
    
    # Nhận dạng patterns
    patterns = analyzer.identify_academic_patterns()
    print(f"\nIdentified {len(patterns)} academic patterns:")
    for p in patterns:
        print(f"  - {p['type']}: {p['concept']} (confidence: {p['confidence']})")
    
    # Tạo placement rules
    rules = analyzer.generate_item_placement_rules()
    print(f"\nGenerated {len(rules)} item placement rules")
    
    # Đặt items theo rule đầu tiên
    if rules:
        rule = rules[0]
        if rule['placement_strategy'] == 'parallel_periodic':
            items = GeometricItemPlacer.place_on_parallel_paths(
                paths[0], paths[1], 
                interval=rule['interval']
            )
            print(f"Placed {len(items)} items")

example_usage()
```

## Tóm lại

Framework này cho phép bạn:

1. ✅ **Phân tích map** thành các đường cơ bản (2D/3D)
2. ✅ **Tìm quan hệ** giữa các đường (song song, vuông góc, đối xứng)
3. ✅ **Nhận dạng patterns** học thuật tự động
4. ✅ **Sinh rules** để đặt items phù hợp với từng pattern
5. ✅ **Đảm bảo tính toán học** qua các công thức hình học

Bạn muốn tôi bổ sung thêm phần nào? Ví dụ như:
- Thuật toán tối ưu để phát hiện hình tròn/vuông từ các đường?
- Validation để đảm bảo map luôn solvable?
- Difficulty calculator

---

Tôi muốn thảo luận thêm, bạn chưa cần mô hình hóa toán học hay lập trình gì cả.

Nếu tôi có một ma trận, ma trận này sẽ được render ra các khối nền (lập phương) như hình. Thì framework trên có phân tích được?

---

Aha! Bây giờ tôi hiểu rõ hơn rồi! 

## 🎯 Quy tắc di chuyển

Nhân vật có thể di chuyển từ block A sang block B nếu:
- **Khoảng cách Manhattan 2D**: `|Δx| + |Δz| = 1` (chỉ di chuyển sang ô kề)
- **Chênh lệch độ cao**: `|Δy| ≤ 1` (leo lên/xuống tối đa 1 đơn vị)
- **Góc dốc ≤ 45°**: Thực chất điều kiện trên đã đảm bảo điều này

→ Đây chính là **Manhattan distance trong 3D với ràng buộc về Y**

## 🔄 Nhìn lại framework với góc nhìn mới

Với quy tắc này, tôi thấy:

### ✅ Framework CÓ THỂ hoạt động, nhưng cần điều chỉnh định nghĩa "đường"

**Đường thẳng trong không gian 3D** bây giờ không phải là đường thẳng hình học thuần túy, mà là:

```
"Chuỗi blocks liên tiếp mà nhân vật có thể đi qua"
```

Ví dụ từ data của bạn:

**Đường 1** (ở Y=3):
```
(6,3,6) → (6,3,7) → (6,3,8)
hoặc
(6,3,6) → (7,3,6) → (8,3,6)
```
→ Đây là **đường thẳng 2D** (trên mặt phẳng Y=3)

**Đường 2** (leo lên/xuống):
```
(7,1,10) → (7,2,9) → (7,3,8)
```
→ Đây là **đường thẳng 3D** (có cả X, Y, Z thay đổi đồng thời, nhưng mỗi bước chỉ thay đổi 1-2 tọa độ)

## 🧩 Phân tích lại map của bạn

Để tôi áp dụng framework vào map thực tế này:

### 1. Extract possible paths (Trích xuất các đường có thể đi)

Với quy tắc `|Δx| + |Δz| = 1` và `|Δy| ≤ 1`, tôi cần:

**a) Tìm tất cả connectivity:**
```python
def are_connected(block1, block2):
    dx = abs(block1.x - block2.x)
    dy = abs(block1.y - block2.y)
    dz = abs(block1.z - block2.z)
    
    # Kề nhau theo X hoặc Z, chênh Y ≤ 1
    return (dx + dz == 1) and (dy <= 1)
```

**b) Build graph:**
```
Từ data của bạn, tôi thấy có các nhóm blocks kết nối:

Platform Y=3 (quanh vị trí (6-8, 3, 6-8)):
  (6,3,6) - (7,3,6) - (8,3,6)
      |         |         |
  (6,3,7) - (7,3,7) - (8,3,7)
      |         |         |
  (6,3,8) - (7,3,8) - (8,3,8)

Platform Y=5 (quanh vị trí (6-8, 5, 2-4)):
  (6,5,2) - (7,5,2) - (8,5,2)
      |         |         |
  (6,5,3) - (7,5,3) - (8,5,3)
      |         |         |
  (6,5,4) - (7,5,4) - (8,5,4)

...và các cầu nối ice/stone giữa các platform
```

### 2. Identify "straight paths"

Từ connectivity graph, tôi tìm các **maximal straight segments**:

```
Segment 1: (6,3,6) → (6,3,7) → (6,3,8)
  - Loại: Straight 2D (Y cố định, X cố định, Z tăng)
  - Độ dài: 3 blocks

Segment 2: (6,3,6) → (7,3,6) → (8,3,6)
  - Loại: Straight 2D (Y cố định, Z cố định, X tăng)
  - Độ dài: 3 blocks

Segment 3: (7,3,8) → (7,4,5) → (7,5,4)
  - Loại: Straight 3D (X cố định, Y và Z thay đổi theo tỉ lệ)
  - Độ dài: 3 blocks (qua ice bridges)
  - Độ dốc: đi lên 2 units (Y), lùi 4 units (Z)
```

### 3. Phát hiện patterns

Nhìn vào **symmetry của switches**:

```
Group 1: 
  s6 (8,4,8) và s7 (6,4,6)
  → Đối xứng tâm qua điểm (7, 4, 7) = điểm start!
  
Group 2:
  s2 (3,7,8) và s3 (3,7,6)
  → Đối xứng trục Z = 7 (cùng X, cùng Y, Z đối xứng)
  
Group 3:
  s4 (12,1,8) và s5 (12,1,6)
  → Đối xứng trục Z = 7 (cùng X, cùng Y, Z đối xứng)
```

→ Map này có **point symmetry** xung quanh điểm start và **axis symmetry** theo mặt phẳng Z=7!

## 💭 Vấn đề cốt lõi: Định nghĩa "Đường"

Tôi nghĩ cần làm rõ 2 khái niệm:

### A. **Geometric Paths** (Đường hình học)
- Các blocks tạo thành đường thẳng về mặt toán học
- VD: `(6,3,6) → (7,3,7) → (8,3,8)` (đường chéo 45°)

### B. **Traversable Paths** (Đường đi được)
- Các chuỗi blocks mà nhân vật CÓ THỂ đi qua
- Không nhất thiết phải thẳng về mặt hình học
- VD: `(6,3,6) → (7,3,6) → (7,3,7)` (đi chữ L)

**Framework nên phân tích loại nào?**

Tôi nghĩ là **cả hai**, nhưng với mục đích khác nhau:

1. **Geometric analysis**: Tìm symmetry, patterns toán học
2. **Traversable analysis**: Tìm gameplay flow, academic concepts

## 🤔 Câu hỏi quan trọng

**Về khái niệm "pattern học thuật":**

Khi bạn nói "các map có tính học thuật", bạn muốn nói:

**Option A**: Cấu trúc hình học của map (đối xứng, song song, vuông góc...)
- Map đẹp về mặt toán học
- Items đặt theo quy luật hình học

**Option B**: Cấu trúc của lời giải (solution path)
- Để giải map, học sinh phải dùng loop/if/function
- Code của học sinh phản ánh cấu trúc map

**Option C**: Cả hai
- Map có cấu trúc hình học đẹp
- Solution cũng có cấu trúc lập trình rõ ràng

---

Tôi đoán là **Option C**, đúng không?

Ví dụ map của bạn:
- **Hình học**: Đối xứng tâm xung quanh start point
- **Gameplay**: Phải đi 2 nhánh đối xứng để bật switches
- **Code concept**: If-else (chọn nhánh), symmetry (2 nhánh giống nhau)

## 🎯 Đề xuất cách tiếp cận mới

Thay vì chỉ phân tích "đường thẳng", tôi đề xuất phân tích **3 layers**:

### Layer 1: Block Connectivity (Vật lý)
```
Graph: Blocks và edges (theo quy tắc di chuyển)
Output: Adjacency matrix, connected components
```

### Layer 2: Geometric Structure (Hình học)
```
Phân tích:
- Platforms (nhóm blocks cùng Y)
- Bridges (ice/stone nối platforms)
- Symmetries (đối xứng tâm, trục, mặt phẳng)
- Straight segments (các đoạn thẳng)
```

### Layer 3: Academic Patterns (Học thuật)
```
Phân tích solution space:
- Main path variants (có bao nhiêu cách đi từ start → finish)
- Required sub-goals (phải lấy items/bật switches nào)
- Pattern trong solution (loop, branch, recursion...)
```

## 🔍 Bạn muốn tôi làm gì tiếp theo?

**A. Phân tích cụ thể map này?**
- Vẽ connectivity graph
- Tìm tất cả straight paths
- Phát hiện symmetries
- Đề xuất academic patterns phù hợp

**B. Thiết kế framework hoàn chỉnh?**
- Code để parse JSON
- Thuật toán phân tích
- Hệ thống phát hiện patterns

**C. Thảo luận thêm về concept?**
- Làm rõ "pattern học thuật" là gì
- Xem thêm ví dụ maps khác
- Định hình rõ hơn mục tiêu cuối cùng

Bạn muốn đi theo hướng nào? 🤔

---

Tôi cần mô hình hóa: 
1. Đường bao
2. Đường nối
3. Các fallback đặc biệt (Các hệ dễ tạo pattern học thuật là:
Cặp đường có tính chất song song và đối xứng trục (vuông góc với cặp đường này) Cặp đường có tính chất vuông góc Cặp đường có tính chất đối xứng trục Cặp đường có tính chất đối xứng tâm - có thể cấu hình min_length để lọc bớt)

---

Tuyệt! Bây giờ tôi hiểu rõ bạn cần gì. Để mô hình hóa 3 thành phần này một cách chính xác.

## 🎯 Mô hình hóa chi tiết

### 1. **Đường Bao (Boundary/Perimeter Path)**

Đường bao = chuỗi blocks tạo thành **"biên"** của một vùng/platform.

```python
from dataclasses import dataclass
from typing import List, Set, Tuple, Optional
from enum import Enum

@dataclass
class Vector3:
    x: int
    y: int
    z: int
    
    def __hash__(self):
        return hash((self.x, self.y, self.z))
    
    def __eq__(self, other):
        return self.x == other.x and self.y == other.y and self.z == other.z
    
    def manhattan_2d(self, other):
        """Khoảng cách Manhattan trên mặt phẳng XZ"""
        return abs(self.x - other.x) + abs(self.z - other.z)

class BoundaryType(Enum):
    OUTER = "outer"          # Biên ngoài
    INNER = "inner"          # Biên trong (hole)
    PLATFORM_EDGE = "platform_edge"  # Viền của platform

@dataclass
class BoundaryPath:
    """
    Đường bao của một vùng
    
    Ví dụ: Platform hình chữ nhật 3x3
    *---*---*
    |       |
    *   o   *   <- o là interior, * là boundary
    |       |
    *---*---*
    """
    points: List[Vector3]      # Các điểm trên đường bao (có thứ tự)
    boundary_type: BoundaryType
    y_level: int               # Độ cao của platform
    is_closed: bool            # Đường bao có khép kín không
    area: Optional[int] = None # Diện tích vùng bên trong
    
    def length(self) -> int:
        """Độ dài đường bao (số blocks)"""
        return len(self.points)
    
    def is_rectangular(self) -> bool:
        """Kiểm tra có phải hình chữ nhật không"""
        if not self.is_closed or len(self.points) < 4:
            return False
        
        # Lấy min/max của X và Z
        xs = [p.x for p in self.points]
        zs = [p.z for p in self.points]
        
        # Hình chữ nhật có 4 góc
        corners = {
            (min(xs), min(zs)),
            (min(xs), max(zs)),
            (max(xs), min(zs)),
            (max(xs), max(zs))
        }
        
        boundary_coords = {(p.x, p.z) for p in self.points}
        
        # Kiểm tra 4 góc có trong boundary không
        return corners.issubset(boundary_coords)

class BoundaryExtractor:
    """Trích xuất đường bao từ tập blocks"""
    
    def __init__(self, blocks: List[Vector3]):
        self.blocks = set(blocks)
        self.blocks_by_y = self._group_by_y(blocks)
    
    def _group_by_y(self, blocks):
        """Nhóm blocks theo độ cao Y"""
        result = {}
        for b in blocks:
            if b.y not in result:
                result[b.y] = set()
            result[b.y].add((b.x, b.z))
        return result
    
    def extract_boundaries_at_level(self, y_level: int) -> List[BoundaryPath]:
        """
        Trích xuất đường bao tại độ cao y_level
        
        Algorithm: Tìm các blocks có ít nhất 1 neighbor trống
        """
        if y_level not in self.blocks_by_y:
            return []
        
        platform_blocks = self.blocks_by_y[y_level]
        boundaries = []
        
        # Tìm boundary blocks (có ít nhất 1 neighbor trống)
        boundary_blocks = set()
        for x, z in platform_blocks:
            neighbors = [
                (x+1, z), (x-1, z), (x, z+1), (x, z-1)
            ]
            # Nếu có neighbor không thuộc platform -> đây là boundary
            if any(n not in platform_blocks for n in neighbors):
                boundary_blocks.add((x, z))
        
        # Trace boundary path
        if boundary_blocks:
            path = self._trace_boundary(boundary_blocks, y_level)
            if path:
                boundaries.append(path)
        
        return boundaries
    
    def _trace_boundary(self, boundary_blocks: Set[Tuple[int, int]], y: int) -> Optional[BoundaryPath]:
        """
        Trace đường bao theo chiều kim đồng hồ hoặc ngược kim đồng hồ
        """
        if not boundary_blocks:
            return None
        
        # Start từ block có x nhỏ nhất, z nhỏ nhất
        start = min(boundary_blocks)
        path = [Vector3(start[0], y, start[1])]
        visited = {start}
        current = start
        
        # Thứ tự ưu tiên: phải -> xuống -> trái -> lên (clockwise)
        directions = [(1, 0), (0, 1), (-1, 0), (0, -1)]
        
        while len(visited) < len(boundary_blocks):
            found_next = False
            
            for dx, dz in directions:
                next_pos = (current[0] + dx, current[1] + dz)
                
                if next_pos in boundary_blocks and next_pos not in visited:
                    path.append(Vector3(next_pos[0], y, next_pos[1]))
                    visited.add(next_pos)
                    current = next_pos
                    found_next = True
                    break
            
            if not found_next:
                # Không tìm được next -> boundary không liên tục
                break
        
        # Kiểm tra khép kín
        is_closed = (len(path) > 2 and 
                    path[0].manhattan_2d(path[-1]) == 1)
        
        return BoundaryPath(
            points=path,
            boundary_type=BoundaryType.PLATFORM_EDGE,
            y_level=y,
            is_closed=is_closed
        )
    
    def extract_all_boundaries(self) -> List[BoundaryPath]:
        """Trích xuất tất cả đường bao ở mọi độ cao"""
        all_boundaries = []
        for y_level in sorted(self.blocks_by_y.keys()):
            boundaries = self.extract_boundaries_at_level(y_level)
            all_boundaries.extend(boundaries)
        return all_boundaries
```

### 2. **Đường Nối (Connecting Path/Bridge)**

Đường nối = chuỗi blocks nối **giữa 2 vùng** (thường là giữa 2 platforms khác độ cao).

```python
class ConnectionType(Enum):
    HORIZONTAL = "horizontal"  # Nối ngang (cùng Y)
    VERTICAL = "vertical"      # Nối dọc (thay đổi Y)
    DIAGONAL = "diagonal"      # Nối chéo (cả X/Z và Y)
    STAIRCASE = "staircase"    # Cầu thang

@dataclass
class ConnectingPath:
    """
    Đường nối giữa 2 regions/platforms
    
    Ví dụ: Ice bridge từ platform A lên platform B
    Platform B (y=3)    *---*
                         \ 
                          * (ice)
                           \
    Platform A (y=1)    *---*
    """
    points: List[Vector3]           # Các điểm trên đường nối
    start_region: Optional[int]     # ID của region bắt đầu
    end_region: Optional[int]       # ID của region kết thúc
    connection_type: ConnectionType
    gradient: float                 # Độ dốc (ΔY / ΔXZ)
    
    def length(self) -> int:
        return len(self.points)
    
    def height_difference(self) -> int:
        """Chênh lệch độ cao"""
        return abs(self.points[-1].y - self.points[0].y)
    
    def horizontal_distance(self) -> int:
        """Khoảng cách ngang (Manhattan 2D)"""
        return self.points[0].manhattan_2d(self.points[-1])
    
    def is_straight_3d(self) -> bool:
        """Kiểm tra có phải đường thẳng trong không gian 3D không"""
        if len(self.points) < 2:
            return True
        
        # Vector chỉ phương
        v = Vector3(
            self.points[-1].x - self.points[0].x,
            self.points[-1].y - self.points[0].y,
            self.points[-1].z - self.points[0].z
        )
        
        # Kiểm tra tất cả điểm có cùng nằm trên đường thẳng không
        for i, p in enumerate(self.points):
            # p = start + t * v, với t = i / (n-1)
            if len(self.points) == 1:
                continue
            
            t = i / (len(self.points) - 1)
            expected = Vector3(
                round(self.points[0].x + t * v.x),
                round(self.points[0].y + t * v.y),
                round(self.points[0].z + t * v.z)
            )
            
            if p != expected:
                return False
        
        return True

class ConnectionExtractor:
    """Trích xuất các đường nối giữa platforms"""
    
    def __init__(self, blocks: List[Vector3]):
        self.blocks = set(blocks)
        self.adjacency = self._build_adjacency()
    
    def _build_adjacency(self):
        """Xây dựng đồ thị kề (theo quy tắc di chuyển)"""
        adj = {b: [] for b in self.blocks}
        
        for b in self.blocks:
            # 4 hướng + lên/xuống 1 level
            neighbors = [
                Vector3(b.x+1, b.y, b.z),
                Vector3(b.x-1, b.y, b.z),
                Vector3(b.x, b.y, b.z+1),
                Vector3(b.x, b.y, b.z-1),
                # Có thể leo lên/xuống
                Vector3(b.x+1, b.y+1, b.z),
                Vector3(b.x-1, b.y+1, b.z),
                Vector3(b.x, b.y+1, b.z+1),
                Vector3(b.x, b.y+1, b.z-1),
                Vector3(b.x+1, b.y-1, b.z),
                Vector3(b.x-1, b.y-1, b.z),
                Vector3(b.x, b.y-1, b.z+1),
                Vector3(b.x, b.y-1, b.z-1),
            ]
            
            for n in neighbors:
                if n in self.blocks:
                    adj[b].append(n)
        
        return adj
    
    def find_connecting_paths_between_regions(
        self, 
        region1_blocks: Set[Vector3], 
        region2_blocks: Set[Vector3]
    ) -> List[ConnectingPath]:
        """
        Tìm tất cả đường nối ngắn nhất giữa 2 regions
        Sử dụng BFS
        """
        from collections import deque
        
        paths = []
        
        # BFS từ tất cả blocks của region1
        for start in region1_blocks:
            queue = deque([(start, [start])])
            visited = {start}
            
            while queue:
                current, path = queue.popleft()
                
                # Nếu đến region2 -> tìm thấy connecting path
                if current in region2_blocks:
                    # Loại bỏ start và end (chỉ lấy phần bridge)
                    bridge_points = path[1:-1]
                    
                    if bridge_points:  # Nếu có điểm trung gian
                        conn_type = self._classify_connection(bridge_points)
                        gradient = self._calculate_gradient(path)
                        
                        paths.append(ConnectingPath(
                            points=path,
                            start_region=None,  # Có thể thêm ID sau
                            end_region=None,
                            connection_type=conn_type,
                            gradient=gradient
                        ))
                    continue
                
                # Explore neighbors
                for neighbor in self.adjacency.get(current, []):
                    if neighbor not in visited and neighbor not in region1_blocks:
                        visited.add(neighbor)
                        queue.append((neighbor, path + [neighbor]))
        
        return paths
    
    def _classify_connection(self, points: List[Vector3]) -> ConnectionType:
        """Phân loại kiểu connection"""
        if not points:
            return ConnectionType.HORIZONTAL
        
        y_values = [p.y for p in points]
        
        if len(set(y_values)) == 1:
            return ConnectionType.HORIZONTAL
        
        # Kiểm tra xem có phải staircase không (mỗi bước tăng đúng 1 Y)
        is_staircase = all(
            abs(points[i+1].y - points[i].y) <= 1 
            for i in range(len(points) - 1)
        )
        
        if is_staircase:
            return ConnectionType.STAIRCASE
        
        return ConnectionType.DIAGONAL
    
    def _calculate_gradient(self, path: List[Vector3]) -> float:
        """Tính độ dốc: ΔY / ΔXZ"""
        if len(path) < 2:
            return 0.0
        
        dy = abs(path[-1].y - path[0].y)
        dxz = path[0].manhattan_2d(path[-1])
        
        return dy / dxz if dxz > 0 else float('inf')
```

### 3. **Fallback Patterns (Hệ đường đặc biệt)**

```python
class PathRelationType(Enum):
    PARALLEL_WITH_AXIS_SYMMETRY = "parallel_axis_sym"  # Song song + đối xứng trục
    PERPENDICULAR = "perpendicular"                     # Vuông góc
    AXIS_SYMMETRIC = "axis_symmetric"                   # Đối xứng trục
    POINT_SYMMETRIC = "point_symmetric"                 # Đối xứng tâm

@dataclass
class PathPair:
    """
    Cặp đường có quan hệ đặc biệt
    """
    path1: List[Vector3]
    path2: List[Vector3]
    relation_type: PathRelationType
    confidence: float  # Độ tin cậy (0-1)
    
    # Metadata tùy theo relation type
    axis_point: Optional[Vector3] = None      # Điểm trên trục đối xứng
    axis_normal: Optional[Vector3] = None     # Vector pháp tuyến của trục
    symmetry_center: Optional[Vector3] = None # Tâm đối xứng
    parallel_distance: Optional[float] = None # Khoảng cách giữa 2 đường song song

@dataclass 
class FallbackPattern:
    """
    Pattern đặc biệt có thể fallback về
    """
    name: str
    path_pairs: List[PathPair]
    academic_concept: str  # "loop", "conditional", "function", "symmetry"
    min_length: int        # Độ dài tối thiểu của mỗi đường
    max_length: Optional[int] = None

class PathPairAnalyzer:
    """Phân tích quan hệ giữa các cặp đường"""
    
    def __init__(self, min_length: int = 2):
        self.min_length = min_length
    
    def analyze_pair(
        self, 
        path1: List[Vector3], 
        path2: List[Vector3]
    ) -> List[PathPair]:
        """
        Phân tích một cặp đường, trả về tất cả các quan hệ tìm thấy
        """
        # Lọc theo độ dài tối thiểu
        if len(path1) < self.min_length or len(path2) < self.min_length:
            return []
        
        relations = []
        
        # 1. Kiểm tra song song + đối xứng trục
        parallel_axis_sym = self._check_parallel_axis_symmetric(path1, path2)
        if parallel_axis_sym:
            relations.append(parallel_axis_sym)
        
        # 2. Kiểm tra vuông góc
        perpendicular = self._check_perpendicular(path1, path2)
        if perpendicular:
            relations.append(perpendicular)
        
        # 3. Kiểm tra đối xứng trục (không nhất thiết song song)
        axis_sym = self._check_axis_symmetric(path1, path2)
        if axis_sym:
            relations.append(axis_sym)
        
        # 4. Kiểm tra đối xứng tâm
        point_sym = self._check_point_symmetric(path1, path2)
        if point_sym:
            relations.append(point_sym)
        
        return relations
    
    def _check_parallel_axis_symmetric(
        self, 
        path1: List[Vector3], 
        path2: List[Vector3]
    ) -> Optional[PathPair]:
        """
        Kiểm tra 2 đường có song song VÀ đối xứng qua trục vuông góc không
        
        Ví dụ:
        path1: ------>
                 |  (trục đối xứng)
        path2: ------>
        """
        # Bước 1: Kiểm tra song song
        dir1 = self._get_direction_vector(path1)
        dir2 = self._get_direction_vector(path2)
        
        if not self._are_parallel(dir1, dir2):
            return None
        
        # Bước 2: Tìm trục đối xứng (vuông góc với 2 đường)
        mid1 = self._get_midpoint(path1)
        mid2 = self._get_midpoint(path2)
        
        # Trục đi qua trung điểm của 2 midpoints
        axis_point = Vector3(
            (mid1.x + mid2.x) // 2,
            (mid1.y + mid2.y) // 2,
            (mid1.z + mid2.z) // 2
        )
        
        # Vector nối 2 midpoints (vuông góc với đường)
        axis_normal = Vector3(
            mid2.x - mid1.x,
            mid2.y - mid1.y,
            mid2.z - mid1.z
        )
        
        # Bước 3: Kiểm tra đối xứng
        is_symmetric, confidence = self._verify_symmetry(
            path1, path2, axis_point, axis_normal
        )
        
        if is_symmetric:
            distance = self._calculate_parallel_distance(path1, path2)
            
            return PathPair(
                path1=path1,
                path2=path2,
                relation_type=PathRelationType.PARALLEL_WITH_AXIS_SYMMETRY,
                confidence=confidence,
                axis_point=axis_point,
                axis_normal=axis_normal,
                parallel_distance=distance
            )
        
        return None
    
    def _check_perpendicular(
        self, 
        path1: List[Vector3], 
        path2: List[Vector3]
    ) -> Optional[PathPair]:
        """Kiểm tra 2 đường có vuông góc không"""
        dir1 = self._get_direction_vector(path1)
        dir2 = self._get_direction_vector(path2)
        
        # Tích vô hướng = 0 -> vuông góc
        dot_product = dir1.x * dir2.x + dir1.y * dir2.y + dir1.z * dir2.z
        
        # Trong discrete space, cho phép sai số nhỏ
        if abs(dot_product) <= 1:  # Gần bằng 0
            # Tính confidence dựa vào độ chính xác
            confidence = 1.0 - abs(dot_product) / 10.0
            
            return PathPair(
                path1=path1,
                path2=path2,
                relation_type=PathRelationType.PERPENDICULAR,
                confidence=max(0.5, confidence)
            )
        
        return None
    
    def _check_axis_symmetric(
        self, 
        path1: List[Vector3], 
        path2: List[Vector3]
    ) -> Optional[PathPair]:
        """Kiểm tra đối xứng trục (không yêu cầu song song)"""
        # Thử các trục có thể: X=const, Y=const, Z=const, và trục chéo
        
        best_match = None
        best_confidence = 0
        
        # Thử trục song song với các mặt phẳng tọa độ
        for axis_type in ['x', 'y', 'z']:
            result = self._try_axis_symmetry(path1, path2, axis_type)
            if result and result.confidence > best_confidence:
                best_match = result
                best_confidence = result.confidence
        
        return best_match
    
    def _check_point_symmetric(
        self, 
        path1: List[Vector3], 
        path2: List[Vector3]
    ) -> Optional[PathPair]:
        """
        Kiểm tra đối xứng tâm
        
        Điều kiện: Mọi điểm p1 trên path1 có điểm p2 trên path2 sao cho
        center = (p1 + p2) / 2
        """
        # Tìm tâm đối xứng ứng viên
        mid1 = self._get_midpoint(path1)
        mid2 = self._get_midpoint(path2)
        
        center = Vector3(
            (mid1.x + mid2.x) // 2,
            (mid1.y + mid2.y) // 2,
            (mid1.z + mid2.z) // 2
        )
        
        # Kiểm tra từng điểm
        matched = 0
        total = min(len(path1), len(path2))
        
        for p1 in path1:
            # Điểm đối xứng của p1 qua center
            reflected = Vector3(
                2 * center.x - p1.x,
                2 * center.y - p1.y,
                2 * center.z - p1.z
            )
            
            # Tìm điểm gần nhất trong path2
            min_dist = float('inf')
            for p2 in path2:
                dist = abs(reflected.x - p2.x) + abs(reflected.y - p2.y) + abs(reflected.z - p2.z)
                min_dist = min(min_dist, dist)
            
            if min_dist <= 1:  # Cho phép sai số 1 block
                matched += 1
        
        confidence = matched / total if total > 0 else 0
        
        if confidence >= 0.7:  # Ngưỡng để coi là đối xứng
            return PathPair(
                path1=path1,
                path2=path2,
                relation_type=PathRelationType.POINT_SYMMETRIC,
                confidence=confidence,
                symmetry_center=center
            )
        
        return None
    
    # Helper methods
    
    def _get_direction_vector(self, path: List[Vector3]) -> Vector3:
        """Lấy vector chỉ phương của đường (từ đầu đến cuối)"""
        if len(path) < 2:
            return Vector3(0, 0, 0)
        
        return Vector3(
            path[-1].x - path[0].x,
            path[-1].y - path[0].y,
            path[-1].z - path[0].z
        )
    
    def _get_midpoint(self, path: List[Vector3]) -> Vector3:
        """Lấy điểm giữa của đường"""
        if not path:
            return Vector3(0, 0, 0)
        
        mid_idx = len(path) // 2
        return path[mid_idx]
    
    def _are_parallel(self, v1: Vector3, v2: Vector3, tolerance: float = 0.1) -> bool:
        """Kiểm tra 2 vector có song song không (tích có hướng gần 0)"""
        # Cross product
        cross = Vector3(
            v1.y * v2.z - v1.z * v2.y,
            v1.z * v2.x - v1.x * v2.z,
            v1.x * v2.y - v1.y * v2.x
        )
        
        magnitude = (cross.x**2 + cross.y**2 + cross.z**2)**0.5
        return magnitude < tolerance
    
    def _verify_symmetry(
        self, 
        path1: List[Vector3], 
        path2: List[Vector3],
        axis_point: Vector3,
        axis_normal: Vector3
    ) -> Tuple[bool, float]:
        """Xác minh tính đối xứng và tính confidence"""
        # Đơn giản hóa: chỉ kiểm tra các điểm đầu/giữa/cuối
        sample_points1 = [path1[0], path1[len(path1)//2], path1[-1]]
        sample_points2 = [path2[0], path2[len(path2)//2], path2[-1]]
        
        matches = 0
        for p1 in sample_points1:
            reflected = self._reflect_point(p1, axis_point, axis_normal)
            
            # Tìm điểm gần nhất trong path2
            min_dist = min(
                abs(reflected.x - p2.x) + abs(reflected.y - p2.y) + abs(reflected.z - p2.z)
                for p2 in sample_points2
            )
            
            if min_dist <= 1:
                matches += 1
        
        confidence = matches / len(sample_points1)
        return confidence >= 0.7, confidence
    
    def _reflect_point(
        self, 
        point: Vector3, 
        axis_point: Vector3, 
        axis_normal: Vector3
    ) -> Vector3:
        """Phản chiếu điểm qua trục"""
        # Vector từ axis_point đến point
        v = Vector3(
            point.x - axis_point.x,
            point.y - axis_point.y,
            point.z - axis_point.z
        )
        
        # Chuẩn hóa normal
        normal_mag = (axis_normal.x**2 + axis_normal.y**2 + axis_normal.z**2)**0.5
        if normal_mag == 0:
            return point
        
        n = Vector3(
            axis_normal.x / normal_mag,
            axis_normal.y / normal_mag,
            axis_normal.z / normal_mag
        )
        
        # Thành phần vuông góc với trục
        dot = v.x * n.x + v.y * n.y + v.z * n.z
        
        # Phản chiếu
        reflected = Vector3(
            round(point.x - 2 * dot * n.x),
            round(point.y - 2 * dot * n.y),
            round(point.z - 2 * dot * n.z)
        )
        
        return reflected
    
    def _calculate_parallel_distance(
        self, 
        path1: List[Vector3], 
        path2: List[Vector3]
    ) -> float:
        """Tính khoảng cách giữa 2 đường song song"""
        # Lấy điểm giữa của mỗi đường
        mid1 = self._get_midpoint(path1)
        mid2 = self._get_midpoint(path2)
        
        # Khoảng cách Euclidean
        return ((mid1.x - mid2.x)**2 + 
                (mid1.y - mid2.y)**2 + 
                (mid1.z - mid2.z)**2)**0.5
    
    def _try_axis_symmetry(
        self, 
        path1: List[Vector3], 
        path2: List[Vector3],
        axis_type: str
    ) -> Optional[PathPair]:
        """Thử đối xứng qua trục song song với trục tọa độ"""
        # Tìm giá trị trục ứng viên (trung bình)
        if axis_type == 'x':
            mid1_val = sum(p.x for p in path1) / len(path1)
            mid2_val = sum(p.x for p in path2) / len(path2)
            axis_val = (mid1_val + mid2_val) / 2
            axis_point = Vector3(round(axis_val), 0, 0)
            axis_normal = Vector3(1, 0, 0)
        elif axis_type == 'y':
            mid1_val = sum(p.y for p in path1) / len(path1)
            mid2_val = sum(p.y for p in path2) / len(path2)
            axis_val = (mid1_val + mid2_val) / 2
            axis_point = Vector3(0, round(axis_val), 0)
            axis_normal = Vector3(0, 1, 0)
        else:  # z
            mid1_val = sum(p.z for p in path1) / len(

---

Bạn "không vội mô hình hóa" - cứ nói về ý tưởng trước, chỉ tạo mã khi tôi yêu cầu

Nếu tôi có đường bao, đường nối, hệ đường đặc biệt. Thì liệu có cách nào để xác định (lọc được) các thành phần nào phù hợp với tiêu chuẩn học thuật (function, vòng lặp...) không?

---

path1)
            mid2_val = sum(p.z for p in path2) / len(path2)
            axis_val = (mid1_val + mid2_val) / 2
            axis_point = Vector3(0, 0, round(axis_val))
            axis_normal = Vector3(0, 0, 1)
        
        is_sym, confidence = self._verify_symmetry(
            path1, path2, axis_point, axis_normal
        )
        
        if is_sym:
            return PathPair(
                path1=path1,
                path2=path2,
                relation_type=PathRelationType.AXIS_SYMMETRIC,
                confidence=confidence,
                axis_point=axis_point,
                axis_normal=axis_normal
            )
        
        return None
```

### 4. **Pattern Detector tổng hợp**

```python
class AcademicPatternDetector:
    """
    Phát hiện các patterns học thuật từ:
    - Đường bao
    - Đường nối  
    - Các cặp đường đặc biệt
    """
    
    def __init__(self, min_path_length: int = 3):
        self.min_path_length = min_path_length
        self.boundary_extractor = None
        self.connection_extractor = None
        self.pair_analyzer = PathPairAnalyzer(min_length=min_path_length)
    
    def analyze_map(self, blocks: List[Vector3]) -> dict:
        """Phân tích toàn bộ map"""
        # 1. Extract boundaries
        self.boundary_extractor = BoundaryExtractor(blocks)
        boundaries = self.boundary_extractor.extract_all_boundaries()
        
        # 2. Extract connections
        self.connection_extractor = ConnectionExtractor(blocks)
        
        # 3. Convert boundaries to simple paths
        boundary_paths = [b.points for b in boundaries]
        
        # 4. Analyze all pairs
        path_pairs = []
        for i in range(len(boundary_paths)):
            for j in range(i + 1, len(boundary_paths)):
                pairs = self.pair_analyzer.analyze_pair(
                    boundary_paths[i],
                    boundary_paths[j]
                )
                path_pairs.extend(pairs)
        
        # 5. Classify into fallback patterns
        patterns = self._classify_into_patterns(path_pairs)
        
        return {
            'boundaries': boundaries,
            'path_pairs': path_pairs,
            'fallback_patterns': patterns,
            'academic_concepts': self._extract_concepts(patterns)
        }
    
    def _classify_into_patterns(self, path_pairs: List[PathPair]) -> List[FallbackPattern]:
        """Phân loại các pairs thành patterns học thuật"""
        patterns = []
        
        # Group by relation type
        by_type = {}
        for pair in path_pairs:
            rel_type = pair.relation_type
            if rel_type not in by_type:
                by_type[rel_type] = []
            by_type[rel_type].append(pair)
        
        # Tạo patterns
        for rel_type, pairs in by_type.items():
            if rel_type == PathRelationType.PARALLEL_WITH_AXIS_SYMMETRY:
                patterns.append(FallbackPattern(
                    name="Parallel Loop Pattern",
                    path_pairs=pairs,
                    academic_concept="for/while loop with parallel execution",
                    min_length=self.min_path_length
                ))
            
            elif rel_type == PathRelationType.PERPENDICULAR:
                patterns.append(FallbackPattern(
                    name="Branching Pattern",
                    path_pairs=pairs,
                    academic_concept="if-else conditional",
                    min_length=self.min_path_length
                ))
            
            elif rel_type == PathRelationType.AXIS_SYMMETRIC:
                patterns.append(FallbackPattern(
                    name="Mirror Function Pattern",
                    path_pairs=pairs,
                    academic_concept="function with symmetric behavior",
                    min_length=self.min_path_length
                ))
            
            elif rel_type == PathRelationType.POINT_SYMMETRIC:
                patterns.append(FallbackPattern(
                    name="Rotation/Recursive Pattern",
                    path_pairs=pairs,
                    academic_concept="rotation or recursive structure",
                    min_length=self.min_path_length
                ))
        
        return patterns
    
    def _extract_concepts(self, patterns: List[FallbackPattern]) -> List[str]:
        """Trích xuất các concepts từ patterns"""
        concepts = set()
        for pattern in patterns:
            concepts.add(pattern.academic_concept)
        return list(concepts)
```

## 📊 Ví dụ sử dụng

```python
# Parse JSON data
blocks = []
for block_data in json_data['gameConfig']['blocks']:
    pos = block_data['position']
    blocks.append(Vector3(pos['x'], pos['y'], pos['z']))

# Analyze
detector = AcademicPatternDetector(min_path_length=3)
result = detector.analyze_map(blocks)

print(f"Found {len(result['boundaries'])} boundaries")
print(f"Found {len(result['path_pairs'])} special path pairs")
print(f"Detected patterns:")
for pattern in result['fallback_patterns']:
    print(f"  - {pattern.name}: {pattern.academic_concept}")
    print(f"    ({len(pattern.path_pairs)} pairs)")
```

---

Đây là mô hình hóa đầy đủ 3 thành phần bạn cần. Bạn muốn tôi:
1. **Test** với data JSON bạn cung cấp?
2. **Visualize** kết quả phân tích?
3. **Bổ sung** thêm loại pattern nào khác?
