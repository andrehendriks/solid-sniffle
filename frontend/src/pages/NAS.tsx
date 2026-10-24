import BenchmarkPage from "./BenchmarkPage";

export default function NAS() {
  return (
    <BenchmarkPage
      type="nas"
      title="NAS Storage"
      description="Sequential read/write throughput and random IOPS via fio"
      metricKeys={["seq_read_mb", "seq_write_mb", "rand_read_iops", "rand_write_iops"]}
      trendMetrics={[
        { key: "seq_read_mb", label: "Seq Read (MB/s)", color: "#3b82f6" },
        { key: "seq_write_mb", label: "Seq Write (MB/s)", color: "#10b981" },
        { key: "rand_read_iops", label: "Rand Read IOPS", color: "#f59e0b" },
        { key: "rand_write_iops", label: "Rand Write IOPS", color: "#ef4444" },
      ]}
    />
  );
}
