# Supabase + TanStack Start

## Cấu hình

Hai biến public được dùng cho cả browser client và server client:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Không dùng secret key hoặc service_role key. `.env.local` dành cho máy local,
đã được Git bỏ qua. Lovable cần hai biến public trong `.env` được commit để build
preview và bản publish; không đưa backend secrets vào file đó.

Chạy `pnpm dev`; khi đổi env phải khởi động lại server. Khi deploy, các biến
`VITE_*` được nhúng lúc build nên phải build/publish lại sau khi đổi.

## Auth và xác nhận email

App dùng `@supabase/ssr`: browser client lưu phiên trong cookie để server đọc được.
Người dùng có phiên localStorage của bản cũ có thể cần đăng nhập lại một lần.

Trong Supabase Dashboard:

1. Authentication → Sign In / Providers: bật Email/password.
2. Authentication → URL Configuration: đặt Site URL là origin chính thức của app.
3. Thêm Redirect URLs theo host/port thực tế:
   - `http://localhost:5173/auth/callback` (đổi port theo terminal).
   - `http://127.0.0.1:5174/auth/callback` nếu dùng dev server kiểm tra này.
   - `https://TEN-APP.lovable.app/auth/callback` và URL tương ứng cho preview/domain riêng.

Đăng ký thành công chuyển về `/login`, vẫn nhắc xác nhận email khi cần. Email xác
nhận quay về `/auth/callback`; server đổi PKCE code thành session cookie rồi
chuyển tới `/login?confirmation=success`. Mã thiếu/hết hạn chuyển về login cùng
thông báo lỗi. PKCE yêu cầu mở email trong cùng trình duyệt đã đăng ký.
Nút Google hiện vẫn là placeholder.

## Luồng dữ liệu

```text
Route loader → server function GET → kiểm tra user → Supabase + RLS
Form → server function POST + Zod → kiểm tra user → ghi Supabase + RLS
Thành công → router.invalidate() → loader tải dữ liệu mới
```

- `src/lib/supabase.ts`: browser client, chỉ dùng cho Auth.
- `src/lib/supabase.server.ts`: tạo client riêng mỗi request, đọc/ghi cookie, chuyển
  tiếp cache headers của Supabase khi refresh, xác thực người dùng bằng `getUser()`.
- `src/lib/auth.functions.ts`: root loader lấy duy nhất user id/email, không serialize
  access token hoặc refresh token vào HTML.
- `src/lib/resources.functions.ts`: GET danh sách/chi tiết, POST thêm/sửa/xóa; mỗi
  endpoint kiểm tra Auth riêng và lấy user_id từ phiên server.
- `src/lib/resource-validation.ts`: kiểm tra dữ liệu đầu vào tại server bằng Zod.
- `src/lib/resource-model.ts`: chuẩn hóa cột nullable và ngày tháng cho giao diện.
- `src/routes/resources.index.tsx`, `resources.$resourceId.tsx`: đọc `Route.useLoaderData()`.
- `src/routes/resources.new.tsx`: loader bảo vệ route, form gọi server function.

Sửa thành công chờ `router.invalidate({ sync: true })` để chi tiết hiển thị dữ liệu
mới. Sau xóa, chuyển sang danh sách trước rồi invalidate để không tải lại tài liệu
vừa bị xóa. Có pending/error/not-found UI cho các route.

SSR có thể render dữ liệu người dùng từ loader ngay. Phản hồi đọc phiên/dữ liệu
đặt `Cache-Control: private, no-store`. AuthProvider dùng public user từ root loader
để render ban đầu; khi tài khoản thay đổi, cache được xóa, loader được invalidate
và nội dung cũ được ẩn cho đến khi root loader khớp với người dùng hiện tại.
Middleware CSRF sẵn có trong `src/start.ts` vẫn bảo vệ server functions.

## Schema và RLS

Bảng `public.resources`:

- `id`, `user_id`: UUID.
- `title`: bắt buộc; `url`, `topic`, `notes`: nullable.
- `status`: enum `public.resource_status`: `not_started`, `learning`, `completed`.
- `created_at`, `updated_at`: timestamptz.

Code và database dùng cùng enum; nhãn hiển thị được dịch theo ngôn ngữ.
Server luôn gửi user_id của người đăng nhập khi thêm tài liệu, không dựa vào
`gen_random_uuid()` mặc định của cột này. Sửa/xóa/đọc cũng lọc theo user_id.
App gửi updated_at khi sửa. Không thay schema hoặc policy trên Supabase.

Policy do người dùng cung cấp:

- SELECT/DELETE: `auth.uid() = user_id` trong USING.
- INSERT: `auth.uid() = user_id` trong WITH CHECK.
- UPDATE: `auth.uid() = user_id` trong cả USING và WITH CHECK.

RLS vẫn là lớp kiểm soát quyền trong database, ngay cả khi đã có Auth ở server.
Dữ liệu mẫu chỉ còn làm fixture/tham chiếu.

## Kiểm tra

Chạy `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm build`.
Test tự động mock Supabase để kiểm tra quyền theo user, validation ở server,
không tin user_id do client giả mạo, luồng cookie/PKCE và tải lại loader sau CRUD.
Đã kiểm tra dev server thật: `/login` trả 200; ba route tài liệu trả 307 về login
khi không có cookie; callback không có code trả 303 cùng thông báo lỗi.

Cần kiểm tra tiếp bằng tài khoản thật:

1. Đăng ký, xác nhận email trong cùng trình duyệt, đăng nhập.
2. Thêm tài liệu rồi tải lại trực tiếp danh sách và URL chi tiết; dữ liệu vẫn còn.
3. Sửa thông tin, đổi trạng thái, kiểm tra dữ liệu cập nhật ngay.
4. Thử hủy xóa, sau đó xác nhận xóa; trở về danh sách, không xuất hiện lỗi 404 tạm.
5. Đăng xuất và đăng nhập tài khoản B; không thấy dữ liệu của A cả khi quay lại
   lịch sử trình duyệt hoặc mở trực tiếp URL tài liệu A.

Chưa xác minh CRUD/RLS end-to-end trên Supabase thật bằng hai tài khoản trong phiên
này. Không tạo tài khoản hoặc sửa/xóa dữ liệu thật để chạy test.

Tham khảo:

- https://supabase.com/docs/guides/getting-started/quickstarts/tanstack
- https://tanstack.com/start/latest/docs/framework/react/guide/server-functions
