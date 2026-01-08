# BÀI 1: KHÁM PHÁ HÀNH TINH LẬP TRÌNH & NHỮNG BƯỚC ĐI ĐẦU TIÊN

Chào mừng các bạn học sinh từ lớp 3 đến lớp 8 gia nhập đội ngũ "kỹ sư nhí"! Đây là nơi các bạn sẽ học cách ra lệnh cho nhân vật để vượt qua những thử thách cam go. Hãy cùng khám phá trạm điều khiển của mình nhé!


## I. LÀM QUEN VỚI TRẠM ĐIỀI KHIỂN (GIAO DIỆN)

Giao diện học tập của chúng ta giống như một buồng lái tàu không gian, chia thành các khu vực sau:


<Image src="https://statictuoitre.mediacdn.vn/thumb_w/640/2017/7-1512755474943.jpg" alt="Image Title" caption="Enter caption here" />

<div class="guide-video-container">
  <Video url="https://youtu.be/K6KbEnGnymk?si=l5DkWnURmhfhdqO3" />
</div>

> **Ghi chú chụp ảnh**: Chụp toàn màn hình ứng dụng khi đang hiển thị một bản đồ đơn giản. Đảm bảo thấy rõ cả vùng bản đồ và vùng lập trình.

### 1. KHU VỰC HIỂN THỊ (BẢN ĐỒ 3D)
Đây là thế giới nơi nhân vật sinh sống. Mọi lệnh bạn viết sẽ được nhân vật thực hiện tại đây.

![Thao tác điều hướng trên bản đồ Maze](maze_navigation.png)
> **Ghi chú chụp ảnh**: Chụp cận cảnh vùng bản đồ. Có thể thêm các mũi tên minh họa thao tác xoay (xoay vòng) và thu phóng (zoom in/out).

- **Xoay góc nhìn**: Nhấn giữ chuột (hoặc chạm vào màn hình iPad) và xoay để nhìn bản đồ từ nhiều hướng.
- **Phóng to/Thu nhỏ**: Cuộn con lăn chuột hoặc dùng 2 ngón tay thu phóng để quan sát kỹ các ngóc ngách.
- **Nút máy ảnh**: Góc nhìn từ trên xuống (giúp lập kế hoạch) hoặc góc nhìn 3D (giúp quan sát độ cao).

### 2. KHU VỰC LẬP TRÌNH (VÙNG TRẮNG BÊN PHẢI)
Nơi bạn lắp ghép các khối lệnh.

![Khu vực Hộp công cụ và Khu vực làm việc](toolbox_workspace.png)
> **Ghi chú chụp ảnh**: Chụp vùng bên phải. Mở một danh mục trong hộp công cụ để thấy các khối lệnh bên trong.
> **Minh họa**: Một tấm ảnh động (GIF) hoặc ảnh tĩnh chụp cảnh đang kéo một khối lệnh từ hộp công cụ vào khu vực làm việc.

- **Hộp công cụ**: Chứa các "viên gạch" mệnh lệnh. Hãy kéo chúng ra khu vực lập trình.
- **Tháo lắp khối**: Các khối có mấu nối. Bạn phải lắp chúng khít vào nhau như chơi lego.
- **Thao tác nhanh**:
    - **Xóa**: Kéo khối thả vào thùng rác hoặc nhấn phím delete.
    - **Tạo bản sao**: Chuột phải vào khối đó để tạo thêm một khối y hệt.
    - **Thêm bình luận**: Dùng để giải thích mã lệnh của mình cho bạn bè hoặc thầy cô.

### 3. CÁC NÚT ĐIỀU KHIỂN QUAN TRỌNG
![Cụm nút điều khiển Chạy, Gỡ lỗi, Làm lại](control_buttons.png)
> **Ghi chú chụp ảnh**: Chụp cận cảnh thanh công cụ chứa các nút chạy, gỡ lỗi và làm lại.

- ▶️ **Chạy**: Bắt đầu thực hiện chương trình.
- 🐌 **Gỡ lỗi**: Chạy từng khối lệnh một. Rất hữu ích khi bạn muốn biết chính xác mình bị sai ở bước nào.
- 🔄 **Làm lại**: Đưa nhân vật về vạch xuất phát.

---

## II. LƯU Ý VỀ CÁC CHỈ SỐ (SỐ KHỐI)

Ở trên cùng, bạn sẽ thấy con số **số khối**.

