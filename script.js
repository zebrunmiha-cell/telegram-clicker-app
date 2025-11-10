let score = 0;
const scoreDisplay = document.getElementById('scoreDisplay');
const clickButton = document.getElementById('clickButton');

// Установите ваш API URL
const API_BASE_URL = 'https://Minyasha.pythonanywhere.com'; 

// Telegram Web App
const tg = window.Telegram.WebApp;
let userId = null; 

// Инициализация Telegram Web App
tg.ready();
if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
    userId = tg.initDataUnsafe.user.id.toString();
}

let lastSaveTime = Date.now();
const SAVE_INTERVAL = 5000; 

// --- API-Функции ---

function checkApiUrl() {
    if (!userId) {
        scoreDisplay.textContent = 'Счет: Ожидание ID';
        return false;
    }
    return true;
}

async function fetchScore() {
    if (!checkApiUrl()) return;
    
    scoreDisplay.textContent = `Счет: Загрузка...`;

    try {
        const response = await fetch(`${API_BASE_URL}/get_score`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId })
        });
        const data = await response.json();
        
        if (data.status === 'ok' && data.score !== undefined) {
            // Успех: Обновляем score
            score = data.score;
        } else {
            // Сервер ответил ошибкой (но не сброс счета)
            console.error('Сервер ответил ошибкой при получении счета:', data.message);
        }
    } catch (error) { 
        // Ошибка сети: не сбрасываем score, сохраняем текущее состояние
        console.error('Ошибка сети при получении счета:', error); 
    }
    
    // Отображаем финальное значение
    scoreDisplay.textContent = `Счет: ${score}`;
}


async function saveScore() {
    if (!checkApiUrl()) return;
    
    try {
        await fetch(`${API_BASE_URL}/save_score`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, score: score })
        });
    } catch (error) { 
        console.error('Ошибка сети при сохранении счета:', error); 
    }
}

// --- Логика Кликера ---

function handleClick() {
    score++;
    scoreDisplay.textContent = `Счет: ${score}`;
    tg.HapticFeedback.impactOccurred('light');

    if (Date.now() - lastSaveTime > SAVE_INTERVAL) {
        saveScore();
        lastSaveTime = Date.now();
    }
}

// --- Запуск ---

clickButton.addEventListener('click', handleClick);

// Сохраняем счет, когда Mini App закрывается
tg.onEvent('viewportChanged', saveScore); 

// Загружаем счет при старте
fetchScore();
