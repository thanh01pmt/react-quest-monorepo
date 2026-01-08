# BÀI 2: LẬP KẾ HOẠCH ĐA MỤC TIÊU (COMPLEX_APPLY)

Chào mừng bạn quay trở lại! Trong bài học này, chúng ta sẽ đương đầu với những bản đồ phức tạp hơn, đòi hỏi khả năng lập kế hoạch và phối hợp nhiều loại hành động cùng lúc.

---

## I. TƯƠNG TÁC VỚI ĐỐI TƯỢNG (OBJECT INTERACTION)

Ở các bài trước, bạn đã biết cách **thu thập vật phẩm** (pha lê). Trong bài này, chúng ta sẽ làm quen với một loại đối tượng mới: **Công tắc**.

![Nhân vật đứng cạnh công tắc](switch_demo.png)
> **Ghi chú chụp ảnh**: Chụp bản đồ `C56-var1` tại vị trí nhân vật đứng cạnh công tắc sàn.
> **AI Prompt**: "A 3D character from a coding game standing next to a glowing mechanical floor switch in a stone maze. Modern clean style."

- **Lệnh Kích hoạt công tắc**: Được dùng để bật hoặc tắt các thiết bị trên bản đồ (như cửa mở, cầu thang hiện ra).
<blocklyxml>
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="maze_toggle_switch"></block>
</xml>
</blocklyxml>

### VÍ DỤ: THỬ THÁCH HÌNH CHỮ U
- **Mô tả**: Bản đồ có dạng chữ U. Bạn cần đi đến cuối đường để bật công tắc, sau đó quay lại để về đích.
- **Mã thử thách**: `COMMANDS_G312.CODING_COMMANDS_OBJECT-INTERACTION.SIMPLE_APPLY.C56-var1`

<blocklyxml mapid="COMMANDS_G312.CODING_COMMANDS_OBJECT-INTERACTION.SIMPLE_APPLY.C56-var1">
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
                      <block type="maze_moveForward">
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
    </statement>
  </block>
</xml>
</blocklyxml>

---

## II. LẬP KẾ HOẠCH ĐA MỤC TIÊU (MULTI-OBJECTIVE)

Một lập trình viên giỏi luôn phải biết ưu tiên mục tiêu nào trước, mục tiêu nào sau để có lộ trình ngắn nhất.

- **Nhiệm vụ**: Vừa phải nhặt **pha lê**, vừa phải bật **công tắc**.
- **Kỹ thuật**: Hãy quan sát toàn bộ bản đồ để xem vật phẩm nào nằm gần đường đi của mình hơn.

### VÍ DỤ: BẢN ĐỒ HÌNH DẤU CỘNG (PLUS SHAPE)
- **Mô tả**: Các vật phẩm nằm ở các nhánh khác nhau của hình dấu cộng. Bạn cần nhặt pha lê trước rồi mới tới công tắc.
- **Mã thử thách**: `COMMANDS_G312.CODING_COMMANDS_MULTI-OBJECTIVE.COMPLEX_APPLY.C94-var1`

<blocklyxml mapid="COMMANDS_G312.CODING_COMMANDS_MULTI-OBJECTIVE.COMPLEX_APPLY.C94-var1">
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="maze_start" deletable="false" movable="false">
    <statement name="DO">
      <block type="maze_moveForward">
        <next>
          <block type="maze_collect">
            <next>
              <block type="maze_moveForward">
                <next>
                  <block type="maze_moveForward">
                    <next>
                      <block type="maze_moveForward">
                        <next>
                          <block type="maze_toggle_switch">
                            <next>
                              <block type="maze_turn">
                                <field name="DIR">turnLeft</field>
                                <next>
                                  <block type="maze_turn">
                                    <field name="DIR">turnLeft</field>
                                    <next>
                                      <block type="maze_moveForward">
                                        <next>
                                          <block type="maze_moveForward">
                                            <next>
                                              <block type="maze_turn">
                                                <field name="DIR">turnLeft</field>
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
    </statement>
  </block>
</xml>
</blocklyxml>

---

## III. DI CHUYỂN TRONG KHÔNG GIAN 3D (3D MOVEMENT)

Bản đồ 3D mang lại thử thách về độ cao. Bạn không thể chỉ "đi bộ" qua các vách đá.

- **Dùng lệnh Nhảy tới**: Để leo lên các bậc cao hoặc băng qua các hố sâu.
<blocklyxml>
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="maze_jump"></block>
</xml>
</blocklyxml>

### VÍ DỤ: THÁP XOẮN ỐC (SPIRAL 3D)
- **Mô tả**: Đường đi vòng quanh một ngọn tháp và đi cao dần lên qua các hố sâu.
- **Mã thử thách**: `COMMANDS_G312.CODING_COMMANDS_3D-MOVEMENT.COMPLEX_APPLY.C165-var1`

<blocklyxml mapid="COMMANDS_G312.CODING_COMMANDS_3D-MOVEMENT.COMPLEX_APPLY.C165-var1">
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
                          <block type="maze_moveForward">
                            <next>
                              <block type="maze_turn">
                                <field name="DIR">turnRight</field>
                                <next>
                                  <block type="maze_jump">
                                    <next>
                                      <block type="maze_moveForward">
                                        <next>
                                          <block type="maze_collect">
                                            <next>
                                              <block type="maze_moveForward">
                                                <next>
                                                  <block type="maze_turn">
                                                    <field name="DIR">turnRight</field>
                                                    <next>
                                                      <block type="maze_jump">
                                                        <next>
                                                          <block type="maze_toggle_switch">
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
    </statement>
  </block>
</xml>
</blocklyxml>

---

## IV. GIẢI MÊ CUNG NÂNG CAO (MAZE SOLVING)

Đây là thử thách tổng hợp đòi hỏi bạn vận dụng tất cả các lệnh đã học: Đi tới, Quay, Nhảy, Thu thập và Bật công tắc.

### VÍ DỤ: MÊ CUNG ĐA TẦNG PHỨC TẠP
- **Mô tả**: Một mê cung có nhiều tầng và nhiều loại đối tượng cần tương tác.
- **Mã thử thách**: `COMMANDS_G312.CODING_COMMANDS_MAZE-SOLVING-BASIC.COMPLEX_APPLY.C137-var1`

<blocklyxml mapid="COMMANDS_G312.CODING_COMMANDS_MAZE-SOLVING-BASIC.COMPLEX_APPLY.C137-var1">
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="maze_start" deletable="false" movable="false">
    <statement name="DO">
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
                          <block type="maze_turn">
                            <field name="DIR">turnLeft</field>
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
                                              <block type="maze_jump">
                                                <next>
                                                  <block type="maze_jump"></block>
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

> **Bí kíp**: Đừng ngần ngại sử dụng nút **Gỡ lỗi (🐌)** để xem nhân vật thực hiện từng khối lệnh. Điều này sẽ giúp bạn tìm ra sai sót trong lộ trình dài!
