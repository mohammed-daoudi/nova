const express = require('express')
const { pool } = require('../db/database')
const auth = require('../middleware/auth')
const upload = require('../middleware/upload')

const router = express.Router()

router.get('/feed', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.id, p.content, p.image_url, p.created_at,
              u.id AS user_id, u.first_name, u.last_name, u.username, u.avatar_seed, u.avatar_url,
              COUNT(DISTINCT l.id) AS likes_count,
              COUNT(DISTINCT c.id) AS comments_count,
              MAX(CASE WHEN l.user_id = ? THEN 1 ELSE 0 END) AS liked_by_me
       FROM posts p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN likes l ON l.post_id = p.id
       LEFT JOIN comments c ON c.post_id = p.id
       WHERE p.user_id = ?
          OR p.user_id IN (
            SELECT CASE WHEN requester_id = ? THEN receiver_id ELSE requester_id END
            FROM friendships
            WHERE (requester_id = ? OR receiver_id = ?) AND status = 'accepted'
          )
       GROUP BY p.id, u.id
       ORDER BY p.created_at DESC
       LIMIT 30`,
      [req.user.id, req.user.id, req.user.id, req.user.id, req.user.id]
    )
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/', auth, upload.single('media'), async (req, res) => {
  const { content } = req.body
  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Content is required' })
  }

  let image_url = null
  if (req.file) {
    image_url = req.file.path
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO posts (user_id, content, image_url) VALUES (?, ?, ?)',
      [req.user.id, content.trim(), image_url]
    )

    const postId = result.insertId

    // detect @mentions
    const mentionRegex = /@(\w+)/g
    let match
    while ((match = mentionRegex.exec(content)) !== null) {
      const username = match[1]
      const [mentioned] = await pool.query(
        `SELECT u.id FROM users u
         JOIN friendships f ON (
           (f.requester_id = ? AND f.receiver_id = u.id) OR
           (f.receiver_id = ? AND f.requester_id = u.id)
         )
         WHERE u.username = ? AND f.status = 'accepted' AND u.id != ?`,
        [req.user.id, req.user.id, username, req.user.id]
      )
      if (mentioned.length > 0) {
        const mentionedUser = mentioned[0]
        await pool.query(
          'INSERT INTO mentions (post_id, user_id) VALUES (?, ?)',
          [postId, mentionedUser.id]
        )
        await pool.query(
          'INSERT INTO notifications (user_id, from_user_id, type, post_id, message) VALUES (?, ?, ?, ?, ?)',
          [mentionedUser.id, req.user.id, 'mention', postId, `mentioned you in a post`]
        )
      }
    }

    const [rows] = await pool.query(
      `SELECT p.id, p.content, p.image_url, p.created_at,
              u.id AS user_id, u.first_name, u.last_name, u.username, u.avatar_seed, u.avatar_url,
              0 AS likes_count, 0 AS comments_count, 0 AS liked_by_me
       FROM posts p JOIN users u ON u.id = p.user_id WHERE p.id = ?`,
      [postId]
    )
    res.status(201).json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/:id/like', auth, async (req, res) => {
  try {
    const [existing] = await pool.query(
      'SELECT id FROM likes WHERE user_id = ? AND post_id = ?',
      [req.user.id, req.params.id]
    )
    if (existing.length > 0) {
      await pool.query('DELETE FROM likes WHERE user_id = ? AND post_id = ?', [req.user.id, req.params.id])
      res.json({ liked: false })
    } else {
      await pool.query('INSERT INTO likes (user_id, post_id) VALUES (?, ?)', [req.user.id, req.params.id])
      res.json({ liked: true })
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/:id/comments', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.id, c.content, c.created_at,
              u.id AS user_id, u.first_name, u.last_name, u.username, u.avatar_seed, u.avatar_url
       FROM comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.post_id = ?
       ORDER BY c.created_at ASC`,
      [req.params.id]
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/:id/comments', auth, async (req, res) => {
  const { content } = req.body
  if (!content || !content.trim()) return res.status(400).json({ error: 'Comment cannot be empty' })
  try {
    const [result] = await pool.query(
      'INSERT INTO comments (user_id, post_id, content) VALUES (?, ?, ?)',
      [req.user.id, req.params.id, content.trim()]
    )
    const [rows] = await pool.query(
      `SELECT c.id, c.content, c.created_at,
              u.id AS user_id, u.first_name, u.last_name, u.username, u.avatar_seed, u.avatar_url
       FROM comments c JOIN users u ON u.id = c.user_id WHERE c.id = ?`,
      [result.insertId]
    )
    res.status(201).json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.delete('/:id', auth, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT user_id FROM posts WHERE id = ?', [req.params.id])
    if (rows.length === 0) return res.status(404).json({ error: 'Post not found' })
    if (rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Not your post' })
    await pool.query('DELETE FROM posts WHERE id = ?', [req.params.id])
    res.json({ message: 'Post deleted' })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/user/:userId', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.id, p.content, p.image_url, p.created_at,
              u.id AS user_id, u.first_name, u.last_name, u.username, u.avatar_seed, u.avatar_url,
              COUNT(DISTINCT l.id) AS likes_count,
              COUNT(DISTINCT c.id) AS comments_count,
              MAX(CASE WHEN l.user_id = ? THEN 1 ELSE 0 END) AS liked_by_me
       FROM posts p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN likes l ON l.post_id = p.id
       LEFT JOIN comments c ON c.post_id = p.id
       WHERE p.user_id = ?
       GROUP BY p.id, u.id
       ORDER BY p.created_at DESC`,
      [req.user.id, req.params.userId]
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
