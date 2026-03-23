import axios from 'axios'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export async function exportPaperAsPdf(paperId: string): Promise<void> {
  const response = await axios.post(
    `${API}/export/pdf`,
    { paper_id: paperId },
    { responseType: 'blob' }
  )
  const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `paper_${paperId}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}
