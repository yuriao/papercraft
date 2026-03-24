import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import papers, figures, export

Base.metadata.create_all(bind=engine)
os.makedirs(os.getenv('UPLOAD_DIR', './data/uploads'), exist_ok=True)

app = FastAPI(title='PaperCraft API', version='0.1.0')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(papers.router)
app.include_router(figures.router)
app.include_router(export.router)

@app.get('/health')
def health():
    return {'status': 'ok'}
