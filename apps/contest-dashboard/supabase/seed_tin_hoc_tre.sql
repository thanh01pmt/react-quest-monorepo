-- ============================================================
-- SEED DATA: Cuộc thi "Tin Học Trẻ" — Bảng Tiểu Học
-- 3 Vòng: Quận → Tỉnh → Quốc gia
-- Mỗi vòng 1 Đề, mỗi đề 3 câu (Dễ → Trung bình → Khó)
-- ============================================================
-- NOTE: Uses $$-quoting to avoid single-quote escaping issues
-- inside JSON initialCode strings.
-- ============================================================

-- ── 1. Contest ───────────────────────────────────────────────

INSERT INTO contests (id, short_code, title, description, status, settings)
VALUES (
  'tin-hoc-tre-2026',
  'THT26',
  'Tin Học Trẻ 2026 — Bảng Tiểu Học',
  'Cuộc thi Tin Học Trẻ toàn quốc dành cho học sinh Tiểu học. Thi lập trình thuật toán qua 3 vòng: Quận, Tỉnh, Quốc gia.',
  'draft',
  $json${
    "scoringMode": "highest",
    "allowLanguages": ["javascript", "python"],
    "showHiddenTestCases": false,
    "maxSubmissionsPerChallenge": 0
  }$json$::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  settings = EXCLUDED.settings;

-- ── 2. Rounds ────────────────────────────────────────────────

INSERT INTO rounds (id, contest_id, order_index, title, status, timing, promotion_config)
VALUES
  ('a1000001-0001-0001-0001-000000000001', 'tin-hoc-tre-2026', 1, 'Vòng Quận', 'draft',
   '{"timingMode":"synchronized","duration_minutes":90,"start_time":null,"end_time":null}'::jsonb,
   '{"mode":"manual","autoRule":null}'::jsonb),
  ('a1000001-0001-0001-0001-000000000002', 'tin-hoc-tre-2026', 2, 'Vòng Tỉnh', 'draft',
   '{"timingMode":"synchronized","duration_minutes":120,"start_time":null,"end_time":null}'::jsonb,
   '{"mode":"manual","autoRule":null}'::jsonb),
  ('a1000001-0001-0001-0001-000000000003', 'tin-hoc-tre-2026', 3, 'Vòng Quốc Gia', 'draft',
   '{"timingMode":"synchronized","duration_minutes":150,"start_time":null,"end_time":null}'::jsonb,
   '{"mode":"manual","autoRule":null}'::jsonb)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, timing = EXCLUDED.timing;

-- ── 3. Exams ─────────────────────────────────────────────────

-- ═══════════════════════════════════════════════════════════════
-- ĐỀ THI VÒNG QUẬN — 3 câu (90 phút)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO exams (id, round_id, title, quest_data)
VALUES (
  'e2000001-0001-0001-0001-000000000001',
  'a1000001-0001-0001-0001-000000000001',
  'Đề thi Vòng Quận — Bảng Tiểu Học',
  $json$[
    {
      "id": "VQ-BAI-1",
      "gameType": "algo",
      "level": 1,
      "titleKey": "Bài 1: Tổng tiền mừng tuổi",
      "descriptionKey": "Bạn An nhận được tiền mừng tuổi từ 3 người thân",
      "gameConfig": {
        "type": "algo",
        "description": "## Bài 1: Tổng tiền mừng tuổi\n\nBạn An là học sinh lớp 3. Tết Nguyên Đán năm nay, An nhận được tiền mừng tuổi từ **3 người thân**.\n\n**Yêu cầu:** Viết chương trình tính **tổng số tiền** mừng tuổi mà An nhận được.\n\n### Dữ liệu vào\nBa số nguyên dương `a`, `b`, `c` (mỗi số trên một dòng).\n\n### Dữ liệu ra\nIn ra tổng số tiền mừng tuổi.\n\n### Ràng buộc\n- `1 ≤ a, b, c ≤ 1.000.000`",
        "inputFormat": "Ba số nguyên dương a, b, c (mỗi số trên một dòng)",
        "outputFormat": "Một số nguyên duy nhất là tổng a + b + c",
        "constraints": "1 ≤ a, b, c ≤ 1.000.000",
        "sampleCases": [
          { "input": "100000\n200000\n500000", "expectedOutput": "800000", "label": "Ví dụ 1" },
          { "input": "50000\n50000\n100000", "expectedOutput": "200000", "label": "Ví dụ 2" }
        ],
        "hiddenCases": [
          { "input": "1\n1\n1", "expectedOutput": "3" },
          { "input": "1000000\n1000000\n1000000", "expectedOutput": "3000000" },
          { "input": "999999\n1\n500000", "expectedOutput": "1500000" }
        ],
        "timeLimit": 5000,
        "supportedLanguages": ["javascript", "python"],
        "initialCode": {
          "javascript": "const a = parseInt(prompt());\nconst b = parseInt(prompt());\nconst c = parseInt(prompt());\n\n// Viết code tính tổng tại đây\n",
          "python": "a = int(input())\nb = int(input())\nc = int(input())\n\n# Viết code tính tổng tại đây\n"
        }
      },
      "solution": { "type": "match_output", "optimalLines": 4 }
    },
    {
      "id": "VQ-BAI-2",
      "gameType": "algo",
      "level": 2,
      "titleKey": "Bài 2: Xếp hàng mua vé",
      "descriptionKey": "Đếm số bạn đứng đúng vị trí",
      "gameConfig": {
        "type": "algo",
        "description": "## Bài 2: Xếp hàng mua vé\n\nCó `N` học sinh xếp hàng mua vé xem phim. Mỗi bạn có số thứ tự từ `1` đến `N`. Do chen lấn, các bạn đứng không đúng vị trí.\n\nĐếm có **bao nhiêu bạn** đang đứng **đúng vị trí** (bạn số `i` đứng ở vị trí `i`).\n\n### Dữ liệu vào\n- Dòng 1: `N`\n- Dòng 2: `N` số nguyên phân cách bởi dấu cách\n\n### Dữ liệu ra\nSố lượng bạn đứng đúng vị trí.\n\n### Ràng buộc\n- `1 ≤ N ≤ 1000`",
        "inputFormat": "Dòng 1: N\nDòng 2: N số nguyên phân cách bởi dấu cách",
        "outputFormat": "Một số nguyên: số bạn đứng đúng vị trí",
        "constraints": "1 ≤ N ≤ 1000",
        "sampleCases": [
          { "input": "5\n1 3 2 4 5", "expectedOutput": "3", "label": "Ví dụ 1: Bạn 1, 4, 5 đứng đúng" },
          { "input": "4\n4 3 2 1", "expectedOutput": "0", "label": "Ví dụ 2: Không ai đứng đúng" }
        ],
        "hiddenCases": [
          { "input": "1\n1", "expectedOutput": "1" },
          { "input": "3\n1 2 3", "expectedOutput": "3" },
          { "input": "6\n2 1 3 5 4 6", "expectedOutput": "2" },
          { "input": "5\n5 4 3 2 1", "expectedOutput": "1" }
        ],
        "timeLimit": 5000,
        "supportedLanguages": ["javascript", "python"],
        "initialCode": {
          "javascript": "var n = parseInt(prompt());\nvar parts = prompt().split(\" \");\nvar arr = [];\nfor (var i = 0; i < n; i++) arr.push(parseInt(parts[i]));\n\nvar count = 0;\n// Viết code tại đây\n\nconsole.log(count);",
          "python": "n = int(input())\narr = list(map(int, input().split()))\n\ncount = 0\n# Viết code tại đây\n\nprint(count)"
        }
      },
      "solution": { "type": "match_output", "optimalLines": 6 }
    },
    {
      "id": "VQ-BAI-3",
      "gameType": "algo",
      "level": 3,
      "titleKey": "Bài 3: Hình chữ nhật lớn nhất",
      "descriptionKey": "Tìm hình chữ nhật có chu vi lớn nhất từ các thanh gỗ",
      "gameConfig": {
        "type": "algo",
        "description": "## Bài 3: Hình chữ nhật lớn nhất\n\nBạn Minh có `N` thanh gỗ. Minh muốn chọn **đúng 4 thanh** để ghép thành **hình chữ nhật** (2 cặp thanh bằng nhau).\n\nTìm **chu vi lớn nhất** có thể. Nếu không thể, in `0`.\n\n### Dữ liệu vào\n- Dòng 1: `N`\n- Dòng 2: `N` số nguyên dương\n\n### Dữ liệu ra\nChu vi lớn nhất hoặc `0`.\n\n### Ràng buộc\n- `4 ≤ N ≤ 1000`\n- `1 ≤ độ dài ≤ 10.000`",
        "inputFormat": "Dòng 1: N\nDòng 2: N số nguyên dương",
        "outputFormat": "Chu vi lớn nhất hoặc 0",
        "constraints": "4 ≤ N ≤ 1000, 1 ≤ độ dài ≤ 10.000",
        "sampleCases": [
          { "input": "6\n3 5 3 7 5 7", "expectedOutput": "24", "label": "Ví dụ 1: Chọn 5,5,7,7 => CV=24" },
          { "input": "5\n1 2 3 4 5", "expectedOutput": "0", "label": "Ví dụ 2: Không có cặp" }
        ],
        "hiddenCases": [
          { "input": "4\n4 4 6 6", "expectedOutput": "20" },
          { "input": "8\n1 1 2 2 3 3 4 4", "expectedOutput": "14" },
          { "input": "4\n5 5 5 5", "expectedOutput": "20" },
          { "input": "6\n1 2 3 4 5 6", "expectedOutput": "0" },
          { "input": "7\n10 10 20 20 10 20 5", "expectedOutput": "60" }
        ],
        "timeLimit": 5000,
        "supportedLanguages": ["javascript", "python"],
        "initialCode": {
          "javascript": "var n = parseInt(prompt());\nvar parts = prompt().split(\" \");\nvar arr = [];\nfor (var i = 0; i < n; i++) arr.push(parseInt(parts[i]));\n\n// Viết code tại đây\n",
          "python": "n = int(input())\narr = list(map(int, input().split()))\n\n# Viết code tại đây\n"
        }
      },
      "solution": { "type": "match_output", "optimalLines": 15 }
    }
  ]$json$::jsonb
)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, quest_data = EXCLUDED.quest_data;


-- ═══════════════════════════════════════════════════════════════
-- ĐỀ THI VÒNG TỈNH — 3 câu (120 phút)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO exams (id, round_id, title, quest_data)
VALUES (
  'e2000001-0001-0001-0001-000000000002',
  'a1000001-0001-0001-0001-000000000002',
  'Đề thi Vòng Tỉnh — Bảng Tiểu Học',
  $json$[
    {
      "id": "VT-BAI-1",
      "gameType": "algo",
      "level": 1,
      "titleKey": "Bài 1: Đếm ước số",
      "descriptionKey": "Đếm số lượng ước số của một số nguyên dương",
      "gameConfig": {
        "type": "algo",
        "description": "## Bài 1: Đếm ước số\n\nCho số nguyên dương `N`. Đếm `N` có bao nhiêu **ước số** (kể cả `1` và `N`).\n\n### Dữ liệu vào\nMột số nguyên dương `N`.\n\n### Dữ liệu ra\nSố lượng ước số.\n\n### Ràng buộc\n- `1 ≤ N ≤ 1.000.000`",
        "inputFormat": "Một số nguyên dương N",
        "outputFormat": "Số lượng ước số của N",
        "constraints": "1 ≤ N ≤ 1.000.000",
        "sampleCases": [
          { "input": "12", "expectedOutput": "6", "label": "Ví dụ 1: Ước = {1,2,3,4,6,12}" },
          { "input": "7", "expectedOutput": "2", "label": "Ví dụ 2: 7 là số nguyên tố" }
        ],
        "hiddenCases": [
          { "input": "1", "expectedOutput": "1" },
          { "input": "100", "expectedOutput": "9" },
          { "input": "1000000", "expectedOutput": "49" },
          { "input": "997", "expectedOutput": "2" },
          { "input": "36", "expectedOutput": "9" }
        ],
        "timeLimit": 5000,
        "supportedLanguages": ["javascript", "python"],
        "initialCode": {
          "javascript": "var n = parseInt(prompt());\nvar count = 0;\n\n// Viết code tại đây\n\nconsole.log(count);",
          "python": "n = int(input())\ncount = 0\n\n# Viết code tại đây\n\nprint(count)"
        }
      },
      "solution": { "type": "match_output", "optimalLines": 5 }
    },
    {
      "id": "VT-BAI-2",
      "gameType": "algo",
      "level": 2,
      "titleKey": "Bài 2: Dãy số đặc biệt",
      "descriptionKey": "Tìm số Fibonacci thứ N và kiểm tra chẵn lẻ",
      "gameConfig": {
        "type": "algo",
        "description": "## Bài 2: Dãy đặc biệt\n\nDãy số: `F(1)=1, F(2)=1, F(n)=F(n-1)+F(n-2)` với `n>=3`.\n\nCho `N`, tính `F(N)` và cho biết chẵn hay lẻ.\n\n### Dữ liệu vào\nMột số nguyên dương `N`.\n\n### Dữ liệu ra\n- Dòng 1: `F(N)`\n- Dòng 2: `CHAN` hoặc `LE`\n\n### Ràng buộc\n- `1 ≤ N ≤ 40`",
        "inputFormat": "Một số nguyên dương N",
        "outputFormat": "Dòng 1: F(N)\nDòng 2: CHAN hoặc LE",
        "constraints": "1 ≤ N ≤ 40",
        "sampleCases": [
          { "input": "6", "expectedOutput": "8\nCHAN", "label": "Ví dụ 1: F(6)=8" },
          { "input": "7", "expectedOutput": "13\nLE", "label": "Ví dụ 2: F(7)=13" }
        ],
        "hiddenCases": [
          { "input": "1", "expectedOutput": "1\nLE" },
          { "input": "2", "expectedOutput": "1\nLE" },
          { "input": "3", "expectedOutput": "2\nCHAN" },
          { "input": "10", "expectedOutput": "55\nLE" },
          { "input": "20", "expectedOutput": "6765\nLE" },
          { "input": "40", "expectedOutput": "102334155\nLE" }
        ],
        "timeLimit": 5000,
        "supportedLanguages": ["javascript", "python"],
        "initialCode": {
          "javascript": "var n = parseInt(prompt());\n\n// F(1)=1, F(2)=1, F(n)=F(n-1)+F(n-2)\n// Viết code tại đây\n",
          "python": "n = int(input())\n\n# F(1)=1, F(2)=1, F(n)=F(n-1)+F(n-2)\n# Viết code tại đây\n"
        }
      },
      "solution": { "type": "match_output", "optimalLines": 10 }
    },
    {
      "id": "VT-BAI-3",
      "gameType": "algo",
      "level": 3,
      "titleKey": "Bài 3: Sắp xếp điểm thi",
      "descriptionKey": "Sắp xếp danh sách theo điểm giảm dần",
      "gameConfig": {
        "type": "algo",
        "description": "## Bài 3: Sắp xếp điểm thi\n\nCô giáo có `N` học sinh với điểm thi. Sắp xếp theo **điểm giảm dần**. Cùng điểm thì theo **tên tăng dần** (bảng chữ cái).\n\n### Dữ liệu vào\n- Dòng 1: `N`\n- `N` dòng tiếp: `tên điểm` (tên không dấu, không khoảng trắng)\n\n### Dữ liệu ra\n- `N` dòng đã sắp xếp: `tên điểm`\n\n### Ràng buộc\n- `1 ≤ N ≤ 100`, `0 ≤ điểm ≤ 100`",
        "inputFormat": "Dòng 1: N\nN dòng tiếp: tên điểm",
        "outputFormat": "N dòng đã sắp xếp: tên điểm",
        "constraints": "1 ≤ N ≤ 100, 0 ≤ điểm ≤ 100",
        "sampleCases": [
          {
            "input": "4\nAn 85\nBinh 92\nCuong 85\nDung 78",
            "expectedOutput": "Binh 92\nAn 85\nCuong 85\nDung 78",
            "label": "Ví dụ: An < Cuong khi cùng 85 điểm"
          }
        ],
        "hiddenCases": [
          { "input": "1\nAn 100", "expectedOutput": "An 100" },
          { "input": "3\nA 50\nB 50\nC 50", "expectedOutput": "A 50\nB 50\nC 50" },
          { "input": "5\nE 10\nD 20\nC 30\nB 40\nA 50", "expectedOutput": "A 50\nB 40\nC 30\nD 20\nE 10" },
          { "input": "3\nZen 99\nAce 99\nMid 50", "expectedOutput": "Ace 99\nZen 99\nMid 50" }
        ],
        "timeLimit": 5000,
        "supportedLanguages": ["javascript", "python"],
        "initialCode": {
          "javascript": "var n = parseInt(prompt());\nvar students = [];\nfor (var i = 0; i < n; i++) {\n  var parts = prompt().split(\" \");\n  students.push({ name: parts[0], score: parseInt(parts[1]) });\n}\n\n// Sắp xếp và in kết quả\n// Viết code tại đây\n",
          "python": "n = int(input())\nstudents = []\nfor _ in range(n):\n    parts = input().split()\n    students.append((parts[0], int(parts[1])))\n\n# Sắp xếp và in kết quả\n# Viết code tại đây\n"
        }
      },
      "solution": { "type": "match_output", "optimalLines": 8 }
    }
  ]$json$::jsonb
)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, quest_data = EXCLUDED.quest_data;


-- ═══════════════════════════════════════════════════════════════
-- ĐỀ THI VÒNG QUỐC GIA — 3 câu (150 phút)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO exams (id, round_id, title, quest_data)
VALUES (
  'e2000001-0001-0001-0001-000000000003',
  'a1000001-0001-0001-0001-000000000003',
  'Đề thi Vòng Quốc Gia — Bảng Tiểu Học',
  $json$[
    {
      "id": "VQG-BAI-1",
      "gameType": "algo",
      "level": 1,
      "titleKey": "Bài 1: Số đối xứng",
      "descriptionKey": "Đếm số đối xứng (palindrome) trong khoảng",
      "gameConfig": {
        "type": "algo",
        "description": "## Bài 1: Số đối xứng\n\nSố **đối xứng** (palindrome) đọc trái-phải giống phải-trái.\nVD: `121`, `1331`, `5` là đối xứng. `123`, `10` không phải.\n\nCho `A`, `B`, đếm số đối xứng trong `[A, B]`.\n\n### Dữ liệu vào\n`A B` trên cùng một dòng.\n\n### Dữ liệu ra\nSố lượng số đối xứng.\n\n### Ràng buộc\n- `1 ≤ A ≤ B ≤ 100.000`",
        "inputFormat": "Hai số A B cách nhau bởi dấu cách",
        "outputFormat": "Số lượng số đối xứng trong [A, B]",
        "constraints": "1 ≤ A ≤ B ≤ 100.000",
        "sampleCases": [
          { "input": "1 20", "expectedOutput": "10", "label": "Ví dụ 1: 1-9 + 11 = 10" },
          { "input": "100 200", "expectedOutput": "10", "label": "Ví dụ 2: 101,111,...,191" }
        ],
        "hiddenCases": [
          { "input": "1 1", "expectedOutput": "1" },
          { "input": "10 10", "expectedOutput": "0" },
          { "input": "1 100", "expectedOutput": "18" },
          { "input": "1 1000", "expectedOutput": "108" },
          { "input": "99990 100000", "expectedOutput": "1" }
        ],
        "timeLimit": 5000,
        "supportedLanguages": ["javascript", "python"],
        "initialCode": {
          "javascript": "var parts = prompt().split(\" \");\nvar a = parseInt(parts[0]);\nvar b = parseInt(parts[1]);\nvar count = 0;\n\n// Viết code tại đây\n\nconsole.log(count);",
          "python": "a, b = map(int, input().split())\ncount = 0\n\n# Viết code tại đây\n\nprint(count)"
        }
      },
      "solution": { "type": "match_output", "optimalLines": 8 }
    },
    {
      "id": "VQG-BAI-2",
      "gameType": "algo",
      "level": 2,
      "titleKey": "Bài 2: Đường đi trên lưới",
      "descriptionKey": "Đếm số đường đi ngắn nhất trên lưới ô vuông",
      "gameConfig": {
        "type": "algo",
        "description": "## Bài 2: Đường đi trên lưới\n\nAn đứng ở **(1,1)** trên lưới `M x N`. Chỉ được đi **phải** hoặc **xuống**.\n\nĐếm số đường đi khác nhau đến **(M,N)**.\n\n### Dữ liệu vào\n`M N` trên cùng dòng.\n\n### Dữ liệu ra\nSố đường đi.\n\n### Ràng buộc\n- `1 ≤ M, N ≤ 15`",
        "inputFormat": "Hai số M N cách nhau bởi dấu cách",
        "outputFormat": "Số đường đi từ (1,1) đến (M,N)",
        "constraints": "1 ≤ M, N ≤ 15",
        "sampleCases": [
          { "input": "2 3", "expectedOutput": "3", "label": "Ví dụ 1: Lưới 2x3" },
          { "input": "3 3", "expectedOutput": "6", "label": "Ví dụ 2: Lưới 3x3" }
        ],
        "hiddenCases": [
          { "input": "1 1", "expectedOutput": "1" },
          { "input": "1 10", "expectedOutput": "1" },
          { "input": "4 4", "expectedOutput": "20" },
          { "input": "5 5", "expectedOutput": "70" },
          { "input": "10 10", "expectedOutput": "48620" },
          { "input": "15 15", "expectedOutput": "40116600" }
        ],
        "timeLimit": 5000,
        "supportedLanguages": ["javascript", "python"],
        "initialCode": {
          "javascript": "var parts = prompt().split(\" \");\nvar m = parseInt(parts[0]);\nvar n = parseInt(parts[1]);\n\n// dp[i][j] = so duong di den (i,j)\n// Viết code tại đây\n",
          "python": "m, n = map(int, input().split())\n\n# dp[i][j] = so duong di den (i,j)\n# Viết code tại đây\n"
        }
      },
      "solution": { "type": "match_output", "optimalLines": 12 }
    },
    {
      "id": "VQG-BAI-3",
      "gameType": "algo",
      "level": 3,
      "titleKey": "Bài 3: Robot nhặt đồ",
      "descriptionKey": "Tìm đường đi nhặt nhiều đồ vật nhất",
      "gameConfig": {
        "type": "algo",
        "description": "## Bài 3: Robot nhặt đồ\n\nRobot ở **(1,1)** trên lưới `M x N`. Ô `(i,j)` có `V[i][j]` đồ vật. Chỉ được đi **phải** hoặc **xuống**.\n\nTìm đường đi nhặt **nhiều đồ vật nhất**.\n\n### Dữ liệu vào\n- Dòng 1: `M N`\n- `M` dòng tiếp: `N` số nguyên không âm\n\n### Dữ liệu ra\nSố đồ vật lớn nhất.\n\n### Ràng buộc\n- `1 ≤ M, N ≤ 100`\n- `0 ≤ V[i][j] ≤ 1000`",
        "inputFormat": "Dòng 1: M N\nM dòng tiếp: N số nguyên",
        "outputFormat": "Số đồ vật lớn nhất",
        "constraints": "1 ≤ M, N ≤ 100, 0 ≤ V[i][j] ≤ 1000",
        "sampleCases": [
          {
            "input": "3 3\n1 3 1\n1 5 1\n4 2 1",
            "expectedOutput": "12",
            "label": "Ví dụ 1: max = 1+3+5+2+1 = 12"
          },
          {
            "input": "2 2\n1 2\n3 4",
            "expectedOutput": "8",
            "label": "Ví dụ 2: 1->3->4 = 8"
          }
        ],
        "hiddenCases": [
          { "input": "1 1\n5", "expectedOutput": "5" },
          { "input": "1 5\n1 2 3 4 5", "expectedOutput": "15" },
          { "input": "3 3\n0 0 0\n0 0 0\n0 0 0", "expectedOutput": "0" },
          { "input": "4 4\n1 2 3 4\n5 6 7 8\n9 10 11 12\n13 14 15 16", "expectedOutput": "73" },
          { "input": "2 3\n10 1 1\n1 1 10", "expectedOutput": "22" }
        ],
        "timeLimit": 5000,
        "supportedLanguages": ["javascript", "python"],
        "initialCode": {
          "javascript": "var parts = prompt().split(\" \");\nvar m = parseInt(parts[0]);\nvar n = parseInt(parts[1]);\nvar grid = [];\nfor (var i = 0; i < m; i++) {\n  var row = prompt().split(\" \");\n  var nums = [];\n  for (var j = 0; j < n; j++) nums.push(parseInt(row[j]));\n  grid.push(nums);\n}\n\n// dp[i][j] = max do vat khi den o (i,j)\n// Viết code tại đây\n",
          "python": "m, n = map(int, input().split())\ngrid = []\nfor _ in range(m):\n    grid.append(list(map(int, input().split())))\n\n# dp[i][j] = max do vat khi den o (i,j)\n# Viết code tại đây\n"
        }
      },
      "solution": { "type": "match_output", "optimalLines": 12 }
    }
  ]$json$::jsonb
)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, quest_data = EXCLUDED.quest_data;


-- ── 4. Exam Boards (Cụm thi) ────────────────────────────────

-- Vòng Quận: 2 cụm
INSERT INTO exam_boards (id, round_id, exam_id, name)
VALUES
  ('b3000001-0001-0001-0001-000000000001', 'a1000001-0001-0001-0001-000000000001', 'e2000001-0001-0001-0001-000000000001', 'Cụm Quận 1 - TP.HCM'),
  ('b3000001-0001-0001-0001-000000000002', 'a1000001-0001-0001-0001-000000000001', 'e2000001-0001-0001-0001-000000000001', 'Cụm Quận Ba Đình - Hà Nội')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Vòng Tỉnh: 2 cụm
INSERT INTO exam_boards (id, round_id, exam_id, name)
VALUES
  ('b3000001-0001-0001-0001-000000000003', 'a1000001-0001-0001-0001-000000000002', 'e2000001-0001-0001-0001-000000000002', 'Cụm TP. Hồ Chí Minh'),
  ('b3000001-0001-0001-0001-000000000004', 'a1000001-0001-0001-0001-000000000002', 'e2000001-0001-0001-0001-000000000002', 'Cụm Hà Nội')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Vòng Quốc Gia: 1 cụm
INSERT INTO exam_boards (id, round_id, exam_id, name)
VALUES
  ('b3000001-0001-0001-0001-000000000005', 'a1000001-0001-0001-0001-000000000003', 'e2000001-0001-0001-0001-000000000003', 'Cụm Quốc Gia')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
