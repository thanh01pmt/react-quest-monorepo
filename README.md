# AI Startup Project

## Thay Đổi Gần Đây

### 09/01/2026

- **Loại thay đổi: Chore**
  - **Mô tả**: Thiết lập cấu trúc dự án monorepo với cấu hình gốc cho pnpm, TurboRepo và TypeScript.
  - **Mục tiêu**: Tạo nền tảng phát triển cho hệ thống đa gói (multi-package), quản lý dependency và build process hiệu quả.
  - **Tác động**: Cho phép phát triển song song các package `quest-player`, `shared-templates` và ứng dụng khác.
  - **File liên quan**:
    - `[pnpm-workspace.yaml](pnpm-workspace.yaml)`
    - `[turbo.json](turbo.json)`
    - `[tsconfig.json](tsconfig.json)`

- **Loại thay đổi: Feature**
  - **Mô tả**: Thêm package `quest-player`, một ứng dụng React/Vite tích hợp Blockly để chơi các trò chơi giáo dục (Maze, Bird, Pond, Turtle).
  - **Mục tiêu**: Cung cấp giao diện người dùng tương tác để học sinh giải các bài toán lập trình thông qua trò chơi trực quan.
  - **Tác động**: Đã có sẵn các trò chơi cơ bản, trình biên tập code (Blockly, Monaco), và hệ thống quản lý quest.
  - **File liên quan**:
    - `[packages/quest-player/src/index.ts](packages/quest-player/src/index.ts)`
    - `[packages/quest-player/src/components/QuestPlayer/index.tsx](packages/quest-player/src/components/QuestPlayer/index.tsx)`
    - `[packages/quest-player/src/games/index.ts](packages/quest-player/src/games/index.ts)`

- **Loại thay đổi: Feature**
  - **Mô tả**: Thêm package `shared-templates` chứa thư viện các mẫu bài tập (templates) dưới dạng Markdown và logic xử lý (parser, scoring).
  - **Mục tiêu**: Chuẩn hóa định dạng đề bài và cung cấp kho dữ liệu bài tập phong phú (logic, loop, function, etc.) để tái sử dụng.
  - **Tác động**: Các ứng dụng khác có thể import và sử dụng logic bài tập thống nhất từ package này.
  - **File liên quan**:
    - `[packages/shared-templates/src/index.ts](packages/shared-templates/src/index.ts)`
    - `[packages/shared-templates/templates/loop/simple-for-loop.md](packages/shared-templates/templates/loop/simple-for-loop.md)`
    - `[packages/shared-templates/src/parser.ts](packages/shared-templates/src/parser.ts)`

- **Loại thay đổi: Documentation**
  - **Mô tả**: Thêm package `refs` chứa tài liệu tham khảo về kiến trúc, phương pháp sư phạm và đặc tả kỹ thuật.
  - **Mục tiêu**: Lưu trữ kiến thức và hướng dẫn phát triển hệ thống, đảm bảo sự thống nhất về tư duy thiết kế.
  - **Tác động**: Giúp developer mới hiểu rõ về cấu trúc và định hướng của dự án.
  - **File liên quan**:
    - `[packages/refs/README.md](packages/refs/README.md)`
    - `[packages/refs/architecture/interpreter.md](packages/refs/architecture/interpreter.md)`

- **Loại thay đổi: Feature**
  - **Mô tả**: Thêm ứng dụng `guide-builder`, cung cấp công cụ để biên soạn và chỉnh sửa nội dung hướng dẫn.
  - **Mục tiêu**: Hỗ trợ quy trình tạo tài liệu hướng dẫn một cách trực quan và hiệu quả.
  - **Tác động**: Mở rộng khả năng của hệ thống với công cụ biên soạn chuyên biệt.
  - **File liên quan**:
    - `[apps/guide-builder/README.md](apps/guide-builder/README.md)`
    - `[apps/guide-builder/package.json](apps/guide-builder/package.json)`

- **Loại thay đổi: Feature**
  - **Mô tả**: Thêm package `academic-map-generator` bao gồm các công cụ và script để tạo bản đồ học thuật.
  - **Mục tiêu**: Tự động hóa việc xây dựng cấu trúc và lộ trình học tập từ dữ liệu đầu vào.
  - **Tác động**: Tăng cường khả năng xử lý dữ liệu học liệu và tạo roadmap tự động.
  - **File liên quan**:
    - `[packages/academic-map-generator/package.json](packages/academic-map-generator/package.json)`
    - `[packages/academic-map-generator/src](packages/academic-map-generator/src)`

- **Loại thay đổi: Documentation/Tooling**
  - **Mô tả**: Thêm các tài liệu đặc tả (`openspec`) và script tiện ích (`map-gen-script`, root scripts).
  - **Mục tiêu**: Chuẩn hóa các đặc tả kỹ thuật và cung cấp công cụ hỗ trợ quy trình phát triển.
  - **Tác động**: Cải thiện quy trình làm việc và đảm bảo tính nhất quán của dữ liệu.
  - **File liên quan**:
    - `[openspec](openspec)`
    - `[scripts/merge-topology-files.sh](scripts/merge-topology-files.sh)`
