import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} from "../api/client";
import type { BenchmarkType } from "../types";

export const useSchedules = () =>
  useQuery({ queryKey: ["schedules"], queryFn: getSchedules });

export const useCreateSchedule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { benchmark_type: BenchmarkType; cron_expression: string }) =>
      createSchedule(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["schedules"] }),
  });
};

export const useUpdateSchedule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; enabled?: boolean; cron_expression?: string }) =>
      updateSchedule(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["schedules"] }),
  });
};

export const useDeleteSchedule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteSchedule,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["schedules"] }),
  });
};
