// DVR Community - Main JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initParticles();
    initLampPull();
    initAuthTabs();
    initAuthForms();
    initNavigation();
    
    // Load admin data if admin
    if (window.siteSettings && window.siteSettings.is_admin) {
        loadUsers();
        loadStats();
    }
});

// Particle Animation
function initParticles() {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;

    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 15 + 's';
        particle.style.animationDuration = (10 + Math.random() * 20) + 's';
        particlesContainer.appendChild(particle);
    }
}

// Lamp Pull Animation
function initLampPull() {
    const pullDot = document.getElementById('pullDot');
    const cordPath = document.getElementById('cordPath');
    const loginPanel = document.getElementById('loginPanel');
    const lampCord = document.getElementById('lampCord');

    if (!pullDot || !loginPanel) return;

    let isDragging = false;
    let startY = 0;
    let pullDistance = 0;
    const maxPull = 100;
    const triggerDistance = 60;

    function updateCord(distance) {
        const controlX = 5 + Math.sin(distance * 0.05) * 10;
        const endY = 150 + distance;
        if (cordPath) {
            cordPath.setAttribute('d', `M5 0 Q${controlX} ${75 + distance/2} 5 ${endY}`);
        }
        pullDot.style.transform = `translateY(${distance}px)`;
    }

    function resetCord() {
        pullDistance = 0;
        updateCord(0);
        pullDot.classList.remove('pulling');
    }

    pullDot.addEventListener('mousedown', function(e) {
        isDragging = true;
        startY = e.clientY;
        pullDot.classList.add('pulling');
        e.preventDefault();
    });

    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        const currentY = e.clientY;
        pullDistance = Math.min(Math.max(0, currentY - startY), maxPull);
        updateCord(pullDistance);
    });

    document.addEventListener('mouseup', function() {
        if (!isDragging) return;
        isDragging = false;

        if (pullDistance >= triggerDistance) {
            const bulb = document.querySelector('.lamp-bulb');
            const bulbGlow = document.querySelector('.bulb-glow');
            if (bulb) bulb.style.filter = 'brightness(2)';
            if (bulbGlow) {
                bulbGlow.style.transform = 'translate(-50%, -50%) scale(3)';
                bulbGlow.style.opacity = '1';
            }

            setTimeout(() => {
                loginPanel.classList.add('visible');
                if (bulb) bulb.style.filter = 'brightness(1.5)';
            }, 300);
        }

        const springBack = setInterval(() => {
            pullDistance *= 0.8;
            updateCord(pullDistance);
            if (pullDistance < 0.5) {
                clearInterval(springBack);
                resetCord();
            }
        }, 16);
    });

    // Touch support
    pullDot.addEventListener('touchstart', function(e) {
        isDragging = true;
        startY = e.touches[0].clientY;
        pullDot.classList.add('pulling');
        e.preventDefault();
    });

    document.addEventListener('touchmove', function(e) {
        if (!isDragging) return;
        const currentY = e.touches[0].clientY;
        pullDistance = Math.min(Math.max(0, currentY - startY), maxPull);
        updateCord(pullDistance);
    });

    document.addEventListener('touchend', function() {
        if (!isDragging) return;
        isDragging = false;

        if (pullDistance >= triggerDistance) {
            const bulb = document.querySelector('.lamp-bulb');
            const bulbGlow = document.querySelector('.bulb-glow');
            if (bulb) bulb.style.filter = 'brightness(2)';
            if (bulbGlow) {
                bulbGlow.style.transform = 'translate(-50%, -50%) scale(3)';
                bulbGlow.style.opacity = '1';
            }

            setTimeout(() => {
                loginPanel.classList.add('visible');
                if (bulb) bulb.style.filter = 'brightness(1.5)';
            }, 300);
        }

        const springBack = setInterval(() => {
            pullDistance *= 0.8;
            updateCord(pullDistance);
            if (pullDistance < 0.5) {
                clearInterval(springBack);
                resetCord();
            }
        }, 16);
    });
}

// Auth Tabs
function initAuthTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const indicator = document.querySelector('.tab-indicator');

    if (!tabs.length) return;

    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            const tabType = this.dataset.tab;

            if (tabType === 'login') {
                loginForm.classList.remove('hidden');
                registerForm.classList.add('hidden');
                indicator.style.transform = 'translateX(0)';
            } else {
                loginForm.classList.add('hidden');
                registerForm.classList.remove('hidden');
                indicator.style.transform = 'translateX(100%)';
            }
        });
    });
}

// Auth Forms
function initAuthForms() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const googleBtn = document.getElementById('googleLogin');

    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (data.success) {
                    showNotification(data.message, 'success');
                    setTimeout(() => {
                        window.location.href = '/dashboard';
                    }, 1000);
                } else {
                    showNotification(data.message, 'error');
                }
            } catch (error) {
                showNotification('An error occurred. Please try again.', 'error');
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const username = document.getElementById('regUsername').value;
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;

            try {
                const response = await fetch('/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password })
                });

                const data = await response.json();

                if (data.success) {
                    showNotification(data.message, 'success');
                    setTimeout(() => {
                        window.location.href = '/dashboard';
                    }, 1000);
                } else {
                    showNotification(data.message, 'error');
                }
            } catch (error) {
                showNotification('An error occurred. Please try again.', 'error');
            }
        });
    }

    if (googleBtn) {
        googleBtn.addEventListener('click', function() {
            showNotification('Google login integration coming soon!', 'info');
        });
    }
}

