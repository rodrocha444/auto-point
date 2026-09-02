import { useCreatePoint } from "@/hooks/usePoints";
import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import { DayPicker } from "../molecules/DayPicker";

type CreatePointModalProps = {
  visible: boolean;
  onClose: () => void;
  fixedDate?: Date;
};

export function CreatePointModal({
  visible,
  onClose,
  fixedDate,
}: CreatePointModalProps) {
  const { mutate: createPoint, isPending } = useCreatePoint({
    onSuccess: () => {
      onClose();
    },
  });
  const [date, setDate] = useState<Date>(new Date());
  const [time, setTime] = useState<string>("");

  const handleCreatePoint = () => {
    if (!time) {
      alert("Por favor selecione um horário.");
      return;
    }
    const [hours, minutes] = time.split(":").map(Number);
    const newDate = fixedDate ? new Date(fixedDate) : new Date(date);
    newDate.setHours(hours, minutes, 0, 0);
    createPoint({ timestamp: newDate.toISOString() });
  };

  return (
    <Dialog.Root open={visible} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] rounded-lg bg-gray-600 p-6 shadow-lg focus:outline-none flex flex-col gap-4">
          <Dialog.Title className="font-medium text-white text-center" hidden>
            Criar um Ponto
          </Dialog.Title>

          <input
            type="time"
            className="mt-2 p-2 border rounded-md bg-gray-300"
            value={time}
            onChange={e => setTime(e.target.value)}
          />

          {!fixedDate && (
            <DayPicker
              id="day-picker"
              mode="single"
              selected={date}
              onSelect={date => date && setDate(date)}
              className="bg-gray-300 p-3 rounded-md"
            />
          )}

          <button
            onClick={handleCreatePoint}
            disabled={isPending}
            className="bg-gray-800 rounded-md p-2 active:bg-gray-700 text-gray-300 cursor-pointer disabled:opacity-50"
          >
            {isPending ? "Criando..." : "Criar Ponto"}
          </button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
