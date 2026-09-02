import { Popover } from "@radix-ui/themes";
import { Calendar } from "lucide-react";
import { DayPicker } from "./DayPicker";
import { useState } from "react";
import { format } from "date-fns";

type InputDayPickerProps = {
  value?: Date | null;
  onChange: (value: Date) => void;
};

export function InputDayPicker({ value, onChange }: InputDayPickerProps) {
  const [open, setOpen] = useState(false);

  function internalOnChange(date: Date | undefined) {
    if (date) onChange(date);
    setOpen(false);
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger>
        <button
          type="button"
          className="text-zinc-100 flex px-3.5 py-2.5 rounded-xl items-center gap-2.5 bg-zinc-800 border border-zinc-700/80 hover:bg-zinc-700 hover:border-zinc-600 active:scale-98 transition-all cursor-pointer shadow-sm text-xs font-mono w-full justify-center sm:w-auto"
        >
          <Calendar size={15} className="text-violet-400 shrink-0" />
          <span className="truncate">
            {value ? format(value, "dd/MM/yyyy") : "Selecione a data"}
          </span>
        </button>
      </Popover.Trigger>

      <Popover.Content className="flex justify-center flex-col items-center bg-zinc-900 border border-zinc-800 text-white rounded-2xl p-3 shadow-2xl">
        <DayPicker
          mode="single"
          selected={value ?? undefined}
          onSelect={internalOnChange}
          required
          className="text-white"
        />
      </Popover.Content>
    </Popover.Root>
  );
}
