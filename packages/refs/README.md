# Procedural Map Generation Reference

Tài liệu tham khảo cho các phương pháp sinh map tự động trong educational game environments.

## 📁 Cấu trúc

```
refs/
├── README.md                           # File này
├── approaches/
│   ├── 01-pattern-based.md            # Pattern-Based (Bottom-up)
│   ├── 02-solution-driven.md          # Solution-Driven (Top-down)
│   └── 03-hybrid-strategy.md          # Hybrid approach
├── specifications/
│   ├── core-types.ts                  # Core TypeScript interfaces
│   ├── code-template.ts               # CodeTemplate specification
│   ├── pattern-library.ts             # Pattern system specification
│   └── pedagogy-config.ts             # Pedagogy configuration
├── architecture/
│   ├── interpreter.md                 # Interpreter architecture
│   ├── complexity-calculator.md       # Complexity scoring system
│   ├── error-recovery.md              # Error recovery framework
│   └── validation-system.md           # Validation & QA
└── examples/
    ├── templates/                     # Example CodeTemplates
    └── patterns/                      # Example Patterns
```

## 🎯 Tổng quan

### Mục tiêu
Xây dựng hệ thống sinh map tự động cho educational game, đảm bảo:
1. **Tính học thuật**: Map dạy được các khái niệm lập trình cụ thể
2. **Tính khả thi**: Map có thể giải được (solvable)
3. **Tính đa dạng**: Nhiều biến thể từ một template
4. **Phù hợp độ tuổi**: Điều chỉnh độ khó theo grade level

### Ba Phương pháp Tiếp cận

| Approach | Mô tả | Ưu điểm | Nhược điểm |
|----------|-------|---------|------------|
| **Pattern-Based** | Xây map từ các pattern nhỏ, ghép nối dần | Flexible, dense items | Khó đảm bảo pedagogy |
| **Solution-Driven** | Sinh map từ code mẫu (reverse engineering) | Pedagogy chặt chẽ | Ít variation |
| **Hybrid** | Kết hợp cả hai: core từ solution, noise từ pattern | Balance cả hai | Phức tạp hơn |

### Khái niệm Cơ bản

#### Movement Commands
```
moveForward()   - Di chuyển 1 bước theo hướng hiện tại
turnLeft()      - Quay trái 90°
turnRight()     - Quay phải 90°
```

#### Item Types
- **Collectibles**: Crystal (C), Key (K) - thu thập đơn giản
- **Interactibles**: Switch (S), Portal (P), Gate (G) - có logic tương tác

#### Coordinate Systems
- `path_coord`: Tất cả tọa độ nhân vật di chuyển qua
- `placement_coord`: Tọa độ có vật phẩm (⊂ path_coord)

## 📚 Đọc tiếp

1. [Pattern-Based Approach](./approaches/01-pattern-based.md)
2. [Solution-Driven Approach](./approaches/02-solution-driven.md)
3. [Hybrid Strategy](./approaches/03-hybrid-strategy.md)
4. [Core Types](./specifications/core-types.ts)
