# **Thiết kế, Kiến trúc và Triển khai Hệ thống Thi Lập trình Scratch Nội bộ Đồng dạng "Tin học trẻ" Dựa trên Nền tảng TurboWarp**

## **1\. Tổng quan Kiến trúc và Tầm nhìn Hệ thống Đánh giá Lập trình Khối lệnh**

Sự phát triển mạnh mẽ của các nền tảng giáo dục công nghệ đã thúc đẩy nhu cầu chuẩn hóa và tự động hóa quá trình đánh giá năng lực lập trình của học sinh. Đối với ngôn ngữ lập trình trực quan dựa trên khối lệnh (block-based programming) như Scratch, việc xây dựng một hệ thống thi đấu nội bộ tương đương với quy chuẩn của cuộc thi "Tin học trẻ" cấp quốc gia đòi hỏi một kiến trúc kỹ thuật phức tạp và sự kiểm soát nghiêm ngặt về môi trường thực thi.1 Ngược lại với các ngôn ngữ biên dịch dạng văn bản truyền thống (như C++, Python hay Pascal) vốn có thể dễ dàng được phân tích trên các hệ thống chấm điểm tự động (Online Judge) thông qua luồng dữ liệu vào/ra tiêu chuẩn (Standard Input/Output), Scratch lưu trữ toàn bộ logic dưới dạng cây cú pháp trừu tượng (Abstract Syntax Tree \- AST) bên trong một tệp tin nén định dạng JSON đóng gói có phần mở rộng .sb3.3 Việc đánh giá tính đúng đắn của các bài thi Scratch đòi hỏi một máy ảo (Virtual Machine) có khả năng mô phỏng hoàn chỉnh môi trường đồ họa, quản lý luồng sự kiện (event-driven architecture) và theo dõi sát sao sự thay đổi trạng thái của các biến số (variables) cũng như danh sách (lists) theo thời gian thực.4

Nền tảng TurboWarp, một bản phân nhánh (fork) nâng cao của Scratch, nổi lên như một giải pháp tối ưu nhất cho bài toán này. Bằng cách áp dụng cơ chế biên dịch (compiler) trực tiếp các khối lệnh Scratch thành mã JavaScript gốc thay vì thông dịch (interpret) từng bước chậm chạp như trình thông dịch Scratch mặc định, TurboWarp cải thiện tốc độ thực thi dự án lên từ 10 đến 100 lần.6 Sự gia tăng đột phá về mặt hiệu năng này là yếu tố cốt lõi cho phép hệ thống chạy kiểm thử qua hàng chục bộ dữ liệu (testcases) phức tạp trong một giới hạn thời gian nghiêm ngặt của các cuộc thi thuật toán.7 Hơn thế nữa, TurboWarp hỗ trợ cơ chế nạp các tiện ích mở rộng không bị giới hạn bởi hộp cát bảo mật (unsandboxed extensions), cho phép mã JavaScript tùy chỉnh can thiệp sâu vào các đối tượng lõi của máy ảo (như đối tượng Scratch.vm) để kiểm soát toàn diện bộ đếm thời gian (timer), nạp dữ liệu đầu vào động và truy xuất kết quả đầu ra.8

Kiến trúc tổng thể của một hệ thống thi đấu nội bộ đồng dạng Tin học trẻ được chia thành ba phân hệ chính, hoạt động liên kết chặt chẽ với nhau. Phân hệ thứ nhất là Frontend (Giao diện người dùng), nơi thí sinh tương tác trực tiếp, bao gồm một bản dựng (build) tùy chỉnh của giao diện TurboWarp (scratch-gui) đã được nhúng sẵn tiện ích mở rộng chấm điểm nội bộ.10 Phân hệ thứ hai là Backend API, chịu trách nhiệm quản lý phiên thi, xác thực người dùng, phân phối đề thi dưới dạng tệp tin JSON và tiếp nhận kết quả nộp bài.11 Phân hệ thứ ba là Worker / Judging System (Hệ thống máy chấm), thực thi các tệp tin .sb3 của thí sinh trên môi trường Node.js không có giao diện đồ họa (headless environment) nhằm đảm bảo tính minh bạch, sự độc lập tuyệt đối, và ngăn chặn hoàn toàn các hành vi giả mạo kết quả đánh giá từ phía máy khách (client-side).7 Toàn bộ tài liệu này sẽ đi sâu vào phân tích cách thức thiết lập tiện ích mở rộng, chuẩn hóa môi trường Stage, thao tác với luồng dữ liệu I/O, và các chiến lược triển khai bảo mật cao nhất để tạo ra một sân chơi công bằng và chuyên nghiệp.

## **2\. Tiêu chuẩn hóa Môi trường Đồ họa và Quản lý Không gian Làm việc**

Để quá trình chấm điểm tự động diễn ra chính xác và không xuất hiện các sai số (flaky tests) do hệ thống kết xuất đồ họa (rendering engine), môi trường thiết kế dự án của thí sinh phải tuân thủ theo những tiêu chuẩn kỹ thuật không gian khắt khe. Các yêu cầu này phản ánh chính xác cấu trúc của các bài thi thuật toán Tin học trẻ hiện hành, đặc biệt là ở bảng A và B cấp Tiểu học và Trung học Cơ sở.13

### **Quy chuẩn Tọa độ và Phân giải Lưới (Grid System)**

Môi trường hiển thị mặc định của Scratch (được gọi là Stage) sử dụng hệ trục tọa độ Descartes với tâm tọa độ gốc ![][image1] nằm ở vị trí chính giữa màn hình. Chiều rộng tiêu chuẩn của Stage được cố định ở mức 480 pixel (trục X kéo dài từ ![][image2] ở viền trái đến ![][image3] ở viền phải) và chiều cao là 360 pixel (trục Y kéo dài từ ![][image4] ở viền đáy đến ![][image5] ở đỉnh trên). Theo đặc tả kỹ thuật của đề thi, không gian liên tục này phải được lượng tử hóa thành một lưới tọa độ rời rạc (grid) bao gồm 24 cột và 18 hàng.14 Từ đó, kích thước của mỗi ô lưới được xác định chính xác theo công thức toán học cơ bản:

Chiều rộng ô lưới bằng thương số của ![][image6] chia cho ![][image7], tương đương ![][image8] pixel. Chiều cao ô lưới bằng thương số của ![][image9] chia cho ![][image10], tương đương ![][image8] pixel.

Thí sinh được yêu cầu điều khiển đối tượng (sprite) di chuyển trên các giao điểm hoặc trung tâm của lưới tọa độ này bằng các khối lệnh di chuyển tuyệt đối hoặc di chuyển tương đối với bước nhảy là bội số của 20\. Để hỗ trợ trực quan, hệ thống cần cung cấp sẵn một phông nền (backdrop) mang tên "Coordinates" vẽ sẵn các đường lưới ![][image11] pixel. Sự chuẩn hóa này không chỉ giúp học sinh dễ dàng hình dung không gian ma trận mà còn hỗ trợ tiện ích JavaScript của hệ thống chấm điểm thực hiện các phép toán module (modulo arithmetic) để ánh xạ tọa độ pixel về tọa độ ma trận lưới một cách dễ dàng, từ đó đối chiếu với mảng kết quả kỳ vọng (expected array) một cách chính xác tuyệt đối.

| Tham số Kỹ thuật | Khai báo trong Hệ thống VM | Giá trị Quy chuẩn | Mục đích Cấu trúc |
| :---- | :---- | :---- | :---- |
| Không gian trục X | Scratch.vm.runtime.stageWidth | Chạy từ ![][image2] đến ![][image3] | Phân định ranh giới biên ngang của thuật toán. |
| Không gian trục Y | Scratch.vm.runtime.stageHeight | Chạy từ ![][image4] đến ![][image5] | Phân định ranh giới biên dọc của thuật toán. |
| Kích thước ô lưới | Tham số logic tự định nghĩa | ![][image11] pixel | Chuẩn hóa bước nhảy (move steps) và phát hiện va chạm. |
| Lưới tổng thể | Tương đương mảng 2 chiều | ![][image7] cột ![][image12] hàng | Chuyển đổi bài toán đồ họa thành bài toán ma trận toán học. |

### **Quản lý Đối tượng (Sprites) và Triệt tiêu Nhiễu Hệ thống**

Trong các bài toán yêu cầu mô phỏng sự di chuyển (ví dụ: robot tìm đường trong mê cung, hoặc thuật toán loang), để quá trình trích xuất vị trí cuối cùng (checker) hoạt động ổn định, tệp dự án (project) chỉ được phép duy trì duy nhất một đối tượng chính (main sprite). Đối tượng này thông thường là nhân vật "Cat" mặc định của Scratch hoặc một hình vuông cơ bản (kích thước ![][image11] pixel) tuỳ theo chỉ định cụ thể của đề bài. Tất cả các đối tượng thừa khác, bao gồm cả các bản sao (clones) không nằm trong quy định, phải bị xóa hoàn toàn khỏi khu vực quản lý đối tượng hoặc bị thiết lập thuộc tính ẩn (hide).

Vị trí khởi tạo ban đầu của đối tượng chính phải được đưa về tọa độ trung tâm ![][image1] hoặc một tọa độ cụ thể theo hướng dẫn của đề bài ngay khi cờ xanh được nhấn. Việc chuẩn hóa trạng thái khởi tạo này nhằm mục đích loại bỏ hiện tượng sai lệch tọa độ cộng dồn qua nhiều lần máy ảo thực thi các vòng lặp testcase khác nhau. Trong mã nguồn JavaScript của tiện ích mở rộng, hệ thống chấm điểm sẽ sử dụng thuộc tính util.target để tạo một tham chiếu trực tiếp đến đối tượng hiện đang thực thi mã. Thông qua đối tượng target này, tiện ích có thể truy xuất các thuộc tính nội tại như target.x và target.y bất kể tên của sprite đó là gì, giúp việc thu thập dữ liệu đầu ra không bị phụ thuộc vào cách thí sinh đặt tên nhân vật.

## **3\. Kiến trúc Dữ liệu Đầu vào / Đầu ra (Input/Output Stream) và Biến Trạng thái**

Sự khác biệt lớn nhất giữa lập trình văn bản và lập trình khối lệnh Scratch nằm ở cơ chế luân chuyển dữ liệu. Các hệ thống chấm điểm thông thường (Online Judge) trao đổi dữ liệu qua luồng stdin và stdout. Tuy nhiên, trong cấu trúc máy ảo Scratch, dữ liệu được biểu diễn thông qua cấu trúc dữ liệu Biến (Variables) và Danh sách (Lists). Do đó, đề thi chuẩn cần phải thiết lập một giao thức I/O tĩnh dựa trên bộ nhớ (memory-based I/O protocol) được quy ước từ trước.

