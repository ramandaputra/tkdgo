// ==========================================
// Taekwondo Pro Match Controller
// System: Best of 3 Rounds + Gam-jeom + Editable Scores
// ==========================================

// Match State
const scores = {
  blue: 0,
  red: 0
};

const gamjeom = {
  blue: 0,
  red: 0
};

const roundWins = {
  blue: 0,
  red: 0
};

let currentRound = 1;
const MAX_GAMJEOM = 5;
let maxScore = 20; // 0 = no limit, otherwise first to touch wins round
let isRoundConcluding = false;

// History for Undo
const actionHistory = {
  blue: [],
  red: []
};

// Timer State
let configuredTime = 120;
let remainingTime = configuredTime;
let timerInterval = null;
let isRunning = false;
let isSoundEnabled = true;

// DOM Elements
const timerDisplay = document.getElementById("timer");
const startPauseButton = document.getElementById("startPause");
const liveDot = document.getElementById("liveDot");
const liveStatusText = document.getElementById("liveStatusText");
const floatContainer = document.getElementById("floatContainer");
const soundToggle = document.getElementById("soundToggle");
const soundIcon = document.getElementById("soundIcon");
const keyModal = document.getElementById("keyModal");
const keyHelpToggle = document.getElementById("keyHelpToggle");
const closeModal = document.getElementById("closeModal");
const fullscreenToggle = document.getElementById("fullscreenToggle");
const endRoundBtn = document.getElementById("endRoundBtn");

// Round Modal Elements
const roundModal = document.getElementById("roundModal");
const resultIcon = document.getElementById("resultIcon");
const resultTitle = document.getElementById("resultTitle");
const resultSubtitle = document.getElementById("resultSubtitle");
const modalBlueName = document.getElementById("modalBlueName");
const modalRedName = document.getElementById("modalRedName");
const modalBlueScore = document.getElementById("modalBlueScore");
const modalRedScore = document.getElementById("modalRedScore");
const modalBlueGamjeom = document.getElementById("modalBlueGamjeom");
const modalRedGamjeom = document.getElementById("modalRedGamjeom");
const standingText = document.getElementById("standingText");
const tieBreakerPanel = document.getElementById("tieBreakerPanel");
const tieBlueWins = document.getElementById("tieBlueWins");
const tieRedWins = document.getElementById("tieRedWins");
const normalModalActions = document.getElementById("normalModalActions");
const nextRoundBtn = document.getElementById("nextRoundBtn");
const resetMatchModalBtn = document.getElementById("resetMatchModalBtn");

// ==========================================
// Web Audio API Sound Synthesizer
// ==========================================
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(freq, type, duration, startTime = 0, gainLevel = 0.15) {
  if (!isSoundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
    
    gain.gain.setValueAtTime(gainLevel, ctx.currentTime + startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(ctx.currentTime + startTime);
    osc.stop(ctx.currentTime + startTime + duration);
  } catch (e) {
    // audio context might fail before first interaction
  }
}

function playScoreSound(points) {
  if (points >= 6) {
    playTone(330, "triangle", 0.08, 0, 0.2);
    playTone(550, "sine", 0.18, 0.06, 0.25);
    playTone(880, "sine", 0.22, 0.12, 0.2);
  } else if (points >= 4) {
    playTone(280, "triangle", 0.08, 0, 0.2);
    playTone(520, "sine", 0.18, 0.06, 0.22);
  } else if (points === 3) {
    playTone(440, "sine", 0.14, 0, 0.2);
    playTone(660, "sine", 0.18, 0.05, 0.22);
  } else if (points === 2) {
    playTone(300, "triangle", 0.12, 0, 0.2);
    playTone(400, "sine", 0.15, 0.04, 0.2);
  } else {
    playTone(220, "square", 0.08, 0, 0.18);
  }
}

function playGamjeomSound() {
  playTone(850, "sawtooth", 0.15, 0, 0.25);
  playTone(600, "sawtooth", 0.25, 0.1, 0.3);
}

function playUndoSound() {
  playTone(400, "sine", 0.08, 0, 0.15);
  playTone(250, "triangle", 0.12, 0.06, 0.15);
}

function playBuzzer() {
  playTone(440, "sawtooth", 0.5, 0, 0.25);
  playTone(440, "sawtooth", 0.5, 0.6, 0.25);
  playTone(550, "sawtooth", 0.8, 1.2, 0.3);
}

function playWinFanfare() {
  playTone(523.25, "triangle", 0.15, 0, 0.25);
  playTone(659.25, "triangle", 0.15, 0.15, 0.25);
  playTone(783.99, "triangle", 0.2, 0.3, 0.25);
  playTone(1046.5, "triangle", 0.5, 0.5, 0.3);
}

// ==========================================
// Formatting & Display Utilities
// ==========================================
function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return (
    String(minutes).padStart(2, "0") +
    ":" +
    String(seconds).padStart(2, "0")
  );
}

