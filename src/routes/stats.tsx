import { InputDayPicker } from "@/atomic/molecules/InputDayPicker";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import {
  differenceInDays,
  format,
  startOfMonth,
  subDays,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useMemo } from "react";
import { formatMsToHHMM } from "@/utils/formatMsToHHMM";
import { useDeletePoint, usePointsInInterval } from "@/hooks/usePoints";
import {
  ArrowLeft,
  BarChart3,
  CalendarPlus,
  Clock,
  Loader2,
  Printer,
  Search,
  Trash2,
  Wallet,
} from "lucide-react";
import { CreatePointModal } from "@/atomic/organims/CreatePointModal";

export const Route = createFileRoute("/stats")({
  component: RouteComponent,
});

const datesSchema = z
  .object({
    startDate: z.date(),
    endDate: z.date(),
  })
  .superRefine(({ startDate, endDate }, ctx) => {
    if (!startDate || !endDate) return;

    if (endDate < startDate) {
      ctx.addIssue({
        code: "custom",
        message: "A data final deve ser posterior à data inicial.",
        path: ["endDate"],
      });
      return;
    }

    const days = differenceInDays(endDate, startDate);

    if (days > 90) {
      ctx.addIssue({
        code: "custom",
        message: `Máximo de 90 dias no intervalo. (Selecionado: ${days})`,
        path: ["endDate"],
      });
    }
  });

type DateSchema = z.infer<typeof datesSchema>;

