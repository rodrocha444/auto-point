import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import eruda from "eruda";
import { useEffect } from "react";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  useEffect(() => {
    if (import.meta.env.DEV) {
      eruda.init();
      return () => {
        eruda.destroy();
      };
    }
  }, []);

  return (
    <main className="bg-gray-950 h-dvh">
      <Outlet />
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </main>
  );
}
