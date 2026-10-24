from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from datetime import datetime, timezone, timedelta
from typing import Optional

from app.database import get_db
from app.models.benchmark import BenchmarkResult
from app.schemas.benchmark import BenchmarkResultOut, BenchmarkTrend, ScoreSummary
from app.benchmarks import BENCHMARK_REGISTRY, BENCHMARK_TYPES

router = APIRouter(prefix="/api/benchmarks", tags=["benchmarks"])

_running: set[str] = set()


def _run_benchmark_task(benchmark_type: str, db_url: str) -> None:
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    engine = create_engine(db_url, pool_pre_ping=True)
    Session = sessionmaker(bind=engine)
    db = Session()

    try:
        cls = BENCHMARK_REGISTRY[benchmark_type]
        bench = cls()
        res = bench.run()

        record = BenchmarkResult(
            benchmark_type=benchmark_type,
            status="failure" if res.error else "success",
            score=res.score,
            duration_seconds=res.duration,
            metrics=res.metrics,
            error_message=res.error,
        )
        db.add(record)
        db.commit()

        # Check alerts
        from app.models.alert import Alert, AlertEvent
        alerts = db.query(Alert).filter(Alert.benchmark_type == benchmark_type, Alert.enabled == True).all()
        for alert in alerts:
            value = res.metrics.get(alert.metric_name)
            if value is None:
                continue
            triggered = _check_condition(value, alert.condition, alert.threshold)
            if triggered:
                event = AlertEvent(
                    alert_id=alert.id,
                    metric_value=value,
                    message=f"{alert.name}: {alert.metric_name}={value} {alert.condition} {alert.threshold}",
                )
                db.add(event)
                alert.last_triggered = datetime.now(timezone.utc)
                db.commit()
                _send_webhook(alert, value)
    finally:
        _running.discard(benchmark_type)
        db.close()


def _check_condition(value: float, condition: str, threshold: float) -> bool:
    ops = {">": value > threshold, "<": value < threshold, ">=": value >= threshold, "<=": value <= threshold, "==": value == threshold}
    return ops.get(condition, False)


def _send_webhook(alert, value: float) -> None:
    from app.config import settings
    import requests
    if not settings.alert_webhook_url:
        return
    try:
        requests.post(settings.alert_webhook_url, json={
            "alert": alert.name,
            "benchmark_type": alert.benchmark_type,
            "metric": alert.metric_name,
            "value": value,
            "threshold": alert.threshold,
        }, timeout=5)
    except Exception:
        pass


@router.get("/types")
def get_types():
    return {"types": BENCHMARK_TYPES}


@router.get("/scores", response_model=list[ScoreSummary])
def get_scores(db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)
    summaries = []
    for btype in BENCHMARK_TYPES:
        latest = (
            db.query(BenchmarkResult)
            .filter(BenchmarkResult.benchmark_type == btype, BenchmarkResult.status == "success")
            .order_by(desc(BenchmarkResult.created_at))
            .first()
        )
        week_results = (
            db.query(BenchmarkResult)
            .filter(
                BenchmarkResult.benchmark_type == btype,
                BenchmarkResult.status == "success",
                BenchmarkResult.created_at >= week_ago,
            )
            .all()
        )
        scores = [r.score for r in week_results if r.score is not None]
        avg_score = sum(scores) / len(scores) if scores else None

        trend = "no_data"
        if len(scores) >= 2:
            half = len(scores) // 2
            old_avg = sum(scores[:half]) / half
            new_avg = sum(scores[half:]) / (len(scores) - half)
            if new_avg > old_avg * 1.05:
                trend = "up"
            elif new_avg < old_avg * 0.95:
                trend = "down"
            else:
                trend = "stable"

        summaries.append(ScoreSummary(
            benchmark_type=btype,
            latest_score=latest.score if latest else None,
            avg_score_7d=round(avg_score, 1) if avg_score else None,
            run_count_7d=len(week_results),
            last_run=latest.created_at if latest else None,
            trend=trend,
        ))
    return summaries


@router.get("/{benchmark_type}", response_model=list[BenchmarkResultOut])
def list_results(
    benchmark_type: str,
    limit: int = Query(50, le=500),
    offset: int = 0,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    if benchmark_type not in BENCHMARK_TYPES:
        raise HTTPException(404, f"Unknown benchmark type: {benchmark_type}")
    q = db.query(BenchmarkResult).filter(BenchmarkResult.benchmark_type == benchmark_type)
    if status:
        q = q.filter(BenchmarkResult.status == status)
    return q.order_by(desc(BenchmarkResult.created_at)).offset(offset).limit(limit).all()


@router.get("/{benchmark_type}/latest", response_model=BenchmarkResultOut)
def get_latest(benchmark_type: str, db: Session = Depends(get_db)):
    if benchmark_type not in BENCHMARK_TYPES:
        raise HTTPException(404)
    result = (
        db.query(BenchmarkResult)
        .filter(BenchmarkResult.benchmark_type == benchmark_type)
        .order_by(desc(BenchmarkResult.created_at))
        .first()
    )
    if not result:
        raise HTTPException(404, "No results yet")
    return result


@router.get("/{benchmark_type}/trend", response_model=list[BenchmarkTrend])
def get_trend(
    benchmark_type: str,
    days: int = Query(7, le=90),
    db: Session = Depends(get_db),
):
    if benchmark_type not in BENCHMARK_TYPES:
        raise HTTPException(404)
    since = datetime.now(timezone.utc) - timedelta(days=days)
    results = (
        db.query(BenchmarkResult)
        .filter(
            BenchmarkResult.benchmark_type == benchmark_type,
            BenchmarkResult.status == "success",
            BenchmarkResult.created_at >= since,
        )
        .order_by(BenchmarkResult.created_at)
        .all()
    )
    return [BenchmarkTrend(timestamp=r.created_at, score=r.score, metrics=r.metrics) for r in results]


@router.post("/{benchmark_type}/run", status_code=202)
def run_benchmark(benchmark_type: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    if benchmark_type not in BENCHMARK_TYPES:
        raise HTTPException(404, f"Unknown benchmark type: {benchmark_type}")
    if benchmark_type in _running:
        raise HTTPException(409, f"Benchmark '{benchmark_type}' is already running")
    _running.add(benchmark_type)
    from app.config import settings
    background_tasks.add_task(_run_benchmark_task, benchmark_type, settings.database_url)
    return {"status": "started", "benchmark_type": benchmark_type}


@router.get("/{benchmark_type}/running")
def is_running(benchmark_type: str):
    return {"running": benchmark_type in _running}


@router.get("/result/{result_id}", response_model=BenchmarkResultOut)
def get_result(result_id: int, db: Session = Depends(get_db)):
    r = db.query(BenchmarkResult).get(result_id)
    if not r:
        raise HTTPException(404)
    return r
