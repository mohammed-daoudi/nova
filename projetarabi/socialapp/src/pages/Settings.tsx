import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Camera, Check, X } from 'lucide-react'
import { profileAPI, avatarUrl, getUser, updateStoredUser } from '../api'
import './Profile.css'

export default function Settings() {
  const navigate = useNavigate()
  const me = getUser()
  const [tab, setTab] = useState<'profile' | 'password'>('profile')
  const [form, setForm] = useState({ first_name: me?.first_name || '', last_name: me?.last_name || '', bio: me?.bio || '' })
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' })
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))
  const setPw = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setPwForm(f => ({ ...f, [k]: e.target.value }))

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setAvatarFile(f)
    setAvatarPreview(URL.createObjectURL(f))
  }

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setSuccess(''); setSaving(true)
    try {
      if (avatarFile) {
        const fd = new FormData()
        fd.append('avatar', avatarFile)
        const res = await profileAPI.updateAvatar(fd)
        updateStoredUser({ avatar_url: res.avatar_url })
      }
      const updated = await profileAPI.updateInfo(form)
      updateStoredUser(updated)
      setSuccess('Profile updated successfully!')
      setAvatarFile(null)
    } catch (err: any) {
      setError(err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setSuccess('')
    if (pwForm.new_password !== pwForm.confirm) {
      setError('New passwords do not match'); return
    }
    setSaving(true)
    try {
      await profileAPI.updatePassword(pwForm.current_password, pwForm.new_password)
      setSuccess('Password changed successfully!')
      setPwForm({ current_password: '', new_password: '', confirm: '' })
    } catch (err: any) {
      setError(err.message || 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  const currentAvatar = avatarPreview || (me ? avatarUrl(me) : '')

  return (
    <div className="settings-page animate-in">
      <button className="back-btn" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Back
      </button>

      <h1 className="settings-title">Settings</h1>

      {/* Avatar */}
      <div className="settings-avatar-section">
        <div className="settings-avatar-wrap">
          <img src={currentAvatar} alt="" className="settings-avatar" />
          <button className="settings-avatar-btn" onClick={() => fileRef.current?.click()}>
            <Camera size={16} />
          </button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
        </div>
        <div>
          <p className="settings-name">{me?.first_name} {me?.last_name}</p>
          <p className="settings-username">@{me?.username}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="settings-tabs">
        <button className={`settings-tab ${tab === 'profile' ? 'settings-tab--active' : ''}`} onClick={() => setTab('profile')}>
          Profile Info
        </button>
        <button className={`settings-tab ${tab === 'password' ? 'settings-tab--active' : ''}`} onClick={() => setTab('password')}>
          Password
        </button>
      </div>

      {success && <div className="alert alert-success"><Check size={14} /> {success}</div>}
      {error   && <div className="alert alert-error"><X size={14} /> {error}</div>}

      {tab === 'profile' && (
        <form className="settings-form" onSubmit={saveProfile}>
          <div className="settings-row">
            <div className="field">
              <label>First Name</label>
              <input type="text" value={form.first_name} onChange={set('first_name')} required />
            </div>
            <div className="field">
              <label>Last Name</label>
              <input type="text" value={form.last_name} onChange={set('last_name')} required />
            </div>
          </div>
          <div className="field">
            <label>Bio</label>
            <textarea
              value={form.bio}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              placeholder="Tell people about yourself..."
              rows={3}
            />
          </div>
          <button type="submit" className="settings-save-btn" disabled={saving}>
            {saving ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Save Changes'}
          </button>
        </form>
      )}

      {tab === 'password' && (
        <form className="settings-form" onSubmit={savePassword}>
          <div className="field">
            <label>Current Password</label>
            <input type="password" value={pwForm.current_password} onChange={setPw('current_password')} required />
          </div>
          <div className="field">
            <label>New Password</label>
            <input type="password" value={pwForm.new_password} onChange={setPw('new_password')} required minLength={8} />
          </div>
          <div className="field">
            <label>Confirm New Password</label>
            <input type="password" value={pwForm.confirm} onChange={setPw('confirm')} required />
          </div>
          <button type="submit" className="settings-save-btn" disabled={saving}>
            {saving ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Change Password'}
          </button>
        </form>
      )}
    </div>
  )
}
