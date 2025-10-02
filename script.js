document.addEventListener("DOMContentLoaded", () => {
    // グローバルなUI初期化
    initializeGlobalUI();
    
    // 各機能モジュールの初期化
    initializeGlossary();
    initializeTournamentTimer();
    initializeRangeFinder();
    initializeCalculators();
    initializeGtoTrainer();
    TexasHoldemGame.init();
});

function initializeGlobalUI() {
    // ローディング画面
    const loader = document.getElementById("loader");
    if (loader) {
        setTimeout(() => {
            loader.classList.add("hidden");
        }, 500);
    }

    // ナビゲーション切り替え
    const navButtons = document.querySelectorAll(".nav-button");
    const contentSections = document.querySelectorAll(".content-section");
    navButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const targetId = button.dataset.target;
            navButtons.forEach((btn) => btn.classList.remove("active"));
            contentSections.forEach((section) => section.classList.remove("active"));
            button.classList.add("active");
            const targetEl = document.getElementById(targetId);
            if (targetEl) targetEl.classList.add("active");
        });
    });

    // 計算機タブ切り替え
    const calcNavButtons = document.querySelectorAll(".calc-nav-button");
    const calculatorContents = document.querySelectorAll(".calculator-content");
    calcNavButtons.forEach(button => {
        button.addEventListener("click", () => {
            const targetId = button.dataset.calc + "-calc";
            calcNavButtons.forEach(btn => btn.classList.remove("active"));
            calculatorContents.forEach(content => content.classList.remove("active"));
            button.classList.add("active");
            const targetEl = document.getElementById(targetId);
            if(targetEl) targetEl.classList.add("active");
        });
    });
}

// ★★★ 用語集の表示ロジックを修正 ★★★
function initializeGlossary() {
    const glossaryContainer = document.getElementById('glossary-container');
    if (!glossaryContainer || typeof glossaryData === 'undefined') {
        console.error("Glossary container or data not found!");
        return;
    }

    glossaryContainer.innerHTML = ''; // コンテナをクリア

    // カテゴリーごとにループ
    glossaryData.forEach(categoryData => {
        // カテゴリー見出しを作成
        const categoryTitle = document.createElement('h3');
        categoryTitle.className = 'glossary-category-title';
        categoryTitle.textContent = categoryData.category;
        glossaryContainer.appendChild(categoryTitle);

        // 各カテゴリー内の用語をループ
        categoryData.terms.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'glossary-item';
            itemEl.innerHTML = `
                <button class="glossary-term">${item.term}</button>
                <div class="glossary-description"><p>${item.description}</p></div>
            `;
            glossaryContainer.appendChild(itemEl);
        });
    });

    // イベントリスナーをまとめて設定
    glossaryContainer.querySelectorAll('.glossary-term').forEach(button => {
        button.addEventListener('click', () => {
            const description = button.nextElementSibling;
            button.classList.toggle('active');
            description.classList.toggle('active');
        });
    });
}


