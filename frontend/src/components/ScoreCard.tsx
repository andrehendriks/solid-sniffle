import clsx from "clsx";
import { TrendingUp, TrendingDown, Minus, HelpCircle } from "lucide-react";
import type { ScoreSummary } from "../types";
import { formatDistanceToNow } from "date-fns";

const LABEL: Record<string, string> = {
  nas: "NAS Storage",
  smb: "SMB Share",
  docker: "Docker",
  kubernetes: "Kubernetes",
  network: "Network",
};

function scoreColor(score: number | null) {
  if (score === null) return "text-gray-500";
  if (score >= 80) return "text-green-400";
  if (score >= 60) return "text-yellow-400";
  return "text-red-400";
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "up") return <TrendingUp size={14} className="text-green-400" />;
  if (trend === "down") return <TrendingDown size={14} className="text-red-400" />;
  if (trend === "stable") return <Minus size={14} className="text-gray-400" />;
  return <HelpCircle size={14} className="text-gray-600" />;
}

interface Props {
  summary: ScoreSummary;
  onClick?: () => void;
}

export default function ScoreCard({ summary, onClick }: Props) {
  const { benchmark_type: type, latest_score, avg_score_7d, run_count_7d, last_run, trend } = summary;

  return (
    <button
      onClick={onClick}
      className={clsx(
        "card text-left w-full hover:border-blue-600 transition-colors",
        onClick && "cursor-pointer"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
          {LABEL[type] ?? type}
        </span>
        <TrendIcon trend={trend} />
      </div>
      <div className={clsx("text-4xl font-bold tabular-nums", scoreColor(latest_score))}>
        {latest_score !== null ? Math.round(latest_score) : "—"}
      </div>
      <div className="text-xs text-gray-500 mt-0.5">/ 100</div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-400">
        <div>
          <span className="block text-gray-600">7d avg</span>
          {avg_score_7d !== null ? Math.round(avg_score_7d) : "—"}
        </div>
        <div>
          <span className="block text-gray-600">runs (7d)</span>
          {run_count_7d}
        </div>
      </div>
      {last_run && (
        <div className="mt-2 text-xs text-gray-600">
          {formatDistanceToNow(new Date(last_run), { addSuffix: true })}
        </div>
      )}
    </button>
  );
}
