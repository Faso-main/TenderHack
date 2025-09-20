import express from 'express';
import path from 'path';
import compression from 'compression';
import helmet from 'helmet';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

// Конфигурация PostgreSQL с fallback значениями
const poolConfig = {
    user: process.env.DB_USER || 'kb_user',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'knowledge_base',
    password: process.env.DB_PASSWORD || 'your_secure_password',
    port: parseInt(process.env.DB_PORT) || 5432,
    // Настройки пула соединений
    max: 20, // максимальное количество клиентов в пуле
    idleTimeoutMillis: 30000, // время в ms, в течение которого клиент может бездействовать в пуле
    connectionTimeoutMillis: 2000, // время ожидания подключения
};

const pool = new Pool(poolConfig);

// Проверка подключения к базе данных при старте
async function testDatabaseConnection() {
    try {
        const client = await pool.connect();
        console.log('✅ PostgreSQL: Подключение успешно');
        const result = await client.query('SELECT version()');
        console.log(`📊 PostgreSQL версия: ${result.rows[0].version}`);
        client.release();
    } catch (error) {
        console.error('❌ PostgreSQL: Ошибка подключения:', error.message);
        console.log('ℹ️  Приложение будет работать без базы данных');
    }
}

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

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist'), {
    maxAge: isProduction ? '1y' : '0',
    etag: true,
    lastModified: true,
    setHeaders: (res, path) => {
        if (path.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
    }
}));

// Health check endpoint с проверкой базы данных
app.get('/api/health', async (req, res) => {
    try {
        // Проверяем подключение к базе данных
        await pool.query('SELECT 1');
        
        res.status(200).json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            database: 'connected'
        });
    } catch (error) {
        res.status(200).json({
            status: 'WARNING',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            database: 'disconnected',
            message: 'Database connection failed'
        });
    }
});

// API endpoints для работы с базой данных

// Поиск по контрактам и котировочным сессиям
app.get('/api/search', async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q || q.trim() === '') {
            return res.json([]);
        }

        const searchQuery = `%${q.trim()}%`;
        let results = [];

        // Поиск по контрактам
        try {
            const contractsResult = await pool.query(
                `SELECT *, 'contract' as data_type FROM contracts 
                 WHERE contract_name ILIKE $1 OR customer_name ILIKE $1 OR supplier_name ILIKE $1
                    OR contract_id::text ILIKE $1 OR customer_inn ILIKE $1 OR supplier_inn ILIKE $1
                 ORDER BY contract_date DESC LIMIT 50`,
                [searchQuery]
            );
            results = [...results, ...contractsResult.rows];
        } catch (error) {
            console.error('Search contracts error:', error);
        }

        // Поиск по котировочным сессиям
        try {
            const sessionsResult = await pool.query(
                `SELECT *, 'quotation_session' as data_type FROM quotation_sessions 
                 WHERE session_name ILIKE $1 OR customer_name ILIKE $1 OR supplier_name ILIKE $1
                    OR session_id::text ILIKE $1 OR customer_inn ILIKE $1 OR supplier_inn ILIKE $1
                 ORDER BY creation_date DESC LIMIT 50`,
                [searchQuery]
            );
            results = [...results, ...sessionsResult.rows];
        } catch (error) {
            console.error('Search sessions error:', error);
        }

        // Сортируем по дате (новые сначала)
        results.sort((a, b) => {
            const dateA = a.data_type === 'contract' ? a.contract_date : a.creation_date;
            const dateB = b.data_type === 'contract' ? b.contract_date : b.creation_date;
            return new Date(dateB) - new Date(dateA);
        });

        res.json(results.slice(0, 100));

    } catch (error) {
        console.error('Search API error:', error);
        res.status(500).json({ error: 'Search failed', details: error.message });
    }
});

// Регистрация пользователя
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Хеширование пароля
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        
        const { rows } = await pool.query(
            'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, created_at',
            [name, email, passwordHash]
        );
        
        res.json({ success: true, user: rows[0] });
    } catch (error) {
        if (error.code === '23505') { // duplicate key
            res.status(400).json({ error: 'User already exists' });
        } else {
            console.error('Registration error:', error);
            res.status(500).json({ error: 'Registration failed' });
        }
    }
});

// Авторизация пользователя
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

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
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Получение статистики
app.get('/api/stats', async (req, res) => {
    try {
        const [contractsCount, sessionsCount] = await Promise.all([
            pool.query('SELECT COUNT(*) FROM contracts').catch(() => ({ rows: [{ count: '0' }] })),
            pool.query('SELECT COUNT(*) FROM quotation_sessions').catch(() => ({ rows: [{ count: '0' }] }))
        ]);

        res.json({
            contracts: parseInt(contractsCount.rows[0].count),
            sessions: parseInt(sessionsCount.rows[0].count),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.json({ contracts: 0, sessions: 0, error: 'Failed to get stats' });
    }
});

// Serve index.html for all routes (SPA support)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: isProduction ? 'Something went wrong' : err.message
    });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
});

// Обработка ошибок базы данных
pool.on('error', (err) => {
    console.error('Unexpected database error:', err);
});

// Start server
const server = app.listen(PORT, '0.0.0.0', async () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Access: http://localhost:${PORT}`);
    
    // Тестируем подключение к базе данных
    await testDatabaseConnection();
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('🛑 Received SIGINT. Shutting down gracefully...');
    
    // Закрываем пул соединений
    await pool.end();
    
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

process.on('SIGTERM', async () => {
    console.log('🛑 Received SIGTERM. Shutting down gracefully...');
    
    // Закрываем пул соединений
    await pool.end();
    
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

export default app;