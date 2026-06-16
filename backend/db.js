import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// এনভায়রনমেন্ট ভ্যারিয়েবল না পেলে সরাসরি ক্লাউড ডাটাবেজের ডেটা ফলব্যাক হিসেবে কাজ করবে
const dbConfig = {
  host: process.env.DB_HOST || 'mysql-001-contactwithseam-f022.c.aivencloud.com',
  user: process.env.DB_USER || 'avnadmin',
  password: process.env.DB_PASSWORD || 'AVNS_TMNtCUEKQZOaaehted5',
  database: process.env.DB_NAME || 'defaultdb',
  port: parseInt(process.env.DB_PORT || '10713'),
  ssl: {
    rejectUnauthorized: false // Aiven ক্লাউডের জন্য এটি আবশ্যক
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// কানেকশন সাকসেস বা ফেইলর টেস্ট লগ
pool.getConnection()
  .then(connection => {
    console.log('✅ Cloud Database connected successfully!');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Cloud Database connection failed:', err.message);
  });

export default pool;