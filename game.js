// Configure base API URL
const API_BASE_URL = 'http://localhost:3002';

// Game state management
const gameState = {
    player: null,
    gameStarted: false,
    availablePlanets: [],
    availableShips: [],
    currentLocation: null
};

async function initializeGame() {
    // Check server status
    try {
        const statusResponse = await fetch(`${API_BASE_URL}/api/game/status`);
        const statusData = await statusResponse.json();
        console.log('Game server status:', statusData);
        
        // Load planets
        const planetsResponse = await fetch(`${API_BASE_URL}/api/planets`);
        gameState.availablePlanets = await planetsResponse.json();
        
        // Load ships
        const shipsResponse = await fetch(`${API_BASE_URL}/api/ships`);
        gameState.availableShips = await shipsResponse.json();
        
        // Show character creation
        showCharacterCreation();
        
        gameState.gameStarted = true;
    } catch (error) {
        console.error('Failed to connect to game server:', error);
        showErrorMessage('Failed to connect to game server. Please try again later.');
    }
}

async function createCharacter(name, background, appearance) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/players`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, background, appearance })
        });
        
        if (!response.ok) {
            throw new Error('Failed to create character');
        }
        
        gameState.player = await response.json();
        updatePlayerInfo();
        showGameInterface();
    } catch (error) {
        console.error('Error creating character:', error);
        showErrorMessage('Failed to create character. Please try again.');
    }
}

async function simulateCombat(enemyType) {
    if (!gameState.player) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/combat/simulate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                playerId: gameState.player.id, 
                enemyType: enemyType 
            })
        });
        
        if (!response.ok) {
            throw new Error('Combat simulation failed');
        }
        
        const result = await response.json();
        updateCombatResults(result);
        updatePlayerInfo();
        
        if (result.level_up) {
            showLevelUpMessage();
        }
    } catch (error) {
        console.error('Combat error:', error);
        showErrorMessage('Combat simulation failed. Please try again.');
    }
}

async function createOutpost(planetId, name, outpostType) {
    if (!gameState.player) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/outposts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                playerId: gameState.player.id,
                planetId: planetId,
                name: name,
                type: outpostType
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to create outpost');
        }
        
        const newOutpost = await response.json();
        updateOutpostsList();
        showSuccessMessage(`Outpost "${name}" created successfully!`);
    } catch (error) {
        console.error('Error creating outpost:', error);
        showErrorMessage('Failed to create outpost. Please try again.');
    }
}

async function updatePlayerInfo() {
    if (!gameState.player) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/players/${gameState.player.id}`);
        if (!response.ok) {
            throw new Error('Failed to update player info');
        }
        
        gameState.player = await response.json();
        
        // Update UI elements
        document.getElementById('player-name').textContent = gameState.player.name;
        document.getElementById('player-level').textContent = `Level ${gameState.player.level}`;
        document.getElementById('player-health').textContent = `${gameState.player.health}/100`;
        document.getElementById('player-credits').textContent = `Credits: ${gameState.player.credits}`;
        document.getElementById('player-experience').textContent = `${gameState.player.experience}/${gameState.player.level * 100}`;
        
        // Update health bar
        const healthPercent = Math.max(0, Math.min(100, gameState.player.health));
        const healthBar = document.getElementById('health-bar-inner');
        healthBar.style.width = `${healthPercent}%`;
        
        // Change color based on health
        if (healthPercent < 25) {
            healthBar.style.background = 'linear-gradient(to right, #ff0000, #ff4040)';
        } else if (healthPercent < 50) {
            healthBar.style.background = 'linear-gradient(to right, #ff4000, #ff8040)';
        } else {
            healthBar.style.background = 'linear-gradient(to right, #ff4040, #ff8080)';
        }
        
        // Update XP bar
        const xpMax = gameState.player.level * 100;
        const xpPercent = Math.min(100, (gameState.player.experience / xpMax) * 100);
        document.getElementById('xp-bar-inner').style.width = `${xpPercent}%`;
    } catch (error) {
        console.error('Error updating player info:', error);
    }
}

