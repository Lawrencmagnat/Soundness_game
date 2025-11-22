// ===== DOM ELEMENTS =====
const board = document.getElementById('gameBoard');
const player = document.getElementById('player');
const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const livesEl = document.getElementById('lives');
const movesEl = document.getElementById('moves');
const levelEl = document.getElementById('level');
const comboEl = document.getElementById('combo');
const highScoreEl = document.getElementById('highScore');
const powerupsEl = document.getElementById('activePowerups');
const gameOverEl = document.getElementById('gameOver');
const introEl = document.getElementById('introScreen');
const sidebarHistory = document.getElementById('sidebarHistory');

// ===== GAME STATE =====
let playerX = 327.5, playerY = 227.5;
let score = 0, displayScore = 0, timeLeft = 180, lives = 5, moves = 0, collected = 0;
let level = 1, combo = 0, bestCombo = 0;
let gameActive = false, paused = false;
let proofs = [], powerups = [], moveHistory = [], achievements = [];
let keys = {}, activePowerups = {}, powerupTimers = {};
let gameInterval, spawnInterval, powerupInterval, timerInterval, magnetInterval;
let gameMode = 'quick', muted = false;
let highScore = 0, scoreHistory = [], comboMultiplier = 1;

// Mobile touch control state
let touchControlSetup = false;
let isMobile = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Get actual board dimensions
let boardWidth = 700, boardHeight = 500;
const playerSize = 45, moveSpeed = 5;

// Update board dimensions based on actual size
function updateBoardDimensions() {
    const boardRect = board.getBoundingClientRect();
    boardWidth = boardRect.width;
    boardHeight = boardRect.height;
    console.log('Board dimensions:', boardWidth, 'x', boardHeight);
}

// Use transforms for better performance
player.style.transform = `translate(${playerX}px, ${playerY}px)`;

const audioContext = new (window.AudioContext || window.webkitAudioContext)();

console.log('🎮 Game initialized - Mobile:', isMobile);

// ===== SIDEBAR MENU HANDLERS =====
function setupSidebar() {
    const ham = document.getElementById('hamburger');
    const sidebar = document.getElementById('scoreSidebar');
    const closeBtn = document.getElementById('closeSidebar');
    
    if (!ham || !sidebar || !closeBtn) return;
    
    ham.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        sidebar.classList.add('active');
    });
    
    closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        sidebar.classList.remove('active');
    });
    
    document.addEventListener('click', (e) => {
        if (sidebar.classList.contains('active') && 
            !sidebar.contains(e.target) && 
            e.target !== ham) {
            sidebar.classList.remove('active');
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupSidebar);
} else {
    setupSidebar();
}

// ===== STORAGE FUNCTIONS =====
async function loadData() {
    try {
        const hs = await window.storage.get('proof-collector-highscore');
        if (hs && hs.value) {
            highScore = parseInt(hs.value);
            highScoreEl.textContent = highScore;
        }
    } catch (e) {
        console.log('No high score saved yet');
    }
    
    try {
        const hist = await window.storage.get('proof-collector-history');
        if (hist && hist.value) {
            scoreHistory = JSON.parse(hist.value);
            updateSidebar();
        }
    } catch (e) {
        console.log('No score history saved yet');
    }
}

async function saveData() {
    const isNew = score > highScore && score > 0;
    
    if (isNew) {
        highScore = score;
        highScoreEl.textContent = highScore;
        try {
            await window.storage.set('proof-collector-highscore', score.toString());
        } catch (e) {
            console.error('Could not save high score:', e);
        }
    }
    
    if (score > 0) {
        const gameData = {
            score,
            level,
            date: new Date().toLocaleString(),
            rank: getRank(score)
        };
        
        scoreHistory.unshift(gameData);
        if (scoreHistory.length > 5) scoreHistory = scoreHistory.slice(0, 5);
        
        try {
            await window.storage.set('proof-collector-history', JSON.stringify(scoreHistory));
        } catch (e) {
            console.error('Could not save history:', e);
        }
        
        updateSidebar();
    }
    
    return isNew;
}

function updateSidebar() {
    if (!sidebarHistory) return;
    
    sidebarHistory.innerHTML = '';
    
    if (scoreHistory.length === 0) {
        sidebarHistory.innerHTML = '<p style="color:#888;text-align:center;font-size:0.85em;">No games yet!</p>';
        return;
    }
    
    scoreHistory.forEach((game, i) => {
        const div = document.createElement('div');
        div.className = 'sidebar-score' + (i === 0 ? ' top' : '');
        div.innerHTML = `
            <div class="rank">${game.rank}</div>
            <div class="points">${game.score} pts</div>
            <div class="details">Level ${game.level} • ${game.date}</div>
        `;
        sidebarHistory.appendChild(div);
    });
}

// ===== INPUT HANDLERS =====
document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    if (['arrowup','arrowdown','arrowleft','arrowright'].includes(e.key.toLowerCase())) {
        e.preventDefault();
    }
    if (e.key.toLowerCase() === 'p' && gameActive) togglePause();
});

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// ===== AUDIO FUNCTIONS =====
function playSound(type) {
    if (muted || !audioContext) return;
    
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.connect(gain);
    gain.connect(audioContext.destination);
    const now = audioContext.currentTime;
    
    switch(type) {
        case 'collect':
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
            break;
        case 'hit':
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.exponentialRampToValueAtTime(50, now + 0.2);
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
            break;
        case 'powerup':
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(1000, now + 0.15);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            osc.start(now);
            osc.stop(now + 0.15);
            break;
        case 'levelup':
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.exponentialRampToValueAtTime(800, now + 0.3);
            osc.type = 'square';
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
            break;
        case 'combo':
            const freq = 400 + (combo * 50);
            osc.frequency.setValueAtTime(freq, now);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.12);
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
            osc.start(now);
            osc.stop(now + 0.12);
            break;
    }
}

