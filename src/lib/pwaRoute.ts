import { getToolRoute, tools } from "../tools/registry";

export const LAST_TOOL_ROUTE_STORAGE_KEY = "unwrapped-last-tool-route";

const TOOL_ROUTES = tools.map((tool) => getToolRoute(tool.slug));

export function getRestorableToolRoute(pathname: string | null | undefined): string | null {
  return typeof pathname === "string" &&
    TOOL_ROUTES.includes(pathname as (typeof TOOL_ROUTES)[number])
    ? pathname
    : null;
}

export function getStandaloneRouteRecovery(
  pathname: string,
  storedPathname: string | null | undefined,
  isStandalone: boolean
): string | null {
  if (!isStandalone || pathname !== "/") {
    return null;
  }

  return getRestorableToolRoute(storedPathname);
}

export function shouldPersistToolRoute(pathname: string): boolean {
  return getRestorableToolRoute(pathname) !== null;
}

export function getPwaRouteBootstrapScript(): string {
  return `(function () {
  try {
    const storageKey = ${JSON.stringify(LAST_TOOL_ROUTE_STORAGE_KEY)};
    const validRoutes = ${JSON.stringify(TOOL_ROUTES)};
    const persistRoute = () => {
      const pathname = window.location.pathname;
      if (validRoutes.includes(pathname)) {
        localStorage.setItem(storageKey, pathname);
        return true;
      }

      return false;
    };

    const restoreRoute = () => {
      const pathname = window.location.pathname;
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true;

      if (pathname !== "/" || !isStandalone) {
        return;
      }

      const storedPathname = localStorage.getItem(storageKey);
      if (validRoutes.includes(storedPathname)) {
        window.location.replace(storedPathname);
      }
    };

    if (!persistRoute()) {
      restoreRoute();
    }

    document.addEventListener("astro:page-load", persistRoute);
  } catch {
    // Ignore storage and browser capability failures during bootstrap.
  }
})();`;
}
