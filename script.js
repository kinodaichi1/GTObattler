document.addEventListener('DOMContentLoaded', () => {
    // ローディング画面
    const loader = document.getElementById('loader');
    if (loader) {
        setTimeout(() => {
            loader.classList.add('hidden');
        }, 1000);
    }

    // ナビゲーション切り替え
    const navButtons = document.querySelectorAll('.nav-button');
    const contentSections = document.querySelectorAll('.content-section');
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.dataset.target;
            navButtons.forEach(btn => btn.classList.remove('active'));
            contentSections.forEach(section => section.classList.remove('active'));
            button.classList.add('active');
            document.getElementById(targetId)?.classList.add('active');
        });
    });
});

// ===== 用語集機能 =====
const glossaryTerms = document.querySelectorAll('.glossary-term');
glossaryTerms.forEach(term => {
    term.addEventListener('click', () => {
        term.classList.toggle('active');
        term.nextElementSibling.classList.toggle('active');
    });
});

// ===== オッズ計算機機能 =====
const potTotalInput = document.getElementById('pot-total');
const callAmountInput = document.getElementById('call-amount');
const calculateBtn = document.getElementById('calculate-btn');
const resultText = document.getElementById('result-text');
calculateBtn.addEventListener('click', () => {
    const potTotal = parseFloat(potTotalInput.value);
    const callAmount = parseFloat(callAmountInput.value);
    if (isNaN(potTotal) || isNaN(callAmount) || potTotal < 0 || callAmount <= 0) {
        resultText.textContent = "有効な数値を入力してください";
        return;
    }
    const odds = (callAmount / (potTotal + callAmount)) * 100;
    resultText.textContent = `${odds.toFixed(2)}%`;
});

