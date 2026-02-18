import { useState } from 'react'

const API = import.meta.env.VITE_NLP_API_URL || 'http://localhost:8000'

export interface NLPResult {
  candidate_name: string | null
  candidate_email: string | null
  skills_extracted: string[]
  skills_matched: string[]
  skills_missing: string[]
  match_score: number
  experience_years: number
  education_level: string | null
  summary: string
  raw_text: string
}

export function useNLP() {
  const [analyzing, setAnalyzing] = useState(false)

  const analyzeResumeFile = async (
    file: File,
    jobDescription: string,
    jobTitle: string,
  ): Promise<NLPResult | null> => {
    setAnalyzing(true)
    try {
      // Send file as multipart/form-data — Python handles text extraction
      const form = new FormData()
      form.append('file', file, file.name)
      form.append('job_description', jobDescription)
      form.append('job_title', jobTitle)

      console.log('[NLP] Sending file:', file.name, 'size:', file.size, 'type:', file.type)

      const res = await fetch(`${API}/analyze-file`, {
        method: 'POST',
        body: form,
        // Do NOT set Content-Type header — browser sets it with boundary automatically
      })

      if (!res.ok) {
        const err = await res.text()
        console.error('[NLP] Server error:', res.status, err)
        return null
      }

      const result = await res.json()
      console.log('[NLP] Result:', result)
      return result as NLPResult
    } catch (err) {
      console.error('[NLP] Fetch error:', err)
      return null
    } finally {
      setAnalyzing(false)
    }
  }

  return { analyzeResumeFile, analyzing }
}
