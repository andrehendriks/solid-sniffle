from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.api import benchmarks, schedules, alerts, reports
from app.scheduler import start_scheduler, stop_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduler()
    yield
    stop_scheduler()


app = FastAPI(
    title="HomeLab Benchmark Center",
    description="Self-hosted benchmarking and monitoring for your HomeLab",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(benchmarks.router)
app.include_router(schedules.router)
app.include_router(alerts.router)
app.include_router(reports.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "HomeLab Benchmark Center"}
