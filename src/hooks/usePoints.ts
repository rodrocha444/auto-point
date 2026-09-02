import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPoint,
  deletePoint,
  getPointsByDate,
  getPointsInInterval,
  getTotalMsInMonth,
} from "@/services/pointsService";

export const pointKeys = {
  all: ["points"] as const,
  byDate: (date: string, timezone?: string) =>
    [...pointKeys.all, "byDate", date, timezone ?? "America/Sao_Paulo"] as const,
  totalMsInMonth: (date: string, timezone?: string) =>
    [...pointKeys.all, "totalMsInMonth", date, timezone ?? "America/Sao_Paulo"] as const,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pointKeys.all });
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
      queryClient.invalidateQueries({ queryKey: pointKeys.all });
      options?.onSuccess?.();
    },
    onError: (error) => {
      console.error("Falha ao excluir ponto:", error);
      alert(`Falha ao excluir ponto: ${error instanceof Error ? error.message : String(error)}`);
      options?.onError?.(error as Error);
    },
  });
}
