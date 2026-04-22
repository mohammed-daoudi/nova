const WebSocket = require('ws')
const jwt = require('jsonwebtoken')
const { pool } = require('./db/database')

const clients = new Map()

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server, path: '/ws' })

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url, 'http://localhost')
    const token = url.searchParams.get('token')

    if (!token) {
      ws.close(1008, 'No token')
      return
    }

    let user
    try {
      user = jwt.verify(token, process.env.JWT_SECRET || 'secret')
    } catch {
      ws.close(1008, 'Invalid token')
      return
    }

    clients.set(user.id, ws)
    console.log(`WS: user ${user.id} (${user.username}) connected`)

    ws.on('message', async (raw) => {
      try {
        const data = JSON.parse(raw)

        if (data.type === 'message') {
          const { receiver_id, content } = data
          if (!receiver_id || !content?.trim()) return

          const [result] = await pool.query(
            'INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
            [user.id, receiver_id, content.trim()]
          )
          const [rows] = await pool.query(
            `SELECT m.id, m.content, m.created_at, m.sender_id, m.receiver_id,
                    u.first_name, u.last_name, u.username, u.avatar_seed, u.avatar_url
             FROM messages m JOIN users u ON u.id = m.sender_id
             WHERE m.id = ?`,
            [result.insertId]
          )
          const msg = rows[0]

          const receiverWs = clients.get(Number(receiver_id))
          if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
            receiverWs.send(JSON.stringify({ type: 'message', message: msg }))
          }

          ws.send(JSON.stringify({ type: 'message_sent', message: msg }))
        }

        if (data.type === 'typing') {
          const receiverWs = clients.get(Number(data.receiver_id))
          if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
            receiverWs.send(JSON.stringify({
              type: 'typing',
              sender_id: user.id,
              username: user.username,
            }))
          }
        }

        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }))
        }
      } catch (err) {
        console.error('WS message error:', err)
      }
    })

    ws.on('close', () => {
      clients.delete(user.id)
      console.log(`WS: user ${user.id} disconnected`)
    })

    ws.on('error', (err) => {
      console.error('WS error:', err)
      clients.delete(user.id)
    })

    ws.send(JSON.stringify({ type: 'connected', userId: user.id }))
  })

  return wss
}

module.exports = { setupWebSocket, clients }
