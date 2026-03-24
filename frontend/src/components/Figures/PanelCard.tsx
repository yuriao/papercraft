import React, { useRef, useEffect } from 'react'
import type { Panel } from '../../types'

interface Props {
  panel: Panel
  editable?: boolean
  onClick?: () => void
}

const PanelCard: React.FC<Props> = ({ panel, editable = true, onClick }) => {
  const plotRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!plotRef.current || !panel.plotlyJson) return
    import('plotly.js-dist-min').then((Plotly: any) => {
      if (!plotRef.current) return
      const fig = JSON.parse(panel.plotlyJson!)
      Plotly.react(plotRef.current, fig.data ?? [], fig.layout ?? {}, {
        displayModeBar: false, responsive: true, staticPlot: !editable,
      })
    })
  }, [panel.plotlyJson, editable])

  return (
    <div onClick={onClick} style={{ aspectRatio: '1', border: '1px solid #e5e7eb', borderRadius: 4, background: '#fff', overflow: 'hidden', position: 'relative', cursor: editable ? 'pointer' : 'default' }}>
      <span style={{ position: 'absolute', top: 4, left: 6, fontWeight: 'bold', fontSize: '0.85rem', zIndex: 2 }}>{panel.label}</span>
      {panel.plotlyJson ? (
        <div ref={plotRef} style={{ width: '100%', height: '100%' }} />
      ) : panel.imageUrl ? (
        <img src={panel.imageUrl} alt={panel.label} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af', fontSize: '0.75rem' }}>
          {editable ? 'Click to edit' : 'No data'}
        </div>
      )}
    </div>
  )
}

export default PanelCard
