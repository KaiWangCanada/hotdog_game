/**
 * Player class for Runaway Hotdog
 * Implements hotdog physics, controls, and condiment attacks
 */

class HotdogPlayer extends GameObject {
    constructor(x, y) {
        // Create a hotdog-shaped player
        super(x, y, 40, 20);
        this.type = 'player';
        
        // Physics properties
        this.speed = 200;
        this.jumpForce = 400;
        this.maxVelX = 200;
        this.maxVelY = 600;
        this.friction = 0.8;
        this.grounded = false;
        
        // Player state
        this.direction = 1; // 1 for right, -1 for left
        this.jumping = false;
        this.breaking = false;
        this.invulnerable = false;
        this.invulnerableTime = 0;
        this.invulnerableDuration = 2; // Increased from 1.5
        
        // Lives system
        this.lives = 3;
        this.livesElement = document.getElementById('lives-count');
        this.startPosition = { x, y };
        
        // Condiments
        this.condiments = {
            ketchup: 3,
            mustard: 3,
            relish: 3
        };
        
        // Condiment cooldowns (in seconds)
        this.cooldowns = {
            ketchup: 0,
            mustard: 0,
            relish: 0
        };
        
        // UI references
        this.ketchupCounter = document.getElementById('ketchup-count');
        this.mustardCounter = document.getElementById('mustard-count');
        this.relishCounter = document.getElementById('relish-count');
        
        // Animation state
        this.animState = 'idle';
        this.animTimer = 0;
        
        // Set z-index so player renders on top of most objects
        this.zIndex = 10;
    }
    
    update(deltaTime, engine) {
        this.handleInput(engine);
        this.applyPhysics(deltaTime, engine);
        this.updateCooldowns(deltaTime);
        this.checkCollisions(engine);
        
        // Update invulnerability
        if (this.invulnerable) {
            this.invulnerableTime += deltaTime;
            if (this.invulnerableTime >= this.invulnerableDuration) {
                this.invulnerable = false;
                this.invulnerableTime = 0;
            }
        }
        
        // Update UI counters
        this.updateUI();
    }
    
