import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FileSearch, Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export function SignupPage() {
  const [name,setName] = useState(''); const [email,setEmail] = useState(''); const [password,setPassword] = useState('')
  const [error,setError] = useState(''); const [success,setSuccess] = useState(false); const [loading,setLoading] = useState(false)
  const {signUp} = useAuth()

  const submit = async (e:React.FormEvent) => {
    e.preventDefault(); setError('')
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    const {error} = await signUp(email,password,name)
    setLoading(false)
    if (error) setError(error.message); else setSuccess(true)
  }

  if (success) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center animate-slide-up">
        <div className="w-16 h-16 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle className="w-8 h-8 text-emerald-400"/></div>
        <h2 className="font-display text-2xl font-bold text-white mb-3">Check your email!</h2>
        <p className="text-slate-400 mb-2">Confirmation link sent to</p>
        <p className="text-brand-400 font-medium mb-6">{email}</p>
        <p className="text-slate-500 text-sm">Click the link in your email to activate your account.</p>
        <Link to="/login" className="inline-block mt-8 text-brand-400 hover:text-brand-300 text-sm font-medium">← Back to sign in</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center"><FileSearch className="w-5 h-5 text-white"/></div>
          <div><div className="font-display font-bold text-white text-xl">ResumeAI</div><div className="text-xs text-slate-500">Developed By Team-X</div></div>
        </div>
        <div className="card p-8">
          <h1 className="font-display text-2xl font-bold text-white mb-1">Create account</h1>
          <p className="text-slate-400 text-sm mb-8">Free forever — no credit card needed</p>
          {error && <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl mb-6 text-red-400 text-sm"><AlertCircle size={16}/>{error}</div>}
          <form onSubmit={submit} className="space-y-5">
            <div><label className="label">Full name</label><div className="relative"><User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/><input type="text" value={name} onChange={e=>setName(e.target.value)} className="input pl-10" placeholder="Jane Smith" required/></div></div>
            <div><label className="label">Email</label><div className="relative"><Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/><input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="input pl-10" placeholder="you@email.com" required/></div></div>
            <div><label className="label">Password</label><div className="relative"><Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/><input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="input pl-10" placeholder="Min 8 characters" required/></div></div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Creating...</span> : 'Create Free Account'}
            </button>
          </form>
          <p className="text-center text-sm text-slate-400 mt-6">Already have an account? <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">Sign in</Link></p>
        </div>
      </div>
    </div>
  )
}
