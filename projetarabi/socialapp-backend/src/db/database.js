const mysql = require('mysql2/promise')
require('dotenv').config()

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'socialapp',
  waitForConnections: true,
  connectionLimit: 10,
})

async function initDB() {
  const conn = await pool.getConnection()
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        first_name  VARCHAR(50)  NOT NULL,
        last_name   VARCHAR(50)  NOT NULL,
        username    VARCHAR(50)  UNIQUE NOT NULL,
        email       VARCHAR(100) UNIQUE NOT NULL,
        password    VARCHAR(255) NOT NULL,
        bio         TEXT,
        avatar_url  VARCHAR(500),
        avatar_seed VARCHAR(50),
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS friendships (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        requester_id INT NOT NULL,
        receiver_id  INT NOT NULL,
        status       ENUM('pending','accepted','declined') DEFAULT 'pending',
        created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_id)  REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_friendship (requester_id, receiver_id)
      )
    `)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        user_id    INT NOT NULL,
        content    TEXT NOT NULL,
        image_url  VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS likes (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        user_id    INT NOT NULL,
        post_id    INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (post_id) REFERENCES posts(id)  ON DELETE CASCADE,
        UNIQUE KEY unique_like (user_id, post_id)
      )
    `)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        user_id    INT NOT NULL,
        post_id    INT NOT NULL,
        content    TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (post_id) REFERENCES posts(id)  ON DELETE CASCADE
      )
    `)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        sender_id   INT NOT NULL,
        receiver_id INT NOT NULL,
        content     TEXT NOT NULL,
        read_at     TIMESTAMP NULL,
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id)   REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `)
    try { await conn.query(`ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500) AFTER bio`) } catch {}
    console.log('✅ Database tables ready')
  } finally {
    conn.release()
  }
}

module.exports = { pool, initDB }
