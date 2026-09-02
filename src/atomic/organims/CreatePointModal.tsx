import { useCreatePoint } from "@/hooks/usePoints";
import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import { format } from "date-fns";
import { Clock, Loader2, X } from "lucide-react";
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
      setTime("");
    },
  });

  const [date, setDate] = useState<Date>(new Date());
  const [time, setTime] = useState<string>(() => format(new Date(), "HH:mm"));

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

  const quickTimes = ["08:00", "12:00", "13:00", "18:00"];

  return (
    <Dialog.Root open={visible} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 animate-in fade-in duration-200" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] w-[92vw] max-w-sm rounded-3xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl focus:outline-none flex flex-col gap-5 animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-violet-600/20 text-violet-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <Dialog.Title className="font-semibold text-base text-zinc-100">
                Registrar Ponto Manual
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Horário da Batida
            </label>
            <input
              type="time"
              className="p-3 border border-zinc-700 rounded-xl bg-zinc-800 text-white font-mono text-center text-xl focus:outline-none focus:border-violet-500 transition-colors cursor-pointer"
              value={time}
              onChange={e => setTime(e.target.value)}
            />

            {/* Quick time pills */}
            <div className="flex items-center gap-1.5 justify-center mt-1">
              <button
                type="button"
                onClick={() => setTime(format(new Date(), "HH:mm"))}
                className="text-[11px] px-2 py-1 rounded-md bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors font-mono cursor-pointer"
              >
                Agora
              </button>
              {quickTimes.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTime(t)}
                  className="text-[11px] px-2 py-1 rounded-md bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors font-mono cursor-pointer"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {!fixedDate && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Data
              </label>
              <div className="flex justify-center bg-zinc-950/60 p-2 rounded-2xl border border-zinc-800/80">
                <DayPicker
                  id="day-picker"
                  mode="single"
                  selected={date}
                  onSelect={d => d && setDate(d)}
                  className="text-white"
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-zinc-300 font-medium text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleCreatePoint}
              disabled={isPending || !time}
              className="flex-1 py-3 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-violet-600/30 cursor-pointer disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                "Salvar Ponto"
              )}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
