# Mini Reading Tracker

## 1. Giới thiệu

**Mini Reading Tracker** là ứng dụng web hỗ trợ người dùng tìm kiếm sách, xem thông tin chi tiết và quản lý danh sách sách muốn đọc.

Ứng dụng gồm 3 màn hình chính:

* **Tìm kiếm sách:** tìm kiếm theo tên sách hoặc tác giả, xem kết quả và phân trang.
* **Chi tiết sách:** xem thông tin chi tiết của sách và thêm sách vào tủ sách với trạng thái ban đầu.
* **Tủ sách:** quản lý các sách đã thêm, cập nhật trạng thái đọc, tiến độ, đánh giá và ghi chú.

Dữ liệu sách được lấy từ **Open Library API** thông qua Backend. Dữ liệu tủ sách được lưu trữ trong **MySQL/TiDB Cloud**.

### Ảnh chụp màn hình

* `docs/Screenshot From 2026-10-02 14-34-32.png` - Màn hình tìm kiếm sách
* `docs/Screenshot From 2026-10-02 14-35-34.png` - Màn hình chi tiết sách
* `docs/Screenshot From 2026-10-02 14-35-46.png` - Màn hình tủ sách

---

## 2. Công nghệ sử dụng

### Frontend

* Vue.js
* Vite
* Axios
* Vue Router
* CSS

### Backend

* Node.js
* Express.js
* Prisma ORM
* Zod
* Fetch API

### Database

* MySQL
* TiDB Cloud Serverless

### API bên ngoài

* Open Library API

### Deploy

* Vercel - Frontend
* Render - Backend
* TiDB Cloud - Database

---

## 3. Cấu trúc project

```text
mini-reading-tracker/
│
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── state/
│   │   └── router/
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   ├── package.json
│   └── .env
│
└── README.md
```

---

## 4. Kiến trúc hệ thống

Ứng dụng sử dụng kiến trúc Client - Server.

```text
┌──────────────────────┐
│      Người dùng      │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│   Vue.js Frontend    │
│       Vercel         │
└──────────┬───────────┘
           │ HTTP/JSON
           ▼
┌──────────────────────┐
│   Node.js / Express  │
│       Render         │
└───────┬────────┬─────┘
        │        │
        │        │ HTTPS
        │        ▼
        │   ┌─────────────────┐
        │   │  Open Library   │
        │   │      API        │
        │   └─────────────────┘
        │
        ▼
┌──────────────────────┐
│   MySQL / TiDB Cloud │
│      Database        │
└──────────────────────┘
```

### Luồng tìm kiếm sách

```text
Frontend
   │
   │ GET /api/books/search
   ▼
Backend
   │
   │ Request
   ▼
Open Library API
   │
   │ Search result
   ▼
Backend
   │
   │ JSON
   ▼
Frontend
```

Frontend **không gọi trực tiếp Open Library API**. Mọi request đến Open Library đều được thực hiện thông qua Backend.

### Luồng xem chi tiết sách

```text
Frontend
   │
   │ GET /api/books/:workId
   ▼
Backend
   │
   ├── Lấy thông tin Work
   ├── Lấy thông tin Author
   └── Lấy số trang nếu có
   │
   ▼
Open Library
   │
   ▼
Backend tổng hợp dữ liệu
   │
   ▼
Frontend
```

### Luồng quản lý tủ sách

```text
Frontend
   │
   │ HTTP Request
   ▼
Backend
   │
   │ Prisma
   ▼
MySQL / TiDB Cloud
```

---

## 5. Thiết kế Database

Ứng dụng sử dụng một bảng chính là `bookshelf` vì đây là ứng dụng cho một người dùng duy nhất và không yêu cầu hệ thống đăng nhập.

### Sơ đồ Database

```text
┌─────────────────────────────────────────────┐
│                  bookshelf                  │
├─────────────────────────────────────────────┤
│ id              INT PK                      │
│ work_id         VARCHAR UNIQUE              │
│ title           VARCHAR                     │
│ author          VARCHAR NULL                │
│ cover_id        INT NULL                    │
│ description     TEXT NULL                   │
│ page_count      INT NULL                    │
│ published_year  INT NULL                    │
│ subjects        JSON NULL                   │
│ status          ENUM                        │
│ current_page    INT                         │
│ rating          INT NULL                    │
│ note            VARCHAR(1000) NULL          │
│ started_at      DATETIME NULL               │
│ finished_at     DATETIME NULL               │
│ created_at      DATETIME                    │
│ updated_at      DATETIME                    │
└─────────────────────────────────────────────┘
```

