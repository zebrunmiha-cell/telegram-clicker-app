let score = 0;
const scoreDisplay = document.getElementById('scoreDisplay');
const clickButton = document.getElementById('clickButton');

// Установите ваш API URL
const API_BASE_URL = 'https://Minyasha.pythonanywhere.com/v2'; // <--- ВРЕМЕННОЕ ИЗМЕНЕНИЕ 

// Telegram Web App
const tg = window.Telegram.WebApp;
let userId = null; 

let lastSaveTime = Date.now();
const SAVE_INTERVAL = 5000; 

// --- API-Функции ---

function checkApiUrl() {
    if (!userId) {
        // Логируем, что ID не получен, но не блокируем Mini App
        console.error('User ID not initialized. Cannot send/receive score.');
        return false;
    }
    return true;
}

async function fetchScore() {
    // ВАЖНО: Мы вызываем checkApiUrl ТОЛЬКО после того, как ID гарантированно получен
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
            score = data.score;
        } else {
            console.error('Сервер ответил ошибкой при получении счета:', data.message);
        }
    } catch (error) { 
        console.error('Ошибка сети при получении счета:', error); 
    }
    
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

// --- НОВАЯ ФУНКЦИЯ ЗАПУСКА ---

function initApp() {
    // Инициализация Telegram Web App
    tg.ready();
    
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        // ✅ ID ПОЛУЧЕН
        userId = tg.initDataUnsafe.user.id.toString();
        // Привязываем события ТОЛЬКО после получения ID
        clickButton.addEventListener('click', handleClick);
        tg.onEvent('viewportChanged', saveScore); 
        
        // Загружаем счет только после получения ID
        fetchScore(); 
    } else {
        // ❌ ID НЕ ПОЛУЧЕН (запуск в браузере или ошибка)
        scoreDisplay.textContent = 'Ошибка: ID пользователя не получен.';
        console.error("Critical: Telegram User ID not available.");
        // Блокируем клики, чтобы избежать отправки нулей
        clickButton.disabled = true;
    }
}


// Запуск инициализации приложения
initApp();

