import { Mark, mergeAttributes } from '@tiptap/core'

export const FigureCitation = Mark.create({
  name: 'figureCitation',
  inclusive: false,

  addAttributes() {
    return {
      figureId: { default: null },
      panelLabel: { default: null },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-figure-citation]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-figure-citation': '',
        class: 'figure-citation',
      }),
      0,
    ]
  },
})
