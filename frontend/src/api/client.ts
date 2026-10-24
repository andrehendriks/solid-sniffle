import axios from "axios";
import type {
  BenchmarkResult,
  BenchmarkTrend,
  BenchmarkType,
  ScoreSummary,
  Schedule,
  Alert,
  AlertEvent,
} from "../types";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

// --- Benchmarks ---

export const runBenchmark = (type: BenchmarkType) =>
  api.post<{ message: string; benchmark_type: BenchmarkType }>(`/benchmarks/${type}/run`);

export const getBenchmarkResults = (type: BenchmarkType, limit = 50) =>
  api
    .get<BenchmarkResult[]>(`/benchmarks/${type}/results`, { params: { limit } })
    .then((r) => r.data);

export const getBenchmarkTrends = (type: BenchmarkType, days = 7) =>
  api
    .get<BenchmarkTrend[]>(`/benchmarks/${type}/trend`, { params: { days } })
    .then((r) => r.data);

export const getAllScores = () =>
  api.get<ScoreSummary[]>("/benchmarks/scores").then((r) => r.data);

// --- Schedules ---

export const getSchedules = () =>
  api.get<Schedule[]>("/schedules").then((r) => r.data);

export const createSchedule = (data: {
  benchmark_type: BenchmarkType;
  cron_expression: string;
  enabled?: boolean;
}) => api.post<Schedule>("/schedules", data).then((r) => r.data);

export const updateSchedule = (
  id: number,
  data: Partial<{ cron_expression: string; enabled: boolean }>
) => api.patch<Schedule>(`/schedules/${id}`, data).then((r) => r.data);

export const deleteSchedule = (id: number) =>
  api.delete(`/schedules/${id}`);

// --- Alerts ---

export const getAlerts = () =>
  api.get<Alert[]>("/alerts").then((r) => r.data);

export const createAlert = (data: {
  name: string;
  benchmark_type: BenchmarkType;
  metric_name: string;
  condition: string;
  threshold: number;
  enabled?: boolean;
}) => api.post<Alert>("/alerts", data).then((r) => r.data);

export const updateAlert = (
  id: number,
  data: Partial<{ enabled: boolean; threshold: number }>
) => api.patch<Alert>(`/alerts/${id}`, data).then((r) => r.data);

export const deleteAlert = (id: number) => api.delete(`/alerts/${id}`);

export const getAlertEvents = (alertId: number) =>
  api.get<AlertEvent[]>(`/alerts/${alertId}/events`).then((r) => r.data);

// --- Reports ---

export const getSummaryReport = () =>
  api.get("/reports/summary").then((r) => r.data);

export const getDetailedReport = (type: BenchmarkType, days = 30) =>
  api
    .get(`/reports/${type}`, { params: { days } })
    .then((r) => r.data);
