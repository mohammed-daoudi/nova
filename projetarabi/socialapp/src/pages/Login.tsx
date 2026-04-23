import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import { authAPI, setAuth } from '../api'
import atayImg from '../public/atay.jpeg'
import atayMobileImg from '../public/atayMobile.jpeg'
import './Auth.css'

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await authAPI.login(email, password)
      setAuth(data.token, data.user)
      navigate('/home')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="auth-page"
      style={{
        '--hero-img': `url(${atayImg})`,
        '--mobile-hero-img': `url(${atayMobileImg})`,
      } as React.CSSProperties}
    >

      {/* ── Side A: Visual / Hero (desktop only) ── */}
      <div className="auth-showcase">
        <div
          className="auth-showcase-bg"
          style={{ '--hero-img': `url(${atayImg})` } as React.CSSProperties}
        />
        <div className="auth-showcase-gradient" />
        <div className="showcase-content">
          <h2>SH77ER ATAY ,<br />W KHWI SHI KASS.</h2>
          <p>tconnecta w hakki w hakki ya laalla</p>
        </div>
      </div>

      {/* ── Side B: Form ── */}
      <div className="auth-card animate-in">
        <div className="auth-logo">
          <div className="logo-icon">
            <svg width="22" height="22" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 12h16a8 8 0 0 1 0 16H6V12Z" fill="white" opacity="0.95"/>
              <path d="M22 16c3 0 6 1.5 6 4s-3 4-6 4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <path d="M10 12V9a3 3 0 0 1 6 0v3" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <rect x="8" y="26" width="12" height="2" rx="1" fill="white" opacity="0.7"/>
            </svg>
          </div>
          <span>Atay</span>
        </div>

        <div className="auth-header">
          <h1>Welcome back</h1>
          <p>Sign in to connect with your world</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)} required />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <div className="input-wrap">
              <input id="password" type={showPassword ? 'text' : 'password'}
                placeholder="••••••••" value={password}
                onChange={e => setPassword(e.target.value)} required />
              <button type="button" className="eye-btn" onClick={() => setShowPassword(s => !s)}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className={"submit-btn " + (loading ? 'loading' : '')} disabled={loading}>
            {loading ? <span className="spinner" /> : <><span>Sign In</span> <ArrowRight size={16} /></>}
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </div>

    </div>
  )
}