function updateStatusIndicator(state) {
  if (!liveDot || !liveStatusText) return;
  
  liveDot.classList.remove("active", "paused");
  
  if (state === "LIVE") {
    liveDot.classList.add("active");
    liveStatusText.textContent = "MATCH LIVE";
    timerDisplay.classList.add("running");
    timerDisplay.classList.remove("warning");
  } else if (state === "PAUSED") {
    liveDot.classList.add("paused");
    liveStatusText.textContent = "PAUSED";
    timerDisplay.classList.remove("running");
  } else if (state === "FINISHED") {
    liveStatusText.textContent = "SELESAI";
    timerDisplay.classList.remove("running");
    timerDisplay.classList.add("warning");
  } else {
    liveStatusText.textContent = "STANDBY";
    timerDisplay.classList.remove("running", "warning");
  }
}

function updateTimerDisplay() {
  timerDisplay.textContent = formatTime(remainingTime);
  
  if (isRunning) {
    if (remainingTime <= 10 && remainingTime > 0) {
      timerDisplay.classList.add("warning");
    } else {
      timerDisplay.classList.remove("warning");
    }
  }
}

function spawnFloatingPoint(side, text, isGamjeom = false) {
  if (!floatContainer) return;
  
  const targetScoreElem = document.getElementById(side + "Score");
  if (!targetScoreElem) return;
  
  const rect = targetScoreElem.getBoundingClientRect();
  const floatElem = document.createElement("div");
  floatElem.className = `floating-point ${side}-float ${isGamjeom ? 'gamjeom-float' : ''}`;
  floatElem.textContent = text;
  floatElem.style.left = `${rect.left + rect.width / 2}px`;
  floatElem.style.top = `${rect.top}px`;
  
  floatContainer.appendChild(floatElem);
  
  setTimeout(() => {
    floatElem.remove();
  }, 900);
}

function updateScoreDisplay(side) {
  const scoreElem = document.getElementById(side + "Score");
  if (scoreElem) {
    scoreElem.textContent = scores[side];
    
    scoreElem.classList.remove("score-bump");
    void scoreElem.offsetWidth;
    scoreElem.classList.add("score-bump");
  }
}

function updateGamjeomDisplay(side) {
  const count = gamjeom[side];
  const countText = document.getElementById(side + "GamjeomText");
  const badge = document.getElementById(side + "BadgeGamjeom");
  const pipsContainer = document.getElementById(side + "GamjeomPips");

  if (countText) countText.textContent = `${count}/${MAX_GAMJEOM}`;
  if (badge) badge.textContent = `${count}/${MAX_GAMJEOM}`;

  if (pipsContainer) {
    const pips = pipsContainer.querySelectorAll(".pip");
    pips.forEach((pip, index) => {
      pip.classList.remove("active", "limit-danger");
      if (index < count) {
        pip.classList.add(count >= MAX_GAMJEOM ? "limit-danger" : "active");
      }
    });
  }
}

