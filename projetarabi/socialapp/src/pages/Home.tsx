import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageCircle, Share2, Bookmark, MoreHorizontal, Image as ImageIcon, Send, X, ChevronDown } from 'lucide-react'
import { postsAPI, usersAPI, friendsAPI, avatarUrl, getUser, API_BASE } from '../api'
import './Home.css'

/* ── Berrad (Teapot) Like Icon with bottom-to-top fill animation ── */
function BerradIcon({ liked, size = 18 }: { liked: boolean; size?: number }) {
  const id = `berrad-clip-${size}`
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ transition: 'filter 0.3s', filter: liked ? 'drop-shadow(0 0 4px #B87333)' : 'none' }}
    >
      <defs>
        <clipPath id={id}>
          {/* This rect slides up from 100% → 0% via CSS when liked */}
          <rect
            x="0"
            y={liked ? '0%' : '100%'}
            width="100%"
            height="100%"
            style={{ transition: 'y 0.55s cubic-bezier(0.22, 1, 0.36, 1)' }}
          />
        </clipPath>
      </defs>
      {/* Outline teapot (always visible) */}
      <path d="M5 11h16a8 8 0 0 1 0 16H5V11Z" stroke="currentColor" strokeWidth="1.8" fill="none"/>
      <path d="M21 15c3 0 6 1.5 6 4s-3 4-6 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
      <path d="M9 11V8a3 3 0 0 1 6 0v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
      <rect x="7" y="26" width="12" height="2" rx="1" fill="currentColor" opacity="0.5"/>
      {/* Filled teapot (clipped for animation) */}
      <g clipPath={`url(#${id})`}>
        <path d="M5 11h16a8 8 0 0 1 0 16H5V11Z" fill="#B87333"/>
        <path d="M21 15c3 0 6 1.5 6 4s-3 4-6 4" stroke="#B87333" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
        <path d="M9 11V8a3 3 0 0 1 6 0v3" stroke="#B87333" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
        <rect x="7" y="26" width="12" height="2" rx="1" fill="#B87333"/>
      </g>
    </svg>
  )
}

interface Post {
  id: number; content: string; image_url?: string; created_at: string
  user_id: number; first_name: string; last_name: string; username: string
  avatar_seed: string; avatar_url?: string
  likes_count: number; comments_count: number; liked_by_me: number
}
interface Comment {
  id: number; content: string; created_at: string
  user_id: number; first_name: string; last_name: string; username: string
  avatar_seed: string; avatar_url?: string
}

