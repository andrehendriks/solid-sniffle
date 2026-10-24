import time
import json
import socket
from app.benchmarks.base import BaseBenchmark, BenchmarkResult
from app.config import settings


class NetworkBenchmark(BaseBenchmark):
    name = "network"

    def _execute(self, result: BenchmarkResult) -> None:
        ping_ms = self._ping_latency("8.8.8.8")
        dns_ms = self._dns_resolution_time("github.com")
        download_mbps = self._download_speed_test()
        iperf_mbps = self._iperf3_bandwidth()
        port_check = self._port_check_time("github.com", 443)

        result.metrics = {
            "ping_latency_ms": ping_ms,
            "dns_resolution_ms": dns_ms,
            "download_mbps": download_mbps,
            "iperf3_mbps": iperf_mbps,
            "port_443_ms": port_check,
        }

        ping_score = self._score_from_range(ping_ms, 1, 200, invert=True) * 0.25
        dns_score = self._score_from_range(dns_ms, 1, 500, invert=True) * 0.2
        dl_score = self._score_from_range(download_mbps, 0, 1000) * 0.3
        iperf_s = self._score_from_range(iperf_mbps, 0, 1000) * 0.25 if iperf_mbps > 0 else 0
        if iperf_mbps == 0:
            dl_score = self._score_from_range(download_mbps, 0, 1000) * 0.55
        result.score = round(ping_score + dns_score + dl_score + iperf_s, 1)

    def _ping_latency(self, host: str) -> float:
        rc, out, _ = self._run_cmd(["ping", "-c", "5", "-W", "2", host], timeout=20)
        if rc == 0:
            for line in out.splitlines():
                if "avg" in line or "rtt" in line:
                    try:
                        parts = line.split("/")
                        avg = float(parts[-3].split()[-1])
                        return round(avg, 2)
                    except Exception:
                        pass
        return 999.0

    def _dns_resolution_time(self, hostname: str) -> float:
        times = []
        for _ in range(5):
            start = time.monotonic()
            try:
                socket.getaddrinfo(hostname, None)
                times.append((time.monotonic() - start) * 1000)
            except Exception:
                times.append(999.0)
        return round(sum(times) / len(times), 2)

    def _download_speed_test(self) -> float:
        """Measure download speed using a known test endpoint."""
        import urllib.request
        urls = [
            "http://speedtest.tele2.net/10MB.zip",
            "https://speed.hetzner.de/10MB.bin",
        ]
        for url in urls:
            try:
                start = time.monotonic()
                with urllib.request.urlopen(url, timeout=20) as resp:
                    data = resp.read()
                elapsed = time.monotonic() - start
                size_mb = len(data) / (1024 * 1024)
                return round(size_mb / max(elapsed, 0.001) * 8, 2)  # Mbps
            except Exception:
                continue
        return 0.0

    def _iperf3_bandwidth(self) -> float:
        server = settings.iperf3_server
        if not server:
            return 0.0
        rc, out, _ = self._run_cmd(
            ["iperf3", "-c", server, "-t", "5", "-J"],
            timeout=30,
        )
        if rc == 0:
            try:
                data = json.loads(out)
                bps = data["end"]["sum_received"]["bits_per_second"]
                return round(bps / 1_000_000, 2)  # Mbps
            except Exception:
                pass
        return 0.0

    def _port_check_time(self, host: str, port: int) -> float:
        start = time.monotonic()
        try:
            with socket.create_connection((host, port), timeout=5):
                pass
            return round((time.monotonic() - start) * 1000, 2)
        except Exception:
            return 9999.0
