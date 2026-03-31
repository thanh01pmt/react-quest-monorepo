import csv
import os

# Paths
CURRICULUM_PATH = 'tmp/curriculum-odoo.tsv'
LO_SHORT_PATH = 'tmp/lo_short_v2.tsv'
OUTPUT_DIR = 'tmp/readings'

# Ensure output directory exists
os.makedirs(OUTPUT_DIR, exist_ok=True)

def load_data():
    """Load curriculum and LO data from TSV files."""
    curriculum = []
    los_data = {}

    # Load LO data
    with open(LO_SHORT_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f, delimiter='\t')
        for row in reader:
            los_data[row['Name'].strip()] = row

    # Load Curriculum data
    with open(CURRICULUM_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f, delimiter='\t')
        for row in reader:
            curriculum.append(row)
            
    return curriculum, los_data

def get_code_snippet(lo_key, language):
    """Generate a generic code snippet based on LO type and language."""
    snippet = ""
    comment_char = "#"
    lang_normalized = language.split('/')[0].lower()
    
    if "lua" in lang_normalized:
        comment_char = "--"
    elif "js" in lang_normalized or "javascript" in lang_normalized:
        comment_char = "//"

    # Minimal Template Logic
    if "biến" in lo_key.lower() or "variable" in lo_key.lower():
        if "python" in lang_normalized:
            snippet = f"""# 1. Khai báo biến
player_name = "SuperCoder" # Chuỗi
score = 0                 # Số nguyên

# 2. Sử dụng biến
print(f"Chào {{player_name}}, điểm số hiện tại: {{score}}")
"""
        elif "lua" in lang_normalized:
            snippet = f"""-- 1. Khai báo biến
local playerName = "RobloxDev" -- Chuỗi
local score = 0               -- Số

-- 2. Sử dụng biến
print(playerName .. " có " .. score .. " điểm!")
"""
        elif "js" in lang_normalized:
             snippet = f"""// 1. Khai báo biến
let playerName = "WebMaster"; // Chuỗi
let score = 0;               // Số

// 2. Sử dụng biến
console.log(`${{playerName}} có ${{score}} điểm!`);
"""

    elif "vòng lặp" in lo_key.lower() or "loop" in lo_key.lower():
        if "python" in lang_normalized:
             snippet = f"""# Ví dụ: Lặp 5 lần để in thông báo
for i in range(1, 6):
    print(f"Lần lặp thứ {{i}}")
"""
        elif "lua" in lang_normalized:
             snippet = f"""-- Ví dụ: Lặp 5 lần
for i = 1, 5 do
    print("Lần lặp thứ " .. i)
end
"""
        elif "js" in lang_normalized:
             snippet = f"""// Ví dụ: Lặp 5 lần
for (let i = 1; i <= 5; i++) {{
    console.log("Lần lặp thứ " + i);
}}
"""

    elif "hàm" in lo_key.lower() or "function" in lo_key.lower():
        if "python" in lang_normalized:
             snippet = f"""# 1. Định nghĩa hàm
def say_hello(name):
    print(f"Xin chào {{name}}!")

# 2. Gọi hàm
say_hello("World")
"""
        elif "lua" in lang_normalized:
             snippet = f"""-- 1. Định nghĩa hàm
local function sayHello(name)
    print("Xin chào " .. name)
end

-- 2. Gọi hàm
sayHello("World")
"""
        elif "js" in lang_normalized:
             snippet = f"""// 1. Định nghĩa hàm
function sayHello(name) {{
    console.log("Xin chào " + name);
}}

// 2. Gọi hàm
sayHello("World");
"""

    if not snippet:
        snippet = f"{comment_char} TODO: Viết code minh họa cho '{lo_key}' ở đây."

    return snippet

