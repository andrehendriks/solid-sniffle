# HomeLab Benchmark Center

A self-hosted application for automatically benchmarking and monitoring NAS, SMB, Docker, Kubernetes, and Network performance — designed for Synology NAS and home lab environments.

## Features

- **5 Benchmark Modules**: NAS (fio), SMB (smbclient), Docker, Kubernetes (kubectl), Network (ping/iperf3)
- **Historical Trending**: Score and metric charts over 7/14/30 days via Recharts
- **Automated Scheduling**: Cron-based benchmark scheduling with APScheduler
- **Alerting**: Threshold-based alerts with optional webhook delivery
- **Reports**: Aggregated analytics with JSON export
- **Scoring**: 0–100 composite score per benchmark type
- **Dark UI**: React + Tailwind dark-mode dashboard

## Stack

| Layer    | Technology                                           |
|----------|------------------------------------------------------|
| Backend  | FastAPI, SQLAlchemy, Alembic, APScheduler, PostgreSQL |
| Frontend | React, TypeScript, Tailwind CSS, Recharts, React Query |
| Deploy   | Docker Compose (single `docker compose up`)          |

## Quick Start

### 1. Clone and configure

```bash
git clone https://github.com/andrehendriks/solid-sniffle.git
cd solid-sniffle
cp .env.example .env
# Edit .env with your settings (SMB host, iperf3 server, etc.)
```

### 2. Start

```bash
docker compose up -d
```

- Frontend: http://localhost:3000  
- Backend API: http://localhost:8000  
- API docs: http://localhost:8000/docs

### 3. Synology NAS deployment

Mount the benchmark volume to your NAS storage:

```yaml
# In docker-compose.yml, the benchmark_tmp volume maps to NAS storage
# On Synology, edit the volume mount to point to your share:
volumes:
  - /volume1/docker/benchmarks:/tmp/bench
```

## Configuration

Copy `.env.example` to `.env` and edit:

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | postgres://... | PostgreSQL connection string |
| `NAS_BENCHMARK_PATH` | `/tmp/bench` | Path for NAS fio tests |
| `SMB_HOST` | — | SMB/Samba server hostname |
| `SMB_SHARE` | — | SMB share name |
| `SMB_USER` / `SMB_PASSWORD` | — | SMB credentials |
| `IPERF3_SERVER` | — | iperf3 server for bandwidth tests |
| `K8S_KUBECONFIG` | — | Path to kubeconfig (Kubernetes tests) |
| `ALERT_WEBHOOK_URL` | — | Webhook URL for alert notifications |

## Benchmark Details

### NAS
Uses `fio` (falls back to pure-Python dd) to measure sequential read/write throughput (MB/s) and random IOPS.

### SMB
Uses `smbclient` to write and read a 10 MB test file to a network share. Requires `SMB_HOST` and `SMB_SHARE`.

### Docker
Uses the Docker Python SDK to measure container startup time, image pull speed, CPU and memory performance.

### Kubernetes
Uses `kubectl` to measure pod startup time, API server latency, and cluster resource counts.

### Network
Measures ping latency, DNS resolution time, HTTP download speed, and iperf3 bandwidth (if configured).

## API Reference

Full interactive docs at http://localhost:8000/docs.

Key endpoints:
- `POST /api/benchmarks/{type}/run` — trigger a benchmark
- `GET /api/benchmarks/{type}/results` — recent results
- `GET /api/benchmarks/{type}/trend` — time-series trend data
- `GET /api/benchmarks/scores` — latest score summary for all types
- `GET/POST /api/schedules` — manage cron schedules
- `GET/POST /api/alerts` — manage threshold alerts
- `GET /api/reports/summary` — aggregated summary report

