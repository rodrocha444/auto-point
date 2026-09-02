import {
  useCreatePoint,
  useDeletePoint,
  usePointsByDate,
  useTotalMsInMonth,
} from "@/hooks/usePoints";
import { formatMsToHHMM } from "@/utils/formatMsToHHMM";
import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BarChart3,
  CalendarDays,
  Clock,
  Fingerprint,
  Loader2,
  Square,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const today = format(currentTime, "yyyy-MM-dd");

  const { data: todayPoints, isPending: isLoadingPoints } = usePointsByDate({
    date: today,
  });

  const { data: totalMsInMonth } = useTotalMsInMonth({
    date: today,
  });

  const { mutate: createPoint, isPending: isCreatingPoint } = useCreatePoint();
  const {
    mutate: deletePoint,
    isPending: isDeletingPoint,
    variables: deletingVars,
  } = useDeletePoint();

  const isWorking = (todayPoints?.length ?? 0) % 2 === 1;

  const totalMilliseconds = useMemo(() => {
    const points = todayPoints;
    if (!points || points.length === 0) return 0;

    let total = 0;
    let i = 0;
    while (i < points.length - 1) {
      total +=
        new Date(points[i + 1].timestamp).getTime() -
        new Date(points[i].timestamp).getTime();
      i += 2;
    }

    if (points.length % 2 === 1) {
      total +=
        currentTime.getTime() -
        new Date(points[points.length - 1].timestamp).getTime();
    }

    return total;
  }, [todayPoints, currentTime]);

  const totalFormattedHHMM = formatMsToHHMM(totalMilliseconds);

  const hourlyRate = parseInt(import.meta.env.VITE_VALOR_POR_HORA || "0");

  const valorAReceberHoje = (totalMilliseconds / 3600000) * hourlyRate;

  const totalAReceberMes =
    totalMsInMonth?.milliseconds &&
    (totalMsInMonth?.milliseconds / 3600000) * hourlyRate;

  const formattedDate = format(currentTime, "EEEE, d 'de' MMMM", {
    locale: ptBR,
  });

  return (
    <div className="flex flex-col flex-1 gap-6 pb-6 animate-in fade-in duration-300">
      {/* Header */}
      <header className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-md shadow-violet-500/20">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-tight text-white">
              Auto Point
            </h1>
            <p className="text-xs text-zinc-400 capitalize">{formattedDate}</p>
          </div>
        </div>

        <nav className="flex items-center gap-2">
          <Link
            to="/points"
            className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800/80 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all active:scale-95 shadow-sm"
            title="Histórico de Pontos"
          >
            <CalendarDays className="w-5 h-5" />
          </Link>
          <Link
            to="/stats"
            className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800/80 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all active:scale-95 shadow-sm"
            title="Relatórios e Estatísticas"
          >
            <BarChart3 className="w-5 h-5" />
          </Link>
        </nav>
      </header>

      {/* Main Clock & Punch Widget */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 border border-zinc-800/80 p-6 flex flex-col items-center shadow-xl backdrop-blur-md">
        {/* Glow ambient background */}
        <div
          className={`absolute -top-24 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none transition-colors duration-700 ${
            isWorking ? "bg-emerald-500" : "bg-violet-600"
          }`}
        />

        {/* Live Status Pill */}
        <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800/80 border border-zinc-700/50 text-xs font-medium backdrop-blur-md shadow-sm">
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isWorking
                  ? "bg-emerald-400"
                  : todayPoints && todayPoints.length > 0
                    ? "bg-amber-400"
                    : "bg-zinc-400"
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isWorking
                  ? "bg-emerald-500"
                  : todayPoints && todayPoints.length > 0
                    ? "bg-amber-500"
                    : "bg-zinc-500"
              }`}
            />
          </span>
          <span
            className={
              isWorking
                ? "text-emerald-400 font-semibold"
                : todayPoints && todayPoints.length > 0
                  ? "text-amber-400 font-semibold"
                  : "text-zinc-400"
            }
          >
            {isWorking
              ? "Trabalhando"
              : todayPoints && todayPoints.length > 0
                ? "Em pausa / Encerrado"
                : "Dia não iniciado"}
          </span>
        </div>

        {/* Live Clock Display */}
        <div className="text-5xl font-mono font-bold tracking-tight text-white mb-2 tabular-nums drop-shadow-sm">
          {format(currentTime, "HH:mm:ss")}
        </div>

        <div className="text-xs text-zinc-400 font-medium mb-6">
          Total acumulado hoje:{" "}
          <span className="text-zinc-200 font-mono font-semibold">
            {totalFormattedHHMM}
          </span>
        </div>

        {/* Punch Button */}
        <button
          onClick={() => createPoint({ timestamp: new Date() })}
          disabled={isCreatingPoint}
          className={`w-full py-4 px-6 rounded-2xl font-semibold text-base flex items-center justify-center gap-3 transition-all duration-200 active:scale-[0.98] shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
            isWorking
              ? "bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white shadow-amber-900/30"
              : "bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-700 hover:from-violet-500 hover:via-indigo-500 hover:to-violet-600 text-white shadow-violet-900/30"
          }`}
        >
          {isCreatingPoint ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Registrando...</span>
            </>
          ) : isWorking ? (
            <>
              <Square className="w-5 h-5 fill-current" />
              <span>Bater Ponto (Pausar / Saída)</span>
            </>
          ) : (
            <>
              <Fingerprint className="w-5 h-5" />
              <span>Bater Ponto (Entrada)</span>
            </>
          )}
        </button>
      </section>

      {/* Metric Cards Grid */}
      <section className="grid grid-cols-2 gap-3">
        {/* Card Hoje */}
        <div className="rounded-2xl bg-zinc-900/70 border border-zinc-800/80 p-4 flex flex-col justify-between shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">
              Hoje
            </span>
            <Clock className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white font-mono tracking-tight">
              {totalFormattedHHMM}
            </div>
            {hourlyRate > 0 && (
              <div className="text-xs font-medium text-emerald-400 mt-1">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(valorAReceberHoje)}
              </div>
            )}
          </div>
        </div>

        {/* Card Mês */}
        <div className="rounded-2xl bg-zinc-900/70 border border-zinc-800/80 p-4 flex flex-col justify-between shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">
              Este Mês
            </span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white font-mono tracking-tight">
              {totalMsInMonth?.milliseconds
                ? formatMsToHHMM(totalMsInMonth.milliseconds)
                : "00:00"}
            </div>
            {hourlyRate > 0 && totalAReceberMes !== undefined && (
              <div className="text-xs font-medium text-emerald-400 mt-1">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(totalAReceberMes)}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Today's Timeline */}
      <section className="flex flex-col flex-1 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 p-5 shadow-sm backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-zinc-200">
            Registros de Hoje
          </h2>
          <span className="text-xs text-zinc-400 font-mono">
            {todayPoints?.length ?? 0}{" "}
            {todayPoints?.length === 1 ? "registro" : "registros"}
          </span>
        </div>

        {isLoadingPoints ? (
          <div className="flex flex-col items-center justify-center py-8 text-zinc-500 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-xs">Carregando horários...</span>
          </div>
        ) : todayPoints && todayPoints.length > 0 ? (
          <div className="flex flex-col divide-y divide-zinc-800/60 overflow-y-auto max-h-60 pr-1">
            {todayPoints.map((point, index) => {
              const isEntry = index % 2 === 0;
              const isThisDeleting =
                isDeletingPoint && deletingVars?.id === point.id;
              return (
                <div
                  key={point.id}
                  className="flex items-center justify-between py-2.5 px-1 group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold ${
                        isEntry
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}
                    >
                      {isEntry ? "E" : "S"}
                    </div>
                    <div>
                      <div className="font-mono text-sm font-medium text-zinc-100">
                        {format(new Date(point.timestamp), "HH:mm:ss")}
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        {isEntry ? "Entrada" : "Saída"} #{Math.floor(index / 2) + 1}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => deletePoint({ id: point.id })}
                    disabled={isDeletingPoint}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer disabled:opacity-50"
                    title="Excluir ponto"
                  >
                    {isThisDeleting ? (
                      <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-zinc-500 text-center">
            <Clock className="w-8 h-8 stroke-1 text-zinc-600 mb-2" />
            <p className="text-xs">Nenhum ponto registrado hoje.</p>
            <p className="text-[11px] text-zinc-600 mt-0.5">
              Clique em "Bater Ponto" para iniciar seu dia.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
