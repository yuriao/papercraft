import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from backend.database import get_db
from backend.models.models import Paper

router = APIRouter(prefix="/papers", tags=["papers"])


class CreatePaperRequest(BaseModel):
    title: str = ""
    authors: list[str] = []
    abstract: str = ""
    content: dict = {}


class UpdatePaperRequest(BaseModel):
    title: Optional[str] = None
    authors: Optional[list[str]] = None
    abstract: Optional[str] = None
    content: Optional[dict] = None


@router.get("")
async def list_papers(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Paper).order_by(Paper.created_at.desc()))
    papers = result.scalars().all()
    return [p.to_dict() for p in papers]


@router.post("")
async def create_paper(body: CreatePaperRequest, db: AsyncSession = Depends(get_db)):
    paper = Paper(
        id=str(uuid.uuid4()),
        title=body.title,
        abstract=body.abstract,
    )
    paper.authors = body.authors
    paper.content = body.content or {"type": "doc", "content": []}
    db.add(paper)
    await db.commit()
    await db.refresh(paper)
    return paper.to_dict()


@router.get("/{paper_id}")
async def get_paper(paper_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Paper).where(Paper.id == paper_id))
    paper = result.scalar_one_or_none()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    return paper.to_dict()


@router.patch("/{paper_id}")
async def update_paper(
    paper_id: str, body: UpdatePaperRequest, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Paper).where(Paper.id == paper_id))
    paper = result.scalar_one_or_none()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    if body.title is not None:
        paper.title = body.title
    if body.authors is not None:
        paper.authors = body.authors
    if body.abstract is not None:
        paper.abstract = body.abstract
    if body.content is not None:
        paper.content = body.content
    paper.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(paper)
    return paper.to_dict()


@router.delete("/{paper_id}")
async def delete_paper(paper_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Paper).where(Paper.id == paper_id))
    paper = result.scalar_one_or_none()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    await db.delete(paper)
    await db.commit()
    return {"ok": True}
