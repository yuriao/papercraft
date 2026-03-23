import React, { useState, useEffect, useRef } from 'react';
import { Editor } from '@tiptap/react';
import { useFigureStore } from '../../store/figureStore';

interface FloatingMenuProps {
  editor: Editor | null;
  onInsertFigure?: () => void;
}

interface Command {
  name: string;
  label: string;
  description: string;
  icon: string;
  execute: () => void;
}

const FloatingMenu: React.FC<FloatingMenuProps> = ({ editor, onInsertFigure }) => {
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const commands: Command[] = [
    {
      name: 'equation',
      label: 'Equation',
      description: 'Insert a LaTeX equation block',
      icon: '∑',
      execute: () => {
        const latex = window.prompt('Enter LaTeX equation:', '\\int_0^\\infty f(x)\\,dx');
        if (latex && editor) {
          editor.chain().focus().deleteRange({
            from: editor.state.selection.$from.pos - query.length - 1,
            to: editor.state.selection.$from.pos,
          }).insertLatexBlock(latex).run();
        }
      },
    },
    {
      name: 'figure',
      label: 'Figure',
      description: 'Insert a figure from the figure manager',
      icon: '📊',
      execute: () => {
        if (editor) {
          editor.chain().focus().deleteRange({
            from: editor.state.selection.$from.pos - query.length - 1,
            to: editor.state.selection.$from.pos,
          }).run();
        }
        onInsertFigure?.();
      },
    },
    {
      name: 'table',
      label: 'Data Table',
      description: 'Insert a CSV-backed data table',
      icon: '📋',
      execute: () => {
        const csv = 'Column 1,Column 2,Column 3\nData 1,Data 2,Data 3';
        if (editor) {
          editor.chain().focus().deleteRange({
            from: editor.state.selection.$from.pos - query.length - 1,
            to: editor.state.selection.$from.pos,
          }).insertTableData(csv, 'Table 1').run();
        }
      },
    },
    {
      name: 'section',
      label: 'Section',
      description: 'Insert an H2 section heading',
      icon: '§',
      execute: () => {
        if (editor) {
          editor.chain().focus().deleteRange({
            from: editor.state.selection.$from.pos - query.length - 1,
            to: editor.state.selection.$from.pos,
          }).toggleHeading({ level: 2 }).run();
        }
      },
    },
    {
      name: 'abstract',
      label: 'Abstract',
      description: 'Insert an abstract block',
      icon: '📄',
      execute: () => {
        if (editor) {
          editor.chain().focus().deleteRange({
            from: editor.state.selection.$from.pos - query.length - 1,
            to: editor.state.selection.$from.pos,
          }).insertContent({
            type: 'blockquote',
            content: [{
              type: 'paragraph',
              content: [{ type: 'text', text: 'Abstract: ' }],
            }],
          }).run();
        }
      },
    },
  ];

  const filtered = commands.filter((c) =>
    query === '' || c.name.includes(query.toLowerCase()) || c.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      const { state } = editor;
      const { from } = state.selection;
      const textBefore = state.doc.textBetween(Math.max(0, from - 50), from, '\n', '\0');
      const slashMatch = textBefore.match(/\/(\w*)$/);

      if (slashMatch) {
        setQuery(slashMatch[1]);
        setSelectedIndex(0);

        // Get cursor position from DOM
        const domSelection = window.getSelection();
        if (domSelection && domSelection.rangeCount > 0) {
          const range = domSelection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          setPosition({
            top: rect.bottom + window.scrollY + 4,
            left: rect.left + window.scrollX,
          });
        }
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    editor.on('update', handleUpdate);
    editor.on('selectionUpdate', handleUpdate);
    return () => {
      editor.off('update', handleUpdate);
      editor.off('selectionUpdate', handleUpdate);
    };
  }, [editor]);

  useEffect(() => {
    if (!visible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!visible || filtered.length === 0) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % filtered.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        filtered[selectedIndex]?.execute();
        setVisible(false);
      } else if (e.key === 'Escape') {
        setVisible(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [visible, filtered, selectedIndex]);

  if (!visible || filtered.length === 0) return null;

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top: position.top,
        left: Math.min(position.left, window.innerWidth - 320),
        zIndex: 1000,
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
        width: 300,
        maxHeight: 300,
        overflowY: 'auto',
      }}
    >
      <div style={{ padding: '4px 0' }}>
        {filtered.map((cmd, i) => (
          <div
            key={cmd.name}
            onClick={() => { cmd.execute(); setVisible(false); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 12px',
              cursor: 'pointer',
              background: i === selectedIndex ? '#eff6ff' : 'transparent',
              borderRadius: 4,
              margin: '2px 4px',
            }}
          >
            <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{cmd.icon}</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{cmd.label}</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>{cmd.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FloatingMenu;