function toggleMute() {
    muted = !muted;
    document.getElementById('muteBtn').textContent = muted ? '🔇 OFF' : '🔊 ON';
}

function togglePause() {
    if (!gameActive) return;
    paused = !paused;
    document.getElementById('pauseBtn').textContent = paused ? '▶️ Resume' : '⏸️ Pause';
}

// ===== SMOOTH SCORE ANIMATION =====
function animateScore() {
    if (displayScore < score) {
        displayScore = Math.min(displayScore + Math.ceil((score - displayScore) / 10), score);
        scoreEl.textContent = displayScore;
        scoreEl.parentElement.classList.add('highlight');
    } else {
        scoreEl.parentElement.classList.remove('highlight');
    }
}

// ===== GAME FUNCTIONS =====
function startGame(mode) {
    console.log('🎮 Starting game mode:', mode);
    
    // Update board dimensions
    updateBoardDimensions();
    
    if (isMobile && !touchControlSetup) {
        setupSwipeControls();
        touchControlSetup = true;
    }
    
    // Reset game state
    gameMode = mode;
    gameActive = true;
    paused = false;
    score = 0;
    displayScore = 0;
    moves = 0;
    collected = 0;
    level = 1;
    combo = 0;
    bestCombo = 0;
    lives = 5;
    proofs = [];
    powerups = [];
    moveHistory = [];
    achievements = [];
    activePowerups = {};
    powerupTimers = {};
    comboMultiplier = 1;
    
    timeLeft = mode === 'quick' ? 180 : (mode === 'challenge' ? 300 : 999999);
    
    updateDisplay();
    updatePowerupDisplay();
    
    document.querySelectorAll('.proof, .powerup, .notification').forEach(p => p.remove());
    
    // Hide intro screen
    if (introEl) {
        introEl.style.display = 'none';
    }
    
    // Enable game controls
    document.getElementById('pauseBtn').disabled = false;
    document.getElementById('exitBtn').disabled = false;
    
    // Reset board and player position
    board.className = '';
    playerX = (boardWidth - playerSize) / 2;
    playerY = (boardHeight - playerSize) / 2;
    player.style.transform = `translate(${playerX}px, ${playerY}px)`;
    player.classList.remove('invincible', 'combo-glow');
    
    // Spawn initial proofs
    spawnProof();
    spawnProof();
    spawnProof();
    
    // Start game loop
    gameInterval = setInterval(() => {
        if (!paused) {
            movePlayer();
            checkLevelUp();
            animateScore();
        }
    }, 1000/60);
    
    // Start timer
    timerInterval = setInterval(() => {
        if (!paused && gameMode !== 'endless') {
            timeLeft--;
            updateDisplay();
            if (timeLeft <= 0) endGame();
        }
    }, 1000);
    
    // Start spawning proofs
    spawnInterval = setInterval(() => {
        if (!paused) {
            spawnProof();
            if (level > 2 && Math.random() > 0.6) spawnProof();
            if (level > 5 && Math.random() > 0.7) spawnProof();
        }
    }, Math.max(800, 1200 - (level * 50)));
    
    // Start spawning powerups
    powerupInterval = setInterval(() => {
        if (!paused) spawnPowerup();
    }, 7000);
    
    showNotification('🚀 Game Started!');
    playSound('levelup');
}

