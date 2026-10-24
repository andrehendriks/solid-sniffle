import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Download } from "lucide-react";
import { getSummaryReport, getDetailedReport } from "../api/client";
import type { BenchmarkType } from "../types";

const TYPES: BenchmarkType[] = ["nas", "smb", "docker", "kubernetes", "network"];

function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const [selectedType, setSelectedType] = useState<BenchmarkType | null>(null);
  const [days, setDays] = useState(30);

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ["report-summary"],
    queryFn: getSummaryReport,
  });

  const { data: detailed, isLoading: loadingDetailed } = useQuery({
    queryKey: ["report-detailed", selectedType, days],
    queryFn: () => getDetailedReport(selectedType!, days),
    enabled: !!selectedType,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Reports</h2>
        <p className="text-gray-500 text-sm mt-1">Aggregated benchmark analytics and exports</p>
      </div>

      {/* Summary report */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm text-gray-300">Summary Report</h3>
          {summary && (
            <button
              className="btn-secondary flex items-center gap-1 text-xs py-1"
              onClick={() => downloadJson(summary, "homelab-summary.json")}
            >
              <Download size={12} /> Export JSON
            </button>
          )}
        </div>
        {loadingSummary ? (
          <div className="flex items-center gap-2 text-gray-400">
            <Loader2 size={14} className="animate-spin" /> Loading…
          </div>
        ) : summary ? (
          <pre className="text-xs text-gray-300 bg-gray-950 rounded-lg p-4 overflow-x-auto">
            {JSON.stringify(summary, null, 2)}
          </pre>
        ) : null}
      </div>

      {/* Detailed per-type report */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm text-gray-300">Detailed Report</h3>
          <div className="flex items-center gap-2">
            <select
              className="input w-auto text-xs py-1"
              value={selectedType ?? ""}
              onChange={(e) => setSelectedType(e.target.value as BenchmarkType || null)}
            >
              <option value="">— Select type —</option>
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select
              className="input w-auto text-xs py-1"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            >
              {[7, 14, 30, 90].map((d) => (
                <option key={d} value={d}>{d} days</option>
              ))}
            </select>
            {detailed && (
              <button
                className="btn-secondary flex items-center gap-1 text-xs py-1"
                onClick={() => downloadJson(detailed, `homelab-${selectedType}-${days}d.json`)}
              >
                <Download size={12} /> Export
              </button>
            )}
          </div>
        </div>

        {!selectedType && (
          <p className="text-gray-500 text-sm">Select a benchmark type to view detailed analytics.</p>
        )}

        {selectedType && loadingDetailed && (
          <div className="flex items-center gap-2 text-gray-400">
            <Loader2 size={14} className="animate-spin" /> Loading…
          </div>
        )}

        {detailed && (
          <pre className="text-xs text-gray-300 bg-gray-950 rounded-lg p-4 overflow-x-auto">
            {JSON.stringify(detailed, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
