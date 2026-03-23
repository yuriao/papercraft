import { Node, mergeAttributes, InputRule } from '@tiptap/core'
import { renderLatex } from '../lib/katex'

export const LatexInline = Node.create({
  name: 'latexInline',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      latex: { default: '' },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-latex-inline]' }]
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-latex-inline': '',
        class: 'latex-inline',
        'data-latex': node.attrs.latex,
      }),
      ['span', { innerHTML: renderLatex(node.attrs.latex, false) }],
    ]
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const dom = document.createElement('span')
      dom.className = 'latex-inline'
      dom.setAttribute('data-latex', node.attrs.latex)
      dom.innerHTML = renderLatex(node.attrs.latex, false)

      dom.addEventListener('click', () => {
        const latex = prompt('Edit LaTeX:', node.attrs.latex)
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

  // Input rule: $...$
  addInputRules() {
    return [
      new InputRule({
        find: /\$([^$]+)\$$/,
        handler: ({ state, range, match }) => {
          const latex = match[1]
          const { tr } = state
          tr.replaceWith(range.from, range.to, this.type.create({ latex }))
        },
      }),
    ]
  },
})
