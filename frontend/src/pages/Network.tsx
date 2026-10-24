import BenchmarkPage from "./BenchmarkPage";

export default function Network() {
  return (
    <BenchmarkPage
      type="network"
      title="Network"
      description="Ping latency, DNS resolution, download speed, and iperf3 bandwidth"
      metricKeys={["ping_ms", "dns_ms", "download_mb", "iperf3_mb"]}
      trendMetrics={[
        { key: "ping_ms", label: "Ping (ms)", color: "#3b82f6" },
        { key: "dns_ms", label: "DNS (ms)", color: "#10b981" },
        { key: "download_mb", label: "Download (MB/s)", color: "#f59e0b" },
        { key: "iperf3_mb", label: "iperf3 (Mbps)", color: "#8b5cf6" },
      ]}
    />
  );
}