function updateDisplay() {
    livesEl.textContent = lives;
    movesEl.textContent = moves;
    levelEl.textContent = level;
    comboEl.textContent = combo;
    
    livesEl.parentElement.className = 'stat lives' + (lives <= 2 ? ' danger' : '');
    
    // Add glow effect on high combos
    if (combo >= 10) {
        comboEl.parentElement.classList.add('glow');
        player.classList.add('combo-glow');
    } else {
        comboEl.parentElement.classList.remove('glow');
        player.classList.remove('combo-glow');
    }
    
    if (gameMode !== 'endless') {
        const min = Math.floor(timeLeft / 60);
        const sec = timeLeft % 60;
        timerEl.textContent = `${min}:${sec.toString().padStart(2, '0')}`;
    } else {
        timerEl.textContent = '∞';
    }
}

function updatePowerupDisplay() {
    powerupsEl.innerHTML = '';
    
    Object.keys(activePowerups).forEach(type => {
        if (activePowerups[type]) {
            const indicator = document.createElement('div');
            indicator.className = 'powerup-indicator';
            
            const icons = {
                shield: '🛡️ Shield',
                freeze: '❄️ Freeze',
                multiplier: '⭐ 2x Points',
                'combo-boost': '🔷 Soundness 2x',
                'magnet': '🧲 Magnet'
            };
            
            indicator.textContent = icons[type] || type;
            
            // Add progress bar
            if (powerupTimers[type]) {
                const progress = document.createElement('div');
                progress.className = 'powerup-progress';
                const timeRemaining = powerupTimers[type] - Date.now();
                const duration = type === 'shield' ? 12000 : (type === 'freeze' ? 6000 : (type === 'combo-boost' ? 15000 : (type === 'magnet' ? 10000 : 12000)));
                const percent = (timeRemaining / duration) * 100;
                progress.style.width = percent + '%';
                indicator.appendChild(progress);
            }
            
            powerupsEl.appendChild(indicator);
        }
    });
}

function movePlayer() {
    if (!gameActive || paused) return;

    let moved = false;
    
    // Keyboard controls
    if (keys['arrowleft'] || keys['a']) {
        playerX = Math.max(0, playerX - moveSpeed);
        moved = true;
    }
    if (keys['arrowright'] || keys['d']) {
        playerX = Math.min(boardWidth - playerSize, playerX + moveSpeed);
        moved = true;
    }
    if (keys['arrowup'] || keys['w']) {
        playerY = Math.max(0, playerY - moveSpeed);
        moved = true;
    }
    if (keys['arrowdown'] || keys['s']) {
        playerY = Math.min(boardHeight - playerSize, playerY + moveSpeed);
        moved = true;
    }

    // Use transforms for smoother performance
    player.style.transform = `translate(${playerX}px, ${playerY}px)`;
    
    if (moved && Math.random() > 0.85) {
        createTrail();
    }

    checkCollisions();
}

function createTrail() {
    const trail = document.createElement('div');
    trail.className = 'trail';
    trail.style.left = (playerX + playerSize/3) + 'px';
    trail.style.top = (playerY + playerSize/3) + 'px';
    board.appendChild(trail);
    setTimeout(() => trail.remove(), 400);
}

function spawnProof() {
    if (!gameActive || paused) return;

    const isValid = Math.random() > Math.min(0.25 + (level * 0.06), 0.65);
    const proof = document.createElement('div');
    proof.className = 'proof ' + (isValid ? 'valid-proof' : 'fake-proof');
    proof.textContent = isValid ? '✓' : '✗';
    proof.dataset.valid = isValid;
    
    // Use smaller size on mobile and add safety margin
    const proofSize = isMobile ? 24 : 28;
    const safetyMargin = 10;
    
    // Ensure proof spawns well within boundaries
    const maxX = boardWidth - proofSize - safetyMargin;
    const maxY = boardHeight - proofSize - safetyMargin;
    const minPos = safetyMargin;
    
    const x = Math.max(minPos, Math.min(maxX, Math.random() * maxX));
    const y = Math.max(minPos, Math.min(maxY, Math.random() * maxY));
    
    proof.style.left = x + 'px';
    proof.style.top = y + 'px';
    
    board.appendChild(proof);
    proofs.push({ element: proof, x, y, valid: isValid });
    
    setTimeout(() => {
        if (proof.parentNode) {
            proof.style.opacity = '0.3';
        }
    }, 12000);
    
    setTimeout(() => {
        if (proof.parentNode) {
            proof.remove();
            const index = proofs.findIndex(p => p.element === proof);
            if (index > -1) proofs.splice(index, 1);
        }
    }, 15000);
}

