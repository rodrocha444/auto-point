import {
  DayPicker as DayPickerLib,
  type DayPickerProps,
} from "react-day-picker";
import "react-day-picker/style.css";

export function DayPicker(props: DayPickerProps) {
  return <DayPickerLib {...props} />;
}
