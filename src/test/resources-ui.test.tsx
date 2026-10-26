import { fireEvent, render, screen, waitFor, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { I18nextProvider } from "react-i18next";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { createAppI18n } from "@/lib/i18n";
import { ResourceForm } from "@/components/resource-form";
import { AuthGate } from "@/components/auth-gate";
import { AuthContext } from "@/hooks/use-auth";

afterEach(cleanup);
async function renderForm(onSave: (input: unknown) => Promise<void>) {
  const i18n = createAppI18n();
  await i18n.changeLanguage("vi");
  return render(
    <I18nextProvider i18n={i18n}>
      <ResourceForm onSave={onSave} onCancel={() => {}} />
    </I18nextProvider>,
  );
}

describe("Resource editing and route access", () => {
  it("allows nullable database fields and sends the selected status", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    await renderForm(save);
    fireEvent.change(screen.getByLabelText("Tiêu đề *"), { target: { value: "Học SQL" } });
    fireEvent.change(screen.getByLabelText("Trạng thái"), { target: { value: "learning" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu tài liệu" }));
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith({
        title: "Học SQL",
        url: "",
        topic: "",
        notes: "",
        status: "learning",
      }),
    );
  });
  it("rejects non-HTTP URLs before a request can be sent", async () => {
    const save = vi.fn();
    await renderForm(save);
    fireEvent.change(screen.getByLabelText("Tiêu đề *"), { target: { value: "Học SQL" } });
    fireEvent.change(screen.getByLabelText("URL (không bắt buộc)"), {
      target: { value: "javascript:alert(1)" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lưu tài liệu" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("HTTP hoặc HTTPS");
    expect(save).not.toHaveBeenCalled();
  });
  it("keeps edits available when the database rejects a save", async () => {
    const save = vi.fn().mockRejectedValue(new Error("RLS denied"));
    await renderForm(save);
    fireEvent.change(screen.getByLabelText("Tiêu đề *"), { target: { value: "Học SQL" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu tài liệu" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Không lưu được");
    expect(screen.getByLabelText("Tiêu đề *")).toHaveValue("Học SQL");
    expect(screen.getByRole("button", { name: "Lưu tài liệu" })).toBeEnabled();
  });
  it("redirects signed-out visitors without rendering protected content", async () => {
    const protectedRender = vi.fn(() => <p>Private data</p>);
    const root = createRootRoute({ component: Outlet });
    const login = createRoute({
      getParentRoute: () => root,
      path: "/login",
      component: () => <p>Login destination</p>,
    });
    const Protected = protectedRender;
    const resources = createRoute({
      getParentRoute: () => root,
      path: "/resources",
      component: () => (
        <AuthGate>
          <Protected />
        </AuthGate>
      ),
    });
    const router = createRouter({
      routeTree: root.addChildren([login, resources]),
      history: createMemoryHistory({ initialEntries: ["/resources"] }),
    });
    await router.load();
    render(
      <I18nextProvider i18n={createAppI18n()}>
        <AuthContext.Provider value={{ user: null, loading: false }}>
          <RouterProvider router={router} />
        </AuthContext.Provider>
      </I18nextProvider>,
    );
    expect(await screen.findByText("Login destination")).toBeInTheDocument();
    expect(protectedRender).not.toHaveBeenCalled();
    expect(screen.queryByText("Private data")).not.toBeInTheDocument();
  });
});
