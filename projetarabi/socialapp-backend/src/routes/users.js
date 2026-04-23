const express = require('express')
const { pool } = require('../db/database')
const auth = require('../middleware/auth')

const router = express.Router()

router.get('/search', auth, async (req, res) => {
  const q = `%${req.query.q || ''}%`
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.first_name, u.last_name, u.username, u.bio, u.avatar_seed,
        (SELECT COUNT(*) FROM friendships f
          WHERE ((f.requester_id = u.id AND f.receiver_id = ?) OR
                 (f.requester_id = ? AND f.receiver_id = u.id))
          AND f.status = 'accepted') AS is_friend,
        (SELECT f.status FROM friendships f
          WHERE f.requester_id = ? AND f.receiver_id = u.id
          LIMIT 1) AS request_sent
       FROM users u
       WHERE u.id != ?
         AND (u.username LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ? OR u.bio LIKE ?)
       LIMIT 20`,
      [req.user.id, req.user.id, req.user.id, req.user.id, q, q, q, q]
    )
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/suggestions', auth, async (req, res) => {
  res.json([])
})

router.get('/:id', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, first_name, last_name, username, bio, avatar_seed, created_at FROM users WHERE id = ?`,
      [req.params.id]
    )
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' })
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
