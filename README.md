# AI Startup Project

## Thay Đổi Gần Đây

### 18/01/2026

- **Loại thay đổi: Feature (Quest Player)**
  - **Mô tả**: Thêm tính năng Fog Zone (vùng sương mù) cho Maze game và Console Panel để hiển thị log.
  - **Mục tiêu**: Tăng độ khó và tính tương tác cho game Maze, hỗ trợ debug thông qua Console.
  - **Tác động**: Người chơi sẽ gặp thử thách mới với vùng bị che khuất, developer có thể debug dễ dàng hơn.
  - **File liên quan**:
    - `[packages/quest-player/src/games/maze/components/FogZone.tsx](packages/quest-player/src/games/maze/components/FogZone.tsx)`
    - `[packages/quest-player/src/components/ConsolePanel/index.tsx](packages/quest-player/src/components/ConsolePanel/index.tsx)`
    - `[packages/quest-player/src/games/maze/MazeEngine.ts](packages/quest-player/src/games/maze/MazeEngine.ts)`

- **Loại thay đổi: Feature (Academic Map Generator)**
  - **Mô tả**: Thêm post-processor `addFogZone` để tự động thêm vùng sương mù vào map được sinh ra.
  - **Mục tiêu**: Tự động hóa việc tạo map có độ phức tạp cao hơn (có fog).
  - **Tác động**: Các map sinh ra sẽ có thêm yếu tố fog zone dựa trên cấu hình.
  - **File liên quan**:
    - `[packages/academic-map-generator/src/generator/solution-driven/post-processor/addFogZone.ts](packages/academic-map-generator/src/generator/solution-driven/post-processor/addFogZone.ts)`
    - `[packages/academic-map-generator/src/generator/solution-driven/SolutionDrivenGenerator.ts](packages/academic-map-generator/src/generator/solution-driven/SolutionDrivenGenerator.ts)`

- **Loại thay đổi: Fix (Map Builder & Quest App)**
  - **Mô tả**: Cập nhật UI/UX cho Map Builder và Practice Sidebar, sửa lỗi render Maze 3D.
  - **Mục tiêu**: Cải thiện trải nghiệm người dùng và sửa các lỗi hiển thị visual.
  - **Tác động**: Giao diện builder và player ổn định hơn.
  - **File liên quan**:
    - `[apps/map-builder-app/src/components/BuilderScene/index.tsx](apps/map-builder-app/src/components/BuilderScene/index.tsx)`
    - `[apps/react-quest-app/src/components/PracticeSidebar/index.tsx](apps/react-quest-app/src/components/PracticeSidebar/index.tsx)`

- **Loại thay đổi: Feature (Academic Map Generator)**
  - **Mô tả**: Thêm package `academic-map-generator` để tự động hóa việc tạo bản đồ học thuật, bao gồm các strategy, topology, và generator logic.
  - **Mục tiêu**: Cung cấp công cụ core để sinh ra cấu trúc bài học và map dựa trên các mẫu sư phạm.
  - **Tác động**: Tự động hóa quy trình tạo map và bài tập, giảm thiểu thao tác thủ công.
  - **File liên quan**:
    - `[packages/academic-map-generator/src/index.ts](packages/academic-map-generator/src/index.ts)`
    - `[packages/academic-map-generator/src/generator/strategies/StrategyRegistry.ts](packages/academic-map-generator/src/generator/strategies/StrategyRegistry.ts)`

- **Loại thay đổi: Feature (Quest Player)**
  - **Mô tả**: Tích hợp package `quest-player` với các game engine (Bird, Maze, Pond, Turtle) và UI editor.
  - **Mục tiêu**: Hoàn thiện client application cho việc chơi và tương tác với các bài tập lập trình.
  - **Tác động**: Cung cấp môi trường chạy game và editor hoàn chỉnh cho người dùng cuối.
  - **File liên quan**:
    - `[packages/quest-player/src/index.ts](packages/quest-player/src/index.ts)`

- **Loại thay đổi: Feature (Shared Templates)**
  - **Mô tả**: Bổ sung thư viện `shared-templates` chứa các mẫu bài tập chuẩn hóa (loop, logic, function) và script sinh dữ liệu.
  - **Mục tiêu**: Tạo nguồn tài nguyên bài tập tái sử dụng cho các ứng dụng trong hệ thống.
  - **Tác động**: Đảm bảo tính nhất quán của dữ liệu bài tập giữa các ứng dụng khác nhau.
  - **File liên quan**:
    - `[packages/shared-templates/src/bundled-templates.ts](packages/shared-templates/src/bundled-templates.ts)`
    - `[packages/shared-templates/templates/loop/LOOP_PROGRESSION.md](packages/shared-templates/templates/loop/LOOP_PROGRESSION.md)`

