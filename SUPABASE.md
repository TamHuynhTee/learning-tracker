# Kết nối Supabase

## Cấu hình local

Thư viện `@supabase/supabase-js` đã được cài. Tạo `.env.local` ở thư mục gốc:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Có thể dùng anon key cũ làm giá trị của `VITE_SUPABASE_PUBLISHABLE_KEY`.
Không dùng secret key hoặc service_role key cho các biến `VITE_*`.
`.env.local` đã được bỏ qua bởi quy tắc `*.local` trong `.gitignore`.

Chạy `pnpm dev`. Mỗi lần thay đổi biến môi trường, dừng và khởi động lại dev server.

## Cấu hình Auth trong Supabase Dashboard

1. Trong Authentication → Sign In / Providers, bật Email/password.
2. Trong Authentication → URL Configuration, đặt Site URL theo địa chỉ app hiện tại.
3. Thêm địa chỉ đăng nhập vào Redirect URLs, ví dụ `http://localhost:5173/login`.
   Dùng đúng host và port do terminal hiển thị, nếu khác ví dụ.
4. Khi deploy, thêm URL tương ứng của bản deploy và cấu hình hai biến môi trường
   ở nơi build app. Các biến `VITE_*` được nhúng khi build; cần build lại khi đổi.

Nếu bật Confirm email, sau khi đăng ký cần mở email xác nhận trước khi đăng nhập.
Sau khi đăng ký thành công, app chuyển về `/login` trong cả hai trường hợp và
hiển thị thông báo xác nhận email nếu cần. Khi Confirm email bị tắt, Supabase có
thể trả về phiên ngay; app vẫn giữ phiên đó.
Không cần bật Google để dùng email/password; nút Google hiện vẫn là placeholder.

## Phần đã tích hợp

- `/register`: gọi `auth.signUp`, xử lý lỗi và trường hợp cần xác nhận email.
- `/login`: gọi `auth.signInWithPassword`, chỉ chuyển trang khi thành công.
- Header: hiển thị email người dùng, đăng xuất trên trình duyệt hiện tại.
- `AuthProvider`: theo dõi `onAuthStateChange` để khôi phục và cập nhật phiên.
- Client Auth chỉ khởi tạo ở trình duyệt; chưa có Auth bằng cookie trên SSR.

## Kiểm tra thủ công

1. Đăng ký bằng email bạn kiểm soát; xác nhận email nếu Supabase yêu cầu.
2. Thử đăng nhập sai mật khẩu: phải báo lỗi và ở lại trang đăng nhập.
3. Đăng nhập đúng: chuyển sang `/resources`, header hiển thị email.
4. Tải lại trang: header khôi phục phiên đăng nhập.
5. Đăng xuất: trở về `/login`, header hiện nút Đăng nhập.

Các test tự động mock Supabase; chưa chứng minh kết nối với project thật.

## Tài liệu và quyền truy cập

Các trang `/resources`, `/resources/new`, `/resources/:resourceId` yêu cầu phiên
đăng nhập trước khi tải dữ liệu. Phiên nằm trong trình duyệt; SSR không tải dữ liệu
riêng tư. RLS vẫn là lớp kiểm soát quyền truy cập tại database.

App đọc và ghi bảng `public.resources` theo schema người dùng cung cấp:

- `id`, `user_id`: UUID.
- `title`: bắt buộc; `url`, `topic`, `notes`: có thể null.
- `status`: enum `public.resource_status` với `not_started`, `learning`, `completed`.
- `created_at`, `updated_at`: timestamptz.

Code và database dùng chung enum trong `src/lib/resources.ts`; chỉ nhãn hiển thị
được dịch theo ngôn ngữ:

| Database      | Giao diện  |
| ------------- | ---------- |
| `not_started` | Chưa học   |
| `learning`    | Đang học   |
| `completed`   | Hoàn thành |

Client luôn gửi `user_id` của người đăng nhập khi thêm mới, không dựa vào default
`gen_random_uuid()` của cột này. Các truy vấn đọc, sửa, xóa cũng lọc theo user_id.
Khi cập nhật, app gửi `updated_at` mới. Không sửa schema hay policy trên Supabase.

Policy được người dùng cung cấp:

- SELECT/DELETE: `auth.uid() = user_id` trong USING.
- INSERT: `auth.uid() = user_id` trong WITH CHECK.
- UPDATE: `auth.uid() = user_id` trong cả USING và WITH CHECK.

Danh sách có tìm kiếm và lọc theo trạng thái; trang thêm/chi tiết dùng form chung
để thêm, sửa thông tin và đổi trạng thái. Xóa cần xác nhận trong giao diện.
Dữ liệu mẫu được giữ lại để tham chiếu và chạy test, không dùng trên các trang.
Cache được tách theo tài khoản và xóa khi đăng xuất hoặc đổi tài khoản.

## Kiểm tra CRUD với tài khoản thật

1. Đăng nhập tài khoản A, thêm tài liệu có tiêu đề; URL/chủ đề/ghi chú có thể bỏ trống.
2. Tải lại trang và kiểm tra tài liệu vừa thêm vẫn còn.
3. Mở chi tiết, chỉnh sửa ghi chú và đổi trạng thái sang Đang học, rồi Hoàn thành.
4. Kiểm tra danh sách, bộ lọc và dữ liệu sau khi tải lại trang.
5. Đăng xuất, đăng nhập tài khoản B: tài liệu của A không được hiển thị.
   Thử URL chi tiết của tài liệu A: B phải nhận thông báo không tìm thấy/không có quyền.
6. Quay lại A, thử hủy xóa trước; sau đó xác nhận xóa và kiểm tra tài liệu đã biến mất.

Kiểm tra kết nối read-only trong phiên tích hợp: Auth settings trả HTTP 200,
Email provider đã bật; truy vấn REST resources không đăng nhập trả HTTP 200 với
0 hàng. Endpoint metadata `/rest/v1/` trả 401 "Secret API key required"; điều này
không yêu cầu thay publishable key của frontend. Chưa kiểm thử CRUD đăng nhập
thật hoặc xác minh RLS với hai tài khoản trong môi trường này.

Tài liệu: https://supabase.com/docs/guides/auth/passwords
