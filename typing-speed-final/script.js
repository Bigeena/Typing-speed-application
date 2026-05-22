// ── Passage Data ─────────────────────────────────────────────────────────────
const passages = {
  easy: [
    "The sun rose over the quiet town. Birds sang in the trees as people woke up and started their day. It was going to be a warm and sunny morning.",
    "She walked to the store to buy some bread and milk. The shop was busy but she found what she needed quickly. On her way home, she saw a friend and waved.",
    "The dog ran across the park chasing a ball. He was fast and loved to play. After a while, he got tired and lay down in the cool shade of a big oak tree.",
    "I like to read books before I go to sleep. It helps me relax after a long day. My favorite stories are about adventure and travel to far away places.",
  ],
  medium: [
    "Learning a new skill takes patience and consistent practice. Whether you're studying a language, picking up an instrument, or mastering a sport, the key is to show up every day. Small improvements compound over time, and before you know it, you'll have made remarkable progress.",
    "The old lighthouse had stood on the cliff for over a century, guiding sailors safely through treacherous waters. Its beam cut through the fog each night, a reassuring presence for those navigating the rocky coastline. Many storms had tested its structure, but it remained steadfast.",
    "Coffee culture has evolved dramatically in recent decades. What was once a simple morning ritual has become an art form, with baristas crafting intricate latte designs and roasters sourcing beans from remote mountain villages. The humble cup of coffee now tells a global story.",
    "Urban gardens are transforming city landscapes around the world. Residents are converting rooftops, balconies, and abandoned lots into thriving green spaces. These initiatives not only provide fresh produce but also create communities, reduce stress, and help combat the urban heat island effect.",
  ],
  hard: [
    "The philosopher's argument hinged on a seemingly paradoxical assertion: that absolute freedom, pursued without constraint, inevitably undermines itself. \"Consider,\" she wrote, \"how the libertarian ideal—when taken to its logical extreme—produces conditions in which the powerful dominate the weak, thereby eliminating freedom for the majority.\" Her critics dismissed this as sophistry; her supporters hailed it as profound.",
    "Quantum entanglement—Einstein's \"spooky action at a distance\"—continues to perplex physicists and philosophers alike. When two particles become entangled, measuring one instantaneously affects the other, regardless of the distance separating them. This phenomenon doesn't violate relativity (no information travels faster than light), yet it challenges our intuitions about locality, causality, and the nature of reality itself.",
    "The Renaissance polymath's correspondence reveals a mind of extraordinary breadth: in a single week's letters, he discussed astronomical observations, critiqued a colleague's architectural drawings, proposed improvements to the city's sewage system, and composed a sonnet for a patron's daughter. \"Specialization,\" he remarked wryly, \"is for insects.\" His contemporaries found him exhausting; posterity finds him inspirational.",
    "Algorithmic trading has fundamentally restructured financial markets. High-frequency systems execute thousands of transactions per second, exploiting minute price discrepancies across exchanges. Critics argue this creates systemic fragility—the 2010 \"Flash Crash\" saw the Dow Jones plummet 1,000 points in minutes before recovering. Proponents counter that algorithms provide liquidity and reduce spreads, ultimately benefiting retail investors.",
  ]
};

// ── State ─────────────────────────────────────────────────────────────────────
let difficulty   = 'hard';
let mode         = 'timed';
let currentText  = '';
let charIndex    = 0;
let correctChars = 0;
let wrongChars   = 0;
let startTime    = null;
let timerInterval = null;
let timeLeft     = 60;
let testStarted  = false;
let personalBest = parseInt(localStorage.getItem('typing-pb') || '0');

// ── DOM References ────────────────────────────────────────────────────────────
const passageEl    = document.getElementById('passage-text');
const starterEl    = document.getElementById('starter');
const btnStart     = document.getElementById('btn-start');
const restartBar   = document.getElementById('restart-bar');
const btnRestart   = document.getElementById('btn-restart');
const typebox      = document.getElementById('typebox');
const hiddenInput  = document.getElementById('hidden-input');
const typingArea   = document.getElementById('typing-area');
const resultsScreen = document.getElementById('results-screen');
const btnAgain     = document.getElementById('btn-again');
const wpmDisplay   = document.getElementById('wpm-display');
const accDisplay   = document.getElementById('acc-display');
const timeEl       = document.getElementById('time-display');
const pbDisplay    = document.getElementById('pb-display');

// ── Initialise ────────────────────────────────────────────────────────────────
updatePBDisplay();
loadPassage();

