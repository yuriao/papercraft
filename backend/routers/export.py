import os, tempfile, subprocess, shutil, math
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from models.models import PaperModel

router = APIRouter(prefix='/export', tags=['export'])
UPLOAD_DIR = os.getenv('UPLOAD_DIR', './data/uploads')

def doc_to_latex(doc: dict) -> str:
    title = doc.get('title', 'Untitled')
    authors = ', '.join(doc.get('authors', []))
    abstract = doc.get('abstract', '')
    return f"""\\documentclass{{article}}
\\usepackage{{amsmath,graphicx,hyperref}}
\\title{{{title}}}
\\author{{{authors}}}
\\begin{{document}}
\\maketitle
\\begin{{abstract}}
{abstract}
\\end{{abstract}}
\\end{{document}}
"""

class ExportPdfRequest(BaseModel):
    paper_id: str

@router.post('/pdf')
def export_pdf(body: ExportPdfRequest, db: Session = Depends(get_db)):
    paper = db.get(PaperModel, body.paper_id)
    if not paper:
        raise HTTPException(404, 'Paper not found')
    latex = doc_to_latex({'title': paper.title, 'authors': paper.authors or [],
                          'abstract': paper.abstract or ''})
    with tempfile.TemporaryDirectory() as tmp:
        tex = os.path.join(tmp, 'paper.tex')
        pdf = os.path.join(tmp, 'paper.pdf')
        with open(tex, 'w') as f:
            f.write(latex)
        r = subprocess.run(
            ['pdflatex', '-interaction=nonstopmode', '-output-directory', tmp, tex],
            capture_output=True, text=True, timeout=60
        )
        if not os.path.exists(pdf):
            raise HTTPException(500, f'pdflatex failed:\n{r.stdout[-2000:]}')
        out = os.path.join(UPLOAD_DIR, f'paper_{body.paper_id}.pdf')
        shutil.copy(pdf, out)
    return FileResponse(out, media_type='application/pdf', filename=f'paper_{body.paper_id}.pdf')
