import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import papers, figures, export

# Create tables
Base.metadata.create_all(bind=engine)
os.makedirs(os.getenv("UPLOAD_DIR", "./data/uploads"), exist_ok=True)

app = FastAPI(title="PaperCraft API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(papers.router)
app.include_router(figures.router)
app.include_router(export.router)

@app.get("/")
def root():
    return {"status": "ok", "service": "PaperCraft API"}
