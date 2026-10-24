from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime


class BenchmarkResultOut(BaseModel):
    id: int
    benchmark_type: str
    status: str
    score: Optional[float]
    duration_seconds: Optional[float]
    metrics: dict[str, Any]
    error_message: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class BenchmarkTrend(BaseModel):
    timestamp: datetime
    score: Optional[float]
    metrics: dict[str, Any]


class ScoreSummary(BaseModel):
    benchmark_type: str
    latest_score: Optional[float]
    avg_score_7d: Optional[float]
    run_count_7d: int
    last_run: Optional[datetime]
    trend: str  # "up", "down", "stable", "no_data"


class RunRequest(BaseModel):
    pass
