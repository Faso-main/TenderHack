import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import compression from 'compression';
import helmet from 'helmet';
import cors from 'cors';
import jamspell from 'jamspell';
import { Natural } from 'natural';
import { HfInference } from '@huggingface/inference';

// Инициализация пути
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Инициализация приложения
const app = express();
const PORT = 3001;

// Конфигурация PostgreSQL
const pool = new Pool({
    user: 'kb_user',
    host: 'localhost',
    database: 'knowledge_base',
    password: '1234',
    port: 5432,
});

// Инициализация расширений PostgreSQL
pool.query('CREATE EXTENSION IF NOT EXISTS pg_trgm;').catch(err => console.error('pg_trgm extension error:', err));
pool.query('CREATE EXTENSION IF NOT EXISTS pgvector;').catch(err => console.error('pgvector extension error:', err));

// Инициализация корректора орфографии
const spellChecker = new jamspell.JamSpell();
spellChecker.loadModel('/path/to/russian_model.bin'); // Укажите путь к модели jamspell для русского языка

// Инициализация обработчика текста
const tokenizer = new Natural.WordTokenizer();
const stemmer = Natural.PorterStemmerRu;

// Инициализация Hugging Face для получения векторных представлений
const hf = new HfInference('your_huggingface_api_key'); // Замените на ваш API-ключ

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "data:"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://api-inference.huggingface.co"]
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

// Функция для получения векторного представления текста
async function getTextEmbedding(text) {
    try {
        const response = await hf.featureExtraction({
            model: 'sentence-transformers/LaBSE',
            inputs: text
        });
        return response;
    } catch (error) {
        console.error('Ошибка получения вектора:', error);
        return null;
    }
}

// Рекурсивный поиск
async function recursiveVectorSearch(query, depth = 0, maxDepth = 2, results = []) {
    if (depth > maxDepth) return results;

    // Коррекция орфографии
    const correctedQuery = spellChecker.correct(query);
    console.log(`Исходный запрос: ${query}, Исправленный: ${correctedQuery}`);

    // Токенизация и стемминг
    const tokens = tokenizer.tokenize(correctedQuery);
    const stemmedTokens = tokens.map(token => stemmer.stem(token));
    const processedQuery = stemmedTokens.join(' ');

    // Получение векторного представления запроса
    const queryEmbedding = await getTextEmbedding(processedQuery);
    if (!queryEmbedding) {
        console.error('Не удалось получить вектор запроса');
        return results;
    }

    try {
        // Поиск по контрактам
        const contractsQuery = `
            SELECT *, 'contract' as data_type,
                   (1 - (embedding <=> $1::vector)) as similarity
            FROM contracts 
            WHERE embedding <=> $1::vector < 0.3
            ORDER BY similarity DESC LIMIT 50`;
        const contracts = await pool.query(contractsQuery, [JSON.stringify(queryEmbedding)]);
        results.push(...contracts.rows);

        // Поиск по котировочным сессиям
        const sessionsQuery = `
            SELECT *, 'quotation_session' as data_type,
                   (1 - (embedding <=> $1::vector)) as similarity
            FROM quotation_sessions 
            WHERE embedding <=> $1::vector < 0.3
            ORDER BY similarity DESC LIMIT 50`;
        const sessions = await pool.query(sessionsQuery, [JSON.stringify(queryEmbedding)]);
        results.push(...sessions.rows);

        // Если результатов мало, разбиваем запрос на подзапросы
        if (results.length < 5 && tokens.length > 1 && depth < maxDepth) {
            for (const token of tokens) {
                const subQuery = token;
                await recursiveVectorSearch(subQuery, depth + 1, maxDepth, results);
            }
        }

        // Удаление дубликатов
        const uniqueResults = Array.from(new Map(results.map(item => [
            item.data_type === 'contract' ? item.contract_id : item.session_id,
            item
        ])).values());

        return uniqueResults;
    } catch (error) {
        console.error('Ошибка векторного поиска:', error);
        return results;
    }
}

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

        // Векторный поиск
        results = await recursiveVectorSearch(q);

        // Дополняем традиционным поиском
        const textQuery = `
            SELECT *, 'contract' as data_type FROM contracts 
             WHERE contract_name ILIKE $1 OR customer_name ILIKE $1 OR supplier_name ILIKE $1
                OR contract_id::text ILIKE $1 OR customer_inn ILIKE $1 OR supplier_inn ILIKE $1
                OR contract_amount::text ILIKE $1
                OR contract_name % $2 OR customer_name % $2 OR supplier_name % $2
             UNION
            SELECT *, 'quotation_session' as data_type FROM quotation_sessions 
             WHERE session_name ILIKE $1 OR customer_name ILIKE $1 OR supplier_name ILIKE $1
                OR session_id::text ILIKE $1 OR customer_inn ILIKE $1 OR supplier_inn ILIKE $1
                OR session_amount::text ILIKE $1
                OR session_name % $2 OR customer_name % $2 OR supplier_name % $2
             ORDER BY contract_date DESC LIMIT 100`;
        
        const textResults = await pool.query(textQuery, [`%${q}%`, q]);
        results.push(...textResults.rows);

        // Удаление дубликатов
        const uniqueResults = Array.from(new Map(results.map(item => [
            item.data_type === 'contract' ? item.contract_id : item.session_id,
            item
        ])).values());

        console.log(`Всего результатов: ${uniqueResults.length}`);
        res.json(uniqueResults.slice(0, 100));

    } catch (error) {
        console.error('Ошибка поиска:', error);
        res.status(500).json({ error: 'Search failed', details: error.message });
    }
});

