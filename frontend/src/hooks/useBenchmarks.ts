import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllScores,
  getBenchmarkResults,
  getBenchmarkTrends,
  runBenchmark,
} from "../api/client";
import type { BenchmarkType } from "../types";

export const useAllScores = () =>
  useQuery({ queryKey: ["scores"], queryFn: getAllScores, refetchInterval: 30_000 });

export const useBenchmarkResults = (type: BenchmarkType, limit = 50) =>
  useQuery({
    queryKey: ["results", type, limit],
    queryFn: () => getBenchmarkResults(type, limit),
    refetchInterval: 15_000,
  });

export const useBenchmarkTrends = (type: BenchmarkType, days = 7) =>
  useQuery({
    queryKey: ["trends", type, days],
    queryFn: () => getBenchmarkTrends(type, days),
  });

export const useRunBenchmark = (type: BenchmarkType) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => runBenchmark(type),
    onSuccess: () => {
      setTimeout(() => {
        qc.invalidateQueries({ queryKey: ["results", type] });
        qc.invalidateQueries({ queryKey: ["scores"] });
      }, 3000);
    },
  });
};
