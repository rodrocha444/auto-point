import { Outlet, createRootRoute } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

export const Route = createRootRoute({
  component: RootComponent,
});

const queryClient = new QueryClient();

function RootComponent() {
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <Outlet />
        <TanStackRouterDevtools />
      </QueryClientProvider>
    </>
  );
}
