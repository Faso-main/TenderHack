import { Pool } from 'pg';
import fs from 'fs';
import csv from 'csv-parser';
import { createReadStream } from 'fs';
import { promisify } from 'util';

const sleep = promisify(setTimeout);

const pool = new Pool({
    user: 'kb_user',
    host: 'localhost',
    database: 'knowledge_base',
    password: '1234',
    port: 5432,
});

async function importContracts() {
    const results = [];
    let imported = 0;
    let errors = 0;

    console.log('📥 Начинаем импорт контрактов...');

    // Создаем read stream для CSV файла
    createReadStream('contracts.csv')
        .pipe(csv({
            headers: [
                'contract_name', 'contract_id', 'contract_amount', 'contract_date',
                'category', 'customer_name', 'customer_inn', 'supplier_name',
                'supplier_inn', 'law_basis'
            ],
            skipLines: 1 // Пропускаем заголовок
        }))
        .on('data', (data) => {
            // Очищаем и форматируем данные
            const cleanedData = {
                contract_name: data.contract_name?.trim() || '',
                contract_id: data.contract_id?.trim() || '',
                contract_amount: parseFloat(data.contract_amount?.replace(/,/g, '') || 0),
                contract_date: data.contract_date?.endsWith('.000') ? 
                    data.contract_date.replace('.000', '') : data.contract_date,
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
                            `INSERT INTO contracts (
                                contract_name, contract_id, contract_amount, contract_date,
                                category, customer_name, customer_inn, supplier_name,
                                supplier_inn, law_basis
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                            ON CONFLICT (contract_id) DO UPDATE SET
                                contract_name = EXCLUDED.contract_name,
                                contract_amount = EXCLUDED.contract_amount,
                                contract_date = EXCLUDED.contract_date,
                                category = EXCLUDED.category,
                                customer_name = EXCLUDED.customer_name,
                                customer_inn = EXCLUDED.customer_inn,
                                supplier_name = EXCLUDED.supplier_name,
                                supplier_inn = EXCLUDED.supplier_inn,
                                law_basis = EXCLUDED.law_basis`,
                            [
                                item.contract_name,
                                item.contract_id,
                                item.contract_amount,
                                item.contract_date,
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
                            console.log(`✅ Импортировано ${imported} записей`);
                        }

                        // Небольшая задержка чтобы не перегружать базу
                        if (index % 50 === 0) {
                            await sleep(10);
                        }

                    } catch (error) {
                        errors++;
                        console.error(`❌ Ошибка при импорте записи ${index + 1}:`, error.message);
                        console.error('Данные:', item);
                    }
                }

                await client.query('COMMIT');
                
                console.log('\n🎉 Импорт завершен!');
                console.log(`✅ Успешно импортировано: ${imported}`);
                console.log(`❌ Ошибок: ${errors}`);
                console.log(`📊 Всего обработано: ${results.length}`);

            } catch (error) {
                await client.query('ROLLBACK');
                console.error('❌ Ошибка транзакции:', error);
            } finally {
                client.release();
                await pool.end();
            }
        })
        .on('error', (error) => {
            console.error('❌ Ошибка чтения CSV файла:', error);
        });
}

// Запуск импорта
importContracts();