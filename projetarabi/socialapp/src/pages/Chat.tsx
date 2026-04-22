import { useState, useEffect, useRef, useCallback } from 'react'
import { Send, MessageCircle, ArrowLeft } from 'lucide-react'
import { messagesAPI, friendsAPI, avatarUrl, getUser, getToken } from '../api'
import './Chat.css'

interface Message {
  id: number; content: string; created_at: string
  sender_id: number; receiver_id: number
  first_name: string; last_name: string; username: string
  avatar_seed: string; avatar_url?: string
}
interface Conversation {
  id: number; first_name: string; last_name: string; username: string
  avatar_seed: string; avatar_url?: string
  last_message?: string; unread_count?: number
}

function timeAgo(d: string) {
  const s = (Date.now() - new Date(d).getTime()) / 1000
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  return new Date(d).toLocaleDateString()
}

export default function Chat() {
  const me = getUser()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [friends, setFriends] = useState<Conversation[]>([])
  const [selected, setSelected] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [connected, setConnected] = useState(false)
  const [showThread, setShowThread] = useState(false)
  const ws = useRef<WebSocket | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const token = getToken()
    const socket = new WebSocket(`ws://localhost:5000/ws?token=${token}`)
    ws.current = socket
    socket.onopen = () => setConnected(true)
    socket.onclose = () => setConnected(false)
    socket.onmessage = (e) => {
      const data = JSON.parse(e.data)
      if (data.type === 'message') {
        setMessages(prev => [...prev, data.message])
        setConversations(prev => {
          const existing = prev.find(c => c.id === data.message.sender_id)
          if (!existing) return prev
          return [{ ...existing, last_message: data.message.content },
          ...prev.filter(c => c.id !== data.message.sender_id)]
        })
      }
      if (data.type === 'message_sent') setMessages(prev => [...prev, data.message])
      if (data.type === 'typing') {
        if (selected && data.sender_id === selected.id) {
          setIsTyping(true)
          if (typingTimer.current) clearTimeout(typingTimer.current)
          typingTimer.current = setTimeout(() => setIsTyping(false), 2000)
        }
      }
    }
    return () => { socket.close() }
  }, [])

  useEffect(() => {
    messagesAPI.conversations().then(setConversations).catch(console.error)
    friendsAPI.list().then(setFriends).catch(console.error)
  }, [])

  useEffect(() => {
    if (!selected) return
    messagesAPI.thread(selected.id).then(setMessages).catch(console.error)
  }, [selected])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const selectContact = (c: Conversation) => {
    setSelected(c)
    setShowThread(true)
  }

  const goBack = () => {
    setShowThread(false)
    setSelected(null)
  }

  const sendMessage = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || !selected || !ws.current) return
    ws.current.send(JSON.stringify({
      type: 'message',
      receiver_id: selected.id,
      content: text.trim(),
    }))
    setText('')
  }, [text, selected])

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value)
    if (ws.current && selected) {
      ws.current.send(JSON.stringify({ type: 'typing', receiver_id: selected.id }))
    }
  }

  const allContacts: Conversation[] = [
    ...conversations,
    ...friends.filter(f => !conversations.find(c => c.id === f.id))
  ]

  return (
    <div className="chat-layout">

      {/* Contacts list */}
      <div className={`chat-sidebar ${showThread ? 'chat-sidebar--hidden' : ''}`}>
        <div className="chat-sidebar-header">
          <h1>Messages</h1>
          <span className={`ws-dot ${connected ? 'ws-dot--on' : ''}`} />
        </div>
        <div className="chat-list">
          {allContacts.length === 0 && (
            <div className="chat-empty-side">
              <MessageCircle size={32} />
              <p>Add friends to start chatting</p>
            </div>
          )}
          {allContacts.map(c => {
            const isMe = (c as any).sender_id === me?.id
            const isSeen = (c as any).read_at !== null
            const lastAt = (c as any).last_message_at

            return (
              <button
                key={c.id}
                className={`chat-contact ${selected?.id === c.id ? 'chat-contact--active' : ''}`}
                onClick={() => selectContact(c)}
              >
                <img src={avatarUrl(c)} alt="" className="chat-contact-avatar" />
                <div className="chat-contact-info">
                  <div className="chat-contact-top">
                    <p className="chat-contact-name">{c.first_name} {c.last_name}</p>
                    {lastAt && (
                      <span className="chat-contact-time">{timeAgo(lastAt)}</span>
                    )}
                  </div>
                  <div className="chat-contact-bottom">
                    {c.last_message && (
                      <p className="chat-contact-last">
                        {isMe && <span className="chat-contact-you">You: </span>}
                        {c.last_message}
                      </p>
                    )}
                    {isMe ? (
                      <span className={`chat-seen-icon ${isSeen ? 'seen' : ''}`}>
                        {isSeen ? '✓✓' : '✓'}
                      </span>
                    ) : (c.unread_count ?? 0) > 0 ? (
                      <span className="chat-unread">{c.unread_count}</span>
                    ) : null}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Thread */}
      <div className={`chat-thread ${showThread ? 'chat-thread--visible' : ''}`}>
        {!selected ? (
          <div className="chat-empty">
            <MessageCircle size={44} />
            <h2>Select a conversation</h2>
            <p>Choose a friend from the list to start chatting</p>
          </div>
        ) : (
          <>
            <div className="chat-thread-header">
              <button className="chat-back-btn" onClick={goBack}>
                <ArrowLeft size={20} />
              </button>
              <img src={avatarUrl(selected)} alt="" className="chat-thread-avatar" />
              <div>
                <p className="chat-thread-name">{selected.first_name} {selected.last_name}</p>
                <p className="chat-thread-handle">@{selected.username}</p>
              </div>
            </div>

            <div className="chat-messages">
              {messages.map(m => {
                const isMine = m.sender_id === me?.id
                return (
                  <div key={m.id} className={`chat-msg ${isMine ? 'chat-msg--mine' : 'chat-msg--theirs'}`}>
                    {!isMine && <img src={avatarUrl(m)} alt="" className="chat-msg-avatar" />}
                    <div>
                      <div className="chat-msg-bubble"><p>{m.content}</p></div>
                      <span className="chat-msg-time">{timeAgo(m.created_at)}</span>
                    </div>
                  </div>
                )
              })}
              {isTyping && (
                <div className="chat-msg chat-msg--theirs">
                  <div className="chat-typing"><span /><span /><span /></div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <form className="chat-input-bar" onSubmit={sendMessage}>
              <input
                value={text}
                onChange={handleTyping}
                placeholder={`Message ${selected.first_name}...`}
              />
              <button type="submit" disabled={!text.trim()}>
                <Send size={18} />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}