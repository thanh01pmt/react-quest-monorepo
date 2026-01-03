# Change: Thêm Intro Scene Camera cho Quest Player 3D Maze

## Lý do

Quest Player hiện tại khi hiển thị maze 3D sẽ chuyển thẳng vào chế độ gameplay. Việc thêm một "Intro Scene" với camera bay theo quỹ đạo định sẵn sẽ giúp người chơi có cái nhìn tổng quan về màn chơi trước khi bắt đầu, tăng trải nghiệm và tính chuyên nghiệp.

## Những thay đổi chính

- **Thêm cấu hình `introScene`** vào `MazeConfig` type để cho phép kích hoạt và tùy chỉnh intro
- **Tạo `IntroSceneController` component mới** để quản lý animation camera theo các chế độ QuickShots
- **Cập nhật `CameraRig`** để hỗ trợ chế độ intro và chuyển mượt về Follow mode sau khi intro kết thúc
- **Cập nhật `Maze3DRenderer`** để tích hợp IntroSceneController

### Các chế độ QuickShots được hỗ trọ

| Chế độ | Mô tả | Tham số |
|--------|-------|---------|
| `dronie` | Camera bay lùi ra xa, giữ tâm màn chơi ở trung tâm khung hình | `distance` |
| `rocket` | Camera bay lên cao, hướng xuống | `height` |
| `circle` | Camera bay vòng quanh tâm màn chơi theo vòng tròn | `radius`, `loops` |
| `helix` | Camera bay xoắn ốc quanh tâm, vừa quay vừa lên cao | `radius`, `height`, `loops` |
| `boomerang` | Camera bay theo hình oval, lên cao rồi xuống thấp | `radiusX`, `radiusZ`, `height` |

## Tác động

- **Types**: Mở rộng `MazeConfig` interface
- **Components**: Thêm `IntroSceneController.tsx`, cập nhật `CameraRig.tsx`, `Maze3DRenderer.tsx`
- **Không có breaking changes**: Tính năng là optional, các quest hiện tại không cần thay đổi

> **Backward Compatibility**: Nếu `introScene` không được thiết lập trong quest JSON, hoặc có thiết lập nhưng `enabled = false`, thì màn chơi sẽ bắt đầu ngay lập tức như hiện tại. Mọi quest cũ vẫn hoạt động bình thường.
