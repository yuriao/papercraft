import React, { useState, useEffect, useRef } from 'react';
import { renderLatex } from '../../lib/katex';

interface LatexPopoverProps {
  initialLatex: string;
  displayMode?: boolean;
  onConfirm: (latex: string) => void;
  onClose: () => void;
  anchorRect: DOMRect;
}

const LatexPopover: React.FC<LatexPopoverProps> = ({
  initialLatex,
  displayMode = false,
  onConfirm,
  onClose,
  anchorRect,
}) => {
  const [latex, setLatex] = useState(initialLatex);
  const [preview, setPreview] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
    textareaRef.current?.select();
  }, []);

  useEffect(() => {
    setPreview(renderLatex(latex, displayMode));
  }, [latex, displayMode]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onConfirm(latex);
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const top = anchorRect.bottom + window.scrollY + 4;
  const left = Math.min(anchorRect.left + window.scrollX, window.innerWidth - 380);

  return (
    <div
      style={{
        position: 'absolute',
        top,
        left: Math.max(8, left),
        zIndex: 1000,
        background: '#fff',
        border: '1px solid #d1d5db',
        borderRadius: 8,
        boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
        padding: '12px',
        width: 360,
      }}
    >
      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>LaTeX source</div>
      <textarea
        ref={textareaRef}
        value={latex}
        onChange={(e) => setLatex(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={3}
        style={{
          width: '100%',
          fontFamily: 'monospace',
          fontSize: 13,
          border: '1px solid #e5e7eb',
          borderRadius: 4,
          padding: '6px 8px',
          resize: 'vertical',
          boxSizing: 'border-box',
        }}
        placeholder="Enter LaTeX..."
      />
      {preview && (
        <div
          style={{
            marginTop: 8,
            padding: '8px',
            background: '#f9fafb',
            borderRadius: 4,
            overflowX: 'auto',
          }}
          dangerouslySetInnerHTML={{ __html: preview }}
        />
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
        <button
          onClick={onClose}
          style={{
            padding: '4px 12px',
            borderRadius: 4,
            border: '1px solid #d1d5db',
            background: '#fff',
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          Cancel
        </button>
        <button
          onClick={() => onConfirm(latex)}
          style={{
            padding: '4px 12px',
            borderRadius: 4,
            border: 'none',
            background: '#2563eb',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          Apply
        </button>
      </div>
    </div>
  );
};

export default LatexPopover;
