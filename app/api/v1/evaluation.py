"""Evaluation & Benchmarking API Controller."""

from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, require_roles, verify_tenant_boundary
from evaluation.run_evaluation import run_benchmark_on_dataset
from app.models.evaluation import EvaluationDataset, EvaluationResult, EvaluationRun

router = APIRouter(prefix="/evaluation", tags=["Evaluation & Benchmarking"])


@router.post("/run", status_code=status.HTTP_201_CREATED)
async def trigger_evaluation_run(
    dataset_name: str = "golden_qa",
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(verify_tenant_boundary),
    current_user: dict[str, Any] = Depends(require_roles(["Owner", "Admin"])),
) -> dict[str, Any]:
    """Execute reproducible benchmark evaluation across the golden dataset."""
    dataset_file = Path("evaluation/datasets/golden_qa.json")
    if not dataset_file.exists():
        dataset_file = Path(__file__).parents[3] / "evaluation" / "datasets" / "golden_qa.json"

    eval_output = run_benchmark_on_dataset(dataset_file)
    metrics = eval_output["metrics"]

    # Record dataset if not present
    ds_res = await db.execute(select(EvaluationDataset).where(EvaluationDataset.name == dataset_name))
    dataset = ds_res.scalar_one_or_none()
    if not dataset:
        dataset = EvaluationDataset(
            name=dataset_name,
            version="v1.0.0",
            description="Enterprise Multimodal Benchmark Dataset",
            sample_count=metrics["sample_count"],
        )
        db.add(dataset)
        await db.flush()

    run = EvaluationRun(
        dataset_id=dataset.id,
        pipeline_config_json={"retrieval": "hybrid_rrf", "reranker": "bge-reranker-large"},
        status="COMPLETED",
    )
    db.add(run)
    await db.flush()

    result = EvaluationResult(
        run_id=run.id,
        recall_at_5=metrics["recall_at_5"],
        mrr=metrics["mrr"],
        ndcg_at_10=metrics["ndcg_at_10"],
        faithfulness=metrics["faithfulness"],
        citation_accuracy=metrics["citation_accuracy"],
        abstention_accuracy=metrics["abstention_accuracy"],
        latency_p95_ms=metrics["latency_p95_ms"],
        total_cost_usd=metrics["total_cost_usd"],
        details_json=metrics,
    )
    db.add(result)
    await db.commit()

    return {
        "run_id": run.id,
        "dataset_name": dataset.name,
        "metrics": metrics,
        "report_markdown": eval_output["report_markdown"],
    }