// ===== MAGNET EFFECT - ATTRACT AND AUTO-COLLECT =====
function updateMagnetEffect() {
    if (!activePowerups.magnet) return;
    
    proofs.forEach((proof, index) => {
        if (!proof.valid || !proof.element.parentNode) return;
        
        const proofSize = isMobile ? 28 : 32;
        const dx = (playerX + playerSize/2) - (proof.x + proofSize/2);
        const dy = (playerY + playerSize/2) - (proof.y + proofSize/2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Attract if within range
        if (distance < 200) {
            proof.x += dx * 0.05;
            proof.y += dy * 0.05;
            proof.element.style.left = proof.x + 'px';
            proof.element.style.top = proof.y + 'px';
        }
        
        // Auto-collect when close enough
        if (distance < 60) {
            collectProof(proof, index, true);
        }
    });
}

function collectProof(proof, index, isMagnet = false) {
    moves++;
    movesEl.textContent = moves;
    movesEl.parentElement.classList.add('highlight');
    setTimeout(() => movesEl.parentElement.classList.remove('highlight'), 500);
    
    moveHistory.push({
        type: 'valid',
        moveNumber: moves
    });
    
    proof.element.classList.add('collected');
    
    combo++;
    const basePoints = 10;
    const comboBonus = combo >= 5 ? Math.floor(combo / 5) * 5 : 0;
    const magnetBonus = isMagnet ? 5 : 0; // Bonus for magnet collection
    const multiplier = (activePowerups.multiplier ? 2 : 1) * comboMultiplier;
    const points = (basePoints + comboBonus + magnetBonus) * multiplier;
    
    score += points;
    collected++;
    
    createParticles(proof.x, proof.y, '#4CAF50', isMobile ? 8 : 15);
    showFeedback(`+${points}`, proof.x, proof.y, isMagnet ? '#ed64a6' : '#4CAF50');
    playSound('combo');
    
    if (combo > bestCombo) bestCombo = combo;
    
    // Combo milestones
    if (combo === 5) {
        showNotification('🔥 5x COMBO!');
        achievements.push('🔥 5x Combo Achiever');
    } else if (combo === 10) {
        showNotification('🔥🔥 10x COMBO!');
        createConfetti();
        board.classList.add('shake');
        setTimeout(() => board.classList.remove('shake'), 300);
        achievements.push('🔥🔥 10x Combo Master');
    } else if (combo === 15) {
        showNotification('🔥🔥🔥 MEGA COMBO!');
        createConfetti();
        board.classList.add('shake');
        setTimeout(() => board.classList.remove('shake'), 300);
        achievements.push('🔥🔥🔥 Mega Combo Legend');
    } else if (combo >= 20) {
        showNotification('🔥🔥🔥🔥 LEGENDARY!');
        createConfetti();
        achievements.push('👑 Legendary Combo God');
    }
    
    updateDisplay();
    
    setTimeout(() => {
        proof.element.remove();
    }, 350);
    
    proofs.splice(index, 1);
}

function spawnPowerup() {
    if (!gameActive || paused || powerups.length > 2) return;

    const types = ['shield', 'freeze', 'multiplier', 'extralife', 'combo-boost', 'magnet'];
    const type = types[Math.floor(Math.random() * types.length)];
    const powerup = document.createElement('div');
    powerup.className = `powerup ${type}`;
    powerup.dataset.type = type;
    
    const icons = {
        shield: '🛡️',
        freeze: '❄️',
        multiplier: '⭐',
        extralife: '💛',
        'combo-boost': '🔷',
        'magnet': '🧲'
    };
    powerup.textContent = icons[type];
    
    const powerupSize = ['combo-boost', 'magnet'].includes(type) ? (isMobile ? 38 : 45) : (isMobile ? 35 : 40);
    const x = Math.random() * (boardWidth - powerupSize - 10) + 5;
    const y = Math.random() * (boardHeight - powerupSize - 10) + 5;
    powerup.style.left = x + 'px';
    powerup.style.top = y + 'px';
    
    board.appendChild(powerup);
    powerups.push({ element: powerup, x, y, type });
    
    setTimeout(() => {
        if (powerup.parentNode) {
            powerup.remove();
            const index = powerups.findIndex(p => p.element === powerup);
            if (index > -1) powerups.splice(index, 1);
        }
    }, 10000);
}

function checkCollisions() {
    const proofSize = isMobile ? 28 : 32;
    
    proofs.forEach((proof, index) => {
        const dx = playerX + playerSize/2 - (proof.x + proofSize/2);
        const dy = playerY + playerSize/2 - (proof.y + proofSize/2);
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < (playerSize/2 + proofSize/2)) {
            if (proof.valid) {
                collectProof(proof, index, false);
            } else {
                // Fake proof handling
                moves++;
                movesEl.textContent = moves;
                movesEl.parentElement.classList.add('highlight');
                setTimeout(() => movesEl.parentElement.classList.remove('highlight'), 500);
                
                moveHistory.push({
                    type: 'fake',
                    moveNumber: moves
                });
                
                proof.element.classList.add('collected');
                
                combo = 0;
                player.classList.remove('combo-glow');
                score = Math.max(0, score - 5);
                
                if (activePowerups.shield) {
                    showNotification('🛡️ Shield Saved You!');
                    activatePowerup('shield', true);
                    playSound('powerup');
                } else {
                    lives--;
                    livesEl.textContent = lives;
                    livesEl.parentElement.classList.add('highlight');
                    setTimeout(() => livesEl.parentElement.classList.remove('highlight'), 500);
                    
                    board.classList.add('shake');
                    setTimeout(() => board.classList.remove('shake'), 300);
                    
                    showFeedback('-5 💔', proof.x, proof.y, '#ff6b6b');
                    playSound('hit');
                    
                    if (lives <= 0) {
                        endGame();
                    }
                }
                createParticles(proof.x, proof.y, '#ff6b6b', isMobile ? 8 : 15);
                
                updateDisplay();
                
                setTimeout(() => {
                    proof.element.remove();
                }, 350);
                
                proofs.splice(index, 1);
            }
        }
    });
    
    // Check magnet effect
    if (activePowerups.magnet) {
        updateMagnetEffect();
    }
    
    powerups.forEach((powerup, index) => {
        const powerupSize = ['combo-boost', 'magnet'].includes(powerup.type) ? (isMobile ? 38 : 45) : (isMobile ? 35 : 40);
        const dx = playerX + playerSize/2 - (powerup.x + powerupSize/2);
        const dy = playerY + playerSize/2 - (powerup.y + powerupSize/2);
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < (playerSize/2 + powerupSize/2)) {
            powerup.element.classList.add('collected');
            activatePowerup(powerup.type);
            createParticles(powerup.x, powerup.y, '#FFD700', isMobile ? 8 : 15);
            playSound('powerup');
            
            // Vibrate on mobile
            if (isMobile && navigator.vibrate) {
                navigator.vibrate(50);
            }
            
            setTimeout(() => {
                powerup.element.remove();
            }, 350);
            
            powerups.splice(index, 1);
        }
    });
}

