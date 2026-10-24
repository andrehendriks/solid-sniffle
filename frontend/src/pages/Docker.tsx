import BenchmarkPage from "./BenchmarkPage";

export default function Docker() {
  return (
    <BenchmarkPage
      type="docker"
      title="Docker"
      description="Container startup time, image pull speed, CPU and memory benchmarks"
      metricKeys={["startup_time_s", "pull_speed_mb", "cpu_score", "memory_score"]}
      trendMetrics={[
        { key: "startup_time_s", label: "Startup Time (s)", color: "#3b82f6" },
        { key: "pull_speed_mb", label: "Pull Speed (MB/s)", color: "#10b981" },
        { key: "cpu_score", label: "CPU Score", color: "#f59e0b" },
        { key: "memory_score", label: "Memory Score", color: "#8b5cf6" },
      ]}
    />
  );
}
