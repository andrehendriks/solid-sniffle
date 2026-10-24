from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.alert import Alert, AlertEvent
from app.schemas.alert import AlertOut, AlertCreate, AlertUpdate, AlertEventOut
from app.benchmarks import BENCHMARK_TYPES

router = APIRouter(prefix="/api/alerts", tags=["alerts"])

VALID_CONDITIONS = {">", "<", ">=", "<=", "=="}


@router.get("/", response_model=list[AlertOut])
def list_alerts(db: Session = Depends(get_db)):
    return db.query(Alert).all()


@router.post("/", response_model=AlertOut, status_code=201)
def create_alert(body: AlertCreate, db: Session = Depends(get_db)):
    if body.benchmark_type not in BENCHMARK_TYPES:
        raise HTTPException(400, f"Unknown benchmark type: {body.benchmark_type}")
    if body.condition not in VALID_CONDITIONS:
        raise HTTPException(400, f"Invalid condition. Must be one of: {VALID_CONDITIONS}")
    alert = Alert(**body.model_dump())
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert


@router.put("/{alert_id}", response_model=AlertOut)
def update_alert(alert_id: int, body: AlertUpdate, db: Session = Depends(get_db)):
    alert = db.query(Alert).get(alert_id)
    if not alert:
        raise HTTPException(404)
    if body.condition and body.condition not in VALID_CONDITIONS:
        raise HTTPException(400, f"Invalid condition")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(alert, field, value)
    db.commit()
    db.refresh(alert)
    return alert


@router.delete("/{alert_id}", status_code=204)
def delete_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).get(alert_id)
    if not alert:
        raise HTTPException(404)
    db.delete(alert)
    db.commit()


@router.get("/events", response_model=list[AlertEventOut])
def list_events(
    limit: int = Query(50, le=200),
    alert_id: int | None = None,
    db: Session = Depends(get_db),
):
    q = db.query(AlertEvent)
    if alert_id:
        q = q.filter(AlertEvent.alert_id == alert_id)
    return q.order_by(desc(AlertEvent.triggered_at)).limit(limit).all()