function activatePowerup(type, deactivate = false) {
    if (deactivate) {
        activePowerups[type] = false;
        delete powerupTimers[type];
        player.classList.remove('invincible');
        
        if (type === 'magnet' && magnetInterval) {
            clearInterval(magnetInterval);
        }
        
        updatePowerupDisplay();
        return;
    }
    
    const durations = {
        shield: 12000,
        freeze: 6000,
        multiplier: 12000,
        'combo-boost': 15000,
        'magnet': 10000
    };
    
    const names = {
        shield: '🛡️ SHIELD ACTIVE',
        freeze: '❄️ TIME FREEZE',
        multiplier: '⭐ 2x POINTS',
        extralife: '💛 EXTRA LIFE',
        'combo-boost': '🔷 SOUNDNESS BOOST 2x',
        'magnet': '🧲 MAGNET ACTIVE'
    };
    
    showNotification(names[type] || type.toUpperCase());
    
    if (type === 'shield') {
        activePowerups.shield = true;
        player.classList.add('invincible');
        powerupTimers.shield = Date.now() + durations.shield;
        
        const timer = setInterval(() => {
            updatePowerupDisplay();
        }, 100);
        
        setTimeout(() => {
            clearInterval(timer);
            activatePowerup('shield', true);
        }, durations.shield);
    } else if (type === 'freeze') {
        activePowerups.freeze = true;
        powerupTimers.freeze = Date.now() + durations.freeze;
        
        const timer = setInterval(() => {
            updatePowerupDisplay();
        }, 100);
        
        setTimeout(() => {
            clearInterval(timer);
            activePowerups.freeze = false;
            delete powerupTimers.freeze;
            updatePowerupDisplay();
        }, durations.freeze);
    } else if (type === 'multiplier') {
        activePowerups.multiplier = true;
        powerupTimers.multiplier = Date.now() + durations.multiplier;
        
        const timer = setInterval(() => {
            updatePowerupDisplay();
        }, 100);
        
        setTimeout(() => {
            clearInterval(timer);
            activePowerups.multiplier = false;
            delete powerupTimers.multiplier;
            updatePowerupDisplay();
        }, durations.multiplier);
    } else if (type === 'extralife') {
        lives++;
        updateDisplay();
    } else if (type === 'combo-boost') {
        comboMultiplier = 2;
        activePowerups['combo-boost'] = true;
        powerupTimers['combo-boost'] = Date.now() + durations['combo-boost'];
        
        const timer = setInterval(() => {
            updatePowerupDisplay();
        }, 100);
        
        setTimeout(() => {
            clearInterval(timer);
            comboMultiplier = 1;
            activePowerups['combo-boost'] = false;
            delete powerupTimers['combo-boost'];
            updatePowerupDisplay();
        }, durations['combo-boost']);
    } else if (type === 'magnet') {
        activePowerups.magnet = true;
        powerupTimers.magnet = Date.now() + durations.magnet;
        
        const timer = setInterval(() => {
            updatePowerupDisplay();
        }, 100);
        
        setTimeout(() => {
            clearInterval(timer);
            activePowerups.magnet = false;
            delete powerupTimers.magnet;
            updatePowerupDisplay();
        }, durations.magnet);
    }
    
    updatePowerupDisplay();
}

