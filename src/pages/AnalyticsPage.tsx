import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { Resume } from '../types/database'

const TT = { backgroundColor:'#1e293b', border:'1px solid #334155', borderRadius:'12px', color:'#f1f5f9', fontSize:'12px' }

export function AnalyticsPage() {
  const { user } = useAuth()
  const [resumes, setResumes] = useState<Resume[]>([])
  useEffect(()=>{ if(user) supabase.from('resumes').select('*').eq('user_id',user.id).then(({data})=>setResumes(data||[])) },[user])

  const analyzed = resumes.filter(r=>r.status==='analyzed')
  const buckets = [
    {label:'0-20%',count:analyzed.filter(r=>r.match_score<20).length},
    {label:'20-40%',count:analyzed.filter(r=>r.match_score>=20&&r.match_score<40).length},
    {label:'40-60%',count:analyzed.filter(r=>r.match_score>=40&&r.match_score<60).length},
    {label:'60-80%',count:analyzed.filter(r=>r.match_score>=60&&r.match_score<80).length},
    {label:'80-100%',count:analyzed.filter(r=>r.match_score>=80).length},
  ]
  const skillMap:Record<string,number> = {}
  analyzed.forEach(r=>r.skills_extracted.forEach(s=>{ skillMap[s]=(skillMap[s]||0)+1 }))
  const topSkills = Object.entries(skillMap).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([skill,count])=>({skill,count}))
  const pie = [
    {name:'Analyzed',value:analyzed.length,color:'#4f72ff'},
    {name:'Error',value:resumes.filter(r=>r.status==='error').length,color:'#ef4444'},
    {name:'Pending',value:resumes.filter(r=>r.status==='pending'||r.status==='processing').length,color:'#64748b'},
  ].filter(d=>d.value>0)

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div><h1 className="font-display text-2xl font-bold text-white">Analytics</h1><p className="text-slate-400 text-sm mt-0.5">Insights from your resume screening</p></div>
      {analyzed.length===0
        ? <div className="card flex items-center justify-center py-24 text-center"><div><p className="text-slate-400 font-medium">No data yet</p><p className="text-slate-600 text-sm mt-1">Analyze resumes to see insights</p></div></div>
        : <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-6"><h3 className="font-display font-semibold text-white mb-6">Score Distribution</h3><ResponsiveContainer width="100%" height={220}><BarChart data={buckets}><XAxis dataKey="label" tick={{fill:'#94a3b8',fontSize:11}} axisLine={false} tickLine={false}/><YAxis tick={{fill:'#94a3b8',fontSize:11}} axisLine={false} tickLine={false}/><Tooltip contentStyle={TT} cursor={{fill:'rgba(79,114,255,0.05)'}}/><Bar dataKey="count" fill="#4f72ff" radius={[6,6,0,0]} name="Candidates"/></BarChart></ResponsiveContainer></div>
            <div className="card p-6"><h3 className="font-display font-semibold text-white mb-6">Resume Status</h3><ResponsiveContainer width="100%" height={220}><PieChart><Pie data={pie} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({name,value})=>`${name}: ${value}`}>{pie.map((e,i)=><Cell key={i} fill={e.color}/>)}</Pie><Tooltip contentStyle={TT}/></PieChart></ResponsiveContainer></div>
            {topSkills.length>0 && <div className="card p-6 lg:col-span-2"><h3 className="font-display font-semibold text-white mb-6">Most Common Skills</h3><ResponsiveContainer width="100%" height={220}><BarChart data={topSkills} layout="vertical"><XAxis type="number" tick={{fill:'#94a3b8',fontSize:11}} axisLine={false} tickLine={false}/><YAxis type="category" dataKey="skill" tick={{fill:'#94a3b8',fontSize:11}} axisLine={false} tickLine={false} width={110}/><Tooltip contentStyle={TT} cursor={{fill:'rgba(79,114,255,0.05)'}}/><Bar dataKey="count" fill="#4f72ff" radius={[0,6,6,0]} name="Candidates"/></BarChart></ResponsiveContainer></div>}
            <div className="card p-6 lg:col-span-2"><h3 className="font-display font-semibold text-white mb-4">Summary</h3><div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {label:'Total Analyzed',value:analyzed.length},
                {label:'Avg Match Score',value:`${Math.round(analyzed.reduce((s,r)=>s+r.match_score,0)/analyzed.length||0)}%`},
                {label:'High Matches ≥70%',value:analyzed.filter(r=>r.match_score>=70).length},
                {label:'Avg Experience',value:`${(analyzed.reduce((s,r)=>s+r.experience_years,0)/analyzed.length||0).toFixed(1)} yrs`},
              ].map(({label,value})=>(
                <div key={label} className="bg-surface-800 rounded-xl p-4"><div className="font-display font-bold text-xl text-white">{value}</div><div className="text-xs text-slate-500 mt-1">{label}</div></div>
              ))}
            </div></div>
          </div>
      }
    </div>
  )
}
