export type BenchmarkType = "nas" | "smb" | "docker" | "kubernetes" | "network";

export interface BenchmarkResult {
  id: number;
  benchmark_type: BenchmarkType;
  status: "success" | "failure" | "running";
  score: number | null;
  duration_seconds: number | null;
  metrics: Record<string, number | string | null>;
  error_message: string | null;
  created_at: string;
}

export interface BenchmarkTrend {
  timestamp: string;
  score: number | null;
  metrics: Record<string, number | string | null>;
}

export interface ScoreSummary {
  benchmark_type: BenchmarkType;
  latest_score: number | null;
  avg_score_7d: number | null;
  run_count_7d: number;
  last_run: string | null;
  trend: "up" | "down" | "stable" | "no_data";
}

export interface Schedule {
  id: number;
  benchmark_type: BenchmarkType;
  cron_expression: string;
  enabled: boolean;
  last_run: string | null;
  next_run: string | null;
  created_at: string;
  updated_at: string;
}

export interface Alert {
  id: number;
  name: string;
  benchmark_type: BenchmarkType;
  metric_name: string;
  condition: string;
  threshold: number;
  enabled: boolean;
  last_triggered: string | null;
  created_at: string;
}

export interface AlertEvent {
  id: number;
  alert_id: number;
  metric_value: number;
  message: string;
  triggered_at: string;
}
