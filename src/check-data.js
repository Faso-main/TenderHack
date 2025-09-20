import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER || 'kb_user',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'knowledge_base',
    password: process.env.DB_PASSWORD || 'your_secure_password',
    port: process.env.DB_PORT || 5432,
});

async function checkDataQuality() {
    let client;
    try {
        console.log('🔍 Проверка качества данных...');
        
        client = await pool.connect();
        
        // 1. Проверка контрактов
        console.log('\n📊 АНАЛИЗ КОНТРАКТОВ:');
        
        const contractsStats = await client.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(DISTINCT contract_id) as unique_ids,
                COUNT(DISTINCT customer_inn) as unique_customers,
                COUNT(DISTINCT supplier_inn) as unique_suppliers,
                MIN(contract_date) as earliest_contract,
                MAX(contract_date) as latest_contract,
                AVG(contract_amount) as avg_amount,
                SUM(contract_amount) as total_amount
            FROM contracts;
        `);
        
        console.log('   📈 Общая статистика:');
        console.log('      Всего контрактов:', contractsStats.rows[0].total);
        console.log('      Уникальных ID:', contractsStats.rows[0].unique_ids);
        console.log('      Уникальных заказчиков:', contractsStats.rows[0].unique_customers);
        console.log('      Уникальных поставщиков:', contractsStats.rows[0].unique_suppliers);
        console.log('      Первый контракт:', contractsStats.rows[0].earliest_contract);
        console.log('      Последний контракт:', contractsStats.rows[0].latest_contract);
        console.log('      Средняя сумма:', Math.round(contractsStats.rows[0].avg_amount), 'руб.');
        console.log('      Общая сумма:', Math.round(contractsStats.rows[0].total_amount), 'руб.');
        
        // 2. Проверка котировочных сессий
        console.log('\n📊 АНАЛИЗ КОТИРОВОЧНЫХ СЕССИЙ:');
        
        const sessionsStats = await client.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(DISTINCT session_id) as unique_ids,
                COUNT(DISTINCT customer_inn) as unique_customers,
                COUNT(DISTINCT supplier_inn) as unique_suppliers,
                MIN(creation_date) as earliest_session,
                MAX(creation_date) as latest_session,
                AVG(session_amount) as avg_amount,
                SUM(session_amount) as total_amount
            FROM quotation_sessions;
        `);
        
        console.log('   📈 Общая статистика:');
        console.log('      Всего сессий:', sessionsStats.rows[0].total);
        console.log('      Уникальных ID:', sessionsStats.rows[0].unique_ids);
        console.log('      Уникальных заказчиков:', sessionsStats.rows[0].unique_customers);
        console.log('      Уникальных поставщиков:', sessionsStats.rows[0].unique_suppliers);
        console.log('      Первая сессия:', sessionsStats.rows[0].earliest_session);
        console.log('      Последняя сессия:', sessionsStats.rows[0].latest_session);
        console.log('      Средняя сумма:', Math.round(sessionsStats.rows[0].avg_amount), 'руб.');
        console.log('      Общая сумма:', Math.round(sessionsStats.rows[0].total_amount), 'руб.');
        
        // 3. Проверка на дубликаты
        console.log('\n🔍 ПРОВЕРКА НА ДУБЛИКАТЫ:');
        
        const contractDuplicates = await client.query(`
            SELECT contract_id, COUNT(*) as duplicates
            FROM contracts
            GROUP BY contract_id
            HAVING COUNT(*) > 1;
        `);
        
        console.log('   Контракты с дубликатами ID:', contractDuplicates.rows.length);
        
        const sessionDuplicates = await client.query(`
            SELECT session_id, COUNT(*) as duplicates
            FROM quotation_sessions
            GROUP BY session_id
            HAVING COUNT(*) > 1;
        `);
        
        console.log('   Сессии с дубликатами ID:', sessionDuplicates.rows.length);
        
        // 4. Проверка целостности данных
        console.log('\n✅ ПРОВЕРКА ЦЕЛОСТНОСТИ ДАННЫХ:');
        
        // Проверка NULL значений
        const nullChecks = [
            { table: 'contracts', column: 'contract_id', nulls: await client.query('SELECT COUNT(*) FROM contracts WHERE contract_id IS NULL') },
            { table: 'contracts', column: 'contract_amount', nulls: await client.query('SELECT COUNT(*) FROM contracts WHERE contract_amount IS NULL') },
            { table: 'quotation_sessions', column: 'session_id', nulls: await client.query('SELECT COUNT(*) FROM quotation_sessions WHERE session_id IS NULL') },
            { table: 'quotation_sessions', column: 'session_amount', nulls: await client.query('SELECT COUNT(*) FROM quotation_sessions WHERE session_amount IS NULL') }
        ];
        
        for (const check of nullChecks) {
            const count = parseInt(check.nulls.rows[0].count);
            if (count > 0) {
                console.log(`   ⚠️  В таблице ${check.table} в колонке ${check.column}: ${count} NULL значений`);
            } else {
                console.log(`   ✅ В таблице ${check.table} колонка ${check.column}: нет NULL значений`);
            }
        }
        
        // 5. Примеры данных для проверки
        console.log('\n👀 ПРИМЕРЫ ДАННЫХ ДЛЯ ВИЗУАЛЬНОЙ ПРОВЕРКИ:');
        
        console.log('   Последние 3 контракта:');
        const recentContracts = await client.query('SELECT * FROM contracts ORDER BY contract_date DESC LIMIT 3');
        recentContracts.rows.forEach((contract, i) => {
            console.log(`      ${i + 1}. ${contract.contract_name}`);
            console.log(`         ID: ${contract.contract_id}, Сумма: ${contract.contract_amount} руб.`);
            console.log(`         Заказчик: ${contract.customer_name} (ИНН: ${contract.customer_inn})`);
        });
        
        console.log('\n   Последние 3 котировочные сессии:');
        const recentSessions = await client.query('SELECT * FROM quotation_sessions ORDER BY creation_date DESC LIMIT 3');
        recentSessions.rows.forEach((session, i) => {
            console.log(`      ${i + 1}. ${session.session_name}`);
            console.log(`         ID: ${session.session_id}, Сумма: ${session.session_amount} руб.`);
            console.log(`         Заказчик: ${session.customer_name} (ИНН: ${session.customer_inn})`);
        });
        
        console.log('\n🎉 Проверка данных завершена!');
        
    } catch (error) {
        console.error('❌ Ошибка при проверке данных:', error.message);
    } finally {
        if (client) {
            client.release();
        }
        await pool.end();
    }
}

// Запуск проверки
checkDataQuality();