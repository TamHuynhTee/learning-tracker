import { beforeEach, describe, expect, it, vi } from "vitest";
import { fromResourceRow, type ResourceRow } from "@/lib/resource-model";
import {
  createResourceFn,
  deleteResourceFn,
  getResourceFn,
  getResourcesFn,
  updateResourceFn,
} from "@/lib/resources.functions";

const mock = vi.hoisted(() => ({ from: vi.fn(), requireUser: vi.fn() }));
vi.mock("@/lib/supabase.server", () => ({ requireUser: mock.requireUser }));
// Exercise validation and handler logic directly. The production build/integration
// checks cover Start's transport compilation and SSR route wiring separately.
vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => {
    let validator: { parse: (data: unknown) => unknown } | undefined;
    const builder = {
      validator: (schema: { parse: (data: unknown) => unknown }) => {
        validator = schema;
        return builder;
      },
      handler:
        (handler: (context: { data: unknown }) => Promise<unknown>) =>
        async (options?: { data: unknown }) =>
          handler({ data: validator ? validator.parse(options?.data) : options?.data }),
    };
    return builder;
  },
}));
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
beforeEach(() => {
  vi.clearAllMocks();
  mock.requireUser.mockResolvedValue({ supabase: { from: mock.from }, user: { id: "user-a" } });
});

describe("Resources server functions", () => {
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
    expect(await getResourcesFn()).toHaveLength(1);
    expect(query["eq"]).toHaveBeenCalledWith("user_id", "user-a");
    expect(query["order"]).toHaveBeenCalledWith("created_at", { ascending: false });
  });
  it("inserts the signed-in user id instead of relying on the random database default", async () => {
    const query = mockQuery({ data: row, error: null });
    await createResourceFn({ data: input });
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
    await updateResourceFn({ data: { ...input, id: row.id } });
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
    await expect(deleteResourceFn({ data: { id: row.id } })).rejects.toThrow(
      "Không xóa được tài liệu.",
    );
    expect(query["eq"]).toHaveBeenCalledWith("user_id", "user-a");
    expect(query["eq"]).toHaveBeenCalledWith("id", row.id);
  });
  it("returns not-found for invalid or inaccessible ids without leaking resources", async () => {
    await expect(getResourceFn({ data: { id: "r1" } })).rejects.toMatchObject({ isNotFound: true });
    expect(mock.from).not.toHaveBeenCalled();
    mockQuery({ data: null, error: null });
    await expect(getResourceFn({ data: { id: row.id } })).rejects.toMatchObject({
      isNotFound: true,
    });
  });
  it("propagates network and permission failures rather than showing a fake empty list", async () => {
    const error = { code: "42501" };
    mockQuery({ data: null, error });
    await expect(getResourcesFn()).rejects.toThrow("Không tải được danh sách tài liệu.");
  });
  it("rejects unauthenticated calls to every endpoint before querying the database", async () => {
    const redirect = { isRedirect: true };
    mock.requireUser.mockRejectedValue(redirect);
    const calls = [
      () => getResourcesFn(),
      () => getResourceFn({ data: { id: row.id } }),
      () => createResourceFn({ data: input }),
      () => updateResourceFn({ data: { ...input, id: row.id } }),
      () => deleteResourceFn({ data: { id: row.id } }),
    ];
    for (const call of calls) await expect(call()).rejects.toEqual(redirect);
    expect(mock.from).not.toHaveBeenCalled();
  });
  it("validates input on the server and ignores a forged owner id", async () => {
    await expect(createResourceFn({ data: { ...input, title: " " } })).rejects.toThrow();
    await expect(
      createResourceFn({ data: { ...input, url: "javascript:alert(1)" } }),
    ).rejects.toThrow();
    expect(mock.from).not.toHaveBeenCalled();
    const query = mockQuery({ data: row, error: null });
    const forged = { ...input, user_id: "user-b" };
    await createResourceFn({ data: forged });
    expect(query["insert"]).toHaveBeenCalledWith(expect.objectContaining({ user_id: "user-a" }));
  });
});
