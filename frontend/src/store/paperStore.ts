import { create } from 'zustand'
import type { Paper } from '../types'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

interface PaperState {
  papers: Paper[]
  activePaperId: string | null
  loading: boolean

  fetchPapers: () => Promise<void>
  createPaper: () => Promise<Paper>
  savePaper: (id: string, patch: Partial<Paper>) => Promise<void>
  deletePaper: (id: string) => Promise<void>
  setActive: (id: string) => void
  getActivePaper: () => Paper | undefined
}

export const usePaperStore = create<PaperState>((set, get) => ({
  papers: [],
  activePaperId: null,
  loading: false,

  fetchPapers: async () => {
    set({ loading: true })
    try {
      const { data } = await axios.get<Paper[]>(`${API}/papers`)
      set({ papers: data })
    } finally {
      set({ loading: false })
    }
  },

  createPaper: async () => {
    const { data } = await axios.post<Paper>(`${API}/papers`, {
      title: 'Untitled Paper',
      authors: [],
      abstract: '',
      content: { type: 'doc', content: [{ type: 'paragraph' }] },
      figures: [],
    })
    set((s) => ({ papers: [...s.papers, data], activePaperId: data.id }))
    return data
  },

  savePaper: async (id, patch) => {
    await axios.patch(`${API}/papers/${id}`, patch)
    set((s) => ({
      papers: s.papers.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }))
  },

  deletePaper: async (id) => {
    await axios.delete(`${API}/papers/${id}`)
    set((s) => ({ papers: s.papers.filter((p) => p.id !== id) }))
  },

  setActive: (id) => set({ activePaperId: id }),

  getActivePaper: () => {
    const { papers, activePaperId } = get()
    return papers.find((p) => p.id === activePaperId)
  },
}))
