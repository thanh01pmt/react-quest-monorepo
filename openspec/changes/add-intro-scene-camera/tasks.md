# Tasks: Thêm Intro Scene Camera

## 1. Cập nhật Types
- [x] 1.1 Thêm `IntroSceneConfig` interface vào `types/index.ts`
- [x] 1.2 Cập nhật `MazeConfig` interface để bao gồm `introScene?: IntroSceneConfig`

## 2. Tạo IntroSceneController Component
- [x] 2.1 Tạo file `games/maze/components/IntroSceneController.tsx`
- [x] 2.2 Implement hàm tính toán `mapCenter` từ blocks bounding box
- [x] 2.3 Implement trajectory functions cho từng QuickShots mode:
  - [x] 2.3.1 `dronie` - bay lùi theo trục Z
  - [x] 2.3.2 `rocket` - bay thẳng lên trục Y
  - [x] 2.3.3 `circle` - quay vòng tròn trên mặt phẳng XZ
  - [x] 2.3.4 `helix` - xoắn ốc (circle + tăng Y)
  - [x] 2.3.5 `boomerang` - ellipse + sin wave trên Y
- [x] 2.4 Implement animation loop với `useFrame`
- [x] 2.5 Implement callback `onComplete` khi animation kết thúc

## 3. Cập nhật CameraRig
- [x] 3.1 Thêm prop `introMode: boolean` để xác định camera đang ở chế độ intro
- [x] 3.2 Thêm prop `introPosition` và `introTarget` cho vị trí camera trong intro
- [x] 3.3 Implement smooth transition từ intro position về follow position

## 4. Cập nhật Maze3DRenderer
- [x] 4.1 Đọc `introScene` config từ `gameConfig`
- [x] 4.2 Thêm state `isIntroPlaying` để quản lý trạng thái intro
- [x] 4.3 Render `IntroSceneController` khi intro đang chạy
- [x] 4.4 Truyền callback để chuyển sang gameplay mode sau intro

## 5. Testing & Documentation
- [x] 5.1 Tạo quest JSON mẫu với `introScene` config
- [x] 5.2 Test từng chế độ QuickShots
- [x] 5.3 Test smooth transition về Follow mode
- [x] 5.4 Cập nhật README với hướng dẫn sử dụng introScene
