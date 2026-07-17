import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

const navItems = [
  { to: '/', label: 'Dashboard', icon: 'D' },
  { to: '/transactions', label: 'Transactions', icon: 'T' },
  { to: '/invoices', label: 'Invoices', icon: 'I' },
  { to: '/products', label: 'Products & Stock', icon: 'P' },
  { to: '/settings', label: 'Settings', icon: 'S' },
]

export function AppLayout() {
  const { profile, signOut } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()
  async function handleSignOut() { await signOut(); navigate('/') }
  const initials = (profile?.business_name || profile?.username || 'U').charAt(0).toUpperCase()
  return (
    <div className="app-layout">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand"><div className="logo-icon">KH</div><span>Invoice</span></div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
              <span className="icon">{item.icon}</span>{item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{profile?.business_name || 'My Business'}</div>
              <div className="sidebar-user-phone">{profile?.phone || ''}</div>
            </div>
          </div>
          <button className="btn btn-ghost" style={{ color: '#fff', width: '100%' }} onClick={handleSignOut}>Sign Out</button>
        </div>
      </aside>
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />
      <main className="main-content">
        <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        </button>
        <Outlet />
      </main>
    </div>
  )
}
