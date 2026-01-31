import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Componente } from "./Componente";

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Componente />
    </QueryClientProvider>
  );
}