// ── Difficulty tags (desktop) ─────────────────────────────────────────────────
document.querySelectorAll('[data-diff]').forEach(btn => {
  btn.addEventListener('click', () => {
    if (testStarted) return;
    difficulty = btn.dataset.diff;
    document.querySelectorAll('[data-diff]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    loadPassage();
  });
});

// ── Mode tags (desktop) ───────────────────────────────────────────────────────
document.querySelectorAll('[data-mode]').forEach(btn => {
  btn.addEventListener('click', () => {
    if (testStarted) return;
    mode = btn.dataset.mode;
    document.querySelectorAll('[data-mode]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    loadPassage();
  });
});

// ── Mobile selects ────────────────────────────────────────────────────────────
document.getElementById('mobile-diff').addEventListener('change', e => {
  if (testStarted) return;
  difficulty = e.target.value;
  loadPassage();
});

document.getElementById('mobile-mode').addEventListener('change', e => {
  if (testStarted) return;
  mode = e.target.value;
  loadPassage();
});

// ── Load a random passage ─────────────────────────────────────────────────────
function loadPassage() {
  const pool = passages[difficulty];
  currentText = pool[Math.floor(Math.random() * pool.length)];
  renderChars();
  resetState();
}

// ── Render passage as individual <span> characters ────────────────────────────
function renderChars() {
  passageEl.innerHTML = '';
  [...currentText].forEach((ch, i) => {
    const span = document.createElement('span');
    span.classList.add('char');
    span.textContent = ch;
    if (i === 0) span.classList.add('current');
    passageEl.appendChild(span);
  });
}

// ── Reset all state ───────────────────────────────────────────────────────────
function resetState() {
  charIndex    = 0;
  correctChars = 0;
  wrongChars   = 0;
  startTime    = null;
  testStarted  = false;
  timeLeft     = 60;

  clearInterval(timerInterval);

  passageEl.classList.add('blurred');
  starterEl.classList.remove('hidden');
  restartBar.classList.remove('visible');
  timeEl.classList.remove('warning');
  hiddenInput.value = '';

  updateStatsDisplay(0, 100, 60);
}

// ── Start the test ────────────────────────────────────────────────────────────
function startTest() {
  if (testStarted) return;
  testStarted = true;

  passageEl.classList.remove('blurred');
  starterEl.classList.add('hidden');
  restartBar.classList.add('visible');
  hiddenInput.focus();
  startTime = Date.now();

  if (mode === 'timed') {
    timerInterval = setInterval(() => {
      timeLeft--;
      updateTimeDisplay(timeLeft);

      if (timeLeft <= 10) timeEl.classList.add('warning');

      updateLiveWPM();

      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        endTest();
      }
    }, 1000);
  }
}

// ── Event: click typebox or Start button ──────────────────────────────────────
typebox.addEventListener('click', () => {
  if (!testStarted) startTest();
  hiddenInput.focus();
});

btnStart.addEventListener('click', () => {
  startTest();
  hiddenInput.focus();
});

btnRestart.addEventListener('click', restartTest);
btnAgain.addEventListener('click', restartTest);

// ── Keyboard input ────────────────────────────────────────────────────────────
hiddenInput.addEventListener('keydown', e => {
  if (!testStarted) return;
  if (e.key === 'Backspace') {
    e.preventDefault();
    handleBackspace();
  }
});

hiddenInput.addEventListener('input', () => {
  if (!testStarted) return;

  const val = hiddenInput.value;
  if (!val) return;

  const typed = val[val.length - 1];
  hiddenInput.value = ''; // clear so we always get a fresh character

  if (charIndex >= currentText.length) return;

  const chars = passageEl.querySelectorAll('.char');

  // Remove cursor from current position
  chars[charIndex].classList.remove('current');

  // Mark correct or incorrect
  if (typed === currentText[charIndex]) {
    chars[charIndex].classList.add('correct');
    correctChars++;
  } else {
    chars[charIndex].classList.add('incorrect');
    wrongChars++;
  }

  charIndex++;

  // Move cursor forward
  if (charIndex < currentText.length) {
    chars[charIndex].classList.add('current');
  }

  updateLiveWPM();
  updateAccDisplay();

  // Passage mode: finish when all characters are typed
  if (mode === 'passage' && charIndex >= currentText.length) {
    clearInterval(timerInterval);
    endTest();
  }
});

// ── Backspace: undo last character ───────────────────────────────────────────
function handleBackspace() {
  if (charIndex === 0) return;

  const chars = passageEl.querySelectorAll('.char');
  chars[charIndex]?.classList.remove('current');
  charIndex--;

  const prev = chars[charIndex];
  if (prev.classList.contains('incorrect')) wrongChars--;
  else if (prev.classList.contains('correct')) correctChars--;

  prev.classList.remove('correct', 'incorrect');
  prev.classList.add('current');

  updateAccDisplay();
}

// ── Live WPM update ───────────────────────────────────────────────────────────
function updateLiveWPM() {
  if (!startTime) return;
  const elapsedMin = (Date.now() - startTime) / 60000;
  const wpm = elapsedMin > 0 ? Math.round((correctChars / 5) / elapsedMin) : 0;
  wpmDisplay.textContent = wpm;

  if (mode === 'passage') {
    updateTimeDisplay(Math.round((Date.now() - startTime) / 1000));
  }
}

// ── Accuracy display update ───────────────────────────────────────────────────
function updateAccDisplay() {
  const total = correctChars + wrongChars;
  const acc = total === 0 ? 100 : Math.round((correctChars / total) * 100);
  accDisplay.textContent = acc + '%';
  accDisplay.classList.toggle('low', acc < 90);
}

// ── Time display helper ───────────────────────────────────────────────────────
function updateTimeDisplay(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  timeEl.textContent = `${m}:${s.toString().padStart(2, '0')}`;
}

// ── Full stats reset display ──────────────────────────────────────────────────
function updateStatsDisplay(wpm, acc, time) {
  wpmDisplay.textContent = wpm;
  accDisplay.textContent = acc + '%';
  accDisplay.classList.remove('low');
  updateTimeDisplay(time);
}

// ── End test: calculate final results ────────────────────────────────────────
function endTest() {
  testStarted = false;

  const elapsedMin = (Date.now() - startTime) / 60000;
  const finalWPM   = elapsedMin > 0 ? Math.round((correctChars / 5) / elapsedMin) : 0;
  const total      = correctChars + wrongChars;
  const finalAcc   = total === 0 ? 100 : Math.round((correctChars / total) * 100);

  const isFirstTest = personalBest === 0;
  const isNewPB     = finalWPM > personalBest;

  if (isNewPB) {
    personalBest = finalWPM;
    localStorage.setItem('typing-pb', personalBest);
    updatePBDisplay();
  }

  showResults(finalWPM, finalAcc, correctChars, wrongChars, isFirstTest, isNewPB);
}

// ── Show the results screen ───────────────────────────────────────────────────
function showResults(wpm, acc, correct, wrong, isFirst, isNewPB) {
  typingArea.style.display = 'none';
  resultsScreen.classList.add('visible');

  document.getElementById('res-wpm').textContent     = wpm;
  document.getElementById('res-acc').textContent     = acc + '%';
  document.getElementById('res-acc').className       = 'card-value ' + (acc >= 90 ? 'green' : 'red');
  document.getElementById('res-correct').textContent = correct;
  document.getElementById('res-wrong').textContent   = wrong;

  const icon     = document.getElementById('result-icon');
  const title    = document.getElementById('result-title');
  const subtitle = document.getElementById('result-subtitle');
  const btnEl    = document.getElementById('btn-again');

  if (isFirst) {
    icon.className    = 'result-icon success';
    icon.textContent  = '✓';
    title.textContent = 'Baseline Established!';
    subtitle.textContent = "You've set the bar. Now the real challenge begins—time to beat it.";
    btnEl.textContent = 'Beat This Score ↺';
  } else if (isNewPB) {
    icon.className    = 'result-icon celebration';
    icon.textContent  = '🎉';
    title.textContent = 'High Score Smashed!';
    subtitle.textContent = "You're getting faster. That was incredible typing.";
    btnEl.textContent = 'Beat This Score ↺';
    launchConfetti();
  } else {
    icon.className    = 'result-icon success';
    icon.textContent  = '✓';
    title.textContent = 'Test Complete!';
    subtitle.textContent = 'Solid run. Keep pushing to beat your high score.';
    btnEl.textContent = 'Go Again ↺';
  }
}

// ── Restart: go back to typing area ──────────────────────────────────────────
function restartTest() {
  document.getElementById('confetti-container').innerHTML = '';
  typingArea.style.display = '';
  resultsScreen.classList.remove('visible');
  loadPassage();
}

// ── Personal best display ─────────────────────────────────────────────────────
function updatePBDisplay() {
  pbDisplay.textContent = personalBest > 0 ? `${personalBest} WPM` : '— WPM';
}

// ── Confetti animation ────────────────────────────────────────────────────────
function launchConfetti() {
  const container = document.getElementById('confetti-container');
  const colors = ['#ff5555', '#55ff55', '#5555ff', '#ffff55', '#ff55ff', '#55ffff'];

  for (let i = 0; i < 120; i++) {
    const piece = document.createElement('div');
    piece.classList.add('confetti-piece');

    const duration = Math.random() * 2 + 2;
    const delay    = Math.random() * 1.5;

    piece.style.left             = Math.random() * 100 + 'vw';
    piece.style.background       = colors[Math.floor(Math.random() * colors.length)];
    piece.style.width            = (Math.random() * 8 + 6) + 'px';
    piece.style.height           = (Math.random() * 10 + 8) + 'px';
    piece.style.borderRadius     = Math.random() > 0.5 ? '2px' : '50%';
    piece.style.animationDuration = duration + 's';
    piece.style.animationDelay   = delay + 's';

    container.appendChild(piece);
    setTimeout(() => piece.remove(), (duration + delay) * 1000 + 500);
  }
}
