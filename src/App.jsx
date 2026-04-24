import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Activate from './pages/Activate'
import Profile from './pages/Profile'
import Withdraw from './pages/Withdraw'
import Tasks from './pages/Tasks'
import AdminPortal from './pages/AdminPortal'
import Referral from './pages/Referral'
import { useEffect } from 'react'

function App() {
  const { user, isLoading } = useAuth()
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user && user.status === 'pending' && window.location.pathname !== '/activate') {
      navigate('/activate');
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-text-secondary animate-pulse">Loading Cash Orbit...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen">
      <div className="animated-bg">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>
      
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to={user?.role === 'admin' ? "/admin-control-portal" : "/dashboard"} replace />} />
          <Route path="dashboard" element={<Home />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="login" element={!user ? <Login /> : <Navigate to="/dashboard" replace />} />
          <Route path="register" element={!user ? <Register /> : <Navigate to="/dashboard" replace />} />
          <Route path="activate" element={user && user.status === 'pending' ? <Activate /> : <Navigate to="/dashboard" replace />} />
          <Route path="profile" element={user ? <Profile /> : <Navigate to="/login" replace />} />
          <Route path="withdraw" element={user && user.status === 'active' ? <Withdraw /> : <Navigate to="/dashboard" replace />} />
          <Route path="referral" element={user ? <Referral /> : <Navigate to="/login" replace />} />
          <Route
            path="admin"
            element={user && user.role === 'admin' ? <AdminPortal /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="admin-control-portal"
            element={user && user.role === 'admin' ? <AdminPortal /> : <Navigate to="/dashboard" replace />}
          />
        </Route>
      </Routes>
    </div>
  )
}

export default App