![Chỉ số đếm khối và số khối tối ưu](block_indicator.png)
> **Ghi chú chụp ảnh**: Chụp phần thống kê thử thách hiển thị "số khối" và "số khối tối ưu".

- **Số khối hiện tại**: Số lượng lệnh bạn đã dùng.
- **Số khối tối ưu**: Đây là mục tiêu bạn cần đạt được. Một lập trình viên giỏi là người giải quyết vấn đề bằng số bước ít nhất và gọn gàng nhất.

> [!IMPORTANT]
> **Khối "khi Chạy được nhấn"**: Đây là khối quan trọng nhất! Mọi lệnh bạn muốn chạy đều phải gắn vào khối này.
> ![Minh họa khối lệnh được gắn vào khối khi Chạy được nhấn](when_run_logic.png)
> **Ghi chú chụp ảnh**: Chụp 2 kịch bản: Một là khối lệnh được lắp khít vào dưới khối "khi Chạy được nhấn" (có màu sáng), hai là khối lệnh nằm rời rạc (có màu mờ đi).

---

## III. KIẾN THỨC BÀI HỌC: CÂU LỆNH (MỆNH LỆNH)

### 1. CÂU LỆNH LÀ GÌ?
Máy tính rất thông minh nhưng cũng rất... máy móc. Nó không biết tự đoán ý bạn đâu. Câu lệnh là một chỉ dẫn cực kỳ chính xác.

![Sự khác biệt giữa lời nói con người và lệnh cho robot](human_vs_robot_analogy.png)
> **Prompt tạo ảnh (AI)**: "A split screen illustration. On the left: a child asking a mother for food with a simple speech bubble 'I am hungry'. On the right: the same child giving a step-by-step flowchart to a friendly robot: 'Move 5 steps, Turn left, Open fridge, Pick apple'. Modern, clean flat vector style for children."

- **Ví dụ thực tế**: Nếu bạn bảo mẹ "con đói", mẹ sẽ lấy cơm. Nhưng nếu bảo robot "đi lấy cơm", nó sẽ hỏi "đi hướng nào? bước bao nhiêu bước?". Bạn phải ra lệnh thật chi tiết!

### 2. CÁC LỆNH DI CHUYỂN CƠ BẢN

- **Đi tới**: Tiến lên đúng 1 ô theo hướng mặt nhân vật.
<blocklyxml>
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="maze_moveForward"></block>
</xml>
</blocklyxml>

- **Quay**: Xoay người (quay qua trái hoặc quay qua phải) 90 độ tại chỗ. **Lưu ý**: Quay người xong nhân vật vẫn đứng yên, bạn phải thêm lệnh `đi tới` thì nhân vật mới di chuyển tiếp được.
<blocklyxml>
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="maze_turn">
    <field name="DIR">turnLeft</field>
  </block>
</xml>
</blocklyxml>

- **Nhảy tới**: Vượt qua hố hoặc bám lên bậc cao.
<blocklyxml>
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="maze_jump"></block>
</xml>
</blocklyxml>

---

## IV. CÁC VÍ DỤ THỰC TẾ (BÀI MẪU)

### THỬ THÁCH 1: ĐƯỜNG THẲNG ĐƠN GIẢN
![Bản đồ đường thẳng 2 ô](map_straight_line.png)
> **Ghi chú chụp ảnh**: Chụp bản đồ `COMMANDS_G3...C1-var1` ở góc nhìn 3D rõ ràng.

- **Mã thử thách**: `COMMANDS_G3.CODING_COMMANDS_BASIC-MOVEMENT.SIMPLE_APPLY.C1-var1`
- **Mô tả**: Đường đi thẳng tắp dài 2 ô.
- **Phân tích**: Nhân vật đang đứng ở ô 1, cần đi qua ô 2 để tới đích. Vậy ta cần 2 lần bước.

<blocklyxml mapid="COMMANDS_G3.CODING_COMMANDS_BASIC-MOVEMENT.SIMPLE_APPLY.C1-var1">
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="maze_start" deletable="false" movable="false">
    <statement name="DO">
      <block type="maze_moveForward">
        <next>
          <block type="maze_moveForward"></block>
        </next>
      </block>
    </statement>
  </block>
</xml>
</blocklyxml>

---

### THỬ THÁCH 2: NGÃ RẼ ĐẦU TIÊN
![Bản đồ hình chữ L](map_l_shape.png)
> **Ghi chú chụp ảnh**: Chụp bản đồ `COMMANDS_G4...C6-var1`.