function initializeTournamentTimer() {
    const timeLeftDisplay = document.getElementById("time-left");
    if(!timeLeftDisplay) return; // タイマー機能がなければ終了

    const startPauseBtn = document.getElementById("start-pause-btn");
    const resetBtn = document.getElementById("reset-btn");
    const clockBtn = document.getElementById("clock-btn");
    const clockDisplay = document.getElementById("clock-display");
    const currentLevelDisplay = document.getElementById("current-level");
    const currentSbBbDisplay = document.getElementById("current-sb-bb");
    const nextSbBbDisplay = document.getElementById("next-sb-bb");
    const blindsTbody = document.getElementById("blinds-tbody");
    const addLevelBtn = document.getElementById("add-level-btn");
    const saveStructureBtn = document.getElementById("save-structure-btn");
    const alarmSound = document.getElementById("alarm-sound");
    const confirmModal = document.getElementById("confirm-modal");
    const modalConfirmBtn = document.getElementById("modal-confirm-btn");
    const modalCancelBtn = document.getElementById("modal-cancel-btn");

    let blindsStructure = [
        { time: 8, sb: 1, bb: 2 }, { time: 8, sb: 2, bb: 5 },
        { time: 8, sb: 5, bb: 10 }, { time: 8, sb: 10, bb: 20 },
        { time: 8, sb: 15, bb: 30 },
    ];
    let timerInterval = null, timeLeft = 0, isRunning = false, currentLevelIndex = 0;
    let clockTimerInterval = null, isClockRunning = false;

    function renderBlindsTable() {
        if (!blindsTbody) return;
        blindsTbody.innerHTML = "";
        blindsStructure.forEach((level, index) => {
            const row = document.createElement("tr");
            if (index === currentLevelIndex) row.classList.add("active-level");
            row.innerHTML = `
                <td>${index + 1}</td>
                <td><input type="number" value="${level.time}" data-index="${index}" data-key="time"></td>
                <td><input type="number" value="${level.sb}" data-index="${index}" data-key="sb"></td>
                <td><input type="number" value="${level.bb}" data-index="${index}" data-key="bb"></td>
                <td><button class="delete-level-btn" data-index="${index}">削除</button></td>
            `;
            blindsTbody.appendChild(row);
        });
    }

    function updateDisplay() {
        const minutes = Math.floor(timeLeft / 60); const seconds = timeLeft % 60;
        if(timeLeftDisplay) timeLeftDisplay.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
        const currentLevel = blindsStructure[currentLevelIndex]; const nextLevel = blindsStructure[currentLevelIndex + 1];
        if(currentLevelDisplay) currentLevelDisplay.textContent = currentLevelIndex + 1;
        if(currentSbBbDisplay && currentLevel) currentSbBbDisplay.textContent = `${currentLevel.sb} / ${currentLevel.bb}`;
        if(nextSbBbDisplay) nextSbBbDisplay.textContent = nextLevel ? `${nextLevel.sb} / ${nextLevel.bb}` : "Final Level";
        const totalTimeForLevel = blindsStructure[currentLevelIndex]?.time * 60 || 0;
        const progressBar = document.getElementById("timer-progress-bar");
        if (progressBar) { const progressPercentage = totalTimeForLevel > 0 ? (timeLeft / totalTimeForLevel) * 100 : 100; progressBar.style.width = `${progressPercentage}%`; }
    }
    
    function tick() { if (timeLeft > 0) timeLeft--; else levelUp(); updateDisplay(); }
    function levelUp() {
        if (currentLevelIndex < blindsStructure.length - 1) {
            currentLevelIndex++;
            if (alarmSound) alarmSound.play().catch(e => console.log("Audio play failed:", e));
            timeLeft = blindsStructure[currentLevelIndex].time * 60; renderBlindsTable();
        } else { pauseTimer(); timeLeft = 0; }
    }
    function startTimer() { if (isRunning) return; isRunning = true; startPauseBtn.textContent = "PAUSE"; startPauseBtn.classList.add("paused"); timerInterval = setInterval(tick, 1000); }
    function pauseTimer() { isRunning = false; clearInterval(timerInterval); startPauseBtn.textContent = "START"; startPauseBtn.classList.remove("paused"); }
    function executeReset() { stopClock(); pauseTimer(); currentLevelIndex = 0; timeLeft = blindsStructure.length > 0 ? blindsStructure[0].time * 60 : 0; updateDisplay(); renderBlindsTable(); }

    function startClock() {
        isClockRunning = true;
        clockBtn.textContent = "CANCEL";
        clockBtn.classList.add("clock-active");
        startPauseBtn.disabled = true;
        resetBtn.disabled = true;

        let clockTimeLeft = 30;
        clockDisplay.textContent = clockTimeLeft;
        clockDisplay.style.display = "flex";
        timeLeftDisplay.classList.add("dimmed");

        clockTimerInterval = setInterval(() => {
            clockTimeLeft--;
            clockDisplay.textContent = clockTimeLeft;
            if (clockTimeLeft < 0) {
                stopClock(true); // 時間切れ
            }
        }, 1000);
    }

    function stopClock(timeIsUp = false) {
        clearInterval(clockTimerInterval);
        isClockRunning = false;
        if (timeIsUp && alarmSound) alarmSound.play().catch(e => console.log("Audio play failed:", e));
        
        clockDisplay.style.display = "none";
        timeLeftDisplay.classList.remove("dimmed");
        clockBtn.textContent = "CLOCK";
        clockBtn.classList.remove("clock-active");
        startPauseBtn.disabled = false;
        resetBtn.disabled = false;
    }

    startPauseBtn?.addEventListener("click", () => isRunning ? pauseTimer() : startTimer());
    resetBtn?.addEventListener("click", () => confirmModal.classList.add('visible'));
    clockBtn?.addEventListener("click", () => isClockRunning ? stopClock() : startClock());

    modalConfirmBtn?.addEventListener("click", () => { executeReset(); confirmModal.classList.remove('visible'); });
    modalCancelBtn?.addEventListener("click", () => confirmModal.classList.remove('visible'));
    saveStructureBtn?.addEventListener("click", () => {
        blindsTbody.querySelectorAll("input").forEach(input => {
            const { index, key } = input.dataset;
            const value = parseFloat(input.value);
            if (!isNaN(value)) blindsStructure[index][key] = value;
        });
        executeReset(); alert("ブラインド構成を保存し、タイマーをリセットしました。");
    });
    blindsTbody?.addEventListener("click", (e) => {
        if (e.target.classList.contains("delete-level-btn")) {
            if (blindsStructure.length > 1) { blindsStructure.splice(parseInt(e.target.dataset.index, 10), 1); executeReset(); } else alert("最後のレベルは削除できません。");
        }
    });
    addLevelBtn?.addEventListener("click", () => {
        const last = blindsStructure[blindsStructure.length - 1] || { time: 8, sb: 50, bb: 100 };
        blindsStructure.push({ ...last, sb: last.bb, bb: last.bb * 2 });
        renderBlindsTable();
    });
    executeReset();
}

