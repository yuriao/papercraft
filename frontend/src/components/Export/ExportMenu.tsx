import React from 'react'
import { usePaperStore } from '../../store/paperStore'
import { exportPaperAsPdf } from '../../lib/exportPdf'

export default function ExportMenu() {
  const { papers, activePaperId } = usePaperStore()
  const activePaper = papers.find((p) => p.id === activePaperId)
  if (!activePaper) return null
  return (
    <button
      onClick={() => exportPaperAsPdf(activePaper.id)}
      style={{ padding: '4px 12px', borderRadius: 4, border: '1px solid #334155', background: '#0f172a', color: '#94a3b8', fontSize: '0.8rem', cursor: 'pointer' }}
    >
      Export PDF
    </button>
  )
}