async function updateOutpostsList() {
    if (!gameState.player) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/outposts`);
        if (!response.ok) {
            throw new Error('Failed to fetch outposts');
        }
        
        const outposts = await response.json();
        displayOutposts(outposts);
    } catch (error) {
        console.error('Error updating outposts list:', error);
    }
}

// UI Helper functions
function showErrorMessage(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

function showSuccessMessage(message) {
    const successDiv = document.getElementById('success-message');
    successDiv.textContent = message;
    successDiv.style.display = 'block';
    setTimeout(() => {
        successDiv.style.display = 'none';
    }, 3000);
}

function showLevelUpMessage() {
    showSuccessMessage(`Congratulations! You've reached level ${gameState.player.level}!`);
}

function displayOutposts(outposts) {
    const outpostsList = document.getElementById('outposts-list');
    outpostsList.innerHTML = '';
    
    if (outposts.length === 0) {
        outpostsList.innerHTML = '<p class="no-outposts">You haven\'t established any outposts yet.</p>';
        return;
    }
    
    outposts.forEach(outpost => {
        // Find the planet name
        const planet = gameState.availablePlanets.find(p => p.id === outpost.planetId) || { name: 'Unknown' };
        
        const outpostElement = document.createElement('div');
        outpostElement.className = 'outpost-item';
        outpostElement.innerHTML = `
            <div class="outpost-header">
                <h3>${outpost.name}</h3>
                <span class="outpost-level">Level ${outpost.level}</span>
            </div>
            <div class="outpost-details">
                <p><strong>Type:</strong> ${outpost.type}</p>
                <p><strong>Location:</strong> ${planet.name}</p>
                <p><strong>Production:</strong> ${outpost.production} units/day</p>
            </div>
            <div class="outpost-actions">
                <button class="outpost-btn" onclick="upgradeOutpost(${outpost.id})">Upgrade</button>
                <button class="outpost-btn" onclick="manageOutpost(${outpost.id})">Manage</button>
            </div>
        `;
        outpostsList.appendChild(outpostElement);
    });
}

// Placeholder functions for outpost management
function upgradeOutpost(outpostId) {
    showSuccessMessage('Outpost upgrade feature coming soon!');
}

function manageOutpost(outpostId) {
    showSuccessMessage('Outpost management feature coming soon!');
}

function showHeroSection() {
    document.getElementById('character-creation').style.display = 'none';
    document.getElementById('game-interface').style.display = 'none';
    // Show hero section by default
}

function showCharacterCreation() {
    document.getElementById('character-creation').style.display = 'block';
    document.getElementById('game-interface').style.display = 'none';
}

function showGameInterface() {
    document.getElementById('character-creation').style.display = 'none';
    document.getElementById('game-interface').style.display = 'block';
    
    // Show combat panel by default
    showCombatPanel();
    
    // Populate planets list for travel panel
    populatePlanetsList();
}

function showCombatPanel() {
    hideAllPanels();
    document.getElementById('combat-panel').classList.remove('hidden');
}

function showOutpostsPanel() {
    hideAllPanels();
    document.getElementById('outposts-panel').classList.remove('hidden');
    updateOutpostsList();
}

function showTravelPanel() {
    hideAllPanels();
    document.getElementById('travel-panel').classList.remove('hidden');
}

function showInventoryPanel() {
    hideAllPanels();
    document.getElementById('inventory-panel').classList.remove('hidden');
}

function hideAllPanels() {
    const panels = document.querySelectorAll('.game-panel');
    panels.forEach(panel => {
        panel.classList.add('hidden');
    });
}

function populatePlanetsList() {
    const planetsList = document.getElementById('planets-list');
    planetsList.innerHTML = '';
    
    gameState.availablePlanets.forEach(planet => {
        const isCurrentLocation = gameState.player && 
                                 gameState.player.location && 
                                 gameState.player.location.id === planet.id;
        
        const planetElement = document.createElement('div');
        planetElement.className = `planet-option ${isCurrentLocation ? 'current-planet' : ''}`;
        planetElement.innerHTML = `
            <h3>${planet.name}</h3>
            <p>Environment: ${planet.environment}</p>
            <p>Resources: ${planet.resources.join(', ')}</p>
            ${isCurrentLocation ? 
                '<div class="current-location-badge">Current Location</div>' : 
                `<button class="travel-btn" onclick="travelToPlanet(${planet.id})">Travel Here</button>`
            }
        `;
        planetsList.appendChild(planetElement);
    });
}

