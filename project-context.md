# Project Context: React Quest (EdTech Coding)

## Overview
**React Quest** là nền tảng tự học lập trình dành cho học sinh lớp 3-8. Ứng dụng tập trung vào phương pháp "Learning by Doing" thông qua các bài học tương tác, kéo thả khối lệnh (Blockly) và game map thực tế.

## Core Applications

### 1. React Quest App (`apps/react-quest-app`)
*   **Type**: Interactive React Web App (Vite + React)
*   **Audience**: Học sinh (Lớp 3-8)
*   **Key Features**:
    *   **Game Player**: Môi trường chạy code và giải đố trên bản đồ (Grid Map).
    *   **Interactive Student Guide**: Hệ thống hướng dẫn bài học thông minh (Mới).
        *   Xem lý thuyết & Ví dụ khối lệnh (Render từ XML).
        *   **Live Demo**: Nút "Test Map" để load map và code mẫu vào workspace ngay lập tức.
        *   **Quiz**: Kiểm tra nhanh kiến thức sau mỗi bài.
*   **Tech**: React, Zustand, Blockly, PixiJS/Canvas (Game Engine).

### 2. Guide Builder (`apps/guide-builder`)
*   **Type**: Internal Tool (React)
*   **Audience**: Content Creators, Teachers
*   **Key Features**:
    *   **XML Block Editor**: Soạn thảo khối lệnh và xuất ra XML.
    *   **Content Editor**: Soạn thảo bài học (Markdown/Rich Text) tích hợp block XML.
    *   **Preview Mode**: Xem trước nội dung như trên Player.
*   **Tech**: React, Monaco Editor, Blockly.

## Data Flow & Architecture

### Interactive Guide Flow
1.  **Content Creator** dùng `guide-builder` tạo bài học -> Xuất ra JSON/XML.
2.  **Student** mở bài học trên `react-quest-app`.
3.  Hệ thống parse JSON:
    *   Text -> Hiển thị Markdown.
    *   XML Block -> Render thành hình ảnh tĩnh (BlockRenderer).
    *   Action "Test Map" -> Gọi `GameStore` -> Load Map ID & Inject XML vào Workspace.

## Current Development Status
*   **Guide Builder**: Đã có XML Editor, Toolbar cơ bản. Đang hoàn thiện Preview.
*   **Player Integration**: Đã hiển thị được Guide. Đang làm tính năng "Test Map" và Quiz.
*   **Content**: Đã xong 8/10 topics.

## Key Files & Directories
*   `AI_STARTUP.md`: **Master Entry File**.
*   `.antigravity/workflow_master.json`: Cấu hình luồng AI.
*   `apps/guide-builder/src/components/XmlBlockEditor.tsx`: Core component soạn thảo block.
*   `apps/react-quest-app/src/components/guide/`: Module hiển thị hướng dẫn.
*   `packages/game-logic/src/useGameStore.ts`: Quản lý state game.