### **Quy định Luồng Dữ liệu Danh sách (List-based I/O)**

Thay vì cho phép thí sinh sử dụng các khối lệnh nhập liệu thủ công đòi hỏi tương tác vật lý (chẳng hạn như khối ask and wait hay các cảm biến ngoại vi như microphone, webcam/video sensing), hệ thống chỉ định sử dụng Danh sách (Lists) làm phương tiện truyền tải thông tin duy nhất.15 Việc sử dụng tương tác người dùng sẽ làm đình trệ (block) chu trình vòng lặp sự kiện (event loop) của máy ảo khi hệ thống tự động chạy headless trên máy chủ, dẫn đến lỗi quá thời gian (Timeout). Ngược lại, dữ liệu đầu vào (ví dụ: một mảng chứa hàng loạt tọa độ vật cản, hay danh sách các lệnh điều hướng mô phỏng) sẽ được máy chấm nạp trực tiếp vào một danh sách mang tên tĩnh, điển hình là inputData. Thí sinh có nhiệm vụ sử dụng các khối lập trình tuần tự đọc dữ liệu từ danh sách inputData này, đưa qua bộ xử lý thuật toán (ví dụ: duyệt mảng, tìm kiếm, phân loại), và sau đó thêm (append) kết quả cuối cùng vào một danh sách đầu ra mang tên output.

Dữ liệu kỳ vọng (đáp án chuẩn của ban tổ chức) sẽ được hệ thống nạp ngầm vào một danh sách khác mang tên expected (có thể được ẩn đi trên giao diện để tránh thí sinh sao chép). Khi bộ đếm thời gian kết thúc hoặc khi dự án hoàn thành luồng mã, tiện ích kiểm tra sẽ tiến hành so sánh nội dung của danh sách output và danh sách expected.

| Cấu trúc Dữ liệu Scratch | Quy ước Đặt tên | Mục đích và Cơ chế Hoạt động |
| :---- | :---- | :---- |
| Danh sách (List) | inputData | Nơi hệ thống tiện ích mở rộng (Extension) ghi mảng dữ liệu thử nghiệm từ file JSON vào bộ nhớ của máy ảo. Thí sinh chỉ được quyền đọc. |
| Danh sách (List) | output | Nơi thuật toán của thí sinh trả về kết quả. Tiện ích sẽ lấy dữ liệu từ đây để so khớp. |
| Danh sách (List) | expected | Lưu trữ đáp án chính xác của ban tổ chức cho testcase hiện tại. Dùng làm tham chiếu cho hàm checkResult. |
| Biến toàn cục (Global) | score | Hiển thị điểm số hiện tại của thí sinh dựa trên tỷ lệ vượt qua testcase. |
| Biến toàn cục (Global) | time | Hiển thị lượng thời gian còn lại (tính bằng giây) trước khi hệ thống ngắt tiến trình VM. |

### **Hạn chế Biến Đám mây (Cloud Variables) và Rò rỉ Tài nguyên**

Một lưu ý triển khai vô cùng quan trọng là việc cấm tuyệt đối sự hiện diện của Biến đám mây (Cloud Variables) trong các bài nộp. Trong kiến trúc máy ảo Scratch chuẩn, các biến đám mây tự động thiết lập các kết nối WebSockets (network requests) về phía máy chủ trung tâm của MIT.17 Việc kích hoạt các kết nối mạng này từ môi trường máy chủ nội bộ hoặc trình duyệt bị giới hạn kết nối (sandboxed environment) sẽ gây ra độ trễ mạng (network latency), từ chối kết nối (CORS errors) hoặc thậm chí làm rò rỉ dữ liệu đề thi ra bên ngoài mạng lưới kiểm soát của ban tổ chức. Các biến hệ thống như score và time phải được khai báo dưới định dạng biến toàn cục thông thường (Local/Global Variables lưu trữ trên RAM) và chịu sự kiểm soát trực tiếp bởi mã JavaScript của hệ thống.

## **4\. Phân tích Cấu trúc và Mã nguồn Tiện ích Mở rộng (Unsandboxed Extension)**

Trái tim của hệ thống thi phía trình duyệt là một tiện ích mở rộng (extension) tùy chỉnh được lập trình bằng JavaScript, tích hợp sâu vào giao diện TurboWarp. Tiện ích này đóng vai trò như một hệ thống giám khảo cục bộ (local judge), đảm nhiệm việc tải đề thi, áp đặt giới hạn thời gian thực thi, cung cấp luồng dữ liệu kiểm thử và so sánh kết quả cuối cùng.

### **Yêu cầu Kiến trúc Bỏ Hộp cát (Unsandboxed Architecture)**

Việc sử dụng mẫu kiến trúc unsandboxed là điều kiện tiên quyết và không thể thay thế. Trong hệ sinh thái tiêu chuẩn của Scratch và các phiên bản cũ, các tiện ích mở rộng thường được thiết kế để chạy bên trong một Hộp cát (Sandbox) dạng Web Worker.8 Web Worker cung cấp một mức độ bảo mật cao bằng cách tách biệt luồng mã của tiện ích khỏi luồng thực thi chính của trình duyệt (Main Thread), nhưng đồng thời nó cũng tước đi quyền truy cập vào các thành phần nội tại của đối tượng Scratch.vm. Một tiện ích sandboxed không thể thực hiện các tác vụ can thiệp sâu như dừng máy ảo đột ngột, truy xuất trực tiếp đối tượng Target để lấy biến số, hoặc ghi đè (override) các hàm vòng đời (lifecycle methods) của hệ thống.8

Chỉ với cấu trúc unsandboxed, đoạn mã JavaScript mới được chạy chung ngữ cảnh (context) với máy ảo, cho phép khai thác toàn bộ sức mạnh của đối tượng Scratch.vm và vm.runtime. Dòng mã if (\!Scratch.extensions.unsandboxed) throw new Error('Contest needs unsandboxed'); là cơ chế phòng vệ đầu tiên để đảm bảo tiện ích được cấp đủ quyền hạn trước khi khởi tạo.9

### **Phân tích Mã Nguồn contest.js**

Cấu trúc mã nguồn cơ bản của tiện ích được bao bọc trong một biểu thức hàm thực thi ngay lập tức (IIFE) nhằm tránh gây ô nhiễm không gian biến toàn cục (global namespace) của trình duyệt.

Lớp TinHocTreContest khai báo hàm getInfo(), có nhiệm vụ trả về siêu dữ liệu (metadata) mô tả cấu trúc giao diện của tiện ích đối với trình biên tập. Cụ thể, hàm này định nghĩa một khối lệnh hành động (Command Block) mang tên startContest dùng để nạp và kích hoạt đề thi dựa trên một tham số chuỗi ID (ví dụ: 'dem1', 'dem2'). Tiếp theo, hệ thống định nghĩa hai khối lệnh báo cáo (Reporter Blocks): getTimeLeft để trích xuất thời lượng còn lại, và checkResult nhằm đối chiếu kết quả đầu ra. Việc định nghĩa một menu thả xuống (dropdown menu) chứa ID các đề thi cũng được khai báo tĩnh trong đối tượng menus, giúp thí sinh dễ dàng chọn đề bài.20

Hàm startContest(args, util) là nơi khởi phát chu trình kiểm thử. Khi khối lệnh này được kích hoạt, hệ thống sẽ sử dụng hàm fetch() để gửi yêu cầu HTTP tải tệp tin JSON chứa dữ liệu đầu vào. Thông qua lời gọi runtime.getTargetForStage().lookupVariableByNameAndType('inputData', 'list').value \= data;, hệ thống can thiệp trực tiếp vào bộ nhớ (RAM) của máy ảo, ghi đè mảng dữ liệu vào danh sách của dự án với tốc độ tính bằng mili-giây. Ngay sau đó, biến lớp this.startTime được lưu mốc thời gian thực tại bằng Date.now(), và biến this.duration được gán giá trị thời gian giới hạn (ví dụ ![][image13] mili-giây tương đương 60 giây). Cuối cùng, hàm vm.greenFlag() được kích hoạt bằng mã lập trình, tự động phát tín hiệu mô phỏng hành động người dùng nhấp vào lá cờ xanh trên giao diện, kích hoạt đồng loạt tất cả các luồng (threads) bắt đầu bằng sự kiện whenGreenFlag bên trong không gian bài làm của thí sinh.

Hàm getTimeLeft() được gọi liên tục trong một vòng lặp để cập nhật giao diện. Khối này thực hiện một phép trừ đơn giản giữa thời gian hiện tại (Date.now()) và this.startTime, sau đó lấy this.duration trừ đi lượng thời gian đã trôi qua. Kết quả được chia cho 1000 để chuyển đổi thành định dạng giây và được bảo vệ bởi hàm Math.max(0,...) để đảm bảo đồng hồ không bao giờ hiển thị giá trị âm.

Hàm checkResult(args, util) là bộ vi xử lý logic định chuẩn (checker). Hàm này tận dụng tham số util.target để tham chiếu đến đối tượng (sprite) đang gọi khối lệnh. Từ đối tượng này, hệ thống sử dụng hàm nội tại lookupVariableByNameAndType để thu thập tham chiếu đến danh sách output và expected. Do bản chất so sánh tham chiếu mảng (array reference comparison) trong JavaScript sẽ luôn trả về false đối với hai mảng độc lập dù nội dung giống nhau, hệ thống áp dụng kỹ thuật tuần tự hóa chuỗi (string serialization) bằng phương thức .join(','). Biểu thức outputList.value.join(',') \=== expectedList.value.join(',') đảm bảo nội dung, số lượng phần tử và thứ tự của các phần tử được so khớp một cách tuyệt đối (strict equality). Giá trị boolean trả về sẽ quyết định bài làm được ghi nhận thành công hay thất bại đối với testcase đó.

## **5\. Quản trị Khối lượng Công việc Máy ảo (VM Lifecycle) và Tối ưu Hóa**

Quá trình chạy hàng chục testcases trên một tệp tin Scratch tiềm ẩn nguy cơ làm tê liệt máy ảo do kiến trúc vòng lặp vô tận (infinite loops) mà các thí sinh thường vô tình tạo ra.

### **Ghi đè Sự kiện Khởi tạo (Overriding Green Flag)**

