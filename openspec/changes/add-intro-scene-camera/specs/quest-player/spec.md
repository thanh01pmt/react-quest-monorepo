# Quest Player Specification - Intro Scene Camera Delta

## ADDED Requirements

### Requirement: Intro Scene Configuration
Quest Player SHALL hỗ trợ cấu hình `introScene` trong `MazeConfig` để cho phép kích hoạt và tùy chỉnh camera animation khi bắt đầu màn chơi.

#### Scenario: Quest với introScene enabled
- **GIVEN** một quest JSON với `gameConfig.introScene.enabled = true`
- **WHEN** quest được load và render
- **THEN** camera SHALL thực hiện animation theo `introScene.type` trước khi chuyển về gameplay mode

#### Scenario: Quest không có introScene config
- **GIVEN** một quest JSON không có field `introScene` trong gameConfig
- **WHEN** quest được load
- **THEN** quest player SHALL hoạt động bình thường như hiện tại, không có intro animation, màn chơi bắt đầu ngay lập tức

#### Scenario: Quest có introScene nhưng enabled = false
- **GIVEN** một quest JSON với `gameConfig.introScene.enabled = false`
- **WHEN** quest được load
- **THEN** quest player SHALL bỏ qua intro animation và bắt đầu màn chơi ngay lập tức

---

### Requirement: Camera QuickShots Modes
Quest Player SHALL hỗ trợ 5 chế độ camera animation cho intro scene.

#### Scenario: Dronie mode
- **GIVEN** `introScene.type = "dronie"` với `distance = 20`
- **WHEN** intro animation chạy
- **THEN** camera SHALL di chuyển lùi ra xa tâm màn chơi một khoảng cách `distance` đơn vị trong suốt `duration` ms

#### Scenario: Rocket mode
- **GIVEN** `introScene.type = "rocket"` với `height = 30`
- **WHEN** intro animation chạy
- **THEN** camera SHALL bay lên cao `height` đơn vị và hướng xuống tâm màn chơi

#### Scenario: Circle mode
- **GIVEN** `introScene.type = "circle"` với `radius = 25, loops = 1`
- **WHEN** intro animation chạy với `duration = 5000ms`
- **THEN** camera SHALL hoàn thành đúng 1 vòng tròn quanh tâm màn chơi trong 5 giây

#### Scenario: Helix mode
- **GIVEN** `introScene.type = "helix"` với `radius = 20, height = 15, loops = 2`
- **WHEN** intro animation chạy
- **THEN** camera SHALL bay xoắn ốc, hoàn thành 2 vòng và tăng độ cao `height` đơn vị

#### Scenario: Boomerang mode
- **GIVEN** `introScene.type = "boomerang"` với `radiusX = 30, radiusZ = 20, height = 10`
- **WHEN** intro animation chạy
- **THEN** camera SHALL bay theo quỹ đạo oval và độ cao biến thiên theo hình sin

---

### Requirement: Tính toán tâm màn chơi
Quest Player SHALL tính toán tâm màn chơi từ bounding box của tất cả blocks.

#### Scenario: Tính tâm từ blocks
- **GIVEN** một maze với blocks trải từ `(0,0,0)` đến `(10,2,10)`
- **WHEN** IntroSceneController tính toán tâm
- **THEN** `mapCenter` SHALL là `(5, 1, 5)`

---

### Requirement: Smooth Transition sau Intro
Sau khi intro kết thúc, camera SHALL chuyển mượt về chế độ Follow player.

#### Scenario: Transition về Follow mode
- **GIVEN** intro animation đã hoàn thành
- **WHEN** chuyển sang gameplay mode
- **THEN** camera SHALL lerp từ vị trí cuối của intro về vị trí follow player trong khoảng 500-1000ms

---

### Requirement: Duration và Speed tự điều chỉnh
Tốc độ camera SHALL tự động điều chỉnh để hoàn thành animation đúng trong `duration` được cấu hình.

#### Scenario: Duration ngắn tăng tốc độ
- **GIVEN** `introScene.type = "circle"` với `loops = 2` và `duration = 2000ms`
- **WHEN** intro animation chạy
- **THEN** camera SHALL hoàn thành 2 vòng trong 2 giây (tốc độ nhanh hơn so với duration 4 giây)
