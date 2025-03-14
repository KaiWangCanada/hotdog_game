/**
 * Level design for Runaway Hotdog
 */

class Level {
    constructor(engine) {
        this.engine = engine;
        this.width = 0;
        this.height = 0;
        this.blocks = [];
        this.enemies = [];
        this.playerStart = { x: 50, y: 50 };
        
        // Block size
        this.blockSize = 40;
    }
    
    // Load a level from a tile map
    loadFromMap(map, config) {
        const rows = map.length;
        const cols = map[0].length;
        
        this.width = cols * this.blockSize;
        this.height = rows * this.blockSize;
        
        this.engine.setLevelBounds(this.width, this.height);
        
        // Clear any existing objects
        this.blocks = [];
        this.enemies = [];
        
        // Parse the map
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const tile = map[row][col];
                const x = col * this.blockSize;
                const y = row * this.blockSize;
                
                switch (tile) {
                    case '#': // Solid block
                        this.createBlock(x, y, 'brick');
                        break;
                    case 'B': // Breakable block
                        this.createBlock(x, y, 'breakable');
                        break;
                    case 'C': // Coin
                        this.createCoin(x, y);
                        break;
                    case 'P': // Player start
                        this.playerStart = { x, y };
                        break;
                    case 'E': // Basic enemy
                        this.createEnemy(x, y, 'basic');
                        break;
                    case 'H': // Hungry enemy
                        this.createEnemy(x, y, 'hungry');
                        break;
                    case 'G': // Stomping enemy
                        this.createEnemy(x, y, 'stomper');
                        break;
                    case '!': // Exit point
                        this.createExit(x, y);
                        break;
                }
            }
        }
        
        // Apply any additional configuration
        if (config) {
            if (config.backgroundColor) {
                this.engine.canvas.style.backgroundColor = config.backgroundColor;
            }
            if (config.gravity) {
                this.engine.gravity = config.gravity;
            }
        }
        
        return {
            width: this.width,
            height: this.height,
            playerStart: this.playerStart
        };
    }
    
    createBlock(x, y, type = 'brick') {
        const block = new GameObject(x, y, this.blockSize, this.blockSize);
        block.type = 'block';
        block.blockType = type;
        block.solid = true;
        
        // Appearance
        block.render = (ctx) => {
            if (type === 'brick') {
                // Brick block
                ctx.fillStyle = '#CD853F';
                ctx.fillRect(x, y, this.blockSize, this.blockSize);
                
                // Brick pattern
                ctx.strokeStyle = '#8B4513';
                ctx.lineWidth = 2;
                
                // Horizontal lines
                for (let i = 0; i <= 1; i++) {
                    const lineY = y + i * (this.blockSize / 2);
                    ctx.beginPath();
                    ctx.moveTo(x, lineY);
                    ctx.lineTo(x + this.blockSize, lineY);
                    ctx.stroke();
                }
                
                // Vertical lines
                for (let i = 0; i <= 2; i++) {
                    const lineX = x + i * (this.blockSize / 2);
                    ctx.beginPath();
                    ctx.moveTo(lineX, y);
                    ctx.lineTo(lineX, y + this.blockSize);
                    ctx.stroke();
                }
            } else if (type === 'breakable') {
                // Breakable block
                ctx.fillStyle = '#DEB887';
                ctx.fillRect(x, y, this.blockSize, this.blockSize);
                
                // Crack pattern
                ctx.strokeStyle = '#8B4513';
                ctx.lineWidth = 2;
                
                // Draw a crack pattern
                ctx.beginPath();
                ctx.moveTo(x + this.blockSize * 0.2, y + this.blockSize * 0.2);
                ctx.lineTo(x + this.blockSize * 0.8, y + this.blockSize * 0.8);
                ctx.moveTo(x + this.blockSize * 0.8, y + this.blockSize * 0.2);
                ctx.lineTo(x + this.blockSize * 0.2, y + this.blockSize * 0.8);
                ctx.stroke();
            }
        };
        
        // Behavior for breakable blocks
        if (type === 'breakable') {
            block.health = 1;
            block.onBreak = () => {
                // Create a breaking animation
                const particles = new ParticleSystem(this.engine);
                particles.createExplosion(
                    x + this.blockSize / 2, 
                    y + this.blockSize / 2, 
                    {
                        count: 15,
                        color: '#DEB887',
                        size: 5,
                        speed: 120,
                        lifetime: 0.8,
                        gravity: 300
                    }
                );
                
                // Remove the block
                block.destroy();
                
                // Occasionally spawn a coin
                if (Math.random() < 0.3) {
                    this.createCoin(x, y);
                }
            };
        }
        
        // Add block to the engine and our collection
        this.engine.addObject(block);
        this.blocks.push(block);
        
        return block;
    }
    
    createCoin(x, y) {
        const coin = new GameObject(
            x + this.blockSize / 4, 
            y + this.blockSize / 4, 
            this.blockSize / 2, 
            this.blockSize / 2
        );
        coin.type = 'coin';
        coin.value = 100;
        coin.solid = false;
        coin.zIndex = 5;
        
        // Bouncing animation
        const baseY = y + this.blockSize / 4;
        let animationTime = 0;
        const animationSpeed = 2;
        const bounceHeight = 5;
        
        coin.update = (deltaTime) => {
            animationTime += deltaTime * animationSpeed;
            coin.y = baseY + Math.sin(animationTime) * bounceHeight;
        };
        
        // Appearance
        coin.render = (ctx) => {
            // Gold coin
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(
                coin.x + coin.width / 2,
                coin.y + coin.height / 2,
                coin.width / 2,
                0, Math.PI * 2
            );
            ctx.fill();
            
            // Highlight
            ctx.fillStyle = '#FFF8DC';
            ctx.beginPath();
            ctx.arc(
                coin.x + coin.width * 0.3,
                coin.y + coin.height * 0.3,
                coin.width * 0.15,
                0, Math.PI * 2
            );
            ctx.fill();
        };
        
        this.engine.addObject(coin);
        return coin;
    }
    
    createEnemy(x, y, type = 'basic') {
        let enemy;
        
        switch (type) {
            case 'basic':
                enemy = new BasicEnemy(x, y, this.blockSize, this.blockSize * 1.5);
                break;
            case 'hungry':
                enemy = new HungryEnemy(x, y, this.blockSize, this.blockSize * 1.5);
                break;
            case 'stomper':
                enemy = new StomperEnemy(x, y, this.blockSize * 1.5, this.blockSize * 1.5);
                break;
            default:
                enemy = new BasicEnemy(x, y, this.blockSize, this.blockSize * 1.5);
        }
        
        this.engine.addObject(enemy);
        this.enemies.push(enemy);
        
        return enemy;
    }
    
    createExit(x, y) {
        const exit = new GameObject(x, y, this.blockSize, this.blockSize * 1.5);
        exit.type = 'exit';
        exit.solid = false;
        exit.zIndex = 1;
        
        // Flag appearance
        exit.render = (ctx) => {
            // Pole
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(
                exit.x + exit.width / 2 - 5,
                exit.y,
                10,
                exit.height
            );
            
            // Flag
            ctx.fillStyle = '#FF6347';
            ctx.beginPath();
            ctx.moveTo(exit.x + exit.width / 2, exit.y + 10);
            ctx.lineTo(exit.x + exit.width, exit.y + 10);
            ctx.lineTo(exit.x + exit.width / 2, exit.y + 40);
            ctx.closePath();
            ctx.fill();
        };
        
        this.engine.addObject(exit);
        return exit;
    }
}

