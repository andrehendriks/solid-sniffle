import BenchmarkPage from "./BenchmarkPage";

export default function SMB() {
  return (
    <BenchmarkPage
      type="smb"
      title="SMB Share"
      description="Samba share write/read speed and latency via smbclient"
      metricKeys={["write_speed_mb", "read_speed_mb", "latency_ms"]}
      trendMetrics={[
        { key: "write_speed_mb", label: "Write Speed (MB/s)", color: "#3b82f6" },
        { key: "read_speed_mb", label: "Read Speed (MB/s)", color: "#10b981" },
        { key: "latency_ms", label: "Latency (ms)", color: "#f59e0b" },
      ]}
    />
  );
}
