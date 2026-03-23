import React, { useState } from 'react';
import { usePaperStore } from '../../store/paperStore';
import { exportPaperAsPdf } from '../../lib/exportPdf';

const ExportMenu: React.FC = () => {
  const { activePaperId, activePaper } = usePaperStore();
  const [exporting, setExporting] = useState<'pdf' | null>(null);
  const [open, setOpen] = useState(false);

  const handleExportPdf = async () => {
    if (!activePaperId) return;
    setExporting('pdf');
    setOpen(false);
    try {
      await exportPaperAsPdf(activePaperId);
    } catch (e: any) {
      alert(`PDF export failed: ${e.message}`);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={!activePaperId || !!exporting}
        style={{
          background: '#2563eb',
          border: 'none',
          borderRadius: 6,
          color: '#fff',
          padding: '6px 14px',
          cursor: activePaperId ? 'pointer' : 'not-allowed',
          fontSize: 13,
          fontWeight: 500,
          opacity: activePaperId ? 1 : 0.5,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        {exporting ? '⏳ Exporting…' : '⬇ Export'}
        <span style={{ fontSize: 10 }}>▾</span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 4,
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            zIndex: 100,
            minWidth: 180,
            overflow: 'hidden',
          }}
        >
          <button
            onClick={handleExportPdf}
            style={{
              display: 'block',
              width: '100%',
              padding: '10px 16px',
              background: 'transparent',
              border: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: 13,
              color: '#374151',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#f3f4f6';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            }}
          >
            📄 Export as PDF
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
              Compiled via LaTeX
            </div>
          </button>
          <div style={{ borderTop: '1px solid #f3f4f6' }} />
          <div
            style={{
              padding: '10px 16px',
              fontSize: 13,
              color: '#9ca3af',
              cursor: 'not-allowed',
            }}
          >
            🖼 Export as TIF
            <div style={{ fontSize: 11, marginTop: 2 }}>
              Use figure editor for per-figure TIF
            </div>
          </div>
        </div>
      )}

      {open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99,
          }}
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
};

export default ExportMenu;