// Navigation
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link[data-section]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.dataset.section;
            switchSection(sectionId);
        });
    });
}

function switchSection(sectionId) {
    const sections = document.querySelectorAll('.content-section');
    const navLinks = document.querySelectorAll('.nav-link[data-section]');

    sections.forEach(section => {
        section.classList.remove('active');
    });

    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.dataset.section === sectionId) {
            link.classList.add('active');
        }
    });
}

// Notification
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');

    if (!notification || !notificationText) return;

    notificationText.textContent = message;
    notification.className = 'notification show ' + type;

    const icon = notification.querySelector('i');
    if (icon) {
        if (type === 'error') {
            icon.className = 'fas fa-exclamation-circle';
        } else if (type === 'success') {
            icon.className = 'fas fa-check-circle';
        } else {
            icon.className = 'fas fa-info-circle';
        }
    }

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// ==================== ADMIN FUNCTIONS ====================

// Update Discord Link
async function updateDiscordLink() {
    const link = document.getElementById('adminDiscordLink').value;
    
    try {
        const response = await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ discord_link: link })
        });

        const data = await response.json();

        if (data.success) {
            showNotification('Discord link updated!', 'success');
            // Update all discord links on page
            document.querySelectorAll('[href*="discord"]').forEach(el => {
                if (el.id !== 'adminDiscordLink') {
                    el.href = link;
                }
            });
            const discordText = document.getElementById('discordLinkText');
            if (discordText) discordText.textContent = link;
            const discordBtnText = document.getElementById('discordBtnText');
            if (discordBtnText) discordBtnText.textContent = link;
        } else {
            showNotification(data.message || 'Error updating', 'error');
        }
    } catch (error) {
        showNotification('Error updating Discord link', 'error');
    }
}

// Update Site Name
async function updateSiteName() {
    const name = document.getElementById('adminSiteName').value;
    
    try {
        const response = await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ site_name: name })
        });

        const data = await response.json();

        if (data.success) {
            showNotification('Site name updated! Refresh to see changes.', 'success');
        } else {
            showNotification(data.message || 'Error updating', 'error');
        }
    } catch (error) {
        showNotification('Error updating site name', 'error');
    }
}

// Update Welcome Message
async function updateWelcomeMsg() {
    const msg = document.getElementById('adminWelcomeMsg').value;
    
    try {
        const response = await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ welcome_message: msg })
        });

        const data = await response.json();

        if (data.success) {
            showNotification('Welcome message updated! Refresh to see changes.', 'success');
        } else {
            showNotification(data.message || 'Error updating', 'error');
        }
    } catch (error) {
        showNotification('Error updating welcome message', 'error');
    }
}

// Toggle Maintenance Mode
async function toggleMaintenance() {
    const btn = document.getElementById('maintenanceToggle');
    const isOn = btn.classList.contains('on');
    const newValue = isOn ? 'false' : 'true';
    
    try {
        const response = await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ maintenance_mode: newValue })
        });

        const data = await response.json();

        if (data.success) {
            btn.classList.toggle('on');
            btn.classList.toggle('off');
            btn.textContent = newValue === 'true' ? 'ON' : 'OFF';
            showNotification(`Maintenance mode ${newValue === 'true' ? 'enabled' : 'disabled'}!`, 'success');
        }
    } catch (error) {
        showNotification('Error toggling maintenance mode', 'error');
    }
}

// Load Users
async function loadUsers() {
    const userList = document.getElementById('adminUserList');
    if (!userList) return;

    try {
        const response = await fetch('/api/users');
        const users = await response.json();

        userList.innerHTML = users.map(user => `
            <div class="user-list-item">
                <div class="user-info">
                    <span class="username">${user.username}</span>
                    <span class="email">${user.email}</span>
                </div>
                <span class="user-badge ${user.is_admin ? 'admin' : 'user'}" 
                      onclick="toggleUserAdmin(${user.id})" 
                      style="cursor: pointer;">
                    ${user.is_admin ? 'ADMIN' : 'USER'}
                </span>
            </div>
        `).join('');
    } catch (error) {
        userList.innerHTML = '<p style="color: var(--text-muted);">Error loading users</p>';
    }
}

// Toggle User Admin Status
async function toggleUserAdmin(userId) {
    try {
        const response = await fetch(`/api/users/${userId}/toggle-admin`, {
            method: 'POST'
        });

        const data = await response.json();

        if (data.success) {
            showNotification(data.message, 'success');
            loadUsers();
        } else {
            showNotification(data.message || 'Error updating user', 'error');
        }
    } catch (error) {
        showNotification('Error updating user', 'error');
    }
}

