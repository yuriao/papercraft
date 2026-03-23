import os
import tempfile
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
import asyncio

from backend.database import get_db
from backend.models.models import Paper, Figure
from backend.services.export_service import export_paper_to_pdf, export_figure_to_tif

router = APIRouter(prefix="/export", tags=["export"])


class ExportPdfRequest(BaseModel):
    paper_id: str


class ExportFigureTifRequest(BaseModel):
    figure_id: str
    dpi: int = 300


@router.post("/pdf")
async def export_pdf(request: ExportPdfRequest, db: AsyncSession = Depends(get_db)):
    """Compile a paper to PDF via LaTeX and return the PDF file."""
    result = await db.execute(select(Paper).where(Paper.id == request.paper_id))
    paper = result.scalar_one_or_none()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    paper_dict = paper.to_dict()

    try:
        # Run in thread pool to avoid blocking the event loop
        loop = asyncio.get_event_loop()
        pdf_bytes = await loop.run_in_executor(None, export_paper_to_pdf, paper_dict)
    except FileNotFoundError:
        raise HTTPException(
            status_code=503,
            detail="pdflatex not found. Install TeX Live: apt-get install texlive-full",
        )
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="paper-{request.paper_id}.pdf"'
        },
    )


@router.post("/figure/tif")
async def export_figure_tif(
    request: ExportFigureTifRequest, db: AsyncSession = Depends(get_db)
):
    """Render a figure's panels and export as TIF at 300 DPI."""
    result = await db.execute(select(Figure).where(Figure.id == request.figure_id))
    figure = result.scalar_one_or_none()
    if not figure:
        raise HTTPException(status_code=404, detail="Figure not found")

    figure_dict = figure.to_dict()

    try:
        loop = asyncio.get_event_loop()
        tif_bytes = await loop.run_in_executor(
            None, lambda: export_figure_to_tif(figure_dict, dpi=request.dpi)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    label = f"figure-{figure.number}"
    return Response(
        content=tif_bytes,
        media_type="image/tiff",
        headers={
            "Content-Disposition": f'attachment; filename="{label}.tif"'
        },
    )


@router.get("/latex/{paper_id}")
async def get_latex_source(paper_id: str, db: AsyncSession = Depends(get_db)):
    """Return the raw LaTeX source for a paper (for debugging/downloading)."""
    from backend.services.latex_compiler import doc_to_latex

    result = await db.execute(select(Paper).where(Paper.id == paper_id))
    paper = result.scalar_one_or_none()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    latex = doc_to_latex(paper.to_dict())
    return Response(
        content=latex,
        media_type="text/plain",
        headers={
            "Content-Disposition": f'attachment; filename="paper-{paper_id}.tex"'
        },
    )
