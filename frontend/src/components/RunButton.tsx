import { Play, Loader2 } from "lucide-react";
import { useRunBenchmark } from "../hooks/useBenchmarks";
import type { BenchmarkType } from "../types";

interface Props {
  type: BenchmarkType;
}

export default function RunButton({ type }: Props) {
  const { mutate, isPending, isSuccess } = useRunBenchmark(type);

  return (
    <button
      className="btn-primary flex items-center gap-2"
      onClick={() => mutate()}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <Play size={14} />
      )}
      {isPending ? "Running…" : isSuccess ? "Queued!" : "Run Now"}
    </button>
  );
}
