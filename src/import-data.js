import { Pool } from 'pg';
import fs from 'fs';
import csv from 'csv-parser';
import { createReadStream } from 'fs';

const pool = new Pool({
    user: 'kb_user',
    host: 'localhost',
    database: 'knowledge_base',
    password: 'your_secure_password',
    port: 5432,
});

async function importContracts() {
    const results = [];
    
    createReadStream('contracts.csv')
        .pipe(csv({
            separator: '\t', // или ',' в зависимости от формата
            headers: [
                'contract_name', 'contract_id', 'contract_amount', 'contract_date',
                'category', 'customer_name', 'customer_inn', 'supplier_name',
                'supplier_inn', 'law_basis'
            ]
        }))
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            for (const item of results) {
                try {
                    await pool.query(
                        `INSERT INTO contracts (
                            contract_name, contract_id, contract_amount, contract_date,
                            category, customer_name, customer_inn, supplier_name,
                            supplier_inn, law_basis
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                        [
                            item.contract_name,
                            item.contract_id,
                            parseFloat(item.contract_amount),
                            new Date(item.contract_date),
                            item.category || null,
                            item.customer_name,
                            item.customer_inn,
                            item.supplier_name,
                            item.supplier_inn,
                            item.law_basis
                        ]
                    );
                } catch (error) {
                    console.error('Error importing contract:', item.contract_id, error);
                }
            }
            console.log('Contracts imported:', results.length);
        });
}

async function importSessions() {
    const results = [];
    
    createReadStream('sessions.csv')
        .pipe(csv({
            separator: '\t',
            headers: [
                'session_name', 'session_id', 'session_amount', 'creation_date',
                'completion_date', 'category', 'customer_name', 'customer_inn',
                'supplier_name', 'supplier_inn', 'law_basis'
            ]
        }))
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            for (const item of results) {
                try {
                    await pool.query(
                        `INSERT INTO quotation_sessions (
                            session_name, session_id, session_amount, creation_date,
                            completion_date, category, customer_name, customer_inn,
                            supplier_name, supplier_inn, law_basis
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                        [
                            item.session_name,
                            item.session_id,
                            parseFloat(item.session_amount),
                            new Date(item.creation_date),
                            new Date(item.completion_date),
                            item.category || null,
                            item.customer_name,
                            item.customer_inn,
                            item.supplier_name,
                            item.supplier_inn,
                            item.law_basis
                        ]
                    );
                } catch (error) {
                    console.error('Error importing session:', item.session_id, error);
                }
            }
            console.log('Sessions imported:', results.length);
            await pool.end();
        });
}

// Запуск импорта
importContracts();
importSessions();