const express = require('express')
const bcrypt = require('bcryptjs')
const { pool } = require('../db/database')
const auth = require('../middleware/auth')
const upload = require('../middleware/upload')

const router = express.Router()

router.get('/:userId', auth, async (req, res) => {
  try {
    const [users] = await pool.query(
      `SELECT u.id, u.first_name, u.last_name, u.username, u.bio, u.avatar_seed, u.avatar_url, u.created_at,
         (SELECT COUNT(*) FROM friendships
          WHERE ((requester_id = u.id AND receiver_id = ?) OR (requester_id = ? AND receiver_id = u.id))
          AND status = 'accepted') AS is_friend,
         (SELECT COUNT(*) FROM friendships WHERE (requester_id = u.id OR receiver_id = u.id) AND status = 'accepted') AS friends_count,
         (SELECT COUNT(*) FROM posts WHERE user_id = u.id) AS posts_count
       FROM users u WHERE u.id = ?`,
      [req.user.id, req.user.id, req.params.userId]
    )
    if (users.length === 0) return res.status(404).json({ error: 'User not found' })
    res.json(users[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.put('/me/info', auth, async (req, res) => {
  const { first_name, last_name, bio } = req.body
  if (!first_name || !last_name) return res.status(400).json({ error: 'Name is required' })
  try {
    await pool.query(
      'UPDATE users SET first_name = ?, last_name = ?, bio = ? WHERE id = ?',
      [first_name.trim(), last_name.trim(), bio || null, req.user.id]
    )
    const [rows] = await pool.query(
      'SELECT id, first_name, last_name, username, email, bio, avatar_seed, avatar_url FROM users WHERE id = ?',
      [req.user.id]
    )
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

router.put('/me/password', auth, async (req, res) => {
  const { current_password, new_password } = req.body
  if (!current_password || !new_password) return res.status(400).json({ error: 'Both passwords required' })
  if (new_password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' })
  try {
    const [rows] = await pool.query('SELECT password FROM users WHERE id = ?', [req.user.id])
    const valid = await bcrypt.compare(current_password, rows[0].password)
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' })
    const hashed = await bcrypt.hash(new_password, 10)
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id])
    res.json({ message: 'Password updated successfully' })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

router.put('/me/avatar', auth, upload.single('avatar'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image uploaded' })
  try {
    const avatar_url = `/uploads/${req.file.filename}`
    await pool.query('UPDATE users SET avatar_url = ? WHERE id = ?', [avatar_url, req.user.id])
    res.json({ avatar_url })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
