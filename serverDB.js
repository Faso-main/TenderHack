import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Конфигурация PostgreSQL
const pool = new Pool({
    user: 'kb_user',
    host: 'localhost',
    database: 'knowledge_base',
    password: 'your_secure_password',
    port: 5432,
});

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

// API endpoints
app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ status: 'OK', database: 'connected' });
    } catch (error) {
        res.status(500).json({ status: 'ERROR', database: 'disconnected' });
    }
});

// Получение всех статей
app.get('/api/knowledge', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM knowledge_items ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

// Поиск статей
app.get('/api/knowledge/search', async (req, res) => {
    try {
        const { q } = req.query;
        const { rows } = await pool.query(
            `SELECT * FROM knowledge_items 
             WHERE title ILIKE $1 OR content ILIKE $1 
             ORDER BY created_at DESC`,
            [`%${q}%`]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Search error' });
    }
});

// Регистрация пользователя
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Хеширование пароля
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        
        const { rows } = await pool.query(
            'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
            [name, email, passwordHash]
        );
        
        res.json({ success: true, user: rows[0] });
    } catch (error) {
        if (error.code === '23505') { // duplicate key
            res.status(400).json({ error: 'User already exists' });
        } else {
            res.status(500).json({ error: 'Registration failed' });
        }
    }
});

// Авторизация пользователя
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const { rows } = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const user = rows[0];
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Убираем пароль из ответа
        const { password_hash, ...userWithoutPassword } = user;
        res.json({ success: true, user: userWithoutPassword });
        
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// Serve index.html for all routes (SPA support)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server with PostgreSQL running on port ${PORT}`);
});