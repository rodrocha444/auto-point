import { Outlet, createRootRoute, Link } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
      <h2 className="text-xl font-bold text-white">Página não encontrada</h2>
      <p className="text-sm text-zinc-400">
        A rota acessada não existe ou mudou de endereço.
      </p>
      <Link
        to="/"
        className="px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-500 transition-colors"
      >
        Voltar ao Início
      </Link>
    </div>
  ),
});

function RootComponent() {
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const isBusy = isFetching > 0 || isMutating > 0;

  useEffect(() => {
    if (import.meta.env.DEV) {
      import("eruda").then((erudaModule) => {
        erudaModule.default.init();
      });
    }
  }, []);

  return (
    <main className="min-h-dvh bg-gradient-to-b from-zinc-950 via-zinc-900 to-black text-zinc-100 flex flex-col items-center selection:bg-violet-500/30 selection:text-violet-200 font-sans">
      {/* Top Loading Bar for DB Operations */}
      <div
        className={`fixed top-0 left-0 right-0 h-1 z-50 transition-opacity duration-300 ${
          isBusy ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="h-full bg-gradient-to-r from-violet-500 via-indigo-400 to-emerald-400 animate-pulse" />
      </div>

      {/* Floating Sync Status Pill */}
      {isBusy && (
        <div className="fixed safe-top right-3 z-40 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900/90 border border-zinc-700/80 text-[11px] font-medium text-zinc-300 backdrop-blur-md shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          <Loader2 className="w-3 h-3 animate-spin text-violet-400" />
          <span>{isMutating > 0 ? "Salvando no Turso..." : "Sincronizando..."}</span>
        </div>
      )}

      <div className="w-full max-w-md min-h-dvh flex flex-col flex-1 relative safe-px safe-pt safe-pb">
        <Outlet />
      </div>
      {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}
    </main>
  );
}
