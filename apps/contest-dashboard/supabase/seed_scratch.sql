-- ============================================================
-- SEED DATA: Cuộc thi Test Scratch
-- Dành cho việc test giao diện nộp đồ án Scratch (.sb3)
-- ============================================================

-- ── 1. Contest ───────────────────────────────────────────────

INSERT INTO contests (id, short_code, title, description, status, settings)
VALUES (
  'contest-scratch-test',
  'SCRATCH',
  'Cuộc thi Test Scratch',
  'Cuộc thi giả lập để test tính năng nộp file Scratch (.sb3) trên Frontend.',
  'draft',
  $json${
    "scoringMode": "highest",
    "allowLanguages": ["scratch"],
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
  ('a1000001-9999-9999-9999-000000000001', 'contest-scratch-test', 1, 'Vòng Test Upload Scratch', 'draft',
   '{"timingMode":"synchronized","duration_minutes":120,"start_time":null,"end_time":null}'::jsonb,
   '{"mode":"manual","autoRule":null}'::jsonb)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, timing = EXCLUDED.timing;

-- ── 3. Exams ─────────────────────────────────────────────────

INSERT INTO exams (id, round_id, title, quest_data)
VALUES (
  'e2000001-9999-9999-9999-000000000001',
  'a1000001-9999-9999-9999-000000000001',
  'Đề thi Test Scratch (SB3)',
  $json$[
    {
      "id": "SCRATCH-BAI-1",
      "gameType": "scratch",
      "level": 1,
      "titleKey": "Bài 1: Mèo bắt chuột (Scratch)",
      "descriptionKey": "Tạo trò chơi Mèo bắt chuột trên Scratch và nộp file .sb3",
      "hints": {
        "description": "## Bài 1: Mèo bắt chuột (Scratch)\n\nHãy lập trình Scratch với một trò chơi Mèo bắt chuột đơn giản:\n\n- **Nhân vật Mèo:** Luôn đi theo con trỏ chuột trên màn hình.\n- **Nhân vật Chuột:** Xuất hiện ngẫu nhiên trên màn hình, mỗi 2 giây đổi vị trí 1 lần.\n- Khi Mèo lấy được (chạm) Chuột, tăng biến **Score** lên 1 và phát ra âm thanh.\n\nSau khi làm bài xong trên máy tính của bạn, chọn **File -> Save to your computer** để tải file `.sb3` và nộp lên hệ thống nhé!"
      },
      "gameConfig": {
        "type": "scratch"
      }
    },
    {
      "id": "SCRATCH-BAI-2",
      "gameType": "scratch",
      "level": 2,
      "titleKey": "Bài 2: Robot vượt mê cung",
      "descriptionKey": "Lập trình Robot di chuyển thoát khỏi mê cung. (Có thể tham khảo bai2.public.json)",
      "hints": {
        "description": "## Bài 2: Robot vượt mê cung\n\nRobot bắt đầu ở ô (0,0) trên lưới 24×18.\nViết chương trình điều khiển robot đi theo chuỗi lệnh nhận từ Input (U, D, L, R) với độ dài mỗi bước là 20 pixel trong Scratch. (Tham khảo bài toán gốc từ tài liệu Tin Học Trẻ).\n\nYêu cầu nộp bài dưới dạng file phần mở rộng `.sb3` chứa kịch bản giải quyết bài toán."
      },
      "gameConfig": {
        "type": "scratch"
      }
    }
  ]$json$::jsonb
)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, quest_data = EXCLUDED.quest_data;

-- ── 4. Exam Boards (Cụm thi) ────────────────────────────────

INSERT INTO exam_boards (id, round_id, exam_id, name)
VALUES
  ('b3000001-9999-9999-9999-000000000001', 'a1000001-9999-9999-9999-000000000001', 'e2000001-9999-9999-9999-000000000001', 'Cụm Test Hệ Thống Mới')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
