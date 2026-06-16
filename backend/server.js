import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from './db.js';

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// 🔒 ৫ নম্বর রিকোয়ারমেন্ট মিডলওয়্যার: প্রতিটা রিকোয়েস্টের আগে ইউজার এক্সিস্টেন্স ও স্ট্যাটাস চেক
const authenticateAndCheckStatus = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Access denied. No token provided." });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
        req.user = decoded;

        // ডাটাবেজ থেকে ইউজারের বর্তমান স্ট্যাটাস ও অস্তিত্ব চেক করা
        const [rows] = await db.query('SELECT id, status FROM users WHERE id = ?', [req.user.id]);
        
        // টেস্ট ১ ও টেস্ট ২ পাস করানোর লজিক: ইউজার যদি ডিলিট হয়ে যায় বা স্ট্যাটাস 'blocked' হয়
        if (rows.length === 0) {
            return res.status(403).json({ error: "Your account has been deleted. Access denied." });
        }

        const user = rows[0];
        const currentStatus = String(user.status).toLowerCase();
        if (currentStatus === 'blocked') {
            return res.status(403).json({ error: "Your account is blocked. Access denied." });
        }

        next();
    } catch (error) {
        return res.status(401).json({ error: "Invalid or expired token." });
    }
};

// 📝 টেস্ট ৩ পাস করার রুট: ইউনিক ইনডেক্স ডুপ্লিকেট এন্ট্রি হ্যান্ডেলিং
app.post('/api/auth/register', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: "All fields are required." });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // নতুন ইউজারের ডিফল্ট স্ট্যাটাস সরাসরি 'active' করা হলো
        const query = `
            INSERT INTO users (name, email, password, status) 
            VALUES (?, ?, ?, 'active')
        `;
        
        await db.query(query, [name, email, hashedPassword]);

        return res.status(201).json({ 
            success: true, 
            message: "Registration successful!" 
        });

    } catch (error) {
        if (error.errno === 1062 || error.code === 'ER_DUP_ENTRY' || error.message.includes('idx_users_email_unique')) {
            return res.status(400).json({ 
                error: "This email address is already registered." 
            });
        }
        console.error("Registration Error:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
});

// 🔑 লগইন রুট (কঠোরভাবে ব্লকড অ্যাকাউন্ট রিজেকশন)
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
    }

    try {
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(401).json({ error: "Invalid email or password." });
        }

        const user = rows[0];
        const currentStatus = String(user.status).toLowerCase();

        if (currentStatus === 'blocked') {
            return res.status(403).json({ error: "Your account is blocked. Access denied." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid email or password." });
        }

        // লাস্ট লগইন টাইম আপডেট
        await db.query('UPDATE users SET last_login_time = NOW() WHERE id = ?', [user.id]);

        const token = jwt.sign(
            { id: user.id, email: user.email }, 
            process.env.JWT_SECRET || 'secretkey', 
            { expiresIn: '1d' }
        );

        return res.json({
            success: true,
            token,
            user: { id: user.id, name: user.name, email: user.email, status: user.status }
        });

    } catch (error) {
        console.error("Login Error:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
});

// 📊 ইউজার লিস্ট রুট (৩ নম্বর রিকোয়ারমেন্ট: সর্টিং লজিকসহ)
app.get('/api/users', authenticateAndCheckStatus, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, name, email, last_login_time, status FROM users ORDER BY last_login_time DESC');
        return res.json(rows);
    } catch (error) {
        return res.status(500).json({ error: "Internal server error." });
    }
});

// 🚫 ১. ব্লক ইউজার রুট
app.post('/api/users/block', authenticateAndCheckStatus, async (req, res) => {
    const { userIds } = req.body;
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ error: "Invalid data." });
    }

    try {
        // mysql2 ড্রাইভারের জন্য ডাবল-নেস্টিং এড়াতে [userIds] এর পরিবর্তে সরাসরি userIds পাস করা হলো
        await db.query('UPDATE users SET status = "blocked" WHERE id IN (?)', [userIds]);
        return res.json({ success: true, message: "Selected users blocked successfully." });
    } catch (error) {
        console.error("Block API Error:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
});

// 🔓 ২. আনব্লক ইউজার রুট
app.post('/api/users/unblock', authenticateAndCheckStatus, async (req, res) => {
    const { userIds } = req.body;
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ error: "Invalid data." });
    }

    try {
        await db.query('UPDATE users SET status = "active" WHERE id IN (?)', [userIds]);
        return res.json({ success: true, message: "Selected users unblocked successfully." });
    } catch (error) {
        console.error("Unblock API Error:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
});

// 🗑️ ৩. ডিলিট ইউজার রুট
app.post('/api/users/delete', authenticateAndCheckStatus, async (req, res) => {
    const { userIds } = req.body;
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ error: "Invalid data." });
    }

    try {
        await db.query('DELETE FROM users WHERE id IN (?)', [userIds]);
        return res.json({ success: true, message: "Selected users deleted successfully." });
    } catch (error) {
        console.error("Delete API Error:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
});
// 🧹 আনভেরিফাইড ইউজার ডিলিট রুট
app.post('/api/users/delete-unverified', authenticateAndCheckStatus, async (req, res) => {
    try {
        await db.query('DELETE FROM users WHERE status = "unverified"');
        return res.json({ success: true, message: "All unverified users deleted successfully." });
    } catch (error) {
        return res.status(500).json({ error: "Internal server error." });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Admin Panel Server running on port ${PORT}`);
});