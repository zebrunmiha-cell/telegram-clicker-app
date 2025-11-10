let score = 0;
const scoreDisplay = document.getElementById('scoreDisplay');
const clickButton = document.getElementById('clickButton');

// Установите ваш API URL (БЕЗ /v2)
const API_BASE_URL = 'https://Minyasha.pythonanywhere.com'; 

const tg = window.Telegram.WebApp;
let userId = null; 

let lastSaveTime = Date.now();
const SAVE_INTERVAL = 5000;

// --- САМЫЙ НАДЕЖНЫЙ СПОСОБ ПОЛУЧЕНИЯ ID ---
function getUserIdSafely() {
    // 1. Попытка через initDataUnsafe (быстрый доступ)
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        return tg.initDataUnsafe.user.id.toString();
    }
    
    // 2. Попытка через initData (наиболее надежный способ)
    const initData = tg.initData;
    if (initData) {
        const params = new URLSearchParams(initData);
        const userParam = params.get('user');
        
        if (userParam) {
            try {
                const user = JSON.parse(userParam);
                return user.id.toString();
            } catch (e) {
                console.error("Failed to parse user data from initData:", e);
            }
        }
    }
    return null;
}

// --- API-Функции ---

function checkApiUrl() {
    if (!userId) {
        // Блокируем, чтобы не отправлять 0
        scoreDisplay.textContent = 'Счет: Ошибка ID';
        console.error('User ID not initialized. Cannot send/receive score.');
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
    if (!userId) {
        console.warn("Клики заблокированы: нет ID.");
        return;
    }
    score++;
    scoreDisplay.textContent = `Счет: ${score}`;
    tg.HapticFeedback.impactOccurred('light');

    if (Date.now() - lastSaveTime > SAVE_INTERVAL) {
        saveScore();
        lastSaveTime = Date.now();
    }
}

// --- Запуск ---

function initApp() {
    tg.ready();
    
    // Пытаемся получить ID
    userId = getUserIdSafely();

    if (userId) {
        // ✅ ID ПОЛУЧЕН. Запуск.
        clickButton.addEventListener('click', handleClick);
        tg.onEvent('viewportChanged', saveScore); 
        
        // Добавляем небольшую задержку (300 мс) перед загрузкой счета,
        // чтобы дать Mini App время на полную инициализацию.
        setTimeout(fetchScore, 300); 
        
    } else {
        // ❌ Блокируем клики, если ID не получен
        scoreDisplay.textContent = 'Ошибка: ID пользователя не получен.';
        clickButton.disabled = true;
        console.error("Critical: Telegram User ID not available.");
    }
}

initApp();
