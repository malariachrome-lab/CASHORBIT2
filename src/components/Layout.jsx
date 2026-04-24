import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  Home,
  ClipboardList,
  Wallet,
  User,
  LogOut,
  Menu,
  X,
  Shield,
  Users,
  Gift,
  TrendingUp
} from 'lucide-react'
import { useState } from 'react'
import { motion } from 'framer-motion'

const navItems = [
  { path: '/dashboard', icon: Home, label: 'Dashboard' },
  { path: '/tasks', icon: ClipboardList, label: 'Tasks' },
  { path: '/withdraw', icon: Wallet, label: 'Withdraw' },
  { path: '/referral', icon: Gift, label: 'Referral' },
  { path: '/profile', icon: User, label: 'Profile' },
]

const adminNavItems = [
  { path: '/admin-control-portal', icon: Shield, label: 'Admin Portal' },
]

export default function Layout() {
  const { user, logout, isAuthenticated, isActive } = useAuth()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    setMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-background relative z-10">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-success flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">Cash Orbit</span>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {isAuthenticated && user?.role === 'admin' ? (
                <>
                  <NavLink
                    to="/admin-control-portal"
                    className={({ isActive }) =>
                      `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-primary/20 text-primary'
                          : 'text-text-secondary hover:text-white hover:bg-white/5'
                      }`
                    }
                  >
                    Admin Portal
                  </NavLink>
                  <div className="ml-4 pl-4 border-l border-white/10 flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs text-text-secondary">Admin</p>
                      <p className="text-sm font-semibold text-primary">
                        {user?.name || "Admin"}
                      </p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="p-2 rounded-lg text-text-secondary hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                </>
              ) : isAuthenticated ? (
                <>
                  {navItems.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-primary/20 text-primary'
                            : 'text-text-secondary hover:text-white hover:bg-white/5'
                        }`
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}
                  
                  <div className="ml-4 pl-4 border-l border-white/10 flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs text-text-secondary">Balance</p>
                      <p className="text-sm font-semibold text-success">
                        KES {user?.balance?.toLocaleString() || 0}
                      </p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="p-2 rounded-lg text-text-secondary hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3 ml-4">
                  <NavLink
                    to="/login"
                    className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-white transition-colors"
                  >
                    Login
                  </NavLink>
                  <NavLink
                    to="/register"
                    className="btn-primary py-2 px-4 text-sm"
                  >
                    Get Started
                  </NavLink>
                </div>
              )}
            </nav>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-text-secondary hover:text-white hover:bg-white/5"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-background pt-16">
          <nav className="p-4 space-y-2">
              {isAuthenticated && user?.role === 'admin' ? (
                <>
                  <NavLink
                    to="/admin-control-portal"
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-primary/20 text-primary'
                          : 'text-text-secondary hover:text-white hover:bg-white/5'
                      }`
                    }
                  >
                    <Shield className="w-5 h-5" />
                    Admin Portal
                  </NavLink>
                  <button
                    onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-error hover:bg-error/10 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    Logout
                  </button>
                </>
              ) : isAuthenticated ? (
                <>
                  {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-primary/20 text-primary'
                          : 'text-text-secondary hover:text-white hover:bg-white/5'
                      }`
                    }
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </NavLink>
                ))}
                
                {/* Mobile Balance Display */}
                <div className="card mx-4 mt-4">
                  <p className="text-xs text-text-secondary mb-1">Current Balance</p>
                  <p className="text-2xl font-bold text-success">
                    KES {user?.balance?.toLocaleString() || 0}
                  </p>
                  {!isActive && (
                    <p className="text-xs text-warning mt-2">
                      Activate your account to start earning
                    </p>
                  )}
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-error hover:bg-error/10 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-text-secondary hover:text-white hover:bg-white/5 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  Login
                </NavLink>
                <NavLink
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm"
                >
                  Get Started
                </NavLink>
              </>
            )}
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      {/* Floating Auth Buttons for Unauthenticated Users */}
      {!isAuthenticated && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, type: "spring" }}
          className="fixed bottom-6 left-0 right-0 z-50 flex justify-center gap-4 px-4 md:hidden"
        >
          <NavLink
            to="/login"
            className="flex-1 py-3 px-6 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 text-white font-semibold text-center hover:bg-white/20 transition-all active:scale-95"
          >
            Login
          </NavLink>
          <NavLink
            to="/register"
            className="flex-1 py-3 px-6 rounded-2xl bg-gradient-to-r from-neon-pink via-neon-purple to-primary text-white font-semibold text-center shadow-glow-pulse hover:shadow-glow-purple transition-all active:scale-95"
          >
            Register
          </NavLink>
        </motion.div>
      )}

      {/* Bottom Navigation (Mobile) */}
      {isAuthenticated && user?.role !== 'admin' && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-strong border-t border-white/10">
          <div className="flex items-center justify-around py-2">
            {navItems.slice(0, 5).map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
                    isActive
                      ? 'text-primary'
                      : 'text-text-muted'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      )}

      {/* Spacer for bottom nav on mobile */}
      {isAuthenticated && <div className="md:hidden h-20" />}
    </div>
  )
}