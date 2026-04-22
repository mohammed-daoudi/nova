import { useState, useEffect } from 'react'
import { UserCheck, UserPlus, Users, Clock } from 'lucide-react'
import { friendsAPI, usersAPI, avatarUrl } from '../api'
import './Friends.css'

interface User {
  id: number; first_name: string; last_name: string
  username: string; bio?: string; avatar_seed: string
  friendship_id?: number
}

const TABS = [
  { key: 'all',         label: 'All Friends',  icon: Users  },
  { key: 'requests',    label: 'Requests',     icon: Clock  },
  { key: 'suggestions', label: 'Suggestions',  icon: UserPlus },
]

export default function Friends() {
  const [tab, setTab] = useState('all')
  const [friends, setFriends] = useState<User[]>([])
  const [requests, setRequests] = useState<User[]>([])
  const [suggestions, setSuggestions] = useState<User[]>([])
  const [sentRequests, setSentRequests] = useState<number[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [f, r, s] = await Promise.all([
        friendsAPI.list(),
        friendsAPI.requests(),
        usersAPI.suggestions(),
      ])
      setFriends(f)
      setRequests(r)
      setSuggestions(s)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const accept = async (u: User) => {
    try {
      await friendsAPI.accept(u.friendship_id!)
      setRequests(r => r.filter(x => x.id !== u.id))
      setFriends(f => [...f, u])
    } catch {}
  }

  const decline = async (u: User) => {
    try {
      await friendsAPI.remove(u.id)
      setRequests(r => r.filter(x => x.id !== u.id))
    } catch {}
  }

  const remove = async (id: number) => {
    try {
      await friendsAPI.remove(id)
      setFriends(f => f.filter(x => x.id !== id))
    } catch {}
  }

  const sendRequest = async (id: number) => {
    try {
      await friendsAPI.sendRequest(id)
      setSentRequests(r => [...r, id])
    } catch {}
  }

  return (
    <div className="friends-page">
      <div className="friends-header">
        <h1>Friends</h1>
        <p>{friends.length} connection{friends.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="friends-tabs">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            className={"friends-tab " + (tab === key ? 'friends-tab--active' : '')}
            onClick={() => setTab(key)}
          >
            <Icon size={16} />
            {label}
            {key === 'requests' && requests.length > 0 && (
              <span className="tab-count">{requests.length}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="feed-loading">
          {[1,2,3].map(i => <div key={i} className="skeleton-card" style={{height:80}} />)}
        </div>
      ) : (
        <>
          {tab === 'all' && (
            <div className="friends-grid animate-in">
              {friends.length === 0 && (
                <div className="empty-state" style={{gridColumn:'1/-1'}}>
                  <Users size={40} />
                  <p>No friends yet — check Suggestions!</p>
                </div>
              )}
              {friends.map(f => (
                <div key={f.id} className="friend-card">
                  <div className="friend-avatar-wrap">
                    <img src={avatarUrl(f)} alt="" className="friend-avatar" />
                  </div>
                  <p className="friend-name">{f.first_name} {f.last_name}</p>
                  <p className="friend-handle">@{f.username}</p>
                  {f.bio && <p className="friend-mutual">{f.bio}</p>}
                  <div className="friend-btns">
                    <button className="btn-primary"><UserCheck size={14} /> Friends</button>
                    <button className="btn-ghost" onClick={() => remove(f.id)}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'requests' && (
            <div className="requests-list animate-in">
              {requests.length === 0 && (
                <div className="empty-state">
                  <Clock size={40} />
                  <p>No pending requests</p>
                </div>
              )}
              {requests.map(r => (
                <div key={r.id} className="request-card">
                  <img src={avatarUrl(r)} alt="" className="req-avatar" />
                  <div className="req-info">
                    <p className="req-name">{r.first_name} {r.last_name}</p>
                    <p className="req-sub">@{r.username}</p>
                  </div>
                  <div className="req-btns">
                    <button className="btn-accent" onClick={() => accept(r)}>Accept</button>
                    <button className="btn-ghost" onClick={() => decline(r)}>Decline</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'suggestions' && (
            <div className="friends-grid animate-in">
              {suggestions.length === 0 && (
                <div className="empty-state" style={{gridColumn:'1/-1'}}>
                  <UserPlus size={40} />
                  <p>No suggestions available</p>
                </div>
              )}
              {suggestions.map(s => (
                <div key={s.id} className="friend-card">
                  <img src={avatarUrl(s)} alt="" className="friend-avatar" />
                  <p className="friend-name">{s.first_name} {s.last_name}</p>
                  <p className="friend-handle">@{s.username}</p>
                  {s.bio && <p className="friend-mutual">{s.bio}</p>}
                  <div className="friend-btns">
                    <button
                      className={sentRequests.includes(s.id) ? 'btn-primary' : 'btn-accent'}
                      onClick={() => sendRequest(s.id)}
                      disabled={sentRequests.includes(s.id)}
                    >
                      {sentRequests.includes(s.id)
                        ? <><UserCheck size={14} /> Sent</>
                        : <><UserPlus size={14} /> Add Friend</>}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