function updateRoundTrackers() {
  // Update Blue round dots
  const bDot1 = document.getElementById("bDot1");
  const bDot2 = document.getElementById("bDot2");
  if (bDot1) bDot1.classList.toggle("won", roundWins.blue >= 1);
  if (bDot2) bDot2.classList.toggle("won", roundWins.blue >= 2);

  // Update Red round dots
  const rDot1 = document.getElementById("rDot1");
  const rDot2 = document.getElementById("rDot2");
  if (rDot1) rDot1.classList.toggle("won", roundWins.red >= 1);
  if (rDot2) rDot2.classList.toggle("won", roundWins.red >= 2);

  // Update round badge text
  const roundBadge = document.getElementById("roundBadge");
  const roundSubtext = document.getElementById("roundSubtext");
  if (roundBadge) {
    if (currentRound <= 2) {
      roundBadge.textContent = `RONDE ${currentRound}`;
      if (roundSubtext) roundSubtext.textContent = "Target: 2 Ronde Menang";
    } else {
      roundBadge.textContent = "RONDE 3 (PENENTU)";
      if (roundSubtext) roundSubtext.textContent = "Golden Round • Penentu Juara";
    }
  }
}

function updateMaxScoreDisplay() {
  const badge = document.getElementById("maxScoreBadge");
  if (!badge) return;
  if (maxScore > 0) {
    badge.textContent = `MAX: ${maxScore} POIN`;
  } else {
    badge.textContent = "TANPA BATAS POIN";
  }
}

function checkMaxScoreWin() {
  if (maxScore <= 0 || isRoundConcluding) return false;

  const blueName = document.getElementById("blueName").value.trim() || "CHUNG";
  const redName = document.getElementById("redName").value.trim() || "HUNG";

  if (scores.blue >= maxScore) {
    isRoundConcluding = true;
    stopTimer();
    closeAllScorePopovers();
    playWinFanfare();
    setTimeout(() => {
      awardRoundWinner("blue", `Menyentuh Batas Poin Maksimal (${scores.blue}/${maxScore} Poin)`);
    }, 200);
    return true;
  }

  if (scores.red >= maxScore) {
    isRoundConcluding = true;
    stopTimer();
    closeAllScorePopovers();
    playWinFanfare();
    setTimeout(() => {
      awardRoundWinner("red", `Menyentuh Batas Poin Maksimal (${scores.red}/${maxScore} Poin)`);
    }, 200);
    return true;
  }

  return false;
}

// ==========================================
// Timer Logic
// ==========================================
function stopTimer() {
  if (timerInterval !== null) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  isRunning = false;
  startPauseButton.innerHTML = `<span class="btn-play-icon">▶</span> <span class="btn-text">MULAI</span>`;
  startPauseButton.classList.remove("pause");
  startPauseButton.classList.add("start");
  
  if (remainingTime <= 0) {
    updateStatusIndicator("FINISHED");
  } else {
    updateStatusIndicator("PAUSED");
  }
}

function startTimer() {
  if (isRunning) return;

  if (remainingTime <= 0) {
    alert("Waktu ronde ini sudah habis. Silakan selesaikan ronde atau atur ulang waktu.");
    return;
  }

  isRunning = true;
  startPauseButton.innerHTML = `<span class="btn-play-icon">Ⅱ</span> <span class="btn-text">JEDA</span>`;
  startPauseButton.classList.remove("start");
  startPauseButton.classList.add("pause");
  updateStatusIndicator("LIVE");

  timerInterval = setInterval(() => {
    if (remainingTime > 0) {
      remainingTime--;
      updateTimerDisplay();
    }

    if (remainingTime <= 0) {
      stopTimer();
      remainingTime = 0;
      updateTimerDisplay();
      playBuzzer();
      updateStatusIndicator("FINISHED");
      setTimeout(() => {
        finishRound();
      }, 500);
    }
  }, 1000);
}

