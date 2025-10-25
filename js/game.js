// ===== DOM ELEMENTS =====
const board = document.getElementById('gameBoard');
const player = document.querySelector('.player');
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
let score = 0, timeLeft = 180, lives = 5, moves = 0, collected = 0;
let level = 1, combo = 0, bestCombo = 0;
let gameActive = false, paused = false;
let proofs = [], powerups = [], moveHistory = [], achievements = [];
let keys = {}, activePowerups = {}, powerupTimers = {};
let gameInterval, spawnInterval, powerupInterval, timerInterval;
let gameMode = 'quick', muted = false;
let highScore = 0, scoreHistory = [], comboMultiplier = 1;

// Mobile touch control state
let touchControlType = null; // 'swipe' or 'joystick'
let isMobile = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
let touchStartX = 0, touchStartY = 0;
let joystickActive = false, joystickCenterX = 0, joystickCenterY = 0;

const boardWidth = 700, boardHeight = 500;
const playerSize = 45, moveSpeed = 5;

player.style.left = playerX + 'px';
player.style.top = playerY + 'px';

const audioContext = new (window.AudioContext || window.webkitAudioContext)();

console.log('Mobile detected:', isMobile);
console.log('Screen width:', window.innerWidth);

// ===== SIDEBAR MENU HANDLERS =====
function setupSidebar() {
    console.log('=== SIDEBAR SETUP DEBUG ===');
    
    const ham = document.getElementById('hamburger');
    const sidebar = document.getElementById('scoreSidebar');
    const closeBtn = document.getElementById('closeSidebar');
    
    console.log('Hamburger found:', ham);
    console.log('Sidebar found:', sidebar);
    console.log('Close button found:', closeBtn);
    
    if (!ham) {
        console.error('❌ HAMBURGER NOT FOUND! Check your HTML for id="hamburger"');
        return;
    }
    
    if (!sidebar) {
        console.error('❌ SIDEBAR NOT FOUND! Check your HTML for id="scoreSidebar"');
        return;
    }
    
    if (!closeBtn) {
        console.error('❌ CLOSE BUTTON NOT FOUND! Check your HTML for id="closeSidebar"');
        return;
    }
    
    console.log('✅ All elements found!');
    
    // Open sidebar - use 'active' class to match CSS
    ham.addEventListener('click', function(e) {
        console.log('🎯 HAMBURGER CLICKED!');
        e.preventDefault();
        e.stopPropagation();
        sidebar.classList.add('active');
        console.log('Sidebar classes:', sidebar.classList);
    });
    
    // Close sidebar
    closeBtn.addEventListener('click', function(e) {
        console.log('❌ CLOSE BUTTON CLICKED!');
        e.preventDefault();
        e.stopPropagation();
        sidebar.classList.remove('active');
        console.log('Sidebar classes:', sidebar.classList);
    });
    
    // Close on outside click
    document.addEventListener('click', function(e) {
        if (sidebar.classList.contains('active') && 
            !sidebar.contains(e.target) && 
            e.target !== ham) {
            console.log('🌍 OUTSIDE CLICK - closing sidebar');
            sidebar.classList.remove('active');
        }
    });
    
    console.log('✅ Sidebar setup complete!');
}

