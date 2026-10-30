"""Evaluation Dataset, Run, and Benchmark Result Models."""

from typing import Any

from sqlalchemy import Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin


class EvaluationDataset(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Versioned benchmark dataset containing gold question-answer-evidence triples."""

    __tablename__ = "evaluation_datasets"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    version: Mapped[str] = mapped_column(String(50), default="v1.0.0", nullable=False)
    description: Mapped[str] = mapped_column(String(255), default="", nullable=False)
    sample_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    samples_json: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list, nullable=False)

    runs: Mapped[list["EvaluationRun"]] = relationship("EvaluationRun", back_populates="dataset")


class EvaluationRun(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Execution instance of an evaluation benchmark with a specific pipeline configuration."""

    __tablename__ = "evaluation_runs"

    dataset_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("evaluation_datasets.id", ondelete="CASCADE"), index=True, nullable=False
    )
    pipeline_config_json: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="COMPLETED", nullable=False)

    dataset: Mapped["EvaluationDataset"] = relationship("EvaluationDataset", back_populates="runs")
    results: Mapped[list["EvaluationResult"]] = relationship(
        "EvaluationResult", back_populates="run", cascade="all, delete-orphan"
    )


class EvaluationResult(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Aggregate and per-sample benchmark metrics for an evaluation run."""

    __tablename__ = "evaluation_results"

    run_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("evaluation_runs.id", ondelete="CASCADE"), index=True, nullable=False
    )
    recall_at_5: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    mrr: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    ndcg_at_10: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    faithfulness: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    citation_accuracy: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    abstention_accuracy: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    latency_p95_ms: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    total_cost_usd: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    details_json: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

    run: Mapped["EvaluationRun"] = relationship("EvaluationRun", back_populates="results")
