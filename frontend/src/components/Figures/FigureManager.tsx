import React from 'react'
import { useFigureStore } from '../../store/figureStore'

interface Props {
  onSelectFigure: (figureId: string) => void
  selectedFigureId: string | null
}

export default function FigureManager({ onSelectFigure, selectedFigureId }: Props) {
  const { figures, addFigure, deleteFigure } = useFigureStore()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280' }}>
          Figures
        </span>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => { const f = addFigure(); onSelectFigure(f.id) }}
          style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 4, border: '1px solid #d1d5db', background: '#f9fafb', cursor: 'pointer' }}
        >
          + New
        </button>
      </div>

      {figures.length === 0 && (
        <div style={{ color: '#9ca3af', fontSize: '0.8rem', padding: '8px 0' }}>No figures yet</div>
      )}

      {figures.map((fig) => (
        <div
          key={fig.id}
          onClick={() => onSelectFigure(fig.id)}
          style={{
            padding: '6px 8px',
            borderRadius: 6,
            border: `1px solid ${selectedFigureId === fig.id ? '#4f8ef7' : '#e5e7eb'}`,
            background: selectedFigureId === fig.id ? '#eff6ff' : '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.1s',
          }}
        >
          <span style={{ fontWeight: 600, fontSize: '0.8rem', color: '#374151', minWidth: 20 }}>
            {fig.number}
          </span>
          <span style={{ flex: 1, fontSize: '0.8rem', color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {fig.title || 'Untitled'}
          </span>
          <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>{fig.panels.length}p</span>
          <button
            onClick={(e) => { e.stopPropagation(); if (confirm('Delete figure?')) deleteFigure(fig.id) }}
            style={{ fontSize: '0.75rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px' }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