// Wait for DOM to be fully loaded
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
            console.log('✅ High score loaded:', highScore);
        }
    } catch (e) {
        console.log('No high score saved yet');
    }
    
    try {
        const hist = await window.storage.get('proof-collector-history');
        if (hist && hist.value) {
            scoreHistory = JSON.parse(hist.value);
            updateSidebar();
            console.log('✅ Score history loaded:', scoreHistory.length, 'games');
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
            console.log('✅ New high score saved:', highScore);
        } catch (e) {
            console.error('❌ Could not save high score:', e);
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
            console.log('✅ Score history saved:', scoreHistory.length, 'games');
        } catch (e) {
            console.error('❌ Could not save history:', e);
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

// ===== GAME FUNCTIONS =====
function startGame(mode) {
    console.log('startGame called with mode:', mode);
    console.log('isMobile:', isMobile);
    console.log('touchControlType:', touchControlType);
    
    // Check if mobile and no control type selected yet
    if (isMobile && !touchControlType) {
        console.log('Showing touch control selection...');
        showTouchControlSelection(mode);
        return;
    }
    
    console.log('Starting game normally...');
    
    gameMode = mode;
    gameActive = true;
    paused = false;
    score = moves = collected = level = combo = bestCombo = 0;
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
    
    introEl.style.display = 'none';
    document.getElementById('startBtn').textContent = 'Playing...';
    document.getElementById('startBtn').disabled = true;
    document.getElementById('pauseBtn').disabled = false;
    
    board.className = '';
    playerX = 327.5;
    playerY = 227.5;
    player.style.left = playerX + 'px';
    player.style.top = playerY + 'px';
    
    // Show joystick if selected
    if (isMobile && touchControlType === 'joystick') {
        console.log('Showing joystick...');
        showJoystick();
    } else if (isMobile && touchControlType === 'swipe') {
        console.log('Swipe controls active...');
    }
    
    spawnProof();
    spawnProof();
    spawnProof();
    
    gameInterval = setInterval(() => {
        if (!paused) {
            movePlayer();
            checkLevelUp();
        }
    }, 1000/60);
    
    timerInterval = setInterval(() => {
        if (!paused && gameMode !== 'endless') {
            timeLeft--;
            updateDisplay();
            if (timeLeft <= 0) endGame();
        }
    }, 1000);
    
    spawnInterval = setInterval(() => {
        if (!paused) {
            spawnProof();
            if (level > 2 && Math.random() > 0.6) spawnProof();
        }
    }, 1200);
    
    powerupInterval = setInterval(() => {
        if (!paused) spawnPowerup();
    }, 7000);
    
    showNotification('🚀 Game Started!');
    playSound('levelup');
}

function updateDisplay() {
    scoreEl.textContent = score;
    livesEl.textContent = lives;
    movesEl.textContent = moves;
    levelEl.textContent = level;
    comboEl.textContent = combo;
    
    livesEl.parentElement.className = 'stat lives' + (lives <= 2 ? ' danger' : '');
    
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
                'combo-boost': '🔷 Soundness 2x'
            };
            
            indicator.textContent = icons[type] || type;
            
            if (powerupTimers[type]) {
                const timeLeft = Math.ceil((powerupTimers[type] - Date.now()) / 1000);
                if (timeLeft > 0) {
                    indicator.textContent += ` (${timeLeft}s)`;
                }
            }
            
            powerupsEl.appendChild(indicator);
        }
    });
}

