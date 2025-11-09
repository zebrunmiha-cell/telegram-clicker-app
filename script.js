let score = 0;
const scoreDisplay = document.getElementById('scoreDisplay');
const clickButton = document.getElementById('clickButton');

// ✅ ВАШ НИК УЖЕ ВСТАВЛЕН:
const API_BASE_URL = 'https://Minyasha.pythonanywhere.com'; 

let userId = null; 
let lastSaveTime = Date.now();
const SAVE_INTERVAL = 5000; // Сохраняем раз в 5 секунд

// --- API-Функции ---

function checkApiUrl() {
    // Проверка на случай, если кто-то забудет заменить ник
    if (API_BASE_URL.includes('Minyasha') && window.location.host.includes('github.io')) {
        // Мы уже знаем, что ник Minyasha, поэтому эта проверка здесь лишняя,
        // но оставим ее для надежности
    }
    if (!userId) {
        scoreDisplay.textContent = 'Счет: Ожидание ID';
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
            scoreDisplay.textContent = 'Счет: 0';
        }
    } catch (error) { 
        // 🚨 ИСПРАВЛЕНО: При ошибке сети счет устанавливается в 0
        console.error('Ошибка при получении счета:', error); 
        scoreDisplay.textContent = 'Счет: 0'; 
    }
}

async function saveScore() {
    if (!checkApiUrl()) return;
    
    try {
        await fetch(`${API_BASE_URL}/save_score`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, score: score })
        });
        // Проверка ответа опущена для скорости, но в консоли все логируется
    } catch (error) { 
        console.error('Ошибка сети при сохранении счета:', error); 
    }
}

// --- Логика Кликера ---

function handleClick() {
    score++;
    scoreDisplay.textContent = `Счет: ${score}`;
    
    if (window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }

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
        userId = 'test_id_no_telegram'; 
        fetchScore();
    }

    tg.MainButton.setText('СОХРАНИТЬ ПРОГРЕСС');
    tg.MainButton.show();
    
    tg.MainButton.onClick(saveScore);
    tg.onEvent('viewportChanged', saveScore); 

} else {
    document.getElementById('telegramInfo').textContent = 'Запущено не в Telegram Mini App. (Тестовый режим)';
    userId = 'test_local_123'; 
    fetchScore();
}
