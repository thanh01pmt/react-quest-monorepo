# BÀI 3: NGHỆ THUẬT GỠ LỖI (DEBUGGING)

Lập trình viên giỏi không phải là người không bao giờ mắc lỗi, mà là người biết cách tìm và sửa lỗi nhanh nhất. Quá trình này được gọi là **Gỡ lỗi (Debugging)**.

Trong bài học này, chúng ta sẽ học cách nhận diện và xử lý 4 loại lỗi (bug) phổ biến nhất trong lập trình điều khiển.

---

## I. LỖI THIẾU LỆNH (MISSING BLOCK)

Đây là lỗi xảy ra khi bạn quên mất một bước quan trọng, khiến nhân vật dừng lại giữa chừng hoặc bỏ qua vật phẩm.

- **Dấu hiệu**: Nhân vật đi đúng hướng nhưng đứng im trước khi tới đích hoặc trước khi nhặt được quà.
- **Cách gỡ lỗi**: Chạy thử từng bước (🐌), so sánh vị trí nhân vật đứng với các ô trên bản đồ để xem còn thiếu lệnh nào (đi tới, rẽ, hay nhặt quà).

![Nhân vật đứng im trước pha lê](missing_block_demo.png)
> **Ghi chú chụp ảnh**: Chụp nhân vật đứng ngay trước viên pha lê nhưng không nhặt.
> **AI Prompt**: "A 3D character in a maze game looking confused, standing right next to a crystal gem. One missing puzzle block icon above its head."

### VÍ DỤ: KHÚC CUA THIẾU LỆNH
- **Mô tả**: Nhân vật cần rẽ và nhặt quà nhưng lại bỏ sót một hành động.
- **Mã thử thách**: `COMMANDS_G312.CODING_COMMANDS_LOGIC-DEBUGGING.DEBUG_FIX_LOGIC.C198-var1`

<blocklyxml mapid="COMMANDS_G312.CODING_COMMANDS_LOGIC-DEBUGGING.DEBUG_FIX_LOGIC.C198-var1">
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="maze_start" deletable="false" movable="false">
    <statement name="DO">
      <block type="maze_turn">
        <field name="DIR">turnRight</field>
        <next>
          <block type="maze_turn">
            <field name="DIR">turnRight</field>
            <next>
              <block type="maze_moveForward">
                <next>
                  <block type="maze_toggle_switch">
                    <next>
                      <block type="maze_moveForward">
                        <next>
                          <block type="maze_collect">
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
                                              <block type="maze_moveForward">
                                                <next>
                                                  <block type="maze_toggle_switch">
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

## II. LỖI THỪA LỆNH (EXTRA BLOCK)

Ngược lại với thiếu, lỗi này xảy ra khi có những lệnh "đi dư" khiến nhân vật đâm vào tường hoặc thực hiện hành động vô nghĩa.

- **Dấu hiệu**: Nhân vật nhảy hoặc xoay vòng tại chỗ, hoặc đi quá đích.
- **Cách gỡ lỗi**: Kéo khối lệnh thừa ra khỏi chuỗi và bỏ vào **Thùng rác** (Hộp công cụ).

### VÍ DỤ: NGÃ BA RỐI RẮM
- **Mô tả**: Có những lệnh rẽ hoặc bật công tắc bị chèn nhầm vào chuỗi lệnh đúng.
- **Mã thử thách**: `COMMANDS_G312.CODING_COMMANDS_LOGIC-DEBUGGING.DEBUG_FIX_LOGIC.C231-var11`

<blocklyxml mapid="COMMANDS_G312.CODING_COMMANDS_LOGIC-DEBUGGING.DEBUG_FIX_LOGIC.C231-var11">
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="maze_start" deletable="false" movable="false">
    <statement name="DO">
      <block type="maze_moveForward">
        <next>
          <block type="maze_collect">
            <next>
              <block type="maze_moveForward">
                <next>
                  <block type="maze_toggle_switch">
                    <next>
                      <block type="maze_toggle_switch">
                        <next>
                          <block type="maze_moveForward">
                            <next>
                              <block type="maze_collect">
                                <next>
                                  <block type="maze_turn">
                                    <field name="DIR">turnLeft</field>
                                    <next>
                                      <block type="maze_moveForward">
                                        <next>
                                          <block type="maze_toggle_switch">
                                            <next>
                                              <block type="maze_turn">
                                                <field name="DIR">turnRight</field>
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

## III. LỖI SAI THAM SỐ (INCORRECT PARAMETER)

Khối lệnh là đúng loại, nhưng các tùy chọn bên trong lại bị chọn sai.

