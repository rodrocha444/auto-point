import { InputDayPicker } from "@/atomic/molecules/InputDayPicker";
import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { differenceInDays, format } from "date-fns";
import { useState } from "react";
import { formatMsToHHMM } from "@/utils/formatMsToHHMM";
import { useDeletePoint, usePointsInInterval } from "@/hooks/usePoints";
import { CalendarPlus, Trash } from "lucide-react";
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

    if (days > 60) {
      ctx.addIssue({
        code: "custom",
        message: `Máximo de 60 dias. (Selecionado: ${days})`,
        path: ["endDate"],
      });
    }
  });

type DateSchema = z.infer<typeof datesSchema>;

function RouteComponent() {
  const [visibleCreatePointModal, setVisibleCreatePointModal] = useState(false);

  const { mutate: deletePoint } = useDeletePoint();

  const [values, setValues] = useState<DateSchema>();

  const { data: totalMsData } = usePointsInInterval(
    {
      startDate: format(values?.startDate ?? new Date(), "yyyy-MM-dd"),
      endDate: format(values?.endDate ?? new Date(), "yyyy-MM-dd"),
    },
    { enabled: !!values },
  );

  const { Field, handleSubmit } = useForm({
    validators: { onChange: datesSchema },
    defaultValues: { startDate: new Date(), endDate: new Date() },
    onSubmit: async ({ value }) => setValues(value),
  });

  const totalAReceber =
    totalMsData?.milliseconds &&
    (totalMsData?.milliseconds / 3600000) *
      parseInt(import.meta.env.VITE_VALOR_POR_HORA || "0");

  return (
    <div className="p-5 flex flex-col gap-5 items-center overflow-auto h-dvh">
      <div className="text-white">Data Inicial:</div>
      <Field name="startDate">
        {({ state, handleChange }) => (
          <div>
            <InputDayPicker value={state.value} onChange={handleChange} />
            <div>{state.meta.errors.join(", ")}</div>
          </div>
        )}
      </Field>

      <div className="text-white">Data Final:</div>
      <Field name="endDate">
        {({ state, handleChange }) => (
          <div className="flex flex-col gap-1 items-center">
            <InputDayPicker value={state.value} onChange={handleChange} />
            <div>{state.meta.errors.map(e => e?.message)}</div>
          </div>
        )}
      </Field>
      <div className="flex items-stretch gap-2">
        <button
          className="py-2 bg-gray-600 text-white rounded-md font-medium px-10 cursor-pointer active:bg-gray-500"
          onClick={handleSubmit}
        >
          Buscar
        </button>

        <button
          className="bg-gray-600 rounded-lg p-3 active:bg-gray-500 cursor-pointer"
          onClick={() => setVisibleCreatePointModal(true)}
        >
          <CalendarPlus className="text-white" />
        </button>

        <CreatePointModal
          visible={visibleCreatePointModal}
          onClose={() => setVisibleCreatePointModal(false)}
        />
      </div>

      {totalMsData && (
        <div className="text-white flex flex-col items-center gap-5">
          <div className="flex flex-col items-center">
            Total de Horas no Período:{" "}
            {totalMsData?.milliseconds &&
              formatMsToHHMM(totalMsData?.milliseconds)}
            {totalAReceber && (
              <div>
                Total a Receber:{" "}
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(totalAReceber)}
              </div>
            )}
          </div>

          <div className="flex flex-col items-center">
            <div className="text-lg font-bold">Pontos</div>
            {totalMsData.points.map(point => (
              <div key={point.id} className="flex gap-2 items-center">
                <div>{format(new Date(point.timestamp), "HH:mm dd/MM/yy")}</div>
                <Trash
                  onClick={() => deletePoint({ id: point.id })}
                  className="text-red-300 cursor-pointer hover:text-red-500"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
