import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAlerts,
  createAlert,
  updateAlert,
  deleteAlert,
  getAlertEvents,
} from "../api/client";
import type { BenchmarkType } from "../types";

export const useAlerts = () =>
  useQuery({ queryKey: ["alerts"], queryFn: getAlerts });

export const useAlertEvents = (alertId: number) =>
  useQuery({
    queryKey: ["alert-events", alertId],
    queryFn: () => getAlertEvents(alertId),
    enabled: alertId > 0,
  });

export const useCreateAlert = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      benchmark_type: BenchmarkType;
      metric_name: string;
      condition: string;
      threshold: number;
    }) => createAlert(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });
};

export const useUpdateAlert = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; enabled?: boolean; threshold?: number }) =>
      updateAlert(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });
};

export const useDeleteAlert = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteAlert,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });
};
