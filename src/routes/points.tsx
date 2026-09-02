import { createFileRoute, Link } from "@tanstack/react-router";
import { InputDayPicker } from "@/atomic/molecules/InputDayPicker";
import { useState, useMemo } from "react";
import { useDeletePoint, usePointsByDate } from "@/hooks/usePoints";
import { addDays, format, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowLeft,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Trash2,
} from "lucide-react";
import { CreatePointModal } from "@/atomic/organims/CreatePointModal";
import { formatMsToHHMM } from "@/utils/formatMsToHHMM";

export const Route = createFileRoute("/points")({
  component: RouteComponent,
});

function RouteComponent() {
  const [date, setDate] = useState(new Date());
  const [visibleCreatePointModal, setVisibleCreatePointModal] = useState(false);

  const formattedDateKey = format(date, "yyyy-MM-dd");

  const { data: points, isPending: isLoadingPoints } = usePointsByDate({
    date: formattedDateKey,
  });

  const {
    mutate: deletePoint,
    isPending: isDeletingPoint,
    variables: deletingVars,
  } = useDeletePoint();

  const totalMilliseconds = useMemo(() => {
    if (!points || points.length === 0) return 0;

    let total = 0;
    let i = 0;
    while (i < points.length - 1) {
      total +=
        new Date(points[i + 1].timestamp).getTime() -
        new Date(points[i].timestamp).getTime();
      i += 2;
    }

    if (points.length % 2 === 1 && isToday(date)) {
      total +=
        new Date().getTime() -
        new Date(points[points.length - 1].timestamp).getTime();
    }

    return total;
  }, [points, date]);

  const totalFormattedHHMM = formatMsToHHMM(totalMilliseconds);
  const hourlyRate = parseInt(import.meta.env.VITE_VALOR_POR_HORA || "0");
  const valorDia = (totalMilliseconds / 3600000) * hourlyRate;

  return (
    <div className="flex flex-col flex-1 gap-5 pb-6 animate-in fade-in duration-300">
      {/* Header */}
      <header className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800/80 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all active:scale-95 shadow-sm"
            title="Voltar ao início"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-tight text-white">
              Pontos por Dia
            </h1>
            <p className="text-xs text-zinc-400 capitalize">
              {format(date, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
        </div>

        <button
          onClick={() => setVisibleCreatePointModal(true)}
          className="p-2.5 rounded-xl bg-violet-600/90 hover:bg-violet-600 text-white transition-all active:scale-95 shadow-md shadow-violet-600/20 cursor-pointer flex items-center gap-2 text-xs font-semibold"
          title="Adicionar Registro Manual"
        >
          <CalendarPlus className="w-4 h-4" />
          <span className="hidden sm:inline">Novo Ponto</span>
        </button>
      </header>

      {/* Date Navigator */}
      <section className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 backdrop-blur-sm shadow-sm">
        <button
          onClick={() => setDate(d => addDays(d, -1))}
          className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
          title="Dia anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <InputDayPicker value={date} onChange={setDate} />
          {!isToday(date) && (
            <button
              onClick={() => setDate(new Date())}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors font-medium cursor-pointer"
            >
              Hoje
            </button>
          )}
        </div>

        <button
          onClick={() => setDate(d => addDays(d, 1))}
          className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
          title="Próximo dia"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </section>

      {/* Day Summary Card */}
      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-zinc-900/70 border border-zinc-800/80 p-4 shadow-sm backdrop-blur-sm">
          <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">
            Total do Dia
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {totalFormattedHHMM}
          </div>
        </div>

        <div className="rounded-2xl bg-zinc-900/70 border border-zinc-800/80 p-4 shadow-sm backdrop-blur-sm">
          <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">
            Ganhos do Dia
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {hourlyRate > 0
              ? new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(valorDia)
              : "--"}
          </div>
        </div>
      </section>

      {/* Modal */}
      <CreatePointModal
        fixedDate={date}
        visible={visibleCreatePointModal}
        onClose={() => setVisibleCreatePointModal(false)}
      />

      {/* Point List */}
      <section className="flex flex-col flex-1 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 p-5 shadow-sm backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-zinc-200">
            Horários Registrados
          </h2>
          <span className="text-xs text-zinc-400 font-mono">
            {points?.length ?? 0} {points?.length === 1 ? "batida" : "batidas"}
          </span>
        </div>

        {isLoadingPoints ? (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-500 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-xs">Buscando horários...</span>
          </div>
        ) : points && points.length > 0 ? (
          <div className="flex flex-col divide-y divide-zinc-800/60 overflow-y-auto max-h-80 pr-1">
            {points.map((point, index) => {
              const isEntry = index % 2 === 0;
              const isThisDeleting =
                isDeletingPoint && deletingVars?.id === point.id;
              return (
                <div
                  key={point.id}
                  className="flex items-center justify-between py-3 px-1 group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                        isEntry
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}
                    >
                      {isEntry ? "E" : "S"}
                    </div>
                    <div>
                      <div className="font-mono text-base font-semibold text-zinc-100">
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
                    className="p-2 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer disabled:opacity-50"
                    title="Excluir batida"
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
          <div className="flex flex-col items-center justify-center py-12 text-zinc-500 text-center">
            <Clock className="w-8 h-8 stroke-1 text-zinc-600 mb-2" />
            <p className="text-xs">Nenhum ponto registrado nesta data.</p>
            <button
              onClick={() => setVisibleCreatePointModal(true)}
              className="mt-3 text-xs text-violet-400 hover:text-violet-300 font-semibold cursor-pointer underline underline-offset-4"
            >
              + Adicionar ponto manualmente
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
