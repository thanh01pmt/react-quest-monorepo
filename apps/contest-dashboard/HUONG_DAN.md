# 📋 Hướng Dẫn Sử Dụng Hệ Thống Tổ Chức Cuộc Thi

> **Phiên bản:** 2.0 — Kiến trúc Supabase  
> **Cập nhật:** 2026-04-01

---

## Tổng quan Hệ thống

Hệ thống gồm **hai ứng dụng riêng biệt**:

| Ứng dụng | Dành cho | URL mặc định |
|---|---|---|
| **Contest Dashboard** | Ban tổ chức / Admin | `https://contest-dashboard.netlify.app` |
| **React Quest App** (Learner App) | Thí sinh | `https://quest-player.netlify.app` |

```
┌─────────────────────────────────────────────────────────────┐
│                        SUPABASE                             │
│          (Auth · Database · Realtime · RPC)                 │
└────────────────────┬─────────────────────┬──────────────────┘
                     │                     │
         ┌───────────▼──────────┐ ┌────────▼─────────────┐
         │  Contest Dashboard   │ │   React Quest App    │
         │     (Admin)          │ │    (Thí sinh)        │
         │  /contest/:id/edit   │ │  /contest/:id        │
         │  /contest/:id/...    │ │  /contest/:id/exam   │
         └──────────────────────┘ └──────────────────────┘
```

---

## 🔴 Luồng Quản Trị Viên (Admin)

### Bước 1 — Đăng nhập Dashboard

Truy cập Contest Dashboard và đăng nhập bằng tài khoản admin Supabase.

> ⚠️ **Lưu ý:** Nếu đăng nhập bằng tài khoản thí sinh (có `username` trong metadata), hệ thống sẽ **từ chối truy cập** và chuyển hướng về trang Lobby tương ứng.

---

### Bước 2 — Tạo và Cấu hình Cuộc thi

**Trang:** `/` → Danh sách cuộc thi → **"Tạo cuộc thi mới"**

Mỗi cuộc thi có cấu trúc phân cấp như sau:

```
Cuộc thi (Contest)
└── Vòng thi (Round) × N
    └── Cụm thi (Exam Board) × N
        └── Bộ đề (Exam)
            └── Câu hỏi (Challenge) × N
```

#### Các trạng thái cuộc thi

| Trạng thái | Ý nghĩa |
|---|---|
| `draft` | Đang soạn thảo, chưa công khai |
| `scheduled` | Đã lên lịch, chưa mở cổng |
| `lobby` | Thí sinh có thể vào phòng chờ nhưng chưa làm bài |
| `active` | Cuộc thi đang diễn ra, thí sinh làm bài |
| `ended` | Đã kết thúc |

> 💡 **Thực tế:** Trạng thái `active` được xác định theo **thời gian thực** (`startTime` / `endTime`) thay vì chỉ dựa vào trường `status`. Trang Lobby của thí sinh tự cập nhật mỗi giây.

#### Trang Cấu hình (`/contest/:id/edit`)

Tại đây bạn có thể:
- Đặt tên, mô tả, thời gian bắt đầu/kết thúc
- Kích hoạt/dừng cuộc thi (chuyển `status`)
- Thêm **Vòng thi** và **Cụm thi (Exam Board)** bên trong từng vòng
- Gán **Bộ đề** vào từng cụm thi

---

### Bước 3 — Soạn Đề thi

**Trang:** `/contest/:id/challenges`

**Quy trình soạn đề:**
1. Chọn **Vòng thi** → chọn **Bộ đề** (hoặc tạo mới bằng "Bộ đề mới")
2. Nhấn **"Thêm câu"** để thêm challenge mới
3. Điền thông tin cho từng câu:
   - Tiêu đề câu hỏi
   - Nội dung đề bài (hỗ trợ Markdown)
   - Định dạng Input / Output
   - Ràng buộc dữ liệu (Constraints)
   - **Ví dụ mẫu** (Sample Cases — thí sinh nhìn thấy)
   - **Bộ kiểm thử ẩn** (Hidden Tests — dùng để chấm điểm)
4. Nhấn **"Xem trước"** để kiểm tra giao diện thí sinh
5. Nhấn **"Lưu đề này"** để lưu

