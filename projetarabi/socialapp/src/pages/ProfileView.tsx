import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { UserCheck, UserPlus, MessageCircle, ArrowLeft, Grid } from 'lucide-react'
import { profileAPI, postsAPI, friendsAPI, avatarUrl, getUser } from '../api'
import './Profile.css'

interface UserProfile {
  id: number; first_name: string; last_name: string; username: string
  bio?: string; avatar_seed: string; avatar_url?: string
  created_at: string; is_friend: number; friends_count: number; posts_count: number
}

interface Post {
  id: number; content: string; image_url?: string; created_at: string
  likes_count: number; comments_count: number
}

export default function ProfileView() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const me = getUser()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [requestSent, setRequestSent] = useState(false)
  const [isFriend, setIsFriend] = useState(false)

  const isMe = me?.id === Number(userId)

  useEffect(() => {
    if (!userId) return
    Promise.all([
      profileAPI.get(Number(userId)),
      postsAPI.userPosts(Number(userId)),
    ]).then(([p, ps]) => {
      setProfile(p)
      setIsFriend(p.is_friend === 1)
      setPosts(ps)
    }).catch(console.error).finally(() => setLoading(false))
  }, [userId])

  const sendRequest = async () => {
    if (!profile) return
    try {
      await friendsAPI.sendRequest(profile.id)
      setRequestSent(true)
    } catch {}
  }

  const removeFriend = async () => {
    if (!profile) return
    try {
      await friendsAPI.remove(profile.id)
      setIsFriend(false)
    } catch {}
  }

  if (loading) return (
    <div className="profile-page">
      <div className="profile-skeleton" />
    </div>
  )

  if (!profile) return (
    <div className="profile-page">
      <div className="empty-state"><p>User not found</p></div>
    </div>
  )

  return (
    <div className="profile-page animate-in">
      <button className="back-btn" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Back
      </button>

      {/* Cover + avatar */}
      <div className="profile-cover">
        <div className="profile-cover-bg" />
        <div className="profile-avatar-wrap">
          <img src={avatarUrl(profile)} alt="" className="profile-big-avatar" />
          {isMe && (
            <button className="edit-avatar-btn" onClick={() => navigate('/settings')}>
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="profile-info">
        <div className="profile-info-main">
          <h1>{profile.first_name} {profile.last_name}</h1>
          <p className="profile-handle">@{profile.username}</p>
          {profile.bio && <p className="profile-bio">{profile.bio}</p>}
        </div>

        <div className="profile-stats">
          <div className="stat"><span className="stat-num">{profile.posts_count}</span><span className="stat-label">Posts</span></div>
          <div className="stat"><span className="stat-num">{profile.friends_count}</span><span className="stat-label">Friends</span></div>
        </div>

        {!isMe && (
          <div className="profile-actions">
            {isFriend ? (
              <>
                <button className="btn-primary-action" onClick={() => navigate('/chat')}>
                  <MessageCircle size={16} /> Message
                </button>
                <button className="btn-secondary-action" onClick={removeFriend}>
                  <UserCheck size={16} /> Friends
                </button>
              </>
            ) : requestSent ? (
              <button className="btn-secondary-action" disabled>Request Sent</button>
            ) : (
              <button className="btn-primary-action" onClick={sendRequest}>
                <UserPlus size={16} /> Add Friend
              </button>
            )}
          </div>
        )}

        {isMe && (
          <button className="btn-secondary-action" onClick={() => navigate('/settings')}>
            Edit Profile
          </button>
        )}
      </div>

      {/* Posts grid */}
      <div className="profile-posts-section">
        <div className="profile-posts-header">
          <Grid size={16} /> <span>Posts</span>
        </div>
        {posts.length === 0 ? (
          <div className="empty-state">
            <p>{isMe ? 'You haven\'t posted anything yet.' : 'No posts yet.'}</p>
          </div>
        ) : (
          <div className="profile-posts-grid">
            {posts.map(p => (
              <div key={p.id} className="profile-post-tile">
                {p.image_url ? (
                  p.image_url.endsWith('.mp4') || p.image_url.endsWith('.mov')
                    ? <video src={`http://localhost:5000${p.image_url}`} className="tile-media" />
                    : <img src={`http://localhost:5000${p.image_url}`} alt="" className="tile-media" />
                ) : (
                  <div className="tile-text">
                    <p>{p.content}</p>
                  </div>
                )}
                <div className="tile-overlay">
                  <span>♥ {p.likes_count}</span>
                  <span>💬 {p.comments_count}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
