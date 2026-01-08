# BÀI 9: PHÉP TÍNH & GỠ LỖI BIẾN

Sử dụng toán học để điều khiển chương trình.

---

## 1. TOÁN TỬ (OPERATORS)
Sử dụng các phép tính (+, -, *, /) để thay đổi giá trị của **biến**. 
Ví dụ: `điểm = điểm + 10` mỗi khi bạn nhặt được một vật phẩm.
<blocklyxml>
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="variables_set">
    <field name="VAR">diem</field>
    <value name="VALUE">
      <block type="math_arithmetic">
        <field name="OP">ADD</field>
        <value name="A">
          <block type="variables_get">
            <field name="VAR">diem</field>
          </block>
        </value>
        <value name="B">
          <shadow type="math_number">
            <field name="NUM">10</field>
          </shadow>
        </value>
      </block>
    </value>
  </block>
</xml>
</blocklyxml>

## 2. GỠ LỖI BIẾN
Kiểm tra xem bạn có cập nhật biến nhầm chỗ không, hoặc quên không thay đổi giá trị của nó khiến logic chương trình bị sai lệch.

<blocklyxml mapid="VARIABLES_G58.CODING_VARIABLES_EXPRESSIONS.REFACTOR.C5-var1">
<xml xmlns="https://developers.google.com/blockly/xml">
</xml>
</blocklyxml>
