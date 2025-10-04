document.addEventListener("DOMContentLoaded", () => {
    // グローバルなUI初期化
    initializeGlobalUI();
    
    // 各機能モジュールの初期化
    initializeGlossary();
    initializeTournamentTimer();
    initializeRangeFinder();
    initializeGtoTrainer();
    TexasHoldemGame.init();
    initializeGtcCalculator();
});

const PokerUtils = (() => {
    const RANKS = '23456789TJQKA';
    const SUITS = {'s': '♠', 'h': '♥', 'd': '♦', 'c': '♣'};
    const RANK_VALUES = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, 'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };
    const HAND_RANK_ORDER = { HIGH_CARD: 0, ONE_PAIR: 1, TWO_PAIR: 2, THREE_OF_A_KIND: 3, STRAIGHT: 4, FLUSH: 5, FULL_HOUSE: 6, FOUR_OF_A_KIND: 7, STRAIGHT_FLUSH: 8, ROYAL_FLUSH: 9 };
    const HAND_NAMES = ["ハイカード","ワンペア","ツーペア","スリーカード","ストレート","フラッシュ","フルハウス","フォーカード","ストレートフラッシュ","ロイヤルフラッシュ"];

    function getCombinations(arr, k) {
        if (k === 0) return [[]];
        if (arr.length < k) return [];
        const first = arr[0];
        const rest = arr.slice(1);
        const combsWithoutFirst = getCombinations(rest, k);
        const combsWithFirst = getCombinations(rest, k - 1).map(comb => [first, ...comb]);
        return [...combsWithoutFirst, ...combsWithFirst];
    }

    function isStraightCheck(v) {
        const s = [...new Set(v)];
        if (s.length < 5) return false;
        // Ace-low straight (A, 2, 3, 4, 5)
        if (JSON.stringify(s.slice(0, 5)) === JSON.stringify([14, 5, 4, 3, 2])) return true;
        for (let i = 0; i <= s.length - 5; i++) {
            if (s[i] - s[i + 4] === 4) return true;
        }
        return false;
    }

    function getHandDetails(fiveCards) {
        const values = fiveCards.map(c => c.rank).sort((a, b) => b - a);
        const isFlush = new Set(fiveCards.map(c => c.suit)).size === 1;
        const isStraight = isStraightCheck(values);
        const getResult = (rank, primary, name) => ({ rank, primary, name });

        if (isStraight && isFlush) {
            const name = values.includes(14) && values.includes(13) ? "ロイヤルフラッシュ" : "ストレートフラッシュ";
            const rank = name === "ロイヤルフラッシュ" ? HAND_RANK_ORDER.ROYAL_FLUSH : HAND_RANK_ORDER.STRAIGHT_FLUSH;
            return getResult(rank, values, name);
        }

        const counts = values.reduce((acc, v) => (acc[v] = (acc[v] || 0) + 1, acc), {});
        const sortedCounts = Object.values(counts).sort((a, b) => b - a);
        const primaryRanks = Object.keys(counts).map(Number).sort((a, b) => counts[b] - counts[a] || b - a);

        if (sortedCounts[0] === 4) return getResult(HAND_RANK_ORDER.FOUR_OF_A_KIND, primaryRanks, "フォーカード");
        if (sortedCounts[0] === 3 && sortedCounts[1] === 2) return getResult(HAND_RANK_ORDER.FULL_HOUSE, primaryRanks, "フルハウス");
        if (isFlush) return getResult(HAND_RANK_ORDER.FLUSH, values, "フラッシュ");
        if (isStraight) return getResult(HAND_RANK_ORDER.STRAIGHT, values, "ストレート");
        if (sortedCounts[0] === 3) return getResult(HAND_RANK_ORDER.THREE_OF_A_KIND, primaryRanks, "スリーカード");
        if (sortedCounts[0] === 2 && sortedCounts[1] === 2) return getResult(HAND_RANK_ORDER.TWO_PAIR, primaryRanks, "ツーペア");
        if (sortedCounts[0] === 2) return getResult(HAND_RANK_ORDER.ONE_PAIR, primaryRanks, "ワンペア");
        return getResult(HAND_RANK_ORDER.HIGH_CARD, values, "ハイカード");
    }

    function evaluateHand(holeCards, boardCards) {
        const sevenCards = [...holeCards, ...boardCards];
        const combinations = getCombinations(sevenCards, 5);
        let bestHand = null;
        for (const combo of combinations) {
            const details = getHandDetails(combo);
            if (!bestHand || compareHands(details, bestHand) > 0) {
                bestHand = details;
            }
        }
        return bestHand;
    }
    
    function compareHands(h1, h2) {
        if (!h1 || !h2) return 0;
        if (h1.rank !== h2.rank) return h1.rank - h2.rank;
        for (let i = 0; i < h1.primary.length; i++) {
            if (h1.primary[i] !== h2.primary[i]) return h1.primary[i] - h2.primary[i];
        }
        return 0;
    }

    function parseCard(cardStr) {
        if (!cardStr || cardStr.length < 2) return null;
        const rank = cardStr.slice(0, -1);
        const suit = cardStr.slice(-1);
        if (!RANK_VALUES[rank] || !SUITS[suit.toLowerCase()]) return null;
        return { rank: RANK_VALUES[rank], suit: suit.toLowerCase() };
    }

    function getAllHands() {
        const ranks = RANKS.split('');
        const hands = [];
        for (let i = 0; i < ranks.length; i++) {
            for (let j = i; j < ranks.length; j++) {
                if (i === j) {
                    hands.push(ranks[i] + ranks[j]); // Pocket pairs
                } else {
                    hands.push(ranks[i] + ranks[j] + 's'); // Suited
                    hands.push(ranks[j] + ranks[i] + 'o'); // Offsuit
                }
            }
        }
        return hands;
    }

    return {
        RANKS,
        SUITS,
        RANK_VALUES,
        HAND_RANK_ORDER,
        HAND_NAMES,
        getCombinations,
        getHandDetails,
        evaluateHand,
        compareHands,
        parseCard,
        getAllHands
    };
})();

