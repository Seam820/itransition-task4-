import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 10713,
  ssl: {
    rejectUnauthorized: false // Aiven ক্লাউড ডাটাবেজের জন্য এটি বাধ্যতামূলক
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// কানেকশন টেস্ট করার জন্য লগ
pool.getConnection()
  .then(connection => {
    console.log('✅ Cloud Database connected successfully!');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Cloud Database connection failed:', err.message);
  });

export default pool;