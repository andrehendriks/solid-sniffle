import time
import subprocess
from abc import ABC, abstractmethod
from typing import Any


class BenchmarkResult:
    def __init__(self):
        self.score: float | None = None
        self.metrics: dict[str, Any] = {}
        self.error: str | None = None
        self.duration: float = 0.0


class BaseBenchmark(ABC):
    name: str = "base"

    def run(self) -> BenchmarkResult:
        result = BenchmarkResult()
        start = time.monotonic()
        try:
            self._execute(result)
        except Exception as exc:
            result.error = str(exc)
        finally:
            result.duration = time.monotonic() - start
        return result

    @abstractmethod
    def _execute(self, result: BenchmarkResult) -> None:
        pass

    @staticmethod
    def _run_cmd(cmd: list[str], timeout: int = 120) -> tuple[int, str, str]:
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        return proc.returncode, proc.stdout, proc.stderr

    @staticmethod
    def _score_from_range(value: float, low: float, high: float, invert: bool = False) -> float:
        """Map value in [low, high] to [0, 100]. invert=True for lower-is-better metrics."""
        if high == low:
            return 50.0
        ratio = (value - low) / (high - low)
        ratio = max(0.0, min(1.0, ratio))
        return round((1.0 - ratio if invert else ratio) * 100, 1)
