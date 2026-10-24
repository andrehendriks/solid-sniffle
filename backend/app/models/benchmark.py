from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from app.database import Base


class BenchmarkResult(Base):
    __tablename__ = "benchmark_results"

    id = Column(Integer, primary_key=True, index=True)
    benchmark_type = Column(String(50), nullable=False, index=True)
    status = Column(String(20), nullable=False, default="success")
    score = Column(Float, nullable=True)
    duration_seconds = Column(Float, nullable=True)
    metrics = Column(JSONB, nullable=False, default=dict)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
