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
const PORT = process.env.PORT || 3001;

const requiredEnvVars = ['DB_USER', 'DB_NAME', 'DB_PASSWORD']; // обязательные переменные
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0 && process.env.NODE_ENV === 'production') {
    console.error('Missing required environment variables:', missingEnvVars);
    process.exit(1);
}

const poolConfig = {
    user: process.env.DB_USER || 'kb_user',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'knowledge_base',
    password: process.env.DB_PASSWORD || '1234',
    port: process.env.DB_PORT || 5432,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 5000, 
    idleTimeoutMillis: 30000, 
    max: 20, 
};

const pool = new Pool(poolConfig);


pool.on('connect', (client) => {
    console.log('New client connected to PostgreSQL'); // подключения при старте
});

pool.on('error', (err, client) => {
    console.error('Unexpected error on idle PostgreSQL client', err);
    process.exit(-1);
});

// Тестирование подключения при запуске
async function testConnection() {
    try {
        const client = await pool.connect();
        console.log('Successfully connected to PostgreSQL database');
        const result = await client.query('SELECT NOW() as current_time');
        console.log('Database time:', result.rows[0].current_time);
        client.release();
    } catch (error) {
        console.error('Failed to connect to PostgreSQL:', error.message);
        // В продакшене лучше завершить процесс, если БД недоступна
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        }
    }
}

testConnection();