import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseServer, readUser, requireUser } from "@/lib/supabase.server";
import { handleAuthCallback } from "@/lib/auth-callback.server";

const mock = vi.hoisted(() => ({
  createServerClient: vi.fn(),
  getCookies: vi.fn(),
  setCookie: vi.fn(),
  setResponseHeader: vi.fn(),
  getUser: vi.fn(),
  exchangeCodeForSession: vi.fn(),
}));
vi.mock("@supabase/ssr", () => ({ createServerClient: mock.createServerClient }));
vi.mock("@tanstack/react-start/server", () => ({
  getCookies: mock.getCookies,
  setCookie: mock.setCookie,
  setResponseHeader: mock.setResponseHeader,
}));
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
  mock.getCookies.mockReturnValue({ "sb-session": "request-cookie" });
  mock.getUser.mockResolvedValue({
    data: { user: { id: "user-a", email: "learner@example.com" } },
    error: null,
  });
  mock.createServerClient.mockImplementation(() => ({
    auth: { getUser: mock.getUser, exchangeCodeForSession: mock.exchangeCodeForSession },
  }));
});
afterEach(() => vi.unstubAllEnvs());

describe("Supabase cookie/SSR boundary", () => {
  it("creates a new client per request, reads request cookies and forwards refreshed cookies/cache headers", () => {
    expect(createSupabaseServer()).not.toBe(createSupabaseServer());
    const options = mock.createServerClient.mock.calls[0]![2];
    expect(options.cookies.getAll()).toEqual([{ name: "sb-session", value: "request-cookie" }]);
    options.cookies.setAll(
      [{ name: "sb-session", value: "refreshed", options: { path: "/", sameSite: "lax" } }],
      { "Cache-Control": "private, no-store", Pragma: "no-cache" },
    );
    expect(mock.setCookie).toHaveBeenCalledWith("sb-session", "refreshed", {
      path: "/",
      sameSite: "lax",
    });
    expect(mock.setResponseHeader).toHaveBeenCalledWith("Cache-Control", "private, no-store");
    expect(mock.setResponseHeader).toHaveBeenCalledWith("Pragma", "no-cache");
  });
  it("validates the user using Auth and makes personalized responses private", async () => {
    expect((await requireUser()).user.id).toBe("user-a");
    expect(mock.getUser).toHaveBeenCalledOnce();
    expect(mock.setResponseHeader).toHaveBeenCalledWith("Cache-Control", "private, no-store");
  });
  it("redirects missing sessions and does not disguise Auth outages as logged-out users", async () => {
    mock.getUser.mockResolvedValue({ data: { user: null }, error: { status: 400 } });
    expect((await readUser()).user).toBeNull();
    await expect(requireUser()).rejects.toMatchObject({ options: { to: "/login" } });
    mock.getUser.mockResolvedValue({ data: { user: null }, error: { status: 503 } });
    await expect(readUser()).rejects.toThrow("Không kiểm tra được phiên");
  });
  it("exchanges the PKCE code and redirects only to the app's login page", async () => {
    mock.exchangeCodeForSession.mockResolvedValue({ error: null });
    const response = await handleAuthCallback(
      new Request("https://app.example/auth/callback?code=test-code&next=https://evil.example"),
    );
    expect(mock.exchangeCodeForSession).toHaveBeenCalledWith("test-code");
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://app.example/login?confirmation=success");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });
  it("handles missing/expired codes without exposing them or reporting success", async () => {
    const missing = await handleAuthCallback(new Request("https://app.example/auth/callback"));
    expect(mock.exchangeCodeForSession).not.toHaveBeenCalled();
    expect(missing.headers.get("location")).toBe("https://app.example/login?confirmation=error");
    mock.exchangeCodeForSession.mockResolvedValue({ error: { message: "expired code" } });
    const expired = await handleAuthCallback(
      new Request("https://app.example/auth/callback?code=expired"),
    );
    expect(expired.headers.get("location")).toBe("https://app.example/login?confirmation=error");
  });
});
