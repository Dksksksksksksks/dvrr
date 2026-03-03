// DVR Community - Games JavaScript

// ==================== SNAKE GAME ====================
let snake = {
    body: [{x: 10, y: 10}],
    direction: {x: 1, y: 0},
    grow: false
};

let food = {x: 15, y: 15};
const gridSize = 20;
let snakeInterval;

function initSnakeGame() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    // Reset snake
    snake = {
        body: [{x: 10, y: 10}],
        direction: {x: 1, y: 0},
        grow: false
    };
    
    gameState.score = 0;
    updateScore();
    
    placeFood(canvas);
    
    // Controls
    document.addEventListener('keydown', handleSnakeControls);
    
    // Game loop
    if (snakeInterval) clearInterval(snakeInterval);
    snakeInterval = setInterval(() => {
        if (!gameState.isPaused && gameState.isRunning) {
            updateSnake(canvas);
            drawSnake(ctx, canvas);
        }
    }, 100);
}

function handleSnakeControls(e) {
    if (currentGame !== 'snake') return;
    
    switch(e.key) {
        case 'ArrowUp':
        case 'w':
            if (snake.direction.y !== 1) snake.direction = {x: 0, y: -1};
            break;
        case 'ArrowDown':
        case 's':
            if (snake.direction.y !== -1) snake.direction = {x: 0, y: 1};
            break;
        case 'ArrowLeft':
        case 'a':
            if (snake.direction.x !== 1) snake.direction = {x: -1, y: 0};
            break;
        case 'ArrowRight':
        case 'd':
            if (snake.direction.x !== -1) snake.direction = {x: 1, y: 0};
            break;
    }
}

function updateSnake(canvas) {
    const head = {
        x: snake.body[0].x + snake.direction.x,
        y: snake.body[0].y + snake.direction.y
    };
    
    // Wrap around walls
    const cols = Math.floor(canvas.width / gridSize);
    const rows = Math.floor(canvas.height / gridSize);
    
    if (head.x < 0) head.x = cols - 1;
    if (head.x >= cols) head.x = 0;
    if (head.y < 0) head.y = rows - 1;
    if (head.y >= rows) head.y = 0;
    
    // Check self collision
    for (let segment of snake.body) {
        if (head.x === segment.x && head.y === segment.y) {
            gameOver();
            return;
        }
    }
    
    snake.body.unshift(head);
    
    // Check food collision
    if (head.x === food.x && head.y === food.y) {
        gameState.score += 10;
        updateScore();
        placeFood(canvas);
    } else {
        snake.body.pop();
    }
}

function placeFood(canvas) {
    const cols = Math.floor(canvas.width / gridSize);
    const rows = Math.floor(canvas.height / gridSize);
    
    do {
        food = {
            x: Math.floor(Math.random() * cols),
            y: Math.floor(Math.random() * rows)
        };
    } while (snake.body.some(seg => seg.x === food.x && seg.y === food.y));
}

function drawSnake(ctx, canvas) {
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    ctx.strokeStyle = 'rgba(255, 0, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    // Draw food
    ctx.fillStyle = '#ff1493';
    ctx.shadowColor = '#ff1493';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(
        food.x * gridSize + gridSize/2,
        food.y * gridSize + gridSize/2,
        gridSize/2 - 2,
        0,
        Math.PI * 2
    );
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Draw snake
    snake.body.forEach((segment, index) => {
        const gradient = ctx.createLinearGradient(
            segment.x * gridSize,
            segment.y * gridSize,
            segment.x * gridSize + gridSize,
            segment.y * gridSize + gridSize
        );
        gradient.addColorStop(0, '#ff00ff');
        gradient.addColorStop(1, '#8b00ff');
        
        ctx.fillStyle = gradient;
        ctx.shadowColor = '#ff00ff';
        ctx.shadowBlur = index === 0 ? 15 : 5;
        ctx.fillRect(
            segment.x * gridSize + 1,
            segment.y * gridSize + 1,
            gridSize - 2,
            gridSize - 2
        );
    });
    ctx.shadowBlur = 0;
}

// ==================== MEMORY GAME ====================
const memorySymbols = ['🎮', '🎯', '🎲', '🎪', '🎨', '🎭', '🎬', '🎤'];
let memoryCards = [];
let flippedCards = [];
let matchedPairs = 0;

