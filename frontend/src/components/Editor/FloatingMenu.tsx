import React, { useState } from 'react'
import type { Editor } from '@tiptap/react'
import { useFigureStore } from '../../store/figureStore'

interface Props { editor: Editor | null }

export default function FloatingMenu({ editor }: Props) {
  const addFigure = useFigureStore((s) => s.addFigure)
  const [open, setOpen] = useState(false)
  if (!editor) return null

  const commands = [
    { label: '∑ Equation', action: () => { const l = prompt('LaTeX:'); if (l) (editor.chain().focus() as any).insertLatexBlock(l).run() } },
    { label: '📊 Figure',  action: () => { const f = addFigure(); (editor.chain().focus() as any).insertFigure(f.id).run() } },
    { label: 'H2 Section', action: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: 'H3 Subsection', action: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
  ]

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={() => setOpen(!open)} style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #d1d5db', fontSize: '0.8rem', cursor: 'pointer' }}>
        / Commands
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 50, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', minWidth: 180 }}>
          {commands.map((item) => (
            <button key={item.label} onClick={() => { item.action(); setOpen(false) }}
              style={{ display: 'block', width: '100%', padding: '8px 12px', textAlign: 'left', border: 'none', background: 'transparent', fontSize: '0.85rem', cursor: 'pointer' }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#f3f4f6')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