> 💡 Dùng **"Export JSON"** để sao lưu bộ đề ra file.

---

### Bước 4 — Tạo Tài khoản Thí sinh

**Trang:** `/contest/:id/accounts`

#### 4a. Tạo hàng loạt tài khoản

1. Nhập **số lượng tài khoản** cần tạo
2. Chọn **prefix** (ví dụ: `ts` → tài khoản sẽ là `ts001`, `ts002`, ...)
3. Nhấn **"Tạo tài khoản"**
4. Hệ thống gọi RPC `admin_create_participant_auth` trên Supabase để tạo auth user an toàn

> ⚠️ **Yêu cầu:** Function `admin_create_participant_auth` phải được cấu hình đúng trong Supabase với quyền `service_role`.

#### 4b. Gán thí sinh vào Cụm thi

Sau khi tạo tài khoản:
1. Chọn thí sinh từ danh sách
2. Chọn **Vòng thi** và **Cụm thi** đích
3. Nhấn **"Gán tự động"** hoặc thao tác thủ công
4. Hệ thống sẽ tạo bản ghi `board_participants` tương ứng

#### 4c. Xuất thông tin đăng nhập

Sau khi gán xong, xuất file CSV chứa:
- Username
- Mật khẩu
- Link trực tiếp vào Lobby của cuộc thi

**Link Lobby thí sinh có dạng:**
```
https://quest-player.netlify.app/contest/{contestId}
```

---

### Bước 5 — Giám sát Live

**Trang:** `/contest/:id/live`

Ba chế độ xem:

| Chế độ | Hiển thị |
|---|---|
| **Theo Cụm** | Bảng điểm từng Cụm thi cụ thể |
| **Theo Vòng** | Tổng hợp tất cả cụm trong một Vòng |
| **Toàn diện** | Bảng xếp hạng toàn Cuộc thi |

**Các thao tác khẩn cấp trên từng thí sinh:**
- ⏱ **Cấp thêm thời gian** — gia hạn deadline của thí sinh
- 🔒 **Kết thúc sớm** — buộc nộp bài thí sinh

> 🔴 **Realtime:** Bảng điểm tự động cập nhật qua Supabase Realtime khi có bài nộp mới (subscribe `submissions` và `contest_progress`).

Nhấn **"Xuất CSV"** để tải bảng điểm ra file.

---

### Bước 6 — Xét tuyển và Thăng hạng (Thi nhiều vòng)

**Trang:** `/contest/:id/promotion`

Dùng khi cuộc thi có **nhiều vòng** và cần chuyển thí sinh đủ điều kiện lên vòng tiếp theo:

1. Chọn **Vòng xuất phát** (Source) — vòng vừa kết thúc
2. Chọn **Vòng mục tiêu** (Target) — vòng tiếp theo
3. Chọn **Cụm thi đích** trong vòng mục tiêu
4. Xem danh sách thí sinh đề xuất (theo thứ tự điểm)
5. Nhấn **"Thực hiện Thăng hạng"** để gán vào vòng mới

---

## 🔵 Luồng Thí sinh (Student)

### Bước 1 — Nhận thông tin đăng nhập

Thí sinh nhận từ ban tổ chức:
- **Username** (ví dụ: `ts001`)
- **Mật khẩu**
- **Link vào Lobby** (dạng: `https://quest-player.netlify.app/contest/{contestId}`)

---

### Bước 2 — Vào Trang Lobby

Truy cập link được cấp → trang Lobby hiển thị:
- Tên cuộc thi, mô tả
- Thời gian bắt đầu / kết thúc
- Số lượng thử thách
- Trạng thái hiện tại

---

### Bước 3 — Đăng nhập

Nhập **Username** và **Mật khẩu** → nhấn **"Tiếp tục"**

> Hệ thống tự động chuyển username → email đăng nhập theo format: `{username}@contest.io`

---

### Bước 4 — Điền Thông tin Liên hệ (lần đầu)

Nếu là lần đầu đăng nhập vào contest này, thí sinh cần điền:
- **Họ và tên** *(bắt buộc)*
- **Email** *(bắt buộc)*
- **Số điện thoại** *(tuỳ chọn)*

Nhấn **"Hoàn tất đăng ký"** → hệ thống lưu vào bảng `participants`.

---