function timeAgo(d: string) {
  const s = (Date.now() - new Date(d).getTime()) / 1000
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s/60)}m ago`
  if (s < 86400) return `${Math.floor(s/3600)}h ago`
  return `${Math.floor(s/86400)}d ago`
}

function CommentSection({ postId }: { postId: number }) {
  const me = getUser()
  const [comments, setComments] = useState<Comment[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    postsAPI.comments(postId)
      .then(setComments)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [postId])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    setSubmitting(true)
    try {
      const c = await postsAPI.addComment(postId, text)
      setComments(prev => [...prev, c])
      setText('')
    } catch (err) { console.error(err) }
    finally { setSubmitting(false) }
  }

  return (
    <div className="comments-section">
      {loading ? <p className="comments-loading">Loading...</p> : (
        <>
          {comments.map(c => (
            <div key={c.id} className="comment">
              <img src={avatarUrl(c)} alt="" className="comment-avatar" />
              <div className="comment-body">
                <span className="comment-name">{c.first_name} {c.last_name}</span>
                <span className="comment-text"> {c.content}</span>
                <span className="comment-time">{timeAgo(c.created_at)}</span>
              </div>
            </div>
          ))}
        </>
      )}
      <form className="comment-form" onSubmit={submit}>
        <img src={avatarUrl(me || {})} alt="" className="comment-avatar" />
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Write a comment..."
          disabled={submitting}
        />
        <button type="submit" disabled={!text.trim() || submitting}>
          <Send size={14} />
        </button>
      </form>
    </div>
  )
}

function PostCard({ post, onDelete }: { post: Post; onDelete: (id: number) => void }) {
  const me = getUser()
  const navigate = useNavigate()
  const [liked, setLiked] = useState(post.liked_by_me === 1)
  const [likes, setLikes] = useState(post.likes_count)
  const [saved, setSaved] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [commentsCount] = useState(post.comments_count)

  const toggleLike = async () => {
    try {
      const res = await postsAPI.like(post.id)
      setLiked(res.liked)
      setLikes((n: number) => res.liked ? n + 1 : n - 1)
    } catch {}
  }

  const isVideo = post.image_url && (post.image_url.endsWith('.mp4') || post.image_url.endsWith('.mov'))

  return (
    <article className="post-card animate-in">
      <div className="post-header">
        <img
          src={avatarUrl(post)}
          alt=""
          className="post-avatar"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate(`/profile/${post.user_id}`)}
        />
        <div className="post-meta" style={{ cursor: 'pointer' }} onClick={() => navigate(`/profile/${post.user_id}`)}>
          <p className="post-name">{post.first_name} {post.last_name}</p>
          <p className="post-sub">@{post.username} · {timeAgo(post.created_at)}</p>
        </div>
        {me?.id === post.user_id && (
          <button className="icon-btn ml-auto" onClick={() => onDelete(post.id)}><MoreHorizontal size={18} /></button>
        )}
      </div>

      <p className="post-content">{post.content}</p>

      {post.image_url && (
        <div className="post-image-wrap">
          {isVideo
            ? <video src={post.image_url.startsWith('http') ? post.image_url : `${API_BASE}${post.image_url}`} controls className="post-image" />
            : <img src={post.image_url.startsWith('http') ? post.image_url : `${API_BASE}${post.image_url}`} alt="" className="post-image" loading="lazy" />
          }
        </div>
      )}

      <div className="post-actions">
        <button className={`action-btn ${liked ? 'action-btn--liked' : ''}`} onClick={toggleLike}>
          <BerradIcon liked={liked} size={18} /><span>{likes}</span>
        </button>
        <button className="action-btn" onClick={() => { setShowComments(s => !s); }}>
          <MessageCircle size={18} /><span>{commentsCount}</span>
          <ChevronDown size={14} style={{ transform: showComments ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
        </button>
        <button className="action-btn"><Share2 size={18} /></button>
        <button className={`action-btn ml-auto ${saved ? 'action-btn--saved' : ''}`} onClick={() => setSaved(s => !s)}>
          <Bookmark size={18} fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>

      {showComments && <CommentSection postId={post.id} />}
    </article>
  )
}

export default function Home() {
  const me = getUser()
  const [posts, setPosts] = useState<Post[]>([])
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [postText, setPostText] = useState('')
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [sentRequests, setSentRequests] = useState<number[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    postsAPI.feed().then(setPosts).catch(console.error).finally(() => setLoadingPosts(false))
    usersAPI.suggestions().then(setSuggestions).catch(console.error)
  }, [])

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setMediaFile(f)
    setMediaPreview(URL.createObjectURL(f))
  }

  const removeMedia = () => {
    setMediaFile(null)
    setMediaPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!postText.trim()) return
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('content', postText)
      if (mediaFile) fd.append('media', mediaFile)
      const newPost = await postsAPI.create(fd)
      setPosts(p => [newPost, ...p])
      setPostText('')
      removeMedia()
    } catch (err) { console.error(err) }
    finally { setSubmitting(false) }
  }

  const handleDelete = async (id: number) => {
    try { await postsAPI.delete(id); setPosts(p => p.filter(x => x.id !== id)) } catch {}
  }

  const sendRequest = async (userId: number) => {
    try { await friendsAPI.sendRequest(userId); setSentRequests(r => [...r, userId]) } catch {}
  }

  const isVideo = (url?: string) => url && (url.endsWith('.mp4') || url.endsWith('.mov') || url.includes('video'))

  return (
    <div className="home-layout">
      <div className="feed-column">
        <form className="composer animate-in" onSubmit={handlePost}>
          <img src={avatarUrl(me || {})} alt="" className="composer-avatar" />
          <div className="composer-body">
            <textarea placeholder="What's on your mind?" value={postText} onChange={e => setPostText(e.target.value)} rows={2} />
            {mediaPreview && (
              <div className="media-preview">
                {isVideo(mediaFile?.name)
                  ? <video src={mediaPreview} className="media-preview-img" controls />
                  : <img src={mediaPreview} alt="" className="media-preview-img" />
                }
                <button type="button" className="media-remove" onClick={removeMedia}><X size={14} /></button>
              </div>
            )}
            <div className="composer-actions">
              <div className="composer-tools">
                <button type="button" className="icon-btn" onClick={() => fileRef.current?.click()}>
                  <ImageIcon size={18} />
                </button>
                <input ref={fileRef} type="file" accept="image/*,video/mp4,video/quicktime" style={{ display: 'none' }} onChange={handleMediaChange} />
              </div>
              <button className="post-btn" type="submit" disabled={!postText.trim() || submitting}>
                {submitting ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <><Send size={15} /> Post</>}
              </button>
            </div>
          </div>
        </form>

        {loadingPosts
          ? <div className="feed-loading">{[1,2,3].map(i => <div key={i} className="skeleton-card" />)}</div>
          : posts.length === 0
            ? <div className="empty-feed"><p>No posts yet.</p><span>Add friends or write your first post!</span></div>
            : posts.map(p => <PostCard key={p.id} post={p} onDelete={handleDelete} />)
        }
      </div>

      <aside className="right-sidebar">
        {suggestions.length > 0 && (
          <div className="widget">
            <h3>Suggested for you</h3>
            {suggestions.slice(0, 4).map((u: any) => (
              <div key={u.id} className="suggest-item">
                <img src={avatarUrl(u)} alt="" className="suggest-avatar" />
                <div className="suggest-info">
                  <p className="suggest-name">{u.first_name} {u.last_name}</p>
                  <p className="suggest-sub">@{u.username}</p>
                </div>
                <button className="follow-btn" onClick={() => sendRequest(u.id)} disabled={sentRequests.includes(u.id)}>
                  {sentRequests.includes(u.id) ? 'Sent' : 'Add'}
                </button>
              </div>
            ))}
          </div>
        )}
      </aside>
    </div>
  )
}