function movePlayer() {
    if (!gameActive || paused) return;

    let moved = false;
    
    // Keyboard controls (desktop)
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

    player.style.left = playerX + 'px';
    player.style.top = playerY + 'px';
    
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
    
    const proofSize = 32;
    const x = Math.random() * (boardWidth - proofSize);
    const y = Math.random() * (boardHeight - proofSize);
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

function spawnPowerup() {
    if (!gameActive || paused || powerups.length > 2) return;

    const types = ['shield', 'freeze', 'multiplier', 'extralife', 'combo-boost'];
    const type = types[Math.floor(Math.random() * types.length)];
    const powerup = document.createElement('div');
    powerup.className = `powerup ${type}`;
    powerup.dataset.type = type;
    
    const icons = {
        shield: '🛡️',
        freeze: '❄️',
        multiplier: '⭐',
        extralife: '💛',
        'combo-boost': '🔷'
    };
    powerup.textContent = icons[type];
    
    const powerupSize = type === 'combo-boost' ? 45 : 40;
    const x = Math.random() * (boardWidth - powerupSize);
    const y = Math.random() * (boardHeight - powerupSize);
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
    const proofSize = 32;
    
    proofs.forEach((proof, index) => {
        const dx = playerX + playerSize/2 - (proof.x + proofSize/2);
        const dy = playerY + playerSize/2 - (proof.y + proofSize/2);
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < (playerSize/2 + proofSize/2)) {
            moves++;
            movesEl.textContent = moves;
            movesEl.parentElement.classList.add('highlight');
            setTimeout(() => movesEl.parentElement.classList.remove('highlight'), 500);
            
            moveHistory.push({
                type: proof.valid ? 'valid' : 'fake',
                moveNumber: moves
            });
            
            proof.element.classList.add('collected');
            
            if (proof.valid) {
                combo++;
                const basePoints = 10;
                const comboBonus = combo >= 5 ? Math.floor(combo / 5) * 5 : 0;
                const multiplier = (activePowerups.multiplier ? 2 : 1) * comboMultiplier;
                const points = (basePoints + comboBonus) * multiplier;
                
                score += points;
                collected++;
                
                scoreEl.parentElement.classList.add('highlight');
                setTimeout(() => scoreEl.parentElement.classList.remove('highlight'), 500);
                
                createParticles(proof.x, proof.y, '#4CAF50');
                showFeedback(`+${points}`, proof.x, proof.y, '#4CAF50');
                playSound('collect');
                
                if (combo > bestCombo) bestCombo = combo;
                
                if (combo === 5) {
                    showNotification('🔥 5x COMBO!');
                } else if (combo === 10) {
                    showNotification('🔥🔥 10x COMBO!');
                    createConfetti();
                } else if (combo >= 15) {
                    showNotification('🔥🔥🔥 MEGA COMBO!');
                    createConfetti();
                }
            } else {
                combo = 0;
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
                createParticles(proof.x, proof.y, '#ff6b6b');
            }
            
            updateDisplay();
            
            setTimeout(() => {
                proof.element.remove();
            }, 350);
            
            proofs.splice(index, 1);
        }
    });
    
    powerups.forEach((powerup, index) => {
        const powerupSize = powerup.type === 'combo-boost' ? 45 : 40;
        const dx = playerX + playerSize/2 - (powerup.x + powerupSize/2);
        const dy = playerY + playerSize/2 - (powerup.y + powerupSize/2);
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < (playerSize/2 + powerupSize/2)) {
            powerup.element.classList.add('collected');
            activatePowerup(powerup.type);
            createParticles(powerup.x, powerup.y, '#FFD700');
            playSound('powerup');
            
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
        updatePowerupDisplay();
        return;
    }
    
    const durations = {
        shield: 12000,
        freeze: 6000,
        multiplier: 12000,
        'combo-boost': 15000
    };
    
    const names = {
        shield: '🛡️ SHIELD ACTIVE',
        freeze: '❄️ TIME FREEZE',
        multiplier: '⭐ 2x POINTS',
        extralife: '💛 EXTRA LIFE',
        'combo-boost': '🔷 SOUNDNESS BOOST 2x'
    };
    
    showNotification(names[type] || type.toUpperCase());
    
    if (type === 'shield') {
        activePowerups.shield = true;
        player.classList.add('invincible');
        powerupTimers.shield = Date.now() + durations.shield;
        
        const timer = setInterval(() => {
            updatePowerupDisplay();
        }, 1000);
        
        setTimeout(() => {
            clearInterval(timer);
            activatePowerup('shield', true);
        }, durations.shield);
    } else if (type === 'freeze') {
        activePowerups.freeze = true;
        powerupTimers.freeze = Date.now() + durations.freeze;
        
        const timer = setInterval(() => {
            updatePowerupDisplay();
        }, 1000);
        
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
        }, 1000);
        
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
        }, 1000);
        
        setTimeout(() => {
            clearInterval(timer);
            comboMultiplier = 1;
            activePowerups['combo-boost'] = false;
            delete powerupTimers['combo-boost'];
            updatePowerupDisplay();
        }, durations['combo-boost']);
    }
    
    updatePowerupDisplay();
}

function createParticles(x, y, color) {
    const particleCount = 15;
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.background = color;
        particle.style.left = x + 16 + 'px';
        particle.style.top = y + 16 + 'px';
        
        board.appendChild(particle);
        
        const angle = (Math.PI * 2 * i) / particleCount;
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
    const confettiCount = 40;
    
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
function showTouchControlSelection(mode) {
    console.log('showTouchControlSelection called with mode:', mode);
    
    // Hide intro screen first
    introEl.style.display = 'none';
    
    const selection = document.createElement('div');
    selection.className = 'touch-control-selection';
    selection.innerHTML = `
        <h2>📱 Choose Control Type</h2>
        <p>How would you like to play?</p>
        <div class="control-options">
            <button class="control-option-btn" onclick="selectTouchControl('swipe', '${mode}')">
                <div class="control-icon">👆</div>
                <h3>Swipe</h3>
                <p>Swipe in any direction to move</p>
            </button>
            <button class="control-option-btn" onclick="selectTouchControl('joystick', '${mode}')">
                <div class="control-icon">🕹️</div>
                <h3>Joystick</h3>
                <p>Virtual joystick control</p>
            </button>
        </div>
        <button class="back-btn" onclick="closeTouchControlSelection()">← Back</button>
    `;
    board.appendChild(selection);
    console.log('Touch control selection screen added to DOM');
}

function selectTouchControl(type, mode) {
    console.log('selectTouchControl called:', type, mode);
    
    touchControlType = type;
    closeTouchControlSelection();
    
    if (type === 'swipe') {
        console.log('Setting up swipe controls...');
        setupSwipeControls();
    } else if (type === 'joystick') {
        console.log('Setting up joystick controls...');
        setupJoystickControls();
    }
    
    // Now start the game
    setTimeout(() => {
        startGame(mode);
    }, 100);
}

function closeTouchControlSelection() {
    const selection = document.querySelector('.touch-control-selection');
    if (selection) selection.remove();
    
    // Show intro screen again if going back
    if (!gameActive) {
        introEl.style.display = 'block';
    }
}

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
        
        // Move player based on swipe
        if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
            const sensitivity = 0.5;
            playerX = Math.max(0, Math.min(boardWidth - playerSize, playerX + deltaX * sensitivity));
            playerY = Math.max(0, Math.min(boardHeight - playerSize, playerY + deltaY * sensitivity));
            
            player.style.left = playerX + 'px';
            player.style.top = playerY + 'px';
            
            if (Math.random() > 0.9) createTrail();
            
            touchStartX = touchEndX;
            touchStartY = touchEndY;
        }
    }, { passive: false });
}