// ===== トーナメントタイマー機能 (完全版) =====
(() => {
    const timeLeftDisplay = document.getElementById('time-left');
    const startPauseBtn = document.getElementById('start-pause-btn');
    const resetBtn = document.getElementById('reset-btn');
    const currentLevelDisplay = document.getElementById('current-level');
    const currentSbBbDisplay = document.getElementById('current-sb-bb');
    const nextSbBbDisplay = document.getElementById('next-sb-bb');
    const blindsTbody = document.getElementById('blinds-tbody');
    const addLevelBtn = document.getElementById('add-level-btn');
    const saveStructureBtn = document.getElementById('save-structure-btn');
    const alarmSound = document.getElementById('alarm-sound');
    const confirmModal = document.getElementById('confirm-modal');
    const modalConfirmBtn = document.getElementById('modal-confirm-btn');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');

    let blindsStructure = [
        { time: 15, sb: 100, bb: 200, ante: 0 }, { time: 15, sb: 150, bb: 300, ante: 0 },
        { time: 15, sb: 200, bb: 400, ante: 50 }, { time: 15, sb: 300, bb: 600, ante: 75 },
        { time: 15, sb: 400, bb: 800, ante: 100 },
    ];
    let timerInterval = null, timeLeft = 0, isRunning = false, currentLevelIndex = 0;

    function renderBlindsTable() {
        blindsTbody.innerHTML = '';
        blindsStructure.forEach((level, index) => {
            const row = document.createElement('tr');
            if (index === currentLevelIndex) row.classList.add('active-level');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td><input type="number" value="${level.time}" data-index="${index}" data-key="time"></td>
                <td><input type="number" value="${level.sb}" data-index="${index}" data-key="sb"></td>
                <td><input type="number" value="${level.bb}" data-index="${index}" data-key="bb"></td>
                <td><input type="number" value="${level.ante}" data-index="${index}" data-key="ante"></td>
            `;
            blindsTbody.appendChild(row);
        });
    }

    function updateDisplay() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timeLeftDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        const currentLevel = blindsStructure[currentLevelIndex];
        const nextLevel = blindsStructure[currentLevelIndex + 1];
        currentLevelDisplay.textContent = currentLevelIndex + 1;
        currentSbBbDisplay.textContent = `${currentLevel.sb} / ${currentLevel.bb} Ante: ${currentLevel.ante}`;
        nextSbBbDisplay.textContent = nextLevel ? `${nextLevel.sb} / ${nextLevel.bb} Ante: ${nextLevel.ante}` : 'Final Level';
    }

    function levelUp() {
        if (currentLevelIndex < blindsStructure.length - 1) {
            currentLevelIndex++;
            if (alarmSound) { alarmSound.currentTime = 0; alarmSound.play(); }
            timeLeft = blindsStructure[currentLevelIndex].time * 60;
            updateDisplay();
            renderBlindsTable();
        } else {
            clearInterval(timerInterval);
            isRunning = false;
            startPauseBtn.textContent = 'START';
            startPauseBtn.classList.remove('paused');
            alert('トーナメントが終了しました！');
        }
    }

    function startPauseTimer() {
        if (isRunning) {
            clearInterval(timerInterval);
            isRunning = false;
            startPauseBtn.textContent = 'START';
            startPauseBtn.classList.remove('paused');
        } else {
            isRunning = true;
            startPauseBtn.textContent = 'PAUSE';
            startPauseBtn.classList.add('paused');
            timerInterval = setInterval(() => {
                timeLeft--;
                updateDisplay();
                if (timeLeft < 0) { timeLeft = 0; levelUp(); }
            }, 1000);
        }
    }

    function executeReset() {
        clearInterval(timerInterval);
        timerInterval = null;
        currentLevelIndex = 0;
        timeLeft = blindsStructure[0].time * 60;
        isRunning = false;
        updateDisplay();
        renderBlindsTable();
        startPauseBtn.textContent = 'START';
        startPauseBtn.classList.remove('paused');
    }

    startPauseBtn.addEventListener('click', startPauseTimer);
    resetBtn.addEventListener('click', () => confirmModal.classList.add('visible'));
    modalConfirmBtn.addEventListener('click', () => { executeReset(); confirmModal.classList.remove('visible'); });
    modalCancelBtn.addEventListener('click', () => confirmModal.classList.remove('visible'));
    confirmModal.addEventListener('click', (e) => { if (e.target === confirmModal) confirmModal.classList.remove('visible'); });

    addLevelBtn.addEventListener('click', () => {
        const lastLevel = blindsStructure[blindsStructure.length - 1];
        blindsStructure.push({ time: lastLevel.time, sb: Math.round(lastLevel.sb * 1.5), bb: Math.round(lastLevel.bb * 1.5), ante: Math.round(lastLevel.ante * 1.5) });
        renderBlindsTable();
    });

    saveStructureBtn.addEventListener('click', () => {
        blindsTbody.querySelectorAll('input').forEach(input => {
            const { index, key } = input.dataset;
            const value = parseFloat(input.value);
            if (!isNaN(value)) blindsStructure[index][key] = value;
        });
        executeReset();
        alert('ブラインド構成を保存し、タイマーをリセットしました。');
    });

    function initializeTimer() {
        timeLeft = blindsStructure[0].time * 60;
        updateDisplay();
        renderBlindsTable();
    }
    initializeTimer();
})();


// ===== レンジファインダー機能 (新ロジック版) =====
(() => {
    const playerCountSelect = document.getElementById('player-count');
    const positionButtonsContainer = document.getElementById('position-buttons');
    const rangeGrid = document.getElementById('range-grid');
    const vsPositionContainer = document.getElementById('vs-position-container');
    const vsPositionButtons = document.getElementById('vs-position-buttons');

    const CARDS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
    const POSITIONS = { 
        '6max': ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'], 
        'hu': ['BTN', 'BB'] 
    };

    // Hand.mdから全てのレンジを統合
    const rangeData = {
        '6max': {
            'UTG': {
                'RAISE': [
                    '99p', 'TTp', 'JJp', 'QQp', 'KKp', 'AAp', 
                    'A5s', 'ATs', 'AJs', 'AQs', 'AKs', 
                    'KJs', 'KQs', 
                    'QJs', 
                    'JTs', 
                    'AQo', 'AKo'
                ] 
            },
            'HJ': {
                'RAISE': [
                    '77p', '88p', '99p', 'TTp', 'JJp', 'QQp', 'KKp', 'AAp', 
                    'A2s', 'A3s', 'A4s', 'A5s', 'A9s', 'ATs', 'AJs', 'AQs', 'AKs', 
                    'K9s', 'KTs', 'KJs', 'KQs', 
                    'QTs', 'QJs', 
                    'J9s', 'JTs', 
                    'AJo', 'AQo', 'AKo', 
                    'KQo'
                ]
            },
            'CO': {
                'RAISE': [
                    '22p', '33p', '44p', '55p', '66p', '77p', '88p', '99p', 'TTp', 'JJp', 'QQp', 'KKp', 'AAp', 
                    'A2s', 'A3s', 'A4s', 'A5s', 'A6s', 'A7s', 'A8s', 'A9s', 'ATs', 'AJs', 'AQs', 'AKs', 
                    'K5s', 'K6s', 'K7s', 'K8s', 'K9s', 'KTs', 'KJs', 'KQs', 
                    'Q8s', 'Q9s', 'QTs', 'QJs', 
                    'J8s', 'J9s', 'JTs', 
                    'T8s', 'T9s', 
                    '98s', 
                    '87s', 
                    '76s', 
                    '65s', 
                    'ATo', 'AJo', 'AQo', 'AKo', 
                    'KJo', 'KQo', 
                    'QJo'
                ] 
            },
            'BTN': {
                'RAISE': [
                    '22p', '33p', '44p', '55p', '66p', '77p', '88p', '99p', 'TTp', 'JJp', 'QQp', 'KKp', 'AAp', 
                    'A2s', 'A3s', 'A4s', 'A5s', 'A6s', 'A7s', 'A8s', 'A9s', 'ATs', 'AJs', 'AQs', 'AKs', 
                    'K2s', 'K3s', 'K4s', 'K5s', 'K6s', 'K7s', 'K8s', 'K9s', 'KTs', 'KJs', 'KQs', 
                    'Q2s', 'Q3s', 'Q4s', 'Q5s', 'Q6s', 'Q7s', 'Q8s', 'Q9s', 'QTs', 'QJs', 
                    'J7s', 'J8s', 'J9s', 'JTs', 
                    'T7s', 'T8s', 'T9s', 
                    '96s', '97s', '98s', 
                    '86s', '87s', 
                    '75s', '76s', 
                    '64s', '65s', 
                    '54s', 
                    'A2o', 'A3o', 'A4o', 'A5o', 'A6o', 'A7o', 'A8o', 'A9o', 'ATo', 'AJo', 'AQo', 'AKo', 
                    'K9o', 'KTo', 'KJo', 'KQo', 
                    'Q9o', 'QTo', 'QJo', 
                    'J9o', 'JTo', 
                    'T9o'
                ] 
            },
            'SB': {
                'RAISE': [
                    '22p', '33p', '44p', '55p', '66p', '77p', '88p', '99p', 'TTp', 'JJp', 'QQp', 'KKp', 'AAp', 
                    'A2s', 'A3s', 'A4s', 'A5s', 'A6s', 'A7s', 'A8s', 'A9s', 'ATs', 'AJs', 'AQs', 'AKs', 
                    'K2s', 'K3s', 'K4s', 'K5s', 'K6s', 'K7s', 'K8s', 'K9s', 'KTs', 'KJs', 'KQs', 
                    'Q2s', 'Q3s', 'Q4s', 'Q5s', 'Q6s', 'Q7s', 'Q8s', 'Q9s', 'QTs', 'QJs', 
                    'J2s', 'J3s', 'J4s', 'J5s', 'J6s', 'J7s', 'J8s', 'J9s', 'JTs', 
                    'T5s', 'T6s', 'T7s', 'T8s', 'T9s', 
                    '95s', '96s', '97s', '98s', 
                    '84s', '85s', '86s', '87s', 
                    '74s', '75s', '76s', 
                    '63s', '64s', '65s', 
                    '52s', '53s', '54s', 
                    '42s', '43s', 
                    '32s', 
                    'A4o', 'A5o', 'A6o', 'A7o', 'A8o', 'A9o', 'ATo', 'AJo', 'AQo', 'AKo', 
                    'KJo', 'KQo', 
                    'QTo', 'QJo', 
                    'JTo'
                ],
                'CALL': [
                    'A2o', 'A3o', 
                    'K2o', 'K3o', 'K4o', 'K5o', 'K6o', 'K7o', 'K8o', 'K9o', 'KTo', 
                    'Q2o', 'Q3o', 'Q4o', 'Q5o', 'Q6o', 'Q7o', 'Q8o', 'Q9o', 
                    'J2o', 'J3o', 'J4o', 'J5o', 'J6o', 'J7o', 'J8o', 'J9o', 
                    'T2o', 'T3o', 'T4o', 'T5o', 'T6o', 'T7o', 'T8o', 'T9o', 
                    '92o', '93o', '94o', '95o', '96o', '97o', '98o', 
                    '82o', '83o', '84o', '85o', '86o', '87o', 
                    '72o', '73o', '74o', '75o', '76o', 
                    '62o', '63o', '64o', '65o', 
                    '52o', '53o', '54o', 
                    '42o', '43o', 
                    '32o'
                ]
            },
            'BB': {
                '3-BET': [
                    'JJp', 'QQp', 'KKp', 'AAp', 
                    'A2s', 'A3s', 'A4s', 'A5s', 'AJs', 'AQs', 'AKs', 
                    'KQs', 'KJs', 'KTs', 
                    'QJs', 
                    'JTs', 
                    'AQo', 'AKo'
                ],
                'CALL': [
                    '22p', '33p', '44p', '55p', '66p', '77p', '88p', '99p', 'TTp', 
                    'A6s', 'A7s', 'A8s', 'A9s', 'ATs', 
                    'K2s', 'K3s', 'K4s', 'K5s', 'K6s', 'K7s', 'K8s', 'K9s', 
                    'Q2s', 'Q3s', 'Q4s', 'Q5s', 'Q6s', 'Q7s', 'Q8s', 'Q9s', 'QTs', 
                    'J2s', 'J3s', 'J4s', 'J5s', 'J6s', 'J7s', 'J8s', 'J9s', 
                    'T8s', 'T9s', 
                    '97s', '98s', 
                    '86s', '87s', 
                    '75s', '76s', 
                    '65s', 
                    '54s', 
                    'A2o', 'A3o', 'A4o', 'A5o', 'A6o', 'A7o', 'A8o', 'A9o', 'ATo', 'AJo', 
                    'KTo', 'KJo', 'KQo', 
                    'QTo', 'QJo', 
                    'JTo'
                ]
            }
        },
        'hu': {
            "BTN": {
                "RAISE": [
                    "22p", "33p", "44p", "55p", "66p", "77p", "88p", "99p", "TTp", "JJp", "QQp", "KKp", "AAp",
                    "A2s", "A3s", "A4s", "A5s", "A6s", "A7s", "A8s", "A9s", "ATs", "AJs", "AQs", "AKs",
                    "K2s", "K3s", "K4s", "K5s", "K6s", "K7s", "K8s", "K9s", "KTs", "KJs", "KQs",
                    "Q2s", "Q3s", "Q4s", "Q5s", "Q6s", "Q7s", "Q8s", "Q9s", "QTs", "QJs",
                    "J7s", "J8s", "J9s", "JTs",
                    "T7s", "T8s", "T9s",
                    "97s", "98s",
                    "87s",
                    "76s",
                    "65s",
                    "54s",
                    "A2o", "A3o", "A4o", "A5o", "A6o", "A7o", "A8o", "A9o", "ATo", "AJo", "AQo", "AKo",
                    "K9o", "KTo", "KJo", "KQo",
                    "Q9o", "QTo", "QJo",
                    "J9o", "JTo",
                    "T9o"
                ]
            },
            "BB": {
                "3-BET": [
                    "AAp", "KKp", "QQp", "JJp","TTp", "99p", "88p", "77p", "66p",
                    "AKs", "AQs", "AJs", "ATs", "A5s", "A4s", "A3s", "A2s",
                    "AQo", "AJo", "ATo",
                    "KQs", "KJs", "KTs",
                    "QJs", "QTs",
                    "JTs",
                    "T9s",
                    "AKo", "KQo"
                ],
                "CALL": [
                    "55p", "44p", "33p", "22p",
                    "A9s", "A8s", "A7s", "A6s",
                    "K9s", "K8s", "K7s", "K6s", "K5s", "K4s", "K3s", "K2s",
                    "Q9s", "Q8s", "Q7s", "Q6s", "Q5s", "Q4s", "Q3s", "Q2s",
                    "J9s", "J8s", "J7s", "J6s", "J5s", "J4s", "J3s", "J2s",
                    "T8s", "T7s", "T6s", "T5s", "T4s", "T3s", "T2s",
                    "98s", "97s", "96s", "95s", "94s", "93s", "92s",
                    "87s", "86s", "85s", "84s", "83s",
                    "76s", "75s", "74s", "73s",
                    "65s", "64s", "63s",
                    "54s", "53s", "52s",
                    "43s", "42s",
                    "32s",
                    "A9o", "A8o", "A7o", "A6o", "A5o", "A4o", "A3o", "A2o",
                    "KJo", "KTo", "K9o", "K8o", "K7o", "K6o", "K5o",
                    "QJo", "QTo", "Q9o", "Q8o", "Q7o", "Q6o",
                    "JTo", "J9o", "J8o", "J7o",
                    "T8o", "T9o", "T7o",
                    "98o", "97o",
                    "87o", "86o",
                    "76o",
                    "65o",
                    "54o"
                ]
            }
        }
    };
    let currentSelection = { 
        playerCount: '6max', 
        position: 'UTG',
        vsPosition: 'UTG' // BB用
    };

    function getHandName(i, j) {
        const c1 = CARDS[i], c2 = CARDS[j];
        if (i === j) return `${c1}${c2}p`;
        return i < j ? `${c1}${c2}s` : `${c2}${c1}o`;
    }

    function renderRangeGrid() {
        const { playerCount, position, vsPosition } = currentSelection;
        let rangeKey = position;
        if (position === 'BB' && playerCount === '6max') {
            rangeKey = `BB_vs_${vsPosition}`;
        }
        const currentRange = rangeData[playerCount]?.[rangeKey];
        rangeGrid.innerHTML = '';

        if (!currentRange) {
            rangeGrid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; align-self: center;">レンジが定義されていません</div>`;
            return;
        }

        const raiseHands = new Set(currentRange.RAISE || []);
        const callHands = new Set(currentRange.CALL || []);
        const threeBetHands = new Set(currentRange['3-BET'] || []);

        for (let i = 0; i < 13; i++) {
            for (let j = 0; j < 13; j++) {
                const handName = getHandName(i, j);
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.textContent = handName.replace(/[pso]/, '');

                if (threeBetHands.has(handName)) cell.classList.add('cell-three-bet');
                else if (raiseHands.has(handName)) cell.classList.add('cell-raise');
                else if (callHands.has(handName)) cell.classList.add('cell-call');
                else cell.classList.add('cell-fold');
                
                rangeGrid.appendChild(cell);
            }
        }
    }

    function updatePositionButtons() {
        const positions = POSITIONS[currentSelection.playerCount];
        positionButtonsContainer.innerHTML = '';
        positions.forEach(pos => {
            const button = document.createElement('button');
            button.className = 'pos-btn';
            button.dataset.pos = pos;
            button.textContent = pos;
            if (pos === currentSelection.position) button.classList.add('active');
            positionButtonsContainer.appendChild(button);
        });
    }

    function handlePositionChange() {
        updatePositionButtons();
        renderRangeGrid();
    }

    playerCountSelect.addEventListener('change', (e) => {
        currentSelection.playerCount = e.target.value;
        const availablePositions = POSITIONS[currentSelection.playerCount];
        if (!availablePositions.includes(currentSelection.position)) {
            currentSelection.position = availablePositions[0];
        }
        handlePositionChange();
    });

    positionButtonsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('pos-btn')) {
            currentSelection.position = e.target.dataset.pos;
            handlePositionChange();
        }
    });
    
    // 初期化
    updatePositionButtons();
    renderRangeGrid();
})();