Một kỹ thuật nâng cao được áp dụng để duy trì sự kiểm soát tuyệt đối là ghi đè (overriding) nguyên mẫu (prototype) của hàm requestGreenFlag. Thay vì chỉ gọi vm.greenFlag() thông thường, tiện ích mở rộng có thể đánh chặn sự kiện này ở cấp độ lõi:

Hệ thống lưu lại hàm gốc const originalGreenFlag \= Scratch.vm.runtime.requestGreenFlag;. Sau đó, hệ thống gán lại hàm bằng một logic tùy chỉnh: mỗi khi cờ xanh được nhấn (dù là thông qua giao diện người dùng hay do mã kích hoạt), hệ thống sẽ bắt buộc gọi lại hàm gán thời gian this.startTime \= Date.now(); trước khi thực thi originalGreenFlag.call(this);. Sự can thiệp này đảm bảo rằng không một kịch bản nào của thí sinh có thể khởi chạy mà hệ thống đếm giờ không được kích hoạt, triệt tiêu khả năng gian lận thời gian làm bài.

### **Ngăn chặn Lặp Vô hạn (Infinite Loop Prevention) và Dừng Hệ thống**

Một trong những hạn chế kỹ thuật lớn nhất của trình thông dịch Scratch là tính dễ tổn thương trước các vòng lặp thiếu điều kiện thoát (ví dụ: vòng lặp repeat until với điều kiện không bao giờ xảy ra). Nếu không có cơ chế bảo vệ, luồng thực thi (main thread) của trình duyệt sẽ bị khóa chặt, dẫn đến hiện tượng treo trang web (browser crash).

Để khắc phục, song song với việc tính toán trong hàm getTimeLeft(), một trình theo dõi vòng đời (lifecycle watcher) được nhúng vào bên trong phương thức runtime.on('TICK',...) của máy ảo. Ở mỗi nhịp đồng hồ (tick) của hệ thống—thường là 30 lần mỗi giây trong môi trường Scratch chuẩn—trình theo dõi sẽ kiểm tra nếu thời gian trôi qua vượt quá giới hạn cho phép (ví dụ ![][image14] giây). Ngay khi điều kiện này thỏa mãn, đoạn mã sẽ kích hoạt một lệnh ngắt cưỡng bức: vm.stopAll(). Lệnh này ngay lập tức xóa sạch ngăn xếp lệnh (call stack) của tất cả các luồng đang hoạt động, loại bỏ mọi đối tượng bản sao (clones) và thiết lập lại trạng thái âm thanh, giải phóng bộ nhớ RAM và CPU của trình duyệt.

Hơn nữa, thông số vm.turboMode của máy ảo đóng vai trò then chốt. Chế độ Turbo (Turbo Mode) trong Scratch loại bỏ độ trễ màn hình đồ họa 1/30 giây ở cuối mỗi vòng lặp, khiến mã thực thi ở tốc độ xung nhịp CPU tối đa.6 Trong môi trường thi thuật toán, yêu cầu thường là thiết lập vm.turboMode \= false để giữ vững tính chuẩn xác của các khối lệnh va chạm và đồ họa mô phỏng theo tốc độ chuẩn, giúp thí sinh dễ dàng theo dõi trực quan quá trình di chuyển của đối tượng trên lưới tọa độ. Tuy nhiên, nếu đề thi chỉ thuần túy chấm thuật toán xử lý dữ liệu và không yêu cầu diễn họa trực quan, việc kích hoạt Turbo Mode hoặc sử dụng trình biên dịch tích hợp của TurboWarp (compiler) sẽ giúp quá trình kiểm thử các testcases có khối lượng lớn hoàn thành trong vòng vài phần nghìn giây.

## **6\. Cấu trúc JSON Đề thi và Hệ thống Testcases Động**

Để hệ thống tiện ích mở rộng có thể vận hành độc lập đối với từng bài thi, dữ liệu đề bài không được mã hóa cứng (hardcode) vào tệp JavaScript. Thay vào đó, toàn bộ kịch bản bài thi, bao gồm siêu dữ liệu mô tả và các bộ kiểm thử, được định dạng theo cấu trúc JSON (JavaScript Object Notation) và được lưu trữ trên hệ thống máy chủ Backend.22

### **Tổ chức Dữ liệu Khách quan (JSON Schema)**

Mỗi đề thi được đại diện bởi một tệp tin JSON tải về qua giao thức HTTP fetch. Cấu trúc của tệp tin này bao gồm các tham số định tuyến môi trường và một mảng chứa dữ liệu các testcase. Một bài thi Tin học trẻ thường bao gồm từ 3 đến 5 testcases, bao trùm cả các bài test dữ liệu nhỏ (thử nghiệm logic) và dữ liệu lớn (thử nghiệm hiệu năng).15

| Cấp trúc Khóa (JSON Key) | Kiểu Dữ liệu (Data Type) | Diễn giải Chức năng Kỹ thuật |
| :---- | :---- | :---- |
| problem\_id | Chuỗi (String) | Mã định danh duy nhất của đề thi. Liên kết với DE\_ID. |
| time\_limit | Số nguyên (Integer) | Giới hạn thời gian sống (tính bằng giây hoặc mili-giây) của tiến trình VM. |
| test\_cases | Mảng Đối tượng (Array of Objects) | Tập hợp các kịch bản kiểm thử độc lập cho bài toán. |
| test\_cases.weight | Số nguyên (Integer) | Trọng số điểm (thường là 10 hoặc 20 điểm trên mỗi bài test). |
| test\_cases.input | Mảng (Array) | Danh sách dữ liệu sẽ được tiêm (inject) vào danh sách inputData. |
| test\_cases.expected | Mảng (Array) | Kết quả chuẩn xác để so khớp với danh sách output sinh ra từ bài làm. |

### **Quá trình Load JSON và Đánh giá Điểm số (Evaluation Metric)**

Trong quy trình thực thi, khi người dùng nhấp chọn đề thi, tiện ích sẽ tải về đối tượng JSON này. Với mỗi testcase trong mảng test\_cases, tiện ích sẽ đặt lại (reset) môi trường máy ảo, xóa sạch danh sách output, thiết lập mảng input vào máy ảo và bắt đầu phát cờ xanh.

Sau khi tín hiệu dừng dự án được ghi nhận (hoặc hết thời gian), hàm checkResult sẽ thực thi. Điểm số của bài làm được tích lũy dựa trên số lượng testcase được đánh giá là true. Tổng điểm của thí sinh bằng tổng weight của các testcase đã vượt qua. Theo quy chuẩn đánh giá của hệ thống, một bài nộp có thể được xem là "Đạt" và hiển thị thông báo phản hồi (ví dụ: thông qua lệnh target.setSay('Đạt', 2\) làm nhân vật phát ra lời thoại) nếu tổng điểm đạt mức tối thiểu ![][image15] so với tổng điểm tuyệt đối của bộ dữ liệu. Cơ chế phân bổ điểm này khuyến khích thí sinh tư duy giải quyết được phần lớn các tình huống của bài toán, ngay cả khi thuật toán chưa đủ hoàn hảo để xử lý các trường hợp biên (edge cases).

## **7\. Quy trình Triển khai Cục bộ và Đóng gói Ứng dụng (Deployment & Packager)**

Việc phát triển và chạy thử nghiệm hệ thống chấm điểm yêu cầu một môi trường triển khai chặt chẽ, trước khi đưa nền tảng lên máy chủ trực tuyến. Quy trình này bao gồm việc thiết lập máy chủ tĩnh cục bộ (Localhost) và tận dụng công cụ đóng gói chuyên dụng của hệ sinh thái TurboWarp.6

### **Thiết lập Máy chủ Môi trường Phát triển (Development Server)**

Do các chính sách bảo mật chia sẻ tài nguyên nguồn gốc chéo (CORS) của trình duyệt web hiện đại, các tệp tiện ích mở rộng dạng JavaScript không thể được tải trực tiếp thông qua giao thức file://. Để tiện ích unsandboxed contest.js được trình duyệt chấp nhận, nhà phát triển phải khởi chạy một máy chủ HTTP cục bộ.9 Quá trình này được thực thi thông qua môi trường Node.js. Từ kho lưu trữ mã nguồn tiện ích (extensions repo), lập trình viên thực thi lệnh npm run dev để kích hoạt một tiến trình máy chủ lắng nghe tại cổng mạng 8000 (http://localhost:8000/contest.js).

Trên giao diện TurboWarp Desktop hoặc bản web thử nghiệm, người dùng tiến hành tải (load) đường dẫn này vào mục "Custom Extension" và chọn tùy chọn "Unsandboxed" (không sử dụng hộp cát). Sau đó, tạo một dự án mẫu (project test) chứa đoạn lệnh mô phỏng việc gọi khối Bắt đầu đề thi dem1, chạy thử và quan sát log hệ thống trên màn hình Developer Tools (F12) để xác minh xem tính năng đồng hồ đếm ngược và bộ so khớp đáp án (checker) có phản hồi chính xác hay không.26

### **Công nghệ Đóng gói Standalone (@turbowarp/packager)**

Trong một số trường hợp cuộc thi được tổ chức ở khu vực thiếu kết nối mạng ổn định, việc duy trì hệ thống web trực tuyến có thể gặp rủi ro. Hệ sinh thái cung cấp công cụ @turbowarp/packager, một bộ thư viện mạnh mẽ cho phép hợp nhất (bundle) toàn bộ máy ảo scratch-vm, giao diện hiển thị đồ họa, dự án bài làm (tệp .sb3), và tập lệnh tiện ích contest.js thành một tệp tin mã HTML duy nhất (Single HTML file) hoặc đóng gói thành tệp thực thi độc lập (Executable file dạng .exe, .app hoặc .deb thông qua framework Electron).6

Bằng công cụ packager, toàn bộ môi trường thi đấu, dữ liệu kiểm thử JSON và hệ thống giới hạn thời gian được "đóng băng" tại một thời điểm, trở thành một phần mềm độc lập (standalone app) phân phối đến từng máy trạm của thí sinh. Tuy nhiên, kiến trúc này chỉ phù hợp với các vòng thi sơ khảo cơ sở, vì việc phân phối mã nguồn máy chấm trực tiếp xuống máy tính (client) mang lại rủi ro bị dịch ngược (reverse engineering) để trích xuất mảng expected ẩn bên trong.

## **8\. Tích hợp Giao diện Tùy chỉnh (Custom GUI Build) và Mặc định hóa Tiện ích**