- **Mã thử thách**: `COMMANDS_G4.CODING_COMMANDS_BASIC-MOVEMENT.SIMPLE_APPLY.C6-var1`
- **Mô tả**: Đường đi có một góc vuông.
- **Phân tích**: Bạn phải phối hợp giữa đi tới và quay. 
- **Quy trình**: Quay qua trái sang hướng mới -> đi tới góc rẽ -> quay qua phải -> đi về đích.

<blocklyxml mapid="COMMANDS_G4.CODING_COMMANDS_BASIC-MOVEMENT.SIMPLE_APPLY.C6-var1">
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="maze_start" deletable="false" movable="false">
    <statement name="DO">
      <block type="maze_turn">
        <field name="DIR">turnLeft</field>
        <next>
          <block type="maze_moveForward">
            <next>
              <block type="maze_moveForward">
                <next>
                  <block type="maze_turn">
                    <field name="DIR">turnRight</field>
                    <next>
                      <block type="maze_moveForward">
                        <next>
                          <block type="maze_moveForward"></block>
                        </next>
                      </block>
                    </next>
                  </block>
                </next>
              </block>
            </next>
          </block>
        </next>
      </block>
    </statement>
  </block>
</xml>
</blocklyxml>

---

### THỬ THÁCH 3: NHẢY QUA RÀO CHẮN
![Bản đồ có vật cản và hố](map_u_jump.png)
> **Ghi chú chụp ảnh**: Chụp bản đồ `COMMANDS_G4...C11-var1`. Nên dùng góc nhìn 3D để lộ rõ sự thay đổi độ cao.

- **Mã thử thách**: `COMMANDS_G4.CODING_COMMANDS_BASIC-MOVEMENT.SIMPLE_APPLY.C11-var1`
- **Mô tả**: Giữa đường có vật cản hoặc hố sâu.
- **Kiến thức**: Lệnh `nhảy tới` có thể đưa bạn lên cao hoặc xuống thấp 1 bậc.

<blocklyxml mapid="COMMANDS_G4.CODING_COMMANDS_BASIC-MOVEMENT.SIMPLE_APPLY.C11-var1">
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="maze_start" deletable="false" movable="false">
    <statement name="DO">
      <block type="maze_jump">
        <next>
          <block type="maze_jump"></block>
        </next>
      </block>
    </statement>
  </block>
</xml>
</blocklyxml>

---

### THỬ THÁCH 4: NHIỆM VỤ THU THẬP PHA LÊ
![Bản đồ hình chữ S có pha lê](map_s_collect.png)
> **Ghi chú chụp ảnh**: Chụp bản đồ `COMMANDS_G312...C24-var1`. Thấy rõ viên pha lê lấp lánh trên đường.

- **Mô tả**: Bạn phải đi đến đúng ô có viên ngọc xanh và dùng lệnh **thu nhập vật phẩm**.
<blocklyxml>
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="maze_collect"></block>
</xml>
</blocklyxml>

- **Mã thử thách**: `COMMANDS_G312.CODING_COMMANDS_OBJECT-INTERACTION.SIMPLE_APPLY.C24-var1`
- **Lưu ý**: Phải đứng trên ô có vật phẩm thì lệnh `thu thập vật phẩm` mới có tác dụng nhé!

<blocklyxml mapid="COMMANDS_G312.CODING_COMMANDS_OBJECT-INTERACTION.SIMPLE_APPLY.C24-var1">
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="maze_start" deletable="false" movable="false">
    <statement name="DO">
      <block type="maze_moveForward">
        <next>
          <block type="maze_collect">
            <next>
              <block type="maze_moveForward">
                <next>
                  <block type="maze_turn">
                    <field name="DIR">turnLeft</field>
                    <next>
                      <block type="maze_moveForward">
                        <next>
                          <block type="maze_moveForward">
                            <next>
                              <block type="maze_turn">
                                <field name="DIR">turnRight</field>
                                <next>
                                  <block type="maze_moveForward">
                                    <next>
                                      <block type="maze_moveForward"></block>
                                    </next>
                                  </block>
                                </next>
                              </block>
                            </next>
                          </block>
                        </next>
                      </block>
                    </next>
                  </block>
                </next>
              </block>
            </next>
          </block>
        </next>
      </block>
    </statement>
  </block>
</xml>
</blocklyxml>

---

**Bạn đã nắm vững "bí kíp" chưa? Hãy bắt đầu thử thách đầu tiên và trở thành phù thủy lập trình ngay thôi!**
