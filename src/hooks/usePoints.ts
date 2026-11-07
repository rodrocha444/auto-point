import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPoint,
  deletePoint,
  getMonthPointsAndSummary,
  getPointsByDate,
  getPointsInInterval,
  getTotalMsInMonth,
} from "@/services/pointsService";
import { format } from "date-fns";

export const pointKeys = {
  all: ["points"] as const,
  byDate: (date: string, timezone?: string) =>
    [...pointKeys.all, "byDate", date, timezone ?? "America/Sao_Paulo"] as const,
  monthSummary: (date: string, timezone?: string) =>
    [
      ...pointKeys.all,
      "monthSummary",
      date.slice(0, 7),
      timezone ?? "America/Sao_Paulo",
    ] as const,
  totalMsInMonth: (date: string, timezone?: string) =>
    [
      ...pointKeys.all,
      "totalMsInMonth",
      date.slice(0, 7),
      timezone ?? "America/Sao_Paulo",
    ] as const,
  inInterval: (startDate: string, endDate: string, timezone?: string) =>
    [
      ...pointKeys.all,
      "inInterval",
      startDate,
      endDate,
      timezone ?? "America/Sao_Paulo",
    ] as const,
};

export function usePointsByDate({
  date,
  timezone,
}: {
  date: string;
  timezone?: string;
}) {
  return useQuery({
    queryKey: pointKeys.byDate(date, timezone),
    queryFn: () => getPointsByDate(date, timezone),
  });
}

export function useTotalMsInMonth({
  date,
  timezone,
}: {
  date: string;
  timezone?: string;
}) {
  return useQuery({
    queryKey: pointKeys.totalMsInMonth(date, timezone),
    queryFn: () => getTotalMsInMonth(date, timezone),
  });
}

export function useMonthPointsAndSummary({
  date,
  timezone,
}: {
  date: string;
  timezone?: string;
}) {
  return useQuery({
    queryKey: pointKeys.monthSummary(date, timezone),
    queryFn: () => getMonthPointsAndSummary(date, timezone),
  });
}

export function usePointsInInterval(
  {
    startDate,
    endDate,
    timezone,
  }: {
    startDate: string;
    endDate: string;
    timezone?: string;
  },
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: pointKeys.inInterval(startDate, endDate, timezone),
    queryFn: () => getPointsInInterval(startDate, endDate, timezone),
    enabled: options?.enabled ?? true,
  });
}

export function useCreatePoint(options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input?: { timestamp?: string | Date }) => createPoint(input),
    onSuccess: (newPoint) => {
      const dateObj = new Date(newPoint.timestamp);
      const dateStr = format(dateObj, "yyyy-MM-dd");
      const monthPrefix = dateStr.slice(0, 7);

      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          if (key[0] !== "points") return false;
          // Invalida dia específico se ativo ou em cache
          if (key[1] === "byDate" && key[2] === dateStr) return true;
          // Invalida o mês correspondente
          if (
            (key[1] === "monthSummary" || key[1] === "totalMsInMonth") &&
            typeof key[2] === "string" &&
            key[2].startsWith(monthPrefix)
          ) {
            return true;
          }
          // Invalida apenas queries de intervalo que estejam ativas na tela
          if (key[1] === "inInterval" && query.isActive()) return true;
          return false;
        },
      });
      options?.onSuccess?.();
    },
    onError: (error) => {
      console.error("Falha ao registrar ponto:", error);
      alert(`Falha ao registrar ponto: ${error instanceof Error ? error.message : String(error)}`);
      options?.onError?.(error as Error);
    },
  });
}

export function useDeletePoint(options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string }) => deletePoint(id),
    onSuccess: () => {
      // Invalida apenas as queries que estão montadas na tela no momento
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "points" && query.isActive(),
      });
      options?.onSuccess?.();
    },
    onError: (error) => {
      console.error("Falha ao excluir ponto:", error);
      alert(`Falha ao excluir ponto: ${error instanceof Error ? error.message : String(error)}`);
      options?.onError?.(error as Error);
    },
  });
}
