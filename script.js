let score = 0;
const scoreDisplay = document.getElementById('scoreDisplay');
const clickButton = document.getElementById('clickButton');

// ⚠️ ОБЯЗАТЕЛЬНО: ЗАМЕНИТЕ ЭТУ ЗАГЛУШКУ НА ВАШ АДРЕС PYTHONANYWHERE (С HTTPS)
const API_BASE_URL = 'https://ВАШ_НИК.pythonanywhere.com'; 

let userId = null; 
let lastSaveTime = Date.now();
// Увеличим интервал сохранения, чтобы уменьшить нагрузку на сервер
const SAVE_INTERVAL = 5000; // Сохраняем не чаще, чем раз в 5 секунд

// --- API-Функции ---

function checkApiUrl() {
    if (API_BASE_URL.includes('ВАШ_НИК')) {
        scoreDisplay.textContent = 'Счет: Настройте API URL!';
        return false;
    }
    if (!userId) {
        scoreDisplay.textContent = 'Счет: Ожидание Telegram ID';
        return false;
    }
    return true;
}


async function fetchScore() {
    if (!checkApiUrl()) return;

    try {
        const response = await fetch(`${API_BASE_URL}/get_score`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId })
        });
        const data = await response.json();
        
        if (data.status === 'ok') {
            score = data.score;
            scoreDisplay.textContent = `Счет: ${score}`;
        } else {
            // Если сервер ответил, но с ошибкой (например, 400), начинаем с 0
            scoreDisplay.textContent = 'Счет: 0';
        }
    } catch (error) { 
        console.error('Ошибка при получении счета:', error); 
        // 🚨 ГЛАВНОЕ ИСПРАВЛЕНИЕ: при ошибке сети просто показываем 0, а не сообщение об ошибке
        scoreDisplay.textContent = 'Счет: 0'; 
    }
}

async function saveScore() {
    if (!checkApiUrl()) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/save_score`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, score: score })
        });
        const data = await response.json();
        
        if (data.status === 'ok') {
            console.log('Score saved:', score);
            // Если нужно, можно показать пользователю временное сообщение:
            // window.Telegram.WebApp.showAlert('Счет сохранен!');
        } else {
            console.error('Server failed to save score:', data.message);
        }

    } catch (error) { 
        console.error('Ошибка сети при сохранении счета:', error); 
    }
}

// --- Логика Кликера ---

function handleClick() {
    score++;
    scoreDisplay.textContent = `Счет: ${score}`;
    
    // Плавный отклик при клике
    if (window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }

    // Сохраняем данные, если прошло время 
    if (Date.now() - lastSaveTime > SAVE_INTERVAL) {
        saveScore();
        lastSaveTime = Date.now();
    }
}

clickButton.addEventListener('click', handleClick);


// --- Инициализация Telegram Mini App ---

if (window.Telegram.WebApp) {
    const tg = window.Telegram.WebApp;
    tg.ready(); 
    tg.expand(); 
    
    const initData = tg.initDataUnsafe;
    if (initData.user) {
        userId = initData.user.id;
        document.getElementById('telegramInfo').textContent = `Привет, ${initData.user.first_name}!`;
        fetchScore(); 
    } else {
        document.getElementById('telegramInfo').textContent = 'Ошибка: нет данных пользователя. Запуск в тестовом режиме.';
        userId = 'test_id_no_telegram'; // Для отладки
        fetchScore();
    }

    tg.MainButton.setText('СОХРАНИТЬ ПРОГРЕСС');
    tg.MainButton.show();
    
    // КРИТИЧЕСКИ ВАЖНО: сохраняем при нажатии Главной кнопки и при закрытии
    tg.MainButton.onClick(() => {
        saveScore();
        window.Telegram.WebApp.close(); // Можно закрыть приложение после сохранения
    });
    
    // Сохранение при закрытии Mini App
    tg.onEvent('viewportChanged', saveScore); 

} else {
    document.getElementById('telegramInfo').textContent = 'Запущено не в Telegram Mini App. (Тестовый режим)';
    userId = 'test_local_123'; 
    fetchScore();
}
