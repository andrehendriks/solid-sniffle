import { useNavigate } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";
import { useAllScores } from "../hooks/useBenchmarks";
import ScoreCard from "../components/ScoreCard";

const ROUTES: Record<string, string> = {
  nas: "/nas",
  smb: "/smb",
  docker: "/docker",
  kubernetes: "/kubernetes",
  network: "/network",
};

export default function Dashboard() {
  const { data: scores, isLoading, error } = useAllScores();
  const navigate = useNavigate();

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-gray-500 text-sm mt-1">HomeLab performance overview</p>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-gray-400">
          <Loader2 size={16} className="animate-spin" />
          Loading scores…
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle size={16} />
          Failed to load scores. Is the backend running?
        </div>
      )}

      {scores && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {scores.map((s) => (
            <ScoreCard
              key={s.benchmark_type}
              summary={s}
              onClick={() => navigate(ROUTES[s.benchmark_type])}
            />
          ))}
        </div>
      )}

      {scores && scores.length === 0 && (
        <p className="text-gray-500 text-sm">
          No benchmark results yet. Visit a benchmark page and click "Run Now".
        </p>
      )}
    </div>
  );
}
