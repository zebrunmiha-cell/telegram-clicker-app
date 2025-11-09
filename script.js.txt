let score = 0;
const scoreDisplay = document.getElementById('scoreDisplay');
const clickButton = document.getElementById('clickButton');

// !!! ВАЖНО: ЗАМЕНИТЕ ЭТОТ АДРЕС НА ВАШ ДОМЕН PYTHONANYWHERE (С HTTPS) !!!
const API_BASE_URL = 'https://Minyasha.pythonanywhere.com'; 
// !!! ВАЖНО !!!

let userId = null; 
let lastSaveTime = Date.now();
const SAVE_INTERVAL = 3000; // Сохраняем не чаще, чем раз в 3 секунды

// --- API-Функции ---

async function fetchScore() {
    // Проверка, что ID и адрес API установлены
    if (!userId || API_BASE_URL.includes('ВАШ_НИК')) {
        scoreDisplay.textContent = 'Счет: Ошибка адреса API!';
        return;
    } 

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
            scoreDisplay.textContent = 'Счет: Ошибка загрузки';
        }
    } catch (error) { 
        console.error('Ошибка при получении счета:', error); 
        scoreDisplay.textContent = 'Счет: Ошибка сети';
    }
}

async function saveScore() {
    if (!userId || API_BASE_URL.includes('ВАШ_НИК')) return;
    
    try {
        await fetch(`${API_BASE_URL}/save_score`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, score: score })
        });
    } catch (error) { 
        console.error('Ошибка при сохранении счета:', error); 
    }
}

// --- Логика Кликера ---

function handleClick() {
    score++;
    scoreDisplay.textContent = `Счет: ${score}`;
    
    // Легкая вибрация при клике
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
        document.getElementById('telegramInfo').textContent = `Привет, ${initData.user.first_name}! (ID: ${userId})`;
        // Загружаем счет сразу после получения ID
        fetchScore(); 
    } else {
        document.getElementById('telegramInfo').textContent = 'Ошибка: нет данных пользователя.';
    }

    tg.MainButton.setText('СОХРАНИТЬ ПРОГРЕСС');
    tg.MainButton.show();
    
    // Сохранение при нажатии на Главную кнопку
    tg.MainButton.onClick(() => {
        saveScore();
        tg.showAlert('Прогресс сохранен!');
    });
    
    // Дополнительное сохранение при изменении размера (например, при сворачивании)
    tg.onEvent('viewportChanged', saveScore); 

} else {
    document.getElementById('telegramInfo').textContent = 'Запущено не в Telegram Mini App. (Тестовый режим)';
    // Для тестирования без Telegram:
    userId = 'test_local_123'; 
    fetchScore();
}