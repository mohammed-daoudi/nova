import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Zap, ArrowRight } from 'lucide-react'
import { authAPI, setAuth } from '../api'
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
    <div className="auth-page">
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      <div className="auth-card animate-in">
        <div className="auth-logo">
          <div className="logo-icon"><Zap size={22} fill="currentColor" /></div>
          <span>ATAY</span>
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

      <div className="auth-showcase">
        <div className="showcase-content">
          <h2>SH77ER ATAY ,<br />W KHWI SHI KASS.</h2>
          <p>tconnecta w hakki w hakki ya laalla</p>
        </div>
      </div>
    </div>
  )
}
