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
        <div className="text-gray-950 flex p-3 rounded-lg w-min items-center gap-2 bg-white cursor-pointer">
          <Calendar size={18} />
          <div className="font-mono">
            {value ? format(value, "dd/MM/yyyy") : "Selecione uma data..."}
          </div>
        </div>
      </Popover.Trigger>

      <Popover.Content className="flex justify-center flex-col items-center">
        <DayPicker
          mode="single"
          selected={value ?? undefined}
          onSelect={internalOnChange}
          required
        />
      </Popover.Content>
    </Popover.Root>
  );
}
