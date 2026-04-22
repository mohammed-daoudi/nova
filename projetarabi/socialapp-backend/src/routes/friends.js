const express = require('express')
const { pool } = require('../db/database')
const auth = require('../middleware/auth')

const router = express.Router()

router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.first_name, u.last_name, u.username, u.bio, u.avatar_seed,
              f.created_at AS friends_since
       FROM friendships f
       JOIN users u ON u.id = CASE
         WHEN f.requester_id = ? THEN f.receiver_id
         ELSE f.requester_id
       END
       WHERE (f.requester_id = ? OR f.receiver_id = ?)
         AND f.status = 'accepted'
       ORDER BY f.created_at DESC`,
      [req.user.id, req.user.id, req.user.id]
    )
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/requests', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.first_name, u.last_name, u.username, u.bio, u.avatar_seed,
              f.id AS friendship_id, f.created_at
       FROM friendships f
       JOIN users u ON u.id = f.requester_id
       WHERE f.receiver_id = ? AND f.status = 'pending'
       ORDER BY f.created_at DESC`,
      [req.user.id]
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/request/:userId', auth, async (req, res) => {
  const receiverId = parseInt(req.params.userId)
  if (receiverId === req.user.id) {
    return res.status(400).json({ error: 'Cannot send request to yourself' })
  }

  try {
    const [existing] = await pool.query(
      `SELECT id, status FROM friendships
       WHERE (requester_id = ? AND receiver_id = ?)
          OR (requester_id = ? AND receiver_id = ?)`,
      [req.user.id, receiverId, receiverId, req.user.id]
    )

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Friend request already exists', status: existing[0].status })
    }

    await pool.query(
      'INSERT INTO friendships (requester_id, receiver_id, status) VALUES (?, ?, ?)',
      [req.user.id, receiverId, 'pending']
    )

    res.status(201).json({ message: 'Friend request sent' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.put('/accept/:friendshipId', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM friendships WHERE id = ? AND receiver_id = ? AND status = ?',
      [req.params.friendshipId, req.user.id, 'pending']
    )
    if (rows.length === 0) return res.status(404).json({ error: 'Request not found' })

    await pool.query(
      'UPDATE friendships SET status = ? WHERE id = ?',
      ['accepted', req.params.friendshipId]
    )
    res.json({ message: 'Friend request accepted' })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

router.delete('/:userId', auth, async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM friendships
       WHERE (requester_id = ? AND receiver_id = ?)
          OR (requester_id = ? AND receiver_id = ?)`,
      [req.user.id, req.params.userId, req.params.userId, req.user.id]
    )
    res.json({ message: 'Friendship removed' })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
