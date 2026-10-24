import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useBenchmarkResults, useBenchmarkTrends } from "../hooks/useBenchmarks";
import RunButton from "../components/RunButton";
import TrendChart from "../components/TrendChart";
import ResultsTable from "../components/ResultsTable";
import type { BenchmarkType } from "../types";

interface Props {
  type: BenchmarkType;
  title: string;
  description?: string;
  metricKeys?: string[];
  trendMetrics?: { key: string; label: string; color?: string }[];
}

const DAYS_OPTIONS = [7, 14, 30];

export default function BenchmarkPage({
  type,
  title,
  description,
  metricKeys = [],
  trendMetrics = [],
}: Props) {
  const [days, setDays] = useState(7);
  const { data: results, isLoading: loadingResults } = useBenchmarkResults(type, 50);
  const { data: trends, isLoading: loadingTrends } = useBenchmarkTrends(type, days);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          {description && <p className="text-gray-500 text-sm mt-1">{description}</p>}
        </div>
        <RunButton type={type} />
      </div>

      {/* Score trend */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm text-gray-300">Score Trend</h3>
          <div className="flex gap-1">
            {DAYS_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-2 py-1 text-xs rounded ${
                  days === d
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
        {loadingTrends ? (
          <div className="flex items-center gap-2 text-gray-400 h-[200px]">
            <Loader2 size={14} className="animate-spin" /> Loading…
          </div>
        ) : (
          <TrendChart data={trends ?? []} metricKey="score" label="Score" />
        )}
      </div>

      {/* Metric charts */}
      {trendMetrics.length > 0 && trends && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trendMetrics.map(({ key, label, color }) => (
            <div key={key} className="card">
              <h3 className="font-semibold text-sm text-gray-300 mb-4">{label}</h3>
              <TrendChart data={trends} metricKey={key} label={label} color={color} />
            </div>
          ))}
        </div>
      )}

      {/* Results table */}
      <div className="card">
        <h3 className="font-semibold text-sm text-gray-300 mb-4">Recent Results</h3>
        {loadingResults ? (
          <div className="flex items-center gap-2 text-gray-400">
            <Loader2 size={14} className="animate-spin" /> Loading…
          </div>
        ) : (
          <ResultsTable results={results ?? []} metricKeys={metricKeys} />
        )}
      </div>
    </div>
  );
}
