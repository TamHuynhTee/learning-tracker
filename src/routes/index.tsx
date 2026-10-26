import { createFileRoute, redirect } from "@tanstack/react-router";

// Trang gốc chỉ chuyển hướng về danh sách tài liệu — ứng dụng mở trực tiếp /resources.
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/resources" });
  },
});