function initializeRangeFinder() {
    const playerCountSelect = document.getElementById("player-count");
    if(!playerCountSelect) return;
    const stackSizeSelect = document.getElementById("stack-size");
    const positionButtonsContainer = document.getElementById("position-buttons"), rangeGrid = document.getElementById("range-grid");
    const CARDS = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];
    const POSITIONS = { "6max": ["UTG", "HJ", "CO", "BTN", "SB", "BB"], hu: ["BTN", "BB"] };
    let currentSelection = { 
        stackSize: stackSizeSelect.value, 
        playerCount: playerCountSelect.value, 
        position: "UTG" 
    };
    function getHandName(i, j) { const c1 = CARDS[i], c2 = CARDS[j]; return i === j ? `${c1}${c2}` : (i < j ? `${c1}${c2}s` : `${c2}${c1}o`); }
    function expandRange(range) { const expanded = new Set(); if(!range) return expanded; range.forEach(n => { expanded.add(n); if (n.endsWith('s') || n.endsWith('o')) { expanded.add(`${n[1]}${n[0]}${n[2]}`); } }); return expanded; }
    function renderRangeGrid() {
        if (!rangeGrid || typeof rangeData === 'undefined') return;
        const currentRange = rangeData[currentSelection.stackSize]?.[currentSelection.playerCount]?.[currentSelection.position];
        rangeGrid.innerHTML = "";
        if (!currentRange) { rangeGrid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; align-self: center;">レンジ定義なし</div>`; return; }
        const raiseHands = expandRange(currentRange.RAISE), callHands = expandRange(currentRange.CALL), threeBetHands = expandRange(currentRange["3-BET"]);
        for (let i = 0; i < 13; i++) {
            for (let j = 0; j < 13; j++) {
                const handName = getHandName(i, j);
                const cell = document.createElement("div");
                cell.className = "grid-cell"; cell.textContent = handName;
                if (threeBetHands.has(handName)) cell.classList.add("cell-three-bet");
                else if (raiseHands.has(handName)) cell.classList.add("cell-raise");
                else if (callHands.has(handName)) cell.classList.add("cell-call");
                else cell.classList.add("cell-fold");
                rangeGrid.appendChild(cell);
            }
        }
    }
    function updatePositionButtons() {
        if (!positionButtonsContainer) return;
        const positions = POSITIONS[currentSelection.playerCount];
        positionButtonsContainer.innerHTML = "";
        positions.forEach(pos => {
            const button = document.createElement("button");
            button.className = `pos-btn ${pos === currentSelection.position ? 'active' : ''}`;
            button.dataset.pos = pos; button.textContent = pos;
            positionButtonsContainer.appendChild(button);
        });
    }
    stackSizeSelect.addEventListener("change", (e) => { currentSelection.stackSize = e.target.value; renderRangeGrid(); });
    playerCountSelect.addEventListener("change", (e) => { currentSelection.playerCount = e.target.value; currentSelection.position = POSITIONS[currentSelection.playerCount][0]; updatePositionButtons(); renderRangeGrid(); });
    positionButtonsContainer.addEventListener("click", (e) => { if (e.target.classList.contains("pos-btn")) { currentSelection.position = e.target.dataset.pos; updatePositionButtons(); renderRangeGrid(); } });
    updatePositionButtons(); renderRangeGrid();
}

function initializeCalculators() {
    document.getElementById('calculate-btn')?.addEventListener('click', () => {
        const pot = parseFloat(document.getElementById('pot-total').value), call = parseFloat(document.getElementById('call-amount').value);
        const resultText = document.getElementById('result-text');
        if (resultText) resultText.textContent = (isNaN(pot) || isNaN(call) || (pot + call) === 0) ? '--.--%' : `${((call / (pot + call)) * 100).toFixed(2)}%`;
    });
    document.getElementById('fe-calculate-btn')?.addEventListener('click', () => {
        const pot = parseFloat(document.getElementById('fe-pot-size').value), bet = parseFloat(document.getElementById('fe-bet-size').value);
        const resultText = document.getElementById('fe-result-text');
        if (resultText) resultText.textContent = (isNaN(pot) || isNaN(bet) || (pot + bet) === 0) ? '--.--%' : `${((bet / (pot + bet)) * 100).toFixed(2)}%`;
    });
    document.getElementById('outs-calculate-btn')?.addEventListener('click', () => {
        const outs = parseInt(document.getElementById('outs-count').value);
        const resultNext = document.getElementById('outs-result-next'), resultBoth = document.getElementById('outs-result-both');
        if (!resultNext || !resultBoth) return;
        if (isNaN(outs) || outs < 0 || outs > 47) { resultNext.textContent = '--.--%'; resultBoth.textContent = '--.--%'; return; }
        resultNext.textContent = `${(outs * 2).toFixed(2)}%`; resultBoth.textContent = `${(outs * 4).toFixed(2)}%`;
    });
}

