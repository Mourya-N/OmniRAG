"""Structured Table Reasoning, Numeric Querying, and Tabular Intelligence."""

import re
from typing import Any

from app.services.parser.schema import TableData


class TableReasoner:
    """Performs deterministic numeric calculations and row filtering over TableData."""

    def answer_table_query(self, table: TableData, query: str) -> dict[str, Any]:
        """Answers aggregate questions (sum, average, max, min, filter) directly over structured cells."""
        q_lower = query.lower()
        headers_lower = [h.lower() for h in table.headers]

        # Detect target numerical column
        target_col_idx = -1
        for idx, h in enumerate(headers_lower):
            if h in q_lower:
                target_col_idx = idx
                break

        # Fallback to last column (common for metrics/totals)
        if target_col_idx == -1 and table.headers:
            target_col_idx = len(table.headers) - 1

        # Extract numeric values
        values: list[float] = []
        for row in table.rows:
            if target_col_idx < len(row):
                raw_val = row[target_col_idx]
                # Clean currency, commas, percentages
                cleaned = re.sub(r"[^\d.-]", "", raw_val)
                try:
                    val = float(cleaned)
                    values.append(val)
                except ValueError:
                    continue

        if not values:
            return {
                "operation": "lookup",
                "result": "No numeric values found in target column",
                "table_id": table.table_id,
            }

        if "total" in q_lower or "sum" in q_lower:
            total_val = sum(values)
            return {
                "operation": "sum",
                "result": round(total_val, 2),
                "column": table.headers[target_col_idx] if target_col_idx >= 0 else "unknown",
                "table_id": table.table_id,
            }
        elif "average" in q_lower or "mean" in q_lower:
            avg_val = sum(values) / len(values)
            return {
                "operation": "average",
                "result": round(avg_val, 2),
                "column": table.headers[target_col_idx] if target_col_idx >= 0 else "unknown",
                "table_id": table.table_id,
            }
        elif "max" in q_lower or "highest" in q_lower or "peak" in q_lower:
            max_val = max(values)
            return {
                "operation": "max",
                "result": max_val,
                "column": table.headers[target_col_idx] if target_col_idx >= 0 else "unknown",
                "table_id": table.table_id,
            }
        elif "min" in q_lower or "lowest" in q_lower:
            min_val = min(values)
            return {
                "operation": "min",
                "result": min_val,
                "column": table.headers[target_col_idx] if target_col_idx >= 0 else "unknown",
                "table_id": table.table_id,
            }

        return {
            "operation": "summary",
            "count": len(values),
            "sum": round(sum(values), 2),
            "avg": round(sum(values) / len(values), 2),
            "table_id": table.table_id,
        }

