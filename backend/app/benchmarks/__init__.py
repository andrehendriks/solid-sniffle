from app.benchmarks.nas import NASBenchmark
from app.benchmarks.smb import SMBBenchmark
from app.benchmarks.docker_bench import DockerBenchmark
from app.benchmarks.kubernetes_bench import KubernetesBenchmark
from app.benchmarks.network import NetworkBenchmark

BENCHMARK_REGISTRY = {
    "nas": NASBenchmark,
    "smb": SMBBenchmark,
    "docker": DockerBenchmark,
    "kubernetes": KubernetesBenchmark,
    "network": NetworkBenchmark,
}

BENCHMARK_TYPES = list(BENCHMARK_REGISTRY.keys())
