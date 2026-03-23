import React, { useMemo } from 'react'
import { NodeViewWrapper } from '@tiptap/react'
import { useFigureStore } from '../../store/figureStore'
import { getGridDimensions, getGridCellCount } from '../../lib/figureGrid'
import { renderLatex } from '../../lib/katex'
import type { Panel } from '../../types'

interface PanelCellProps {
  panel: Panel
}

function PanelCell({ panel }: PanelCellProps) {
  const plotly = panel.plotlyJson ? JSON.parse(panel.plotlyJson) : null

  return (
    <div className="panel-cell" style={{ position: 'relative', aspectRatio: '1', border: '1px solid #e5e7eb', borderRadius: 4, overflow: 'hidden', background: '#fafafa' }}>
      <span className="panel-label" style={{ position: 'absolute', top: 4, left: 6, fontWeight: 'bold', fontSize: '0.85rem', zIndex: 2 }}>{panel.label}</span>
      {plotly ? (
        <PlotlyPanel plotlyJson={panel.plotlyJson!} />
      ) : panel.imageUrl ? (
        <img src={panel.imageUrl} alt={panel.label} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af', fontSize: '0.75rem' }}>
          No data
        </div>
      )}
    </div>
  )
}

// Lazy Plotly render
function PlotlyPanel({ plotlyJson }: { plotlyJson: string }) {
  const ref = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    let cancelled = false
    import('plotly.js-dist-min').then((Plotly) => {
      if (ref.current && !cancelled) {
        const fig = JSON.parse(plotlyJson)
        Plotly.newPlot(ref.current, fig.data ?? [], {
          ...(fig.layout ?? {}),
          margin: { t: 30, l: 40, r: 10, b: 40 },
          autosize: true,
        }, { responsive: true, displayModeBar: false })
      }
    })
    return () => { cancelled = true }
  }, [plotlyJson])
  return <div ref={ref} style={{ width: '100%', height: '100%' }} />
}

interface Props {
  node?: { attrs: { figureId: string } }
  // When used standalone (not as TipTap nodeView):
  figureId?: string
  editable?: boolean
  onEdit?: () => void
}

export default function FigurePreview({ node, figureId: propFigureId, editable, onEdit }: Props) {
  const fid = node?.attrs.figureId ?? propFigureId
  const figure = useFigureStore((s) => s.figures.find((f) => f.id === fid))

  const { cols } = useMemo(() => getGridDimensions(figure?.panels.length ?? 0), [figure?.panels.length])
  const totalCells = useMemo(() => getGridCellCount(figure?.panels.length ?? 0), [figure?.panels.length])

  if (!figure) {
    return (
      <NodeViewWrapper>
        <div style={{ padding: '12px', border: '1px dashed #d1d5db', borderRadius: 6, color: '#9ca3af', fontSize: '0.85rem' }}>
          Figure not found
        </div>
      </NodeViewWrapper>
    )
  }

  const legendHtml = renderLatex(figure.legend, false)

  const content = (
    <div
      className="figure-node"
      data-figure-id={figure.id}
      style={{ margin: '1.5em 0', pageBreakInside: 'avoid' }}
    >
      {/* Panel grid */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 4 }}>
        {Array.from({ length: totalCells }).map((_, i) => {
          const panel = figure.panels[i]
          return panel ? (
            <PanelCell key={panel.id} panel={panel} />
          ) : (
            <div key={`empty-${i}`} style={{ aspectRatio: '1', border: '1px dashed #e5e7eb', borderRadius: 4, background: '#f9fafb' }} />
          )
        })}
      </div>

      {/* Caption */}
      <div className="figure-caption" style={{ fontSize: '0.88em', marginTop: '0.5em', color: '#333', fontFamily: 'Georgia, serif' }}>
        <strong>Figure {figure.number}. {figure.title}.</strong>{' '}
        <span dangerouslySetInnerHTML={{ __html: legendHtml }} />
      </div>

      {editable && (
        <button
          onClick={onEdit}
          style={{ marginTop: 6, fontSize: '0.75rem', padding: '2px 8px', border: '1px solid #d1d5db', borderRadius: 4, background: '#f9fafb', cursor: 'pointer' }}
        >
          Edit Figure
        </button>
      )}
    </div>
  )

  // When used as TipTap nodeView, wrap in NodeViewWrapper
  if (node) {
    return <NodeViewWrapper>{content}</NodeViewWrapper>
  }
  return content
}
