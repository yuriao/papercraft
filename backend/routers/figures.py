import uuid
import os
import json
import subprocess
import tempfile
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
import aiofiles

from backend.database import get_db
from backend.models.models import Figure, Panel, DataFile

DATA_DIR = os.getenv("DATA_DIR", "./data")
UPLOADS_DIR = os.path.join(DATA_DIR, "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)

router = APIRouter(prefix="/figures", tags=["figures"])


class CreateFigureRequest(BaseModel):
    paperId: str
    title: str = ""
    legend: str = ""


class UpdateFigureRequest(BaseModel):
    title: Optional[str] = None
    legend: Optional[str] = None
    number: Optional[int] = None


class CreatePanelRequest(BaseModel):
    label: str = "A"
    code: str = ""
    dataFile: Optional[str] = None


class UpdatePanelRequest(BaseModel):
    label: Optional[str] = None
    code: Optional[str] = None
    plotlyData: Optional[list] = None
    plotlyLayout: Optional[dict] = None
    imageUrl: Optional[str] = None


class RunCodeRequest(BaseModel):
    code: str
    language: str = "python"


@router.get("")
async def list_figures(paper_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Figure).where(Figure.paper_id == paper_id).order_by(Figure.number)
    )
    return [f.to_dict() for f in result.scalars().all()]


@router.post("")
async def create_figure(body: CreateFigureRequest, db: AsyncSession = Depends(get_db)):
    # Count existing figures for this paper to get next number
    result = await db.execute(
        select(Figure).where(Figure.paper_id == body.paperId)
    )
    count = len(result.scalars().all())
    figure = Figure(
        id=str(uuid.uuid4()),
        paper_id=body.paperId,
        number=count + 1,
        title=body.title,
        legend=body.legend,
    )
    db.add(figure)
    await db.commit()
    await db.refresh(figure)
    return figure.to_dict()


@router.get("/{figure_id}")
async def get_figure(figure_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Figure).where(Figure.id == figure_id))
    figure = result.scalar_one_or_none()
    if not figure:
        raise HTTPException(status_code=404, detail="Figure not found")
    return figure.to_dict()


@router.patch("/{figure_id}")
async def update_figure(
    figure_id: str, body: UpdateFigureRequest, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Figure).where(Figure.id == figure_id))
    figure = result.scalar_one_or_none()
    if not figure:
        raise HTTPException(status_code=404, detail="Figure not found")
    if body.title is not None:
        figure.title = body.title
    if body.legend is not None:
        figure.legend = body.legend
    if body.number is not None:
        figure.number = body.number
    await db.commit()
    await db.refresh(figure)
    return figure.to_dict()


@router.delete("/{figure_id}")
async def delete_figure(figure_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Figure).where(Figure.id == figure_id))
    figure = result.scalar_one_or_none()
    if not figure:
        raise HTTPException(status_code=404, detail="Figure not found")
    await db.delete(figure)
    await db.commit()
    return {"ok": True}


# ── Panels ────────────────────────────────────────────────────────────────────

@router.post("/{figure_id}/panels")
async def add_panel(
    figure_id: str, body: CreatePanelRequest, db: AsyncSession = Depends(get_db)
):
    panel = Panel(
        id=str(uuid.uuid4()),
        figure_id=figure_id,
        label=body.label,
        code=body.code,
    )
    panel.plotly_data = []
    panel.plotly_layout = {}
    db.add(panel)
    await db.commit()
    await db.refresh(panel)
    return panel.to_dict()


@router.patch("/{figure_id}/panels/{panel_id}")
async def update_panel(
    figure_id: str,
    panel_id: str,
    body: UpdatePanelRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Panel).where(Panel.id == panel_id))
    panel = result.scalar_one_or_none()
    if not panel:
        raise HTTPException(status_code=404, detail="Panel not found")
    if body.label is not None:
        panel.label = body.label
    if body.code is not None:
        panel.code = body.code
    if body.plotlyData is not None:
        panel.plotly_data = body.plotlyData
    if body.plotlyLayout is not None:
        panel.plotly_layout = body.plotlyLayout
    if body.imageUrl is not None:
        panel.image_url = body.imageUrl
    await db.commit()
    await db.refresh(panel)
    return panel.to_dict()


@router.delete("/{figure_id}/panels/{panel_id}")
async def delete_panel(
    figure_id: str, panel_id: str, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Panel).where(Panel.id == panel_id))
    panel = result.scalar_one_or_none()
    if not panel:
        raise HTTPException(status_code=404, detail="Panel not found")
    await db.delete(panel)
    await db.commit()
    return {"ok": True}


@router.post("/{figure_id}/panels/{panel_id}/run")
async def run_panel_code(
    figure_id: str,
    panel_id: str,
    body: RunCodeRequest,
    db: AsyncSession = Depends(get_db),
):
    """Execute Python code in a subprocess and return Plotly JSON."""
    # Build the execution script
    wrapper = f"""
import json, sys
import plotly.graph_objects as go
import plotly.express as px
import pandas as pd
import numpy as np

# User code
{body.code}

# Capture the `fig` variable
if 'fig' in dir():
    print(fig.to_json())
else:
    print(json.dumps({{"data": [], "layout": {{}}}}))
"""

    try:
        with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False) as f:
            f.write(wrapper)
            tmp_path = f.name

        result = subprocess.run(
            ["python3", tmp_path],
            capture_output=True,
            text=True,
            timeout=30,
            cwd=UPLOADS_DIR,
        )
        os.unlink(tmp_path)

        if result.returncode != 0:
            raise HTTPException(
                status_code=400,
                detail=f"Code execution error:\n{result.stderr}",
            )

        output = result.stdout.strip()
        if not output:
            raise HTTPException(status_code=400, detail="Code produced no output. Make sure `fig` is assigned.")

        plotly_json = json.loads(output)

        # Save result to panel
        panel_result = await db.execute(select(Panel).where(Panel.id == panel_id))
        panel = panel_result.scalar_one_or_none()
        if panel:
            panel.code = body.code
            panel.plotly_data = plotly_json.get("data", [])
            panel.plotly_layout = plotly_json.get("layout", {})
            await db.commit()

        return plotly_json

    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=408, detail="Code execution timed out (30s limit)")
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse Plotly output: {e}")


@router.post("/{figure_id}/panels/{panel_id}/upload")
async def upload_data_file(
    figure_id: str,
    panel_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """Upload a data file (CSV, JSON, etc.) for a panel."""
    file_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename or "data.csv")[1]
    stored_name = f"{file_id}{ext}"
    file_path = os.path.join(UPLOADS_DIR, stored_name)

    async with aiofiles.open(file_path, "wb") as f:
        content = await file.read()
        await f.write(content)

    data_file = DataFile(
        id=file_id,
        panel_id=panel_id,
        filename=stored_name,
        original_name=file.filename or stored_name,
        file_path=file_path,
    )
    db.add(data_file)

    # Update panel dataFile reference
    panel_result = await db.execute(select(Panel).where(Panel.id == panel_id))
    panel = panel_result.scalar_one_or_none()
    if panel:
        panel.data_file = stored_name

    await db.commit()
    return {"filename": stored_name, "originalName": file.filename}