async function travelToPlanet(planetId) {
    if (!gameState.player) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/players/${gameState.player.id}/location`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ planetId })
        });
        
        if (!response.ok) {
            throw new Error('Failed to travel to planet');
        }
        
        gameState.player = await response.json();
        updatePlayerInfo();
        populatePlanetsList();
        showSuccessMessage(`Traveled to ${gameState.player.location.name}`);
    } catch (error) {
        console.error('Error traveling to planet:', error);
        showErrorMessage('Failed to travel to planet. Please try again.');
    }
}

function showOutpostCreationForm() {
    // Create a form for outpost creation
    const formHTML = `
        <div id="outpost-form" class="modal">
            <div class="modal-content">
                <h3>Create New Outpost</h3>
                <form id="new-outpost-form">
                    <input type="text" id="outpost-name" placeholder="Outpost Name" required>
                    <select id="outpost-type" required>
                        <option value="Research Station">Research Station</option>
                        <option value="Mining Facility">Mining Facility</option>
                        <option value="Defense Outpost">Defense Outpost</option>
                        <option value="Colony">Colony</option>
                    </select>
                    <select id="outpost-planet" required>
                        ${gameState.availablePlanets.map(planet => 
                            `<option value="${planet.id}">${planet.name} (${planet.environment})</option>`
                        ).join('')}
                    </select>
                    <button type="submit">Create Outpost</button>
                    <button type="button" onclick="closeOutpostForm()">Cancel</button>
                </form>
            </div>
        </div>
    `;
    
    // Add the form to the page
    const formContainer = document.createElement('div');
    formContainer.innerHTML = formHTML;
    document.body.appendChild(formContainer);
    
    // Add event listener to the form
    document.getElementById('new-outpost-form').addEventListener('submit', function(event) {
        event.preventDefault();
        const name = document.getElementById('outpost-name').value;
        const type = document.getElementById('outpost-type').value;
        const planetId = parseInt(document.getElementById('outpost-planet').value);
        
        createOutpost(planetId, name, type);
        closeOutpostForm();
    });
}

function closeOutpostForm() {
    const form = document.getElementById('outpost-form');
    if (form) {
        form.parentNode.removeChild(form);
    }
}

function updateCombatResults(result) {
    const resultHTML = `
        <div class="combat-result ${result.victory ? 'success' : 'failure'}">
            <div class="result-header">
                <span class="result-icon">${result.victory ? '🏆' : '💥'}</span>
                <h3>${result.victory ? 'Victory!' : 'Defeat!'}</h3>
            </div>
            <div class="result-details">
                <p><span class="detail-label">Damage Taken:</span> <span class="damage-value">${result.playerDamage}</span></p>
                <p><span class="detail-label">Experience Gained:</span> <span class="xp-value">${result.experienceGained}</span></p>
                <p><span class="detail-label">Current Health:</span> <span class="health-value">${result.currentHealth}/100</span></p>
                ${result.levelUp ? '<p class="level-up">⭐ Level Up! You are now level ' + result.currentLevel + '! ⭐</p>' : ''}
            </div>
        </div>
    `;
    
    const combatResults = document.getElementById('combat-results');
    combatResults.innerHTML = resultHTML;
    
    // Update player info
    updatePlayerInfo();
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the game
    initializeGame();
    
    // Add event listeners for combat buttons
    document.getElementById('fight-pirates').addEventListener('click', () => simulateCombat('pirate'));
    document.getElementById('fight-military').addEventListener('click', () => simulateCombat('military'));
    document.getElementById('fight-aliens').addEventListener('click', () => simulateCombat('alien'));
});
