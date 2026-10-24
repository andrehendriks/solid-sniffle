import os
import json
from app.benchmarks.base import BaseBenchmark, BenchmarkResult
from app.config import settings


class NASBenchmark(BaseBenchmark):
    name = "nas"

    def _execute(self, result: BenchmarkResult) -> None:
        path = settings.nas_benchmark_path
        os.makedirs(path, exist_ok=True)

        seq_read = self._fio_test(path, "read", "sequential", "1M", "0", 1024)
        seq_write = self._fio_test(path, "write", "sequential", "1M", "0", 1024)
        rand_read = self._fio_test(path, "randread", "random", "4k", "100", 256)
        rand_write = self._fio_test(path, "randwrite", "random", "4k", "100", 256)

        result.metrics = {
            "seq_read_mbps": seq_read,
            "seq_write_mbps": seq_write,
            "rand_read_iops": rand_read,
            "rand_write_iops": rand_write,
        }

        # Score: weighted combination (sequential bandwidth + IOPS matter most)
        seq_score = self._score_from_range(seq_read, 0, 500) * 0.3 + self._score_from_range(seq_write, 0, 300) * 0.3
        iops_score = self._score_from_range(rand_read, 0, 5000) * 0.2 + self._score_from_range(rand_write, 0, 3000) * 0.2
        result.score = round(seq_score + iops_score, 1)

    def _fio_test(self, path: str, rw: str, label: str, bs: str, iodepth_offset: str, size_mb: int) -> float:
        test_file = os.path.join(path, f"fio_test_{label}.tmp")
        cmd = [
            "fio",
            f"--name={label}",
            f"--filename={test_file}",
            f"--rw={rw}",
            f"--bs={bs}",
            f"--size={size_mb}M",
            "--runtime=10",
            "--time_based",
            "--ioengine=libaio",
            "--iodepth=32",
            "--direct=1",
            "--group_reporting",
            "--output-format=json",
        ]
        rc, stdout, stderr = self._run_cmd(cmd, timeout=60)
        try:
            if rc == 0 and stdout.strip():
                data = json.loads(stdout)
                job = data["jobs"][0]
                if "read" in rw or rw == "randread":
                    bw = job["read"]["bw"] / 1024  # KB/s -> MB/s
                    iops = job["read"]["iops"]
                else:
                    bw = job["write"]["bw"] / 1024
                    iops = job["write"]["iops"]
                return round(iops if "iops" in label.lower() or bs == "4k" else bw, 2)
        except Exception:
            pass
        # Fallback: simple dd-based measurement
        return self._dd_test(path, rw)

    def _dd_test(self, path: str, rw: str) -> float:
        import time
        import shutil
        test_file = os.path.join(path, "dd_test.tmp")
        try:
            if "read" in rw:
                # Write then read
                with open(test_file, "wb") as f:
                    f.write(b"\x00" * (128 * 1024 * 1024))
                start = time.monotonic()
                with open(test_file, "rb") as f:
                    while f.read(1024 * 1024):
                        pass
                elapsed = time.monotonic() - start
                return round(128 / max(elapsed, 0.001), 2)
            else:
                data = b"\x00" * (128 * 1024 * 1024)
                start = time.monotonic()
                with open(test_file, "wb") as f:
                    f.write(data)
                    f.flush()
                    os.fsync(f.fileno())
                elapsed = time.monotonic() - start
                return round(128 / max(elapsed, 0.001), 2)
        finally:
            if os.path.exists(test_file):
                os.remove(test_file)
