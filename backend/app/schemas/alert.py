from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ScheduleBase(BaseModel):
    benchmark_type: str
    cron_expression: str
    enabled: bool = True


class ScheduleCreate(ScheduleBase):
    pass


class ScheduleUpdate(BaseModel):
    cron_expression: Optional[str] = None
    enabled: Optional[bool] = None


class ScheduleOut(ScheduleBase):
    id: int
    last_run: Optional[datetime]
    next_run: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AlertBase(BaseModel):
    name: str
    benchmark_type: str
    metric_name: str
    condition: str
    threshold: float
    enabled: bool = True


class AlertCreate(AlertBase):
    pass


class AlertUpdate(BaseModel):
    name: Optional[str] = None
    metric_name: Optional[str] = None
    condition: Optional[str] = None
    threshold: Optional[float] = None
    enabled: Optional[bool] = None


class AlertOut(AlertBase):
    id: int
    last_triggered: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}


class AlertEventOut(BaseModel):
    id: int
    alert_id: int
    metric_value: float
    message: str
    triggered_at: datetime

    model_config = {"from_attributes": True}