- **Dấu hiệu**: Thay vì rẽ trái thì nhân vật rẽ phải; thay vì nhặt đồ thì lại đi bật công tắc.
- **Cách gỡ lỗi**: Nhấp vào mũi tên nhỏ trên khối lệnh để chọn lại tham số chính xác.

<blocklyxml>
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="maze_turn">
    <field name="DIR">turnLeft</field>
  </block>
</xml>
</blocklyxml>
> *Gợi ý: Hãy kiểm tra kỹ xem nhân vật cần `rẽ trái` hay `rẽ phải` từ góc nhìn của chính nhân vật nhé!*

### VÍ DỤ: XOẮN ỐC NGƯỢC CHIỀU
- **Mô tả**: Toàn bộ các lệnh rẽ đều đang bị ngược hướng so với đường xoắn ốc.
- **Mã thử thách**: `COMMANDS_G312.CODING_COMMANDS_LOGIC-DEBUGGING.DEBUG_FIX_LOGIC.C268-var1`

<blocklyxml mapid="COMMANDS_G312.CODING_COMMANDS_LOGIC-DEBUGGING.DEBUG_FIX_LOGIC.C268-var1">
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="maze_start" deletable="false" movable="false">
    <statement name="DO">
      <block type="maze_turn">
        <field name="DIR">turnLeft</field>
        <next>
          <block type="maze_moveForward">
            <next>
              <block type="maze_turn">
                <field name="DIR">turnLeft</field>
                <next>
                  <block type="maze_moveForward">
                    <next>
                      <block type="maze_collect">
                        <next>
                          <block type="maze_moveForward">
                            <next>
                              <block type="maze_toggle_switch">
                                <next>
                                  <block type="maze_turn">
                                    <field name="DIR">turnLeft</field>
                                    <next>
                                      <block type="maze_moveForward">
                                        <next>
                                          <block type="maze_moveForward">
                                            <next>
                                              <block type="maze_moveForward">
                                                <next>
                                                  <block type="maze_collect">
                                                    <next>
                                                      <block type="maze_turn">
                                                        <field name="DIR">turnLeft</field>
                                                        <next>
                                                          <block type="maze_moveForward">
                                                            <next>
                                                              <block type="maze_moveForward">
                                                                <next>
                                                                  <block type="maze_toggle_switch">
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
        </next>
      </block>
    </statement>
  </block>
</xml>
</blocklyxml>

---

## IV. LỖI SAI THỨ TỰ (SEQUENCE ERROR)

Mọi mảnh ghép đều có mặt và tham số đều đúng, nhưng chúng bị xếp lộn xộn vị trí.

- **Dấu hiệu**: Nhân vật thực hiện các hành động đúng (như nhặt quà) nhưng lại làm... trước khi đi tới ô có quà.
- **Cách gỡ lỗi**: Kéo rời chuỗi lệnh và sắp xếp lại từng khối theo đúng trình tự thời gian.

### VÍ DỤ: SỬA LỖI GÓC CUA
- **Mã thử thách**: `COMMANDS_G312.CODING_COMMANDS_LOGIC-DEBUGGING.DEBUG_FIX_SEQUENCE.C167-var1`

<blocklyxml mapid="COMMANDS_G312.CODING_COMMANDS_LOGIC-DEBUGGING.DEBUG_FIX_SEQUENCE.C167-var1">
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="maze_start" deletable="false" movable="false">
    <statement name="DO">
      <block type="maze_turn">
        <field name="DIR">turnRight</field>
        <next>
          <block type="maze_moveForward">
            <next>
              <block type="maze_moveForward">
                <next>
                  <block type="maze_moveForward">
                    <next>
                      <block type="maze_collect">
                        <next>
                          <block type="maze_moveForward">
                            <next>
                              <block type="maze_toggle_switch">
                                <next>
                                  <block type="maze_turn">
                                    <field name="DIR">turnRight</field>
                                    <next>
                                      <block type="maze_moveForward">
                                        <next>
                                          <block type="maze_moveForward">
                                            <next>
                                              <block type="maze_toggle_switch">
                                                <next>
                                                  <block type="maze_moveForward">
                                                    <next>
                                                      <block type="maze_moveForward">
                                                        <next>
                                                          <block type="maze_collect"></block>
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

> **MẸO CỦA CHUYÊN GIA**: Khi gặp bug khó, bạn hãy dùng chế độ **Chạy Từng Bước (Step mode)**. 
> Mỗi khi một khối lệnh sáng lên, hãy nhìn xem nhân vật trên màn hình làm gì. Nếu hành động đó không giúp nhân vật tiến gần hơn tới mục tiêu, bạn đã tìm thấy "thủ phạm" rồi đấy!
