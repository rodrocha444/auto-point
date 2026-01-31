import {
  DayOfWeek,
  useCreateHorariosMutation,
  useDeleteHorariosMutation,
  useHorariosAgrupadosQuery,
} from "@/graphql/generated";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import z from "zod";
import { Trash } from "lucide-react";
import { differenceInMinutes, parse } from "date-fns";

export const Route = createFileRoute("/")({
  component: Componente,
});

const horarioSchema = z.object({
  time: z.iso.time(),
  dayOfWeek: z.enum(DayOfWeek, "Selecione um dia válido"),
});

type HorarioSchema = z.infer<typeof horarioSchema>;

const defaultValues: HorarioSchema = {
  time: "",
  dayOfWeek: "" as DayOfWeek,
};

function Componente() {
  const client = useQueryClient();
  const { data: horariosData } = useHorariosAgrupadosQuery();
  const { mutate: createHorario } = useCreateHorariosMutation({
    onSuccess: () =>
      client.resetQueries({
        queryKey: useHorariosAgrupadosQuery.getKey(),
      }),
  });
  const { mutate: deleteHorario } = useDeleteHorariosMutation({
    onSuccess: () =>
      client.invalidateQueries({
        queryKey: useHorariosAgrupadosQuery.getKey(),
      }),
  });

  const form = useForm({
    validators: {
      onSubmit: horarioSchema,
    },
    defaultValues,
    onSubmit: ({ value }) =>
      createHorario({ input: { time: value.time, day: value.dayOfWeek } }),
  });

  return (
    <div className="flex flex-col gap-5 items-start border rounded p-5">
      <div className="flex gap-5">
        {horariosData?.horariosAgrupados.map(day => {
          const totalIntervalTimesInMinutes = day.items.reduce(
            (acc, current, index, array) => {
              // Só processamos quando o índice é ímpar (segundo elemento do par)
              if (index % 2 !== 0) {
                const entrada = parse(
                  array[index - 1].time,
                  "HH:mm:ss",
                  new Date(),
                );
                const saida = parse(current.time, "HH:mm:ss", new Date());

                console.log(
                  array[index - 1].time,
                  current.time,
                  entrada,
                  saida,
                );

                return acc + differenceInMinutes(saida, entrada);
              }

              return acc;
            },
            0,
          );

          console.log(totalIntervalTimesInMinutes);

          const formattedTotalTime = `${Math.floor(totalIntervalTimesInMinutes / 60)} horas ${Math.floor(totalIntervalTimesInMinutes % 60)} minutos`;

          return (
            <div key={day.day}>
              <h2>{day.day}</h2>
              {day.items.map(horario => (
                <div key={horario.time} className="flex">
                  <div>{horario.time}</div>
                  <button
                    onClick={() => deleteHorario({ id: horario.id })}
                    className="text-red-400 hover:text-red-200 cursor-pointer transition-colors"
                  >
                    <Trash size={20} />
                  </button>
                </div>
              ))}

              {formattedTotalTime}
            </div>
          );
        })}
      </div>

      <div className="bg-amber-200">
        <form.Field
          name="time"
          children={field => (
            <>
              <input
                value={field.state.value}
                onChange={e => {
                  field.handleChange(e.target.value);
                }}
                type="time"
              />
              <div>
                {!field.state.meta.isValid && (
                  <div>
                    {field.state.meta.errors.map(error => (
                      <p key={error?.message}>{error?.message}</p>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        />

        <form.Field
          name="dayOfWeek"
          children={field => (
            <>
              <select
                value={field.state.value ?? ""}
                onChange={e => field.handleChange(e.target.value as DayOfWeek)}
              >
                <option value="">Selecione um dia</option>

                {Object.values(DayOfWeek).map(day => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
              <div>
                {!field.state.meta.isValid && (
                  <div>
                    {field.state.meta.errors.map(error => (
                      <p key={error?.message}>{error?.message}</p>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        />

        <button
          onClick={form.handleSubmit}
          className="bg-gray-700 text-white rounded-lg p-3 hover:bg-gray-500 transition-colors cursor-pointer"
        >
          Criar horario
        </button>
      </div>
    </div>
  );
}