### Các trạng thái sách

```text
WANT_TO_READ
     │
     ▼
  READING
     │
     ▼
 COMPLETED
```

Người dùng cũng có thể thay đổi trạng thái theo nhu cầu.

### Một số quy tắc dữ liệu

* `work_id` là duy nhất để tránh thêm trùng một cuốn sách.
* `current_page` không được nhỏ hơn `0`.
* `current_page` không được lớn hơn tổng số trang nếu sách có thông tin số trang.
* `rating` có giá trị từ `1` đến `5` hoặc để trống.
* Khi số trang hiện tại bằng tổng số trang, sách tự động chuyển sang `COMPLETED`.
* Khi sách lần đầu chuyển sang `READING`, hệ thống lưu `started_at`.
* Khi sách chuyển sang `COMPLETED`, hệ thống lưu `finished_at`.

---

## 6. Danh sách API

### Books

#### Tìm kiếm sách

```http
GET /api/books/search?q={keyword}&page={page}
```

Ví dụ:

```http
GET /api/books/search?q=harry%20potter&page=1
```

#### Lấy lịch sử tìm kiếm

```http
GET /api/books/search/history?q={keyword}
```

Tham số `q` có thể bỏ trống để lấy các từ khóa tìm kiếm gần đây.

#### Lấy thông tin chi tiết sách

```http
GET /api/books/:workId
```

Ví dụ:

```http
GET /api/books/OL45804W
```

---

### Bookshelf

#### Lấy danh sách sách trong tủ

```http
GET /api/bookshelf
```

Có thể lọc theo trạng thái:

```http
GET /api/bookshelf?status=READING
```

#### Lấy một sách trong tủ

```http
GET /api/bookshelf/:id
```

#### Thêm sách vào tủ

```http
POST /api/bookshelf
```

Request body:

```json
{
  "workId": "OL45804W",
  "status": "WANT_TO_READ"
}
```

#### Cập nhật sách

```http
PUT /api/bookshelf/:id
```

Ví dụ:

```json
{
  "currentPage": 120,
  "status": "READING",
  "rating": 5,
  "note": "Một cuốn sách rất thú vị."
}
```

#### Xóa sách

```http
DELETE /api/bookshelf/:id
```

---

### Health Check

```http
GET /api/health
```

Dùng để kiểm tra Backend có đang hoạt động hay không.

---

## 7. Format Response

### Response thành công

```json
{
  "success": true,
  "data": {}
}
```

### Response lỗi

```json
{
  "success": false,
  "message": "Invalid request body",
  "errors": []
}
```

Backend sử dụng validation bằng **Zod** trước khi xử lý request để kiểm tra dữ liệu đầu vào.

Một số lỗi nghiệp vụ được xử lý riêng, ví dụ:

* Sách đã tồn tại trong tủ → `409 Conflict`.
* Dữ liệu request không hợp lệ → `400 Bad Request`.
* Không tìm thấy sách → `404 Not Found`.
* Lỗi hệ thống → `500 Internal Server Error`.

---

## 8. Hướng dẫn chạy Local

### Yêu cầu

* Node.js 20+
* npm
* MySQL hoặc TiDB Cloud

### Clone project

```bash
git clone https://github.com/setth123/ReadingTracker.git
cd ReadingTracker
```

---

### Chạy Backend

```bash
cd backend
npm install
```

Tạo file `.env`:

```env
PORT=5000
DATABASE_URL="mysql://username:password@host:3306/database"
FRONTEND_URL="http://localhost:5173"
```

Generate Prisma Client:

```bash
npx prisma generate
```

Chạy Prisma migration:

```bash
npx prisma migrate deploy
```

Chạy Backend:

```bash
npm run dev
```

Backend mặc định chạy tại:

```text
http://localhost:5000
```

Kiểm tra:

```text
http://localhost:5000/api/health
```

---

### Chạy Frontend

Mở terminal mới:

```bash
cd frontend
npm install
```

