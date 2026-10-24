import os
import time
import tempfile
from app.benchmarks.base import BaseBenchmark, BenchmarkResult
from app.config import settings


class SMBBenchmark(BaseBenchmark):
    name = "smb"

    def _execute(self, result: BenchmarkResult) -> None:
        host = settings.smb_host
        share = settings.smb_share
        username = settings.smb_username or "guest"
        password = settings.smb_password or ""

        if not host or not share:
            raise RuntimeError("SMB_HOST and SMB_SHARE must be configured")

        # Test connection
        rc, out, err = self._run_cmd(
            ["smbclient", f"//{host}/{share}", "-U", f"{username}%{password}", "-c", "ls", "-m", "SMB3"],
            timeout=30,
        )
        if rc != 0:
            raise RuntimeError(f"SMB connection failed: {err.strip()}")

        write_speed = self._smb_write_test(host, share, username, password)
        read_speed = self._smb_read_test(host, share, username, password)
        latency_ms = self._smb_latency_test(host, share, username, password)

        result.metrics = {
            "write_mbps": write_speed,
            "read_mbps": read_speed,
            "latency_ms": latency_ms,
            "host": host,
            "share": share,
        }

        write_score = self._score_from_range(write_speed, 0, 200) * 0.4
        read_score = self._score_from_range(read_speed, 0, 300) * 0.4
        latency_score = self._score_from_range(latency_ms, 0, 100, invert=True) * 0.2
        result.score = round(write_score + read_score + latency_score, 1)

    def _smb_write_test(self, host: str, share: str, user: str, pw: str) -> float:
        size_mb = 64
        data = b"\x00" * (size_mb * 1024 * 1024)
        with tempfile.NamedTemporaryFile(delete=False, suffix=".bin") as tmp:
            tmp.write(data)
            tmp_path = tmp.name

        remote_file = "benchmark_write_test.bin"
        start = time.monotonic()
        rc, _, _ = self._run_cmd(
            ["smbclient", f"//{host}/{share}", "-U", f"{user}%{pw}", "-m", "SMB3",
             "-c", f"put {tmp_path} {remote_file}"],
            timeout=120,
        )
        elapsed = time.monotonic() - start
        os.unlink(tmp_path)

        if rc != 0:
            return 0.0
        return round(size_mb / max(elapsed, 0.001), 2)

    def _smb_read_test(self, host: str, share: str, user: str, pw: str) -> float:
        remote_file = "benchmark_write_test.bin"
        with tempfile.NamedTemporaryFile(delete=False, suffix=".bin") as tmp:
            tmp_path = tmp.name

        start = time.monotonic()
        rc, _, _ = self._run_cmd(
            ["smbclient", f"//{host}/{share}", "-U", f"{user}%{pw}", "-m", "SMB3",
             "-c", f"get {remote_file} {tmp_path}"],
            timeout=120,
        )
        elapsed = time.monotonic() - start

        size_mb = 0
        if os.path.exists(tmp_path):
            size_mb = os.path.getsize(tmp_path) / (1024 * 1024)
            os.unlink(tmp_path)

        if rc != 0 or size_mb == 0:
            return 0.0
        return round(size_mb / max(elapsed, 0.001), 2)

    def _smb_latency_test(self, host: str, share: str, user: str, pw: str) -> float:
        latencies = []
        for _ in range(5):
            start = time.monotonic()
            rc, _, _ = self._run_cmd(
                ["smbclient", f"//{host}/{share}", "-U", f"{user}%{pw}", "-m", "SMB3", "-c", "ls"],
                timeout=10,
            )
            if rc == 0:
                latencies.append((time.monotonic() - start) * 1000)
        return round(sum(latencies) / len(latencies), 2) if latencies else 999.0
