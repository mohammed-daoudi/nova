require('dotenv').config()
const express = require('express')
const cors = require('cors')
const http = require('http')
const path = require('path')
const { initDB } = require('./db/database')
const { setupWebSocket } = require('./websocket')

const app = express()
const server = http.createServer(app)

app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

app.use('/api/auth', require('./routes/auth'))
app.use('/api/users', require('./routes/users'))
app.use('/api/friends', require('./routes/friends'))
app.use('/api/posts', require('./routes/posts'))
app.use('/api/messages', require('./routes/messages'))
app.use('/api/profile', require('./routes/profile'))
app.use('/api/nova', require('./routes/nova'))

app.get('/api/health', (_, res) => res.json({ status: 'ok' }))

const PORT = process.env.PORT || 5000

initDB().then(() => {
  setupWebSocket(server)
  server.listen(PORT, () => {
    console.log(`server running on http://localhost:${PORT}`)
    console.log(`webSocket ready on ws://localhost:${PORT}/ws`)
  })
}).catch((err) => {
  console.error('Failed to connect to database:', err.message)
  process.exit(1)
})
