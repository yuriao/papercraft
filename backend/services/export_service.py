"""
Export service: PDF via pdflatex, TIF via PIL + Plotly/kaleido.
"""
import os
import math
import json
import tempfile
import subprocess
from pathlib import Path
from typing import Optional

from PIL import Image
import plotly.graph_objects as go
import plotly.io as pio

from services.latex_compiler import doc_to_latex


DATA_DIR = os.getenv("DATA_DIR", "./data")
EXPORTS_DIR = os.path.join(DATA_DIR, "exports")
os.makedirs(EXPORTS_DIR, exist_ok=True)

# Use kaleido for server-side Plotly rendering
pio.kaleido.scope.chromium_args = ("--no-sandbox",)


def export_paper_to_pdf(paper: dict) -> bytes:
    """
    Compile a paper dict to PDF using pdflatex.
    Returns raw PDF bytes.
    """
    latex_source = doc_to_latex(paper)

    with tempfile.TemporaryDirectory() as tmpdir:
        tex_path = os.path.join(tmpdir, "paper.tex")
        pdf_path = os.path.join(tmpdir, "paper.pdf")

        with open(tex_path, "w", encoding="utf-8") as f:
            f.write(latex_source)

        # Run pdflatex twice (for references/labels)
        for _ in range(2):
            result = subprocess.run(
                ["pdflatex", "-interaction=nonstopmode", "-output-directory", tmpdir, tex_path],
                capture_output=True,
                text=True,
                timeout=60,
                cwd=tmpdir,
            )

        if not os.path.exists(pdf_path):
            log_path = tex_path.replace(".tex", ".log")
            log = ""
            if os.path.exists(log_path):
                with open(log_path) as f:
                    log = f.read()[-3000:]
            raise RuntimeError(f"pdflatex failed.\nLog:\n{log}")

        with open(pdf_path, "rb") as f:
            return f.read()


def export_figure_to_tif(figure: dict, dpi: int = 300) -> bytes:
    """
    Render all panels of a figure as individual images using Plotly/kaleido,
    compose them into a near-square grid with PIL, and return TIF bytes.
    """
    panels = figure.get("panels", [])
    n = len(panels)
    if n == 0:
        raise ValueError("Figure has no panels")

    cols = math.ceil(math.sqrt(n))
    rows = math.ceil(n / cols)

    # Panel dimensions in pixels at target DPI
    panel_px = int(3 * dpi)  # 3 inches per panel
    gap_px = int(0.1 * dpi)  # 0.1 inch gap
    label_height = int(0.3 * dpi)  # space for panel label
    legend_height = int(0.6 * dpi)  # space for legend

    total_width = cols * panel_px + (cols - 1) * gap_px
    total_height = rows * (panel_px + label_height) + (rows - 1) * gap_px + legend_height

    canvas = Image.new("RGB", (total_width, total_height), color=(255, 255, 255))

    for idx, panel in enumerate(panels):
        row = idx // cols
        col = idx % cols

        x_offset = col * (panel_px + gap_px)
        y_offset = row * (panel_px + label_height + gap_px)

        panel_img = _render_panel_image(panel, panel_px, panel_px)
        canvas.paste(panel_img, (x_offset, y_offset))

    # Save as TIF
    import io
    buf = io.BytesIO()
    canvas.save(buf, format="TIFF", dpi=(dpi, dpi), compression="tiff_lzw")
    return buf.getvalue()


def _render_panel_image(panel: dict, width: int, height: int) -> Image.Image:
    """Render a single panel to a PIL Image."""
    plotly_data = panel.get("plotlyData", [])
    image_url = panel.get("imageUrl")

    if image_url and os.path.exists(image_url):
        img = Image.open(image_url).convert("RGB")
        img = img.resize((width, height), Image.LANCZOS)
        return img

    if plotly_data:
        fig = go.Figure(
            data=[go.from_json(json.dumps(trace)) if isinstance(trace, dict) else trace
                  for trace in plotly_data],
            layout=panel.get("plotlyLayout", {}),
        )
        img_bytes = pio.to_image(fig, format="png", width=width, height=height, scale=1)
        import io
        return Image.open(io.BytesIO(img_bytes)).convert("RGB")

    # Blank placeholder
    img = Image.new("RGB", (width, height), color=(240, 240, 240))
    return img