function toggleTimer() {
  if (isRunning) {
    stopTimer();
  } else {
    startTimer();
  }
}

function setTimer() {
  const minutesInput = document.getElementById("minutes");
  const secondsInput = document.getElementById("seconds");

  const minutes = Number.parseInt(minutesInput.value, 10);
  const seconds = Number.parseInt(secondsInput.value, 10);

  if (
    minutesInput.value.trim() === "" ||
    secondsInput.value.trim() === "" ||
    !Number.isInteger(minutes) ||
    !Number.isInteger(seconds) ||
    minutes < 0 ||
    minutes > 99 ||
    seconds < 0 ||
    seconds > 59
  ) {
    alert("Masukkan menit 0–99 dan detik 0–59.");
    return;
  }

  stopTimer();

  configuredTime = minutes * 60 + seconds;
  remainingTime = configuredTime;

  const maxScoreInput = document.getElementById("maxScoreInput");
  if (maxScoreInput) {
    const parsedMax = Number.parseInt(maxScoreInput.value, 10);
    maxScore = isNaN(parsedMax) || parsedMax < 0 ? 0 : parsedMax;
    updateMaxScoreDisplay();
  }

  updateTimerDisplay();
  updateStatusIndicator("STANDBY");
}

function restartTimer() {
  stopTimer();
  remainingTime = configuredTime;
  updateTimerDisplay();
  updateStatusIndicator("STANDBY");
}

// ==========================================
// Score & Gamjeom Actions
// ==========================================
function addScore(side, points) {
  scores[side] += points;
  actionHistory[side].push({ type: "score", points: points });

  playScoreSound(points);
  spawnFloatingPoint(side, `+${points}`);
  updateScoreDisplay(side);

  // Check if point touches or exceeds maxScore
  checkMaxScoreWin();
}

function addGamjeom(violatingSide) {
  if (gamjeom[violatingSide] >= MAX_GAMJEOM) {
    alert(`Sudut ${violatingSide.toUpperCase()} sudah mencapai batas maksimal 5 Gam-jeom!`);
    return;
  }

  gamjeom[violatingSide]++;
  const opponentSide = violatingSide === "blue" ? "red" : "blue";

  // Opponent receives 1 point
  scores[opponentSide] += 1;
  actionHistory[violatingSide].push({
    type: "gamjeom",
    opponentSide: opponentSide
  });

  playGamjeomSound();
  spawnFloatingPoint(violatingSide, "GAM-JEOM!", true);
  spawnFloatingPoint(opponentSide, "+1");

  updateGamjeomDisplay(violatingSide);
  updateScoreDisplay(opponentSide);

  // Check 5 Gam-jeom limit (Auto-Disqualification for this round)
  if (gamjeom[violatingSide] >= MAX_GAMJEOM) {
    setTimeout(() => {
      stopTimer();
      alert(`Sudut ${violatingSide.toUpperCase()} telah mencapai 5 Gam-jeom!\n\nRonde ini resmi dimenangkan oleh Sudut ${opponentSide.toUpperCase()} karena batas pelanggaran.`);
      awardRoundWinner(opponentSide, `Kemenangan Gam-jeom (5 Pelanggaran)`);
    }, 400);
  } else {
    // Check if opponent reached max score through Gamjeom point
    checkMaxScoreWin();
  }
}

function undoAction(side) {
  if (actionHistory[side].length === 0) {
    return;
  }

  const lastAction = actionHistory[side].pop();

  if (lastAction.type === "score") {
    scores[side] -= lastAction.points;
    if (scores[side] < 0) scores[side] = 0;
    playUndoSound();
    spawnFloatingPoint(side, `-${lastAction.points}`);
    updateScoreDisplay(side);
  } else if (lastAction.type === "gamjeom") {
    if (gamjeom[side] > 0) gamjeom[side]--;
    const opponentSide = lastAction.opponentSide;
    scores[opponentSide] -= 1;
    if (scores[opponentSide] < 0) scores[opponentSide] = 0;
    
    playUndoSound();
    spawnFloatingPoint(side, "UNDO GJ");
    spawnFloatingPoint(opponentSide, "-1");
    updateGamjeomDisplay(side);
    updateScoreDisplay(opponentSide);
  }
}

