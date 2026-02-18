import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Briefcase, Sparkles, Trophy, FileText, XCircle, Clock, AlertCircle, Cpu, Server } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useNLP } from '../hooks/useNLP'
import type { Resume } from '../types/database'
import { CandidateCard } from '../components/candidates/CandidateCard'
import { StatCard } from '../components/dashboard/StatCard'

const API = import.meta.env.VITE_NLP_API_URL || 'http://localhost:8000'

export function DashboardPage() {
  const { user } = useAuth()
  const { analyzeResumeFile, analyzing } = useNLP()
  const [files, setFiles] = useState<File[]>([])
  const [jobTitle, setJobTitle] = useState('')
  const [jobDesc, setJobDesc] = useState('')
  const [processing, setProcessing] = useState(false)
  const [resumes, setResumes] = useState<Resume[]>([])
  const [statusMsg, setStatusMsg] = useState('')
  const [nlpOnline, setNlpOnline] = useState<boolean|null>(null)
  const [loading, setLoading] = useState(true)

  // Poll NLP health
  useEffect(() => {
    const check = async () => {
      try {
        const r = await fetch(`${API}/health`, { signal: AbortSignal.timeout(3000) })
        setNlpOnline(r.ok)
      } catch { setNlpOnline(false) }
    }
    check()
    const t = setInterval(check, 8000)
    return () => clearInterval(t)
  }, [])

  // Load resumes
  useEffect(() => {
    if (!user) return
    supabase.from('resumes').select('*').eq('user_id', user.id)
      .order('match_score', { ascending: false })
      .then(({ data }) => { setResumes(data || []); setLoading(false) })
  }, [user])

  const onDrop = useCallback((accepted: File[]) => setFiles(p => [...p, ...accepted]), [])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf':['.pdf'], 'application/msword':['.doc'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':['.docx'], 'text/plain':['.txt'] },
    maxSize: 10*1024*1024,
  })

  const handleAnalyze = async () => {
    if (!files.length || !jobTitle || !jobDesc || !user) return
    setProcessing(true)

    try {
      // Create job posting
      setStatusMsg('Creating job posting...')
      const { data: jp, error: jpErr } = await supabase.from('job_postings')
        .insert({ user_id: user.id, title: jobTitle, description: jobDesc })
        .select().single()
      if (jpErr) throw jpErr

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setStatusMsg(`Uploading ${file.name} (${i+1}/${files.length})...`)

        // Upload file to storage
        const path = `${user.id}/${jp.id}/${Date.now()}_${file.name}`
        const { error: upErr } = await supabase.storage.from('resumes').upload(path, file)
        if (upErr) throw upErr

        // Create DB record
        const { data: rec, error: recErr } = await supabase.from('resumes').insert({
          user_id: user.id, job_posting_id: jp.id,
          file_name: file.name, file_path: path, file_size: file.size,
          status: 'processing', match_score: 0,
          skills_extracted: [], skills_matched: [], skills_missing: [], experience_years: 0,
        }).select().single()
        if (recErr) throw recErr

        // Run NLP
        setStatusMsg(`Analyzing ${file.name} with AI... (${i+1}/${files.length})`)
        const result = await analyzeResumeFile(file, jobDesc, jobTitle)

        if (result) {
          await supabase.from('resumes').update({
            status: 'analyzed',
            candidate_name: result.candidate_name,
            candidate_email: result.candidate_email,
            match_score: result.match_score,
            skills_extracted: result.skills_extracted,
            skills_matched: result.skills_matched,
            skills_missing: result.skills_missing,
            experience_years: result.experience_years,
            education_level: result.education_level,
            summary: result.summary,
            raw_text: result.raw_text,
          }).eq('id', rec.id)
        } else {
          await supabase.from('resumes').update({
            status: 'error',
            summary: 'NLP analysis failed. Check that Python server is running.',
          }).eq('id', rec.id)
        }
      }

      // Reload
      const { data } = await supabase.from('resumes').select('*').eq('user_id', user.id).order('match_score', { ascending: false })
      setResumes(data || [])
      setFiles([])
      setStatusMsg('✅ Analysis complete!')
      setTimeout(() => setStatusMsg(''), 3000)
    } catch (err) {
      setStatusMsg(`❌ Error: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setProcessing(false)
    }
  }

  const analyzed = resumes.filter(r => r.status === 'analyzed')
  const avg = analyzed.length ? Math.round(analyzed.reduce((s,r)=>s+r.match_score,0)/analyzed.length) : null

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">AI Resume Screening</h1>
          <p className="text-slate-400 text-sm mt-0.5">NLP-powered candidate matching & ranking</p>
        </div>
        <div className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border ${nlpOnline?'bg-emerald-500/10 border-emerald-500/20 text-emerald-400':nlpOnline===false?'bg-red-500/10 border-red-500/20 text-red-400':'bg-slate-800 border-slate-700 text-slate-400'}`}>
          <Server size={13}/>
          NLP Server {nlpOnline?'Online':nlpOnline===false?'Offline':'Checking...'}
        </div>
      </div>

      {/* Warning */}
      {nlpOnline===false && (
        <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5"/>
          <div className="text-sm">
            <span className="text-red-400 font-medium">Python NLP server is offline.</span>
            <span className="text-slate-400 ml-1">Double-click <code className="font-mono bg-surface-800 px-1.5 py-0.5 rounded text-amber-300">START_SERVER.bat</code> inside the <code className="font-mono bg-surface-800 px-1 rounded text-slate-300">python-nlp</code> folder.</span>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<FileText size={18}/>} label="Resumes Uploaded" value={resumes.length} color="blue"/>
        <StatCard icon={<Trophy size={18}/>} label="Candidates Ranked" value={analyzed.length} color="amber"/>
        <StatCard icon={<Sparkles size={18}/>} label="Avg Match Score" value={avg!==null?`${avg}%`:'—'} color="purple"/>
        <StatCard icon={<Clock size={18}/>} label="Processing" value={resumes.filter(r=>r.status==='processing').length} color="slate"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left panel */}
        <div className="card p-6 space-y-5">
          <div>
            <h2 className="font-display font-semibold text-white flex items-center gap-2 mb-4"><Upload size={16} className="text-brand-400"/>Upload Resumes</h2>
            <div {...getRootProps()} className={`rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 border-2 border-dashed ${isDragActive?'border-brand-500 bg-brand-500/10':'border-slate-700 hover:border-brand-600 hover:bg-brand-500/5'}`}>
              <input {...getInputProps()}/>
              <div className="w-12 h-12 bg-surface-800 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Upload className={`w-5 h-5 ${isDragActive?'text-brand-400':'text-slate-400'}`}/>
              </div>
              <p className="text-slate-300 font-medium text-sm">{isDragActive?'Drop files here...':'Drag & drop resumes'}</p>
              <p className="text-slate-500 text-xs mt-1">PDF, DOC, DOCX, TXT • Max 10MB</p>
            </div>
            {files.length>0 && (
              <div className="mt-3 space-y-2">
                {files.map((f,i)=>(
                  <div key={i} className="flex items-center gap-3 p-2.5 bg-surface-800 rounded-lg">
                    <FileText size={14} className="text-brand-400 flex-shrink-0"/>
                    <span className="text-sm text-slate-300 truncate flex-1">{f.name}</span>
                    <span className="text-xs text-slate-500">{(f.size/1024).toFixed(0)}kb</span>
                    <button onClick={()=>setFiles(p=>p.filter((_,j)=>j!==i))} className="text-slate-600 hover:text-red-400 transition-colors"><XCircle size={14}/></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="font-display font-semibold text-white flex items-center gap-2 mb-4"><Briefcase size={16} className="text-brand-400"/>Job Description</h2>
            <div className="space-y-3">
              <input type="text" value={jobTitle} onChange={e=>setJobTitle(e.target.value)} className="input" placeholder="Job Title (e.g. UI/UX Design Intern)"/>
              <textarea value={jobDesc} onChange={e=>setJobDesc(e.target.value)} className="input resize-none" rows={5} placeholder="Paste the job description here..."/>
            </div>
          </div>

          {statusMsg && (
            <div className="flex items-center gap-2 text-sm text-brand-400">
              {statusMsg.startsWith('✅')||statusMsg.startsWith('❌')?null:<Cpu size={14} className="animate-pulse"/>}
              {statusMsg}
            </div>
          )}

          <button onClick={handleAnalyze} disabled={!files.length||!jobTitle||!jobDesc||processing||analyzing||!nlpOnline} className="btn-primary w-full flex items-center justify-center gap-2">
            {processing||analyzing
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Analyzing...</>
              : !nlpOnline
              ? <><Server size={16}/>Start Python Server First</>
              : <><Sparkles size={16}/>Analyze & Rank Candidates</>}
          </button>
        </div>

        {/* Leaderboard */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-semibold text-white flex items-center gap-2"><Trophy size={16} className="text-amber-400"/>Candidate Leaderboard</h2>
            {analyzed.length>0 && <span className="badge bg-brand-500/15 text-brand-400 border border-brand-500/20">Ranked by Match</span>}
          </div>
          {loading
            ? <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="skeleton h-16 rounded-xl"/>)}</div>
            : analyzed.length===0
            ? <div className="flex flex-col items-center justify-center h-48 text-center">
                <div className="w-16 h-16 bg-surface-800 rounded-2xl flex items-center justify-center mb-4"><Trophy size={24} className="text-slate-600"/></div>
                <p className="text-slate-400 text-sm font-medium">Upload resumes & analyze</p>
                <p className="text-slate-600 text-xs mt-1">Candidates ranked by match score</p>
              </div>
            : <div className="space-y-3 overflow-y-auto max-h-[520px] pr-1">
                {analyzed.sort((a,b)=>b.match_score-a.match_score).map((r,i)=><CandidateCard key={r.id} resume={r} rank={i+1}/>)}
              </div>
          }
        </div>
      </div>
    </div>
  )
}
