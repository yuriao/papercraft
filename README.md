# ✍ PaperCraft

A research manuscript editor designed for scientists — Medium-style writing with full LaTeX, code-driven figures, and automatic citation management.

## Features

| Feature | Details |
|---------|---------|
| **Full LaTeX** | Inline `$...$` and display `$$...$$` math rendered live with KaTeX |
| **Code-driven panels** | Each figure panel has a Monaco code editor; run Python → Plotly chart |
| **Auto-square panel grid** | `n` panels → `⌈√n⌉ × ⌈√n⌉` CSS grid, all cells equal size |
| **Auto-updating citations** | Citations like "Figure 1A" update automatically when figures are renumbered |
| **Legend propagation** | Edit a panel → figure legend and all in-text references update |
| **Export PDF** | Full LaTeX compile via pdflatex → proper academic PDF |
| **Export TIF** | 300 DPI TIFF composed from panel renders via PIL + kaleido |

## Architecture

```
Browser (React + TypeScript + Vite)
├── TipTap editor
│   ├── LatexInline / LatexBlock   → KaTeX rendering
│   ├── FigureNode                 → FigurePreview component
│   └── FigureCitation mark        → auto-updating "Figure 1A"
├── Zustand figureStore            → single source of truth
└── Monaco editor + Plotly         → panel code & preview

FastAPI backend (Python 3.11)
├── /papers       → CRUD (SQLite via SQLAlchemy)
├── /figures      → code execution + data file upload
└── /export       → PDF (pdflatex) + TIF (PIL + kaleido)
```

## Quickstart

```bash
git clone https://github.com/yuriao/papercraft
cd papercraft
docker-compose up
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API docs: http://localhost:8000/docs

## Writing a Paper

1. Click **+ New Paper** in the top nav
2. Start writing — headings, lists, bold/italic all supported
3. Type `$E = mc^2$` for inline math, `$$...$$` for display math
4. Click **📊 Figure** in toolbar to insert a figure
5. Use the **right panel** to manage figures and edit panels
6. Write Python code in the panel editor, click **▶ Run** to generate charts

## Panel Code Format

```python
import plotly.express as px
import pandas as pd

# If you uploaded a data file:
df = pd.read_csv(data_file_path)

# Create your figure — must be assigned to `fig`
fig = px.scatter(df, x='col_a', y='col_b', title='My Panel')
```

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/papers` | List all papers |
| POST | `/papers` | Create paper |
| PATCH | `/papers/{id}` | Update paper |
| DELETE | `/papers/{id}` | Delete paper |
| POST | `/figures/run-code` | Execute panel code |
| POST | `/figures/upload-data` | Upload data file |
| POST | `/export/pdf` | Export paper as PDF |
| POST | `/export/figure/tif` | Export figure as TIF |

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, TipTap v2, KaTeX, Monaco Editor, Plotly.js, Zustand, Tailwind CSS
- **Backend**: FastAPI, SQLAlchemy, SQLite, Plotly (kaleido), PIL, pdflatex
- **Infra**: Docker Compose
