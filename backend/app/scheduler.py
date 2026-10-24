from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.database import SessionLocal
from app.models.alert import Schedule

scheduler = BackgroundScheduler(timezone="UTC")


def _run_benchmark_job(benchmark_type: str) -> None:
    from app.api.benchmarks import _run_benchmark_task
    from app.config import settings

    db = SessionLocal()
    try:
        sched = db.query(Schedule).filter(Schedule.benchmark_type == benchmark_type).first()
        if sched:
            sched.last_run = datetime.now(timezone.utc)
            db.commit()
    finally:
        db.close()

    _run_benchmark_task(benchmark_type, __import__("app.config", fromlist=["settings"]).settings.database_url)


def sync_schedules(db: Session) -> None:
    """Reload all schedule jobs from the database."""
    schedules = db.query(Schedule).all()

    # Remove all existing benchmark jobs
    for job in scheduler.get_jobs():
        if job.id.startswith("benchmark_"):
            job.remove()

    for sched in schedules:
        if not sched.enabled:
            continue
        try:
            trigger = CronTrigger.from_crontab(sched.cron_expression)
            scheduler.add_job(
                _run_benchmark_job,
                trigger=trigger,
                args=[sched.benchmark_type],
                id=f"benchmark_{sched.benchmark_type}",
                replace_existing=True,
                misfire_grace_time=300,
            )
        except Exception as exc:
            print(f"Invalid cron expression for {sched.benchmark_type}: {exc}")


def start_scheduler() -> None:
    db = SessionLocal()
    try:
        sync_schedules(db)
    finally:
        db.close()
    if not scheduler.running:
        scheduler.start()


def stop_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)
