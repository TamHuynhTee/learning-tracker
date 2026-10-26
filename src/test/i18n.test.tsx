import { act, fireEvent, render, screen } from "@testing-library/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { I18nextProvider } from "react-i18next";
import { describe, expect, it } from "vitest";

import { createAppI18n } from "@/lib/i18n";
import en from "@/locales/en.json";
import vi from "@/locales/vi.json";
import { Route as registerRoute } from "@/routes/register";

describe("Language support", () => {
  it("defaults to English and switches to Vietnamese without changing other instances", async () => {
    const first = createAppI18n();
    const second = createAppI18n();
    expect(first.t("auth.register")).toBe("Sign up");
    await first.changeLanguage("vi");
    expect(first.t("auth.register")).toBe("Đăng ký");
    expect(second.t("auth.register")).toBe("Sign up");
  });

  it("has matching keys and interpolation variables in both catalogs", () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(vi).sort());
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      const placeholders = (value: unknown) =>
        JSON.stringify(value)
          .match(/\{\{\w+\}\}/g)
          ?.sort() ?? [];
      expect(placeholders(en[key]), key).toEqual(placeholders(vi[key]));
    }
  });

  it("interpolates values and uses English singular/plural forms", () => {
    const i18n = createAppI18n();
    expect(i18n.t("resources.count", { count: 1 })).toBe("1 resource");
    expect(i18n.t("resources.count", { count: 6 })).toBe("6 resources");
    expect(i18n.t("resource.missingId", { id: "r7" })).toContain("r7");
  });

  it("translates registration fields and existing validation messages when switching languages", async () => {
    const i18n = createAppI18n();
    const root = createRootRoute({ component: Outlet });
    const register = createRoute({
      getParentRoute: () => root,
      path: "/register",
      component: registerRoute.options.component!,
    });
    const router = createRouter({
      routeTree: root.addChildren([register]),
      history: createMemoryHistory({ initialEntries: ["/register"] }),
    });
    await router.load();
    const view = render(
      <I18nextProvider i18n={i18n}>
        <RouterProvider router={router} />
      </I18nextProvider>,
    );
    expect(await screen.findByText("Create an account")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Sign up" }));
    expect(await screen.findByText("Please enter a valid email address.")).toBeInTheDocument();
    await act(() => i18n.changeLanguage("vi"));
    expect(screen.getByText("Tạo tài khoản")).toBeInTheDocument();
    expect(screen.getByText("Vui lòng nhập địa chỉ email hợp lệ.")).toBeInTheDocument();
    expect(screen.getByLabelText("Nhập lại mật khẩu")).toBeInTheDocument();
    view.unmount();
  });
});
