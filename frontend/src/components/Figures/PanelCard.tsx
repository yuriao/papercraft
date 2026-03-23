import React, { useRef, useEffect } from 'react';
import { Panel } from '../../types';

interface PanelCardProps {
  panel: Panel;
  editable?: boolean;
  onClick?: () => void;
}

const PanelCard: React.FC<PanelCardProps> = ({ panel, editable = true, onClick }) => {
  const plotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!plotRef.current) return;
    if (!panel.plotlyData || panel.plotlyData.length === 0) return;

    // Lazy load Plotly to keep bundle size manageable
    import('plotly.js-dist-min').then((Plotly) => {
      if (plotRef.current) {
        Plotly.react(plotRef.current, panel.plotlyData, panel.plotlyLayout || {}, {
          displayModeBar: false,
          responsive: true,
          staticPlot: !editable,
        });
      }
    });
  }, [panel.plotlyData, panel.plotlyLayout, editable]);

  const hasPlot = panel.plotlyData && panel.plotlyData.length > 0;
  const hasImage = !!panel.imageUrl;

  return (
    <div
      onClick={onClick}
      style={{
        aspectRatio: '1',
        border: '1px solid #e5e7eb',
        borderRadius: 4,
        background: '#fff',
        overflow: 'hidden',
        cursor: editable ? 'pointer' : 'default',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.15s',
      }}
      onMouseEnter={(e) => {
        if (editable)
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 0 2px #2563eb';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
      }}
    >
      {/* Panel label */}
      <div
        style={{
          position: 'absolute',
          top: 4,
          left: 6,
          fontWeight: 700,
          fontSize: 13,
          fontFamily: 'Georgia, serif',
          zIndex: 2,
          background: 'rgba(255,255,255,0.85)',
          borderRadius: 2,
          padding: '0 3px',
        }}
      >
        {panel.label}
      </div>

      {/* Content */}
      {hasPlot && (
        <div
          ref={plotRef}
          style={{ width: '100%', height: '100%', minHeight: 0 }}
        />
      )}
      {!hasPlot && hasImage && (
        <img
          src={panel.imageUrl!}
          alt={`Panel ${panel.label}`}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      )}
      {!hasPlot && !hasImage && (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#9ca3af',
            fontSize: 12,
            textAlign: 'center',
            padding: 8,
          }}
        >
          {editable ? (
            <>
              <span style={{ fontSize: 24 }}>+</span>
              <br />
              Click to edit
            </>
          ) : (
            'No data'
          )}
        </div>
      )}

      {/* Edit overlay on hover */}
      {editable && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'rgba(37,99,235,0.85)',
            color: '#fff',
            fontSize: 11,
            textAlign: 'center',
            padding: '3px 0',
            opacity: 0,
            transition: 'opacity 0.15s',
          }}
          className="panel-edit-btn"
        >
          ✏️ Edit
        </div>
      )}
    </div>
  );
};

export default PanelCard;
