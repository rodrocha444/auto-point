import { CreatePointModal } from "@/atomic/organims/CreatePointModal";
import {
  useCreatePointMutation,
  useDeletePointMutation,
  usePointsByDateQuery,
  useTotalMsInMonthQuery,
} from "@/graphql/generated";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { CalendarCog, Loader, Trash } from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function formatTime(milliseconds: number): string {
  const hh = Math.floor(milliseconds / 3600000)
    .toString()
    .padStart(2, "0");
  const mm = Math.floor((milliseconds % 3600000) / 60000)
    .toString()
    .padStart(2, "0");
  return `${hh}:${mm}`;
}

function RouteComponent() {
  const today = format(new Date(), "yyyy-MM-dd");
  const client = useQueryClient();
  const [visibleCreatePointModal, setVisibleCreatePointModal] = useState(false);

  const { data: todayPoints } = usePointsByDateQuery({
    date: today,
  });

  const { data: totalMsInMonth } = useTotalMsInMonthQuery({
    date: today,
  });

  const { mutate: createPoint, isPending: isCreatingPoint } =
    useCreatePointMutation({
      onSuccess: () => {
        client.invalidateQueries({
          queryKey: usePointsByDateQuery.getKey({ date: today }),
        });
        client.invalidateQueries({
          queryKey: ["totalMsInMonth"],
        });
      },
    });

  const { mutate: deletePoint } = useDeletePointMutation({
    onSuccess: () => {
      client.invalidateQueries({
        queryKey: usePointsByDateQuery.getKey({ date: today }),
      });
      client.invalidateQueries({
        queryKey: ["totalMsInMonth"],
      });
    },
  });

  const totalMilliseconds = useMemo(() => {
    const points = todayPoints?.pointsByDate;
    if (!points) return 0;

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
        new Date().getTime() -
        new Date(points[points.length - 1].timestamp).getTime();
    }

    return total;
  }, [todayPoints]);

  const totalFormattedHHMM = useMemo(() => {
    return formatTime(totalMilliseconds);
  }, [totalMilliseconds]);

  const valorAReceber =
    (totalMilliseconds / 3600000) *
    parseInt(import.meta.env.VITE_VALOR_POR_HORA || "0");

  const totalAReceber =
    totalMsInMonth?.totalMsInMonth.milliseconds &&
    (totalMsInMonth?.totalMsInMonth.milliseconds / 3600000) *
      parseInt(import.meta.env.VITE_VALOR_POR_HORA || "0");

  return (
    <div className="overflow-hidden h-dvh bg-gray-950 w-full items-center p-5 gap-5 flex flex-col">
      <div className="text-white text-center">
        Total de Horas no Mês:{" "}
        {totalMsInMonth?.totalMsInMonth.milliseconds &&
          formatTime(totalMsInMonth?.totalMsInMonth.milliseconds)}
        {totalAReceber && (
          <div className="text-center">
            Total a Receber:{" "}
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(totalAReceber)}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-5 w-full flex-1 justify-center">
        <div className="text-white flex flex-col gap-4 items-center bg-gray-800 w-full rounded-lg p-4">
          <div>Horários de Hoje</div>
          <div className="flex flex-col gap-2">
            {todayPoints?.pointsByDate.map(point => (
              <div key={point.id} className="flex gap-2 items-center">
                <div className="font-mono">
                  {format(point.timestamp, "HH:mm:ss")}
                </div>
                <Trash
                  onClick={() => deletePoint({ id: point.id })}
                  size="20"
                  className="text-red-400 active:text-red-300"
                />
              </div>
            ))}
            {todayPoints?.pointsByDate.length === 0 && (
              <div className="text-gray-600">Nenhum ponto registrado hoje</div>
            )}
          </div>
        </div>

        <div className="text-white flex flex-col items-center bg-gray-800 w-full rounded-lg p-4">
          <div>Total de Horas Hoje</div>
          <div>{totalFormattedHHMM}</div>
          {!!todayPoints?.pointsByDate.length &&
            todayPoints?.pointsByDate.length % 2 === 1 && (
              <div className="text-gray-600">Ainda falta bater ponto</div>
            )}
        </div>

        <div className="text-white flex flex-col items-center bg-gray-800 w-full rounded-lg p-4">
          <div>Valor Ganho Hoje</div>
          <div>
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(valorAReceber)}
          </div>
        </div>

        <div className="flex gap-2 w-full">
          <button
            className="bg-gray-400 w-full rounded-lg p-3 active:bg-gray-200 transition-colors flex justify-center"
            onClick={() => createPoint({ timestamp: new Date() })}
            disabled={isCreatingPoint}
          >
            {isCreatingPoint ? (
              <Loader className="animate-spin text-center" />
            ) : (
              "Bater Ponto"
            )}
          </button>
          <button
            className="bg-gray-600 rounded-lg p-3 active:bg-gray-500"
            onClick={() => setVisibleCreatePointModal(true)}
          >
            <CalendarCog />
          </button>
        </div>

        <CreatePointModal
          visible={visibleCreatePointModal}
          onClose={() => setVisibleCreatePointModal(false)}
        />
      </div>
    </div>
  );
}