### Bước 5 — Chờ în Phòng Lobby

Sau khi đăng ký thành công, thí sinh vào **Phòng Chờ (Lobby)**:

| Trạng thái cuộc thi | Hiển thị |
|---|---|
| `not_started` | ⏳ Chưa bắt đầu — hiển thị thời gian khai mạc |
| `active` | 🟢 Đang diễn ra — hiện nút **"🚀 Bắt đầu làm bài"** |
| `ended` | 🔴 Đã kết thúc |

> 🕐 **Tự động cập nhật:** Trang Lobby kiểm tra trạng thái mỗi **1 giây**. Khi đến giờ, nút "Bắt đầu làm bài" xuất hiện mà **không cần reload trang**.

---

### Bước 6 — Làm Bài Thi

Nhấn **"🚀 Bắt đầu làm bài"** → hệ thống điều hướng đến:

```
/contest/{contestId}/exam
```

Tại Phòng Thi (`ExamRoom`):
- Giao diện Blockly/Code Editor
- Danh sách câu hỏi theo thứ tự
- Ví dụ mẫu (Input/Output), mô tả đề bài
- Nộp từng câu → hệ thống chấm ngay
- Đồng hồ đếm ngược đến `deadline` cá nhân

---

## 🗂️ Cấu trúc Database (Tham khảo)

```
contests
  └── rounds (vòng thi, order_index)
       └── exam_boards (cụm thi)
       │    └── board_participants (thí sinh × cụm)
       └── exams (bộ đề)
            └── quest_data (JSON array of challenges)

participants (thí sinh, liên kết auth.users)
submissions (bài nộp)
contest_progress (tiến độ làm bài)
```

**Views phục vụ Live Monitor:**
- `board_leaderboard` — Bảng điểm theo Cụm
- `round_leaderboard` — Bảng điểm theo Vòng
- `contest_leaderboard` — Bảng điểm toàn Cuộc thi

---

## ⚙️ Biến Môi trường

### Contest Dashboard (`apps/contest-dashboard/.env`)

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJI...
VITE_LEARNER_APP_URL=https://quest-player.netlify.app
```

### React Quest App (`apps/react-quest-app/.env`)

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJI...
```

> ⚠️ `VITE_LEARNER_APP_URL` phải được đặt đúng để liên kết từ Dashboard → Lobby hoạt động chính xác.

---

## 🛠️ Xử lý Sự cố

| Vấn đề | Nguyên nhân | Cách xử lý |
|---|---|---|
| Thí sinh không đăng nhập được | Tài khoản chưa được tạo hoặc mật khẩu sai | Kiểm tra lại trên trang Accounts |
| Nút "Bắt đầu làm bài" không hiện | Chưa đến `startTime` hoặc `contest.status` chưa đúng | Kiểm tra thời gian hệ thống và trường `start_time` trong DB |
| Thí sinh vào Dashboard thay vì Lobby | Đăng nhập sai ứng dụng | Gửi đúng link Lobby cho thí sinh |
| Bảng Live Monitor không cập nhật | Supabase Realtime chưa bật cho bảng `submissions` | Bật Realtime trên Supabase dashboard |
| Tạo tài khoản thất bại | RPC `admin_create_participant_auth` chưa được tạo hoặc thiếu quyền | Kiểm tra Supabase → Database → Functions |

---

## 📡 Luồng Dữ liệu Đầy đủ

```
Admin tạo Contest
       │
       ▼
Tạo Rounds → ExamBoards → Exams → Challenges
       │
       ▼
Tạo tài khoản thí sinh (admin_create_participant_auth RPC)
       │
       ▼
Gán thí sinh → board_participants
       │
       ▼
Phát tài khoản + link Lobby cho thí sinh
       │
       ▼
[Thí sinh] Vào Lobby → Đăng nhập → Điền thông tin → Chờ
       │
       ▼
[Hệ thống] startTime đến → timeStatus = 'active'
       │
       ▼
[Thí sinh] Nhấn "Bắt đầu làm bài" → ExamRoom
       │
       ▼
Làm bài → Nộp → Submissions được lưu
       │
       ▼
[Admin] Giám sát Live → Leaderboard realtime
       │
       ▼
(Nếu nhiều vòng) Thăng hạng → Vòng tiếp theo
```