    render(ctx) {
        // Flashing effect when invulnerable
        if (this.invulnerable && Math.floor(this.invulnerableTime * 10) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        // Draw the hotdog body
        ctx.fillStyle = '#FFD700'; // Hotdog bun color
        ctx.beginPath();
        ctx.ellipse(
            this.x + this.width / 2,
            this.y + this.height / 2,
            this.width / 2,
            this.height / 2,
            0, 0, Math.PI * 2
        );
        ctx.fill();
        
        // Draw hotdog sausage inside
        ctx.fillStyle = '#FF6347'; // Sausage color
        ctx.beginPath();
        ctx.ellipse(
            this.x + this.width / 2,
            this.y + this.height / 2,
            this.width / 3,
            this.height / 3,
            0, 0, Math.PI * 2
        );
        ctx.fill();
        
        // Draw eyes
        ctx.fillStyle = 'black';
        
        // Left eye
        ctx.beginPath();
        ctx.arc(
            this.x + this.width / 2 - 10 * this.direction,
            this.y + this.height / 2 - 2,
            3, 0, Math.PI * 2
        );
        ctx.fill();
        
        // Right eye
        ctx.beginPath();
        ctx.arc(
            this.x + this.width / 2 - 5 * this.direction,
            this.y + this.height / 2 - 2,
            3, 0, Math.PI * 2
        );
        ctx.fill();
        
        // Draw mouth based on state
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        if (this.breaking) {
            // Determined expression when breaking
            ctx.moveTo(
                this.x + this.width / 2 - 10 * this.direction,
                this.y + this.height / 2 + 6
            );
            ctx.lineTo(
                this.x + this.width / 2,
                this.y + this.height / 2 + 8
            );
        } else if (this.jumping) {
            // Surprised expression when jumping
            ctx.arc(
                this.x + this.width / 2 - 5 * this.direction,
                this.y + this.height / 2 + 6,
                3, 0, Math.PI * 2
            );
        } else {
            // Normal smile
            ctx.arc(
                this.x + this.width / 2 - 5 * this.direction,
                this.y + this.height / 2 + 2,
                5,
                Math.PI * 0.8, Math.PI * 0.2,
                false
            );
        }
        ctx.stroke();
        
        // Reset opacity
        ctx.globalAlpha = 1;
    }
    
    handleInput(engine) {
        // Movement controls
        if (engine.isKeyPressed('ArrowLeft')) {
            this.velX = -this.speed;
            this.direction = -1;
        } else if (engine.isKeyPressed('ArrowRight')) {
            this.velX = this.speed;
            this.direction = 1;
        } else {
            this.velX = 0;
        }
        
        // Jump control
        if (engine.isKeyPressed('KeyZ') && this.grounded) {
            this.jump();
        }
        
        // Condiment shooting controls
        if (engine.isKeyPressed('KeyX') && this.cooldowns.ketchup <= 0 && this.condiments.ketchup > 0) {
            this.shootCondiment('ketchup', engine);
        }
        
        if (engine.isKeyPressed('KeyC') && this.cooldowns.mustard <= 0 && this.condiments.mustard > 0) {
            this.shootCondiment('mustard', engine);
        }
        
        if (engine.isKeyPressed('KeyV') && this.cooldowns.relish <= 0 && this.condiments.relish > 0) {
            this.shootCondiment('relish', engine);
        }
        
        // Breaking blocks
        this.breaking = engine.isKeyPressed('ArrowUp');
    }
    
    applyPhysics(deltaTime, engine) {
        // Apply gravity
        this.velY += engine.gravity * 60 * deltaTime;
        
        // Apply friction to horizontal movement
        this.velX *= this.friction;
        
        // Limit velocity
        this.velX = Math.max(Math.min(this.velX, this.maxVelX), -this.maxVelX);
        this.velY = Math.max(Math.min(this.velY, this.maxVelY), -this.maxVelY);
        
        // Update position with collision checks
        this.x += this.velX * deltaTime;
        
        // Check horizontal collisions
        this.grounded = false;
        
        // Simple collision resolution with blocks
        for (const obj of engine.gameObjects) {
            if (obj.solid && obj !== this && engine.checkCollision(this, obj)) {
                // Handle collision with different objects
                if (obj.type === 'block') {
                    // Resolve horizontal collision
                    if (this.velX > 0) {
                        this.x = obj.x - this.width;
                    } else if (this.velX < 0) {
                        this.x = obj.x + obj.width;
                    }
                    
                    this.velX = 0;
                    
                    // Try to break the block if it's breakable and we're in breaking mode
                    if (this.breaking && obj.blockType === 'breakable') {
                        obj.onBreak && obj.onBreak();
                    }
                }
            }
        }
        
        // Update vertical position separately
        this.y += this.velY * deltaTime;
        
        // Check vertical collisions
        for (const obj of engine.gameObjects) {
            if (obj.solid && obj !== this && engine.checkCollision(this, obj)) {
                // Handle collision with different objects
                if (obj.type === 'block') {
                    // Resolve vertical collision
                    if (this.velY > 0) {
                        this.y = obj.y - this.height;
                        this.grounded = true;
                    } else if (this.velY < 0) {
                        this.y = obj.y + obj.height;
                    }
                    
                    this.velY = 0;
                    
                    // Try to break the block if it's breakable and we're hitting from below
                    if (this.velY < 0 && obj.blockType === 'breakable') {
                        obj.onBreak && obj.onBreak();
                    }
                }
            }
        }
        
        // Reset jumping state when landing
        if (this.grounded) {
            this.jumping = false;
        }
        
        // World bounds
        if (engine.levelWidth) {
            this.x = Math.max(0, Math.min(this.x, engine.levelWidth - this.width));
        }
    }
    
    jump() {
        this.velY = -this.jumpForce;
        this.grounded = false;
        this.jumping = true;
    }
    
    shootCondiment(type, engine) {
        // Decrement condiment count
        this.condiments[type]--;
        
        // Set cooldown
        this.cooldowns[type] = 1.5;
        
        // Create the condiment projectile
        const projectile = new CondimentProjectile(
            this.x + this.width / 2,
            this.y + this.height / 2,
            type,
            this.direction
        );
        
        engine.addObject(projectile);
        
        // Update UI
        this.updateUI();
        
        return projectile;
    }
    
    updateCooldowns(deltaTime) {
        // Update cooldown timers
        for (const type in this.cooldowns) {
            if (this.cooldowns[type] > 0) {
                this.cooldowns[type] -= deltaTime;
            }
        }
    }
    
    checkCollisions(engine) {
        // Check for collectibles and non-solid interactions
        for (const obj of engine.gameObjects) {
            if (!obj.solid && obj !== this && engine.checkCollision(this, obj)) {
                // Handle collision with different objects
                if (obj.type === 'coin') {
                    // Collect the coin
                    engine.score += obj.value;
                    obj.destroy();
                    
                    // Show score popup
                    const textDisplay = new TextDisplay(engine);
                    textDisplay.showMessage(
                        `+${obj.value}`,
                        obj.x + obj.width / 2,
                        obj.y - 20,
                        {
                            color: '#FFD700',
                            font: '16px Comic Sans MS',
                            duration: 1
                        }
                    );
                    
                    // Randomly refill a condiment
                    const condimentTypes = ['ketchup', 'mustard', 'relish'];
                    const randomType = condimentTypes[Math.floor(Math.random() * condimentTypes.length)];
                    
                    if (this.condiments[randomType] < 3) {
                        this.condiments[randomType]++;
                    }
                } else if (obj.type === 'exit') {
                    // Level complete
                    engine.levelComplete = true;
                }
            }
        }
    }
    
    updateUI() {
        // Update condiment counters
        this.ketchupCounter.textContent = this.condiments.ketchup;
        this.mustardCounter.textContent = this.condiments.mustard;
        this.relishCounter.textContent = this.condiments.relish;
        
        // Update lives counter
        if (this.livesElement) {
            this.livesElement.textContent = this.lives;
        }
        
        // Check if we need to respawn after losing a life
        if (this.lives > 0 && this.invulnerable && this.invulnerableTime > 0.1 && !this.active) {
            this.active = true;
            this.respawn();
        }
    }
    
    takeDamage() {
        if (this.invulnerable) return;
        
        // Make player invulnerable for a short time
        this.invulnerable = true;
        this.invulnerableTime = 0;
        
        // Apply knockback
        this.velY = -this.jumpForce * 0.6;
        
        // Decrease lives
        this.lives--;
        
        // Update lives display
        if (this.livesElement) {
            this.livesElement.textContent = this.lives;
        }
        
        // Show damage effect
        const particles = new ParticleSystem(this.engine);
        particles.createExplosion(
            this.x + this.width / 2,
            this.y + this.height / 2,
            {
                count: 15,
                color: '#FF6347',
                size: 3,
                speed: 100,
                lifetime: 0.5,
                gravity: 150
            }
        );
        
        // If out of lives, die
        if (this.lives <= 0) {
            this.die();
            return false;
        }
        
        // Otherwise, respawn at start position
        setTimeout(() => {
            if (this.lives > 0) {
                // Show respawn message
                const textDisplay = new TextDisplay(this.engine);
                textDisplay.showMessage(
                    `Lives: ${this.lives}`,
                    this.x,
                    this.y - 30,
                    {
                        color: 'white',
                        font: '16px Comic Sans MS',
                        duration: 1.5,
                        shadow: true
                    }
                );
            }
        }, 500);
        
        return true;
    }
    
    die(message = 'You got eaten!') {
        // Player death explosion
        const particles = new ParticleSystem(this.engine);
        particles.createExplosion(
            this.x + this.width / 2,
            this.y + this.height / 2,
            {
                count: 30,
                color: '#FF6347',
                size: 5,
                speed: 150,
                lifetime: 1,
                gravity: 200
            }
        );
        
        // Set game over message
        document.getElementById('game-over-message').textContent = message;
        
        // Hide the player
        this.active = false;
        
        // Trigger game over
        this.engine.gameOver();
    }
    
    // Reset player after losing a life
    respawn() {
        // Reset position to level start
        this.x = this.startPosition.x;
        this.y = this.startPosition.y;
        
        // Reset velocities
        this.velX = 0;
        this.velY = 0;
        
        // Reset state
        this.grounded = false;
        this.jumping = false;
        this.invulnerable = true;
        this.invulnerableTime = 0;
        
        // Make temporarily invulnerable for safety
        setTimeout(() => {
            this.invulnerable = false;
        }, 2000);
    }
}

// Condiment projectile class
class CondimentProjectile extends GameObject {
    constructor(x, y, type, direction) {
        super(x, y, 10, 10);
        this.type = 'projectile';
        this.condimentType = type;
        this.solid = false;
        
        // Projectile properties
        this.speed = 400;
        this.lifespan = 2;
        this.age = 0;
        this.direction = direction;
        
        // Set velocity based on direction
        this.velX = this.speed * this.direction;
        
        // Set color and stunDuration based on condiment type
        switch (type) {
            case 'ketchup':
                this.color = '#FF0000';
                this.stunDuration = 5;
                break;
            case 'mustard':
                this.color = '#FFD700';
                this.stunDuration = 5;
                break;
            case 'relish':
                this.color = '#32CD32';
                this.stunDuration = 5;
                break;
        }
        
        // Trailing particles
        this.particleTimer = 0;
    }
    
