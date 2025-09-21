import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import compression from 'compression';
import helmet from 'helmet';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001; // Фиксированный порт

// Конфигурация PostgreSQL - прямые значения
const pool = new Pool({
    user: 'kb_user',
    host: 'localhost',
    database: 'knowledge_base',
    password: '1234',
    port: 5432, // Стандартный порт PostgreSQL
});

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "data:"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"]
        }
    },
    crossOriginEmbedderPolicy: false
}));

app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Обслуживание статических файлов
app.use(express.static(__dirname, {
    maxAge: '1y',
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
        if (filePath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        } else if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
    }
}));

app.use('/src', express.static(path.join(__dirname, 'src')));

// API endpoints
app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ status: 'OK', database: 'connected' });
    } catch (error) {
        res.status(500).json({ status: 'ERROR', database: 'disconnected' });
    }
});

// Поиск по контрактам и котировочным сессиям
app.get('/api/search', async (req, res) => {
    console.log('Поисковый запрос:', req.query.q);
    
    try {
        const { q } = req.query;
        
        if (!q || q.trim() === '') {
            console.log('Пустой поисковый запрос');
            return res.json([]);
        }

        // Проверим подключение к БД
        try {
            await pool.query('SELECT 1');
            console.log('Подключение к БД активно');
        } catch (dbError) {
            console.error('Ошибка подключения к БД:', dbError.message);
            return res.status(500).json({ error: 'Database connection failed' });
        }

        let results = [];

        // Поиск по контрактам
        console.log('Поиск по контрактам...');
        const contractsQuery = `
            SELECT *, 'contract' as data_type FROM contracts 
             WHERE contract_name ILIKE $1 OR customer_name ILIKE $1 OR supplier_name ILIKE $1
                OR contract_id::text ILIKE $1 OR customer_inn ILIKE $1 OR supplier_inn ILIKE $1
             ORDER BY contract_date DESC LIMIT 50`;
        
        const contracts = await pool.query(contractsQuery, [`%${q}%`]);
        console.log(`Найдено контрактов: ${contracts.rows.length}`);
        results = [...results, ...contracts.rows];

        // Поиск по котировочным сессиям
        console.log('Поиск по котировочным сессиям...');
        const sessionsQuery = `
            SELECT *, 'quotation_session' as data_type FROM quotation_sessions 
             WHERE session_name ILIKE $1 OR customer_name ILIKE $1 OR supplier_name ILIKE $1
                OR session_id::text ILIKE $1 OR customer_inn ILIKE $1 OR supplier_inn ILIKE $1
             ORDER BY creation_date DESC LIMIT 50`;
        
        const sessions = await pool.query(sessionsQuery, [`%${q}%`]);
        console.log(`Найдено сессий: ${sessions.rows.length}`);
        results = [...results, ...sessions.rows];

        console.log(`Всего результатов: ${results.length}`);
        res.json(results.slice(0, 100));

    } catch (error) {
        console.error('Ошибка поиска:', error);
        res.status(500).json({ error: 'Search failed', details: error.message });
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
    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: 'Something went wrong'
    });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server with PostgreSQL running on port ${PORT}`);
    console.log(`Access: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Received SIGINT. Shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('Received SIGTERM. Shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

export default app;