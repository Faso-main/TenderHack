import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function importAll() {
    console.log('Начинаем импорт всех данных...\n');
    
    try {
        // Импорт контрактов
        console.log('Импорт контрактов...');
        await execAsync('node import-contracts.js');
        
        console.log('\nИмпорт котировочных сессий...');
        await execAsync('node import-sessions.js');
        
        console.log('\nВсе данные успешно импортированы!');
        
    } catch (error) {
        console.error('шибка при импорте:', error);
    }
}

importAll();