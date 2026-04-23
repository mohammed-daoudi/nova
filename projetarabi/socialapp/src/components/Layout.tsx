import { useState } from 'react'
import { Outlet, NavLink, useNavigate, Navigate, Link } from 'react-router-dom'
import { Home, Users, Search, MessageCircle, Settings, LogOut, Sparkles, MoreVertical, X, User, Settings2, Menu } from 'lucide-react'
import { getToken, getUser, clearAuth, avatarUrl } from '../api'
import './Layout.css'

const navItems = [
  { to: '/home', icon: Home, label: 'Home' },
  { to: '/friends', icon: Users, label: 'Friends' },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/chat', icon: MessageCircle, label: 'Messages' },
]

export default function Layout() {
  const navigate = useNavigate()
  const token = getToken()
  const user = getUser()

  if (!token || !user) return <Navigate to="/login" replace />

  const logout = () => { clearAuth(); navigate('/login') }
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="layout">
      <aside className="sidebar">
        {/* Logo → clickable, links to /home */}
        <Link to="/home" className="sidebar-logo">
          <div className="logo-icon" style={{ background: 'linear-gradient(135deg,#8a5220,#B87333)' }}>
            <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
              <path d="M5 11h16a8 8 0 0 1 0 16H5V11Z" fill="white" opacity="0.95"/>
              <path d="M21 15c3 0 6 1.5 6 4s-3 4-6 4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <path d="M9 11V8a3 3 0 0 1 6 0v3" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <rect x="7" y="26" width="12" height="2" rx="1" fill="white" opacity="0.7"/>
            </svg>
          </div>
          <span className="logo-text">Atay</span>
        </Link>

        <nav className="sidebar-nav">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) => 'nav-item ' + (isActive ? 'nav-item--active' : '')}>
              <Icon size={20} /><span>{label}</span>
            </NavLink>
          ))}

          <NavLink to="/nova" className={({ isActive }) => 'nav-item ' + (isActive ? 'nav-item--active' : '')}>
            <Sparkles size={20} />
            <span>L'BERRAD</span>
            <span className="nova-nav-badge">AI</span>
          </NavLink>
        </nav>

        <div className="sidebar-bottom">
          <NavLink to="/settings"
            className={({ isActive }) => 'nav-item ' + (isActive ? 'nav-item--active' : '')}>
            <Settings size={20} /><span>Settings</span>
          </NavLink>

          <div
            className="sidebar-user"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate(`/profile/${user.id}`)}
          >
            <img src={avatarUrl(user)} alt="avatar" className="user-avatar" />
            <div className="user-info">
              <p className="user-name">{user.first_name} {user.last_name}</p>
              <p className="user-handle">@{user.username}</p>
            </div>
            <button className="logout-btn" title="Logout"
              onClick={e => { e.stopPropagation(); logout() }}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        {/* ── Atay topbar brand — desktop & mobile ── */}
        <header className="atay-topbar">
          <Link to="/home" className="atay-topbar-brand">
            <div className="atay-topbar-icon">
              <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
                <path d="M5 11h16a8 8 0 0 1 0 16H5V11Z" fill="white" opacity="0.95"/>
                <path d="M21 15c3 0 6 1.5 6 4s-3 4-6 4" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M9 11V8a3 3 0 0 1 6 0v3" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                <rect x="7" y="26" width="12" height="2" rx="1" fill="white" opacity="0.7"/>
              </svg>
            </div>
            <span>Atay</span>
          </Link>

          <div className="topbar-right">
            <img 
              src={avatarUrl(user)} 
              alt="profile" 
              className="topbar-avatar"
              onClick={() => navigate(`/profile/${user.id}`)}
            />
            <button className="topbar-menu-btn" onClick={() => setMenuOpen(true)}>
              <Menu size={20} />
            </button>
          </div>
        </header>

        <Outlet />
      </main>

      <nav className="mobile-nav">
        <NavLink to="/home" className={({ isActive }) => 'mobile-nav-item ' + (isActive ? 'nav-item--active' : '')}>
          <Home size={20} /><span>Home</span>
        </NavLink>
        <NavLink to="/friends" className={({ isActive }) => 'mobile-nav-item ' + (isActive ? 'nav-item--active' : '')}>
          <Users size={20} /><span>Friends</span>
        </NavLink>
        <NavLink to="/search" className={({ isActive }) => 'mobile-nav-item ' + (isActive ? 'nav-item--active' : '')}>
          <Search size={20} /><span>Search</span>
        </NavLink>
        <NavLink to="/chat" className={({ isActive }) => 'mobile-nav-item ' + (isActive ? 'nav-item--active' : '')}>
          <MessageCircle size={20} /><span>Chat</span>
        </NavLink>
        <NavLink to="/nova" className={({ isActive }) => 'mobile-nav-item ' + (isActive ? 'nav-item--active' : '')}>
          <Sparkles size={20} /><span>L'BERRAD</span>
        </NavLink>
        <button className="mobile-nav-item mobile-nav-more" onClick={() => setMenuOpen(true)}>
          <MoreVertical size={20} /><span>More</span>
        </button>
      </nav>

      {/* Mobile menu sheet */}
      {menuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setMenuOpen(false)}>
          <div className="mobile-menu-sheet" onClick={e => e.stopPropagation()}>
            <div className="mobile-menu-header">
              <img src={avatarUrl(user)} alt="avatar" className="mobile-menu-avatar" />
              <div>
                <p className="mobile-menu-name">{user.first_name} {user.last_name}</p>
                <p className="mobile-menu-handle">@{user.username}</p>
              </div>
              <button className="mobile-menu-close" onClick={() => setMenuOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="mobile-menu-items">
              <button className="mobile-menu-item" onClick={() => { navigate(`/profile/${user.id}`); setMenuOpen(false) }}>
                <User size={18} /><span>My Profile</span>
              </button>
              <button className="mobile-menu-item" onClick={() => { navigate('/settings'); setMenuOpen(false) }}>
                <Settings2 size={18} /><span>Settings</span>
              </button>
              <button className="mobile-menu-item mobile-menu-logout" onClick={() => { logout(); setMenuOpen(false) }}>
                <LogOut size={18} /><span>Log out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
