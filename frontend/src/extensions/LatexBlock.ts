import { Node, mergeAttributes, InputRule } from '@tiptap/core'
import { renderLatex } from '../lib/katex'

export const LatexBlock = Node.create({
  name: 'latexBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      latex: { default: '\\sum_{i=1}^{n} x_i' },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-latex-block]' }]
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-latex-block': '',
        class: 'latex-block',
      }),
      ['div', { innerHTML: renderLatex(node.attrs.latex, true) }],
    ]
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const dom = document.createElement('div')
      dom.className = 'latex-block'
      dom.innerHTML = renderLatex(node.attrs.latex, true)

      dom.addEventListener('click', () => {
        const latex = prompt('Edit LaTeX equation:', node.attrs.latex)
        if (latex !== null && typeof getPos === 'function') {
          editor.chain().focus().command(({ tr }) => {
            tr.setNodeMarkup(getPos(), undefined, { latex })
            return true
          }).run()
        }
      })

      return { dom }
    }
  },

  // Input rule: $$...$$ on new line
  addInputRules() {
    return [
      new InputRule({
        find: /^\$\$([^$]*)\$\$$/,
        handler: ({ state, range, match }) => {
          const latex = match[1] || ''
          const { tr } = state
          tr.replaceWith(range.from, range.to, this.type.create({ latex }))
        },
      }),
    ]
  },

  addCommands() {
    return {
      insertLatexBlock:
        (latex = '') =>
        ({ commands }: { commands: any }) => {
          return commands.insertContent({ type: this.name, attrs: { latex } })
        },
    } as any
  },
})