function initMemoryGame() {
    const grid = document.getElementById('memoryGrid');
    grid.innerHTML = '';
    
    flippedCards = [];
    matchedPairs = 0;
    gameState.score = 0;
    updateScore();
    
    // Create card pairs
    const cards = [...memorySymbols, ...memorySymbols];
    memoryCards = shuffleArray(cards);
    
    memoryCards.forEach((symbol, index) => {
        const card = document.createElement('div');
        card.className = 'memory-card';
        card.dataset.index = index;
        card.dataset.symbol = symbol;
        card.innerHTML = '?';
        card.addEventListener('click', () => flipCard(card));
        grid.appendChild(card);
    });
    
    gameState.isRunning = true;
    document.getElementById('startBtn').style.display = 'none';
    document.getElementById('pauseBtn').style.display = 'none';
    document.getElementById('restartBtn').style.display = 'inline-flex';
}

function flipCard(card) {
    if (flippedCards.length >= 2) return;
    if (card.classList.contains('flipped')) return;
    if (card.classList.contains('matched')) return;
    
    card.classList.add('flipped');
    card.innerHTML = card.dataset.symbol;
    flippedCards.push(card);
    
    if (flippedCards.length === 2) {
        setTimeout(checkMatch, 500);
    }
}

function checkMatch() {
    const [card1, card2] = flippedCards;
    
    if (card1.dataset.symbol === card2.dataset.symbol) {
        card1.classList.add('matched');
        card2.classList.add('matched');
        gameState.score += 50;
        matchedPairs++;
        
        if (matchedPairs === memorySymbols.length) {
            gameState.score += 100;
            showNotification('Congratulations! You won!', 'success');
            saveScore('memory', gameState.score);
        }
    } else {
        card1.classList.remove('flipped');
        card2.classList.remove('flipped');
        card1.innerHTML = '?';
        card2.innerHTML = '?';
    }
    
    updateScore();
    flippedCards = [];
}

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// ==================== SPACE SHOOTER GAME ====================
let spaceship = {x: 0, y: 0, width: 40, height: 30};
let bullets = [];
let enemies = [];
let stars = [];
let spaceAnimationId;

function initSpaceGame() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    // Initialize spaceship
    spaceship = {
        x: canvas.width / 2 - 20,
        y: canvas.height - 60,
        width: 40,
        height: 30
    };
    
    bullets = [];
    enemies = [];
    stars = [];
    gameState.score = 0;
    updateScore();
    
    // Create stars
    for (let i = 0; i < 100; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            speed: 1 + Math.random() * 3,
            size: Math.random() * 2
        });
    }
    
    // Controls
    document.addEventListener('keydown', handleSpaceControls);
    document.addEventListener('keyup', handleSpaceKeyUp);
    
    // Spawn enemies
    setInterval(() => {
        if (gameState.isRunning && !gameState.isPaused) {
            enemies.push({
                x: Math.random() * (canvas.width - 30),
                y: -30,
                width: 30,
                height: 30,
                speed: 2 + Math.random() * 2
            });
        }
    }, 1500);
    
    // Start game loop
    spaceGameLoop(ctx, canvas);
}

let spaceKeys = {left: false, right: false, shoot: false};
let lastShot = 0;

function handleSpaceControls(e) {
    if (currentGame !== 'space') return;
    
    switch(e.key) {
        case 'ArrowLeft':
        case 'a':
            spaceKeys.left = true;
            break;
        case 'ArrowRight':
        case 'd':
            spaceKeys.right = true;
            break;
        case ' ':
        case 'ArrowUp':
            spaceKeys.shoot = true;
            break;
    }
}

function handleSpaceKeyUp(e) {
    switch(e.key) {
        case 'ArrowLeft':
        case 'a':
            spaceKeys.left = false;
            break;
        case 'ArrowRight':
        case 'd':
            spaceKeys.right = false;
            break;
        case ' ':
        case 'ArrowUp':
            spaceKeys.shoot = false;
            break;
    }
}

function spaceGameLoop(ctx, canvas) {
    if (!gameState.isRunning) return;
    
    if (!gameState.isPaused) {
        updateSpaceGame(canvas);
        drawSpaceGame(ctx, canvas);
    }
    
    spaceAnimationId = requestAnimationFrame(() => spaceGameLoop(ctx, canvas));
}