function initializeGtoTrainer() {
    const questionTextEl = document.getElementById("question-text");
    if(!questionTextEl) return;
    const answerOptionsEl = document.getElementById("answer-options"), feedbackTextEl = document.getElementById("feedback-text"), explanationTextEl = document.getElementById("explanation-text");
    const startBtn = document.getElementById("start-trainer-btn"), scoreEl = document.getElementById("trainer-score"), attemptsEl = document.getElementById("trainer-attempts");
    const categorySelect = document.getElementById("question-type-select");
    let score = 0, attempts = 0, currentQuestion = {};
    function generateQuestion() {
        feedbackTextEl.textContent = ""; explanationTextEl.textContent = ""; answerOptionsEl.innerHTML = "";
        startBtn.textContent = "次の問題へ";
        const category = categorySelect.value;
        const questions = (typeof questionBank !== 'undefined') ? (category === "all" ? Object.values(questionBank).flat() : questionBank[category]) : [];
        if (!questions || questions.length === 0) { questionTextEl.textContent = "問題がありません。"; return; }
        currentQuestion = questions[Math.floor(Math.random() * questions.length)];
        questionTextEl.textContent = currentQuestion.question;
        currentQuestion.options.forEach(option => {
            const button = document.createElement("button");
            button.textContent = option; button.className = "answer-btn";
            button.addEventListener("click", handleAnswerClick);
            answerOptionsEl.appendChild(button);
        });
    }
    function handleAnswerClick(e) {
        const selected = e.target.textContent, isCorrect = selected === currentQuestion.answer;
        attempts++;
        if (isCorrect) { score++; feedbackTextEl.textContent = "正解！"; feedbackTextEl.className = "correct"; }
        else { feedbackTextEl.textContent = "不正解..."; feedbackTextEl.className = "incorrect"; }
        explanationTextEl.textContent = currentQuestion.explanation ? `解説: ${currentQuestion.explanation}` : '';
        scoreEl.textContent = score; attemptsEl.textContent = attempts;
        Array.from(answerOptionsEl.children).forEach(btn => {
            btn.disabled = true;
            if (btn.textContent === currentQuestion.answer) btn.classList.add("correct");
            else if (btn.textContent === selected) btn.classList.add("incorrect");
        });
    }
    startBtn?.addEventListener("click", generateQuestion);
}