// ==========================================
// Editable Scores & Quick Revision Popovers (+1, +2, +3, -1, -2, -3)
// ==========================================
function adjustScore(side, delta) {
  scores[side] += delta;
  if (scores[side] < 0) scores[side] = 0;

  actionHistory[side].push({ type: "score", points: delta });

  if (delta > 0) {
    playScoreSound(Math.abs(delta));
    spawnFloatingPoint(side, `+${delta}`);
  } else {
    playUndoSound();
    spawnFloatingPoint(side, `${delta}`);
  }

  updateScoreDisplay(side);

  if (delta > 0) {
    checkMaxScoreWin();
  }
}

function closeAllScorePopovers() {
  const bluePop = document.getElementById("blueScorePopover");
  const redPop = document.getElementById("redScorePopover");
  if (bluePop) bluePop.style.display = "none";
  if (redPop) redPop.style.display = "none";
}

function setupEditableScores() {
  ["blue", "red"].forEach((side) => {
    const scoreElem = document.getElementById(side + "Score");
    const popover = document.getElementById(side + "ScorePopover");
    if (!scoreElem) return;

    // Click score -> show revision popover (+1, +2, +3, -1, -2, -3)
    scoreElem.addEventListener("click", (e) => {
      e.stopPropagation();
      closeAllScorePopovers();
      if (popover) {
        popover.style.display = "flex";
      }
    });

    // Key handling: allow only digits and Enter to blur
    scoreElem.addEventListener("keydown", (e) => {
      e.stopPropagation(); // prevent controller shortcuts while typing
      
      if (e.key === "Enter") {
        e.preventDefault();
        scoreElem.blur();
      } else if (!/^[0-9]$/.test(e.key) && !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)) {
        e.preventDefault();
      }
    });

    // Blur / Commit manual typed value
    scoreElem.addEventListener("blur", () => {
      const parsed = parseInt(scoreElem.textContent.trim(), 10);
      if (isNaN(parsed) || parsed < 0) {
        scoreElem.textContent = scores[side];
      } else {
        scores[side] = parsed;
        scoreElem.textContent = scores[side];
        actionHistory[side].push({ type: "score", points: 0 });
        checkMaxScoreWin();
      }
    });
  });

  // Revision buttons (+1, +2, +3, -1, -2, -3)
  document.querySelectorAll(".rev-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const side = btn.dataset.side;
      const val = parseInt(btn.dataset.val, 10);
      adjustScore(side, val);
    });
  });

  // Close popover buttons
  document.querySelectorAll(".popover-close-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeAllScorePopovers();
    });
  });

  // Close popover when clicking anywhere outside
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".score-wrapper")) {
      closeAllScorePopovers();
    }
  });
}

// ==========================================
// Best of 3 Round Logic & Winner Modal
// ==========================================
function syncModalData() {
  const blueName = document.getElementById("blueName").value.trim() || "CHUNG";
  const redName = document.getElementById("redName").value.trim() || "HUNG";

  // Populate modal data
  modalBlueName.textContent = blueName;
  modalRedName.textContent = redName;
  modalBlueScore.textContent = scores.blue;
  modalRedScore.textContent = scores.red;
  modalBlueGamjeom.textContent = `Gam-jeom: ${gamjeom.blue}`;
  modalRedGamjeom.textContent = `Gam-jeom: ${gamjeom.red}`;
}

