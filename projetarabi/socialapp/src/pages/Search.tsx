import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search as SearchIcon, X, Users } from 'lucide-react'
import { usersAPI, friendsAPI, avatarUrl } from '../api'
import './Search.css'

interface User {
  id: number; first_name: string; last_name: string
  username: string; bio?: string; avatar_seed: string; avatar_url?: string
  is_friend?: number; request_sent?: string
}

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function Search() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<User[]>([])
  const [suggestions, setSuggestions] = useState<User[]>([])
  const [searching, setSearching] = useState(false)
  const [sentRequests, setSentRequests] = useState<Set<number>>(new Set())
  const debounced = useDebounce(query, 350)

  useEffect(() => {
    usersAPI.suggestions().then(setSuggestions).catch(console.error)
  }, [])

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    setSearching(true)
    try { setResults(await usersAPI.search(q)) }
    catch { setResults([]) }
    finally { setSearching(false) }
  }, [])

  useEffect(() => { doSearch(debounced) }, [debounced, doSearch])

  const sendRequest = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    try { await friendsAPI.sendRequest(id); setSentRequests(s => new Set([...s, id])) } catch {}
  }

  const getStatus = (u: User) => {
    if (sentRequests.has(u.id)) return 'sent'
    if (u.is_friend) return 'friend'
    if (u.request_sent === 'pending') return 'pending'
    return 'none'
  }

  const ActionButton = ({ u }: { u: User }) => {
    const status = getStatus(u)
    if (status === 'friend') return <span className="friend-badge">Friends ✓</span>
    if (status === 'sent' || status === 'pending') return <span className="follow-btn-active">Sent</span>
    return <button className="follow-btn" onClick={e => sendRequest(e, u.id)}>Add Friend</button>
  }

  const UserRow = ({ u }: { u: User }) => (
    <div key={u.id} className="result-card animate-in" style={{ cursor: 'pointer' }}
      onClick={() => navigate(`/profile/${u.id}`)}>
      <img src={avatarUrl(u)} alt="" className="result-avatar" />
      <div className="result-info">
        <p className="result-name">{u.first_name} {u.last_name}</p>
        <p className="result-handle">@{u.username}</p>
        {u.bio && <p className="result-bio">{u.bio}</p>}
      </div>
      <ActionButton u={u} />
    </div>
  )

  const SuggestCard = ({ u }: { u: User }) => (
    <div key={u.id} className="suggest-card" style={{ cursor: 'pointer' }}
      onClick={() => navigate(`/profile/${u.id}`)}>
      <img src={avatarUrl(u)} alt="" className="suggest-card-avatar" />
      <p className="suggest-card-name">{u.first_name} {u.last_name}</p>
      <p className="suggest-card-bio">@{u.username}{u.bio ? ` · ${u.bio}` : ''}</p>
      <ActionButton u={u} />
    </div>
  )

  const showResults = debounced.trim().length > 0

  return (
    <div className="search-page">
      <div className="search-hero">
        <h1>Discover People</h1>
        <div className="search-bar">
          <SearchIcon size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search by name or username..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button className="clear-btn" onClick={() => setQuery('')}><X size={16} /></button>
          )}
        </div>
      </div>

      {showResults ? (
        <div className="search-results animate-in">
          {searching ? (
            <div className="feed-loading">
              {[1,2,3].map(i => <div key={i} className="skeleton-card" style={{ height: 80 }} />)}
            </div>
          ) : (
            <>
              <p className="results-label">
                {results.length} result{results.length !== 1 ? 's' : ''} for "<strong>{debounced}</strong>"
              </p>
              {results.length === 0
                ? <div className="no-results"><SearchIcon size={40} /><p>No users found</p><span>Try a different keyword</span></div>
                : <div className="results-list">{results.map(u => <UserRow key={u.id} u={u} />)}</div>
              }
            </>
          )}
        </div>
      ) : (
        <div className="search-idle animate-in">
          <section className="section">
            <div className="section-header"><Users size={18} /><h2>People You May Know</h2></div>
            {suggestions.length === 0
              ? <div className="no-results"><p>You've connected with everyone!</p></div>
              : <div className="suggest-grid">{suggestions.map(u => <SuggestCard key={u.id} u={u} />)}</div>
            }
          </section>
        </div>
      )}
    </div>
  )
}
