import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import FigurePreview from '../components/Figures/FigurePreview'

export const FigureNode = Node.create({
  name: 'figure',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      figureId: { default: null },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-figure-node]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-figure-node': '' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(FigurePreview as any)
  },

  addCommands() {
    return {
      insertFigure:
        (figureId: string) =>
        ({ commands }: { commands: any }) => {
          return commands.insertContent({ type: this.name, attrs: { figureId } })
        },
    } as any
  },
})
