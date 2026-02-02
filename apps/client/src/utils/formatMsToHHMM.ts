export function formatMsToHHMM(milliseconds: number): string {
  const hh = Math.floor(milliseconds / 3600000)
    .toString()
    .padStart(2, "0");
  const mm = Math.floor((milliseconds % 3600000) / 60000)
    .toString()
    .padStart(2, "0");
  return `${hh}:${mm}`;
}