Để triển khai cuộc thi quy mô quốc gia một cách chuyên nghiệp, ban tổ chức không thể yêu cầu hàng nghìn thí sinh tự tay dán đường dẫn URL vào bảng "Custom Extension". Tiện ích mở rộng chấm điểm bắt buộc phải được nhúng trực tiếp (hardcoded) vào mã nguồn nền tảng, tạo thành một giao diện TurboWarp độc quyền của riêng ban tổ chức thi.10

### **Xây dựng Giao diện từ Mã nguồn (Building scratch-gui)**

Trình biên tập TurboWarp được xây dựng dưới dạng một ứng dụng trang đơn (Single Page Application \- SPA) dựa trên thư viện React. Để tạo ra bản phân phối tuỳ chỉnh, đội ngũ kỹ thuật tiến hành nhân bản mã nguồn (git clone) kho lưu trữ scratch-gui và cài đặt các thư viện phụ thuộc thông qua câu lệnh npm ci (đảm bảo tính nhất quán của cây phụ thuộc).10

Để nhúng tiện ích TinHocTreContest vĩnh viễn vào hệ thống, nhà phát triển cần chỉnh sửa tập tin quản lý cấu hình lõi nằm tại src/extension-support/extension-manager.js.21 Thay vì tải động qua URL mạng, lớp đối tượng của tiện ích sẽ được đăng ký tĩnh. Mã nguồn JavaScript của tiện ích được lưu trữ vật lý trong thư mục dự án, sau đó khai báo đối tượng bằng phương thức \_registerInternalExtension(). Tiến trình này gắn liền một mã định danh (ví dụ tinhocTreContest) vào bản đồ \_loadedExtensions của bộ quản lý.19

Khi quá trình này hoàn tất, lập trình viên thi hành lệnh NODE\_ENV=production npm run build.10 Trình biên dịch Webpack sẽ nén (minify) toàn bộ tài nguyên CSS/JS, tạo ra thư mục build/ chứa một hệ thống web độc lập, nơi tiện ích giám khảo đã tồn tại như một khối lệnh mặc định, tương tự như khối lệnh "Chuyển động" hay "Hiển thị". Không có bất kỳ cảnh báo bảo mật unsandboxed nào hiện lên gây cản trở trải nghiệm của học sinh.

### **Vô hiệu hóa Các Chức năng Không Cần Thiết**

Bên cạnh việc thêm tiện ích, một bản dựng GUI tùy chỉnh còn cho phép ẩn hoặc vô hiệu hóa các công cụ (UI components) không được phép dùng trong phòng thi. Để đảm bảo tính chất bài thi chỉ yêu cầu thuật toán, các vùng chọn thêm Sprite mới, tính năng chỉnh sửa Âm thanh (Sound Editor), hoặc tính năng vẽ Phông nền (Backdrops) có thể bị loại bỏ (render-blocking) bằng cách sửa đổi cấu trúc cây component của React. Sự tối giản hóa giao diện này không chỉ giảm thiểu rủi ro thí sinh vô tình tạo ra các tác vụ làm rối loạn môi trường VM, mà còn giảm tải dung lượng bộ nhớ khi trang web hoạt động trên các máy tính cấu hình thấp tại phòng thi.

## **9\. Kiến trúc Backend Chấm điểm Độc lập (Headless Judging System)**

Như đã đề cập ở phần Đóng gói, nếu hệ thống dựa hoàn toàn vào khả năng kiểm tra kết quả trên trình duyệt máy khách (Client-Side Evaluation), nó sẽ dễ dàng trở thành mục tiêu của các lỗ hổng giả mạo (spoofing). Trong một cuộc thi trực tuyến như "Tin học trẻ", việc tin tưởng hoàn toàn vào giao diện frontend là một sai lầm bảo mật nghiêm trọng.15 Lớp phòng vệ cốt lõi nhất và cũng là mảnh ghép phức tạp nhất trong toàn bộ nền tảng chính là máy chấm điểm độc lập vận hành trên máy chủ (Server-side Headless Judging).

### **Cơ chế Tách biệt Dữ liệu và Xếp hạng VNOJ**

Theo quy chế chuẩn của định dạng thi VNOJ (thể thức áp dụng rộng rãi cho bảng A, B, C1, C2), bài làm của thí sinh sẽ được chấm nhiều lần, và điểm số cuối cùng là điểm của lần nộp bài đạt thành tích cao nhất.15 Tuy nhiên, các lần nộp sai logic sẽ bị ghi nhận một hình phạt (penalty) thời gian, thường là cộng dồn 5 phút vào tổng thời gian thi.15 Trường hợp các thí sinh có cùng tổng điểm, hệ thống sẽ sử dụng thuật toán phân định thông qua việc tính tổng thời gian của lần nộp bài cuối cùng làm thay đổi quỹ điểm dương, cộng với thời gian phạt. Sự khắt khe này đòi hỏi cơ sở dữ liệu Backend (như PostgreSQL) phải lưu trữ lịch sử dấu thời gian (timestamps) của từng thao tác nộp bài với độ phân giải mili-giây.

Khi thí sinh hoàn thành bài và nhấn nút "Nộp bài", máy khách hoàn toàn không gửi điểm số (Score) hay kết quả true/false về máy chủ. Nền tảng chỉ trích xuất duy nhất chuỗi JSON đại diện cho cây logic của Scratch (tức tệp tin .sb3 lưu dưới dạng nhị phân) và gửi qua API.7

### **Hệ thống Thực thi Không Màn hình (Node.js Headless Worker)**

Tại trung tâm dữ liệu, một cụm máy chủ ảo (Cluster) vận hành môi trường Node.js. Thay vì có màn hình hiển thị đồ họa, máy chủ chạy phiên bản scratch-vm dưới chế độ không giao diện (headless).30 Ban tổ chức sử dụng các công cụ nhân hệ thống tiên tiến như scratch-judge do cộng đồng phát triển 7 hoặc công cụ giao diện dòng lệnh (CLI) scratch-run từ tổ chức VNOI.29

Tiến trình xử lý tại máy chủ diễn ra tuần tự và cô lập như sau:

1. Tệp bài làm .sb3 được tải vào thư mục ảo của một Worker.24  
2. Một đối tượng Scratch Virtual Machine hoàn toàn mới được khởi tạo bằng Node.js, không có sự can thiệp của trình duyệt đồ họa.  
3. Hệ thống nạp **bộ kiểm thử ẩn (Hidden Testcases)** — tập hợp các tệp .in (đầu vào) và .out (đầu ra) mà thí sinh chưa từng được biết đến trong quá trình làm bài.7 Dữ liệu từ các tệp này được tiêm tĩnh vào mảng inputData của máy ảo.  
4. Máy ảo kích hoạt hàm mô phỏng cờ xanh vm.greenFlag(). Node.js liên tục đẩy nhanh vòng lặp sự kiện (Event Loop) bằng chế độ Turbo (vm.turboMode \= true) ở Backend nhằm tăng tốc tối đa quá trình xử lý phép toán thuật toán.7  
5. Một quy trình phụ (Child Process) giám sát việc cấp phát bộ nhớ (Memory limits) và thời gian thực thi (Time limits). Nếu VM chạy quá ngưỡng 1000 mili-giây (hoặc mức time\_limit\_ms quy định), tiến trình bị ngắt bằng tín hiệu SIGKILL, và hệ thống ghi nhận trạng thái Quá giới hạn thời gian (TLE \- Time Limit Exceeded).7  
6. Nếu thuật toán kết thúc an toàn, hệ thống trích xuất mảng output từ RAM của máy ảo Node.js và so sánh văn bản với nội dung tệp .out.7

Chỉ khi quy trình kiểm chứng mù này hoàn tất, kết quả mới được Backend gửi trả về giao diện Frontend, thường hiện ra qua thông báo "Hệ thống đang đợi máy chấm (judge) đánh giá".15 Điểm số sinh ra từ máy chủ mới là thông số duy nhất được ghi nhận vào Bảng xếp hạng (Leaderboard) chính thức.

## **10\. Chiến lược Bảo mật Toàn diện và Kiểm soát Gian lận (Anti-Cheat Security)**

Trong một giải đấu mang tính chất quyết định xếp hạng, việc xây dựng một hệ thống phòng chống gian lận (Anti-cheat) hiệu quả là tối quan trọng nhằm bảo vệ tính toàn vẹn của cuộc thi.15 Do thiết kế lõi của Scratch phụ thuộc hoàn toàn vào JavaScript xử lý ở Frontend, những thí sinh am hiểu công nghệ (tech-savvy) có thể sử dụng hàng loạt thủ thuật tinh vi để đánh lừa hệ thống đếm giờ ảo hoặc sửa đổi cấu trúc dự án.

### **Phong tỏa Công cụ dành cho Nhà phát triển (DevTools Blocking)**

Lớp rào chắn đầu tiên nhắm trực tiếp vào việc vô hiệu hóa khả năng can thiệp DOM và Memory từ trình duyệt của học sinh. Giao diện thi đấu tùy chỉnh sẽ được tích hợp bộ thư viện ngăn chặn disable-devtool (do cộng đồng nguồn mở như theajack phát triển) vào thẳng thư mục gốc (root script) của tài liệu HTML.32 Gói phần mềm này hoạt động dai dẳng ở nền tảng vòng lặp sự kiện, sử dụng hàng loạt các phép đo lường (heuristics) như tính toán chênh lệch xung nhịp (timing checks) thông qua từ khóa debugger; và phân tích tỷ lệ thay đổi chiều cao cửa sổ hiển thị (viewport resize) để phát hiện nếu bảng điều khiển (Console/Elements) bị mở ẩn.33

Bên cạnh các cơ chế dò tìm động, nền tảng cũng áp đặt các rào cản thao tác cơ học. Thông qua trình lắng nghe sự kiện trên toàn bộ đối tượng document, hệ thống chặn hoàn toàn các phím tắt tiêu chuẩn được dùng để mở DevTools. Các sự kiện keydown bắt các tổ hợp phím như F12, Ctrl+Shift+I (mở công cụ), Ctrl+Shift+J (mở bảng điều khiển), và Ctrl+U (xem mã nguồn) sẽ ngay lập tức bị vô hiệu hóa bởi phương thức e.preventDefault(), không cho phép kích hoạt các chức năng nội tại của trình duyệt. Tương tự, hành vi nhấp chuột phải (Right-click) để trích xuất phần tử cũng bị triệt tiêu thông qua việc ghi đè sự kiện contextmenu trên thẻ body.34

