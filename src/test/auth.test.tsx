import { act, fireEvent, render, screen, waitFor, cleanup } from "@testing-library/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { I18nextProvider } from "react-i18next";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAppI18n } from "@/lib/i18n";
import { Route as loginRoute } from "@/routes/login";
import { Route as registerRoute } from "@/routes/register";
import { AuthProvider } from "@/components/auth-provider";
import { useAuth } from "@/hooks/use-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast } from "sonner";

const auth = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  onAuthStateChange: vi.fn(),
}));
vi.mock("@/lib/supabase", () => ({ getSupabase: () => ({ auth }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));

afterEach(cleanup);
beforeEach(() => vi.clearAllMocks());

async function renderAuthPage(path: "/login" | "/register") {
  const root = createRootRoute({ component: Outlet });
  const login = createRoute({
    getParentRoute: () => root,
    path: "/login",
    component: loginRoute.options.component!,
  });
  const register = createRoute({
    getParentRoute: () => root,
    path: "/register",
    component: registerRoute.options.component!,
  });
  const resources = createRoute({
    getParentRoute: () => root,
    path: "/resources",
    component: () => <p>Resource destination</p>,
  });
  const router = createRouter({
    routeTree: root.addChildren([login, register, resources]),
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  await router.load();
  render(
    <I18nextProvider i18n={createAppI18n()}>
      <RouterProvider router={router} />
    </I18nextProvider>,
  );
  await screen.findByLabelText("Email");
  return router;
}

function fillCredentials() {
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "learner@example.com" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password-123" } });
}

describe("Supabase authentication", () => {
  it("validates login fields before contacting Supabase", async () => {
    await renderAuthPage("/login");
    fireEvent.submit(screen.getByLabelText("Email").closest("form")!);
    expect(await screen.findByText("Please enter a valid email address.")).toBeInTheDocument();
    expect(screen.getByText("Please enter your password.")).toBeInTheDocument();
    expect(auth.signInWithPassword).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
  });

  it("validates matching passwords before signup and allows correcting the form", async () => {
    auth.signUp.mockResolvedValue({ data: { session: null }, error: null });
    const router = await renderAuthPage("/register");
    fillCredentials();
    fireEvent.change(document.getElementById("confirm-password")!, {
      target: { value: "different-password" },
    });
    fireEvent.submit(screen.getByLabelText("Email").closest("form")!);
    expect(await screen.findByText("The passwords do not match.")).toBeInTheDocument();
    expect(auth.signUp).not.toHaveBeenCalled();
    fireEvent.change(document.getElementById("confirm-password")!, {
      target: { value: "password-123" },
    });
    fireEvent.submit(screen.getByLabelText("Email").closest("form")!);
    await waitFor(() => expect(router.state.location.pathname).toBe("/login"));
    expect(auth.signUp).toHaveBeenCalledOnce();
  });

  it("disables submission while login is pending and enables retry after failure", async () => {
    let complete: (value: unknown) => void = () => {};
    auth.signInWithPassword.mockImplementation(
      () =>
        new Promise((resolve) => {
          complete = resolve;
        }),
    );
    await renderAuthPage("/login");
    fillCredentials();
    fireEvent.submit(screen.getByLabelText("Email").closest("form")!);
    expect(await screen.findByRole("button", { name: "Signing in…" })).toBeDisabled();
    await act(async () => complete({ error: { code: "invalid_credentials" } }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Incorrect email or password.");
    expect(screen.getByRole("button", { name: "Sign in" })).toBeEnabled();
    expect(screen.getByLabelText("Password")).toHaveValue("password-123");
  });

  it("keeps the user on login and reports rejected credentials", async () => {
    auth.signInWithPassword.mockResolvedValue({ error: { code: "invalid_credentials" } });
    const router = await renderAuthPage("/login");
    fillCredentials();
    fireEvent.submit(screen.getByLabelText("Email").closest("form")!);
    expect(await screen.findByRole("alert")).toHaveTextContent("Incorrect email or password.");
    expect(router.state.location.pathname).toBe("/login");
  });

  it("navigates only after successful password authentication", async () => {
    auth.signInWithPassword.mockResolvedValue({ error: null });
    await renderAuthPage("/login");
    fillCredentials();
    fireEvent.submit(screen.getByLabelText("Email").closest("form")!);
    expect(await screen.findByText("Resource destination")).toBeInTheDocument();
    expect(auth.signInWithPassword).toHaveBeenCalledWith({
      email: "learner@example.com",
      password: "password-123",
    });
  });

  it("redirects to login and preserves the email-confirmation reminder after signup", async () => {
    auth.signUp.mockResolvedValue({ data: { session: null }, error: null });
    const router = await renderAuthPage("/register");
    fillCredentials();
    fireEvent.change(document.getElementById("confirm-password")!, {
      target: { value: "password-123" },
    });
    fireEvent.submit(screen.getByLabelText("Email").closest("form")!);
    await waitFor(() => expect(router.state.location.pathname).toBe("/login"));
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining("confirmation email"), {
      duration: 10000,
    });
    expect(auth.signUp).toHaveBeenCalledWith({
      email: "learner@example.com",
      password: "password-123",
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    expect(screen.getByLabelText("Password")).toHaveValue("");
  });

  it("also redirects to login when signup immediately returns a session", async () => {
    auth.signUp.mockResolvedValue({ data: { session: { user: { id: "user-a" } } }, error: null });
    const router = await renderAuthPage("/register");
    fillCredentials();
    fireEvent.change(document.getElementById("confirm-password")!, {
      target: { value: "password-123" },
    });
    fireEvent.submit(screen.getByLabelText("Email").closest("form")!);
    await waitFor(() => expect(router.state.location.pathname).toBe("/login"));
    expect(toast.success).toHaveBeenCalledWith("Account created successfully!", {
      duration: 10000,
    });
  });

  it("stays on register when Supabase rejects signup", async () => {
    auth.signUp.mockResolvedValue({ data: { session: null }, error: { code: "weak_password" } });
    const router = await renderAuthPage("/register");
    fillCredentials();
    fireEvent.change(document.getElementById("confirm-password")!, {
      target: { value: "password-123" },
    });
    fireEvent.submit(screen.getByLabelText("Email").closest("form")!);
    expect(await screen.findByRole("alert")).toHaveTextContent("security requirements");
    expect(router.state.location.pathname).toBe("/register");
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("restores the browser session, reacts to logout and unsubscribes on unmount", async () => {
    let listener: (event: string, session: unknown) => void = () => {};
    const unsubscribe = vi.fn();
    auth.onAuthStateChange.mockImplementation((callback) => {
      listener = callback;
      return { data: { subscription: { unsubscribe } } };
    });
    function SessionView() {
      const { user, loading } = useAuth();
      return <p>{loading ? "Loading" : (user?.email ?? "Signed out")}</p>;
    }
    const queryClient = new QueryClient();
    const view = render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SessionView />
        </AuthProvider>
      </QueryClientProvider>,
    );
    expect(screen.getByText("Loading")).toBeInTheDocument();
    act(() =>
      listener("INITIAL_SESSION", { user: { id: "user-a", email: "learner@example.com" } }),
    );
    await waitFor(() => expect(screen.getByText("learner@example.com")).toBeInTheDocument());
    queryClient.setQueryData(["resources", "user-a"], [{ title: "Private resource" }]);
    act(() => listener("SIGNED_OUT", null));
    expect(queryClient.getQueryData(["resources", "user-a"])).toBeUndefined();
    expect(screen.getByText("Signed out")).toBeInTheDocument();
    view.unmount();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });
});