function RouteComponent() {
  const [visibleCreatePointModal, setVisibleCreatePointModal] = useState(false);
  const {
    mutate: deletePoint,
    isPending: isDeletingPoint,
    variables: deletingVars,
  } = useDeletePoint();

  const [filterDates, setFilterDates] = useState<DateSchema>(() => ({
    startDate: startOfMonth(new Date()),
    endDate: new Date(),
  }));

  const { data: totalMsData, isPending: isLoadingStats } = usePointsInInterval(
    {
      startDate: format(filterDates.startDate, "yyyy-MM-dd"),
      endDate: format(filterDates.endDate, "yyyy-MM-dd"),
    },
    { enabled: !!filterDates.startDate && !!filterDates.endDate },
  );

  const { Field, handleSubmit, setFieldValue } = useForm({
    validators: { onChange: datesSchema },
    defaultValues: filterDates,
    onSubmit: async ({ value }) => setFilterDates(value),
  });

  const hourlyRate = parseInt(import.meta.env.VITE_VALOR_POR_HORA || "0");

  const totalAReceber =
    totalMsData?.milliseconds &&
    (totalMsData?.milliseconds / 3600000) * hourlyRate;

  // Group points by date (yyyy-MM-dd)
  const groupedPoints = useMemo(() => {
    if (!totalMsData?.points) return [];
    const map = new Map<string, typeof totalMsData.points>();

    for (const point of totalMsData.points) {
      const dayKey = format(new Date(point.timestamp), "yyyy-MM-dd");
      if (!map.has(dayKey)) {
        map.set(dayKey, []);
      }
      map.get(dayKey)!.push(point);
    }

    return Array.from(map.entries()).sort(
      ([a], [b]) => new Date(b).getTime() - new Date(a).getTime(),
    );
  }, [totalMsData]);

  const applyPreset = (start: Date, end: Date) => {
    setFieldValue("startDate", start);
    setFieldValue("endDate", end);
    setFilterDates({ startDate: start, endDate: end });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col flex-1 gap-5 pb-6 animate-in fade-in duration-300">
      {/* Header (hidden in print) */}
      <header className="flex items-center justify-between pt-2 print:hidden">
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
              Relatórios e Estatísticas
            </h1>
            <p className="text-xs text-zinc-400">Consolidado por período</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800/80 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all active:scale-95 shadow-sm cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            title="Imprimir Folha de Ponto"
          >
            <Printer className="w-4 h-4 text-violet-400" />
            <span className="hidden sm:inline">Imprimir</span>
          </button>

          <button
            onClick={() => setVisibleCreatePointModal(true)}
            className="p-2.5 rounded-xl bg-violet-600/90 hover:bg-violet-600 text-white transition-all active:scale-95 shadow-md shadow-violet-600/20 cursor-pointer flex items-center gap-2 text-xs font-semibold"
            title="Adicionar Registro Manual"
          >
            <CalendarPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo Ponto</span>
          </button>
        </div>
      </header>

      {/* Filter Section (hidden in print) */}
      <section className="rounded-3xl bg-zinc-900/70 border border-zinc-800/80 p-4 shadow-sm backdrop-blur-sm flex flex-col gap-3 print:hidden">
        {/* Quick Presets */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => applyPreset(startOfMonth(new Date()), new Date())}
            className="px-3 py-1.5 rounded-xl bg-zinc-800/90 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors cursor-pointer whitespace-nowrap font-medium"
          >
            Este Mês
          </button>
          <button
            type="button"
            onClick={() => applyPreset(subDays(new Date(), 7), new Date())}
            className="px-3 py-1.5 rounded-xl bg-zinc-800/90 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors cursor-pointer whitespace-nowrap font-medium"
          >
            Últimos 7 dias
          </button>
          <button
            type="button"
            onClick={() => applyPreset(subDays(new Date(), 30), new Date())}
            className="px-3 py-1.5 rounded-xl bg-zinc-800/90 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors cursor-pointer whitespace-nowrap font-medium"
          >
            Últimos 30 dias
          </button>
        </div>

        {/* Date Pickers */}
        <div className="grid grid-cols-2 gap-2.5 items-end">
          <Field name="startDate">
            {({ state, handleChange }) => (
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                  Início
                </label>
                <InputDayPicker value={state.value} onChange={handleChange} />
                {state.meta.errors.length > 0 && (
                  <span className="text-[10px] text-rose-400">
                    {state.meta.errors[0]?.message || state.meta.errors.join(", ")}
                  </span>
                )}
              </div>
            )}
          </Field>

          <Field name="endDate">
            {({ state, handleChange }) => (
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                  Fim
                </label>
                <InputDayPicker value={state.value} onChange={handleChange} />
                {state.meta.errors.length > 0 && (
                  <span className="text-[10px] text-rose-400">
                    {state.meta.errors[0]?.message || state.meta.errors.join(", ")}
                  </span>
                )}
              </div>
            )}
          </Field>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full mt-1 py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-white font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Search className="w-4 h-4" />
          <span>Filtrar Período</span>
        </button>
      </section>

      {/* Summary Stat Cards (hidden in print) */}
      <section className="grid grid-cols-2 gap-3 print:hidden">
        <div className="rounded-2xl bg-zinc-900/70 border border-zinc-800/80 p-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">
              Total Horas
            </span>
            <Clock className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {totalMsData?.milliseconds
              ? formatMsToHHMM(totalMsData.milliseconds)
              : "00:00"}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            {groupedPoints.length} {groupedPoints.length === 1 ? "dia trabalhado" : "dias trabalhados"}
          </div>
        </div>

        <div className="rounded-2xl bg-zinc-900/70 border border-zinc-800/80 p-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">
              Ganhos Estimados
            </span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {hourlyRate > 0 && totalAReceber !== undefined
              ? new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(totalAReceber)
              : "--"}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            Taxa: {hourlyRate > 0 ? `R$ ${hourlyRate}/h` : "Não definida"}
          </div>
        </div>
      </section>

      {/* Modal */}
      <CreatePointModal
        visible={visibleCreatePointModal}
        onClose={() => setVisibleCreatePointModal(false)}
      />

      {/* Grouped Points by Day (Screen version) */}
      <section className="flex flex-col flex-1 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 p-5 shadow-sm backdrop-blur-sm print:hidden">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-zinc-200">
            Histórico Detalhado
          </h2>
          <span className="text-xs text-zinc-400 font-mono">
            {totalMsData?.points?.length ?? 0} batidas
          </span>
        </div>

        {isLoadingStats ? (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-500 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-xs">Calculando estatísticas...</span>
          </div>
        ) : groupedPoints.length > 0 ? (
          <div className="flex flex-col gap-4 overflow-y-auto max-h-80 pr-1">
            {groupedPoints.map(([dayKey, dayPoints]) => (
              <div
                key={dayKey}
                className="rounded-2xl bg-zinc-950/60 border border-zinc-800/60 p-3.5 flex flex-col gap-2.5"
              >
                <div className="flex items-center justify-between text-xs font-medium border-b border-zinc-800/50 pb-2">
                  <span className="text-zinc-200 capitalize">
                    {format(new Date(`${dayKey}T00:00:00`), "EEEE, dd 'de' MMMM", {
                      locale: ptBR,
                    })}
                  </span>
                  <span className="text-zinc-400 font-mono">
                    {dayPoints.length} {dayPoints.length === 1 ? "registro" : "registros"}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {dayPoints.map((point, index) => {
                    const isEntry = index % 2 === 0;
                    const isThisDeleting =
                      isDeletingPoint && deletingVars?.id === point.id;
                    return (
                      <div
                        key={point.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 font-mono group"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isEntry ? "bg-emerald-400" : "bg-rose-400"
                          }`}
                        />
                        <span>{format(new Date(point.timestamp), "HH:mm")}</span>
                        <button
                          onClick={() => deletePoint({ id: point.id })}
                          disabled={isDeletingPoint}
                          className="ml-1 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer disabled:opacity-50"
                          title="Excluir"
                        >
                          {isThisDeleting ? (
                            <Loader2 className="w-3 h-3 animate-spin text-rose-400" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-500 text-center">
            <BarChart3 className="w-8 h-8 stroke-1 text-zinc-600 mb-2" />
            <p className="text-xs">Nenhum ponto encontrado para o período selecionado.</p>
          </div>
        )}
      </section>

      {/* Printable Sheet (exclusively rendered for print/PDF) */}
      <div className="hidden print:block w-full text-black font-sans text-xs">
        <div className="border-b border-black pb-2 mb-3">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-base font-bold uppercase tracking-wide text-black">
                Folha de Registro de Ponto
              </h1>
              <p className="text-[11px] text-zinc-700">
                Período:{" "}
                <strong>
                  {format(filterDates.startDate, "dd/MM/yyyy")} até{" "}
                  {format(filterDates.endDate, "dd/MM/yyyy")}
                </strong>
              </p>
            </div>
            <div className="text-right text-[10px] text-zinc-600 leading-tight">
              <p className="font-semibold">Auto Point</p>
              <p>Emissão: {format(new Date(), "dd/MM/yyyy HH:mm")}</p>
            </div>
          </div>
        </div>

        {/* Print Summary Metrics (Compact) */}
        <div className="grid grid-cols-3 gap-2 mb-3 border border-zinc-400 p-2 rounded bg-zinc-50 text-[11px]">
          <div>
            <span className="text-[9px] uppercase text-zinc-600 font-semibold block leading-none mb-0.5">
              Total de Horas
            </span>
            <span className="text-sm font-bold font-mono">
              {totalMsData?.milliseconds ? formatMsToHHMM(totalMsData.milliseconds) : "00:00"}
            </span>
          </div>
          <div>
            <span className="text-[9px] uppercase text-zinc-600 font-semibold block leading-none mb-0.5">
              Dias Trabalhados
            </span>
            <span className="text-sm font-bold font-mono">{groupedPoints.length} dias</span>
          </div>
          {hourlyRate > 0 && (
            <div>
              <span className="text-[9px] uppercase text-zinc-600 font-semibold block leading-none mb-0.5">
                Total Estimado
              </span>
              <span className="text-sm font-bold font-mono text-zinc-900">
                {totalAReceber !== undefined
                  ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalAReceber)
                  : "--"}
              </span>
            </div>
          )}
        </div>

        {/* Print Timesheet Table (Compact) */}
        <table className="w-full border-collapse border border-zinc-400 text-[11px]">
          <thead>
            <tr className="bg-zinc-200 text-zinc-900 font-semibold text-left">
              <th className="border border-zinc-400 px-2 py-1">Data</th>
              <th className="border border-zinc-400 px-2 py-1">Dia</th>
              <th className="border border-zinc-400 px-2 py-1">Batidas Registradas</th>
              <th className="border border-zinc-400 px-2 py-1 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {groupedPoints.length > 0 ? (
              groupedPoints.map(([dayKey, dayPoints]) => {
                const dayDate = new Date(`${dayKey}T00:00:00`);
                const sorted = [...dayPoints].sort(
                  (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
                );
                let dayMs = 0;
                for (let i = 0; i < sorted.length - 1; i += 2) {
                  dayMs += new Date(sorted[i + 1].timestamp).getTime() - new Date(sorted[i].timestamp).getTime();
                }

                return (
                  <tr key={dayKey} className="border-b border-zinc-300">
                    <td className="border border-zinc-400 px-2 py-1 font-mono">{format(dayDate, "dd/MM/yyyy")}</td>
                    <td className="border border-zinc-400 px-2 py-1 capitalize">{format(dayDate, "EEEE", { locale: ptBR })}</td>
                    <td className="border border-zinc-400 px-2 py-1 font-mono">
                      {sorted
                        .map(
                          (p, idx) =>
                            `${format(new Date(p.timestamp), "HH:mm")} (${idx % 2 === 0 ? "E" : "S"})`,
                        )
                        .join("   |   ")}
                    </td>
                    <td className="border border-zinc-400 px-2 py-1 text-right font-mono font-semibold">
                      {dayMs > 0 ? formatMsToHHMM(dayMs) : "--"}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={4} className="border border-zinc-400 p-2 text-center text-zinc-500">
                  Nenhum registro encontrado no período.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
