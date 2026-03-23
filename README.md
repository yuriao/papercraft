# PaperCraft 📄

> A research manuscript editor with LaTeX math, linked figures, and code-driven panels.

---

## Overview

PaperCraft is a web-based academic paper editor that brings together three things researchers actually need:

1. **Real LaTeX math** — Type `$E = mc^2$` or `$$\int_0^\infty f(x)\,dx$$` directly in the document. KaTeX renders it instantly. Click to edit.
2. **Linked figures** — A figure manager with auto-square panel grids (`ceil(√n) × ceil(√n)`). Every `Figure 1A` citation in your text auto-updates when figures are added, deleted, or reordered.
3. **Code-driven panels** — Each panel has a Monaco-style code editor (Python or JavaScript). Hit Run → Plotly renders the chart → figure updates everywhere in the document simultaneously.
4. **Publication export** — Export the full paper as a PDF (compiled via LaTeX) or individual figures as 300 DPI TIF files suitable for journal submission.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  Browser                                                             │
│  ┌────────────┐  ┌───────────────────────────────┐  ┌────────────┐  │
│  │  Sidebar   │  │   TipTap Editor (PaperEditor)  │  │  Figure    │  │
│  │  (papers)  │  │   ┌─────────────────────────┐  │  │  Manager   │  │
│  │            │  │   │ LaTeX inline/block nodes│  │  │  ┌──────┐  │  │
│  │            │  │   │ Figure nodes (NodeView) │  │  │  │Panel │  │  │
│  │            │  │   │ FigureCitation marks    │  │  │  │Editor│  │  │
│  │            │  │   │ TableData nodes         │  │  │  └──────┘  │  │
│  └────────────┘  │   └─────────────────────────┘  │  └────────────┘  │
│                  │              ↕                   │                  │
│                  │   Zustand stores (figureStore,   │                  │
│                  │   paperStore) — reactive glue    │                  │
│                  └───────────────────────────────┘                   │
└───────────────────────────────┬─────────────────────────────────────┘
                                 │ REST API
┌───────────────────────────────▼─────────────────────────────────────┐
│  FastAPI backend (Python 3.11)                                       │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────────────┐   │
│  │ /papers     │  │ /figures     │  │ /export                   │   │
│  │ CRUD        │  │ CRUD +       │  │ /pdf → pdflatex           │   │
│  │             │  │ /run (exec)  │  │ /figure/tif → PIL compose │   │
│  │             │  │ /upload      │  │ /latex (source download)  │   │
│  └─────────────┘  └──────────────┘  └───────────────────────────┘   │
│                   SQLite (SQLAlchemy async)                           │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Features

| Feature | Details |
|---------|---------|
| **LaTeX math** | `$...$` inline, `$$...$$` display blocks. KaTeX rendering. Click to edit source. Input rules auto-convert typed `$...$`. |
| **Figure system** | Auto-numbered figures. `ceil(√n) × ceil(√n)` panel grid. Panel labels auto-assigned (A, B, C...). |
| **Code panels** | Python (runs on backend) or JavaScript (runs in browser). Plotly output. Attach CSV data files. |
| **Auto-citations** | `FigureCitation` TipTap marks store figureId. When figure numbers change, all citations update automatically. |
| **PDF export** | TipTap doc → LaTeX source → `pdflatex` → PDF download. Full document with figures, math, tables. |
| **TIF export** | Plotly panels rendered via kaleido → PIL compose → 300 DPI TIF. For journal figure submission. |
| **Slash commands** | Type `/` for `equation`, `figure`, `table`, `section`, `abstract`. |
| **Autosave** | Debounced 1s autosave to backend after every edit. |

---

## Quickstart

### With Docker Compose (recommended)

```bash
git clone https://github.com/yuriao/papercraft
cd papercraft
docker-compose up
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API docs: http://localhost:8000/docs

### Without Docker

**Backend:**
```bash
cd backend
pip install -r requirements.txt
# Optional: install pdflatex for PDF export
#   macOS: brew install --cask mactex
#   Ubuntu: apt-get install texlive-full

PYTHONPATH=.. uvicorn backend.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## How to Use

### Writing

1. **Create a paper** — click "+ New Paper" in the sidebar
2. **Write** — the editor uses Georgia serif font, A4-like layout
3. **Add math** — type `$x^2 + y^2 = z^2$` → auto-converts to rendered KaTeX
4. **Slash commands** — type `/` to see all insert options

### Figures

1. **Create a figure** — "+ New" in the Figures panel
2. **Add panels** — click "+ Add Panel" in the figure editor
3. **Write code** — Python code ending with `fig = px.scatter(...)`
4. **Run** — click ▶ Run to render and update
5. **Insert** — click "↩ Insert" to place the figure in the document
6. **Cite** — use 📝 Cite toolbar button or `/citation` to insert a linked "Figure 1A" citation

### Panel code format (Python)

```python
import plotly.express as px
import pandas as pd

df = pd.read_csv('your_data.csv')  # if you uploaded a data file
fig = px.scatter(df, x='x', y='y', color='group', title='Panel A')
# `fig` is automatically captured and returned as Plotly JSON
```

### Export

- **PDF**: Click "⬇ Export" → "Export as PDF" (requires pdflatex)
- **TIF (per figure)**: In the figure editor → "🖼 Export TIF"

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/papers` | List all papers |
| `POST` | `/papers` | Create paper |
| `GET` | `/papers/{id}` | Get paper with figures |
| `PATCH` | `/papers/{id}` | Update paper (content, title, authors) |
| `DELETE` | `/papers/{id}` | Delete paper |
| `GET` | `/figures?paper_id=` | List figures for paper |
| `POST` | `/figures` | Create figure |
| `PATCH` | `/figures/{id}` | Update figure |
| `POST` | `/figures/{id}/panels` | Add panel |
| `PATCH` | `/figures/{id}/panels/{pid}` | Update panel |
| `POST` | `/figures/{id}/panels/{pid}/run` | Execute panel code |
| `POST` | `/figures/{id}/panels/{pid}/upload` | Upload data file |
| `POST` | `/export/pdf` | Export paper as PDF |
| `POST` | `/export/figure/tif` | Export figure as TIF |
| `GET` | `/export/latex/{id}` | Download LaTeX source |

---

## Design Decisions

- **Zustand over Redux** — simpler store for figure/paper state, no boilerplate
- **TipTap over ProseMirror-direct** — React-friendly, great extension API for custom nodes
- **KaTeX over MathJax** — faster, synchronous, better for real-time rendering
- **SQLite + SQLAlchemy async** — zero-config persistence, perfect for single-user desktop use
- **Manual TIFF writer** — browser-side TIF export without dependencies; writes uncompressed 24-bit RGB TIFF IFD manually
- **PIL for figure composition** — PIL's paste() makes panel grid composition straightforward at any DPI
- **`ceil(√n)` grid** — e.g., 4 panels → 2×2, 5 panels → 3×2, 9 panels → 3×3. Always as square as possible.

---

## Tech Stack

**Frontend**: React 18 · TypeScript · Vite · TipTap 2 · KaTeX · Plotly.js · Zustand · html2canvas

**Backend**: FastAPI · SQLAlchemy (async) · SQLite · Plotly + kaleido · Pillow · pdflatex

---

*PaperCraft — write papers like code.*
