import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { DashboardPage } from './pages/DashboardPage'
import { CandidatesPage } from './pages/CandidatesPage'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { AppLayout } from './components/layout/AppLayout'

function PrivateRoute({ children }:{ children:React.ReactNode }) {
  const {user,loading} = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"/></div>
  return user ? <>{children}</> : <Navigate to="/login" replace/>
}
function PublicRoute({ children }:{ children:React.ReactNode }) {
  const {user,loading} = useAuth()
  if (loading) return null
  return user ? <Navigate to="/dashboard" replace/> : <>{children}</>
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace/>}/>
          <Route path="/login" element={<PublicRoute><LoginPage/></PublicRoute>}/>
          <Route path="/signup" element={<PublicRoute><SignupPage/></PublicRoute>}/>
          <Route path="/" element={<PrivateRoute><AppLayout/></PrivateRoute>}>
            <Route path="dashboard" element={<DashboardPage/>}/>
            <Route path="candidates" element={<CandidatesPage/>}/>
            <Route path="analytics" element={<AnalyticsPage/>}/>
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace/>}/>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
