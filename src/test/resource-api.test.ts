import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createResource,
  deleteResource,
  fetchResource,
  fromResourceRow,
  listResources,
  updateResource,
  type ResourceRow,
} from "@/lib/resource-api";

const mock = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ getSupabase: () => mock }));
const row: ResourceRow = {
  id: "a1e12670-d2e5-4e68-8c2a-599f02a8a477",
  user_id: "user-a",
  title: "A resource",
  url: null,
  topic: null,
  notes: null,
  status: "not_started",
  created_at: "2026-10-26T04:00:00+00:00",
  updated_at: "2026-10-26T04:00:00+00:00",
};
const input = {
  title: "  A resource  ",
  url: "",
  topic: "",
  notes: "",
  status: "not_started" as const,
};
function mockQuery(result: { data: unknown; error: unknown }) {
  const query: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const method of [
    "select",
    "eq",
    "order",
    "abortSignal",
    "insert",
    "update",
    "delete",
    "single",
    "maybeSingle",
  ]) {
    query[method] = vi.fn().mockReturnValue(query);
  }
  query["then"] = vi.fn((resolve) => resolve(result));
  mock.from.mockReturnValue(query);
  return query;
}
beforeEach(() => vi.clearAllMocks());

describe("Resources API boundary", () => {
  it("normalizes nullable columns and timestamp without changing database status", () => {
    expect(fromResourceRow(row)).toMatchObject({
      url: "",
      topic: "",
      notes: "",
      status: "not_started",
      createdAt: "2026-10-26",
    });
    expect(() => fromResourceRow({ ...row, status: "unexpected" })).toThrow("unexpected");
    expect(fromResourceRow({ ...row, status: "learning" }).status).toBe("learning");
    expect(fromResourceRow({ ...row, status: "completed" }).status).toBe("completed");
  });
  it("reads only the current user's resources, ordered newest first", async () => {
    const query = mockQuery({ data: [row], error: null });
    expect(await listResources("user-a")).toHaveLength(1);
    expect(query["eq"]).toHaveBeenCalledWith("user_id", "user-a");
    expect(query["order"]).toHaveBeenCalledWith("created_at", { ascending: false });
  });
  it("inserts the signed-in user id instead of relying on the random database default", async () => {
    const query = mockQuery({ data: row, error: null });
    await createResource("user-a", input);
    expect(query["insert"]).toHaveBeenCalledWith({
      title: "A resource",
      url: null,
      topic: null,
      notes: null,
      status: "not_started",
      user_id: "user-a",
    });
  });
  it("filters updates by owner and id, stamps updated_at, and preserves ownership", async () => {
    const query = mockQuery({ data: row, error: null });
    await updateResource("user-a", row.id, input);
    expect(query["eq"]).toHaveBeenCalledWith("user_id", "user-a");
    expect(query["eq"]).toHaveBeenCalledWith("id", row.id);
    expect(query["update"]).toHaveBeenCalledWith(
      expect.objectContaining({ updated_at: expect.any(String) }),
    );
    expect(query["update"]!.mock.calls[0]![0]).not.toHaveProperty("user_id");
  });
  it("does not report delete success when RLS denies the request", async () => {
    const error = { code: "PGRST116", message: "No rows returned" };
    const query = mockQuery({ data: null, error });
    await expect(deleteResource("user-a", row.id)).rejects.toEqual(error);
    expect(query["eq"]).toHaveBeenCalledWith("user_id", "user-a");
    expect(query["eq"]).toHaveBeenCalledWith("id", row.id);
  });
  it("returns null for invalid or inaccessible resource ids", async () => {
    expect(await fetchResource("user-a", "r1")).toBeNull();
    expect(mock.from).not.toHaveBeenCalled();
    mockQuery({ data: null, error: null });
    expect(await fetchResource("user-a", row.id)).toBeNull();
  });
  it("propagates network and permission failures rather than showing a fake empty list", async () => {
    const error = { code: "42501" };
    mockQuery({ data: null, error });
    await expect(listResources("user-a")).rejects.toEqual(error);
  });
});
