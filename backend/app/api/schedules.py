from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.alert import Schedule
from app.schemas.alert import ScheduleOut, ScheduleCreate, ScheduleUpdate
from app.benchmarks import BENCHMARK_TYPES

router = APIRouter(prefix="/api/schedules", tags=["schedules"])


def _refresh_scheduler(db: Session) -> None:
    """Sync APScheduler with current DB schedule state."""
    try:
        from app.scheduler import sync_schedules
        sync_schedules(db)
    except Exception:
        pass


@router.get("/", response_model=list[ScheduleOut])
def list_schedules(db: Session = Depends(get_db)):
    return db.query(Schedule).all()


@router.post("/", response_model=ScheduleOut, status_code=201)
def create_schedule(body: ScheduleCreate, db: Session = Depends(get_db)):
    if body.benchmark_type not in BENCHMARK_TYPES:
        raise HTTPException(400, f"Unknown benchmark type: {body.benchmark_type}")
    existing = db.query(Schedule).filter(Schedule.benchmark_type == body.benchmark_type).first()
    if existing:
        raise HTTPException(409, f"Schedule for '{body.benchmark_type}' already exists")
    schedule = Schedule(**body.model_dump())
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    _refresh_scheduler(db)
    return schedule


@router.put("/{schedule_id}", response_model=ScheduleOut)
def update_schedule(schedule_id: int, body: ScheduleUpdate, db: Session = Depends(get_db)):
    schedule = db.query(Schedule).get(schedule_id)
    if not schedule:
        raise HTTPException(404)
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(schedule, field, value)
    db.commit()
    db.refresh(schedule)
    _refresh_scheduler(db)
    return schedule


@router.delete("/{schedule_id}", status_code=204)
def delete_schedule(schedule_id: int, db: Session = Depends(get_db)):
    schedule = db.query(Schedule).get(schedule_id)
    if not schedule:
        raise HTTPException(404)
    db.delete(schedule)
    db.commit()
    _refresh_scheduler(db)
