import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { routeTree } from "./routeTree.gen";
import { Theme } from "@radix-ui/themes";

import "@radix-ui/themes/styles.css";

const queryClient = new QueryClient();

const router = createRouter({
  routeTree,
  basepath: import.meta.env.BASE_URL,
  defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <Theme appearance="dark" accentColor="violet" grayColor="slate" radius="large">
          <RouterProvider router={router} />
        </Theme>
      </QueryClientProvider>
    </StrictMode>,
  );
}
