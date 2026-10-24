from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime, timezone, timedelta

from app.database import get_db
from app.models.benchmark import BenchmarkResult
from app.benchmarks import BENCHMARK_TYPES

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/summary")
def summary_report(days: int = Query(30, le=365), db: Session = Depends(get_db)):
    since = datetime.now(timezone.utc) - timedelta(days=days)
    report = {}
    for btype in BENCHMARK_TYPES:
        results = (
            db.query(BenchmarkResult)
            .filter(BenchmarkResult.benchmark_type == btype, BenchmarkResult.created_at >= since)
            .order_by(BenchmarkResult.created_at)
            .all()
        )
        success = [r for r in results if r.status == "success"]
        scores = [r.score for r in success if r.score is not None]
        report[btype] = {
            "total_runs": len(results),
            "successful_runs": len(success),
            "failed_runs": len(results) - len(success),
            "avg_score": round(sum(scores) / len(scores), 1) if scores else None,
            "max_score": round(max(scores), 1) if scores else None,
            "min_score": round(min(scores), 1) if scores else None,
            "latest_score": scores[-1] if scores else None,
        }
    return {"period_days": days, "generated_at": datetime.now(timezone.utc).isoformat(), "benchmarks": report}


@router.get("/{benchmark_type}")
def benchmark_report(
    benchmark_type: str,
    days: int = Query(30, le=365),
    db: Session = Depends(get_db),
):
    since = datetime.now(timezone.utc) - timedelta(days=days)
    results = (
        db.query(BenchmarkResult)
        .filter(BenchmarkResult.benchmark_type == benchmark_type, BenchmarkResult.created_at >= since)
        .order_by(BenchmarkResult.created_at)
        .all()
    )
    success = [r for r in results if r.status == "success"]
    scores = [r.score for r in success if r.score is not None]

    # Aggregate metrics across all successful runs
    metric_keys = set()
    for r in success:
        metric_keys.update(r.metrics.keys())

    metric_stats: dict = {}
    for key in metric_keys:
        vals = [r.metrics[key] for r in success if key in r.metrics and isinstance(r.metrics[key], (int, float))]
        if vals:
            metric_stats[key] = {
                "avg": round(sum(vals) / len(vals), 3),
                "min": round(min(vals), 3),
                "max": round(max(vals), 3),
                "latest": round(vals[-1], 3),
            }

    timeline = [{"timestamp": r.created_at.isoformat(), "score": r.score, "metrics": r.metrics} for r in success[-100:]]

    return {
        "benchmark_type": benchmark_type,
        "period_days": days,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "total_runs": len(results),
        "successful_runs": len(success),
        "score_summary": {
            "avg": round(sum(scores) / len(scores), 1) if scores else None,
            "max": round(max(scores), 1) if scores else None,
            "min": round(min(scores), 1) if scores else None,
        },
        "metric_stats": metric_stats,
        "timeline": timeline,
    }
