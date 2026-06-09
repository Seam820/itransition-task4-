import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306, 
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: {
        rejectUnauthorized: false
    }
});

(async () => {
    try {
        const connection = await db.getConnection();
        console.log('✅ MySQL Database connected successfully via Pool.');
        connection.release();
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
    }
})();

export default db;