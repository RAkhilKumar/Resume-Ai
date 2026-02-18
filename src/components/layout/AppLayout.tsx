import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, BarChart3, LogOut, FileSearch } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

const nav = [
  { to:'/dashboard', icon:LayoutDashboard, label:'Dashboard' },
  { to:'/candidates', icon:Users, label:'Candidates' },
  { to:'/analytics', icon:BarChart3, label:'Analytics' },
]

export function AppLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="flex flex-col w-56 bg-surface-900 border-r border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-3 p-5 border-b border-slate-800">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <FileSearch className="w-4 h-4 text-white"/>
          </div>
          <div>
            <div className="font-display font-bold text-white text-sm">ResumeAI</div>
            <div className="text-xs text-slate-500">Developed By Team-X</div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map(({to,icon:Icon,label})=>(
            <NavLink key={to} to={to} className={({isActive})=>`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${isActive?'bg-brand-500/15 text-brand-400 border border-brand-500/20':'text-slate-400 hover:text-slate-200 hover:bg-surface-800'}`}>
              <Icon size={17}/>{label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-800 space-y-1">
          <div className="px-3 py-1 text-xs text-slate-600 truncate">{user?.email}</div>
          <button onClick={async()=>{ await signOut(); navigate('/login') }} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all text-sm font-medium">
            <LogOut size={17}/>Sign Out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto"><Outlet/></main>
    </div>
  )
}