def generate_markdown(lesson, los_details):
    """Generate Markdown content for a single lesson in Tutorial Structure."""
    
    code_header = lesson.get('Code', 'UNKNOWN')
    name = lesson.get('Name', 'Untitled')
    target = lesson.get('Target', 'Chưa có mô tả mục tiêu.')
    lesson_los_raw = lesson.get('Learning Objectives', '')
    learning_device = lesson.get('Learning Devices', '')
    
    # Parse Info
    los_list = [lo.strip() for lo in lesson_los_raw.split(',') if lo.strip()]
    parts = code_header.split('-')
    hp_part = "7.1" # Default fallback
    for part in parts:
        if part.startswith('HP'):
            hp_num = part.replace("HP", "")
        if part.startswith('lsn'):
             lsn_num = part.replace("lsn-", "")
    
    # Construct "Buổi Học X.Y"
    try:
        hp_part = f"{int(hp_num)}.{int(lsn_num)}"
    except:
        hp_part = code_header

    title = f"# Buổi Học {hp_part}: {name} 🚀"
    
    # 1. INTRO
    content = f"""{title}

Xin chào các bạn! 👋

Hôm nay chúng ta sẽ cùng nhau khám phá chủ đề: **{name}**.

{target}

**Mục tiêu hôm nay:**
"""
    valid_los = []
    for lo_key in los_list:
        lo_info = los_details.get(lo_key)
        if lo_info:
            valid_los.append(lo_info)
            content += f"*   Hiểu về **{lo_info['Name'].split('_')[-1]}** và cách sử dụng.\n"
        else:
             content += f"*   Tìm hiểu về {lo_key}.\n"

    content += "\nSẵn sàng chưa? Bắt đầu nào!\n\n---\n"

    # 2. SECTIONS (Tutorial Style: Concept -> Why -> How)
    for idx, lo in enumerate(valid_los, 1):
        concept_name = lo['Name'].split('_')[-1]
        
        # Header
        content += f"## {idx}. Khám Phá: {concept_name} 🧐\n\n"
        
        # What (Definition)
        content += f"**{concept_name} là gì?**\n"
        content += f"{lo['Description']}\n\n"
        
        # Why (Motivation - Templated)
        content += f"**Tại sao cần dùng {concept_name}?** 🤔\n"
        content += f"Trong lập trình, việc sử dụng `{concept_name}` giúp chúng ta giải quyết các vấn đề liên quan đến **{lo['Keywords']}**. Thay vì làm thủ công, `{concept_name}` giúp code gọn gàng và hiệu quả hơn.\n\n"
        
        # How (Usage/Example)
        content += f"**Cách sử dụng như thế nào?** 🛠️\n"
        content += f"Dưới đây là ví dụ cơ bản về `{concept_name}` trong {learning_device.split('/')[0]}:\n\n"
        
        lang_code = learning_device.split('/')[0].lower().replace('figma', '')
        if not lang_code: lang_code = "text"
        
        content += "```" + lang_code + "\n"
        content += get_code_snippet(lo['Name'], learning_device)
        content += "\n```\n\n"
        
        content += "---\n\n"

    # 3. PRACTICE (Dự án thực tế)
    content += f"## 🚀 Thử Thách: Xây Dựng {name}\n\n"
    content += f"Bây giờ là lúc thực hành! Chúng ta sẽ cùng nhau xây dựng **{name}**.\n\n"
    
    content += f"### Mục tiêu dự án:\n"
    content += f"{target}\n\n"
    
    content += f"### Các bước thực hiện:\n"
    content += f"1.  **Chuẩn bị**: Mở phần mềm {learning_device}.\n"
    content += f"2.  **Khởi tạo**: Tạo một dự án mới tên là `{name.replace(' ', '')}`.\n"
    
    for i, lo in enumerate(valid_los):
        concept_name = lo['Name'].split('_')[-1]
        content += f"{i+3}.  **Áp dụng {concept_name}**: Sử dụng kiến thức vừa học để {lo['Description'].lower()}.\n"
        
    content += f"{len(valid_los)+3}.  **Kiểm tra**: Chạy thử chương trình và sửa lỗi nếu có.\n\n"

    content += "---\n\n"
    content += f"**Tóm tắt bài học:**\n"
    for lo in valid_los:
        content += f"*   **{lo['Name'].split('_')[-1]}**: {lo['Description']}\n"
    
    content += "\nChúc các bạn thành công! Đừng quên lưu lại dự án nhé! 💾\n"

    return hp_part, name, content

def main():
    curriculum, los_details = load_data()
    
    count = 0
    for lesson in curriculum:
        hp_code, lesson_name, md_content = generate_markdown(lesson, los_details)
        
        # Filename logic
        try:
             lsn_num = lesson['Code'].split('-lsn-')[-1]
             hp_num = lesson['Code'].split('-HP')[-1].split('-')[0]
             filename = f"Reading_HP{int(hp_num):02d}_Lsn{int(lsn_num):02d}.md"
        except:
             filename = f"{lesson['Code']}.md"

        filepath = os.path.join(OUTPUT_DIR, filename)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(md_content)
        count += 1
        
    print(f"Generated {count} enriched reading files in {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
