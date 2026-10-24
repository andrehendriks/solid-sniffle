import BenchmarkPage from "./BenchmarkPage";

export default function Kubernetes() {
  return (
    <BenchmarkPage
      type="kubernetes"
      title="Kubernetes"
      description="Pod startup time, API server latency, and cluster resource counts"
      metricKeys={["pod_startup_s", "api_latency_ms", "node_count", "pod_count"]}
      trendMetrics={[
        { key: "pod_startup_s", label: "Pod Startup (s)", color: "#3b82f6" },
        { key: "api_latency_ms", label: "API Latency (ms)", color: "#f59e0b" },
      ]}
    />
  );
}
