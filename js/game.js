/**
 * Main game logic for Runaway Hotdog
 */

document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const canvas = document.getElementById('game-canvas');
    const startButton = document.getElementById('start-button');
    const restartButton = document.getElementById('restart-button');
    const controlsButton = document.getElementById('controls-button');
    const scoreElement = document.getElementById('score');
    const finalScoreElement = document.getElementById('final-score');
    const gameMenu = document.getElementById('game-menu');
    const gameOverMenu = document.getElementById('game-over');
    
    // Prevent the browser's context menu on right click
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    
    // Initialize the game engine
    const engine = new GameEngine('game-canvas', 800, 600);
    
    // Add utility objects
    const textDisplay = new TextDisplay(engine);
    const particles = new ParticleSystem(engine);
    
    // Game state
    let currentLevel = 0;
    engine.score = 0;
    
    // Hook up game events
    setupGameEvents();
    
    // Create the initial level
    function loadLevel(levelIndex) {
        // Clear any existing objects
        engine.clearObjects();
        
        // Create the level
        const levelData = createLevel(engine, levelIndex);
        
        // Create the player at the starting position
        const player = new HotdogPlayer(
            levelData.playerStart.x,
            levelData.playerStart.y
        );
        
        // Store the start position for respawning
        player.startPosition = {
            x: levelData.playerStart.x,
            y: levelData.playerStart.y
        };
        
        engine.addObject(player);
        engine.setPlayer(player);
        player.engine = engine;
        
        // Show level intro text
        textDisplay.showMessage(
            `Level ${levelIndex + 1}`,
            engine.canvas.width / 2,
            engine.canvas.height / 3,
            {
                font: 'bold 48px Comic Sans MS',
                color: 'white',
                duration: 2,
                shadow: true
            }
        );
        
        // Update score display
        updateScoreDisplay();
    }
    
    // Set up game event handlers
    function setupGameEvents() {
        // Start/restart button
        startButton.addEventListener('click', startGame);
        restartButton.addEventListener('click', startGame);
        
        // Controls button
        controlsButton.addEventListener('click', showControls);
        
        // Game state extensions
        engine.gameOver = gameOver;
        engine.levelComplete = false;
        
        // Level completion detection
        engine.checkLevelComplete = function() {
            if (this.levelComplete) {
                this.levelComplete = false;
                currentLevel++;
                
                // Show level complete message
                textDisplay.showMessage(
                    'Level Complete!',
                    engine.canvas.width / 2,
                    engine.canvas.height / 3,
                    {
                        font: 'bold 32px Comic Sans MS',
                        color: 'white',
                        duration: 2,
                        shadow: true
                    }
                );
                
                // Wait before loading the next level
                setTimeout(() => {
                    loadLevel(currentLevel);
                }, 2000);
            }
        };
    }
    
    // Start a new game
    function startGame() {
        // Reset game state
        currentLevel = 0;
        engine.score = 0;
        
        // Hide menus
        gameMenu.classList.add('hidden');
        gameOverMenu.classList.add('hidden');
        
        // Load the first level
        loadLevel(currentLevel);
        
        // Start the game loop
        engine.start();
    }
    
    // Game over handler
    function gameOver() {
        // Display game over screen
        finalScoreElement.textContent = engine.score;
        gameOverMenu.classList.remove('hidden');
        
        // Stop the game loop
        engine.stop();
    }
    
    // Show controls dialog
    function showControls() {
        alert(
            'Controls:\n\n' +
            'Arrow Keys: Move left/right\n' +
            'Z: Jump\n' +
            'X: Shoot Ketchup\n' +
            'C: Shoot Mustard\n' +
            'V: Shoot Relish\n' +
            'Up Arrow: Break blocks\n\n' +
            'Gameplay:\n' +
            '- Avoid getting eaten by humans\n' +
            '- Use condiments to stun humans for 5 seconds\n' +
            '- Break blocks by pressing Up Arrow when next to them\n' +
            '- Collect coins to score points and refill condiments\n' +
            '- Reach the flag to complete the level'
        );
    }
    
    // Update the score display
    function updateScoreDisplay() {
        scoreElement.textContent = engine.score;
    }
    
    // Main game loop extension
    const originalUpdate = engine.update;
    engine.update = function(deltaTime) {
        // Call the original update method
        originalUpdate.call(this, deltaTime);
        
        // Check for level completion
        this.checkLevelComplete();
        
        // Update score display
        updateScoreDisplay();
    };
    
    // Show the main menu
    gameMenu.classList.remove('hidden');
});