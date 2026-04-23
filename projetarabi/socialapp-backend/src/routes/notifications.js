const express = require('express')
const { pool } = require('../db/database')
const auth = require('../middleware/auth')

const router = express.Router()

router.get('/', auth, async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT n.*, u.first_name, u.last_name, u.username, u.avatar_seed, u.avatar_url
       FROM notifications n
       JOIN users u ON u.id = n.from_user_id
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC
       LIMIT 30`,
            [req.user.id]
        )
        res.json(rows)
    } catch (err) {
        res.status(500).json({ error: 'Server error' })
    }
})

router.put('/read', auth, async (req, res) => {
    try {
        await pool.query(
            'UPDATE notifications SET read_at = NOW() WHERE user_id = ? AND read_at IS NULL',
            [req.user.id]
        )
        res.json({ success: true })
    } catch (err) {
        res.status(500).json({ error: 'Server error' })
    }
})

module.exports = router