function createParticles(x, y, color, count = 15) {
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.background = color;
        particle.style.left = x + 16 + 'px';
        particle.style.top = y + 16 + 'px';
        
        board.appendChild(particle);
        
        const angle = (Math.PI * 2 * i) / count;
        const velocity = 40 + Math.random() * 20;
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity;
        
        let px = x + 16;
        let py = y + 16;
        let life = 30;
        
        const animateParticle = () => {
            if (life <= 0) {
                particle.remove();
                return;
            }
            
            px += vx / 15;
            py += vy / 15;
            life--;
            
            particle.style.left = px + 'px';
            particle.style.top = py + 'px';
            particle.style.opacity = life / 30;
            
            requestAnimationFrame(animateParticle);
        };
        
        animateParticle();
    }
}

function showFeedback(text, x, y, color) {
    const feedback = document.createElement('div');
    feedback.className = 'feedback';
    feedback.textContent = text;
    feedback.style.left = x + 'px';
    feedback.style.top = y + 'px';
    feedback.style.color = color;
    
    board.appendChild(feedback);
    
    setTimeout(() => feedback.remove(), 800);
}

function showNotification(text) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = text;
    
    board.appendChild(notification);
    
    setTimeout(() => notification.remove(), 2500);
}

function createConfetti() {
    const colors = ['#FFD700', '#FF6B6B', '#4CAF50', '#2196F3', '#9C27B0'];
    const confettiCount = isMobile ? 20 : 40;
    
    for (let i = 0; i < confettiCount; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.style.position = 'absolute';
            confetti.style.width = '8px';
            confetti.style.height = '8px';
            confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = Math.random() * boardWidth + 'px';
            confetti.style.top = '0px';
            confetti.style.borderRadius = '50%';
            confetti.style.pointerEvents = 'none';
            confetti.style.zIndex = '20';
            
            board.appendChild(confetti);
            
            let cy = 0;
            let cx = parseFloat(confetti.style.left);
            const gravity = 3;
            const drift = (Math.random() - 0.5) * 2;
            
            const fall = () => {
                cy += gravity;
                cx += drift;
                confetti.style.top = cy + 'px';
                confetti.style.left = cx + 'px';
                
                if (cy > boardHeight) {
                    confetti.remove();
                    return;
                }
                
                requestAnimationFrame(fall);
            };
            
            fall();
        }, i * 50);
    }
}

function checkLevelUp() {
    const newLevel = Math.floor(collected / 8) + 1;
    if (newLevel > level && newLevel <= 10) {
        level = newLevel;
        updateDisplay();
        board.className = `level-${Math.min(level, 5)}`;
        showNotification(`🎉 LEVEL ${level}!`);
        createConfetti();
        playSound('levelup');
        
        if (level === 5) achievements.push('⭐ Level 5 Champion');
        if (level === 10) achievements.push('👑 Level 10 Master');
    }
}

function getRank(s) {
    if (s >= 2000) return '👑 Legendary Prover';
    if (s >= 1500) return '💎 Diamond Auditor';
    if (s >= 1000) return '🥇 Gold Verifier';
    if (s >= 600) return '🥈 Silver Validator';
    if (s >= 300) return '🥉 Bronze Checker';
    if (s >= 100) return '📜 Novice Prover';
    return '🌱 Beginner';
}