function finishRound() {
  stopTimer();
  syncModalData();

  const blueName = document.getElementById("blueName").value.trim() || "CHUNG";
  const redName = document.getElementById("redName").value.trim() || "HUNG";

  // Evaluate Round Result
  if (scores.blue > scores.red) {
    awardRoundWinner("blue", `${blueName} Menang Skor (${scores.blue} - ${scores.red})`);
  } else if (scores.red > scores.blue) {
    awardRoundWinner("red", `${redName} Menang Skor (${scores.red} - ${scores.blue})`);
  } else {
    // Score is tied
    handleTieRound();
  }
}

function awardRoundWinner(winnerSide, reasonText) {
  roundWins[winnerSide]++;
  updateRoundTrackers();
  syncModalData();

  const blueName = document.getElementById("blueName").value.trim() || "CHUNG";
  const redName = document.getElementById("redName").value.trim() || "HUNG";
  const winnerName = winnerSide === "blue" ? blueName : redName;

  resultTitle.textContent = `RONDE ${currentRound} SELESAI`;
  resultSubtitle.textContent = `${winnerName} Memenangkan Ronde ${currentRound}! (${reasonText})`;
  standingText.textContent = `${blueName} ${roundWins.blue} — ${roundWins.red} ${redName}`;

  tieBreakerPanel.style.display = "none";
  normalModalActions.style.display = "flex";

  // Check Match Outcome (Best of 3)
  if (roundWins[winnerSide] === 2) {
    // Match Winner! (Won 2 consecutive or 2-0 / 2-1)
    playWinFanfare();
    resultIcon.textContent = "🏆";
    resultTitle.textContent = "PERTANDINGAN SELESAI!";
    resultSubtitle.textContent = `JUARA PERTANDINGAN: ${winnerName} (MENANG 2 RONDE)`;
    nextRoundBtn.style.display = "none";
    resetMatchModalBtn.style.display = "block";
  } else if (currentRound === 1) {
    // After Round 1 (1-0), advance to Round 2
    playTone(587.33, "sine", 0.3, 0, 0.25);
    resultIcon.textContent = "🥊";
    nextRoundBtn.innerHTML = `<span>LANJUT KE RONDE 2 ▶</span>`;
    nextRoundBtn.style.display = "block";
    resetMatchModalBtn.style.display = "none";
  } else if (currentRound === 2 && roundWins.blue === 1 && roundWins.red === 1) {
    // Tied 1-1 after Round 2 -> Advance to Round 3!
    playTone(587.33, "sine", 0.3, 0, 0.25);
    resultIcon.textContent = "🔥";
    resultSubtitle.textContent = `KEDUDUKAN SERI 1 - 1! LANJUT KE RONDE 3 (PENENTU)`;
    nextRoundBtn.innerHTML = `<span>LANJUT KE RONDE 3 (PENENTU) ▶</span>`;
    nextRoundBtn.style.display = "block";
    resetMatchModalBtn.style.display = "none";
  } else if (currentRound >= 3) {
    // Final Round 3 Winner
    playWinFanfare();
    resultIcon.textContent = "🏆";
    resultTitle.textContent = "PERTANDINGAN SELESAI!";
    resultSubtitle.textContent = `JUARA PERTANDINGAN: ${winnerName} (MENANG RONDE 3)`;
    nextRoundBtn.style.display = "none";
    resetMatchModalBtn.style.display = "block";
  }

  roundModal.showModal();
}

function handleTieRound() {
  resultIcon.textContent = "⚖️";
  resultTitle.textContent = `RONDE ${currentRound} SKOR SERI (${scores.blue} - ${scores.red})`;
  resultSubtitle.textContent = "Silakan wasit menentukan pemenang ronde berdasarkan keunggulan teknik/poin putar:";
  
  const blueName = document.getElementById("blueName").value.trim() || "CHUNG";
  const redName = document.getElementById("redName").value.trim() || "HUNG";
  standingText.textContent = `${blueName} ${roundWins.blue} — ${roundWins.red} ${redName}`;

  tieBlueWins.textContent = `PILIH ${blueName} MENANG`;
  tieRedWins.textContent = `PILIH ${redName} MENANG`;

  tieBreakerPanel.style.display = "flex";
  normalModalActions.style.display = "none";

  roundModal.showModal();
}