| Phương thức Tấn công/Gian lận | Rủi ro Bảo mật | Lớp Phòng thủ (Countermeasures) |
| :---- | :---- | :---- |
| Mở Developer Tools (F12) | Can thiệp giá trị biến output, chặn script. | Tích hợp thư viện disable-devtool, chặn sự kiện bàn phím/chuột phải.32 |
| Vượt mặt Testcase Máy khách | Chỉnh sửa tệp cục bộ để nhận thông báo "Đạt". | Thiết lập mô hình Headless Node.js xác thực độc lập trên Backend bằng testcase ẩn.7 |
| Sửa thời gian đồng hồ | Dùng khối lệnh thay đổi giá trị startTime. | Overriding hàm requestGreenFlag cấp độ máy ảo và sử dụng Unix timestamp máy chủ.24 |
| Đánh cắp, sao chép code | Mở nhiều tab ẩn, xem bài giải trên Internet. | Phân tích đạo văn (Plagiarism check) cây cú pháp AST của file .sb3 sau kỳ thi.15 |

### **Cảnh báo Phương pháp "Bảo mật qua sự Che giấu" (Security through Obscurity)**

Tuy nhiên, từ góc độ của một chuyên gia bảo mật ứng dụng, việc phong tỏa mã JavaScript phía máy khách (như chặn F12) chỉ được coi là phương pháp "Bảo mật qua sự che giấu".28 Các biện pháp này giúp răn đe tuyệt đại đa số thí sinh ở độ tuổi học sinh phổ thông, nhưng hoàn toàn có thể bị bẻ khóa bởi những thí sinh sử dụng phần mềm mở rộng trình duyệt chuyên dụng chặn script, thao tác qua nhân Chromium can thiệp (Custom Chromium build), hay gửi yêu cầu HTTP Post trực tiếp lên máy chủ thông qua phần mềm Postman.33

Chính vì lý do này, quy định chấm thẩm định (manual review) và hệ thống máy chấm Backend Headless được đề cập ở phần 9 mới là chốt chặn an ninh quyết định.7 Hệ thống máy chủ không bao giờ tin cậy bất kỳ thông số kết quả nào được truyền về từ phía trình duyệt. Mọi điểm số, trạng thái thời gian và logic đều phải được tái lập lại hoàn toàn tại buồng giam tài nguyên (Sandbox) của Server. Sau khi vòng thi kết thúc, Ban tổ chức cuộc thi còn tiến hành thuật toán đối chiếu cây mã nguồn (AST Plagiarism Detection) giữa các tệp .sb3 nhằm phát hiện các mẫu khối lệnh giống nhau bất thường, làm căn cứ xử lý vi phạm quy chế thi trước khi công bố bảng vàng xếp hạng chính thức.15

## **11\. Các Yêu cầu và Lưu ý Triển khai Thực tiễn**

Xây dựng thành công kiến trúc ứng dụng mới chỉ là một nửa chặng đường. Để một giải thi đấu lập trình diễn ra suôn sẻ, quy trình vận hành và tương tác giữa máy chủ và người dùng nhỏ tuổi cần được tối ưu tinh tế. Các báo cáo từ các hệ thống giáo dục như uCode hay Tin học trẻ trực tuyến chỉ ra rằng, số lượng lỗi phát sinh từ thao tác vận hành của người dùng thường cao hơn lỗi hệ thống lõi.15

### **Độ tin cậy của Đề thi và Tính Dung sai của Bộ định chuẩn**

Các chuyên gia học thuật ra đề thi phải thiết kế các bộ testcase một cách cực kỳ cẩn trọng. Trong máy ảo Scratch đồ họa, sự chuyển động của các đối tượng (sprites) tuân theo các phép tính lượng giác và thường bị tác động bởi cơ chế làm tròn pixel số thực (floating-point rounding). Nếu hệ thống so khớp (Checker) yêu cầu tọa độ ![][image16] phải chính xác tuyệt đối ở mức phân số thập phân, hàng loạt bài thi logic đúng sẽ bị đánh trượt (flaky tests) do chênh lệch khung hình.37

Để khắc phục, trong phương thức checkResult của bộ định chuẩn Backend, thay vì đối chiếu chuỗi thuần túy (===), hệ thống nên sử dụng thuật toán tính dung sai khoảng cách (Euclidean distance tolerance). Ví dụ, nếu khoảng cách Euclidean giữa tọa độ thực tế của nhân vật và tọa độ kỳ vọng trong bộ testcase nhỏ hơn hoặc bằng ![][image17] pixel, kết quả vẫn được tính là chính xác.

Đồng thời, ban giám khảo cần thiết lập quy chế cấm các kỹ thuật gây trễ không cần thiết trong khối lệnh thí sinh. Việc sử dụng các khối điều khiển đợi (1) giây (wait 1 seconds) sẽ ngay lập tức làm đình trệ vòng lặp sự kiện mô phỏng, khiến bài thi không thể vượt qua testcase đồ sộ trong ngưỡng thời gian giới hạn time\_limit\_ms \= 1000ms tại Backend.4 Thí sinh cần được tập huấn để hoàn thiện thuật toán xử lý dữ liệu với tốc độ cao nhất, phân tách rõ ràng giữa yếu tố trình diễn đồ họa và logic thuần túy.

### **Xử lý Ngoại lệ và Trải nghiệm Người dùng**

Sự cố phổ biến nhất trong phòng thi trực tuyến là việc thao tác nộp bài thất bại do định dạng tệp tin bị hỏng (corrupted project formats). Trong một số trường hợp đường truyền mạng không ổn định hoặc sự cố lưu tệp trình duyệt, tệp .sb3 tải lên bị mất dở dang cấu trúc nén ZIP (trung tâm cấu trúc file JSON bị hỏng).39 Để tránh làm hoang mang thí sinh, phân hệ scratch-parser ở Backend 23 cần phải bẫy (catch) các ngoại lệ giải nén này và lập tức phản hồi về Frontend một dòng thông báo lỗi thân thiện (human-readable error message) như "Tệp bài làm bị hỏng trong quá trình tải xuống. Vui lòng tải lại trang và nộp lại tệp". Các dòng thông báo chung chung hoặc việc hệ thống bị treo cứng vô thời hạn sẽ tạo ra áp lực tâm lý tiêu cực đối với các đối tượng dự thi ở độ tuổi học đường.

Hơn nữa, hệ thống hàng đợi máy chấm (Queue Architecture) cần được thiết kế tự phục hồi (Self-healing). Nếu một container Worker của Node.js bị sập ngang (crash) do hết dung lượng RAM từ tệp lỗi lặp vô hạn của một thí sinh, hệ thống Kubernetes hoặc Docker Swarm đứng sau phải ngay lập tức hủy bỏ (kill) tiến trình đó, thay đổi trạng thái bài nộp thành "Runtime Error", và tự động khởi tạo lại (respawn) một bản sao Worker mới để đảm bảo các bài thi của thí sinh khác trong hàng đợi không bị ách tắc cục bộ. Sự mượt mà trong việc cách ly lỗi cá nhân là biểu hiện của một hệ thống Online Judge chuẩn mực và bền bỉ.

Tóm lại, thông qua việc hiểu sâu cơ chế vòng lặp sự kiện của máy ảo scratch-vm, tận dụng sức mạnh biên dịch của nền tảng TurboWarp, thiết kế cấu trúc Backend Headless bằng Node.js với mô hình hàng đợi chặt chẽ, và triển khai các rào cản bảo mật ngăn ngừa can thiệp qua giao diện, chúng ta hoàn toàn có thể xây dựng nên một nền tảng thi đấu nội bộ chuyên nghiệp, chính xác và đồng nhất với quy chuẩn khắt khe nhất của giải đấu Tin học trẻ. Kiến trúc này không chỉ mang lại tính minh bạch tuyệt đối trong xếp hạng mà còn mở ra nền móng cơ sở hạ tầng giáo dục vươn tầm, đáp ứng xu hướng đánh giá năng lực lập trình kỷ nguyên số.

#### **Nguồn trích dẫn**