Tạo file `.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Chạy:

```bash
npm run dev
```

Frontend mặc định chạy tại:

```text
http://localhost:5173
```

---

## 9. Biến môi trường

### Backend

```env
PORT=5000
DATABASE_URL=...
FRONTEND_URL=...
```

### Frontend

```env
VITE_API_URL=...
```

Các file `.env` không được commit lên Git repository.

---

## 10. Deploy

### Frontend - Vercel

Frontend được deploy bằng Vercel.

Cấu hình chính:

```text
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
```

Biến môi trường:

```env
VITE_API_URL=<Backend URL>/api
```

Sau khi deploy, Vercel cung cấp URL public để truy cập ứng dụng.

---

### Backend - Render

Backend được deploy bằng Render.

Cấu hình:

```text
Root Directory: backend
Build Command: npm install
Start Command: npm start
```

Các biến môi trường:

```env
PORT=10000
DATABASE_URL=<TiDB connection string>
FRONTEND_URL=<Frontend URL>
```

Backend lắng nghe trên:

```text
0.0.0.0
```

để có thể nhận request từ Internet.

---

### Database - TiDB Cloud

Database được triển khai trên **TiDB Cloud Serverless**.

Backend kết nối đến database thông qua biến môi trường:

```env
DATABASE_URL
```

Thông tin kết nối database không được lưu trực tiếp trong source code.

---

## 11. Caching

Để hạn chế số lượng request đến Open Library, Backend sử dụng cache trong memory.

### Search cache

Kết quả tìm kiếm được cache theo:

```text
keyword + page + limit
```

Thời gian cache:

```text
5 phút
```

### Book detail cache

Thông tin chi tiết của một cuốn sách cũng được cache theo `workId`.

Thời gian cache:

```text
5 phút
```

### Search history

Lịch sử tìm kiếm được lưu trong memory của Backend.

* Tối đa lưu 50 từ khóa.
* Mỗi từ khóa có thời gian sống 24 giờ.
* API autocomplete chỉ trả về tối đa 5 kết quả gần nhất.
* Lịch sử chỉ được lưu khi người dùng thực hiện tìm kiếm thực tế.

---

## 12. Giả định

* Ứng dụng chỉ phục vụ một người dùng nên không cần hệ thống đăng nhập.
* Dữ liệu sách được lấy từ Open Library.
* `workId` của Open Library được sử dụng để định danh sách.
* Thông tin số trang có thể không tồn tại đối với một số sách.
* Search history chỉ cần lưu tạm thời trong memory vì đây không phải dữ liệu nghiệp vụ chính.

---

## 13. Hạn chế

* Search history được lưu trong memory nên sẽ mất khi Backend restart hoặc deploy lại.
* Chưa có hệ thống authentication và authorization.
* Ứng dụng hiện chỉ hỗ trợ một người dùng.
* Dữ liệu từ Open Library phụ thuộc vào chất lượng và độ đầy đủ của API bên ngoài.
* Một số sách có thể thiếu ảnh bìa, mô tả, tác giả hoặc số trang.
* Cache hiện tại là in-memory nên không dùng chung được giữa nhiều Backend instance.
* Chưa có hệ thống logging và monitoring chuyên sâu.

---

## 14. Hướng cải thiện

Nếu có thêm thời gian, có thể phát triển thêm:

* Thêm đăng nhập và quản lý nhiều người dùng.
* Lưu search history vào database.
* Sử dụng Redis cho caching.
* Bổ sung Swagger/OpenAPI cho tài liệu API.
* Bổ sung unit test và integration test.
* Thêm hệ thống logging và monitoring.
* Cải thiện UI/UX trên mobile.
* Bổ sung sorting và filtering cho tủ sách.
* Cho phép tìm kiếm nâng cao theo thể loại, năm xuất bản hoặc tác giả.
* Cải thiện xử lý dữ liệu thiếu từ Open Library.
* Bổ sung Docker để đơn giản hóa việc chạy project ở môi trường khác.

---

## 15. Link Demo

### Frontend

```text
https://readingtracker-frontend.vercel.app/
```

### Backend

```text
https://reading-tracker-api-lbf6.onrender.com
```

### Repository

```text
https://github.com/setth123/ReadingTracker.git
```