function proceedToNextRound() {
  isRoundConcluding = false;
  closeAllScorePopovers();
  roundModal.close();

  currentRound++;
  
  // Reset round scores & gamjeom for the new round
  scores.blue = 0;
  scores.red = 0;
  gamjeom.blue = 0;
  gamjeom.red = 0;
  actionHistory.blue = [];
  actionHistory.red = [];

  // Reset timer
  remainingTime = configuredTime;

  updateScoreDisplay("blue");
  updateScoreDisplay("red");
  updateGamjeomDisplay("blue");
  updateGamjeomDisplay("red");
  updateTimerDisplay();
  updateRoundTrackers();
  updateStatusIndicator("STANDBY");
}

function resetMatch() {
  const confirmed = confirm(
    "Reset pertandingan? Semua ronde, skor, dan gamjeom akan dimulai kembali dari Ronde 1."
  );

  if (!confirmed) return;

  isRoundConcluding = false;
  closeAllScorePopovers();
  if (roundModal.open) {
    roundModal.close();
  }

  stopTimer();

  currentRound = 1;
  roundWins.blue = 0;
  roundWins.red = 0;

  scores.blue = 0;
  scores.red = 0;
  gamjeom.blue = 0;
  gamjeom.red = 0;

  actionHistory.blue = [];
  actionHistory.red = [];

  remainingTime = configuredTime;

  updateScoreDisplay("blue");
  updateScoreDisplay("red");
  updateGamjeomDisplay("blue");
  updateGamjeomDisplay("red");
  updateRoundTrackers();
  updateTimerDisplay();
  updateStatusIndicator("STANDBY");
}

// ==========================================
// Event Listeners: Click & Touch
// ==========================================
document.querySelectorAll(".score-button").forEach((button) => {
  button.addEventListener("click", () => {
    const side = button.dataset.side;
    if (button.dataset.action === "gamjeom") {
      addGamjeom(side);
    } else {
      const points = Number(button.dataset.points);
      addScore(side, points);
    }
  });
});

document.querySelectorAll(".undo-button").forEach((button) => {
  button.addEventListener("click", () => {
    undoAction(button.dataset.undo);
  });
});

startPauseButton.addEventListener("click", toggleTimer);
if (endRoundBtn) endRoundBtn.addEventListener("click", finishRound);
document.getElementById("setTimer").addEventListener("click", setTimer);
document.getElementById("restartTimer").addEventListener("click", restartTimer);
document.getElementById("resetMatch").addEventListener("click", resetMatch);

// Tie-breaker decisions
if (tieBlueWins) {
  tieBlueWins.addEventListener("click", () => {
    awardRoundWinner("blue", "Keputusan Keunggulan Wasit");
  });
}
if (tieRedWins) {
  tieRedWins.addEventListener("click", () => {
    awardRoundWinner("red", "Keputusan Keunggulan Wasit");
  });
}

if (nextRoundBtn) nextRoundBtn.addEventListener("click", proceedToNextRound);
if (resetMatchModalBtn) resetMatchModalBtn.addEventListener("click", resetMatch);

