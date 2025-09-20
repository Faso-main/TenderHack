import { Pool } from 'pg';
import fs from 'fs';
import csv from 'csv-parser';
import { createReadStream } from 'fs';
import { promisify } from 'util';

const sleep = promisify(setTimeout);

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'knowledge_base',
    password: '1234',
    port: 5432,
});

async function importSessions() {
    const results = [];
    let imported = 0;
    let errors = 0;

    console.log('Начинаем импорт котировочных сессий...');

    // Создаем read stream для CSV файла
    createReadStream('sessions.csv')
        .pipe(csv({
            headers: [
                'session_name', 'session_id', 'session_amount', 'creation_date',
                'completion_date', 'category', 'customer_name', 'customer_inn',
                'supplier_name', 'supplier_inn', 'law_basis'
            ],
            skipLines: 1 // Пропускаем заголовок
        }))
        .on('data', (data) => {
            // Очищаем и форматируем данные
            const cleanedData = {
                session_name: data.session_name?.trim() || '',
                session_id: data.session_id?.trim() || '',
                session_amount: parseFloat(data.session_amount?.replace(/,/g, '') || 0),
                creation_date: data.creation_date?.endsWith('.000') ? 
                    data.creation_date.replace('.000', '') : data.creation_date,
                completion_date: data.completion_date?.endsWith('.000') ? 
                    data.completion_date.replace('.000', '') : data.completion_date,
                category: data.category?.trim() === 'NULL' ? null : data.category?.trim(),
                customer_name: data.customer_name?.trim() || '',
                customer_inn: data.customer_inn?.trim() || '',
                supplier_name: data.supplier_name?.trim() || '',
                supplier_inn: data.supplier_inn?.trim() || '',
                law_basis: data.law_basis?.trim() || ''
            };
            results.push(cleanedData);
        })
        .on('end', async () => {
            console.log(`📊 Прочитано ${results.length} записей из CSV`);

            const client = await pool.connect();
            
            try {
                await client.query('BEGIN');

                for (const [index, item] of results.entries()) {
                    try {
                        await client.query(
                            `INSERT INTO quotation_sessions (
                                session_name, session_id, session_amount, creation_date,
                                completion_date, category, customer_name, customer_inn, 
                                supplier_name, supplier_inn, law_basis
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                            ON CONFLICT (session_id) DO UPDATE SET
                                session_name = EXCLUDED.session_name,
                                session_amount = EXCLUDED.session_amount,
                                creation_date = EXCLUDED.creation_date,
                                completion_date = EXCLUDED.completion_date,
                                category = EXCLUDED.category,
                                customer_name = EXCLUDED.customer_name,
                                customer_inn = EXCLUDED.customer_inn,
                                supplier_name = EXCLUDED.supplier_name,
                                supplier_inn = EXCLUDED.supplier_inn,
                                law_basis = EXCLUDED.law_basis`,
                            [
                                item.session_name,
                                item.session_id,
                                item.session_amount,
                                item.creation_date,
                                item.completion_date,
                                item.category,
                                item.customer_name,
                                item.customer_inn,
                                item.supplier_name,
                                item.supplier_inn,
                                item.law_basis
                            ]
                        );

                        imported++;
                        
                        // Логируем прогресс каждые 100 записей
                        if (imported % 100 === 0) {
                            console.log(`Импортировано ${imported} записей`);
                        }

                        // Небольшая задержка чтобы не перегружать базу
                        if (index % 50 === 0) {
                            await sleep(10);
                        }

                    } catch (error) {
                        errors++;
                        console.error(`Ошибка при импорте записи ${index + 1}:`, error.message);
                        console.error('Данные:', item);
                    }
                }

                await client.query('COMMIT');
                
                console.log('\nИмпорт котировочных сессий завершен!');
                console.log(`Успешно импортировано: ${imported}`);
                console.log(`Ошибок: ${errors}`);
                console.log(`Всего обработано: ${results.length}`);

            } catch (error) {
                await client.query('ROLLBACK');
                console.error('Ошибка транзакции:', error);
            } finally {
                client.release();
                await pool.end();
            }
        })
        .on('error', (error) => {
            console.error('Ошибка чтения CSV файла:', error);
        });
}

// Запуск импорта
importSessions();