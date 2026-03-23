import { create } from 'zustand'
import type { Figure, Panel } from '../types'

const PANEL_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

interface FigureState {
  figures: Figure[]

  // Figure CRUD
  addFigure: () => Figure
  updateFigure: (id: string, patch: Partial<Omit<Figure, 'id' | 'panels'>>) => void
  deleteFigure: (id: string) => void
  reorderFigures: (from: number, to: number) => void

  // Panel CRUD
  addPanel: (figureId: string) => Panel
  updatePanel: (figureId: string, panelId: string, patch: Partial<Omit<Panel, 'id'>>) => void
  deletePanel: (figureId: string, panelId: string) => void

  // Selectors
  getFigure: (id: string) => Figure | undefined
  getCitationText: (figureId: string, panelLabel?: string) => string
  getFigureNumber: (figureId: string) => number
}

function nextLabel(panels: Panel[]): string {
  return PANEL_LABELS[panels.length] ?? String(panels.length + 1)
}

function assignNumbers(figures: Figure[]): Figure[] {
  return figures.map((f, i) => ({ ...f, number: i + 1 }))
}

export const useFigureStore = create<FigureState>((set, get) => ({
  figures: [],

  addFigure: () => {
    const newFig: Figure = {
      id: crypto.randomUUID(),
      number: get().figures.length + 1,
      title: 'Untitled Figure',
      legend: '',
      panels: [],
    }
    set((s) => ({ figures: assignNumbers([...s.figures, newFig]) }))
    return newFig
  },

  updateFigure: (id, patch) => {
    set((s) => ({
      figures: s.figures.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    }))
  },

  deleteFigure: (id) => {
    set((s) => ({ figures: assignNumbers(s.figures.filter((f) => f.id !== id)) }))
  },

  reorderFigures: (from, to) => {
    set((s) => {
      const arr = [...s.figures]
      const [item] = arr.splice(from, 1)
      arr.splice(to, 0, item)
      return { figures: assignNumbers(arr) }
    })
  },

  addPanel: (figureId) => {
    const fig = get().figures.find((f) => f.id === figureId)
    const label = fig ? nextLabel(fig.panels) : 'A'
    const panel: Panel = {
      id: crypto.randomUUID(),
      label,
      code: `import plotly.express as px\nimport pandas as pd\n\n# Load data (if uploaded):\n# df = pd.read_csv(data_file_path)\n\n# Create your figure:\nfig = px.scatter(x=[1,2,3], y=[1,4,9], title='Panel ${label}')\n`,
      language: 'python',
      dataFile: null,
      plotlyJson: null,
      imageUrl: null,
    }
    set((s) => ({
      figures: s.figures.map((f) =>
        f.id === figureId ? { ...f, panels: [...f.panels, panel] } : f
      ),
    }))
    return panel
  },

  updatePanel: (figureId, panelId, patch) => {
    set((s) => ({
      figures: s.figures.map((f) =>
        f.id === figureId
          ? {
              ...f,
              panels: f.panels.map((p) => (p.id === panelId ? { ...p, ...patch } : p)),
            }
          : f
      ),
    }))
  },

  deletePanel: (figureId, panelId) => {
    set((s) => ({
      figures: s.figures.map((f) => {
        if (f.id !== figureId) return f
        const panels = f.panels
          .filter((p) => p.id !== panelId)
          .map((p, i) => ({ ...p, label: PANEL_LABELS[i] ?? String(i + 1) }))
        return { ...f, panels }
      }),
    }))
  },

  getFigure: (id) => get().figures.find((f) => f.id === id),

  getCitationText: (figureId, panelLabel) => {
    const fig = get().figures.find((f) => f.id === figureId)
    if (!fig) return '?'
    return panelLabel ? `Figure ${fig.number}${panelLabel}` : `Figure ${fig.number}`
  },

  getFigureNumber: (figureId) => {
    const fig = get().figures.find((f) => f.id === figureId)
    return fig?.number ?? 0
  },
}))
