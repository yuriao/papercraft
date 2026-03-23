import katex from 'katex'

export function renderLatex(latex: string, displayMode = false): string {
  try {
    return katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
      strict: false,
      trust: true,
    })
  } catch {
    return `<span style="color:red">[LaTeX error]</span>`
  }
}
