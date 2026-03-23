import React, { useEffect, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Typography from '@tiptap/extension-typography'
import Underline from '@tiptap/extension-underline'
import { LatexInline } from '../../extensions/LatexInline'
import { LatexBlock } from '../../extensions/LatexBlock'
import { FigureNode } from '../../extensions/FigureNode'
import { FigureCitation } from '../../extensions/FigureCitation'
import Toolbar from './Toolbar'

interface Props {
  paperId: string
  initialContent?: Record<string, unknown>
  onSave?: (content: Record<string, unknown>) => void
}

// Debounce helper
function debounce<T extends (...args: any[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>
  return ((...args: any[]) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }) as T
}

export default function PaperEditor({ paperId, initialContent, onSave }: Props) {
  const debouncedSave = useCallback(
    debounce((content: Record<string, unknown>) => {
      onSave?.(content)
    }, 1000),
    [onSave]
  )

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Typography,
      Placeholder.configure({ placeholder: 'Start writing your manuscript…' }),
      LatexInline,
      LatexBlock,
      FigureNode,
      FigureCitation,
    ],
    content: initialContent ?? {
      type: 'doc',
      content: [{ type: 'paragraph' }],
    },
    onUpdate: ({ editor }) => {
      debouncedSave(editor.getJSON() as Record<string, unknown>)
    },
  })

  // Update content when paperId changes
  useEffect(() => {
    if (editor && initialContent) {
      editor.commands.setContent(initialContent)
    }
  }, [paperId])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar editor={editor} />
      <div style={{ flex: 1, overflow: 'auto', padding: '24px 0', background: '#f3f4f6' }}>
        <div className="paper-page">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  )
}
