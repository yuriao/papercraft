import React, { useState } from 'react'
import { useFigureStore } from '../../store/figureStore'
import PanelGrid from './PanelGrid'
import PanelEditor from './PanelEditor'
import { exportFigureAsTif } from '../../lib/exportTif'

interface Props {
  figureId: string
  onClose: () => void
}

export default function FigureEditor({ figureId, onClose }: Props) {
  const { getFigure, updateFigure, addPanel, deletePanel } = useFigureStore()
  const figure = useFigureStore((s) => s.figures.find((f) => f.id === figureId))
  const [editingPanelId, setEditingPanelId] = useState<string | null>(null)

  if (!figure) return null

  const editingPanel = editingPanelId ? figure.panels.find((p) => p.id === editingPanelId) : null

  if (editingPanel) {
    return (
      <div style={{ height: '100%' }}>
        <PanelEditor
          figureId={figureId}
          panel={editingPanel}
          onClose={() => setEditingPanelId(null)}
        />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 16, gap: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#374151' }}>Figure {figure.number}</span>
        <div style={{ flex: 1 }} />
        <button onClick={onClose} style={lightBtn}>✕ Close</button>
      </div>

      {/* Title */}
      <input
        value={figure.title}
        onChange={(e) => updateFigure(figureId, { title: e.target.value })}
        placeholder="Figure title…"
        style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.9rem', fontWeight: 500 }}
      />

      {/* Panel grid */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <PanelGrid
          panels={figure.panels}
          editable
          onPanelClick={(panelId) => setEditingPanelId(panelId)}
        />
      </div>

      {/* Panel controls */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={() => addPanel(figureId)} style={{ ...lightBtn, background: '#f0fdf4', borderColor: '#86efac', color: '#166534' }}>
          + Add Panel
        </button>
        {figure.panels.length > 0 && (
          <button
            onClick={() => {
              const last = figure.panels[figure.panels.length - 1]
              if (last && confirm(`Remove panel ${last.label}?`)) deletePanel(figureId, last.id)
            }}
            style={{ ...lightBtn, background: '#fef2f2', borderColor: '#fca5a5', color: '#991b1b' }}
          >
            − Remove Last
          </button>
        )}
      </div>

      {/* Legend */}
      <div>
        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>
          Legend (supports LaTeX with $...$)
        </label>
        <textarea
          value={figure.legend}
          onChange={(e) => updateFigure(figureId, { legend: e.target.value })}
          rows={4}
          placeholder="Figure legend. A. Description of panel A. B. Description of panel B."
          style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.85rem', fontFamily: 'Georgia, serif', resize: 'vertical' }}
        />
      </div>

      {/* Export */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => exportFigureAsTif(figureId, figure.number)}
          style={{ ...lightBtn, fontSize: '0.8rem' }}
        >
          Export TIF (300 DPI)
        </button>
      </div>
    </div>
  )
}

const lightBtn: React.CSSProperties = {
  padding: '4px 10px',
  borderRadius: 6,
  border: '1px solid #d1d5db',
  background: '#f9fafb',
  color: '#374151',
  fontSize: '0.85rem',
  cursor: 'pointer',
}
