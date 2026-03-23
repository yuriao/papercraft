export interface Panel {
  id: string
  label: string           // 'A', 'B', 'C' ...
  code: string            // Python/JS code generating the viz
  language: 'python' | 'javascript' | 'r'
  dataFile: string | null // uploaded data filename
  plotlyJson: string | null  // serialized Plotly figure JSON
  imageUrl: string | null    // for static image panels
}

export interface Figure {
  id: string
  number: number          // 1, 2, 3 ... (auto-assigned)
  title: string
  legend: string          // full caption text (may contain LaTeX)
  panels: Panel[]
}

export interface Citation {
  figureId: string
  panelLabel?: string     // 'A' → "Figure 1A", undefined → "Figure 1"
}

export interface Paper {
  id: string
  title: string
  authors: string[]
  abstract: string
  content: Record<string, unknown>  // TipTap JSON doc
  figures: Figure[]
  createdAt: string
  updatedAt: string
}

export interface RunCodeRequest {
  code: string
  language: string
  dataFile?: string
}

export interface RunCodeResponse {
  plotlyJson: string
  error?: string
}
