import { format } from "date-fns";
import clsx from "clsx";
import type { BenchmarkResult } from "../types";

interface Props {
  results: BenchmarkResult[];
  metricKeys?: string[];
}

function StatusBadge({ status }: { status: string }) {
  const cls = {
    success: "bg-green-900 text-green-300",
    failure: "bg-red-900 text-red-300",
    running: "bg-yellow-900 text-yellow-300",
  }[status] ?? "bg-gray-800 text-gray-400";

  return <span className={clsx("badge", cls)}>{status}</span>;
}

export default function ResultsTable({ results, metricKeys = [] }: Props) {
  if (results.length === 0) {
    return <p className="text-gray-500 text-sm">No results yet. Run a benchmark to get started.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800 text-left text-xs text-gray-500 uppercase">
            <th className="pb-2 pr-4">Time</th>
            <th className="pb-2 pr-4">Status</th>
            <th className="pb-2 pr-4">Score</th>
            <th className="pb-2 pr-4">Duration</th>
            {metricKeys.map((k) => (
              <th key={k} className="pb-2 pr-4">{k}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <tr key={r.id} className="border-b border-gray-900 hover:bg-gray-900/50">
              <td className="py-2 pr-4 text-gray-400 whitespace-nowrap">
                {format(new Date(r.created_at), "MM/dd HH:mm:ss")}
              </td>
              <td className="py-2 pr-4">
                <StatusBadge status={r.status} />
              </td>
              <td className="py-2 pr-4 tabular-nums font-medium">
                {r.score !== null ? Math.round(r.score) : "—"}
              </td>
              <td className="py-2 pr-4 text-gray-400 tabular-nums">
                {r.duration_seconds !== null ? `${r.duration_seconds.toFixed(1)}s` : "—"}
              </td>
              {metricKeys.map((k) => (
                <td key={k} className="py-2 pr-4 text-gray-400 tabular-nums">
                  {r.metrics?.[k] !== undefined && r.metrics[k] !== null
                    ? String(r.metrics[k])
                    : "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