function initializeGtcCalculator() {
    const gtcContainer = document.getElementById('gtc-calculator');
    if (!gtcContainer) return;

    // Views
    const formView = document.getElementById('gtc-form-view');
    const analysisScreen = document.getElementById('gtc-analysis-screen');
    const resultView = document.getElementById('gtc-result-view');

    // Form Elements
    const gameTypeRadios = document.querySelectorAll('input[name="gtc-game-type"]');
    const tournamentFields = document.getElementById('gtc-tournament-fields');
    const playerCountSelect = document.getElementById('gtc-player-count');
    const playersInfoContainer = document.getElementById('gtc-players-info');
    const boardCardsContainer = document.getElementById('gtc-board-cards');
    const historyRowsContainer = document.getElementById('gtc-history-rows');

    // Buttons
    const analyzeBtn = document.getElementById('gtc-analyze-btn');
    const backBtn = document.getElementById('gtc-back-btn');
    const resetBtn = document.getElementById('gtc-reset-btn');
    const addActionBtn = document.getElementById('gtc-add-action-btn');

    // Add Bet Size Input UI
    const betSizeGroup = document.createElement('div');
    betSizeGroup.className = 'gtc-input-group';
    betSizeGroup.style.marginTop = '20px';
    betSizeGroup.innerHTML = `
        <label for="gtc-bet-size">評価したいベットサイズ (点):</label>
        <input type="number" id="gtc-bet-size" placeholder="例: 300" value="100">
    `;
    analyzeBtn.parentNode.insertBefore(betSizeGroup, analyzeBtn);

    
    // Result Content
    const resultContent = document.getElementById('gtc-result-content');

    const POSITIONS = ["BTN", "SB", "BB", "UTG", "HJ", "CO"];
    const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
    const SUITS = { 's': '♠', 'h': '♥', 'd': '♦', 'c': '♣' };
    const STREETS = { 'preflop': 'プリフロップ', 'flop': 'フロップ', 'turn': 'ターン', 'river': 'リバー' };
    const ACTIONS = { 'folds': 'フォールド', 'checks': 'チェック', 'calls': 'コール', 'bets': 'ベット', 'raises': 'レイズ' };

    function createCardInput(idPrefix) {
        const rankSelect = `<select id="${idPrefix}-rank" class="gtc-rank-input"><option value="">-</option>${PokerUtils.RANKS.split('').map(r => `<option value="${r}">${r}</option>`).join('')}</select>`;
        const suitSelect = `<select id="${idPrefix}-suit" class="gtc-suit-select"><option value="">-</option>${Object.entries(PokerUtils.SUITS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select>`;
        return `<div class="card-input">${rankSelect}${suitSelect}</div>`;
    }

    function generatePlayerForms() {
        const count = parseInt(playerCountSelect.value, 10);
        playersInfoContainer.innerHTML = '<h3>プレイヤー情報</h3>';
        for (let i = 1; i <= count; i++) {
            const isHero = i === 1;
            const playerForm = document.createElement('div');
            playerForm.className = 'gtc-player-form';
            const handInputHTML = isHero ? `
                <div class="gtc-input-group">
                    <label>ハンド:</label>
                    <div class="hand-inputs">
                        ${createCardInput(`gtc-hand-${i}-c1`)}
                        ${createCardInput(`gtc-hand-${i}-c2`)}
                    </div>
                </div>` : '';
            playerForm.innerHTML = `
                <h4>${isHero ? '自分 (Hero)' : 'プレイヤー ' + i}</h4>
                <div class="gtc-player-inputs">
                    <div class="gtc-input-group">
                        <label for="gtc-pos-${i}">ポジション:</label>
                        <select id="gtc-pos-${i}">${POSITIONS.map(p => `<option value="${p}">${p}</option>`).join('')}</select>
                    </div>
                    <div class="gtc-input-group">
                        <label for="gtc-stack-${i}">スタック:</label>
                        <input type="number" id="gtc-stack-${i}" placeholder="Stack">
                    </div>
                </div>
                ${handInputHTML}`;

            playersInfoContainer.appendChild(playerForm);
        }
        // Refresh action rows to update player dropdowns
        historyRowsContainer.innerHTML = '';
        addActionRow();
    }
    
    function addActionRow() {
        const playerCount = parseInt(playerCountSelect.value, 10);
        const actionRow = document.createElement('div');
        actionRow.className = 'action-history-row';

        let playerOptions = '<option value="hero">自分 (Hero)</option>';
        for (let i = 2; i <= playerCount; i++) {
            playerOptions += `<option value="player${i}">プレイヤー ${i}</option>`;
        }

        actionRow.innerHTML = `
            <div class="gtc-action-group">
                <label>ストリート</label>
                <select class="gtc-action-street">${Object.entries(STREETS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select>
            </div>
            <div class="gtc-action-group">
                <label>プレイヤー</label>
                <select class="gtc-action-player">${playerOptions}</select>
            </div>
            <div class="gtc-action-group">
                <label>アクション</label>
                <select class="gtc-action-type">${Object.entries(ACTIONS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select>
            </div>
            <div class="gtc-action-group">
                <label>額</label>
                <input type="number" class="gtc-action-amount" placeholder="例: 100">
            </div>
            <button class="gtc-remove-action-btn">削除</button>
        `;
        historyRowsContainer.appendChild(actionRow);
        
        actionRow.querySelector('.gtc-remove-action-btn').addEventListener('click', () => {
            actionRow.remove();
        });
    }

    function generateBoardCards() {
        const boardCardNames = ['Flop 1', 'Flop 2', 'Flop 3', 'Turn', 'River'];
        boardCardsContainer.innerHTML = boardCardNames.map((name, i) => `
            <div class="gtc-input-group">
                <label>${name}</label>
                ${createCardInput(`gtc-board-c${i+1}`)}
            </div>`).join('');
    }

    async function handleAnalyze() {
        analysisScreen.style.display = 'block';
        formView.style.display = 'none';
        resultView.style.display = 'none';

        // ★★★ 可変ロード時間のためのロジック ★★★
        const startTime = Date.now();
        const MINIMUM_DELAY = 1500; // 最低でも1.5秒はロード画面を見せる

        try {
            // --- 分析処理本体 ---
            const gameContext = buildGameContext();
            const userBetSize = parseFloat(document.getElementById('gtc-bet-size').value) || 0;
            calculateDerivedContext(gameContext);
            assignInitialRanges(gameContext);
            // narrowRanges は現在簡略化されているため、処理時間はほぼゼロ
            narrowRanges(gameContext); 
            const analysisData = calculateAllEVs(gameContext, userBetSize);
            // --- 分析処理ここまで ---

            const elapsedTime = Date.now() - startTime;
            const remainingDelay = Math.max(0, MINIMUM_DELAY - elapsedTime);

            // 最低保証時間に達するまで待機
            await new Promise(resolve => setTimeout(resolve, remainingDelay));
            
            renderResults(gameContext, analysisData);

        } catch (error) {
            console.error("Analysis Error:", error);
            resultContent.innerHTML = `<p style="color: red;">分析中にエラーが発生しました。入力値やアクションの順序が正しいか確認してください。</p><pre>${error.stack}</pre>`;
        } finally {
            analysisScreen.style.display = 'none';
            resultView.style.display = 'block';
        }
    }

    // --- Analysis Pipeline Functions ---
    function buildGameContext() {
        const context = { players: [], board: [], actions: [] };
        context.sb = parseFloat(document.getElementById('gtc-sb').value) || 0;
        context.bb = parseFloat(document.getElementById('gtc-bb').value) || 0;

        const playerCount = parseInt(playerCountSelect.value, 10);
        for (let i = 1; i <= playerCount; i++) {
            const player = {
                id: i === 1 ? 'hero' : `player${i}`,
                position: document.getElementById(`gtc-pos-${i}`).value,
                stack: parseFloat(document.getElementById(`gtc-stack-${i}`).value) || 0,
                betsInStreet: { preflop: 0, flop: 0, turn: 0, river: 0 },
                hand: []
            };
            if (i === 1) {
                const r1 = document.getElementById('gtc-hand-1-c1-rank').value, s1 = document.getElementById('gtc-hand-1-c1-suit').value;
                const r2 = document.getElementById('gtc-hand-1-c2-rank').value, s2 = document.getElementById('gtc-hand-1-c2-suit').value;
                if (r1 && s1) player.hand.push(r1 + s1);
                if (r2 && s2) player.hand.push(r2 + s2);
            }
            context.players.push(player);
        }

        for (let i = 1; i <= 5; i++) {
            const rank = document.getElementById(`gtc-board-c${i}-rank`).value, suit = document.getElementById(`gtc-board-c${i}-suit`).value;
            if (rank && suit) context.board.push(rank + suit);
        }

        historyRowsContainer.querySelectorAll('.action-history-row').forEach(row => {
            context.actions.push({
                street: row.querySelector('.gtc-action-street').value,
                player: row.querySelector('.gtc-action-player').value,
                type: row.querySelector('.gtc-action-type').value,
                amount: parseFloat(row.querySelector('.gtc-action-amount').value) || 0
            });
        });
        return context;
    }

    function calculateDerivedContext(context) {
        // プレイヤーの状態をリセット
        context.players.forEach(p => {
            p.betsInStreet = { preflop: 0, flop: 0, turn: 0, river: 0 };
            p.totalBetInHand = 0; // ハンド全体での投資額
            p.isFolded = false;
        });

        let totalPot = 0;

        // 1. ブラインド処理
        const sbPlayer = context.players.find(p => p.position === 'SB');
        const bbPlayer = context.players.find(p => p.position === 'BB');
        if (sbPlayer) {
            sbPlayer.betsInStreet.preflop = Math.min(sbPlayer.stack, context.sb);
        }
        if (bbPlayer) {
            bbPlayer.betsInStreet.preflop = Math.min(bbPlayer.stack, context.bb);
        }

        let lastStreet = 'preflop';
        let highestBetOnStreet = context.bb;

        // 2. アクションを時系列で処理
        context.actions.forEach(action => {
            const player = context.players.find(p => p.id === action.player);
            if (!player || player.isFolded) return;

            // ストリートが変わったら、前のストリートのベットをポットに集める
            if (action.street !== lastStreet) {
                context.players.forEach(p => {
                    totalPot += p.betsInStreet[lastStreet];
                    p.totalBetInHand += p.betsInStreet[lastStreet];
                    p.betsInStreet[lastStreet] = 0; // リセット
                });
                highestBetOnStreet = 0;
                lastStreet = action.street;
            }

            // アクションを処理
            const currentBet = player.betsInStreet[action.street];
            switch (action.type) {
                case 'folds':
                    player.isFolded = true;
                    break;
                case 'calls':
                    const callAmount = highestBetOnStreet - currentBet;
                    player.betsInStreet[action.street] += callAmount;
                    break;
                case 'bets':
                case 'raises':
                    highestBetOnStreet = action.amount;
                    player.betsInStreet[action.street] = action.amount;
                    break;
            }
        });

        // 3. 現在のストリートのベット額をポットに加算
        let currentStreetBets = 0;
        context.players.forEach(p => {
            if (!p.isFolded) {
                currentStreetBets += p.betsInStreet[lastStreet];
            } else {
                // フォールドしたプレイヤーのチップもポットに含める
                totalPot += p.betsInStreet[lastStreet];
            }
        });
        
        context.potSize = totalPot + currentStreetBets;
    }

    function categorizeHeroHand(heroHand, board) {
        const strength = getHandStrengthOnBoard(heroHand, board);
        const handRank = strength.madeHand;
        const heroCards = heroHand.map(c => PokerUtils.parseCard(c));
        const boardCards = board.map(c => PokerUtils.parseCard(c));

        // TPTK Check
        if (strength.pairType === 'TOP_PAIR') {
            const boardHighRank = Math.max(...boardCards.map(c => c.rank));
            const heroRanks = heroCards.map(c => c.rank);
            // Find which hero card is the kicker
            const kickerRank = heroRanks.find(r => r !== boardHighRank);
            if (kickerRank === 14) { // Ace kicker is TPTK
                 return 'ストロングメイドハンド'; // Treat TPTK as a strong made hand
            }
        }
        
        if (handRank >= PokerUtils.HAND_RANK_ORDER.STRAIGHT) {
            return 'プレミアムメイドハンド'; // Straight or better
        }
        if (handRank === PokerUtils.HAND_RANK_ORDER.TWO_PAIR || handRank === PokerUtils.HAND_RANK_ORDER.THREE_OF_A_KIND) {
            return 'ストロングメイドハンド'; // Two Pair, Three of a Kind
        }
        if (strength.pairType === 'TOP_PAIR' || strength.pairType === 'OVER_PAIR') {
            return 'ミドルメイドハンド'; // Non-TPTK Top Pair, Over Pair
        }
        if (handRank === PokerUtils.HAND_RANK_ORDER.ONE_PAIR) {
            return 'ウィークメイドハンド'; // Middle or Weak Pair
        }
        if (strength.isFlushDraw || strength.isOpenEnded) {
            return 'ドローハンド'; // Strong draws
        }
        if (strength.isGutshot) {
            return 'インサイドショット'; // Weaker draws
        }
        return 'エア'; // No pair, no real draw
    }

    function generateActionCandidates(handCategory, isBetFacing, potSize, callAmount, userBetSize) {
        const candidates = [];
        const potBasedBets = [0.33, 0.5, 0.75, 1.0].map(m => ({ type: 'bet', amount: Math.round(potSize * m) }));

        if (isBetFacing) {
            // Facing a bet
            candidates.push({ type: 'fold', amount: 0 });
            candidates.push({ type: 'call', amount: callAmount }); 
            if (handCategory === 'プレミアムメイドハンド' || handCategory === 'ドローハンド') {
                // Standard raise size is ~3x the bet facing.
                const raiseAmount = callAmount * 3;
                candidates.push({ type: 'raise', amount: raiseAmount });
            }
        } else {
            // Not facing a bet (checking or betting)
            candidates.push({ type: 'check', amount: 0 });
            switch (handCategory) {
                case 'プレミアムメイドハンド':
                case 'ストロングメイドハンド':
                    candidates.push(...potBasedBets.slice(1)); // Bet 50%, 75%, 100%
                    break;
                case 'ミドルメイドハンド':
                    candidates.push(potBasedBets[0], potBasedBets[1]); // Bet 33%, 50%
                    break;
                case 'ドローハンド':
                case 'インサイドショット':
                    candidates.push(potBasedBets[1], potBasedBets[2]); // Semi-bluff with 50%, 75%
                    break;
                case 'エア':
                    candidates.push({ type: 'bet', amount: Math.round(potSize * 0.5) }); // A single bluff candidate
                    break;
            }
        }
        
        // Add user-specified bet size if it's a betting situation
        if (!isBetFacing && userBetSize > 0) {
            candidates.push({ type: 'bet', amount: userBetSize });
        }

        // Remove duplicate actions
        const uniqueCandidates = Array.from(new Map(candidates.map(item => [`${item.type}_${item.amount}`, item])).values());
        return uniqueCandidates;
    }

    function calculateAllEVs(context, userBetSize) {
        const hero = context.players.find(p => p.id === 'hero');
        const opponents = context.players.filter(p => p.id !== 'hero' && !p.isFolded);
        if (!hero || opponents.length === 0 || hero.hand.length < 2) return { results: {} };

        // Multi-way: Combine opponent ranges into a pseudo-opponent
        const combinedOpponentRange = Array.from(new Set(opponents.flatMap(opp => opp.range || [])));
        const pseudoOpponent = { range: combinedOpponentRange };

        const handCategory = categorizeHeroHand(hero.hand, context.board);
        const callAmount = getCallAmount(context);
        const isBetFacing = callAmount > 0;
        const actionCandidates = generateActionCandidates(handCategory, isBetFacing, context.potSize, callAmount, userBetSize);

        const results = {};
        const equity = calculateEquity(hero.hand, pseudoOpponent.range, context.board);

        for (const action of actionCandidates) {
            if (action.type === 'fold') {
                results['fold'] = { ev: 0, amount: 0 };
            }
            if (action.type === 'check') {
                results['check'] = { ev: context.potSize * equity, amount: 0 };
            }
            if (action.type === 'call') {
                // Correct pot calculation for call EV
                const potAfterCall = context.potSize + callAmount;
                results['call'] = { ev: (potAfterCall * equity) - callAmount, amount: callAmount };
            }
            if (action.type === 'bet' || action.type === 'raise') {
                const evResult = calculateEvOfBet(context, action.amount, pseudoOpponent);
                if (evResult) {
                    results[`${action.type}_${action.amount}`] = { ev: evResult.totalEv, amount: action.amount };
                }
            }
        }
        return { results };
    }

    function calculateEvOfBet(context, betSize, opponent) {
        const { board, potSize } = context;
        const hero = context.players.find(p => p.id === 'hero');
        if (!hero || !opponent.range || opponent.range.length === 0) return null;

        const raisingRange = [];
        const callingRange = [];

        // Heuristics-based range categorization
        opponent.range.forEach(handNotation => {
            const hand = expandHandNotation(handNotation)[0];
            if (!hand || hand.some(card => board.includes(card) || hero.hand.includes(card))) return;

            const strength = getHandStrengthOnBoard(hand, board);

            // Raising Range: Strong hands (Two Pair or better)
            if (strength.madeHand >= PokerUtils.HAND_RANK_ORDER.TWO_PAIR) {
                raisingRange.push(handNotation);
            } 
            // Calling Range: Medium hands (pairs) and draws
            else if (strength.madeHand >= PokerUtils.HAND_RANK_ORDER.ONE_PAIR || strength.isFlushDraw || strength.isOpenEnded) {
                callingRange.push(handNotation);
            }
        });
        
        const totalConsidered = opponent.range.length;
        if (totalConsidered === 0) return { totalEv: potSize };

        const raiseProbability = raisingRange.length / totalConsidered;
        const callProbability = callingRange.length / totalConsidered;
        const foldProbability = Math.max(0, 1 - raiseProbability - callProbability);

        // Calculate EV of each scenario
        const evWhenFolded = potSize;
        const evWhenRaised = -betSize; // Simplified: assume we lose the bet if raised
        
        let evWhenCalled = 0;
        if (callProbability > 0) {
            const equityVsCallingRange = calculateEquity(hero.hand, callingRange, board, 500); // Equity vs the range that just calls
            const potWhenCalled = potSize + betSize + betSize;
            evWhenCalled = (potWhenCalled * equityVsCallingRange) - betSize;
        }

        const totalEv = (foldProbability * evWhenFolded) + 
                        (callProbability * evWhenCalled) + 
                        (raiseProbability * evWhenRaised);
        
        return { totalEv };
    }

    function renderResults(context, analysisData) {
        const { results } = analysisData;
        if (!results || Object.keys(results).length === 0) {
            resultContent.innerHTML = `<p style="color: #ffc107;">分析できる有効なアクション候補がありません。状況設定を確認してください。</p>`;
            return;
        }

        // --- 1. 必要な情報をすべて集める ---

        // 最も期待値(EV)が高いアクションを見つける
        const bestActionKey = Object.keys(results).reduce((a, b) => results[a].ev > results[b].ev ? a : b);
        const bestAction = results[bestActionKey];
        
        // 表示に必要な情報を変数に格納
        const hero = context.players.find(p => p.id === 'hero');
        const heroHand = hero.hand.join(', ');
        const handCategory = categorizeHeroHand(hero.hand, context.board);

        // アクションのタイプと金額を分かりやすい形式に変換
        const [actionType, actionAmountStr] = bestActionKey.split('_');
        const actionAmount = bestAction.amount;
        let formattedBestAction;
        if (actionType === 'bet' || actionType === 'raise') {
            const potPercentage = context.potSize > 0 ? `(ポットの約${Math.round((actionAmount / context.potSize) * 100)}%)` : '';
            formattedBestAction = `${actionType === 'bet' ? 'ベット' : 'レイズ'} (${actionAmount}) ${potPercentage}`;
        } else {
            formattedBestAction = actionType === 'call' ? `コール (${actionAmount})` : actionType;
        }


        // --- 2. 根拠（解説文）を動的に生成する ---

        let rationale = '';
        switch (actionType) {
            case 'bet':
            case 'raise':
                if (handCategory === 'プレミアムメイドハンド' || handCategory === 'ストロングメイドハンド') {
                    rationale = `あなたのハンド(${heroHand})は「${handCategory}」に分類されます。相手のレンジにはコールが期待できるペアなどが十分に存在するため、価値を引き出すためのベット（バリューベット）が最適です。`;
                } else if (handCategory === 'ドローハンド' || handCategory === 'インサイドショット') {
                    rationale = `あなたのハンド(${heroHand})は強い役に発展する可能性を秘めた「${handCategory}」です。相手をフォールドさせること、そして役が完成した際に大きなポットを獲得することの両方を狙うベット（セミブラフ）が有効な選択肢となります。`;
                } else {
                    rationale = `あなたのハンド(${heroHand})は現状では弱いですが、相手のレンジがこのボードに合っていない可能性を考慮し、プレッシャーをかけるためのベット（ブラフ）が最も期待値が高いと判断しました。`;
                }
                break;
            case 'call':
                rationale = `相手のベットに対して、あなたのハンド(${heroHand})は勝っている可能性も十分にあり、ポットオッズも合っているため、コールして次のストリートを見にいくのが最も期待値が高いアクションです。`;
                break;
            case 'check':
                 if (handCategory === 'ウィークメイドハンド' || handCategory === 'ミドルメイドハンド') {
                    rationale = `あなたのハンド(${heroHand})は「${handCategory}」に分類され、一定の強さはありますが、相手からのベットには弱い状態です。ポットをコントロールし、安くショーダウンを目指すためにチェックするのが最適なアクションです。`;
                } else {
                     rationale = `あなたのハンド(${heroHand})で積極的にベットするメリットが少ないため、相手のアクションを見てから判断するためにチェックするのが堅実な選択です。`;
                }
                break;
            case 'fold':
                rationale = `相手のベットに対して、あなたのハンド(${heroHand})の勝率は極めて低く、コールに見合うポットオッズもありません。ここでは損失を最小限に抑えるためのフォールドが最適なアクションです。`;
                break;
        }
        

        // --- 3. HTMLを組み立てる ---

        let html = `<h3>分析結果</h3>`;
        
        // 最適アクションとその根拠を表示
        html += `<div class="gtc-result-summary">
                    <p><strong>最適アクション:</strong> <span class="gtc-best-action">${formattedBestAction}</span></p>
                    <p><strong>期待値 (EV):</strong> <span class="gtc-best-action-ev">${bestAction.ev.toFixed(2)}</span></p>
                    <p><strong>根拠:</strong> ${rationale}</p>
                 </div><hr>`;

        // すべてのアクション候補とそのEVを期待値の高い順にリスト表示
        html += `<h4>各アクションの期待値(EV)</h4>
                 <ul class="gtc-ev-list">`;
        const sortedResults = Object.entries(results).sort(([,a],[,b]) => b.ev - a.ev);

            for (const [key, value] of sortedResults) {
                const [actionType, actionAmount] = key.split('_');
                let formattedAction = key.replace('_', ' ');
                if (actionType === 'bet') formattedAction = `ベット ${actionAmount}`;
                else if (actionType === 'raise') formattedAction = `レイズ ${actionAmount}`;
                else if (actionType === 'call') formattedAction = 'コール';
                else if (actionType === 'check') formattedAction = 'チェック';
                else if (actionType === 'fold') formattedAction = 'フォールド';
        
                html += `<li><span class="action-name">${formattedAction}</span> <span class="action-ev">${value.ev.toFixed(2)}</span> ${key === bestActionKey ? '🏆' : ''}</li>`;
            }        html += `</ul>`;
        
        resultContent.innerHTML = html;
    }

    // --- Calculation Helpers ---
    function calculateCurrentStreet(actions) { return actions.length > 0 ? actions[actions.length - 1].street : 'preflop'; }

    function getCallAmount(context) {
        const hero = context.players.find(p => p.id === 'hero');
        if (!hero) return 0;
        const currentStreet = calculateCurrentStreet(context.actions);
        const highestBetOnStreet = context.players.reduce((max, p) => Math.max(max, p.betsInStreet[currentStreet] || 0), 0);
        const heroBetOnStreet = hero.betsInStreet[currentStreet] || 0;
        return Math.max(0, highestBetOnStreet - heroBetOnStreet);
    }

    function assignInitialRanges(context) {
        const { players, actions, sb, bb } = context;
        players.forEach(p => p.range = PokerUtils.getAllHands());
        const preflopActions = actions.filter(a => a.street === 'preflop');
        const openRaiserAction = preflopActions.find(a => a.type === 'raises');
        if (!openRaiserAction) return;

        const stackInBB = Math.min(...players.map(p => p.stack)) / bb;
        const stackCategory = stackInBB >= 50 ? '100bb' : '20bb';
        const playerCountCategory = players.length > 2 ? '6max' : 'hu';

        const raiser = players.find(p => p.id === openRaiserAction.player);
        if (raiser) {
            const raiserRangeData = rangeData[stackCategory]?.[playerCountCategory]?.[raiser.position]?.['RAISE'];
            if (raiserRangeData) raiser.range = raiserRangeData;
        }

        const subsequentActions = preflopActions.slice(preflopActions.indexOf(openRaiserAction) + 1);
        subsequentActions.forEach(action => {
            const actor = players.find(p => p.id === action.player);
            if (!actor) return;
            let actionToRangeKey = '';
            if (action.type === 'raises') actionToRangeKey = '3-BET';
            if (action.type === 'calls') actionToRangeKey = 'CALL';
            if (actionToRangeKey) {
                const actorRangeData = rangeData[stackCategory]?.[playerCountCategory]?.[actor.position]?.[actionToRangeKey];
                if (actorRangeData) actor.range = actorRangeData;
            }
        });
    }

    function expandHandNotation(handNotation) {
        const c1Rank = handNotation[0];
        const c2Rank = handNotation[1];
        const isSuited = handNotation.length === 3 && handNotation[2] === 's';
        const isPair = c1Rank === c2Rank;
        const suits = ['s', 'h', 'd', 'c'];
        const hands = [];
        if (isPair) {
            for (let i = 0; i < suits.length; i++) {
                for (let j = i + 1; j < suits.length; j++) hands.push([c1Rank + suits[i], c1Rank + suits[j]]);
            }
        } else if (isSuited) {
            for (const suit of suits) hands.push([c1Rank + suit, c2Rank + suit]);
        } else {
            for (let i = 0; i < suits.length; i++) {
                for (let j = 0; j < suits.length; j++) {
                    if (i !== j) hands.push([c1Rank + suits[i], c2Rank + suits[j]]);
                }
            }
        }
        return hands;
    }

    function getHandStrengthOnBoard(hand, board) {
        const handCards = hand.map(c => PokerUtils.parseCard(c));
        const boardCards = board.map(c => PokerUtils.parseCard(c));
        const best5CardDetails = PokerUtils.evaluateHand(handCards, boardCards);
        if (!best5CardDetails) return { madeHand: -1 };

        let pairType = null;
        if (best5CardDetails.rank === PokerUtils.HAND_RANK_ORDER.ONE_PAIR) {
            const pairRank = best5CardDetails.primary[0];
            const boardRanks = boardCards.map(c => c.rank);
            const boardHighRank = boardRanks.length > 0 ? Math.max(...boardRanks) : 0;
            if (pairRank > boardHighRank) pairType = 'OVER_PAIR';
            else if (pairRank === boardHighRank) pairType = 'TOP_PAIR';
            else pairType = 'MIDDLE_PAIR';
        }

        const sevenCards = [...handCards, ...boardCards];
        const suitCounts = sevenCards.map(c => c.suit).reduce((acc, s) => (acc[s] = (acc[s] || 0) + 1, acc), {});
        const isFlushDraw = Object.values(suitCounts).some(c => c === 4);
        const allRanks = [...new Set(sevenCards.map(c => c.rank))].sort((a, b) => a - b);
        let isOpenEnded = false, isGutshot = false;
        if (allRanks.length >= 4) {
            for (let i = 0; i <= allRanks.length - 4; i++) {
                const slice = allRanks.slice(i, i + 4);
                if (slice[3] - slice[0] === 3) { isOpenEnded = true; break; }
            }
            if (!isOpenEnded) {
                for (let i = 0; i <= allRanks.length - 4; i++) {
                    const slice = allRanks.slice(i, i + 4);
                    if (slice[3] - slice[0] === 4) { isGutshot = true; break; }
                }
            }
        }
        return { madeHand: best5CardDetails.rank, pairType, isFlushDraw, isOpenEnded, isGutshot };
    }

    function narrowRanges(context) {
        // This function is now simplified to only process folds, 
        // as the more complex opponent modeling is handled in calculateEvOfBet.
        const { players, actions } = context;
        players.forEach(p => { p.isFolded = false; });

        actions.forEach(action => {
            if (action.type === 'folds') {
                const player = players.find(p => p.id === action.player);
                if (player) {
                    player.isFolded = true;
                }
            }
        });
        console.log("Ranges processed for folds only.");
    }

    function calculateEquity(heroHand, opponentRange, board, simulations = 1000) {
        let wins = 0, ties = 0;
        const heroCards = heroHand.map(c => PokerUtils.parseCard(c));
        const boardCards = board.map(c => PokerUtils.parseCard(c));
        const fullDeck = [];
        for (const suit of Object.keys(PokerUtils.SUITS)) {
            for (const rank of PokerUtils.RANKS) fullDeck.push({ rank: PokerUtils.RANK_VALUES[rank], suit });
        }
        const usedCards = [...heroCards, ...boardCards];
        let deck = fullDeck.filter(dCard => !usedCards.some(uCard => uCard.rank === dCard.rank && uCard.suit === dCard.suit));
        const opponentHands = opponentRange.flatMap(notation => expandHandNotation(notation));
        if (opponentHands.length === 0) return 0.5; 

        for (let i = 0; i < simulations; i++) {
            let tempDeck = [...deck];
            const opponentHand = opponentHands[Math.floor(Math.random() * opponentHands.length)];
            const oppCards = opponentHand.map(c => PokerUtils.parseCard(c));
            if (oppCards.some(oppCard => usedCards.some(uCard => uCard.rank === oppCard.rank && uCard.suit === oppCard.suit))) {
                i--; continue;
            }
            tempDeck = tempDeck.filter(dCard => !oppCards.some(oCard => oCard.rank === dCard.rank && oCard.suit === oCard.suit));
            for (let j = tempDeck.length - 1; j > 0; j--) { const k = Math.floor(Math.random() * (j + 1));[tempDeck[j], tempDeck[k]] = [tempDeck[k], tempDeck[j]]; }
            const runout = tempDeck.slice(0, 5 - boardCards.length);
            const finalBoard = [...boardCards, ...runout];
            const heroBest = PokerUtils.evaluateHand(heroCards, finalBoard);
            const oppoBest = PokerUtils.evaluateHand(oppCards, finalBoard);
            const result = PokerUtils.compareHands(heroBest, oppoBest);
            if (result > 0) wins++;
            else if (result === 0) ties++;
        }
        return (wins + ties / 2) / simulations;
    }

    function resetGtcForm() {
        const inputs = formView.querySelectorAll('input, select');
        inputs.forEach(input => {
            if (input.type === 'radio' || input.type === 'checkbox') {
                if(input.name === 'gtc-game-type' && input.value === 'cash') input.checked = true;
            } else if (input.tagName === 'SELECT') {
                input.selectedIndex = 0;
            } else {
                input.value = '';
            }
        });
        playerCountSelect.dispatchEvent(new Event('change'));
        gameTypeRadios[0].dispatchEvent(new Event('change'));
        historyRowsContainer.innerHTML = '';
        addActionRow();
        
        resultView.style.display = 'none';
        analysisScreen.style.display = 'none';
        formView.style.display = 'block';
    }

    gameTypeRadios.forEach(radio => radio.addEventListener('change', () => tournamentFields.style.display = document.querySelector('input[name="gtc-game-type"]:checked').value === 'tournament' ? 'block' : 'none'));
    playerCountSelect.addEventListener('change', generatePlayerForms);
    addActionBtn.addEventListener('click', addActionRow);
    analyzeBtn.addEventListener('click', handleAnalyze);
    backBtn.addEventListener('click', () => {
        resultView.style.display = 'none';
        formView.style.display = 'block';
    });
    resetBtn.addEventListener('click', resetGtcForm);

    // Initial setup


    generatePlayerForms();
    generateBoardCards();

    addActionRow();
}

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
    const SUIT_COLORS = { '♠': 'black', '♥': 'red', '♦': 'red', '♣': 'black' };
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
        const showdownPlayers = state.players.filter(p => !p.isFolded && p.handDetails).sort((a,b) => PokerUtils.compareHands(b.handDetails, a.handDetails));
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
    
    function renderCard(card, isBack = false) { if (!card) return ''; return isBack ? `<div class="card card-back"></div>` : `<div class="card ${SUIT_COLORS[card.suit]}"><span>${card.rank}</span><span>${PokerUtils.SUITS[card.suit]}</span></div>`; }
    
    function startHand() {
        Object.assign(state, { streetIndex: 0, pots: [], communityCards: [], showdownWinners: null, isAnimating: false });
        dom.communityCardsArea.innerHTML = '';
        state.players.forEach(p => { if (p.stack <= 0 && !p.isEliminated) { p.isEliminated = true; showAlert(`${p.name}が脱落`); } if (!p.isEliminated) { Object.assign(p, { betInStreet: 0, totalBetInHand: 0, isFolded: false, hasActedThisStreet: false, isAllIn: false, hand: [], handDetails: null }); } });
        const activePlayers = state.players.filter(p => !p.isEliminated);
        if (activePlayers.length < 2) { showAlert("ゲーム終了！"); return; }
        
        state.dealerIndex = findNextPlayerIndex(state.dealerIndex, true);
        if (activePlayers.length === 2) { state.sbIndex = state.dealerIndex; state.bbIndex = findNextPlayerIndex(state.sbIndex); } 
        else { state.sbIndex = findNextPlayerIndex(state.dealerIndex); state.bbIndex = findNextPlayerIndex(state.sbIndex); }
        
        state.deck = []; 
        for (const suit of Object.keys(PokerUtils.SUITS)) {
            for (const rank of PokerUtils.RANKS) {
                state.deck.push({ rank, suit, value: PokerUtils.RANK_VALUES[rank] });
            }
        }
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
        showdownPlayers.forEach(p => { p.handDetails = PokerUtils.evaluateHand(p.hand, state.communityCards); });
        showdownPlayers.sort((a,b) => PokerUtils.compareHands(b.handDetails, a.handDetails));
        const bestHand = showdownPlayers[0].handDetails;
        const winners = showdownPlayers.filter(p => PokerUtils.compareHands(p.handDetails, bestHand) === 0);
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
    
    function showAlert(msg) { if(!dom.alertElement) return; dom.alertElement.textContent = msg; dom.alertElement.classList.add('show'); setTimeout(() => dom.alertElement.classList.remove('show'), 3000); }

    return { init };
})();
