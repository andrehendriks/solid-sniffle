import time
import json
from app.benchmarks.base import BaseBenchmark, BenchmarkResult
from app.config import settings


class KubernetesBenchmark(BaseBenchmark):
    name = "kubernetes"

    def _kubectl(self, args: list[str], timeout: int = 30) -> tuple[int, str, str]:
        cmd = ["kubectl"]
        if settings.k8s_kubeconfig:
            cmd += ["--kubeconfig", settings.k8s_kubeconfig]
        cmd += args
        return self._run_cmd(cmd, timeout=timeout)

    def _execute(self, result: BenchmarkResult) -> None:
        rc, out, err = self._kubectl(["version", "--client", "--output=json"], timeout=10)
        if rc != 0:
            raise RuntimeError(f"kubectl not available: {err.strip()}")

        cluster_info = self._get_cluster_info()
        pod_startup = self._pod_startup_time()
        api_latency = self._api_server_latency()
        node_count, pod_count = self._get_counts()

        result.metrics = {
            "pod_startup_ms": pod_startup,
            "api_latency_ms": api_latency,
            "node_count": node_count,
            "pod_count": pod_count,
            **cluster_info,
        }

        startup_score = self._score_from_range(pod_startup, 500, 30000, invert=True) * 0.5
        latency_score = self._score_from_range(api_latency, 0, 500, invert=True) * 0.5
        result.score = round(startup_score + latency_score, 1)

    def _get_cluster_info(self) -> dict:
        rc, out, _ = self._kubectl(["version", "--output=json"], timeout=10)
        info = {}
        if rc == 0:
            try:
                data = json.loads(out)
                info["server_version"] = data.get("serverVersion", {}).get("gitVersion", "unknown")
            except Exception:
                info["server_version"] = "unknown"
        return info

    def _pod_startup_time(self) -> float:
        pod_name = f"benchmark-pod-{int(time.time())}"
        self._kubectl(["delete", "pod", pod_name, "--ignore-not-found", "--grace-period=0", "--force"])

        start = time.monotonic()
        rc, _, err = self._kubectl([
            "run", pod_name,
            "--image=alpine:latest",
            "--restart=Never",
            "--command", "--", "echo", "ok",
        ], timeout=15)

        if rc != 0:
            return 99999.0

        # Wait for completion
        for _ in range(60):
            rc2, out2, _ = self._kubectl(["get", "pod", pod_name, "-o", "jsonpath={.status.phase}"])
            if rc2 == 0 and out2.strip() in ("Succeeded", "Failed"):
                break
            time.sleep(0.5)

        elapsed = (time.monotonic() - start) * 1000
        self._kubectl(["delete", "pod", pod_name, "--ignore-not-found", "--grace-period=0"])
        return round(elapsed, 1)

    def _api_server_latency(self) -> float:
        latencies = []
        for _ in range(5):
            start = time.monotonic()
            rc, _, _ = self._kubectl(["get", "nodes", "--no-headers"], timeout=10)
            if rc == 0:
                latencies.append((time.monotonic() - start) * 1000)
        return round(sum(latencies) / len(latencies), 1) if latencies else 9999.0

    def _get_counts(self) -> tuple[int, int]:
        node_count = 0
        pod_count = 0
        rc, out, _ = self._kubectl(["get", "nodes", "--no-headers"])
        if rc == 0:
            node_count = len([l for l in out.splitlines() if l.strip()])
        rc, out, _ = self._kubectl(["get", "pods", "--all-namespaces", "--no-headers"])
        if rc == 0:
            pod_count = len([l for l in out.splitlines() if l.strip()])
        return node_count, pod_count
