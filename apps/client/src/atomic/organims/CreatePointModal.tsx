import { useCreatePointMutation } from "@/graphql/generated";
import * as Dialog from "@radix-ui/react-dialog";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
type CreatePointModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function CreatePointModal({ visible, onClose }: CreatePointModalProps) {
  const client = useQueryClient();
  const { mutate: createPoint } = useCreatePointMutation({
    onSuccess: async () => {
      await client.invalidateQueries({
        queryKey: ["pointsByDate"],
      });
      onClose();
    },
  });
  const [date, setDate] = useState<Date>(new Date());
  const [time, setTime] = useState<string>("");

  const handleCreatePoint = () => {
    const [hours, minutes] = time.split(":").map(Number);
    const newDate = new Date(date);
    newDate.setHours(hours);
    newDate.setMinutes(minutes);
    createPoint({ timestamp: newDate?.toISOString() });
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

          <DayPicker
            id="day-picker"
            mode="single"
            selected={date}
            onSelect={date => date && setDate(date)}
            className="bg-gray-300 p-3 rounded-md"
          />

          <button
            onClick={handleCreatePoint}
            className="bg-gray-800 rounded-md p-2 active:bg-gray-700 text-gray-300"
          >
            Criar Ponto
          </button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