// Level data
const LEVELS = [
    // Level 1 - Tutorial
    {
        map: [
            "################################",
            "#                              #",
            "#                              #",
            "#        C      C    C         #",
            "#       ###    ###  ###        #",
            "#                              #",
            "#   P                          #",
            "#  ###        B   B   B        #",
            "#                              #",
            "#         BB                  !#",
            "#        ####         E        #",
            "#                    ###       #",
            "#   C     C    C      C        #",
            "# ####   ###  ###    ###       #",
            "#                              #",
            "################################"
        ],
        config: {
            backgroundColor: '#87CEEB',
            gravity: 0.5
        }
    },
    
    // Level 2 - More enemies
    {
        map: [
            "################################",
            "#                              #",
            "#                              #",
            "#    P        C    C    C      #",
            "#   ###      ###  ###  ###     #",
            "#                              #",
            "#      E                       #",
            "#     ###                      #",
            "#                 B B B        #",
            "#           H               C  #",
            "#          ###             ### #",
            "#                      G       #",
            "# C    C    C    C     ###     #",
            "####  ###  ###  ###             #",
            "#                           !  #",
            "################################"
        ],
        config: {
            backgroundColor: '#ADD8E6',
            gravity: 0.5
        }
    },
    
    // Level 3 - Complex terrain
    {
        map: [
            "################################",
            "#      C                 C     #",
            "#     ###                ###   #",
            "#                              #",
            "# P          C                 #",
            "####        ###                #",
            "#                              #",
            "#       G                 C    #",
            "#      ###               ###   #",
            "#                              #",
            "#          H     C             #",
            "#         ###   ###            #",
            "#                     B B B    #",
            "#  C   C                     B #",
            "# ### ###    E     E     E   B #",
            "#                ###########  !#",
            "################################"
        ],
        config: {
            backgroundColor: '#FFA07A',
            gravity: 0.6
        }
    }
];

// Create a level from the predefined data
function createLevel(engine, levelIndex) {
    const levelData = LEVELS[levelIndex % LEVELS.length];
    const level = new Level(engine);
    return level.loadFromMap(levelData.map, levelData.config);
}