// ==========================================
// Gamepad Keyboard Shortcuts Mapping
// ==========================================
const KEYBOARD_MAP = {
  // Blue Corner (Left Hand)
  KeyQ: { side: "blue", action: "score", points: 3, selector: '.blue-btn[data-key="Q"]' },
  KeyW: { side: "blue", action: "score", points: 6, selector: '.blue-btn[data-key="W"]' },
  KeyA: { side: "blue", action: "score", points: 2, selector: '.blue-btn[data-key="A"]' },
  KeyS: { side: "blue", action: "score", points: 4, selector: '.blue-btn[data-key="S"]' },
  KeyD: { side: "blue", action: "score", points: 1, selector: '.blue-btn[data-key="D"]' },
  KeyE: { side: "blue", action: "gamjeom", selector: '.blue-gamjeom-btn' },
  KeyZ: { side: "blue", action: "undo", selector: '#blueUndo' },

  // Red Corner (Right Hand)
  KeyU: { side: "red", action: "score", points: 3, selector: '.red-btn[data-key="U"]' },
  KeyI: { side: "red", action: "score", points: 6, selector: '.red-btn[data-key="I"]' },
  KeyJ: { side: "red", action: "score", points: 2, selector: '.red-btn[data-key="J"]' },
  KeyK: { side: "red", action: "score", points: 4, selector: '.red-btn[data-key="K"]' },
  KeyL: { side: "red", action: "score", points: 1, selector: '.red-btn[data-key="L"]' },
  KeyO: { side: "red", action: "gamjeom", selector: '.red-gamjeom-btn' },
  KeyM: { side: "red", action: "undo", selector: '#redUndo' },
};

function triggerButtonPressVisual(selector) {
  const btn = document.querySelector(selector);
  if (btn) {
    btn.classList.add("pressed");
    setTimeout(() => {
      btn.classList.remove("pressed");
    }, 120);
  }
}

window.addEventListener("keydown", (e) => {
  // Ignore shortcuts if actively typing in input, textarea, or contenteditable
  const activeElem = document.activeElement;
  if (
    activeElem &&
    (activeElem.tagName === "INPUT" ||
     activeElem.tagName === "TEXTAREA" ||
     activeElem.isContentEditable)
  ) {
    return;
  }

  // Spacebar: Toggle Timer
  if (e.code === "Space") {
    e.preventDefault();
    toggleTimer();
    startPauseButton.classList.add("pressed");
    setTimeout(() => startPauseButton.classList.remove("pressed"), 120);
    return;
  }

  // Corner Actions
  const mapItem = KEYBOARD_MAP[e.code];
  if (mapItem) {
    e.preventDefault();
    triggerButtonPressVisual(mapItem.selector);

    if (mapItem.action === "undo") {
      undoAction(mapItem.side);
    } else if (mapItem.action === "gamjeom") {
      addGamjeom(mapItem.side);
    } else {
      addScore(mapItem.side, mapItem.points);
    }
  }
});

// ==========================================
// Sound & UI Toggles
// ==========================================
if (soundToggle) {
  soundToggle.addEventListener("click", () => {
    isSoundEnabled = !isSoundEnabled;
    soundIcon.textContent = isSoundEnabled ? "🔊" : "🔇";
    soundToggle.style.opacity = isSoundEnabled ? "1" : "0.5";
  });
}

if (keyHelpToggle && keyModal && closeModal) {
  keyHelpToggle.addEventListener("click", () => {
    keyModal.showModal();
  });
  closeModal.addEventListener("click", () => {
    keyModal.close();
  });
  keyModal.addEventListener("click", (e) => {
    if (e.target === keyModal) {
      keyModal.close();
    }
  });
}

if (fullscreenToggle) {
  fullscreenToggle.addEventListener("click", () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });
}

// Live listener for max score input
const maxScoreInput = document.getElementById("maxScoreInput");
if (maxScoreInput) {
  maxScoreInput.addEventListener("input", () => {
    const parsedMax = Number.parseInt(maxScoreInput.value, 10);
    maxScore = isNaN(parsedMax) || parsedMax < 0 ? 0 : parsedMax;
    updateMaxScoreDisplay();
  });
}

// Initialise state
setupEditableScores();
updateScoreDisplay("blue");
updateScoreDisplay("red");
updateGamjeomDisplay("blue");
updateGamjeomDisplay("red");
updateRoundTrackers();
updateMaxScoreDisplay();
updateTimerDisplay();
updateStatusIndicator("STANDBY");