function updateSpaceGame(canvas) {
    // Move spaceship
    if (spaceKeys.left && spaceship.x > 0) {
        spaceship.x -= 5;
    }
    if (spaceKeys.right && spaceship.x < canvas.width - spaceship.width) {
        spaceship.x += 5;
    }
    
    // Shoot
    const now = Date.now();
    if (spaceKeys.shoot && now - lastShot > 200) {
        bullets.push({
            x: spaceship.x + spaceship.width / 2 - 2,
            y: spaceship.y,
            width: 4,
            height: 15,
            speed: 8
        });
        lastShot = now;
    }
    
    // Update bullets
    bullets = bullets.filter(bullet => {
        bullet.y -= bullet.speed;
        return bullet.y > -bullet.height;
    });
    
    // Update enemies
    enemies = enemies.filter(enemy => {
        enemy.y += enemy.speed;
        
        // Check collision with spaceship
        if (checkCollision(enemy, spaceship)) {
            gameOver();
            return false;
        }
        
        return enemy.y < canvas.height;
    });
    
    // Check bullet-enemy collisions
    bullets.forEach((bullet, bi) => {
        enemies.forEach((enemy, ei) => {
            if (checkCollision(bullet, enemy)) {
                bullets.splice(bi, 1);
                enemies.splice(ei, 1);
                gameState.score += 25;
                updateScore();
            }
        });
    });
    
    // Update stars
    stars.forEach(star => {
        star.y += star.speed;
        if (star.y > canvas.height) {
            star.y = 0;
            star.x = Math.random() * canvas.width;
        }
    });
}

function drawSpaceGame(ctx, canvas) {
    // Clear canvas
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw stars
    stars.forEach(star => {
        ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + star.size * 0.3})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Draw spaceship
    ctx.fillStyle = '#ff00ff';
    ctx.shadowColor = '#ff00ff';
    ctx.shadowBlur = 15;
    
    ctx.beginPath();
    ctx.moveTo(spaceship.x + spaceship.width / 2, spaceship.y);
    ctx.lineTo(spaceship.x, spaceship.y + spaceship.height);
    ctx.lineTo(spaceship.x + spaceship.width, spaceship.y + spaceship.height);
    ctx.closePath();
    ctx.fill();
    
    // Draw engine glow
    ctx.fillStyle = '#00ffff';
    ctx.shadowColor = '#00ffff';
    ctx.beginPath();
    ctx.moveTo(spaceship.x + 10, spaceship.y + spaceship.height);
    ctx.lineTo(spaceship.x + spaceship.width / 2, spaceship.y + spaceship.height + 15);
    ctx.lineTo(spaceship.x + spaceship.width - 10, spaceship.y + spaceship.height);
    ctx.closePath();
    ctx.fill();
    
    ctx.shadowBlur = 0;
    
    // Draw bullets
    ctx.fillStyle = '#00ffff';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 10;
    bullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
    ctx.shadowBlur = 0;
    
    // Draw enemies
    enemies.forEach(enemy => {
        ctx.fillStyle = '#ff1493';
        ctx.shadowColor = '#ff1493';
        ctx.shadowBlur = 10;
        
        // Draw enemy shape (diamond)
        ctx.beginPath();
        ctx.moveTo(enemy.x + enemy.width / 2, enemy.y);
        ctx.lineTo(enemy.x + enemy.width, enemy.y + enemy.height / 2);
        ctx.lineTo(enemy.x + enemy.width / 2, enemy.y + enemy.height);
        ctx.lineTo(enemy.x, enemy.y + enemy.height / 2);
        ctx.closePath();
        ctx.fill();
    });
    ctx.shadowBlur = 0;
}

function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function gameOver() {
    gameState.isRunning = false;
    
    if (snakeInterval) clearInterval(snakeInterval);
    if (spaceAnimationId) cancelAnimationFrame(spaceAnimationId);
    
    showNotification(`Game Over! Score: ${gameState.score}`, 'error');
    saveScore(currentGame, gameState.score);
    
    document.getElementById('startBtn').style.display = 'inline-flex';
    document.getElementById('startBtn').innerHTML = '<i class="fas fa-redo"></i> PLAY AGAIN';
    document.getElementById('pauseBtn').style.display = 'none';
}