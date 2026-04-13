import { Outlet, createRootRoute } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import eruda from "eruda";
import { useEffect } from "react";

export const Route = createRootRoute({
  component: RootComponent,
});

const queryClient = new QueryClient();

function RootComponent() {
  useEffect(() => {
    eruda.init();

    return () => {
      eruda.destroy();
    };
  }, []);

  return (
    <main className="bg-gray-950 h-dvh">
      <QueryClientProvider client={queryClient}>
        <Outlet />
        <TanStackRouterDevtools />
      </QueryClientProvider>
    </main>
  );
}
