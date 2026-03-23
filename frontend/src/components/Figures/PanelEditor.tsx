import React, { useState, useCallback } from 'react'
import Editor from '@monaco-editor/react'
import { useFigureStore } from '../../store/figureStore'
import type { Panel } from '../../types'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

interface Props {
  figureId: string
  panel: Panel
  onClose: () => void
}

export default function PanelEditor({ figureId, panel, onClose }: Props) {
  const updatePanel = useFigureStore((s) => s.updatePanel)
  const [code, setCode] = useState(panel.code)
  const [language, setLanguage] = useState(panel.language)
  const [label, setLabel] = useState(panel.label)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')
  const [plotlyJson, setPlotlyJson] = useState<string | null>(panel.plotlyJson)

  const runCode = useCallback(async () => {
    setRunning(true)
    setError('')
    try {
      const { data } = await axios.post(`${API}/figures/run-code`, {
        code,
        language,
        data_file: panel.dataFile,
      })
      if (data.error) {
        setError(data.error)
      } else {
        setPlotlyJson(data.plotly_json)
        // Update store → triggers all FigurePreview instances to re-render
        updatePanel(figureId, panel.id, {
          code,
          language,
          label,
          plotlyJson: data.plotly_json,
        })
      }
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? e.message)
    } finally {
      setRunning(false)
    }
  }, [code, language, label, figureId, panel.id, panel.dataFile, updatePanel])

  const save = useCallback(() => {
    updatePanel(figureId, panel.id, { code, language, label })
  }, [code, language, label, figureId, panel.id, updatePanel])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e1e', color: '#fff', borderRadius: 8, overflow: 'hidden' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#252526', borderBottom: '1px solid #3c3c3c' }}>
        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Panel</span>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          style={{ width: 36, padding: '2px 6px', borderRadius: 4, border: '1px solid #555', background: '#3c3c3c', color: '#fff', textAlign: 'center', fontWeight: 'bold' }}
        />
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as any)}
          style={{ padding: '2px 6px', borderRadius: 4, border: '1px solid #555', background: '#3c3c3c', color: '#fff', fontSize: '0.8rem' }}
        >
          <option value="python">Python</option>
          <option value="javascript">JavaScript</option>
        </select>
        <div style={{ flex: 1 }} />
        <button onClick={save} style={darkBtn}>Save</button>
        <button onClick={runCode} disabled={running} style={{ ...darkBtn, background: running ? '#555' : '#4f8ef7' }}>
          {running ? 'Running…' : '▶ Run'}
        </button>
        <button onClick={onClose} style={{ ...darkBtn, background: 'transparent' }}>✕</button>
      </div>

      {/* Split: code left, preview right */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Monaco editor */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <Editor
            height="100%"
            language={language === 'python' ? 'python' : 'javascript'}
            value={code}
            onChange={(v) => setCode(v ?? '')}
            theme="vs-dark"
            options={{ minimap: { enabled: false }, fontSize: 13, lineNumbers: 'on', scrollBeyondLastLine: false, wordWrap: 'on' }}
          />
        </div>

        {/* Plotly preview */}
        <div style={{ width: '45%', borderLeft: '1px solid #3c3c3c', display: 'flex', flexDirection: 'column', background: '#fff' }}>
          <div style={{ padding: '6px 10px', background: '#f3f4f6', borderBottom: '1px solid #e5e7eb', fontSize: '0.75rem', color: '#555' }}>
            Preview
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {plotlyJson ? (
              <PlotlyPreview plotlyJson={plotlyJson} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af', fontSize: '0.85rem' }}>
                Click ▶ Run to generate preview
              </div>
            )}
          </div>
          {error && (
            <div style={{ padding: '8px 10px', background: '#fef2f2', color: '#dc2626', fontSize: '0.75rem', borderTop: '1px solid #fecaca', fontFamily: 'monospace', whiteSpace: 'pre-wrap', maxHeight: 120, overflow: 'auto' }}>
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Bottom: data file */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: '#252526', borderTop: '1px solid #3c3c3c', fontSize: '0.75rem' }}>
        <span style={{ color: '#9ca3af' }}>Data file:</span>
        <span style={{ color: '#ddd' }}>{panel.dataFile ?? 'none'}</span>
        <label style={{ ...darkBtn, cursor: 'pointer' }}>
          Attach
          <input type="file" style={{ display: 'none' }} onChange={async (e) => {
            const file = e.target.files?.[0]
            if (!file) return
            const form = new FormData()
            form.append('file', file)
            const { data } = await axios.post(`${API}/figures/upload-data`, form)
            updatePanel(figureId, panel.id, { dataFile: data.filename })
          }} />
        </label>
      </div>
    </div>
  )
}

function PlotlyPreview({ plotlyJson }: { plotlyJson: string }) {
  const ref = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    let cancelled = false
    import('plotly.js-dist-min').then((Plotly) => {
      if (ref.current && !cancelled) {
        const fig = JSON.parse(plotlyJson)
        Plotly.newPlot(ref.current, fig.data ?? [], { ...(fig.layout ?? {}), autosize: true, margin: { t: 30, l: 40, r: 10, b: 40 } }, { responsive: true })
      }
    })
    return () => { cancelled = true }
  }, [plotlyJson])
  return <div ref={ref} style={{ width: '100%', height: '100%' }} />
}

const darkBtn: React.CSSProperties = {
  padding: '3px 10px',
  borderRadius: 4,
  border: '1px solid #555',
  background: '#3c3c3c',
  color: '#fff',
  fontSize: '0.8rem',
  cursor: 'pointer',
}
