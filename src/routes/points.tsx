import { createFileRoute } from "@tanstack/react-router";
import { InputDayPicker } from "@/atomic/molecules/InputDayPicker";
import { Spinner, Table } from "@radix-ui/themes";
import { useState } from "react";
import { useDeletePoint, usePointsByDate } from "@/hooks/usePoints";
import { format } from "date-fns";
import { CalendarPlus, Trash } from "lucide-react";
import { CreatePointModal } from "@/atomic/organims/CreatePointModal";

export const Route = createFileRoute("/points")({
  component: RouteComponent,
});

function RouteComponent() {
  const [date, setDate] = useState(new Date());
  const [visibleCreatePointModal, setVisibleCreatePointModal] = useState(false);

  const { data: points } = usePointsByDate({
    date: format(date, "yyyy-MM-dd"),
  });

  const { mutate: deletePoint, isPending: isDeleting } = useDeletePoint();

  return (
    <div className="p-5 flex flex-col gap-6 items-center">
      <div className="text-white font-bold text-2xl">Pontos por Dia</div>

      <div className="flex flex-col items-center gap-4">
        <div>
          <div className="text-white font-medium">Selecione uma data:</div>

          <InputDayPicker value={date} onChange={setDate} />
        </div>

        <button
          className="bg-gray-600 rounded-lg p-3 active:bg-gray-500 cursor-pointer"
          onClick={() => setVisibleCreatePointModal(true)}
        >
          <CalendarPlus className="text-white" />
        </button>
      </div>

      <CreatePointModal
        fixedDate={date}
        visible={visibleCreatePointModal}
        onClose={() => setVisibleCreatePointModal(false)}
      />

      {points && points.length > 0 ? (
        <Table.Root className="bg-white p-5 rounded-md">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell className="font-semibold" align="center">
                Horários
              </Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {points.map(point => (
              <Table.Row key={point.id}>
                <Table.RowHeaderCell
                  className="text-base flex gap-2 items-center"
                  align="center"
                >
                  <div>{format(new Date(point.timestamp), "HH:mm")}</div>
                  <button disabled={isDeleting} className="cursor-pointer">
                    {isDeleting ? (
                      <Spinner />
                    ) : (
                      <Trash
                        size={18}
                        className="text-red-500 hover:text-red-700"
                        onClick={() => deletePoint({ id: point.id })}
                      />
                    )}
                  </button>
                </Table.RowHeaderCell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      ) : (
        <div className="bg-white p-5 rounded-md">
          Nenhum ponto encontrado para esse dia
        </div>
      )}
    </div>
  );
}
