document.addEventListener("DOMContentLoaded", () => {
  // ローディング画面
  const loader = document.getElementById("loader");
  if (loader) {
    setTimeout(() => {
      loader.classList.add("hidden");
    }, 1000);
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
});

// ===== トーナメントタイマー機能 (完全版) =====
(() => {
  const timeLeftDisplay = document.getElementById("time-left");
  const startPauseBtn = document.getElementById("start-pause-btn");
  const resetBtn = document.getElementById("reset-btn");
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
    { time: 15, sb: 100, bb: 200, ante: 0 },
    { time: 15, sb: 150, bb: 300, ante: 0 },
    { time: 15, sb: 200, bb: 400, ante: 50 },
    { time: 15, sb: 300, bb: 600, ante: 75 },
    { time: 15, sb: 400, bb: 800, ante: 100 },
  ];
  let timerInterval = null,
    timeLeft = 0,
    isRunning = false,
    currentLevelIndex = 0;

  function renderBlindsTable() {
    blindsTbody.innerHTML = "";
    blindsStructure.forEach((level, index) => {
      const row = document.createElement("tr");
      if (index === currentLevelIndex) row.classList.add("active-level");
      row.innerHTML = `
                <td>${index + 1}</td>
                <td><input type="number" value="${
                  level.time
                }" data-index="${index}" data-key="time"></td>
                <td><input type="number" value="${
                  level.sb
                }" data-index="${index}" data-key="sb"></td>
                <td><input type="number" value="${
                  level.bb
                }" data-index="${index}" data-key="bb"></td>
                <td><input type="number" value="${
                  level.ante
                }" data-index="${index}" data-key="ante"></td>
                <td><button class="delete-level-btn" data-index="${index}">削除</button></td>
            `;
      blindsTbody.appendChild(row);
    });
  }

  function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timeLeftDisplay.textContent = `${String(minutes).padStart(2, "0")}:${String(
      seconds
    ).padStart(2, "0")}`;
    const currentLevel = blindsStructure[currentLevelIndex];
    const nextLevel = blindsStructure[currentLevelIndex + 1];
    currentLevelDisplay.textContent = currentLevelIndex + 1;
    currentSbBbDisplay.textContent = `${currentLevel.sb} / ${currentLevel.bb} Ante: ${currentLevel.ante}`;
    nextSbBbDisplay.textContent = nextLevel
      ? `${nextLevel.sb} / ${nextLevel.bb} Ante: ${nextLevel.ante}`
      : "Final Level";

    const totalTimeForLevel = blindsStructure[currentLevelIndex].time * 60;
    const progressBar = document.getElementById("timer-progress-bar");
    if (progressBar) {
      if (totalTimeForLevel > 0) {
        const progressPercentage = (timeLeft / totalTimeForLevel) * 100;
        progressBar.style.width = `${progressPercentage}%`;
      } else {
        progressBar.style.width = "100%";
      }
    }
  }

  function levelUp() {
    if (currentLevelIndex < blindsStructure.length - 1) {
      currentLevelIndex++;
      if (alarmSound) {
        alarmSound.currentTime = 0;
        alarmSound.play();
      }
    }
  }

  saveStructureBtn.addEventListener("click", () => {
    blindsTbody.querySelectorAll("input").forEach((input) => {
      const { index, key } = input.dataset;
      const value = parseFloat(input.value);
      if (!isNaN(value)) blindsStructure[index][key] = value;
    });
    executeReset();
    alert("ブラインド構成を保存し、タイマーをリセットしました。");
  });

  blindsTbody.addEventListener("click", (e) => {
    if (e.target.classList.contains("delete-level-btn")) {
      const index = parseInt(e.target.dataset.index, 10);
      if (blindsStructure.length > 1) {
        blindsStructure.splice(index, 1);
        executeReset();
      } else {
        alert("最後のレベルは削除できません。");
      }
    }
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
  const playerCountSelect = document.getElementById("player-count");
  const positionButtonsContainer = document.getElementById("position-buttons");
  const rangeGrid = document.getElementById("range-grid");
  const vsPositionContainer = document.getElementById("vs-position-container");
  const vsPositionButtons = document.getElementById("vs-position-buttons");

  const CARDS = [
    "A",
    "K",
    "Q",
    "J",
    "T",
    "9",
    "8",
    "7",
    "6",
    "5",
    "4",
    "3",
    "2",
  ];
  const POSITIONS = {
    "6max": ["UTG", "HJ", "CO", "BTN", "SB", "BB"],
    hu: ["BTN", "BB"],
  };

  // Hand.mdから全てのレンジを統合
  const rangeData = {
    "6max": {
      UTG: {
        RAISE: [
          "99p",
          "TTp",
          "JJp",
          "QQp",
          "KKp",
          "AAp",
          "A5s",
          "ATs",
          "AJs",
          "AQs",
          "AKs",
          "KJs",
          "KQs",
          "QJs",
          "JTs",
          "AQo",
          "AKo",
        ],
      },
      HJ: {
        RAISE: [
          "77p",
          "88p",
          "99p",
          "TTp",
          "JJp",
          "QQp",
          "KKp",
          "AAp",
          "A2s",
          "A3s",
          "A4s",
          "A5s",
          "A9s",
          "ATs",
          "AJs",
          "AQs",
          "AKs",
          "K9s",
          "KTs",
          "KJs",
          "KQs",
          "QTs",
          "QJs",
          "J9s",
          "JTs",
          "AJo",
          "AQo",
          "AKo",
          "KQo",
        ],
      },
      CO: {
        RAISE: [
          "22p",
          "33p",
          "44p",
          "55p",
          "66p",
          "77p",
          "88p",
          "99p",
          "TTp",
          "JJp",
          "QQp",
          "KKp",
          "AAp",
          "A2s",
          "A3s",
          "A4s",
          "A5s",
          "A6s",
          "A7s",
          "A8s",
          "A9s",
          "ATs",
          "AJs",
          "AQs",
          "AKs",
          "K5s",
          "K6s",
          "K7s",
          "K8s",
          "K9s",
          "KTs",
          "KJs",
          "KQs",
          "Q8s",
          "Q9s",
          "QTs",
          "QJs",
          "J8s",
          "J9s",
          "JTs",
          "T8s",
          "T9s",
          "98s",
          "87s",
          "76s",
          "65s",
          "ATo",
          "AJo",
          "AQo",
          "AKo",
          "KJo",
          "KQo",
          "QJo",
        ],
      },
      BTN: {
        RAISE: [
          "22p",
          "33p",
          "44p",
          "55p",
          "66p",
          "77p",
          "88p",
          "99p",
          "TTp",
          "JJp",
          "QQp",
          "KKp",
          "AAp",
          "A2s",
          "A3s",
          "A4s",
          "A5s",
          "A6s",
          "A7s",
          "A8s",
          "A9s",
          "ATs",
          "AJs",
          "AQs",
          "AKs",
          "K2s",
          "K3s",
          "K4s",
          "K5s",
          "K6s",
          "K7s",
          "K8s",
          "K9s",
          "KTs",
          "KJs",
          "KQs",
          "Q2s",
          "Q3s",
          "Q4s",
          "Q5s",
          "Q6s",
          "Q7s",
          "Q8s",
          "Q9s",
          "QTs",
          "QJs",
          "J7s",
          "J8s",
          "J9s",
          "JTs",
          "T7s",
          "T8s",
          "T9s",
          "96s",
          "97s",
          "98s",
          "86s",
          "87s",
          "75s",
          "76s",
          "64s",
          "65s",
          "54s",
          "A2o",
          "A3o",
          "A4o",
          "A5o",
          "A6o",
          "A7o",
          "A8o",
          "A9o",
          "ATo",
          "AJo",
          "AQo",
          "AKo",
          "K9o",
          "KTo",
          "KJo",
          "KQo",
          "Q9o",
          "QTo",
          "QJo",
          "J9o",
          "JTo",
          "T9o",
        ],
      },
      SB: {
        RAISE: [
          "22p",
          "33p",
          "44p",
          "55p",
          "66p",
          "77p",
          "88p",
          "99p",
          "TTp",
          "JJp",
          "QQp",
          "KKp",
          "AAp",
          "A2s",
          "A3s",
          "A4s",
          "A5s",
          "A6s",
          "A7s",
          "A8s",
          "A9s",
          "ATs",
          "AJs",
          "AQs",
          "AKs",
          "K2s",
          "K3s",
          "K4s",
          "K5s",
          "K6s",
          "K7s",
          "K8s",
          "K9s",
          "KTs",
          "KJs",
          "KQs",
          "Q2s",
          "Q3s",
          "Q4s",
          "Q5s",
          "Q6s",
          "Q7s",
          "Q8s",
          "Q9s",
          "QTs",
          "QJs",
          "J2s",
          "J3s",
          "J4s",
          "J5s",
          "J6s",
          "J7s",
          "J8s",
          "J9s",
          "JTs",
          "T5s",
          "T6s",
          "T7s",
          "T8s",
          "T9s",
          "95s",
          "96s",
          "97s",
          "98s",
          "84s",
          "85s",
          "86s",
          "87s",
          "74s",
          "75s",
          "76s",
          "63s",
          "64s",
          "65s",
          "52s",
          "53s",
          "54s",
          "42s",
          "43s",
          "32s",
          "A4o",
          "A5o",
          "A6o",
          "A7o",
          "A8o",
          "A9o",
          "ATo",
          "AJo",
          "AQo",
          "AKo",
          "KJo",
          "KQo",
          "QTo",
          "QJo",
          "JTo",
        ],
        CALL: [
          "A2o",
          "A3o",
          "K2o",
          "K3o",
          "K4o",
          "K5o",
          "K6o",
          "K7o",
          "K8o",
          "K9o",
          "KTo",
          "Q2o",
          "Q3o",
          "Q4o",
          "Q5o",
          "Q6o",
          "Q7o",
          "Q8o",
          "Q9o",
          "J2o",
          "J3o",
          "J4o",
          "J5o",
          "J6o",
          "J7o",
          "J8o",
          "J9o",
          "T2o",
          "T3o",
          "T4o",
          "T5o",
          "T6o",
          "T7o",
          "T8o",
          "T9o",
          "92o",
          "93o",
          "94o",
          "95o",
          "96o",
          "97o",
          "98o",
          "82o",
          "83o",
          "84o",
          "85o",
          "86o",
          "87o",
          "72o",
          "73o",
          "74o",
          "75o",
          "76o",
          "62o",
          "63o",
          "64o",
          "65o",
          "52o",
          "53o",
          "54o",
          "42o",
          "43o",
          "32o",
        ],
      },
      BB: {
        "3-BET": [
          "JJp",
          "QQp",
          "KKp",
          "AAp",
          "A2s",
          "A3s",
          "A4s",
          "A5s",
          "AJs",
          "AQs",
          "AKs",
          "KQs",
          "KJs",
          "KTs",
          "QJs",
          "JTs",
          "AQo",
          "AKo",
        ],
        CALL: [
          "22p",
          "33p",
          "44p",
          "55p",
          "66p",
          "77p",
          "88p",
          "99p",
          "TTp",
          "A6s",
          "A7s",
          "A8s",
          "A9s",
          "ATs",
          "K2s",
          "K3s",
          "K4s",
          "K5s",
          "K6s",
          "K7s",
          "K8s",
          "K9s",
          "Q2s",
          "Q3s",
          "Q4s",
          "Q5s",
          "Q6s",
          "Q7s",
          "Q8s",
          "Q9s",
          "QTs",
          "J2s",
          "J3s",
          "J4s",
          "J5s",
          "J6s",
          "J7s",
          "J8s",
          "J9s",
          "T8s",
          "T9s",
          "97s",
          "98s",
          "86s",
          "87s",
          "75s",
          "76s",
          "65s",
          "54s",
          "A2o",
          "A3o",
          "A4o",
          "A5o",
          "A6o",
          "A7o",
          "A8o",
          "A9o",
          "ATo",
          "AJo",
          "KTo",
          "KJo",
          "KQo",
          "QTo",
          "QJo",
          "JTo",
        ],
      },
    },
    hu: {
      BTN: {
        RAISE: [
          "22p",
          "33p",
          "44p",
          "55p",
          "66p",
          "77p",
          "88p",
          "99p",
          "TTp",
          "JJp",
          "QQp",
          "KKp",
          "AAp",
          "A2s",
          "A3s",
          "A4s",
          "A5s",
          "A6s",
          "A7s",
          "A8s",
          "A9s",
          "ATs",
          "AJs",
          "AQs",
          "AKs",
          "K2s",
          "K3s",
          "K4s",
          "K5s",
          "K6s",
          "K7s",
          "K8s",
          "K9s",
          "KTs",
          "KJs",
          "KQs",
          "Q2s",
          "Q3s",
          "Q4s",
          "Q5s",
          "Q6s",
          "Q7s",
          "Q8s",
          "Q9s",
          "QTs",
          "QJs",
          "J7s",
          "J8s",
          "J9s",
          "JTs",
          "T7s",
          "T8s",
          "T9s",
          "97s",
          "98s",
          "87s",
          "76s",
          "65s",
          "54s",
          "A2o",
          "A3o",
          "A4o",
          "A5o",
          "A6o",
          "A7o",
          "A8o",
          "A9o",
          "ATo",
          "AJo",
          "AQo",
          "AKo",
          "K9o",
          "KTo",
          "KJo",
          "KQo",
          "Q9o",
          "QTo",
          "QJo",
          "J9o",
          "JTo",
          "T9o",
        ],
      },
      BB: {
        "3-BET": [
          "AAp",
          "KKp",
          "QQp",
          "JJp",
          "TTp",
          "99p",
          "88p",
          "77p",
          "66p",
          "AKs",
          "AQs",
          "AJs",
          "ATs",
          "A5s",
          "A4s",
          "A3s",
          "A2s",
          "AQo",
          "AJo",
          "ATo",
          "KQs",
          "KJs",
          "KTs",
          "QJs",
          "QTs",
          "JTs",
          "T9s",
          "AKo",
          "KQo",
        ],
        CALL: [
          "55p",
          "44p",
          "33p",
          "22p",
          "A9s",
          "A8s",
          "A7s",
          "A6s",
          "K9s",
          "K8s",
          "K7s",
          "K6s",
          "K5s",
          "K4s",
          "K3s",
          "K2s",
          "Q9s",
          "Q8s",
          "Q7s",
          "Q6s",
          "Q5s",
          "Q4s",
          "Q3s",
          "Q2s",
          "J9s",
          "J8s",
          "J7s",
          "J6s",
          "J5s",
          "J4s",
          "J3s",
          "J2s",
          "T8s",
          "T7s",
          "T6s",
          "T5s",
          "T4s",
          "T3s",
          "T2s",
          "98s",
          "97s",
          "96s",
          "95s",
          "94s",
          "93s",
          "92s",
          "87s",
          "86s",
          "85s",
          "84s",
          "83s",
          "76s",
          "75s",
          "74s",
          "73s",
          "65s",
          "64s",
          "63s",
          "54s",
          "53s",
          "52s",
          "43s",
          "42s",
          "32s",
          "A9o",
          "A8o",
          "A7o",
          "A6o",
          "A5o",
          "A4o",
          "A3o",
          "A2o",
          "KJo",
          "KTo",
          "K9o",
          "K8o",
          "K7o",
          "K6o",
          "K5o",
          "QJo",
          "QTo",
          "Q9o",
          "Q8o",
          "Q7o",
          "Q6o",
          "JTo",
          "J9o",
          "J8o",
          "J7o",
          "T8o",
          "T9o",
          "T7o",
          "98o",
          "97o",
          "87o",
          "86o",
          "76o",
          "65o",
          "54o",
        ],
      },
    },
  };
  let currentSelection = {
    playerCount: "6max",
    position: "UTG",
    vsPosition: "UTG", // BB用
  };

  function getHandName(i, j) {
    const c1 = CARDS[i],
      c2 = CARDS[j];
    if (i === j) return `${c1}${c2}p`;
    return i < j ? `${c1}${c2}s` : `${c2}${c1}o`;
  }

  function renderRangeGrid() {
    const { playerCount, position, vsPosition } = currentSelection;
    let rangeKey = position;
    if (position === "BB" && playerCount === "6max") {
      rangeKey = `BB_vs_${vsPosition}`;
    }
    const currentRange = rangeData[playerCount]?.[rangeKey];
    rangeGrid.innerHTML = "";

    if (!currentRange) {
      rangeGrid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; align-self: center;">レンジが定義されていません</div>`;
      return;
    }

    const raiseHands = new Set(currentRange.RAISE || []);
    const callHands = new Set(currentRange.CALL || []);
    const threeBetHands = new Set(currentRange["3-BET"] || []);

    for (let i = 0; i < 13; i++) {
      for (let j = 0; j < 13; j++) {
        const handName = getHandName(i, j);
        const cell = document.createElement("div");
        cell.className = "grid-cell";
        cell.textContent = handName.replace(/[pso]/, "");

        if (threeBetHands.has(handName)) cell.classList.add("cell-three-bet");
        else if (raiseHands.has(handName)) cell.classList.add("cell-raise");
        else if (callHands.has(handName)) cell.classList.add("cell-call");
        else cell.classList.add("cell-fold");

        rangeGrid.appendChild(cell);
      }
    }
  }

  function updatePositionButtons() {
    const positions = POSITIONS[currentSelection.playerCount];
    positionButtonsContainer.innerHTML = "";
    positions.forEach((pos) => {
      const button = document.createElement("button");
      button.className = "pos-btn";
      button.dataset.pos = pos;
      button.textContent = pos;
      if (pos === currentSelection.position) button.classList.add("active");
      positionButtonsContainer.appendChild(button);
    });
  }

  function handlePositionChange() {
    updatePositionButtons();
    renderRangeGrid();
  }

  playerCountSelect.addEventListener("change", (e) => {
    currentSelection.playerCount = e.target.value;
    const availablePositions = POSITIONS[currentSelection.playerCount];
    if (!availablePositions.includes(currentSelection.position)) {
      currentSelection.position = availablePositions[0];
    }
    handlePositionChange();
  });

  positionButtonsContainer.addEventListener("click", (e) => {
    if (e.target.classList.contains("pos-btn")) {
      currentSelection.position = e.target.dataset.pos;
      handlePositionChange();
    }
  });

  // 初期化
  updatePositionButtons();
  renderRangeGrid();
})();

// ===== GTO トレーナー機能 =====
(() => {
  const trainerSection = document.getElementById("gto-trainer");
  if (!trainerSection) return;

  const questionTextEl = document.getElementById("question-text");
  const answerOptionsEl = document.getElementById("answer-options");
  const feedbackTextEl = document.getElementById("feedback-text");
  const explanationTextEl = document.getElementById("explanation-text");
  const startBtn = document.getElementById("start-trainer-btn");
  const scoreEl = document.getElementById("trainer-score");
  const attemptsEl = document.getElementById("trainer-attempts");
  const categorySelect = document.getElementById("question-type-select");

  let score = 0;
  let attempts = 0;
  let currentQuestion = {};

  const questionBank = {
    terminology: [
      {
        question:
          "プリフロップで、最初のレイズに対してさらにレイズ（リレイズ）をすることは何と呼ばれますか？",
        options: ["4ベット", "3ベット", "スクイーズ", "オープンレイズ"],
        answer: "3ベット",
      },
      {
        question:
          "自分が勝っている可能性が高いと考え、相手のコールから利益を得るために行うベットを何と呼びますか？",
        options: [
          "ブラフベット",
          "プローブベット",
          "バリューベット",
          "ドンクベット",
        ],
        answer: "バリューベット",
      },
      {
        question:
          "フロップ、ターン、リバーのアクションやベッティングラウンドの総称は何ですか？",
        options: [
          "プリフロップ",
          "ポストフロップ",
          "ショーダウン",
          "オールイン",
        ],
        answer: "ポストフロップ",
      },
    ],
    preflop: [
      {
        question:
          "6-Max、ポジション: UTG、ハンド: AJo。オープンレイズすべきですか？",
        options: ["レイズ", "フォールド"],
        answer: "レイズ",
        explanation:
          "UTGのオープンレンジにはAJoが含まれており、強いハンドと見なされます。",
      },
      {
        question:
          "6-Max、ポジション: CO、ハンド: KTs。オープンレイズすべきですか？",
        options: ["レイズ", "フォールド"],
        answer: "レイズ",
        explanation:
          "COはポジションが良く、KTsは十分にオープンレイズできるハンドです。",
      },
      {
        question:
          "6-Max、ポジション: HJ、ハンド: 75s。オープンレイズすべきですか？",
        options: ["レイズ", "フォールド"],
        answer: "フォールド",
        explanation:
          "HJから75sをオープンするのは少し広すぎます。COやBTNのような後方のポジションからなら検討できます。",
      },
    ],
    situational: [
      {
        question:
          "あなたはBTNからレイズしBBがコール。フロップは A♥ K♦ 7♠。あなたはCベットをすべきですか？",
        options: ["ベット", "チェック"],
        answer: "ベット",
        explanation:
          "このボードはドライで、あなたのレンジに有利です。Cベットを打つことで、多くのハンドからバリューを得るか、相手をフォールドさせることができます。",
      },
      {
        question:
          "あなたはMPからレイズしBTNがコール。フロップは T♥ 9♥ 8♠。あなたはCベットをすべきですか？",
        options: ["ベット", "チェック"],
        answer: "チェック",
        explanation:
          "このボードは非常にウェットで、相手のレンジにもヒットしている可能性が高いです。チェックしてポットコントロールする方が安全な場合があります。",
      },
    ],
  };

  function generateQuestion() {
    feedbackTextEl.textContent = "";
    explanationTextEl.textContent = "";
    answerOptionsEl.innerHTML = "";
    startBtn.textContent = "次の問題へ";

    const category = categorySelect.value;
    let availableQuestions = [];
    if (category === "all") {
      availableQuestions = [
        ...questionBank.terminology,
        ...questionBank.preflop,
        ...questionBank.situational,
      ];
    } else {
      availableQuestions = questionBank[category];
    }

    if (availableQuestions.length === 0) {
      questionTextEl.textContent = "このカテゴリの問題は現在ありません。";
      return;
    }

    currentQuestion =
      availableQuestions[Math.floor(Math.random() * availableQuestions.length)];

    questionTextEl.textContent = currentQuestion.question;

    currentQuestion.options.forEach((option) => {
      const button = document.createElement("button");
      button.textContent = option;
      button.classList.add("answer-btn");
      button.addEventListener("click", handleAnswerClick);
      answerOptionsEl.appendChild(button);
    });
  }

  function handleAnswerClick(e) {
    const selectedAnswer = e.target.textContent;
    const isCorrect = selectedAnswer === currentQuestion.answer;

    attempts++;
    if (isCorrect) {
      score++;
      feedbackTextEl.textContent = "正解！";
      feedbackTextEl.className = "correct";
    } else {
      feedbackTextEl.textContent = "不正解...";
      feedbackTextEl.className = "incorrect";
    }

    if (currentQuestion.explanation) {
      explanationTextEl.textContent = `解説: ${currentQuestion.explanation}`;
    }

    scoreEl.textContent = score;
    attemptsEl.textContent = attempts;

    Array.from(answerOptionsEl.children).forEach((button) => {
      button.disabled = true;
      if (button.textContent === currentQuestion.answer) {
        button.classList.add("correct");
      } else if (button.textContent === selectedAnswer) {
        button.classList.add("incorrect");
      }
    });
  }

  startBtn.addEventListener("click", generateQuestion);
})();

// ===== テキサスホールデム機能 (リファクタリング版) =====
const TexasHoldemGame = (() => {
  // --- 状態管理 ---
  let state = {};

  // --- 定数 ---
  const RANKS = "23456789TJQKA";
  const SUITS = "♠♥♦♣";
  const SUIT_COLORS = { "♠": "black", "♥": "red", "♦": "red", "♣": "black" };
  const HAND_RANKS = {
    HIGH_CARD: 0,
    ONE_PAIR: 1,
    TWO_PAIR: 2,
    THREE_OF_A_KIND: 3,
    STRAIGHT: 4,
    FLUSH: 5,
    FULL_HOUSE: 6,
    FOUR_OF_A_KIND: 7,
    STRAIGHT_FLUSH: 8,
    ROYAL_FLUSH: 9,
  };
  const HAND_NAMES = [
    "ハイカード",
    "ワンペア",
    "ツーペア",
    "スリーカード",
    "ストレート",
    "フラッシュ",
    "フルハウス",
    "フォーカード",
    "ストレートフラッシュ",
    "ロイヤルフラッシュ",
  ];
  // STREETS定数はUIから削除されたため不要

  // --- DOM要素 ---
  let dom = {};

  function initializeDOM() {
    dom = {
      setupScreen: document.getElementById("setup-screen"),
      gameScreen: document.getElementById("game-screen"),
      playersWrapper: document.getElementById("players-wrapper"),
      potTotalElem: document.getElementById("pot-total-value"),
      potDetailsElem: document.getElementById("pot-details"),
      communityCardsArea: document.getElementById("community-cards-area"),
      showdownResultsArea: document.getElementById("showdown-results-area"),
      alertElement: document.getElementById("custom-alert"),
      // Global controls are removed
    };
  }

  // --- 初期化 ---
  function init() {
    initializeDOM();
    renderSetupScreen();
  }

  function renderSetupScreen() {
    if (!dom.setupScreen) return;
    const setupScreenHTML = `
      <div class="setup-form">
          <label for="num-players">プレイヤー数</label>
          <select id="num-players">${[2, 3, 4]
            .map(
              (n) =>
                `<option value="${n}" ${
                  n === 2 ? "selected" : ""
                }>${n}人</option>`
            )
            .join("")}</select>
          <label for="initial-stack">初期スタック</label>
          <input type="number" id="initial-stack" value="10000">
          <label for="small-blind">スモールブラインド(SB)</label>
          <input type="number" id="small-blind" value="50">
          <label for="big-blind">ビッグブラインド(BB)</label>
          <input type="number" id="big-blind" value="100">
      </div>
      <button id="start-game-btn">ゲーム開始</button>`;
    dom.setupScreen.innerHTML = setupScreenHTML;
    dom.setupScreen
      .querySelector("#start-game-btn")
      .addEventListener("click", initializeGame);
    dom.gameScreen.style.display = "none";
    dom.setupScreen.style.display = "block";
  }

  function initializeGame() {
    // Force heads-up (2 players) to avoid drag/rotation layout bugs
    const numPlayers = 2;
    const initialStack = parseInt(
      document.getElementById("initial-stack").value
    );
    const sb = parseInt(document.getElementById("small-blind").value);
    const bb = parseInt(document.getElementById("big-blind").value);

    if (
      isNaN(numPlayers) ||
      isNaN(initialStack) ||
      isNaN(sb) ||
      isNaN(bb) ||
      initialStack <= 0 ||
      sb <= 0 ||
      bb <= 0 ||
      sb >= bb
    ) {
      showAlert("有効な設定値を入力してください。");
      return;
    }

    state = {
      players: [],
      pots: [],
      dealerIndex: -1,
      activePlayerIndex: -1,
      streetHighestBet: 0,
      lastRaiseSize: 0,
      streetIndex: 0,
      config: { numPlayers, initialStack, sb, bb },
      // localPlayerId: 0 をデフォルトで自分のプレイヤーIDとして扱う
      localPlayerId: 0,
      sbIndex: -1,
      bbIndex: -1,
      deck: [],
      communityCards: [],
      showdownWinners: null,
      alertTimeout: null,
      isHandOver: false,
    };

    for (let i = 0; i < numPlayers; i++) {
      state.players.push({
        id: i,
        name: `Player ${i + 1}`,
        stack: initialStack,
        holeCards: [],
        bet: 0,
        totalBetInStreet: 0,
        hasActed: false,
        isFolded: false,
        isAllIn: false,
        isEliminated: false,
        handDetails: null,
      });
    }

    dom.setupScreen.style.display = "none";
    dom.gameScreen.style.display = "block";
    generatePlayerAreas();
    addEventListeners();
    startHand();
  }

  // --- UI生成とイベントリスナー ---
  function generatePlayerAreas() {
    dom.playersWrapper.innerHTML = "";
    state.players.forEach((player) => {
      const playerArea = document.createElement("div");
      playerArea.className = `player-area player-${player.id}`;
      playerArea.dataset.playerId = player.id;
      playerArea.innerHTML = `
        <div class="player-header">
          <span class="player-name">${player.name}</span>
          <div class="blind-indicator"></div>
          <button class="rotate-btn">↻</button>
        </div>
        <div class="player-info">
            <div class="stack"></div>
            <div class="bet-display"></div>
            <div class="hand-rank-display"></div>
        </div>
        <div class="cards-area"></div>
        <div class="player-controls">
            <div class="actions">
                <button data-action="fold" class="btn-fold">Fold</button>
                <button data-action="check" class="btn-check">Check</button>
                <button data-action="call" class="btn-call">Call</button>
                <button data-action="raise" class="btn-raise">Raise</button>
            </div>
            <div class="raise-controls">
                <input type="range" class="raise-slider" min="0" max="0" step="1">
                <input type="number" class="raise-input" min="0" max="0">
                <button data-action="all-in" class="btn-all-in">All-in</button>
            </div>
        </div>
        <div class="dealer-btn">D</div>
      `;
      dom.playersWrapper.appendChild(playerArea);
    });
    makePlayersDraggable();
    addPlayerActionListeners();
  }

  function addEventListeners() {
    // This function is now for global listeners like reset button
    const resetButton = document.querySelector("#texas-holdem .btn-reset-game");
    if (resetButton) {
      // Prevent duplicate listeners
      const newResetButton = resetButton.cloneNode(true);
      resetButton.parentNode.replaceChild(newResetButton, resetButton);
      newResetButton.addEventListener("click", resetGame);
    }

    dom.showdownResultsArea.addEventListener("click", (e) => {
      if (e.target.dataset.action === "next-hand") {
        confirmWinnersAndNextHand();
      }
    });
  }

  function addPlayerActionListeners() {
    dom.playersWrapper
      .querySelectorAll(".player-area")
      .forEach((playerArea) => {
        const playerId = parseInt(playerArea.dataset.playerId, 10);
        const controls = playerArea.querySelector(".player-controls");
        if (!controls) return;

        // Attach listeners directly to buttons to avoid delegation issues with drag handlers
        controls.querySelectorAll("button[data-action]").forEach((btn) => {
          btn.addEventListener("click", (e) => {
            e.stopPropagation();
            e.preventDefault();

            if (state.isHandOver) return;
            if (state.activePlayerIndex !== playerId) return;

            const action = btn.dataset.action;
            if (!action) return;

            switch (action) {
              case "fold":
                handleAction(playerId, "fold");
                break;
              case "check":
                handleAction(playerId, "check");
                break;
              case "call":
                handleAction(playerId, "call");
                break;
              case "raise": {
                const raiseControls =
                  playerArea.querySelector(".raise-controls");
                if (!raiseControls) break;
                const isVisible = raiseControls.style.display === "flex";
                if (isVisible) {
                  const raiseInput = playerArea.querySelector(".raise-input");
                  const raiseAmount = parseInt(raiseInput.value, 10) || 0;
                  handleAction(playerId, "raise", raiseAmount);
                } else {
                  // Show raise controls and focus input
                  raiseControls.style.display = "flex";
                  const raiseInput = playerArea.querySelector(".raise-input");
                  if (raiseInput) {
                    raiseInput.focus();
                    // sync slider/input values from current settings
                    const raiseSlider =
                      playerArea.querySelector(".raise-slider");
                    if (raiseSlider) raiseInput.value = raiseSlider.value;
                  }
                }
                break;
              }
              case "all-in": {
                const allInAmount =
                  state.players[playerId].stack + state.players[playerId].bet;
                handleAction(playerId, "raise", allInAmount);
                break;
              }
            }
          });
        });

        const raiseSlider = playerArea.querySelector(".raise-slider");
        const raiseInput = playerArea.querySelector(".raise-input");
        if (raiseSlider && raiseInput) {
          // Keep slider and input in sync
          raiseSlider.addEventListener("input", (e) => {
            raiseInput.value = raiseSlider.value;
            e.stopPropagation();
          });
          raiseInput.addEventListener("input", (e) => {
            // Ensure numeric value
            const v = parseInt(raiseInput.value, 10);
            if (!isNaN(v)) raiseSlider.value = v;
            e.stopPropagation();
          });
        }
      });
  }

  // --- ドラッグ＆ドロップ、回転機能 ---
  function makePlayersDraggable() {
    // Disable dragging and force fixed heads-up positions (top vs bottom facing each other)
    const playerAreas = dom.playersWrapper.querySelectorAll(".player-area");
    const parentRect = dom.gameScreen.getBoundingClientRect();
    playerAreas.forEach((area) => {
      const pid = parseInt(area.dataset.playerId, 10);
      area.dataset.absolute = "true";
      area.style.position = "absolute";
      area.style.right = "auto";
      area.style.bottom = "auto";
      area.style.width = area.style.width || "";

      // Heads-up fixed layout: player 0 bottom center, player 1 top center
      area.style.left = "50%";
      area.style.transform = "translateX(-50%)";
      if (pid === 0) {
        // Bottom player (facing up)
        area.style.top = "auto";
        area.style.bottom = "20px";
        area.dataset.rotation = "0";
        area.style.transform = "translateX(-50%) rotate(0deg)";
      } else {
        // Top player (facing down)
        area.style.top = "20px";
        area.style.bottom = "auto";
        area.dataset.rotation = "180";
        area.style.transform = "translateX(-50%) rotate(180deg)";
      }

      // Hide rotate controls to avoid rotation changes
      const rotateBtn = area.querySelector(".rotate-btn");
      if (rotateBtn) rotateBtn.style.display = "none";
    });
  }

  // --- UI更新 ---
  function updateUI() {
    if (!state.players || !dom.potTotalElem) return;

    const currentBets = state.players.reduce((sum, p) => sum + p.bet, 0);
    const potsTotal = state.pots.reduce((sum, p) => sum + p.amount, 0);
    dom.potTotalElem.textContent = `${potsTotal + currentBets}`;

    dom.potDetailsElem.textContent = state.pots
      .map((p, i) => `サイドポット${i + 1}: ${p.amount}`)
      .join(" | ");

    dom.communityCardsArea.innerHTML = "";
    state.communityCards.forEach((card) => {
      dom.communityCardsArea.appendChild(renderCard(card));
    });

    state.players.forEach((player) => {
      const playerArea = dom.playersWrapper.querySelector(
        `.player-${player.id}`
      );
      if (!playerArea) return;

      playerArea.classList.toggle(
        "active-turn",
        player.id === state.activePlayerIndex && !state.isHandOver
      );
      playerArea.classList.toggle("folded", player.isFolded);
      playerArea.classList.toggle("eliminated", player.isEliminated);

      playerArea.querySelector(".stack").textContent = `S: ${player.stack}`;
      playerArea.querySelector(".bet-display").textContent =
        player.bet > 0 ? `B: ${player.bet}` : "";
      playerArea.querySelector(".dealer-btn").style.display =
        player.id === state.dealerIndex ? "block" : "none";

      const blindIndicator = playerArea.querySelector(".blind-indicator");
      if (player.id === state.sbIndex) blindIndicator.textContent = "SB";
      else if (player.id === state.bbIndex) blindIndicator.textContent = "BB";
      else blindIndicator.textContent = "";

      const cardsArea = playerArea.querySelector(".cards-area");
      cardsArea.innerHTML = "";
      // ローカルプレイヤー判定は state.localPlayerId を使う
      const isLocal = typeof state.localPlayerId === "number" ? player.id === state.localPlayerId : player.id === 0;
      // 簡易モード: ローカルプレイヤーのハンドは必ず見えるようにする。
      // ショーダウン時はフォールドしていないプレイヤーのハンドを表示する。
      const shouldShowCards = isLocal || (state.isHandOver && !player.isFolded);
      player.holeCards.forEach((card) => {
        cardsArea.appendChild(renderCard(card, !shouldShowCards));
      });

      const handRankDisplay = playerArea.querySelector(".hand-rank-display");
      // ショーダウン時は全員の役を表示。ローカルプレイヤーは自分の役を見たい場合に表示（判定済みの場合のみ）。
      if (
        (state.isHandOver && !player.isFolded && player.handDetails) ||
        (isLocal && player.handDetails)
      ) {
        handRankDisplay.textContent = HAND_NAMES[player.handDetails.rank];
        handRankDisplay.style.display = "block";
      } else {
        handRankDisplay.style.display = "none";
      }

      updateActionButtonsForPlayer(player);
    });

    dom.showdownResultsArea.style.display =
      state.isHandOver && state.showdownWinners ? "block" : "none";
  }

  function updateActionButtonsForPlayer(player) {
    const playerArea = dom.playersWrapper.querySelector(`.player-${player.id}`);
    if (!playerArea) return;

    const controls = playerArea.querySelector(".player-controls");
    const isActive = player.id === state.activePlayerIndex && !state.isHandOver;
    // Always show controls, but disable buttons when not active
    controls.style.display = "flex";

    const callAmount = Math.min(
      player.stack,
      state.streetHighestBet - player.bet
    );
    const canCheck = callAmount <= 0;

    controls.querySelector('[data-action="fold"]').disabled = !isActive;
    const checkButton = controls.querySelector('[data-action="check"]');
    checkButton.style.display = canCheck ? "inline-block" : "none";

    const callButton = controls.querySelector('[data-action="call"]');
    callButton.style.display = !canCheck ? "inline-block" : "none";
    callButton.textContent = `Call ${callAmount > 0 ? callAmount : ""}`.trim();

    const raiseButton = controls.querySelector('[data-action="raise"]');
    const raiseControls = controls.querySelector(".raise-controls");
    const raiseSlider = controls.querySelector(".raise-slider");
    const raiseInput = controls.querySelector(".raise-input");
    const allInButton = controls.querySelector('[data-action="all-in"]');

    const minRaise = state.streetHighestBet + state.lastRaiseSize;
    const maxRaise = player.stack + player.bet;

    const canRaise =
      player.stack > callAmount && maxRaise > state.streetHighestBet;
    raiseButton.style.display = canRaise ? "inline-block" : "none";
    allInButton.style.display = canRaise ? "inline-block" : "none";

    // Hide raise controls by default unless raise button was just clicked
    if (raiseControls.style.display !== "flex") {
      raiseControls.style.display = "none";
    }

    if (canRaise) {
      const effectiveMinRaise = Math.min(minRaise, maxRaise);
      raiseSlider.min = effectiveMinRaise;
      raiseSlider.max = maxRaise;
      raiseSlider.value = effectiveMinRaise;
      raiseInput.min = effectiveMinRaise;
      raiseInput.max = maxRaise;
      raiseInput.value = effectiveMinRaise;
      allInButton.textContent = `All-in (${maxRaise})`;
    }

    // Disable interactive inputs when not active
    raiseSlider.disabled = !isActive;
    raiseInput.disabled = !isActive;
    checkButton.disabled = !isActive;
    callButton.disabled = !isActive;
    raiseButton.disabled = !isActive;
    allInButton.disabled = !isActive;
  }

  // --- カード & デッキ関連 ---
  function createDeck() {
    state.deck = [];
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        state.deck.push({ rank, suit });
      }
    }
  }

  function shuffleDeck() {
    for (let i = state.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [state.deck[i], state.deck[j]] = [state.deck[j], state.deck[i]];
    }
  }

  function dealCards() {
    if (state.streetIndex === 0) {
      // プリフロップ
      for (let i = 0; i < 2; i++) {
        for (const player of state.players) {
          if (!player.isEliminated) player.holeCards.push(state.deck.pop());
        }
      }
    } else {
      // ポストフロップ
      state.deck.pop(); // バーン
      const dealCount = state.streetIndex === 1 ? 3 : 1;
      for (let i = 0; i < dealCount; i++) {
        state.communityCards.push(state.deck.pop());
      }
    }
  }

  function renderCard(card, isBack = false) {
    const cardElem = document.createElement("div");
    cardElem.className = `card ${
      isBack ? "card-back" : SUIT_COLORS[card.suit]
    }`;
    if (!isBack) {
      cardElem.innerHTML = `<span class="rank">${card.rank}</span><span class="suit">${card.suit}</span>`;
    }
    return cardElem;
  }

  // --- ゲームフロー ---
  function resetHandState() {
    state.pots = [];
    state.communityCards = [];
    state.streetIndex = 0;
    state.streetHighestBet = 0;
    state.lastRaiseSize = state.config.bb;
    state.showdownWinners = null;
    state.isHandOver = false;
    state.players.forEach((p) => {
      if (!p.isEliminated) {
        p.holeCards = [];
        p.bet = 0;
        p.totalBetInStreet = 0;
        p.hasActed = false;
        p.isFolded = false;
        p.isAllIn = false;
        p.handDetails = null;
      }
    });
  }

  function startHand() {
    resetHandState();

    const activePlayers = state.players.filter((p) => !p.isEliminated);
    if (activePlayers.length < 2) {
      showAlert("ゲーム終了！勝者は " + activePlayers[0]?.name);
      state.isHandOver = true;
      updateUI();
      return;
    }

    state.dealerIndex = findNextPlayerIndex(state.dealerIndex, true);
    state.sbIndex = findNextPlayerIndex(state.dealerIndex);
    state.bbIndex = findNextPlayerIndex(state.sbIndex);

    createDeck();
    shuffleDeck();
    dealCards();

    handleBet(state.sbIndex, state.config.sb, true);
    handleBet(state.bbIndex, state.config.bb, true);

    state.streetHighestBet = state.config.bb;
    state.activePlayerIndex = findNextPlayerIndex(state.bbIndex);

    // 簡易モード: ローカルプレイヤー(localPlayerId) が存在する場合は
    // テストしやすいようにそのプレイヤーをアクティブにする
    if (
      typeof state.localPlayerId === "number" &&
      state.players.some((p) => p.id === state.localPlayerId && !p.isEliminated)
    ) {
      state.activePlayerIndex = state.localPlayerId;
    }

    updateUI();
  }

  function handleAction(playerId, action, amount = 0) {
    const player = state.players[playerId];
    if (!player || playerId !== state.activePlayerIndex || state.isHandOver)
      return;

    switch (action) {
      case "fold":
        player.isFolded = true;
        break;
      case "check":
        // 何もしない
        break;
      case "call":
        const callAmount = state.streetHighestBet - player.bet;
        handleBet(playerId, callAmount);
        break;
      case "raise":
        const raiseAmount = amount - player.bet;
        if (amount > state.streetHighestBet) {
          state.lastRaiseSize = amount - state.streetHighestBet;
          state.streetHighestBet = amount;
          state.players.forEach((p) => {
            if (!p.isFolded && !p.isAllIn) p.hasActed = false;
          });
        }
        handleBet(playerId, raiseAmount);
        break;
    }
    player.hasActed = true;

    // Hide raise controls after action
    const playerArea = dom.playersWrapper.querySelector(`.player-${playerId}`);
    if (playerArea) {
      const raiseControls = playerArea.querySelector(".raise-controls");
      if (raiseControls) raiseControls.style.display = "none";
    }

    state.activePlayerIndex = findNextPlayerIndex(state.activePlayerIndex);
    checkHandContinuation();
  }

  function handleBet(playerId, amount, isBlind = false) {
    const player = state.players[playerId];
    const betAmount = Math.min(player.stack, amount);
    player.bet += betAmount;
    player.stack -= betAmount;
    if (player.stack === 0) {
      player.isAllIn = true;
    }
    if (!isBlind) player.hasActed = true;
  }

  function checkHandContinuation() {
    const activePlayers = state.players.filter(
      (p) => !p.isFolded && !p.isEliminated
    );
    if (activePlayers.length === 1) {
      endHandWithWinner(activePlayers[0]);
      return;
    }

    if (isBettingRoundOver()) {
      collectBetsAndCreatePots();
      advanceStreet();
    } else {
      updateUI();
    }
  }

  function isBettingRoundOver() {
    const relevantPlayers = state.players.filter(
      (p) => !p.isFolded && !p.isAllIn && !p.isEliminated
    );
    if (relevantPlayers.length === 0) return true;

    const allActed = relevantPlayers.every((p) => p.hasActed);
    const betsEqualized = relevantPlayers.every(
      (p) => p.bet === state.streetHighestBet
    );

    return allActed && betsEqualized;
  }

  function advanceStreet() {
    state.streetIndex++;
    state.streetHighestBet = 0;
    state.lastRaiseSize = state.config.bb;
    state.players.forEach((p) => {
      p.totalBetInStreet += p.bet;
      p.bet = 0;
      if (!p.isFolded && !p.isEliminated) {
        p.hasActed = false;
      }
    });

    if (state.streetIndex > 3) {
      showdown();
      return;
    }

    dealCards();

    const playersToAct = state.players.filter(
      (p) => !p.isFolded && !p.isAllIn && !p.isEliminated
    );
    if (playersToAct.length > 1) {
      state.activePlayerIndex = findNextPlayerIndex(
        state.dealerIndex,
        false,
        true
      );
    } else {
      // ベットラウンドをスキップして次のストリートへ
      collectBetsAndCreatePots();
      setTimeout(advanceStreet, 1000);
      return;
    }

    updateUI();
  }

  function collectBetsAndCreatePots() {
    const playersInHand = state.players.filter(
      (p) => !p.isFolded && !p.isEliminated
    );
    playersInHand.forEach((p) => {
      p.totalBetInStreet += p.bet;
    });

    const bets = playersInHand
      .map((p) => p.totalBetInStreet)
      .filter((bet) => bet > 0)
      .sort((a, b) => a - b)
      .filter((v, i, a) => a.indexOf(v) === i); // Unique sorted bets

    let lastBetLevel = 0;
    bets.forEach((betLevel) => {
      const potAmount =
        (betLevel - lastBetLevel) *
        playersInHand.filter((p) => p.totalBetInStreet >= betLevel).length;
      const eligiblePlayers = playersInHand
        .filter((p) => p.totalBetInStreet >= betLevel)
        .map((p) => p.id);

      if (potAmount > 0) {
        const existingPot = state.pots.find(
          (p) =>
            JSON.stringify(p.eligiblePlayers.sort()) ===
            JSON.stringify(eligiblePlayers.sort())
        );
        if (existingPot) {
          existingPot.amount += potAmount;
        } else {
          state.pots.push({ amount: potAmount, eligiblePlayers });
        }
      }
      lastBetLevel = betLevel;
    });

    // 現在のベットをポットに追加
    const currentBetsAmount = state.players.reduce((sum, p) => sum + p.bet, 0);
    if (currentBetsAmount > 0) {
      const eligiblePlayers = state.players
        .filter((p) => !p.isFolded && !p.isEliminated)
        .map((p) => p.id);
      const mainPot = state.pots.find(
        (p) =>
          JSON.stringify(p.eligiblePlayers.sort()) ===
          JSON.stringify(eligiblePlayers.sort())
      );
      if (mainPot) {
        mainPot.amount += currentBetsAmount;
      } else {
        state.pots.push({ amount: currentBetsAmount, eligiblePlayers });
      }
    }
  }

  // --- 役判定 ---
  function evaluateHand(holeCards, board) {
    const allCards = [...holeCards, ...board];
    const combinations = getCombinations(allCards, 5);
    let bestHand = null;
    for (const combo of combinations) {
      const handDetails = getHandDetails(combo);
      if (!bestHand || compareHands(bestHand, handDetails) < 0) {
        bestHand = handDetails;
      }
    }
    return bestHand;
  }

  function compareHands(h1, h2) {
    if (h1.rank !== h2.rank) return h1.rank - h2.rank;
    for (let i = 0; i < h1.values.length; i++) {
      if (h1.values[i] !== h2.values[i]) return h1.values[i] - h2.values[i];
    }
    return 0;
  }

  function getCombinations(arr, k) {
    const result = [];
    function combine(start, combo) {
      if (combo.length === k) {
        result.push([...combo]);
        return;
      }
      for (let i = start; i < arr.length; i++) {
        combo.push(arr[i]);
        combine(i + 1, combo);
        combo.pop();
      }
    }
    combine(0, []);
    return result;
  }

  function getHandDetails(fiveCards) {
    const values = getCardValues(fiveCards);
    const isFlush = fiveCards.every((c) => c.suit === fiveCards[0].suit);
    const straightData = isStraightCheck(values);
    const isStraight = straightData.isStraight;

    if (isStraight && isFlush) {
      if (straightData.highCard === 14)
        return { rank: HAND_RANKS.ROYAL_FLUSH, values: straightData.values };
      return { rank: HAND_RANKS.STRAIGHT_FLUSH, values: straightData.values };
    }

    const counts = values.reduce((acc, v) => {
      acc[v] = (acc[v] || 0) + 1;
      return acc;
    }, {});
    const groups = Object.entries(counts)
      .map(([val, num]) => ({ val: parseInt(val), num }))
      .sort((a, b) => b.num - a.num || b.val - a.val);

    const primaryGroup = groups[0];
    const secondaryGroup = groups[1];
    const kickers = groups.slice(1).map((g) => g.val);

    if (primaryGroup.num === 4) {
      return {
        rank: HAND_RANKS.FOUR_OF_A_KIND,
        values: [
          primaryGroup.val,
          ...groups.filter((g) => g.val !== primaryGroup.val).map((g) => g.val),
        ],
      };
    }
    if (primaryGroup.num === 3 && secondaryGroup?.num >= 2) {
      return {
        rank: HAND_RANKS.FULL_HOUSE,
        values: [primaryGroup.val, secondaryGroup.val],
      };
    }
    if (isFlush) {
      return { rank: HAND_RANKS.FLUSH, values };
    }
    if (isStraight) {
      return { rank: HAND_RANKS.STRAIGHT, values: straightData.values };
    }
    if (primaryGroup.num === 3) {
      return {
        rank: HAND_RANKS.THREE_OF_A_KIND,
        values: [primaryGroup.val, ...kickers],
      };
    }
    if (primaryGroup.num === 2 && secondaryGroup?.num === 2) {
      const kicker = groups.find(
        (g) => g.val !== primaryGroup.val && g.val !== secondaryGroup.val
      );
      return {
        rank: HAND_RANKS.TWO_PAIR,
        values: [primaryGroup.val, secondaryGroup.val, kicker?.val].filter(
          (v) => v
        ),
      };
    }
    if (primaryGroup.num === 2) {
      return {
        rank: HAND_RANKS.ONE_PAIR,
        values: [primaryGroup.val, ...kickers],
      };
    }
    return { rank: HAND_RANKS.HIGH_CARD, values };
  }

  function getCardValues(cards) {
    return cards.map((c) => RANKS.indexOf(c.rank) + 2).sort((a, b) => b - a);
  }

  function isStraightCheck(values) {
    const uniqueValues = [...new Set(values)].sort((a, b) => b - a);
    if (uniqueValues.length < 5) return { isStraight: false };

    if (
      JSON.stringify(uniqueValues.slice(0, 5)) ===
      JSON.stringify([14, 5, 4, 3, 2])
    ) {
      return { isStraight: true, highCard: 5, values: [5, 4, 3, 2, 1] };
    }

    for (let i = 0; i <= uniqueValues.length - 5; i++) {
      const slice = uniqueValues.slice(i, i + 5);
      if (slice[0] - slice[4] === 4) {
        return { isStraight: true, highCard: slice[0], values: slice };
      }
    }
    return { isStraight: false };
  }

  // --- ヘルパー関数 ---
  function findNextPlayerIndex(
    startIndex,
    isDealerSearch = false,
    postFlop = false
  ) {
    let currentIndex = startIndex;
    if (postFlop) {
      // ポストフロップはディーラーの次から
      currentIndex = state.dealerIndex;
    }
    const limit = state.players.length * 2;
    for (let i = 0; i < limit; i++) {
      currentIndex = (currentIndex + 1) % state.players.length;
      const player = state.players[currentIndex];
      if (
        !player.isEliminated &&
        (isDealerSearch || (!player.isFolded && !player.isAllIn))
      ) {
        return currentIndex;
      }
    }
    return startIndex;
  }

  function resetGame() {
    renderSetupScreen();
  }

  function showAlert(message, duration = 3000) {
    if (!dom.alertElement) return;
    clearTimeout(state.alertTimeout);
    dom.alertElement.textContent = message;
    dom.alertElement.classList.add("show");
    state.alertTimeout = setTimeout(
      () => dom.alertElement.classList.remove("show"),
      duration
    );
  }

  // --- 公開メソッド ---
  return { init };
})();

document.addEventListener("DOMContentLoaded", TexasHoldemGame.init);