1. Cuộc thi Violympic Tin học trẻ 2025 \- VIETSTEM, truy cập vào tháng 4 2, 2026, [https://violympictinhoctre.vn/gioi-thieu-cuoc-thi](https://violympictinhoctre.vn/gioi-thieu-cuoc-thi)  
2. Tin học trẻ Việt Nam \- uCode.vn, truy cập vào tháng 4 2, 2026, [https://tinhoctre.ucode.vn/](https://tinhoctre.ucode.vn/)  
3. Info on .sb3 files : r/scratch \- Reddit, truy cập vào tháng 4 2, 2026, [https://www.reddit.com/r/scratch/comments/1mlyk71/info\_on\_sb3\_files/](https://www.reddit.com/r/scratch/comments/1mlyk71/info_on_sb3_files/)  
4. ScratchEval: A Multimodal Evaluation Framework for LLMs in Block-Based Programming, truy cập vào tháng 4 2, 2026, [https://arxiv.org/html/2602.00757v1](https://arxiv.org/html/2602.00757v1)  
5. Assessing Scratch Programmers' Development of Computational Thinking with Transaction-Level Data \- ResearchGate, truy cập vào tháng 4 2, 2026, [https://www.researchgate.net/publication/328734730\_Assessing\_Scratch\_Programmers'\_Development\_of\_Computational\_Thinking\_with\_Transaction-Level\_Data](https://www.researchgate.net/publication/328734730_Assessing_Scratch_Programmers'_Development_of_Computational_Thinking_with_Transaction-Level_Data)  
6. TurboWarp Desktop \- Better offline editor for Scratch 3, truy cập vào tháng 4 2, 2026, [https://desktop.turbowarp.org/](https://desktop.turbowarp.org/)  
7. Steve-xmh/scratch-judge: A custom scratch-vm used to watch program status and output result about the program. \- GitHub, truy cập vào tháng 4 2, 2026, [https://github.com/Steve-xmh/scratch-judge](https://github.com/Steve-xmh/scratch-judge)  
8. Introduction to custom extensions | TurboWarp Documentation, truy cập vào tháng 4 2, 2026, [https://docs.turbowarp.org/development/extensions/introduction](https://docs.turbowarp.org/development/extensions/introduction)  
9. Unsandboxed extensions \- TurboWarp Documentation, truy cập vào tháng 4 2, 2026, [https://docs.turbowarp.org/development/extensions/unsandboxed](https://docs.turbowarp.org/development/extensions/unsandboxed)  
10. Modding Introduction \- TurboWarp Documentation, truy cập vào tháng 4 2, 2026, [https://docs.turbowarp.org/development/getting-started](https://docs.turbowarp.org/development/getting-started)  
11. Online Judge from Scratch(0) — Architecture | by Chao Liu | Medium, truy cập vào tháng 4 2, 2026, [https://medium.com/@liuchao/online-judge-from-scratch-0-architecture-852efa75ab56](https://medium.com/@liuchao/online-judge-from-scratch-0-architecture-852efa75ab56)  
12. se2p/whisker: A Testing Utility for Scratch 3.0 \- GitHub, truy cập vào tháng 4 2, 2026, [https://github.com/se2p/whisker](https://github.com/se2p/whisker)  
13. ÔN THI TIN HỌC TRẺ BẢNG A – SCRATCH \- ĐÀO TẠO CÔNG NGHỆ TRẺ EM, truy cập vào tháng 4 2, 2026, [https://daotaocongnghetreem.com/khoa-hoc/khoa-hoc-on-thi-tin-hoc-tre-bang-scratch](https://daotaocongnghetreem.com/khoa-hoc/khoa-hoc-on-thi-tin-hoc-tre-bang-scratch)  
14. Simple Grid List Tutorial with Image Scanning \- YouTube, truy cập vào tháng 4 2, 2026, [https://www.youtube.com/watch?v=6ZuImk8-TYk](https://www.youtube.com/watch?v=6ZuImk8-TYk)  
15. HƯỚNG DẪN THAM GIA HỆ THỐNG THI HỘI THI TIN HỌC TRẺ TOÀN QUỐC \- (Dành cho thí sinh các bảng A, B, C1, C2 và D1) \- tainangviet.vn, truy cập vào tháng 4 2, 2026, [https://www.tainangviet.vn/source/files/THT2024\_Huongdan\_sudung\_hethongthi\_tinhoctre\_vn.pdf](https://www.tainangviet.vn/source/files/THT2024_Huongdan_sudung_hethongthi_tinhoctre_vn.pdf)  
16. TurboWarp Extension Gallery, truy cập vào tháng 4 2, 2026, [https://extensions.turbowarp.org/](https://extensions.turbowarp.org/)  
17. Introducing my anti cheat and ban system\! : r/scratch \- Reddit, truy cập vào tháng 4 2, 2026, [https://www.reddit.com/r/scratch/comments/1qsdw0k/introducing\_my\_anti\_cheat\_and\_ban\_system/](https://www.reddit.com/r/scratch/comments/1qsdw0k/introducing_my_anti_cheat_and_ban_system/)  
18. I made a secure Voting Center for judges : r/scratch \- Reddit, truy cập vào tháng 4 2, 2026, [https://www.reddit.com/r/scratch/comments/1rj8i0h/i\_made\_a\_secure\_voting\_center\_for\_judges/](https://www.reddit.com/r/scratch/comments/1rj8i0h/i_made_a_secure_voting_center_for_judges/)  
19. Scratch 3.0 Extensions : 8 Steps \- Instructables, truy cập vào tháng 4 2, 2026, [https://www.instructables.com/Making-Scratch-30-Extensions/](https://www.instructables.com/Making-Scratch-30-Extensions/)  
20. Dealing with inputs | TurboWarp Documentation, truy cập vào tháng 4 2, 2026, [https://docs.turbowarp.org/development/extensions/inputs](https://docs.turbowarp.org/development/extensions/inputs)  
21. scratch-vm/docs/extensions.md at develop \- GitHub, truy cập vào tháng 4 2, 2026, [https://github.com/scratchfoundation/scratch-vm/blob/develop/docs/extensions.md](https://github.com/scratchfoundation/scratch-vm/blob/develop/docs/extensions.md)  
22. questions.json \- GitHub Gist, truy cập vào tháng 4 2, 2026, [https://gist.github.com/cmota/f7919cd962a061126effb2d7118bec72](https://gist.github.com/cmota/f7919cd962a061126effb2d7118bec72)  
23. scratch-parser/test/fixtures/data/\_example.json at master \- GitHub, truy cập vào tháng 4 2, 2026, [https://github.com/LLK/scratch-parser/blob/master/test/fixtures/data/\_example.json](https://github.com/LLK/scratch-parser/blob/master/test/fixtures/data/_example.json)  
24. Building Online Judge From Scratch | by Bhimsen Kulkarni \- Medium, truy cập vào tháng 4 2, 2026, [https://medium.com/@bhimsen.pes/building-online-judge-from-scratch-b81e43bf4ee0](https://medium.com/@bhimsen.pes/building-online-judge-from-scratch-b81e43bf4ee0)  
25. TurboWarp Packager \- Convert Scratch projects to HTML, EXE, and more, truy cập vào tháng 4 2, 2026, [https://packager.turbowarp.org/](https://packager.turbowarp.org/)  
26. Hello, world\! | TurboWarp Documentation, truy cập vào tháng 4 2, 2026, [https://docs.turbowarp.org/development/extensions/hello-world](https://docs.turbowarp.org/development/extensions/hello-world)  
27. Extension does not work on loaded projects : r/turbowarp \- Reddit, truy cập vào tháng 4 2, 2026, [https://www.reddit.com/r/turbowarp/comments/1kv5oyg/extension\_does\_not\_work\_on\_loaded\_projects/](https://www.reddit.com/r/turbowarp/comments/1kv5oyg/extension_does_not_work_on_loaded_projects/)  
28. Cybersecurity in Competitive Online Gaming (Cheating, Mitigation, and Vulnerabilities), truy cập vào tháng 4 2, 2026, [https://www.tripwire.com/state-of-security/cybersecurity-in-competitive-online-gaming-cheating-mitigation-and-vulnerabilities](https://www.tripwire.com/state-of-security/cybersecurity-in-competitive-online-gaming-cheating-mitigation-and-vulnerabilities)  
29. VNOI-Admin/scratch-run: Run Scratch from command line \- GitHub, truy cập vào tháng 4 2, 2026, [https://github.com/VNOI-Admin/scratch-run](https://github.com/VNOI-Admin/scratch-run)  
30. valadaptive/sb3-js: An embeddable, greenfield Scratch runtime \- GitHub, truy cập vào tháng 4 2, 2026, [https://github.com/valadaptive/sb3-js](https://github.com/valadaptive/sb3-js)  
31. GitHub \- stackgl/headless-gl: Windowless WebGL for node.js, truy cập vào tháng 4 2, 2026, [https://github.com/stackgl/headless-gl](https://github.com/stackgl/headless-gl)  
32. GitHub \- theajack/disable-devtool: Disable web developer tools from the f12 button, right-click and browser menu, truy cập vào tháng 4 2, 2026, [https://github.com/theajack/disable-devtool](https://github.com/theajack/disable-devtool)  
33. Cracking a "Developer Tools Killer" script… \- DEV Community, truy cập vào tháng 4 2, 2026, [https://dev.to/codepo8/cracking-a-developer-tools-killer-script-2lpl](https://dev.to/codepo8/cracking-a-developer-tools-killer-script-2lpl)  
34. Unwanted right-click with in browser DevTools \- Stack Overflow, truy cập vào tháng 4 2, 2026, [https://stackoverflow.com/questions/49092441/unwanted-right-click-with-in-browser-devtools](https://stackoverflow.com/questions/49092441/unwanted-right-click-with-in-browser-devtools)  
35. How to stop sites from detecting you in dev tools. \- GitHub Gist, truy cập vào tháng 4 2, 2026, [https://gist.github.com/daviddanielng/b98380e0d84b1d16c94cfd700e87fd6a](https://gist.github.com/daviddanielng/b98380e0d84b1d16c94cfd700e87fd6a)  
36. uCode.vn \- Lập trình tương lai của bạn, truy cập vào tháng 4 2, 2026, [https://ucode.vn/](https://ucode.vn/)  
37. Automated test generation for SCRATCH programs \- OPUS, truy cập vào tháng 4 2, 2026, [https://opus4.kobv.de/opus4-uni-passau/files/1620/Deiner\_AutomatedTestGeneration.pdf](https://opus4.kobv.de/opus4-uni-passau/files/1620/Deiner_AutomatedTestGeneration.pdf)  
38. Verified from Scratch: Program Analysis for Learners' Programs \- Research, truy cập vào tháng 4 2, 2026, [https://research.stahlbauer.net/ASE-2020-VerifiedFromScratch.pdf](https://research.stahlbauer.net/ASE-2020-VerifiedFromScratch.pdf)  
39. sb3fix \- fix corrupted Scratch projects \- TurboWarp, truy cập vào tháng 4 2, 2026, [https://turbowarp.github.io/sb3fix/](https://turbowarp.github.io/sb3fix/)  
40. Ellen Vanhove language Scratch Scratch-LN: flexible editing of the block-based programming, truy cập vào tháng 4 2, 2026, [https://libstore.ugent.be/fulltxt/RUG01/002/494/627/RUG01-002494627\_2018\_0001\_AC.pdf](https://libstore.ugent.be/fulltxt/RUG01/002/494/627/RUG01-002494627_2018_0001_AC.pdf)

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACsAAAAXCAYAAACS5bYWAAACG0lEQVR4Xu2WPWtVQRCGX43GpLBQKwtNkTJ1VIKNRNTCykaLwCVFIJ1FIIqtFhKwsdDCNP4BURsRtRIUBEEURLATki6J+QBR8WPezF3Z+96d4zlBbhofmGKfmbNn755l9gL/6S2nVPSIgxY7VVYxbXFZZQ/5pSLikMWiyjY3LL5ZLFkcl1wT5uEL+mRxWHKk3+KnyhKcZEClsWpxLRt/sbiejevCReRHjO87k40TL+CbEzJm8VWlMY7uT7O/4P7GVXQ/c7bgSB/K/g/fUT6r/PSlB+kmVFbA+vcq4Z7HT6E/qTLB5KBKuOcPUejfqqyA9U9Vwv1NlcYHi1cqyV6Ud4/Qr6mEe57durD+oUq4f6TSuIJgTScQJOB+WSXcR88o7J2svacJuP+o0riAYP5JBAm4/6wS7mu1mDasv68S7p+rNI4iWFMLQQLuS10i2pEI1j9WCfd3VBqjCNZ0DEEC7ks5utsqK2B91A3Oq4S70nuxD0HCuIXu3I622505dpKL2VjhQnWeIwWXYBuNcpsJXnUlmBvJxmwp2iHSF+ACSqSLJL8h1y1eZ+OcdxZvVCY40YzKNkPw/DP4nb7Qmd7kHNzf1UQGmzzneWCxYvGyM90B606rTMxabKhsCPv1JZVbIB2zSliwS2UDqna1CU9QvtU64D+gJu0o5wDK12lTeIH8UBkxZzGlsgZ7VGyR2gtNtFT0iGH8ux+9vfwGSKmGtjgRW4cAAAAASUVORK5CYII=>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAXCAYAAABwOa1vAAABbklEQVR4Xu2WPy8FQRTFb0KJRvM6pV4ICr1EIlqdaFQqFV+AUq+SKF6CT6BU6CQSlSgEIRRCJf67JzOTXGfvyMvulvNLTt7Mmdm7583O23kihUIBbKk+VJ+qXRrz6Ff9sBlZVt1LqIW6rfOiGovtYQlBcmESb+LP2Vfdmf6e6sn0GzOpelANGm9CQphT41k2VNfiB4aH1Wdvlrza4JGh4Dn5uVXukxD2QKrj244H4F2y2QQ8xiHycoFf46cX+N3xQK5Wa0xLuAG+iGVVtRDbXuBcsJzfGij+zabyaNqNA+PXPd6jRuM1HoeqLzaVZ+o3Djyimu9RM/EaZkWqwcCiaok8LzDeu+wBN3BTplRX5KWbbKqOSek9nPrgKHoMPG+L1aajOmNT/JsncDjwOOqwB+CtsVmXdMR6OjHzGJyOXjisZNf058SfV5sdqQZNWjfzEjgccDLeqm4k/GfA9rDgfXwhYaugzsDf4UKhUPiPX0KDf9U2KbfbAAAAAElFTkSuQmCC>

[image3]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB0AAAAXCAYAAAD3CERpAAABW0lEQVR4Xu2UOy8FYRCGh0gkVAoajYiodQoSjU5HLyqi8RM0foG4dKKQqBRaoqIh0dD4ASiEIOKSiNs7O7Obb9+dTbRkn+TN2e+ZOTvZc+YckYb/zChyh3wjx0hruRzyhEyxBAPIidi9DqhWsIKsJ+dXsTf0J46ZE+vhoWPuc4boXKByOHBhs3Mr8VB18+TexT69gk6JB0Qu59FfeWiPO31N2XdfYgkZIVc3dBqZ8WseuuiO2ZTYV9CmL5Ziy5PDQ3fdMWsS+xLnYk0d5G+QluTMQw/dMctivpcLObpQ2tBNfgJZIMdDt90xq2K+jQtKl1ixnQvgjYVUh9Z9pxsS++zPgAtbyfUR5VSs/8LPii6jul9trxItzSeLhEGpPqmibpLcM3JPLvvxanOUOvKnmiW/h3wkZ1087etLXLZRPChP9D0qD8g1colc+TnlDHlBdsTuM14uNzT8VX4A7LJwftUpY8sAAAAASUVORK5CYII=>

[image4]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAXCAYAAABwOa1vAAABZ0lEQVR4Xu2UvUoEMRSFr2BhYaeCheBPI/a29oLgQ4hPoI2NYClWvsNaLGxnqZVYKWJhp9gp/iAIarcr6jlMZrm5m2QXN2U+OEzuucnO2ZlMRAqFgubKGopR6Ab6hV6hBb/dZQN6hr6hfdPLwoVUIWrF6EAjqv6ANlVNWtCTqo+gd1VnZUvigY+hJWtK73zWfBPWWzVeFlKB6TeNx6et5x+auobevTVzkAp8Ir03voZ2Vd2W8Pp+W+3fpAKT+sbULbTndePBYv7Q9As8Jn5o+zHFggX9CWh5QC26NZZU4Hmpety3c25Mfao5wWAS8Weh9QG14tZYUoHpTxrvzPlTrua5G1ofDJyDWGAGCvmE/o4bn7raQu/HmjmIBSYpf8aNp11tobdtzRwciP+KNdyrPNo03F5fxuOT1Of1moT/xFDw/HyBHqEHd32DGnoSuJPq5jzSeL302134e5x7LtW8cb9dKBQKKf4A9Bd0Sj6oAmAAAAAASUVORK5CYII=>

[image5]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB0AAAAXCAYAAAD3CERpAAABc0lEQVR4Xu2UvyuGURTHvyQLoyyWt1gMyk4p+QMk7MqCXlE2P/IHWBSjLGKgWIlFBhalWGRjkVKKRcQ5znnuc+7p3sUm76e+Pff7Pee953mf5/YANf4Dc6QJHxqWSV+kT9JCXAp0kC4gfceuFtghvUOaWJNxOXBC6jd+nvRiPNMH2aOg2/kkuaH1pEcfQvrbnPdPiv/QucsickMHkb5jziq6blXPV8uR5llyQ5tQPv52zTrVFyw5X7CJdB7IDWX2UQ6+JL3GZRxozbOOdB7g4pQPDdcoB7O6TO1UM88qJLfvPoKLVR8qb6QRXd+iHNys2bZ6zxokb/CFAi5O+5DYIp25rBfSf6M+9043kM4DXJzxISQvDpBlEeWGPbr+1emd9SEkH/YhMU66M577hoxn+MA9uyzQAvnRii8Qo0jfLWeNxh+SPoyvg/RUTPbDLumJ9EC61yt/ffhLYhmDbMB3zhvzmm/UcwU5dHuQnoG4XKPGX+UbW1Fqo9qDxl8AAAAASUVORK5CYII=>

[image6]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB0AAAAXCAYAAAD3CERpAAABeElEQVR4Xu2TTytFYRDGh2TDjmyQWyxYKHtKyQeQsFc2PoM/+QqKhSIbWRE7ERZYkFKKjexsKCnFRsQ89533nDlz5iws5fzq6c7zzJwz99zzXqKS/0IH69uGwgKF3hdrNttK6GJdUJg7NL1CMOwtPWINKT/DelUeDFL22j7jXQ5Y75QfrGU9mQxgrtX4aeXBB+vcZAltrF3WM+WXjjgZQFaRukU8PjV4EO/aKrHhLW2QDOqUrEd8ZN74yDr5OW2z2qX2loIdShdfsd6y7eqv5F23TE7exDpWvmgpuKF0MdSreieSWRYp5Prd5waLluKAjUt9R+niRsk2xVuWKOR1MVhhdSftgLd0g3VmsgEKc7fii97pGpl8j3VqFJ8A9arMwccDpJmj9Ib9Uv/q9EbiUpuNmQxMse6Vx9yo8gAH7sVkObylE04GkNUrv8/6VL6GwkxFZRnwN3hkPYhQX6r+JIUb4JvjxqibVT9yTeHQbVGYGc62S0r+Kj8ut3fxYTVLVgAAAABJRU5ErkJggg==>

[image7]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAAXCAYAAADpwXTaAAAA4klEQVR4XmNgGAWUABsgfgPE/4H4BBAzoUpjBZ+AOBhdcDIQT0Pif2OAGKqEJIYO0hkgajAMAwmaYxEDYVzgNQMWw7ihgugasYnBwAcojWEYCDQDsTWaGC7D4oA4AcrGahg2AFL4D12QARLoMECUYZcYIAq50MRfAjEjEp+gYaCIACkSRRP3BuI8NDG8hgkyQBSwo0sAwXd0AQY8hoESKXqAL0ZiH0bDZxgg6q9D+SgAW2D/RRdAAmoMOFz2CyqBDeMCoKQEkk9DFpSGCmLD2MIJBN4D8VMgfgzET6D8UTCsAACB5Uh2DH4+5gAAAABJRU5ErkJggg==>

[image8]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAAXCAYAAADpwXTaAAAA6ElEQVR4Xu2SvQ4BURCFh0aQCIVK5xUUCp7DC2i8hEqplKh0HkMtERUivISKBJH4mbN772Z29k6lE19ykj3fzL3F7hL9+YYu58R5c1acfHqcMOScOVdOX80iJpyp6FjEpU3hwIGzEH3PWYoegYPtgEM8FdU9cFVfyk7oRe02qnvgZlKMOB0pKHuZ7h7Lp8DCS/XQIcsn7CheKAlnHbJ8BD4EhnXlrUOWpxrFg4IekH0o6PGTajkXzxfKzgHcUUv5sj1P8dwj+7KWFA8nQ5GgD0QfO5fQcCKUm9gDRefXnC3nzsmlNv78CB8KAFRCBoTrAQAAAABJRU5ErkJggg==>

[image9]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB0AAAAXCAYAAAD3CERpAAABhklEQVR4Xu2UPS8FURCGXx9BKQoNEUQhkSAKDYkCuYlK+BP8BRKJXkOoRG4jJKJQiCAqDUq/gWh8VCh8z+zMrNmxqMk+yZt73ndmz9l7dvcABf+ZHtIt6Z10SqrPljPMkl5VpVBjOkhnkLmOQi1lirTk/Drkgj6XGc+kVR3Xkt5IdZ9lDEGuNXqDT+EwFvIy3olr5xchPf0uYz/tPPME2b0Ml/i6QFy0TX2Ly5huN26E9PCv51DzH5mBNI257EQzpoY06mrGHPInLyM/TxmHNPDWeeyfb0KeW5d637ejWWQF+XnCAmkL8lYOh5otOu+yds2a1R+rj9izb4oFDxe5addltmiEsysdb6iPLEPy6liIxEWiN3z+3TNdQ07O22nfnmGTDaq3jz3iFx3Q8a9v76QGcULLqtR3qo9wVg5+wnnmnnQXsqSRTxeDvz3O9lzGPJL2nefjMN7IAenF+QpIT6vLEhogxxnrBtLEr3keF5A6nzLcX5ktJ5yTHkjbkN6RbLmg4K/yASb+eWvrzS3ZAAAAAElFTkSuQmCC>

[image10]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAAXCAYAAADpwXTaAAABAElEQVR4Xu2TsQ4BQRCGJwoNpU4jUSm8gcoTKNBLNAgh0SHxAB5DolB4Ap1aRSM6GlFJaITwT3bvbnfOqlRyX/Lnbr+Zm2z27ogifkEfaUhpMEZeyBMZ2iXFDLmTauI07bLPEika6wFyMdYhXMNiyElKUv1pKT1cw0qkahJ2GSk9XMMSFBxDVrucXjtxDWMWFAxcI1e7HIYbW1IabCgYyMnbZRtuaEupuSEVfb+jYGDS7xBwsSMlmCIr4Qqk+rfC+3CxKyXZB28yoi8vgQs9KUn5spSgjuylZFKkHprIAqjS5x2wi5tijpyRI3LQV/7a+RczqZF6mD+Jh77nDUT8HW/oTUKbGWkl1wAAAABJRU5ErkJggg==>

[image11]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAD4AAAAXCAYAAABTYvy6AAABhUlEQVR4Xu2WTStFURSGNxOhxMDIzA8wMVAYHAZGyoAMTE3kPxgZGiojMz/DBKUkCYkU/8CIQsrHejv7aN337nXvOdr3lOyn3trrWXuf1q77cZxLJBL/hWnJo+RLciLpbmz/sCF5krxIVqlXF9Fm3ZbsqBob8dBR5cCNZF/V15JjVddB1FlxcCLgkIIBqgvgBll2kGiz9nvBG9ldUF0At8sywBgLYp1FgOizbkqmtHDND+O6wPLMnWSSpedAssDSoOOzYsMn1aFDlg9xL8nIHUoWyVUl2qxXLt/Qp5x1yPIWD5IZvz6SLKveb4g2K3440Bwmbx2yfCtw+TPJCjcqEm3WIZc3erjh7EOWb8W5yy8/x40KRJsVLwEs99T62TX3Adwtyxbg0kt+jY/prOqVJeqs+seh4EOt8V20HjbO0kBfugCXz8i1I9qs716GokG9puot78pwKpln6bl0+WtoGaLNOuJFKK9qH+j1HpfAsG+SroYdNhkLAv/P7ahr1kQikUj8Kb4BbD+6565Oq1EAAAAASUVORK5CYII=>

[image12]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACIAAAAXCAYAAABu8J3cAAABQUlEQVR4Xu2UvUoDQRSFr5KoiLHSQrBItPJRbHwDO5/Aykaw9jVsrC3tUhpCinSGdFoogpCki/hzz84u3DnmziKK1Xxw2J1zJruHnZmIZDL/S58NQ0M1VH2qnlV7cfx77iQ8vJLHm2rJjCeqEzP+M07FL3KjOmBTnPk7qmU2iUM2DKki8K/Jw9fx5hcB1nIRc9U6m4ZUkVsJ2dh4A9W5GX8DP2iSh/XdII9JFQF2H92rLqLUwZZBiZbJPOqKrElc5jWOfTAZJTY5cEgV6UjIsC/a5T00NXNcPkqtcuCQKgJ/i7xu6W+TH4EC1Z7A/YrJPLwieNEiH8A/Y7PClrAeb2DGKwJS/i6b4F38I4oy3tEGl+J/auwFHGHLkWpGXsG+1C/BMRsS/l+eVI+qh/L6orqyk5SRhKI4urj24jiTyfyMLw4PU33XP9s2AAAAAElFTkSuQmCC>

[image13]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFIAAAAXCAYAAACYuRhEAAAC2UlEQVR4Xu2XS8hNURTHl6I8IgkTg89ASiQlA49yPTKhFFJkoEw8IsoUiaIwUB4TMhASAykDz3xfKSR5RcLEqyTyfof1v3vt862zzt737pu6pfav/t29fuvcs/fd3/3OOZcok8lkMqn05zzh/OHcND3PBs4HzhfOMtNrN+s5K6xUpKx1BOcauc98wfQ0uzg/OG84U0yvxFJyJ+sl9SbO+6LruM85r+p7nCuqbgfHyH0grBVZWW4XpKx1KrlzeMaZ2oN92Krqr5ztqi4YQu4EvZXzC/UMMLUHbqCVbSK2kalrRW2/0fgjXVX1DKqea1DA1bGbBvqa+hZVjwFwB6wMMNYKQ2hDmhHbyJS1DpUar5pz4j3+22+BWxKSd2U8kdy10hLabBDzloecSVYKlzlzrUwgtpGxNWm/UY01h6jsMf6pag/8HS1GiTzCuc3px9kjTpOyuGY85tSM6+TMNy6Vf9nIU2qs2UvVjcQNywKPa2XBIpH2pL+pfGDoGBDzMfBUME3GXZyFqtcqmHeVlRRfk/aYO3TMbnJ+mNQYv+1uF1TmmC3ipZbMJfGeyhuFmG8ENvMGZ7FttAjmXW0lxdek/VE11vj/xp5SY/yuu10Ajy9bQYfIw1oyp8VPkDplcangGRWbOcs2WgTzrrGS4mvSPnaNPEhlj/F3VXvgH4XkcePOiB8p9UepLXAPrGwANnGBjHGxnq56rYK511pJaWudLHWzu7befA3c/pDEjUBjHyFwLYudcLyVEfQmerCZNeNSwdzrrKT0taKep2rwicrXxH1UPVcPcf7HS8EYaWhQbw645areIS6F65w5Vgp4Wmj4syvAYHJz77QNIWWtZzm/VO03aLhyAG60qvFZQnfyOrho4w3+t/a2crtOH3I9nAgf/hu5yVOoWWHYYkWEE5zXnOecZ/L6ityDsyZ1reh95pwkd/zMcrtOB7neRc5TzotyO5PJZDKZzP/DX7KOAk4mJTJoAAAAAElFTkSuQmCC>

[image14]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAXCAYAAAB50g0VAAABkElEQVR4Xu2VTStFURSGX5KPH0CKhAxIZGSiKJG5mZ8gP0EpxQ9QjKQ7Y2Jg5iMjKZSJHyBKmQglDHyvZe3NPq99v7gMdJ56u3u97zl3rdM9d28gJeX/Myl6dhqhTGkTHYheRduU/TqPokW3rhK9iKo/YwzABvP0UP1BLxsl4FJ0EdRzsOZhL63Hg1p5EO2Th0rRqWhXVJaMvkULrHkT+d3Bug52jX6GbDk/SrnoSHQiqqGsGPbw2UQffjjIPFOID5JB3P/CuuhGVM9BAWgD1QrsPet0tf7MnjXnMQuI+1nRJ3oSdXGQAz/gdOC1Oq/R1TuuZvy72sBBPmZhN/ZzEMEPyKh37tbLrmbmYX4FB/mYgN04xkGEXAN6P9s7uIS4n5UZ2A2DHOTAb7xMOGCfWxf1Lw7RJ9GNtoODAmhHvIl6GapHg1q5FV2Rl2BDdC2q5aBI7mHf5dEjj4fehP0BPboH6zXNgfeOBoeiYySPop9yBmuop4Mec7rPMrrv3olWYdcOJWNDj59SnCApKSl/zRudf2QhRaZhDQAAAABJRU5ErkJggg==>

[image15]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAAXCAYAAABefIz9AAACfklEQVR4Xu2XS6hOURTHl0eSR7eQFIMrJESuEiLkkYGSvMpQmVCGSnF1B5gopRhJIowUM49ISSJR8oqUgQEirxgQrv+/tfd31lnn8Z17v0tunV/9u3v9195nn33O2vt8V6Sm5l8xHZrgTcc4b/QX3kP7oEPQY5eLTIS6vfm36RKd9Be0J51qMBm6I9rvqsuR9aLjI++gH9ANaBW0FvooOn606ZdipWiH7T7RAtegZSbeDX02MVki6ac+28XkDXTXxDuhkaE9DBoMzYDONnqUsFB0goM+0UMGQm+9KXrt8S7eZmLCt3PbxOxz3cRLoeUmJv6hNGUK9F0qPpUcWDZ5k9JrD+2xIeZfy5XgRy5Ket/th4aa+J6UlGYzxojWN+u9JwwXvUlqUvCmhTiy18WRE5L257nYtlnSZ0zca/jEXkJPoEEuV8R5SRZ5H/qaTsuFkPMclax/WPRBf4FmGd/3awmW0ifokk+U8EiSRVIzTY5VkXeDXAx9u1fzeAiNMjHfPPdvh/EqMVV04EmfaMI3aGNoP5dkkSOCx/2dt8Ajoj5PxyLmQqdM/BraFdqvoAEmV8hi0YkO+EQFTkM3nbdI9HrxwCjag8cl37fYPBfj+3N7FLJZdEAr30SOj4eLpVOSm4mfpGanqOcp1GbiBZLtz+rJsEO04xqf6AW8zgZvgq3QCxOz3zoTEx5GH5wX4WKOOc+fziSzwC5ojjdbYJNkJyX0hpj4MvTTxLHc2o1n+e2NgJ+rtET7ii2iE/ONcBFs87vqeSD6xM+J9lmRTjd4Jvp9zeOWJFuq8iHzv8H/JsrgW+Ovr9xK5DdndUXND2P6FSwd/iSqIm7qmpqavuEPshOaWICkCBcAAAAASUVORK5CYII=>

[image16]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACoAAAAYCAYAAACMcW/9AAABb0lEQVR4Xu2WuUoEQRRFrwoiTiJG+gMu0QR+gIn4EyaCoaGBmJgIfsIEJiYmKioo+A+iX6AgGriAO6Lg7nu8brrqztLTC9JCH7hQ9e7rS03XVHcDJSX/iynRm+jH0a3jv5N34nhxXMG/9ktU9TqAWuCF2vPteiZhjRdUr4i+Rb1UT0K4iGaoN8bFVjQK5HkajmA5s2wIZ6JRLsaxDgtcCuY67ors1AzCsnRnXDZEM1Rriw5Ed/VV1OfbmeDdmhZtOfPEfMACx9nIyDYsd1k0Ijr37eQcwAJP2chID6K7+kleYlZE86jfprzIJVdP5FowDg+VLjpPNPORi0mYEB06c/dQ5YU+gjRvjo12GRZdcxHRG2mADWKRC03YhOV1shFHt2gVdrGOGf3l6l2y4bAD69lnowGpdugY9l+5Ez2JXnwb90FdfR0/ixa8DqNfdIPWC9DsMOsBlrXrdfwhupDCMwT7Ais8/P4uLPooKynJk1/iAmekVWqzOgAAAABJRU5ErkJggg==>

[image17]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAXCAYAAAD+4+QTAAAA/UlEQVR4XmNgGAVDAZQAcSa6IB7wAYibgVgWiFmA2AKIz6KogILlQPwLiP9DcRaqNF4A04OMC1FUYAHkWFIJxAuBOB1NDicg1ZI/6ALEAFIt+Y0uQAwg1ZKfQDwViD8C8QoGiH4rFBVYAEhRNrogHvAJiN2R+GYMEDOEkMQwAEhBLrogiQBkBshynACkIA9dEA9gRRdgQCRlnAAkWYAuiAPEMkDUl6KJE2UJrswUCsTiSPwkBoh6aSQxEACJ3UITgwMRBoiCHnQJIGBkwO5CdP4WLGJgsBqIXwPxEyB+DKVfMkCKGmSwgQFStiEDmMNASRhEf2eAOGgUjAI6AACjN0IgC5nhQwAAAABJRU5ErkJggg==>