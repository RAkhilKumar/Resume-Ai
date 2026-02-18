const colors:Record<string,string> = { blue:'bg-blue-500/10 text-blue-400', amber:'bg-amber-500/10 text-amber-400', purple:'bg-purple-500/10 text-purple-400', slate:'bg-slate-500/10 text-slate-400', emerald:'bg-emerald-500/10 text-emerald-400' }
export function StatCard({icon,label,value,color}:{icon:React.ReactNode;label:string;value:string|number;color:string}) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colors[color]}`}>{icon}</div>
      <div><div className="font-display font-bold text-xl text-white">{value}</div><div className="text-xs text-slate-500">{label}</div></div>
    </div>
  )
}
