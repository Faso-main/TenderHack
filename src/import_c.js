import { Pool } from 'pg';
import fs from 'fs';
import csv from 'csv-parser';
import { createReadStream } from 'fs';

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

    console.log('Начинаем импорт контрактов...');

    createReadStream('contracts.csv')
        .pipe(csv({
            headers: [
                'contract_name', 'contract_id', 'contract_amount', 'contract_date',
                'category', 'customer_name', 'customer_inn', 'supplier_name',
                'supplier_inn', 'law_basis'
            ],
            skipLines: 1
        }))
        .on('data', (data) => {
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
            console.log(`Прочитано ${results.length} записей из CSV`);

            for (const [index, item] of results.entries()) {
                const client = await pool.connect();
                
                try {
                    // Каждая запись в отдельной транзакции
                    await client.query('BEGIN');
                    
                    await client.query(
                        `INSERT INTO contracts (
                            contract_name, contract_id, contract_amount, contract_date,
                            category, customer_name, customer_inn, supplier_name,
                            supplier_inn, law_basis
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                        [
                            item.contract_name.substring(0, 500),
                            item.contract_id,
                            item.contract_amount,
                            item.contract_date,
                            item.category?.substring(0, 300) || null,
                            item.customer_name.substring(0, 500),
                            item.customer_inn,
                            item.supplier_name.substring(0, 500),
                            item.supplier_inn,
                            item.law_basis
                        ]
                    );

                    await client.query('COMMIT');
                    imported++;
                    
                    if (imported % 100 === 0) {
                        console.log(`Импортировано ${imported} записей`);
                    }

                } catch (error) {
                    await client.query('ROLLBACK');
                    errors++;
                    console.error(`Ошибка при импорте записи ${index + 1}:`, error.message);
                    console.log('Проблемные данные:', {
                        contract_id: item.contract_id,
                        contract_name: item.contract_name?.substring(0, 100) + '...'
                    });
                } finally {
                    client.release();
                }
            }
            
            await pool.end();
            console.log('Импорт завершен');
            console.log(`Успешно импортировано: ${imported}`);
            console.log(`Ошибок: ${errors}`);
        })
        .on('error', (error) => {
            console.error('Ошибка чтения CSV файла:', error);
        });
}

importContracts();