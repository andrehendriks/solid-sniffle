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

## Synology DSM Deployment (Container Manager)

Deploy via **DSM → Container Manager → Project → Create**.

### Stap 1 — Maak de map aan op je NAS

Open DSM File Station en maak aan:
```
/volume1/docker/homelab-benchmark/
/volume1/docker/homelab-benchmark/postgres/
/volume1/docker/homelab-benchmark/scratch/
```

### Stap 2 — Maak een `.env` bestand aan

Maak `/volume1/docker/homelab-benchmark/.env` aan via File Station of SSH:
```bash
ssh admin@nas-ip
cp /dev/stdin /volume1/docker/homelab-benchmark/.env << 'EOF'
POSTGRES_DB=homelab
POSTGRES_USER=homelab
POSTGRES_PASSWORD=JOUW_WACHTWOORD
SECRET_KEY=JOUW_GEHEIM
FRONTEND_PORT=3000
BACKEND_PORT=8000
SMB_HOST=192.168.1.x          # optioneel
SMB_SHARE=benchmarks           # optioneel
IPERF3_SERVER=                 # optioneel
ALERT_WEBHOOK_URL=             # optioneel
EOF
```

### Stap 3 — Clone de repo naar de NAS via SSH

```bash
ssh admin@NAS-IP
git clone https://github.com/andrehendriks/solid-sniffle.git /volume1/docker/solid-sniffle
mkdir -p /volume1/docker/solid-sniffle/scratch
mkdir -p /volume1/docker/solid-sniffle/kube
```

> De images worden **lokaal gebouwd** op de NAS — geen externe registry (ghcr.io / Docker Hub) nodig voor backend en frontend. Alleen `postgres:15-alpine` wordt van Docker Hub gepulled.

### Stap 4 — Project aanmaken in Container Manager

1. Ga naar **Container Manager → Project → Aanmaken**
2. Geef het project de naam `solid-sniffle`
3. Stel het **pad** in op `/volume1/docker/solid-sniffle`
4. Kies **Bestaand docker-compose.yml gebruiken** → selecteer `docker-compose.synology.yml`
5. Klik **Volgende** → **Gereed**

Container Manager bouwt de backend en frontend lokaal en start:
- `homelab-db` (PostgreSQL)
- `homelab-backend` (FastAPI op poort 8000)
- `homelab-frontend` (nginx op poort 3000)

### Stap 4 — Openen

Open in de browser: `http://NAS-IP:3000`  
API documentatie: `http://NAS-IP:8000/docs`

> **Images worden automatisch bijgewerkt** via GitHub Actions bij elke push naar `main`. Gebruik **Container Manager → Project → Bijwerken** om de nieuwste images te pullen.

---

## Quick Start (lokaal/development)

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

