import React from 'react'
import { getGridDimensions, getGridCellCount } from '../../lib/figureGrid'
import type { Panel } from '../../types'

interface Props {
  panels: Panel[]
  onPanelClick?: (panelId: string) => void
  editable?: boolean
}

export default function PanelGrid({ panels, onPanelClick, editable }: Props) {
  const { cols } = getGridDimensions(panels.length)
  const totalCells = getGridCellCount(panels.length)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 6, width: '100%' }}>
      {Array.from({ length: totalCells }).map((_, i) => {
        const panel = panels[i]
        if (!panel) {
          return (
            <div
              key={`empty-${i}`}
              style={{ aspectRatio: '1', border: '1px dashed #d1d5db', borderRadius: 6, background: '#f9fafb' }}
            />
          )
        }
        return (
          <div
            key={panel.id}
            onClick={() => editable && onPanelClick?.(panel.id)}
            style={{
              aspectRatio: '1',
              border: '1px solid #e5e7eb',
              borderRadius: 6,
              background: '#fafafa',
              position: 'relative',
              cursor: editable ? 'pointer' : 'default',
              overflow: 'hidden',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={(e) => { if (editable) (e.currentTarget as HTMLElement).style.borderColor = '#4f8ef7' }}
            onMouseLeave={(e) => { if (editable) (e.currentTarget as HTMLElement).style.borderColor = '#e5e7eb' }}
          >
            <span style={{ position: 'absolute', top: 4, left: 6, fontWeight: 'bold', fontSize: '0.85rem', zIndex: 2 }}>
              {panel.label}
            </span>
            {panel.plotlyJson ? (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>📊 Chart ready</span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af', fontSize: '0.75rem' }}>
                {editable ? 'Click to edit' : 'Empty'}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
