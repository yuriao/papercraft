from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
import uuid
from database import get_db
from models.models import PaperModel

router = APIRouter(prefix='/papers', tags=['papers'])

class PaperCreate(BaseModel):
    title: str = 'Untitled Paper'
    authors: list = []
    abstract: str = ''
    content: dict = {}
    figures: list = []

class PaperPatch(BaseModel):
    title: Optional[str] = None
    authors: Optional[list] = None
    abstract: Optional[str] = None
    content: Optional[dict] = None
    figures: Optional[list] = None

def to_dict(p):
    return {
        'id': p.id, 'title': p.title, 'authors': p.authors or [],
        'abstract': p.abstract or '', 'content': p.content or {}, 'figures': p.figures or [],
        'createdAt': p.created_at.isoformat() if p.created_at else '',
        'updatedAt': p.updated_at.isoformat() if p.updated_at else ''
    }

@router.get('/')
def list_papers(db: Session = Depends(get_db)):
    return [to_dict(p) for p in db.query(PaperModel).all()]

@router.post('/', status_code=201)
def create_paper(body: PaperCreate, db: Session = Depends(get_db)):
    paper = PaperModel(id=str(uuid.uuid4()), title=body.title, authors=body.authors,
                       abstract=body.abstract, content=body.content, figures=body.figures)
    db.add(paper); db.commit(); db.refresh(paper)
    return to_dict(paper)

@router.get('/{paper_id}')
def get_paper(paper_id: str, db: Session = Depends(get_db)):
    paper = db.get(PaperModel, paper_id)
    if not paper: raise HTTPException(status_code=404, detail='Not found')
    return to_dict(paper)

@router.patch('/{paper_id}')
def update_paper(paper_id: str, body: PaperPatch, db: Session = Depends(get_db)):
    paper = db.get(PaperModel, paper_id)
    if not paper: raise HTTPException(status_code=404, detail='Not found')
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(paper, k, v)
    paper.updated_at = datetime.now(timezone.utc)
    db.commit(); db.refresh(paper)
    return to_dict(paper)

@router.delete('/{paper_id}', status_code=204)
def delete_paper(paper_id: str, db: Session = Depends(get_db)):
    paper = db.get(PaperModel, paper_id)
    if not paper: raise HTTPException(status_code=404, detail='Not found')
    db.delete(paper); db.commit()
