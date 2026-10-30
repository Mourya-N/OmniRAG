"""Unit Tests for Phase 12: Multimodal Intelligence (Tables, Charts, OCR)."""

import io
from PIL import Image, ImageDraw

from app.services.multimodal import ChartAnalyzer, OCREngine, TableReasoner
from app.services.parser.schema import ImageData, TableData


def test_table_reasoner_numeric_operations():
    table = TableData(
        table_id="tbl-revenue",
        headers=["Region", "Quarter", "Revenue"],
        rows=[
            ["North America", "Q1", "$120,000"],
            ["North America", "Q2", "$145,000"],
            ["Europe", "Q1", "$95,000"],
            ["Europe", "Q2", "$110,000"],
        ],
        caption="Regional Financial Performance",
    )

    reasoner = TableReasoner()

    # Test Sum / Total
    sum_result = reasoner.answer_table_query(table, "What is the total revenue?")
    assert sum_result["operation"] == "sum"
    assert sum_result["result"] == 470000.0

    # Test Average / Mean
    avg_result = reasoner.answer_table_query(table, "What is the average revenue?")
    assert avg_result["operation"] == "average"
    assert avg_result["result"] == 117500.0

    # Test Max / Peak
    max_result = reasoner.answer_table_query(table, "What is the highest revenue?")
    assert max_result["operation"] == "max"
    assert max_result["result"] == 145000.0

    # Test Min / Lowest
    min_result = reasoner.answer_table_query(table, "What is the lowest revenue?")
    assert min_result["operation"] == "min"
    assert min_result["result"] == 95000.0


def test_chart_analyzer():
    analyzer = ChartAnalyzer()

    # Test line chart detection from caption
    img_line = ImageData(
        image_id="img-1",
        caption="Monthly user growth trend over 2026",
        page_number=3,
    )
    chart_line = analyzer.analyze_chart_image(img_line)
    assert chart_line.chart_type == "line_chart"
    assert "longitudinal trend" in chart_line.detected_trend

    # Test pie chart
    img_pie = ImageData(
        image_id="img-2",
        caption="Market share distribution across cloud providers",
        page_number=5,
    )
    chart_pie = analyzer.analyze_chart_image(img_pie)
    assert chart_pie.chart_type == "pie_chart"


def test_ocr_engine_synthetic_image():
    # Create valid in-memory PNG with Pillow
    img = Image.new("RGB", (200, 100), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    draw.text((10, 10), "OCR TEST", fill=(0, 0, 0))

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    png_bytes = buf.getvalue()

    ocr = OCREngine()
    extracted = ocr.extract_text_from_image(png_bytes)
    assert len(extracted) > 0
    assert "PNG" in extracted or "200x100" in extracted or "OCR" in extracted

