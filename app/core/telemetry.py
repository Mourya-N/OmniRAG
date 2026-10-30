"""OpenTelemetry and Prometheus Metrics Instrumentation."""

from prometheus_client import Counter, Gauge, Histogram, generate_latest

# Latency Histograms
RETRIEVAL_LATENCY_HISTOGRAM = Histogram(
    "omnirag_retrieval_latency_seconds",
    "Time spent in hybrid search candidate retrieval and fusion",
    buckets=[0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5],
)

GENERATION_LATENCY_HISTOGRAM = Histogram(
    "omnirag_generation_latency_seconds",
    "Time spent synthesizing grounded answers",
    buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0],
)

# Token & Cost Counters
TOKENS_TOTAL_COUNTER = Counter(
    "omnirag_tokens_total",
    "Total tokens consumed by model type and operation",
    ["model", "token_type"],
)

# Verification & Quality Gauges
FAITHFULNESS_SCORE_GAUGE = Gauge(
    "omnirag_faithfulness_score",
    "Most recent evaluated claim-to-evidence faithfulness score",
)


def get_prometheus_metrics() -> bytes:
    """Export raw Prometheus metrics in text exposition format."""
    return generate_latest()