function setupJoystickControls() {
    // Joystick will be created when game starts
}

function showJoystick() {
    const joystick = document.createElement('div');
    joystick.className = 'joystick-container';
    joystick.id = 'joystick';
    joystick.innerHTML = `
        <div class="joystick-base">
            <div class="joystick-stick"></div>
        </div>
    `;
    document.body.appendChild(joystick);
    
    const base = joystick.querySelector('.joystick-base');
    const stick = joystick.querySelector('.joystick-stick');
    const baseRect = base.getBoundingClientRect();
    const centerX = baseRect.width / 2;
    const centerY = baseRect.height / 2;
    
    let isDragging = false;
    
    const handleStart = (e) => {
        if (!gameActive || paused) return;
        isDragging = true;
        e.preventDefault();
    };
    
    const handleMove = (e) => {
        if (!isDragging || !gameActive || paused) return;
        e.preventDefault();
        
        const touch = e.touches ? e.touches[0] : e;
        const baseRect = base.getBoundingClientRect();
        
        let offsetX = touch.clientX - baseRect.left - centerX;
        let offsetY = touch.clientY - baseRect.top - centerY;
        
        const distance = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
        const maxDistance = centerX - 20;
        
        if (distance > maxDistance) {
            const angle = Math.atan2(offsetY, offsetX);
            offsetX = Math.cos(angle) * maxDistance;
            offsetY = Math.sin(angle) * maxDistance;
        }
        
        stick.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
        
        // Move player
        const moveX = (offsetX / maxDistance) * moveSpeed;
        const moveY = (offsetY / maxDistance) * moveSpeed;
        
        playerX = Math.max(0, Math.min(boardWidth - playerSize, playerX + moveX));
        playerY = Math.max(0, Math.min(boardHeight - playerSize, playerY + moveY));
        
        player.style.left = playerX + 'px';
        player.style.top = playerY + 'px';
        
        if (Math.random() > 0.9) createTrail();
    };
    
    const handleEnd = () => {
        isDragging = false;
        stick.style.transform = 'translate(0, 0)';
    };
    
    stick.addEventListener('touchstart', handleStart, { passive: false });
    stick.addEventListener('mousedown', handleStart);
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('touchend', handleEnd);
    document.addEventListener('mouseup', handleEnd);
}

function hideJoystick() {
    const joystick = document.getElementById('joystick');
    if (joystick) joystick.remove();
}

async function endGame() {
    gameActive = false;
    paused = false;
    
    clearInterval(gameInterval);
    clearInterval(spawnInterval);
    clearInterval(powerupInterval);
    clearInterval(timerInterval);
    
    hideJoystick();
    
    const isNew = await saveData();
    
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
    achievementsContainer.innerHTML = achievements.length === 0 ? 
        '<p style="color:#888;">No achievements this time!</p>' : '';
    
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
    document.getElementById('startBtn').textContent = 'Play Again';
    document.getElementById('startBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = true;
}

function restartGame() {
    gameOverEl.style.display = 'none';
    playerX = 327.5;
    playerY = 227.5;
    player.style.left = playerX + 'px';
    player.style.top = playerY + 'px';
    player.classList.remove('invincible');
    board.className = '';
    document.querySelectorAll('.proof, .powerup, .notification').forEach(el => el.remove());
    powerupsEl.innerHTML = '';
    hideJoystick();
    introEl.style.display = 'block';
    document.getElementById('startBtn').disabled = false;
}

// ===== INITIALIZE =====
setTimeout(() => {
    document.getElementById('startBtn').disabled = false;
    document.getElementById('startBtn').textContent = 'Select Mode';
}, 500);

loadData();

// Make functions globally accessible for onclick handlers
window.startGame = startGame;
window.restartGame = restartGame;
window.togglePause = togglePause;
window.toggleMute = toggleMute;
window.selectTouchControl = selectTouchControl;
window.closeTouchControlSelection = closeTouchControlSelection;

console.log('🎮 The Proof Collector - Game Loaded Successfully!');