    update(deltaTime, engine) {
        super.update(deltaTime, engine);
        
        // Update age and destroy if too old
        this.age += deltaTime;
        if (this.age >= this.lifespan) {
            this.destroy();
            return;
        }
        
        // Create trailing particles
        this.particleTimer += deltaTime;
        if (this.particleTimer >= 0.05) {
            this.particleTimer = 0;
            
            const particles = new ParticleSystem(engine);
            particles.createParticle(
                this.x + this.width / 2,
                this.y + this.height / 2,
                {
                    color: this.color,
                    size: 3 + Math.random() * 3,
                    speed: 20,
                    lifetime: 0.5,
                    gravity: 50
                }
            );
        }
        
        // Check collisions with enemies
        for (const obj of engine.gameObjects) {
            if (obj.type === 'enemy' && !obj.stunned && engine.checkCollision(this, obj)) {
                // Stun the enemy
                obj.stun(this.stunDuration);
                
                // Create splash effect
                const particles = new ParticleSystem(engine);
                particles.createExplosion(
                    this.x + this.width / 2,
                    this.y + this.height / 2,
                    {
                        count: 15,
                        color: this.color,
                        size: 4,
                        speed: 100,
                        lifetime: 0.8,
                        gravity: 100
                    }
                );
                
                // Destroy the projectile
                this.destroy();
                break;
            }
        }
        
        // Destroy if hitting a solid block
        for (const obj of engine.gameObjects) {
            if (obj.solid && obj.type === 'block' && engine.checkCollision(this, obj)) {
                // Create splash effect
                const particles = new ParticleSystem(engine);
                particles.createExplosion(
                    this.x + this.width / 2,
                    this.y + this.height / 2,
                    {
                        count: 10,
                        color: this.color,
                        size: 3,
                        speed: 80,
                        lifetime: 0.6,
                        gravity: 100
                    }
                );
                
                this.destroy();
                break;
            }
        }
    }
    
    render(ctx) {
        // Draw the condiment projectile
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(
            this.x + this.width / 2,
            this.y + this.height / 2,
            this.width / 2,
            0, Math.PI * 2
        );
        ctx.fill();
        
        // Draw a highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(
            this.x + this.width / 2 - 2,
            this.y + this.height / 2 - 2,
            this.width / 4,
            0, Math.PI * 2
        );
        ctx.fill();
    }
}