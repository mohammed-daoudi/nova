import { useState } from 'react'
import { Outlet, NavLink, useNavigate, Navigate } from 'react-router-dom'
import { Home, Users, Search, MessageCircle, Settings, LogOut, Zap, Sparkles, MoreVertical, X, User, Settings2 } from 'lucide-react'
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
        <div className="sidebar-logo">
          <div className="logo-icon"><Zap size={20} fill="currentColor" /></div>
          <span className="logo-text">Vibe</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) => 'nav-item ' + (isActive ? 'nav-item--active' : '')}>
              <Icon size={20} /><span>{label}</span>
            </NavLink>
          ))}

          <NavLink to="/nova" className={({ isActive }) => 'nav-item ' + (isActive ? 'nav-item--active' : '')}>
            <Sparkles size={20} />
            <span>Nova</span>
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
          <Sparkles size={20} /><span>Nova</span>
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
