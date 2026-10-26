import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { I18nextProvider } from "react-i18next";
import { createAppI18n } from "@/lib/i18n";
import { Route as listPage } from "@/routes/resources.index";
import { Route as detailPage } from "@/routes/resources.$resourceId";
import { Route as newPage } from "@/routes/resources.new";
import type { Resource } from "@/lib/resources";

const server = vi.hoisted(() => ({
  getResourcesFn: vi.fn(),
  getResourceFn: vi.fn(),
  createResourceFn: vi.fn(),
  updateResourceFn: vi.fn(),
  deleteResourceFn: vi.fn(),
  requireResourceUserFn: vi.fn(),
}));
vi.mock("@/lib/resources.functions", () => server);
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));
const resource: Resource = {
  id: "a1e12670-d2e5-4e68-8c2a-599f02a8a477",
  title: "Học SQL",
  url: "",
  topic: "",
  notes: "",
  status: "not_started",
  createdAt: "2026-10-26",
};
let current: Resource;
beforeEach(() => {
  vi.clearAllMocks();
  current = { ...resource };
  server.getResourcesFn.mockImplementation(async () => [current]);
  server.getResourceFn.mockImplementation(async () => current);
  server.requireResourceUserFn.mockResolvedValue({ id: "user-a" });
});
afterEach(cleanup);
async function show(path: string) {
  const root = createRootRoute({ component: Outlet });
  const list = createRoute({
    getParentRoute: () => root,
    path: "/resources/",
    loader: () => server.getResourcesFn(),
    component: listPage.options.component!,
  });
  const detail = createRoute({
    getParentRoute: () => root,
    path: "/resources/$resourceId",
    loader: ({ params }) => server.getResourceFn({ data: { id: params.resourceId } }),
    component: detailPage.options.component!,
  });
  const add = createRoute({
    getParentRoute: () => root,
    path: "/resources/new",
    loader: () => server.requireResourceUserFn(),
    component: newPage.options.component!,
  });
  const router = createRouter({
    routeTree: root.addChildren([list, detail, add]),
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  await router.load();
  const i18n = createAppI18n();
  await i18n.changeLanguage("vi");
  render(
    <I18nextProvider i18n={i18n}>
      <RouterProvider router={router} />
    </I18nextProvider>,
  );
  return router;
}

describe("Start loader/mutation workflow", () => {
  it("renders normalized loader data, including nullable columns and dates", async () => {
    await show("/resources");
    expect(await screen.findByText("Học SQL")).toBeInTheDocument();
    expect(screen.getByText("26/10/2026")).toBeInTheDocument();
    expect(screen.getByText("Chưa có chủ đề")).toBeInTheDocument();
    expect(server.getResourcesFn).toHaveBeenCalledOnce();
  });
  it("creates through a server function and navigates to the newly loaded detail", async () => {
    server.createResourceFn.mockImplementation(async ({ data }: { data: Partial<Resource> }) => {
      current = { ...resource, ...data };
      return current;
    });
    const router = await show("/resources/new");
    fireEvent.change(await screen.findByLabelText("Tiêu đề *"), { target: { value: "Học React" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu tài liệu" }));
    expect(await screen.findByRole("heading", { name: "Học React" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(`/resources/${resource.id}`);
    expect(server.createResourceFn).toHaveBeenCalledWith({
      data: { title: "Học React", url: "", topic: "", notes: "", status: "not_started" },
    });
  });
  it("reloads the detail loader after editing instead of retaining stale data", async () => {
    server.updateResourceFn.mockImplementation(async ({ data }: { data: Partial<Resource> }) => {
      current = { ...resource, ...data };
      return current;
    });
    await show(`/resources/${resource.id}`);
    fireEvent.click(await screen.findByRole("button", { name: "Chỉnh sửa tài liệu" }));
    fireEvent.change(screen.getByLabelText("Tiêu đề *"), { target: { value: "SQL nâng cao" } });
    fireEvent.change(screen.getByLabelText("Trạng thái"), { target: { value: "learning" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu tài liệu" }));
    expect(await screen.findByRole("heading", { name: "SQL nâng cao" })).toBeInTheDocument();
    expect(server.getResourceFn).toHaveBeenCalledTimes(2);
    expect(server.updateResourceFn).toHaveBeenCalledWith({
      data: expect.objectContaining({ id: resource.id, status: "learning" }),
    });
  });
  it("navigates off a deleted detail before revalidating loaders", async () => {
    server.deleteResourceFn.mockResolvedValue({ success: true });
    const router = await show(`/resources/${resource.id}`);
    server.getResourceFn.mockClear();
    server.getResourcesFn.mockResolvedValue([]);
    fireEvent.click(await screen.findByRole("button", { name: "Xóa tài liệu" }));
    const confirmation = screen.getByRole("group", { name: /Xóa vĩnh viễn/ });
    fireEvent.click(within(confirmation).getByRole("button", { name: "Xóa tài liệu" }));
    expect(await screen.findByText("Không tìm thấy tài liệu nào")).toBeInTheDocument();
    await waitFor(() => expect(router.state.location.pathname).toBe("/resources"));
    expect(server.getResourceFn).not.toHaveBeenCalled();
    expect(server.deleteResourceFn).toHaveBeenCalledWith({ data: { id: resource.id } });
  });
});
