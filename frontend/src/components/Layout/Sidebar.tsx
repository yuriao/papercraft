import React from 'react';
import { Paper } from '../../types';

interface SidebarProps {
  papers: Paper[];
  activePaperId: string | null;
  onSelectPaper: (id: string) => void;
  onNewPaper: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  papers,
  activePaperId,
  onSelectPaper,
  onNewPaper,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Brand */}
      <div
        style={{
          padding: '16px 14px 12px',
          borderBottom: '1px solid #334155',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.3px' }}>
          📄 PaperCraft
        </span>
      </div>

      {/* New Paper */}
      <div style={{ padding: '8px 10px' }}>
        <button
          onClick={onNewPaper}
          style={{
            width: '100%',
            background: '#2563eb',
            border: 'none',
            borderRadius: 5,
            color: '#fff',
            padding: '7px 0',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          + New Paper
        </button>
      </div>

      {/* Papers list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {papers.length === 0 ? (
          <p
            style={{
              padding: '12px 14px',
              fontSize: 12,
              color: '#64748b',
              margin: 0,
            }}
          >
            No papers yet
          </p>
        ) : (
          <>
            <p
              style={{
                padding: '8px 14px 4px',
                fontSize: 11,
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                margin: 0,
              }}
            >
              Papers
            </p>
            {papers.map((paper) => (
              <div
                key={paper.id}
                onClick={() => onSelectPaper(paper.id)}
                style={{
                  padding: '8px 14px',
                  cursor: 'pointer',
                  background:
                    activePaperId === paper.id ? '#1e40af' : 'transparent',
                  borderLeft:
                    activePaperId === paper.id
                      ? '3px solid #60a5fa'
                      : '3px solid transparent',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => {
                  if (activePaperId !== paper.id)
                    (e.currentTarget as HTMLDivElement).style.background = '#1e3a5f';
                }}
                onMouseLeave={(e) => {
                  if (activePaperId !== paper.id)
                    (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: activePaperId === paper.id ? 600 : 400,
                    color: activePaperId === paper.id ? '#fff' : '#cbd5e1',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {paper.title || 'Untitled Paper'}
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                  {paper.authors.slice(0, 2).join(', ')}
                  {paper.authors.length > 2 && ' et al.'}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '10px 14px',
          borderTop: '1px solid #334155',
          fontSize: 11,
          color: '#475569',
        }}
      >
        PaperCraft v1.0
      </div>
    </div>
  );
};

export default Sidebar;
