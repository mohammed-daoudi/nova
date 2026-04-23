const express = require('express')
const { pool } = require('../db/database')
const auth = require('../middleware/auth')

const router = express.Router()

router.get('/conversations', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         u.id, u.first_name, u.last_name, u.username, u.avatar_seed, u.avatar_url,
         latest.content AS last_message,
         latest.created_at AS last_message_at,
         latest.sender_id,
         latest.read_at,
         (SELECT COUNT(*) FROM messages
          WHERE sender_id = u.id AND receiver_id = ? AND read_at IS NULL) AS unread_count
       FROM (
         SELECT
           CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END AS other_id,
           MAX(id) AS max_id
         FROM messages
         WHERE sender_id = ? OR receiver_id = ?
         GROUP BY other_id
       ) AS convs
       JOIN messages latest ON latest.id = convs.max_id
       JOIN users u ON u.id = convs.other_id
       ORDER BY latest.created_at DESC`,
      [req.user.id, req.user.id, req.user.id, req.user.id]
    )
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/:userId', auth, async (req, res) => {
  try {
    await pool.query(
      `UPDATE messages SET read_at = NOW()
       WHERE sender_id = ? AND receiver_id = ? AND read_at IS NULL`,
      [req.params.userId, req.user.id]
    )

    const [rows] = await pool.query(
      `SELECT m.id, m.content, m.created_at, m.read_at, m.sender_id, m.receiver_id,
              u.first_name, u.last_name, u.username, u.avatar_seed, u.avatar_url
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE (m.sender_id = ? AND m.receiver_id = ?)
          OR (m.sender_id = ? AND m.receiver_id = ?)
       ORDER BY m.created_at ASC
       LIMIT 100`,
      [req.user.id, req.params.userId, req.params.userId, req.user.id]
    )
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/:userId', auth, async (req, res) => {
  const { content } = req.body
  if (!content || !content.trim()) return res.status(400).json({ error: 'Message cannot be empty' })
  try {
    const [result] = await pool.query(
      'INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
      [req.user.id, req.params.userId, content.trim()]
    )
    const [rows] = await pool.query(
      `SELECT m.id, m.content, m.created_at, m.sender_id, m.receiver_id,
              u.first_name, u.last_name, u.username, u.avatar_seed, u.avatar_url
       FROM messages m JOIN users u ON u.id = m.sender_id
       WHERE m.id = ?`,
      [result.insertId]
    )
    res.status(201).json(rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// Edit message
router.put('/:messageId', auth, async (req, res) => {
  const { content } = req.body
  if (!content || !content.trim()) return res.status(400).json({ error: 'Content required' })
  try {
    const [rows] = await pool.query(
      'SELECT * FROM messages WHERE id = ? AND sender_id = ?',
      [req.params.messageId, req.user.id]
    )
    if (rows.length === 0) return res.status(403).json({ error: 'Not authorized' })
    await pool.query(
      'UPDATE messages SET content = ?, edited_at = NOW() WHERE id = ?',
      [content.trim(), req.params.messageId]
    )
    res.json({ success: true, content: content.trim() })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// Delete message
router.delete('/:messageId', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM messages WHERE id = ? AND sender_id = ?',
      [req.params.messageId, req.user.id]
    )
    if (rows.length === 0) return res.status(403).json({ error: 'Not authorized' })
    await pool.query('DELETE FROM messages WHERE id = ?', [req.params.messageId])
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