// Load Stats
async function loadStats() {
    try {
        const response = await fetch('/api/stats');
        const stats = await response.json();

        const statUsers = document.getElementById('statUsers');
        const statGames = document.getElementById('statGames');

        if (statUsers) statUsers.textContent = stats.total_users;
        if (statGames) statGames.textContent = stats.total_games;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// ==================== TEAM MANAGEMENT ====================

function openAddMemberModal() {
    document.getElementById('teamModalTitle').textContent = 'ADD TEAM MEMBER';
    document.getElementById('editMemberId').value = '';
    document.getElementById('memberName').value = '';
    document.getElementById('memberRole').value = '';
    document.getElementById('memberIcon').value = 'fa-user';
    document.getElementById('teamMemberModal').classList.add('active');
}

function editTeamMember(id, name, role, icon) {
    document.getElementById('teamModalTitle').textContent = 'EDIT TEAM MEMBER';
    document.getElementById('editMemberId').value = id;
    document.getElementById('memberName').value = name;
    document.getElementById('memberRole').value = role;
    document.getElementById('memberIcon').value = icon;
    document.getElementById('teamMemberModal').classList.add('active');
}

function closeTeamModal() {
    document.getElementById('teamMemberModal').classList.remove('active');
}

async function saveTeamMember() {
    const id = document.getElementById('editMemberId').value;
    const name = document.getElementById('memberName').value;
    const role = document.getElementById('memberRole').value;
    const icon = document.getElementById('memberIcon').value;

    if (!name || !role) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    const url = id ? `/api/team/${id}` : '/api/team';
    const method = id ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, role, icon })
        });

        const data = await response.json();

        if (data.success) {
            showNotification(data.message, 'success');
            closeTeamModal();
            setTimeout(() => location.reload(), 1000);
        } else {
            showNotification(data.message || 'Error saving', 'error');
        }
    } catch (error) {
        showNotification('Error saving team member', 'error');
    }
}

async function deleteTeamMember(id) {
    if (!confirm('Are you sure you want to remove this team member?')) return;

    try {
        const response = await fetch(`/api/team/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            showNotification(data.message, 'success');
            setTimeout(() => location.reload(), 1000);
        } else {
            showNotification(data.message || 'Error deleting', 'error');
        }
    } catch (error) {
        showNotification('Error removing team member', 'error');
    }
}

// ==================== GAME FUNCTIONS ====================

let currentGame = null;
let gameLoop = null;
let gameState = {
    score: 0,
    isRunning: false,
    isPaused: false
};

function openGame(gameName) {
    const modal = document.getElementById('gameModal');
    const title = document.getElementById('gameTitle');
    const canvas = document.getElementById('gameCanvas');
    const memoryGrid = document.getElementById('memoryGrid');

    modal.classList.add('active');
    currentGame = gameName;
    gameState.score = 0;
    updateScore();

    document.getElementById('startBtn').style.display = 'inline-flex';
    document.getElementById('pauseBtn').style.display = 'none';
    document.getElementById('restartBtn').style.display = 'none';

    switch(gameName) {
        case 'snake':
            title.textContent = 'SNAKE GAME';
            canvas.style.display = 'block';
            memoryGrid.style.display = 'none';
            canvas.width = 600;
            canvas.height = 400;
            break;
        case 'memory':
            title.textContent = 'MEMORY GAME';
            canvas.style.display = 'none';
            memoryGrid.style.display = 'grid';
            initMemoryGame();
            break;
        case 'space':
            title.textContent = 'SPACE SHOOTER';
            canvas.style.display = 'block';
            memoryGrid.style.display = 'none';
            canvas.width = 600;
            canvas.height = 400;
            break;
    }
}

function closeGame() {
    const modal = document.getElementById('gameModal');
    modal.classList.remove('active');
    
    if (gameLoop) {
        cancelAnimationFrame(gameLoop);
        gameLoop = null;
    }
    
    gameState.isRunning = false;
    currentGame = null;
}

function startGame() {
    gameState.isRunning = true;
    gameState.isPaused = false;

    document.getElementById('startBtn').style.display = 'none';
    document.getElementById('pauseBtn').style.display = 'inline-flex';
    document.getElementById('restartBtn').style.display = 'inline-flex';

    switch(currentGame) {
        case 'snake':
            initSnakeGame();
            break;
        case 'space':
            initSpaceGame();
            break;
    }
}

function pauseGame() {
    gameState.isPaused = !gameState.isPaused;
    const pauseBtn = document.getElementById('pauseBtn');
    pauseBtn.innerHTML = gameState.isPaused ? 
        '<i class="fas fa-play"></i> RESUME' : 
        '<i class="fas fa-pause"></i> PAUSE';
}

function restartGame() {
    gameState.score = 0;
    updateScore();
    
    if (currentGame === 'memory') {
        initMemoryGame();
    } else {
        startGame();
    }
}

function updateScore() {
    document.getElementById('currentScore').textContent = gameState.score;
}

async function saveScore(gameName, score) {
    try {
        await fetch('/save-score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ game_name: gameName, score: score })
        });
    } catch (error) {
        console.error('Error saving score:', error);
    }
}