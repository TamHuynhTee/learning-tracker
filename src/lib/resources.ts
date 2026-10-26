export const RESOURCE_STATUSES = ["chua-hoc", "dang-hoc", "hoan-thanh"] as const;

export type ResourceStatus = (typeof RESOURCE_STATUSES)[number];

export interface Resource {
  id: string;
  /** Tiêu đề tài liệu */
  title: string;
  /** Đường dẫn tài liệu (bắt đầu bằng https://) */
  url: string;
  /** Chủ đề, ví dụ: Frontend, Database… */
  topic: string;
  /** Trạng thái học */
  status: ResourceStatus;
  /** Ghi chú cá nhân (không bắt buộc) */
  notes?: string;
  /** Ngày thêm, dạng ISO "YYYY-MM-DD" */
  createdAt: string;
}

export const STATUS_LABELS: Record<ResourceStatus, string> = {
  "chua-hoc": "Chưa học",
  "dang-hoc": "Đang học",
  "hoan-thanh": "Hoàn thành",
};

export const STATUS_BADGE_CLASS: Record<ResourceStatus, string> = {
  "chua-hoc": "bg-status-todo text-status-todo-foreground border-transparent",
  "dang-hoc": "bg-status-doing text-status-doing-foreground border-transparent",
  "hoan-thanh": "bg-status-done text-status-done-foreground border-transparent",
};

/**
 * Định dạng ngày ổn định giữa máy chủ (SSR) và trình duyệt:
 * tách chuỗi "YYYY-MM-DD" thay vì dùng toLocaleDateString (múi giờ có thể khác).
 */
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${dd}/${mm}/${year}`;
}

/** Trích tên miền từ URL để hiển thị gọn trên thẻ tài liệu. */
export function urlHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

// ============ Dữ liệu mẫu (bản demo giao diện) ============
// Sẽ được thay bằng dữ liệu đọc từ Supabase khi người dùng kết nối backend.

export const sampleResources: Resource[] = [
  {
    id: "r1",
    title: "Hiểu sâu về closure trong JavaScript",
    url: "https://developer.mozilla.org/vi/docs/Web/JavaScript/Closures",
    topic: "Frontend",
    status: "hoan-thanh",
    notes: "Làm lại 3 ví dụ ở cuối bài và tự giải thích lại bằng lời.",
    createdAt: "2026-09-14",
  },
  {
    id: "r2",
    title: "Tài liệu chính thức của React — phần Learn từ đầu",
    url: "https://react.dev/learn",
    topic: "Frontend",
    status: "dang-hoc",
    notes: "Đang ở chương Managing State, làm bài tập Describing the UI.",
    createdAt: "2026-10-05",
  },
  {
    id: "r3",
    title: "TypeScript Handbook — Generics",
    url: "https://www.typescriptlang.org/docs/handbook/2/generics.html",
    topic: "TypeScript",
    status: "chua-hoc",
    createdAt: "2026-10-18",
  },
  {
    id: "r4",
    title: "Thiết kế REST API chuẩn và dễ bảo trì",
    url: "https://restfulapi.net/",
    topic: "Backend",
    status: "dang-hoc",
    notes: "Ghi chú: phân biệt PUT với PATCH, vẽ sơ đồ resource trước khi code.",
    createdAt: "2026-10-02",
  },
  {
    id: "r5",
    title: "Phương pháp Pomodoro cho người tự học",
    url: "https://francescocirillo.com/pages/pomodoro-technique",
    topic: "Phương pháp học",
    status: "hoan-thanh",
    notes: "Áp dụng được: 25 phút học + 5 phút nghỉ, hẹn giờ bằng điện thoại.",
    createdAt: "2026-08-27",
  },
  {
    id: "r6",
    title: "SQL từ cơ bản đến nâng cao (luyện từng bài)",
    url: "https://sqlbolt.com/",
    topic: "Database",
    status: "chua-hoc",
    createdAt: "2026-10-20",
  },
];

/** Tìm một tài liệu theo id — dùng cho trang chi tiết. */
export function getResourceById(id: string): Resource | undefined {
  return sampleResources.find((r) => r.id === id);
}