// Подсказки для поиска
app.get('/api/suggestions', async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q || q.trim() === '') {
            return res.json([]);
        }

        const correctedQuery = spellChecker.correct(q);
        const tokens = tokenizer.tokenize(correctedQuery);
        const stemmedTokens = tokens.map(token => stemmer.stem(token));
        const processedQuery = stemmedTokens.join(' ');

        const queryEmbedding = await getTextEmbedding(processedQuery);
        if (!queryEmbedding) {
            return res.json([]);
        }

        let results = [];

        const contractsQuery = `
            SELECT *, 'contract' as data_type,
                   (1 - (embedding <=> $1::vector)) as similarity
            FROM contracts 
            WHERE embedding <=> $1::vector < 0.3
            ORDER BY similarity DESC LIMIT 5`;
        const contracts = await pool.query(contractsQuery, [JSON.stringify(queryEmbedding)]);
        results.push(...contracts.rows);

        const sessionsQuery = `
            SELECT *, 'quotation_session' as data_type,
                   (1 - (embedding <=> $1::vector)) as similarity
            FROM quotation_sessions 
            WHERE embedding <=> $1::vector < 0.3
            ORDER BY similarity DESC LIMIT 5`;
        const sessions = await pool.query(sessionsQuery, [JSON.stringify(queryEmbedding)]);
        results.push(...sessions.rows);

        res.json(results);
    } catch (error) {
        console.error('Ошибка подсказок:', error);
        res.status(500).json({ error: 'Suggestions failed', details: error.message });
    }
});

// Регистрация пользователя
app.post('/api/register', async (req, res) => {
    try {
        const { name, company, inn, phone, email, password } = req.body;
        
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        
        const { rows } = await pool.query(
            'INSERT INTO users (name, company, inn, phone, email, password_hash) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, company, inn, phone, email',
            [name, company, inn, phone, email, passwordHash]
        );
        
        res.json({ success: true, user: rows[0] });
    } catch (error) {
        if (error.code === '23505') {
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
        pool.end();
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('Received SIGTERM. Shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        pool.end();
        process.exit(0);
    });
});

export default app;