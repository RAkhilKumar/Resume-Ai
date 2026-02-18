import { useEffect, useState } from 'react'
import { Users, Search, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { Resume } from '../types/database'
import { CandidateCard } from '../components/candidates/CandidateCard'

export function CandidatesPage() {
  const { user } = useAuth()
  const [resumes, setResumes] = useState<Resume[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all'|'high'|'mid'|'low'>('all')

  useEffect(() => {
    if (!user) return
    supabase.from('resumes').select('*').eq('user_id', user.id).order('match_score',{ascending:false})
      .then(({data})=>{ setResumes(data||[]); setLoading(false) })
  }, [user])

  const filtered = resumes.filter(r => {
    const s = search.toLowerCase()
    const matchSearch = !s || r.candidate_name?.toLowerCase().includes(s) || r.file_name.toLowerCase().includes(s) || r.candidate_email?.toLowerCase().includes(s)
    const matchFilter = filter==='all' || (filter==='high'&&r.match_score>=70) || (filter==='mid'&&r.match_score>=45&&r.match_score<70) || (filter==='low'&&r.match_score<45)
    return matchSearch && matchFilter
  })

  const del = async (id:string) => {
    if (!confirm('Delete this resume?')) return
    await supabase.from('resumes').delete().eq('id',id)
    setResumes(p=>p.filter(r=>r.id!==id))
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">All Candidates</h1>
        <p className="text-slate-400 text-sm mt-0.5">{resumes.length} resumes in database</p>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/>
          <input type="text" value={search} onChange={e=>setSearch(e.target.value)} className="input pl-10" placeholder="Search by name, email..."/>
        </div>
        <div className="flex gap-2">
          {(['all','high','mid','low'] as const).map(f=>(
            <button key={f} onClick={()=>setFilter(f)} className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${filter===f?'bg-brand-500 text-white':'bg-surface-800 text-slate-400 hover:text-white border border-slate-700'}`}>
              {f==='all'?'All':f==='high'?'≥70%':f==='mid'?'45–70%':'<45%'}
            </button>
          ))}
        </div>
      </div>
      {loading
        ? <div className="grid gap-3">{[1,2,3,4].map(i=><div key={i} className="skeleton h-20 rounded-xl"/>)}</div>
        : filtered.length===0
        ? <div className="card flex flex-col items-center justify-center py-20 text-center"><Users size={40} className="text-slate-700 mb-4"/><p className="text-slate-400 font-medium">No candidates found</p><p className="text-slate-600 text-sm mt-1">Upload resumes from the Dashboard</p></div>
        : <div className="grid gap-3">{filtered.map((r,i)=>(
            <div key={r.id} className="relative group">
              <CandidateCard resume={r} rank={i+1}/>
              <button onClick={()=>del(r.id)} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all p-1"><Trash2 size={14}/></button>
            </div>
          ))}</div>
      }
    </div>
  )
}
