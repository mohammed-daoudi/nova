import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import { authAPI, setAuth } from '../api'
import atayImg from '../public/atay.jpeg'
import atayMobileImg from '../public/atayMobile.jpeg'
import './Auth.css'

export default function Register() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ first_name: '', last_name: '', username: '', email: '', password: '' })
  const navigate = useNavigate()

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await authAPI.register(form)
      setAuth(data.token, data.user)
      navigate('/home')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed')
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
          <h1>Join ATAY</h1>
          <p>Create your account and start connecting</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="name-row">
            <div className="field">
              <label>First Name</label>
              <input type="text" placeholder="Alex" value={form.first_name} onChange={set('first_name')} required />
            </div>
            <div className="field">
              <label>Last Name</label>
              <input type="text" placeholder="Rivera" value={form.last_name} onChange={set('last_name')} required />
            </div>
          </div>

          <div className="field">
            <label>Username</label>
            <input type="text" placeholder="@username" value={form.username} onChange={set('username')} required />
          </div>

          <div className="field">
            <label>Email</label>
            <input type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
          </div>

          <div className="field">
            <label>Password</label>
            <div className="input-wrap">
              <input type={showPassword ? 'text' : 'password'} placeholder="Min. 8 characters"
                value={form.password} onChange={set('password')} required minLength={8} />
              <button type="button" className="eye-btn" onClick={() => setShowPassword(s => !s)}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className={"submit-btn " + (loading ? 'loading' : '')} disabled={loading}>
            {loading ? <span className="spinner" /> : <><span>Create Account</span> <ArrowRight size={16} /></>}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>

    </div>
  )
}