// ===== MOBILE TOUCH CONTROLS =====
function setupSwipeControls() {
    let touchStartX = 0, touchStartY = 0;
    let touchEndX = 0, touchEndY = 0;
    
    board.addEventListener('touchstart', (e) => {
        if (!gameActive || paused) return;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, { passive: true });
    
    board.addEventListener('touchmove', (e) => {
        if (!gameActive || paused) return;
        e.preventDefault();
        
        touchEndX = e.touches[0].clientX;
        touchEndY = e.touches[0].clientY;
        
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        
        if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
            const sensitivity = 0.5;
            playerX = Math.max(0, Math.min(boardWidth - playerSize, playerX + deltaX * sensitivity));
            playerY = Math.max(0, Math.min(boardHeight - playerSize, playerY + deltaY * sensitivity));
            
            player.style.transform = `translate(${playerX}px, ${playerY}px)`;
            
            if (Math.random() > 0.9) createTrail();
            
            touchStartX = touchEndX;
            touchStartY = touchEndY;
        }
    }, { passive: false });
}

async function endGame() {
    gameActive = false;
    paused = false;
    
    clearInterval(gameInterval);
    clearInterval(spawnInterval);
    clearInterval(powerupInterval);
    clearInterval(timerInterval);
    if (magnetInterval) clearInterval(magnetInterval);
    
    const isNew = await saveData();
    
    if (score >= 500) achievements.push('💯 500+ Score Club');
    if (score >= 1000) achievements.push('🎯 1000+ Elite Player');
    if (score >= 2000) achievements.push('🚀 2000+ Legendary');
    if (bestCombo >= 15) achievements.push('🔥 Combo Master (15+)');
    if (collected >= 50) achievements.push('📊 Collector Pro (50+)');
    
    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalLevel').textContent = level;
    document.getElementById('finalMoves').textContent = moves;
    document.getElementById('finalValid').textContent = moveHistory.filter(m => m.type === 'valid').length;
    document.getElementById('finalFake').textContent = moveHistory.filter(m => m.type === 'fake').length;
    document.getElementById('bestCombo').textContent = bestCombo;
    document.getElementById('rankDisplay').textContent = getRank(score);
    
    const newHighScoreMsg = document.getElementById('newHighScoreMsg');
    if (isNew && score > 0) {
        newHighScoreMsg.style.display = 'block';
        showNotification('🎊 NEW HIGH SCORE! 🎊');
        createConfetti();
    } else {
        newHighScoreMsg.style.display = 'none';
    }
    
    const achievementsContainer = document.getElementById('achievements');
    achievementsContainer.innerHTML = '<h4 style="color:#ffd700;margin-bottom:10px;">🏆 Achievements</h4>';
    
    if (achievements.length === 0) {
        achievementsContainer.innerHTML += '<p style="color:#888;">No achievements this time!</p>';
    } else {
        const uniqueAchievements = [...new Set(achievements)];
        uniqueAchievements.forEach(ach => {
            const badge = document.createElement('div');
            badge.className = 'achievement-badge';
            badge.textContent = ach;
            achievementsContainer.appendChild(badge);
        });
    }
    
    const historyContainer = document.getElementById('moveHistory');
    historyContainer.innerHTML = '<h4>📜 Last 15 Moves:</h4>';
    
    if (moveHistory.length === 0) {
        historyContainer.innerHTML += '<p style="color:#888;">No moves made!</p>';
    } else {
        moveHistory.slice(-15).forEach(move => {
            const div = document.createElement('div');
            div.className = `move-item move-${move.type}`;
            div.textContent = move.type === 'valid' ? 
                `#${move.moveNumber}: ✓ Valid Proof` : 
                `#${move.moveNumber}: ✗ Fake Proof`;
            historyContainer.appendChild(div);
        });
    }
    
    gameOverEl.style.display = 'flex';
    document.getElementById('pauseBtn').disabled = true;
    document.getElementById('exitBtn').disabled = true;
}

function restartGame() {
    gameOverEl.style.display = 'none';
    updateBoardDimensions();
    playerX = (boardWidth - playerSize) / 2;
    playerY = (boardHeight - playerSize) / 2;
    player.style.transform = `translate(${playerX}px, ${playerY}px)`;
    player.classList.remove('invincible', 'combo-glow');
    board.className = '';
    document.querySelectorAll('.proof, .powerup, .notification').forEach(el => el.remove());
    powerupsEl.innerHTML = '';
    
    introEl.style.display = 'flex';
}

function exitGame() {
    if (confirm('Are you sure you want to exit? Your progress will be lost.')) {
        endGame();
    }
}

