import { useState } from 'react'
import { Mail, Briefcase, ChevronDown, ChevronUp, CheckCircle, XCircle, GraduationCap } from 'lucide-react'
import type { Resume } from '../../types/database'
import { ScoreBar } from '../dashboard/ScoreBar'

const rankBg = ['bg-amber-500/10 text-amber-400','bg-slate-500/10 text-slate-300','bg-orange-700/10 text-orange-600']

export function CandidateCard({resume,rank}:{resume:Resume;rank:number}) {
  const [open,setOpen] = useState(false)
  const sc = resume.match_score
  const scoreColor = sc>=70?'text-emerald-400':sc>=45?'text-amber-400':'text-red-400'

  return (
    <div className="card-hover p-4 cursor-pointer" onClick={()=>setOpen(!open)}>
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-display font-bold text-sm ${rank<=3?rankBg[rank-1]:'bg-surface-800 text-slate-500'}`}>{rank}</div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-white text-sm truncate">{resume.candidate_name||resume.file_name}</div>
          {resume.candidate_email && <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5"><Mail size={10}/>{resume.candidate_email}</div>}
          <div className="mt-1.5"><ScoreBar score={sc} size="sm"/></div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`font-display font-bold text-lg ${scoreColor}`}>{Math.round(sc)}%</span>
          {open?<ChevronUp size={14} className="text-slate-500"/>:<ChevronDown size={14} className="text-slate-500"/>}
        </div>
      </div>

      {open && (
        <div className="mt-4 pt-4 border-t border-slate-800 space-y-3 animate-slide-up">
          {resume.summary && <p className="text-xs text-slate-400 leading-relaxed">{resume.summary}</p>}
          <div className="flex gap-4 flex-wrap">
            {resume.experience_years>0 && <span className="flex items-center gap-1.5 text-xs text-slate-400"><Briefcase size={11}/>{resume.experience_years} yrs exp</span>}
            {resume.education_level && <span className="flex items-center gap-1.5 text-xs text-slate-400"><GraduationCap size={11}/>{resume.education_level}</span>}
          </div>
          {resume.skills_matched.length>0 && (
            <div>
              <p className="text-xs text-slate-500 mb-1.5 font-medium">✅ Matched Skills ({resume.skills_matched.length})</p>
              <div className="flex flex-wrap gap-1.5">{resume.skills_matched.map(s=><span key={s} className="badge bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><CheckCircle size={9}/>{s}</span>)}</div>
            </div>
          )}
          {resume.skills_missing.length>0 && (
            <div>
              <p className="text-xs text-slate-500 mb-1.5 font-medium">❌ Missing Skills ({resume.skills_missing.length})</p>
              <div className="flex flex-wrap gap-1.5">{resume.skills_missing.slice(0,6).map(s=><span key={s} className="badge bg-red-500/10 text-red-400 border border-red-500/20"><XCircle size={9}/>{s}</span>)}</div>
            </div>
          )}
          {resume.skills_extracted.length>0 && (
            <div>
              <p className="text-xs text-slate-500 mb-1.5 font-medium">🔍 All Extracted Skills ({resume.skills_extracted.length})</p>
              <div className="flex flex-wrap gap-1.5">{resume.skills_extracted.slice(0,12).map(s=><span key={s} className="badge bg-brand-500/10 text-brand-400 border border-brand-500/20">{s}</span>)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
