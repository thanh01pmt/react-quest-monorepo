# BÀI 10: KHẢ NĂNG RA QUYẾT ĐỊNH

Giúp nhân vật của bạn trở nên thông minh hơn bằng cách tự đưa ra lựa chọn.

---

## 1. CÂU ĐIỀU KIỆN (NẾU-NẾU KHÔNG)
"Nếu có đường thì đi tới, nếu không thì quay". Đây là cách nhân vật thích nghi với các môi trường khác nhau mà không cần bạn ra lệnh từng bước một.
<blocklyxml>
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="controls_if">
    <mutation else="1"></mutation>
    <value name="IF0">
      <block type="maze_is_path">
        <field name="DIR">path ahead</field>
      </block>
    </value>
    <statement name="DO0">
      <block type="maze_moveForward"></block>
    </statement>
    <statement name="ELSE">
      <block type="maze_turn">
        <field name="DIR">turnLeft</field>
      </block>
    </statement>
  </block>
</xml>
</blocklyxml>

## 2. VÒNG LẶP "TRONG KHI" (WHILE)
Lặp lại hành động "trong khi" một điều kiện nào đó vẫn đúng (Ví dụ: "trong khi chưa tới đích"). Bạn không cần biết đích xa bao nhiêu ô, robot sẽ tự tìm cách đi đến đó.
<blocklyxml>
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="maze_while">
    <value name="BOOL">
      <block type="logic_negate">
        <value name="BOOL">
          <block type="maze_at_finish"></block>
        </value>
      </block>
    </value>
  </block>
</xml>
</blocklyxml>

<blocklyxml mapid="CONDITIONALS_G58.CODING_CONDITIONALS_APPLICATION.SIMPLE_APPLY.C1-var1">
<xml xmlns="https://developers.google.com/blockly/xml">
</xml>
</blocklyxml>
