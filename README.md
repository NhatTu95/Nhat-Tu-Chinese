# Nhật Tu Chinese — React starter

Website học tiếng Trung giao diện tiếng Việt, phong cách xanh dịu PandaVocab, responsive cho iPhone và máy tính.

## Có sẵn trong bản Basic
- Dashboard tổng quan và lối tắt học tập.
- Từ điển tra cứu theo chữ Hán, pinyin, Hán Việt và nghĩa tiếng Việt.
- Chi tiết từ gồm từ loại, cấp HSK, ví dụ song ngữ, ngữ cảnh và phát âm bằng speechSynthesis của trình duyệt.
- Dịch nhanh Việt–Trung / Trung–Việt. Có một số câu mẫu chạy ngay; dịch tự do cần cấu hình Gemini API.
- Sổ từ vựng lưu trên thiết bị bằng localStorage.

## Chạy website
Yêu cầu Node.js 18+.

```bash
npm install
npm run dev
```
Mở địa chỉ Vite hiển thị trong terminal (thường là http://localhost:5173).

## Bật dịch AI Gemini
1. Sao chép `.env.example` thành `.env`.
2. Điền `GEMINI_API_KEY` của bạn. Không đưa API key vào mã frontend hoặc chia sẻ công khai.
3. Mở terminal thứ nhất và chạy API:

```bash
npm run server
```

4. Mở terminal thứ hai và chạy giao diện:

```bash
npm run dev
```

Trong môi trường phát triển, thêm proxy vào `vite.config.js` (tệp này đã được cấu hình sẵn) để chuyển `/api` sang `http://localhost:3001`.

## Build để triển khai
```bash
npm run build
npm run preview
```

## Lưu ý dữ liệu
Từ điển hiện tại là dữ liệu mẫu minh họa, chưa phải bộ dữ liệu đầy đủ HSK 1–9. Sổ từ vựng lưu trong trình duyệt hiện tại; muốn đồng bộ nhiều thiết bị cần bổ sung đăng nhập và cơ sở dữ liệu.


## Gia sư AI trò chuyện
- Mở mục **Gia sư AI** trong thanh điều hướng.
- Có thể trò chuyện bằng tiếng Việt hoặc tiếng Trung; gia sư sẽ sửa câu, thêm pinyin, nghĩa tiếng Việt và giải thích ngữ pháp.
- Tạo tệp `.env` từ `.env.example`, điền `GEMINI_API_KEY` ở phía máy chủ.
- Chạy `npm run server` trong một terminal và `npm run dev` trong terminal khác.
- Giao diện lưu lịch sử hội thoại trong localStorage của trình duyệt đang sử dụng. Bản hiện tại chưa đồng bộ lịch sử giữa các thiết bị.


## Phân hệ luyện nghe HSK 1–2 (không cần API)
- Chọn **Luyện nghe** trên thanh điều hướng.
- Bài mẫu chia thành câu có mốc thời gian; có thể nghe toàn bài hoặc từng câu bằng TTS tiếng Trung của thiết bị.
- Các chế độ: Phụ đề, Shadowing, Chính tả và Điền từ.
- Bật/tắt pinyin và nghĩa tiếng Việt.
- Không cần API Key. Giọng đọc dùng Speech Synthesis của trình duyệt, không phải bản thu âm người bản ngữ.


## Đưa Nhật Tu Chinese lên Internet (không cần API cho các chức năng học cơ bản)

### Cách đơn giản: Vercel (khuyên dùng cho giao diện React)
1. Giải nén `nhat-tu-chinese-react.zip` trên máy tính.
2. Tạo tài khoản tại https://github.com và tạo repository mới tên `nhat-tu-chinese`.
3. Đưa toàn bộ nội dung thư mục dự án lên repository GitHub (Upload files hoặc dùng Git).
4. Đăng nhập https://vercel.com bằng GitHub, chọn **Add New → Project**.
5. Chọn repository `nhat-tu-chinese`.
6. Thiết lập:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
7. Nhấn **Deploy**. Khi hoàn tất, Vercel cấp cho bạn một địa chỉ dạng `https://ten-du-an.vercel.app`.
8. Mở địa chỉ đó trên iPhone và chọn Chia sẻ → Thêm vào Màn hình chính để dùng gần giống ứng dụng.

### Lưu ý về chức năng cần máy chủ
- Từ điển mẫu, sổ từ đã lưu, bài luyện nghe mẫu và phát âm TTS của trình duyệt có thể dùng ở bản triển khai tĩnh.
- Chức năng Gia sư AI trò chuyện hiện gọi endpoint `/api/chat`; muốn AI trả lời tự do cần triển khai thêm `server/` trên một dịch vụ backend (ví dụ Render) và cấu hình khóa Gemini ở máy chủ. Không đưa API key vào mã React hoặc repository công khai.
- Nếu không muốn dùng bất kỳ API nào, hãy xem Gia sư AI như khu vực luyện câu theo kịch bản; phần trò chuyện AI tự do sẽ chưa hoạt động.
- Bản hiện tại dùng `vite.config.js` proxy `/api` tới `localhost:3001` chỉ trong môi trường phát triển. Khi deploy frontend tĩnh, proxy này không tự tạo backend trên Vercel.

### Chạy thử trên máy tính
```bash
npm install
npm run dev
```
Mở địa chỉ Vite hiển thị trong terminal.

### Tự kiểm tra bản build trước khi đăng
```bash
npm run build
npm run preview
```
