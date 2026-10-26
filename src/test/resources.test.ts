import { describe, expect, it } from "vitest";

import {
  RESOURCE_STATUSES,
  STATUS_LABELS,
  formatDate,
  getResourceById,
  sampleResources,
  urlHostname,
} from "@/lib/resources";

describe("Learning resources (dữ liệu mẫu)", () => {
  it("có đúng ba trạng thái tiếng Việt: Chưa học, Đang học, Hoàn thành", () => {
    expect(STATUS_LABELS["chua-hoc"]).toBe("Chưa học");
    expect(STATUS_LABELS["dang-hoc"]).toBe("Đang học");
    expect(STATUS_LABELS["hoan-thanh"]).toBe("Hoàn thành");
    expect(RESOURCE_STATUSES).toHaveLength(3);
  });

  it("dữ liệu mẫu phủ cả ba trạng thái", () => {
    for (const status of RESOURCE_STATUSES) {
      expect(sampleResources.some((r) => r.status === status)).toBe(true);
    }
  });

  it("mỗi tài liệu mẫu đều có tiêu đề, URL https, chủ đề và ngày thêm", () => {
    for (const r of sampleResources) {
      expect(r.title.trim()).not.toBe("");
      expect(r.url.startsWith("https://")).toBe(true);
      expect(r.topic.trim()).not.toBe("");
      expect(r.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("tìm tài liệu theo id và trả về undefined khi không có", () => {
    const first = sampleResources[0];
    expect(first).toBeDefined();
    if (!first) return;
    expect(getResourceById(first.id)?.title).toBe(first.title);
    expect(getResourceById("khong-ton-tai")).toBeUndefined();
  });

  it("định dạng ngày theo dd/MM/yyyy bất chấp múi giờ", () => {
    expect(formatDate("2026-10-05")).toBe("05/10/2026");
  });

  it("trích tên miền từ URL", () => {
    expect(urlHostname("https://react.dev/learn")).toBe("react.dev");
  });
});
