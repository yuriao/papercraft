import React from 'react'
import type { Editor } from '@tiptap/react'
import { useFigureStore } from '../../store/figureStore'

interface Props {
  editor: Editor | null
}

export default function Toolbar({ editor }: Props) {
  const addFigure = useFigureStore((s) => s.addFigure)

  if (!editor) return null

  const btn = (active: boolean, title: string, onClick: () => void, label: string) => (
    <button
      key={title}
      title={title}
      onClick={onClick}
      style={{
        padding: '4px 8px',
        border: '1px solid',
        borderColor: active ? '#4f8ef7' : '#d1d5db',
        borderRadius: 4,
        background: active ? '#eff6ff' : '#fff',
        color: active ? '#1d4ed8' : '#374151',
        fontSize: '0.8rem',
        cursor: 'pointer',
        fontWeight: active ? 600 : 400,
        fontFamily: 'inherit',
      }}
    >
      {label}
    </button>
  )

  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', padding: '6px 12px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb', alignItems: 'center' }}>
      {/* Text */}
      {btn(editor.isActive('bold'), 'Bold', () => editor.chain().focus().toggleBold().run(), 'B')}
      {btn(editor.isActive('italic'), 'Italic', () => editor.chain().focus().toggleItalic().run(), 'I')}
      {btn(editor.isActive('underline'), 'Underline', () => editor.chain().focus().toggleUnderline().run(), 'U')}
      {btn(editor.isActive('strike'), 'Strikethrough', () => editor.chain().focus().toggleStrike().run(), 'S̶')}

      <div style={{ width: 1, background: '#e5e7eb', alignSelf: 'stretch', margin: '0 4px' }} />

      {/* Headings */}
      {btn(editor.isActive('heading', { level: 1 }), 'Title (H1)', () => editor.chain().focus().toggleHeading({ level: 1 }).run(), 'H1')}
      {btn(editor.isActive('heading', { level: 2 }), 'Section (H2)', () => editor.chain().focus().toggleHeading({ level: 2 }).run(), 'H2')}
      {btn(editor.isActive('heading', { level: 3 }), 'Subsection (H3)', () => editor.chain().focus().toggleHeading({ level: 3 }).run(), 'H3')}

      <div style={{ width: 1, background: '#e5e7eb', alignSelf: 'stretch', margin: '0 4px' }} />

      {/* Lists */}
      {btn(editor.isActive('bulletList'), 'Bullet List', () => editor.chain().focus().toggleBulletList().run(), '• List')}
      {btn(editor.isActive('orderedList'), 'Numbered List', () => editor.chain().focus().toggleOrderedList().run(), '1. List')}

      <div style={{ width: 1, background: '#e5e7eb', alignSelf: 'stretch', margin: '0 4px' }} />

      {/* Insert */}
      <button
        title="Insert Math"
        onClick={() => {
          const latex = prompt('Enter LaTeX (display math):')
          if (latex) (editor.chain().focus() as any).insertLatexBlock(latex).run()
        }}
        style={{ padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: 4, background: '#fff', fontSize: '0.8rem', cursor: 'pointer' }}
      >
        ∑ Math
      </button>

      <button
        title="Insert Figure"
        onClick={() => {
          const fig = addFigure()
          ;(editor.chain().focus() as any).insertFigure(fig.id).run()
        }}
        style={{ padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: 4, background: '#fff', fontSize: '0.8rem', cursor: 'pointer' }}
      >
        📊 Figure
      </button>

      <button
        title="Insert Table"
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        style={{ padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: 4, background: '#fff', fontSize: '0.8rem', cursor: 'pointer' }}
      >
        📋 Table
      </button>
    </div>
  )
}