- **Loại thay đổi: Documentation/Ref**
  - **Mô tả**: Thêm package `refs` và các tài liệu phân tích kỹ thuật (practice_mode_analysis).
  - **Mục tiêu**: Lưu trữ tài liệu tham khảo kiến trúc và phân tích thuật toán practice mode.
  - **Tác động**: Hỗ trợ việc tra cứu và hiểu rõ logic hệ thống cho team phát triển.
  - **File liên quan**:
    - `[packages/refs/README.md](packages/refs/README.md)`
    - `[practice_mode_analysis.md](practice_mode_analysis.md)`

- **Loại thay đổi: Chore**
  - **Mô tả**: Cập nhật cấu hình dự án gốc và các script tiện ích.
  - **Mục tiêu**: Đảm bảo môi trường phát triển đồng bộ và cập nhật các dependency mới nhất.
  - **Tác động**: Ổn định quy trình build và test của toàn bộ monorepo.
  - **File liên quan**:
    - `[package.json](package.json)`
    - `[tsconfig.json](tsconfig.json)`

### 13/01/2026

- **Không có thay đổi đáng kể trong 24 giờ qua.**

### 12/01/2026

- **Không có thay đổi đáng kể trong 24 giờ qua.**

### 11/01/2026

- **Loại thay đổi: Feature (Guide Builder)**
  - **Mô tả**: Nâng cấp UI/UX cho Guide Builder bao gồm giao diện Glassmorphism, nút chuyển đổi Theme, và Selector chọn Map.
  - **Mục tiêu**: Cải thiện trải nghiệm biên soạn và đồng bộ giao diện với thiết kế hiện đại (Glassmorphism).
  - **Tác động**: Giao diện trực quan hơn, hỗ trợ "Edit on Click" và các thiết lập tùy chỉnh (theme, map).
  - **File liên quan**:
    - `[apps/guide-builder/src/components/XmlBlockEditor/XmlBlockEditor.tsx](apps/guide-builder/src/components/XmlBlockEditor/XmlBlockEditor.tsx)`
    - `[apps/guide-builder/src/components/XmlBlockEditor/XmlBlockEditor.css](apps/guide-builder/src/components/XmlBlockEditor/XmlBlockEditor.css)`
    - `[apps/guide-builder/src/components/GuideRenderer.tsx](apps/guide-builder/src/components/GuideRenderer.tsx)`

- **Loại thay đổi: Documentation/Analysis**
  - **Mô tả**: Thêm các tài liệu phân tích chế độ luyện tập (Practice Mode), ngữ cảnh dự án và các script kiểm thử thuật toán.
  - **Mục tiêu**: Cung cấp công cụ và tài liệu để phân tích thuật toán tạo bài tập và debug lỗi phát sinh.
  - **Tác động**: Hỗ trợ việc phát triển và bảo trì tính năng Practice Mode thông qua các test script (random pattern, reproduction).
  - **File liên quan**:
    - `[practice_mode_analysis.md](practice_mode_analysis.md)`
    - `[project-context.md](project-context.md)`
    - `[test-random-pattern.js](test-random-pattern.js)`
    - `[task.md](task.md)`

- **Loại thay đổi: Feature (Shared Templates)**
  - **Mô tả**: Tích hợp toàn bộ thư viện template bài tập (bundled-templates) và các script generate micro-patterns.
  - **Mục tiêu**: Đảm bảo sẵn sàng nguồn tài nguyên bài tập phong phú cho các ứng dụng client (Quest Player).
  - **Tác động**: Cung cấp hàng trăm mẫu bài tập (loop, logic, function) đã được parse và validate.
  - **File liên quan**:
    - `[packages/shared-templates/src/bundled-templates.ts](packages/shared-templates/src/bundled-templates.ts)`
    - `[packages/shared-templates/scripts/generate-micro-patterns.ts](packages/shared-templates/scripts/generate-micro-patterns.ts)`

- **Loại thay đổi: Chore**
  - **Mô tả**: Đồng bộ hóa và commit toàn bộ mã nguồn dự án vào repository (System Initialization).
  - **Mục tiêu**: Thiết lập trạng thái ban đầu cho repository với đầy đủ các package và ứng dụng.
  - **Tác động**: Tạo base code đầy đủ cho toàn bộ team để bắt đầu quy trình phát triển CI/CD.
  - **File liên quan**:
    - `[package.json](package.json)`
    - `[pnpm-lock.yaml](pnpm-lock.yaml)`

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
