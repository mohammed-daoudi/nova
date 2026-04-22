const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { pool } = require('../db/database')

const router = express.Router()

router.post('/register', async (req, res) => {
  const { first_name, last_name, username, email, password } = req.body

  if (!first_name || !last_name || !username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' })
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' })
  }

  try {
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    )
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email or username already taken' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const avatar_seed = username

    const [result] = await pool.query(
      `INSERT INTO users (first_name, last_name, username, email, password, avatar_seed)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [first_name, last_name, username, email, hashedPassword, avatar_seed]
    )

    const token = jwt.sign(
      { id: result.insertId, username, email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    )

    res.status(201).json({
      token,
      user: { id: result.insertId, first_name, last_name, username, email, avatar_seed }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email])
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const user = rows[0]
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    )

    res.json({
      token,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        email: user.email,
        bio: user.bio,
        avatar_seed: user.avatar_seed,
      }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

const auth = require('../middleware/auth')

router.get('/me', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, first_name, last_name, username, email, bio, avatar_seed, created_at FROM users WHERE id = ?',
      [req.user.id]
    )
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' })
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