const TexasHoldemGame = (() => {
    let state = {}, dom = {};
    const RANKS = '23456789TJQKA', SUITS = '♠♥♦♣', SUIT_COLORS = { '♠': 'black', '♥': 'red', '♦': 'red', '♣': 'black' };
    const HAND_RANKS={HIGH_CARD:0,ONE_PAIR:1,TWO_PAIR:2,THREE_OF_A_KIND:3,STRAIGHT:4,FLUSH:5,FULL_HOUSE:6,FOUR_OF_A_KIND:7,STRAIGHT_FLUSH:8,ROYAL_FLUSH:9};
    const HAND_NAMES=["ハイカード","ワンペア","ツーペア","スリーカード","ストレート","フラッシュ","フルハウス","フォーカード","ストレートフラッシュ","ロイヤルフラッシュ"];
    const ACTION_DELAY = 1500;

    function init() {
        dom = {
            setupScreen: document.getElementById('th-setup-screen'), gameScreen: document.getElementById('th-game-screen'),
            playersWrapper: document.getElementById('th-players-wrapper'), potTotalElem: document.getElementById('th-pot-total-value'),
            communityCardsArea: document.getElementById('th-community-cards-area'), showdownResultsArea: document.getElementById('th-showdown-results-area'),
            alertElement: document.getElementById('th-custom-alert'), resetButton: document.getElementById('th-reset-game-btn')
        };
        if(!dom.setupScreen) return;
        dom.resetButton.addEventListener('click', () => { if (confirm("本当にゲームをリセットして設定画面に戻りますか？")) init(); });
        renderSetupScreen();
    }

    function renderSetupScreen() {
        dom.setupScreen.innerHTML = `<div class="setup-form"><label>プレイヤー数</label><select id="th-num-players">${[2,3,4,5,6,7,8,9,10].map(n=>`<option value="${n}">${n}人</option>`).join('')}</select><label>初期スタック</label><input type="number" id="th-initial-stack" value="10000"><label>SB</label><input type="number" id="th-small-blind" value="50"><label>BB</label><input type="number" id="th-big-blind" value="100"></div><button id="th-start-game-btn">ゲーム開始</button>`;
        dom.setupScreen.querySelector('#th-start-game-btn').addEventListener('click', initializeGame);
        dom.gameScreen.style.display = 'none'; dom.setupScreen.style.display = 'block';
    }

    function initializeGame() {
        const config = {
            numPlayers: parseInt(document.getElementById('th-num-players').value), initialStack: parseInt(document.getElementById('th-initial-stack').value),
            sb: parseInt(document.getElementById('th-small-blind').value), bb: parseInt(document.getElementById('th-big-blind').value)
        };
        state = { config, players: [], pots: [], dealerIndex: -1, activePlayerIndex: -1, streetHighestBet: 0, lastRaiseSize: 0, streetIndex: 0, deck: [], communityCards: [], showdownWinners: null, isAnimating: false };
        state.players = Array.from({ length: config.numPlayers }, (_, i) => ({ id: i, name: `プレイヤー ${i + 1}`, stack: config.initialStack, betInStreet: 0, totalBetInHand: 0, isEliminated: false, isFolded: false, hasActedThisStreet: false, isAllIn: false, hand: [], handDetails: null }));
        dom.setupScreen.style.display = 'none'; dom.gameScreen.style.display = 'flex';
        generatePlayerAreas(); startHand();
    }
    
    function generatePlayerAreas() {
        dom.playersWrapper.innerHTML = '';
        state.players.forEach(p => {
            const area = document.createElement('div');
            area.id = `player-area-${p.id}`; area.className = 'player-area'; area.dataset.playerId = p.id;
            area.innerHTML = `<div class="player-header"><div id="dealer-${p.id}" class="dealer-btn">D</div><h2 class="player-name">${p.name}</h2><div id="blind-${p.id}" class="blind-indicator"></div></div><div class="stack" id="stack-${p.id}"></div><div class="bet-display">ベット額: <span id="bet-display-${p.id}">0</span></div><div class="cards-area" id="cards-area-${p.id}"></div><div class="hand-rank-display" id="hand-rank-${p.id}"></div><div class="actions"><button class="btn-fold">フォールド</button><button class="btn-check">チェック</button><button class="btn-call">コール</button><button class="btn-all-in">オールイン</button></div><div class="raise-actions" style="display:none;"><div class="raise-controls"><input type="range" class="raise-slider" min="0" max="0" step="10"><input type="number" class="raise-input" min="0" max="0"></div><button class="btn-raise">レイズ</button></div>`;
            dom.playersWrapper.appendChild(area);
        });
        addPlayerEventListeners();
    }

    function addPlayerEventListeners() {
        document.querySelectorAll('#texas-holdem .player-area').forEach(area => {
            const id = parseInt(area.dataset.playerId);
            area.querySelector('.btn-fold').addEventListener('click', () => handleAction(id, 'fold')); area.querySelector('.btn-call').addEventListener('click', () => handleAction(id, 'call'));
            area.querySelector('.btn-check').addEventListener('click', () => handleAction(id, 'check')); area.querySelector('.btn-all-in').addEventListener('click', () => handleAction(id, 'all-in'));
            area.querySelector('.btn-raise').addEventListener('click', () => handleAction(id, 'raise', parseInt(area.querySelector('.raise-input').value)));
            const slider = area.querySelector('.raise-slider'), input = area.querySelector('.raise-input');
            slider.addEventListener('input', () => { input.value = slider.value; updateRaiseButtonText(id); }); input.addEventListener('input', () => { slider.value = input.value; updateRaiseButtonText(id); });
        });
    }
    
    function updateRaiseButtonText(playerId){
        const area = document.getElementById(`player-area-${playerId}`), player = state.players[playerId];
        if(!area || !player) return;
        const input = area.querySelector('.raise-input'), raiseBtn = area.querySelector('.btn-raise');
        if(!input || !raiseBtn) return;
        raiseBtn.textContent = `レイズ (${(parseInt(input.value) || 0) + player.betInStreet})`;
    }

    function updateUI() {
        state.players.forEach(p => {
            const area = document.getElementById(`player-area-${p.id}`);
            area.classList.toggle('eliminated', p.isEliminated); area.classList.toggle('folded', p.isFolded); area.classList.toggle('active-turn', p.id === state.activePlayerIndex && !state.isAnimating);
            document.getElementById(`stack-${p.id}`).textContent = `${p.stack}円`; document.getElementById(`dealer-${p.id}`).classList.toggle('active', p.id === state.dealerIndex);
            document.getElementById(`bet-display-${p.id}`).textContent = p.betInStreet;
            const blindElem = document.getElementById(`blind-${p.id}`); blindElem.className = 'blind-indicator';
            if (p.id === state.sbIndex) { blindElem.textContent = 'SB'; blindElem.classList.add('active'); } if (p.id === state.bbIndex) { blindElem.textContent = 'BB'; blindElem.classList.add('active'); }
            
            const cardsArea = document.getElementById(`cards-area-${p.id}`);
            const isHandOver = state.streetIndex > 3, activePlayersInHand = state.players.filter(pl => !pl.isEliminated && !pl.isFolded);
            const showThisPlayersCards = !!state.showdownWinners || (p.id === state.activePlayerIndex && !state.isAnimating);
            cardsArea.innerHTML = p.hand.map(card => renderCard(card, !showThisPlayersCards)).join('');
            document.getElementById(`hand-rank-${p.id}`).textContent = (state.showdownWinners && p.handDetails) ? p.handDetails.name : '';
            
            const allButtons = area.querySelectorAll('.actions button, .raise-actions button, .raise-actions input');
            const isDisabled = p.id !== state.activePlayerIndex || p.isEliminated || p.isFolded || state.isAnimating;
            allButtons.forEach(el => el.disabled = isDisabled);
            if (!isDisabled) {
                const callBtn = area.querySelector('.btn-call'), checkBtn = area.querySelector('.btn-check'), callAmount = state.streetHighestBet - p.betInStreet;
                checkBtn.style.display = callAmount <= 0 ? '' : 'none'; callBtn.style.display = callAmount > 0 ? '' : 'none';
                if (callAmount > 0) callBtn.textContent = p.stack <= callAmount ? `オールイン (${p.stack})` : `コール (${callAmount})`;
                const minRaiseTotal = state.streetHighestBet + Math.max(state.lastRaiseSize, state.config.bb);
                const canRaise = p.stack > callAmount && (p.stack + p.betInStreet) >= minRaiseTotal;
                area.querySelector('.raise-actions').style.display = canRaise ? '' : 'none'; area.querySelector('.btn-all-in').disabled = isDisabled;
                if (canRaise) {
                    const minRaiseAmount = minRaiseTotal - p.betInStreet;
                    const raiseSlider = area.querySelector('.raise-slider'), raiseInput = area.querySelector('.raise-input');
                    raiseSlider.min = minRaiseAmount; raiseSlider.max = p.stack; raiseSlider.value = minRaiseAmount;
                    raiseInput.min = minRaiseAmount; raiseInput.max = p.stack; raiseInput.value = minRaiseAmount;
                    updateRaiseButtonText(p.id);
                }
            }
        });
        dom.potTotalElem.textContent = state.pots.reduce((s, pot) => s + pot.amount, 0) + state.players.reduce((s, p) => s + p.betInStreet, 0);
        
        dom.showdownResultsArea.style.display = state.streetIndex > 3 ? 'block' : 'none';
        if (state.streetIndex > 3) { if (state.showdownWinners) showShowdownResults(); else showNextHandButton(); }
    }

    function revealCommunityCardsWithAnimation() {
        state.isAnimating = true;
        let cardsToAnimate;

        if (state.streetIndex === 1) {
            dom.communityCardsArea.innerHTML = state.communityCards.slice(0, 3).map(c => renderCard(c)).join('');
            cardsToAnimate = dom.communityCardsArea.querySelectorAll('.card');
        } else if (state.streetIndex === 2) {
            const turnCardHTML = renderCard(state.communityCards[3]);
            dom.communityCardsArea.insertAdjacentHTML('beforeend', turnCardHTML);
            cardsToAnimate = [dom.communityCardsArea.lastElementChild];
        } else if (state.streetIndex === 3) {
            const riverCardHTML = renderCard(state.communityCards[4]);
            dom.communityCardsArea.insertAdjacentHTML('beforeend', riverCardHTML);
            cardsToAnimate = [dom.communityCardsArea.lastElementChild];
        }

        let delay = 0;
        if (cardsToAnimate) {
            cardsToAnimate.forEach((card) => {
                if (card && !card.classList.contains('revealed')) {
                    setTimeout(() => {
                        card.classList.add('revealed');
                    }, delay);
                    delay += 300;
                }
            });
        }

        setTimeout(() => {
            state.isAnimating = false;
            const activeForBetting = state.players.filter(p => !p.isEliminated && !p.isFolded && !p.isAllIn);
            if (activeForBetting.length <= 1 && state.streetIndex <= 3) {
                 setTimeout(advanceStreet, ACTION_DELAY);
            } else {
                 updateUI();
            }
        }, delay + ACTION_DELAY);
    }
    
    function showNextHandButton() { dom.showdownResultsArea.innerHTML = `<button class="btn-next-hand">次のハンドへ</button>`; dom.showdownResultsArea.querySelector('button').addEventListener('click', startHand); }
    function showShowdownResults() {
        let html = `<h3>ショーダウン結果</h3><ul id="th-showdown-results-list">`;
        const showdownPlayers = state.players.filter(p => !p.isFolded && p.handDetails).sort((a,b) => compareHands(b.handDetails, a.handDetails));
        showdownPlayers.forEach(p => {
            const isWinner = state.showdownWinners.winners.some(w => w.id === p.id);
            html += `<li class="${isWinner ? 'winner' : ''}">${p.name}: ${p.handDetails.name} ${isWinner ? '🏆' : ''}</li>`;
        });
        html += `</ul><button class="btn-next-hand">チップを分配して次のハンドへ</button>`;
        dom.showdownResultsArea.innerHTML = html;
        dom.showdownResultsArea.querySelector('button').addEventListener('click', () => { distributeWinnings(); startHand(); });
    }
    
    function distributeWinnings(){
        if (!state.showdownWinners) return;
        const { winners, amount } = state.showdownWinners; const winAmount = Math.floor(amount / winners.length);
        winners.forEach(winner => { const player = state.players.find(p => p.id === winner.id); if(player) player.stack += winAmount; });
        showAlert("チップが分配されました");
    }
    
    function renderCard(card, isBack = false) { if (!card) return ''; return isBack ? `<div class="card card-back"></div>` : `<div class="card ${SUIT_COLORS[card.suit]}"><span>${card.rank}</span><span>${card.suit}</span></div>`; }
    
    function startHand() {
        Object.assign(state, { streetIndex: 0, pots: [], communityCards: [], showdownWinners: null, isAnimating: false });
        dom.communityCardsArea.innerHTML = '';
        state.players.forEach(p => { if (p.stack <= 0 && !p.isEliminated) { p.isEliminated = true; showAlert(`${p.name}が脱落`); } if (!p.isEliminated) { Object.assign(p, { betInStreet: 0, totalBetInHand: 0, isFolded: false, hasActedThisStreet: false, isAllIn: false, hand: [], handDetails: null }); } });
        const activePlayers = state.players.filter(p => !p.isEliminated);
        if (activePlayers.length < 2) { showAlert("ゲーム終了！"); return; }
        
        state.dealerIndex = findNextPlayerIndex(state.dealerIndex, true);
        if (activePlayers.length === 2) { state.sbIndex = state.dealerIndex; state.bbIndex = findNextPlayerIndex(state.sbIndex); } 
        else { state.sbIndex = findNextPlayerIndex(state.dealerIndex); state.bbIndex = findNextPlayerIndex(state.sbIndex); }
        
        state.deck = []; for (const suit of SUITS) for (const rank of RANKS) state.deck.push({ rank, suit, value: RANKS.indexOf(rank) + 2 });
        for (let i = state.deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [state.deck[i], state.deck[j]] = [state.deck[j], state.deck[i]]; }
        activePlayers.forEach(p => p.hand = [state.deck.pop(), state.deck.pop()]);
        state.deck.pop(); state.communityCards = state.deck.splice(0, 3); state.deck.pop(); state.communityCards.push(state.deck.shift()); state.deck.pop(); state.communityCards.push(state.deck.shift());

        handleBet(state.sbIndex, state.config.sb); handleBet(state.bbIndex, state.config.bb);
        state.streetHighestBet = state.config.bb; state.lastRaiseSize = state.config.bb;
        state.activePlayerIndex = findNextPlayerIndex(state.bbIndex);
        updateUI();
    }

    function handleAction(playerId, action, amount = 0) {
        if (playerId !== state.activePlayerIndex || state.isAnimating) return; 
        const player = state.players[playerId]; player.hasActedThisStreet = true;
        if (action === 'fold') player.isFolded = true;
        else if (action === 'call') handleBet(playerId, state.streetHighestBet - player.betInStreet);
        else if (action === 'all-in') handleBet(playerId, player.stack, true);
        else if (action === 'raise') {
            const totalBet = amount + player.betInStreet;
            if (totalBet >= state.streetHighestBet + Math.max(state.lastRaiseSize, state.config.bb)) {
                state.lastRaiseSize = totalBet - state.streetHighestBet; state.streetHighestBet = totalBet;
                state.players.forEach(p => { if (!p.isFolded && !p.isAllIn) p.hasActedThisStreet = false; }); player.hasActedThisStreet = true;
            } else { showAlert("レイズ額が小さすぎます"); player.hasActedThisStreet = false; return; }
            handleBet(playerId, amount);
        } 
        
        state.isAnimating = true; updateUI();
        setTimeout(checkHandContinuation, ACTION_DELAY);
    }

    function handleBet(playerId, amount, isAllIn = false) {
        const player = state.players.find(p => p.id === playerId); if (!player) return;
        const betAmount = isAllIn ? player.stack : Math.min(amount, player.stack);
        player.stack -= betAmount; player.betInStreet += betAmount;
        if (player.stack === 0) {
            player.isAllIn = true;
            if (player.betInStreet > state.streetHighestBet) {
                state.lastRaiseSize = player.betInStreet - state.streetHighestBet; state.streetHighestBet = player.betInStreet;
                state.players.forEach(p => { if (!p.isFolded && !p.isAllIn) p.hasActedThisStreet = false; }); player.hasActedThisStreet = true;
            }
        }
    }

    function checkHandContinuation() {
        state.isAnimating = false;
        const activePlayers = state.players.filter(p => !p.isEliminated && !p.isFolded);
        if (activePlayers.length <= 1) {
            collectBets(); const winner = activePlayers[0];
            const totalPot = state.pots.reduce((sum, pot) => sum + pot.amount, 0);
            if(winner) winner.stack += totalPot; showAlert(`${winner ? winner.name : ''}がポット(${totalPot})を獲得しました`);
            state.streetIndex = 4; updateUI(); return;
        }
        const actingPlayers = activePlayers.filter(p => !p.isAllIn);
        const allActed = actingPlayers.every(p => p.hasActedThisStreet); const betsEqual = actingPlayers.every(p => p.betInStreet === state.streetHighestBet);
        if (actingPlayers.length === 0 || (allActed && betsEqual)) {
            advanceStreet();
        } else {
            state.activePlayerIndex = findNextPlayerIndex(state.activePlayerIndex); updateUI();
        }
    }

    function collectBets() {
        state.players.forEach(p => { p.totalBetInHand += p.betInStreet; p.betInStreet = 0; });
        const contributors = state.players.filter(p => p.totalBetInHand > 0);
        if (contributors.length === 0) { state.pots = []; return; }
        const betLevels = [...new Set(contributors.map(p => p.totalBetInHand))].sort((a, b) => a - b);
        let newPots = []; let lastLevel = 0;
        betLevels.forEach(level => {
            let potAmountForLevel = 0;
            const eligiblePlayers = contributors.filter(p => p.totalBetInHand >= level).map(p => p.id);
            if (eligiblePlayers.length > 0) {
                contributors.forEach(p => { potAmountForLevel += Math.max(0, Math.min(p.totalBetInHand, level) - lastLevel); });
                if(potAmountForLevel > 0) {
                    const showdownPlayers = eligiblePlayers.filter(id => !state.players[id].isFolded || state.players[id].isAllIn);
                    if(showdownPlayers.length > 0) newPots.push({ amount: potAmountForLevel, eligiblePlayerIds: showdownPlayers });
                }
            }
            lastLevel = level;
        });
        state.pots = newPots;
    }
    
    function advanceStreet() {
        collectBets();
        state.streetIndex++; Object.assign(state, { streetHighestBet: 0, lastRaiseSize: state.config.bb });
        state.players.forEach(p => { if (!p.isFolded && !p.isAllIn) p.hasActedThisStreet = false; });
        if (state.streetIndex > 3) { showdown(); return; }
        state.activePlayerIndex = findNextPlayerIndex(state.dealerIndex);
        revealCommunityCardsWithAnimation();
    }
    
    function showdown() {
        const showdownPlayers = state.players.filter(p => !p.isFolded);
        showdownPlayers.forEach(p => { p.handDetails = evaluateHand(p.hand, state.communityCards); });
        showdownPlayers.sort((a,b) => compareHands(b.handDetails, a.handDetails));
        const bestHand = showdownPlayers[0].handDetails;
        const winners = showdownPlayers.filter(p => compareHands(p.handDetails, bestHand) === 0);
        const totalPot = state.pots.reduce((sum, pot) => sum + pot.amount, 0);
        state.showdownWinners = { winners, amount: totalPot };
        updateUI();
    }

    function findNextPlayerIndex(startIndex, isDealerSearch = false) {
        let currentIndex = startIndex, count = 0;
        do {
            currentIndex = (currentIndex + 1) % state.players.length; count++;
            const p = state.players[currentIndex];
            if (!p.isEliminated && (isDealerSearch || (!p.isFolded && !p.isAllIn))) return currentIndex;
        } while (count < state.players.length * 2);
        return -1;
    }
    
    function compareHands(h1,h2){ if(!h1||!h2)return 0;if(h1.rank!==h2.rank)return h1.rank-h2.rank;for(let i=0;i<h1.values.length;i++){if(h1.values[i]!==h2.values[i])return h1.values[i]-h2.values[i];}return 0;}
    function getCombinations(arr,k){if(k===0)return[[]];if(arr.length<k)return[];const f=arr[0],r=arr.slice(1);return[...getCombinations(r,k),...getCombinations(r,k-1).map(c=>[f,...c])];}
    function evaluateHand(hole,board){const combos=getCombinations([...hole,...board],5);let bestHand=null;for(const c of combos){const d=getHandDetails(c);if(!bestHand||compareHands(d,bestHand)>0)bestHand=d;}return bestHand;}
    function getHandDetails(five){const v=five.map(c=>c.value).sort((a,b)=>b-a),f=new Set(five.map(c=>c.suit)).size===1,s=isStraightCheck(v);const n=(r,nm)=>({rank:HAND_RANKS[r],values:v,name:nm});const c=Object.values(v.reduce((a,v)=>(a[v]=(a[v]||0)+1,a),{})).sort((a,b)=>b-a);if(s&&f)return n(v.includes(14)&&v.includes(13)?'ROYAL_FLUSH':'STRAIGHT_FLUSH',v.includes(14)&&v.includes(13)?"ロイヤルフラッシュ":"ストレートフラッシュ");if(c[0]===4)return n('FOUR_OF_A_KIND',"フォーカード");if(c[0]===3&&c[1]===2)return n('FULL_HOUSE',"フルハウス");if(f)return n('FLUSH',"フラッシュ");if(s)return n('STRAIGHT',"ストレート");if(c[0]===3)return n('THREE_OF_A_KIND',"スリーカード");if(c[0]===2&&c[1]===2)return n('TWO_PAIR',"ツーペア");if(c[0]===2)return n('ONE_PAIR',"ワンペア");return n('HIGH_CARD',"ハイカード");}
    function isStraightCheck(v){const s=[...new Set(v)];if(s.length<5)return!1;if(JSON.stringify(s.slice(0,5))===JSON.stringify([14,5,4,3,2]))return!0;for(let i=0;i<=s.length-5;i++){if(s[i]-s[i+4]===4)return!0;}return!1;}
    
    function showAlert(msg) { if(!dom.alertElement) return; dom.alertElement.textContent = msg; dom.alertElement.classList.add('show'); setTimeout(() => dom.alertElement.classList.remove('show'), 3000); }

    return { init };
})();