// ===== SHARE SCORE FUNCTIONS =====
function openShareModal() {
    const modal = document.getElementById('shareModal');
    const preview = document.getElementById('sharePreview');
    
    const shareText = `🎮 The Proof Collector

💎 Score: ${score} points
🏆 Rank: ${getRank(score)}
🎯 Level: ${level}
🔥 Best Combo: ${bestCombo}x
📊 Moves: ${moves}

Can you beat my score? 🚀`;

    preview.textContent = shareText;
    modal.style.display = 'flex';
}

function closeShareModal() {
    document.getElementById('shareModal').style.display = 'none';
}

function shareOnTwitter() {
    const text = `🎮 I scored ${score} points in The Proof Collector!\n🏆 ${getRank(score)}\n🔥 Best Combo: ${bestCombo}x\n\nCan you beat my score? 🚀`;
    const url = window.location.href.replace('game.html', 'index.html');
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');
}

function copyScoreText() {
    const shareText = `🎮 The Proof Collector

💎 Score: ${score} points
🏆 Rank: ${getRank(score)}
🎯 Level: ${level}
🔥 Best Combo: ${bestCombo}x
📊 Moves: ${moves}

Can you beat my score? 🚀
${window.location.href.replace('game.html', 'index.html')}`;

    if (navigator.clipboard) {
        navigator.clipboard.writeText(shareText).then(() => {
            alert('Score copied to clipboard! 📋');
        }).catch(() => {
            fallbackCopy(shareText);
        });
    } else {
        fallbackCopy(shareText);
    }
}

function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        alert('Score copied to clipboard! 📋');
    } catch (e) {
        alert('Could not copy. Please copy manually.');
    }
    document.body.removeChild(textarea);
}

function downloadScoreCard() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 600;
    canvas.height = 400;
    
    const gradient = ctx.createLinearGradient(0, 0, 600, 400);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 600, 400);
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 36px Poppins, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🎮 The Proof Collector', 300, 60);
    
    ctx.font = 'bold 48px Poppins, sans-serif';
    ctx.fillStyle = '#ffd700';
    ctx.fillText(`${score} points`, 300, 140);
    
    ctx.font = '28px Poppins, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.fillText(getRank(score), 300, 190);
    
    ctx.font = '20px Poppins, sans-serif';
    ctx.fillStyle = '#e0e7ff';
    ctx.fillText(`Level ${level} • ${bestCombo}x Combo • ${moves} Moves`, 300, 240);
    
    ctx.font = 'bold 24px Poppins, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.fillText('Can you beat this? 🚀', 300, 300);
    
    ctx.font = '16px Poppins, sans-serif';
    ctx.fillStyle = '#a0aec0';
    ctx.fillText('The Proof Collector by Casp3r', 300, 360);
    
    canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `proof-collector-score-${score}.png`;
        a.click();
        URL.revokeObjectURL(url);
    });
}

// ===== INITIALIZE =====
loadData();

// Update board dimensions on resize
window.addEventListener('resize', () => {
    if (!gameActive) {
        updateBoardDimensions();
    }
});

// Setup mode selection buttons
document.getElementById('quickBtn').addEventListener('click', () => {
    console.log('Quick button clicked!');
    startGame('quick');
});

document.getElementById('challengeBtn').addEventListener('click', () => {
    console.log('Challenge button clicked!');
    startGame('challenge');
});

document.getElementById('endlessBtn').addEventListener('click', () => {
    console.log('Endless button clicked!');
    startGame('endless');
});

// Setup share button
document.getElementById('shareBtn').addEventListener('click', openShareModal);

// Close share modal on background click
document.getElementById('shareModal').addEventListener('click', (e) => {
    if (e.target.id === 'shareModal') {
        closeShareModal();
    }
});

// Make functions globally accessible
window.startGame = startGame;
window.restartGame = restartGame;
window.togglePause = togglePause;
window.toggleMute = toggleMute;
window.exitGame = exitGame;
window.openShareModal = openShareModal;
window.closeShareModal = closeShareModal;
window.shareOnTwitter = shareOnTwitter;
window.copyScoreText = copyScoreText;
window.downloadScoreCard = downloadScoreCard;

console.log('🎮 The Proof Collector - Enhanced Version Loaded!');
console.log('✨ Features: Magnet auto-collect, mobile optimized, smooth animations');

// ===== AUTO-REDIRECT TO INDEX ON REFRESH =====
if (!sessionStorage.getItem('gameStarted')) {
    console.log('🔄 Redirecting to intro page...');
    window.location.href = 'index.html';
} else {
    console.log('✅ Game access authorized');
}