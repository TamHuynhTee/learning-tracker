import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
function matchesFor(path: string) {
  const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
  return router.matchRoutes(path);
}

describe("App routing", () => {
  it("matches a page for / instead of falling back to not found", () => {
    const matches = matchesFor("/");
    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });

  it("matches the login page at /login", () => {
    const matches = matchesFor("/login");
    expect(matches.at(-1)?.routeId).toBe("/login");
  });

  it("matches the resources list at /resources", () => {
    const matches = matchesFor("/resources");
    expect(matches.at(-1)?.routeId).toBe("/resources/");
  });

  it("matches the create page at /resources/new", () => {
    const matches = matchesFor("/resources/new");
    expect(matches.at(-1)?.routeId).toBe("/resources/new");
  });

  it("matches the detail page for a sample resource id at /resources/$resourceId", () => {
    const matches = matchesFor("/resources/r1");
    expect(matches.at(-1)?.routeId).toBe("/resources/$resourceId");
  });
});
