import React, { useState, useEffect } from 'react'
import { usePaperStore } from '../../store/paperStore'
import { useFigureStore } from '../../store/figureStore'
import PaperEditor from '../Editor/PaperEditor'
import FigureManager from '../Figures/FigureManager'
import FigureEditor from '../Figures/FigureEditor'
import { exportPaperAsPdf } from '../../lib/exportPdf'

export default function AppShell() {
  const { papers, activePaperId, fetchPapers, createPaper, savePaper, setActive } = usePaperStore()
  const [selectedFigureId, setSelectedFigureId] = useState<string | null>(null)
  const [rightPanel, setRightPanel] = useState<'figures' | 'figure-edit'>('figures')
  const activePaper = usePaperStore((s) => s.papers.find((p) => p.id === s.activePaperId))

  useEffect(() => { fetchPapers() }, [])

  const handleSelectFigure = (figureId: string) => {
    setSelectedFigureId(figureId)
    setRightPanel('figure-edit')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      {/* Top nav */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px', height: 44, background: '#1e293b', color: '#fff', gap: 12, flexShrink: 0 }}>
        <span style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.02em' }}>✍ PaperCraft</span>
        <div style={{ width: 1, background: '#334155', alignSelf: 'stretch', margin: '8px 0' }} />
        {papers.map((p) => (
          <button
            key={p.id}
            onClick={() => setActive(p.id)}
            style={{
              padding: '4px 10px',
              borderRadius: 4,
              border: 'none',
              background: activePaperId === p.id ? '#3b82f6' : 'transparent',
              color: activePaperId === p.id ? '#fff' : '#94a3b8',
              fontSize: '0.8rem',
              cursor: 'pointer',
              maxWidth: 160,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {p.title || 'Untitled'}
          </button>
        ))}
        <button
          onClick={() => createPaper()}
          style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: '0.8rem', cursor: 'pointer' }}
        >
          + New Paper
        </button>
        <div style={{ flex: 1 }} />
        {activePaper && (
          <button
            onClick={() => exportPaperAsPdf(activePaper.id)}
            style={{ padding: '4px 12px', borderRadius: 4, border: '1px solid #334155', background: '#0f172a', color: '#94a3b8', fontSize: '0.8rem', cursor: 'pointer' }}
          >
            Export PDF
          </button>
        )}
      </div>

      {/* Main area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Editor (center) */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {activePaper ? (
            <PaperEditor
              paperId={activePaper.id}
              initialContent={activePaper.content as any}
              onSave={(content) => savePaper(activePaper.id, { content })}
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: '2rem' }}>✍</div>
              <div>No paper open</div>
              <button
                onClick={() => createPaper()}
                style={{ padding: '8px 20px', borderRadius: 6, border: 'none', background: '#3b82f6', color: '#fff', cursor: 'pointer' }}
              >
                Create New Paper
              </button>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div style={{ width: 280, borderLeft: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#fff' }}>
          {/* Panel tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', flexShrink: 0 }}>
            {(['figures', 'figure-edit'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setRightPanel(tab)}
                style={{
                  flex: 1,
                  padding: '8px 4px',
                  border: 'none',
                  borderBottom: `2px solid ${rightPanel === tab ? '#3b82f6' : 'transparent'}`,
                  background: 'transparent',
                  fontSize: '0.75rem',
                  color: rightPanel === tab ? '#1d4ed8' : '#6b7280',
                  cursor: 'pointer',
                  fontWeight: rightPanel === tab ? 600 : 400,
                }}
              >
                {tab === 'figures' ? 'All Figures' : 'Edit Figure'}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
            {rightPanel === 'figures' ? (
              <FigureManager
                onSelectFigure={handleSelectFigure}
                selectedFigureId={selectedFigureId}
              />
            ) : selectedFigureId ? (
              <FigureEditor
                figureId={selectedFigureId}
                onClose={() => setRightPanel('figures')}
              />
            ) : (
              <div style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Select a figure to edit</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
