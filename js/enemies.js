/**
 * Enemies for Runaway Hotdog
 * Different types of hungry humans that try to eat or step on the player
 */

// Base enemy class
class Enemy extends GameObject {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.type = 'enemy';
        
        // Basic enemy properties
        this.speed = 100;
        this.direction = 1; // 1 for right, -1 for left
        this.stunned = false;
        this.stunTime = 0;
        this.stunDuration = 0;
        this.patrolDistance = 100;
        this.startX = x;
        
        // Allow enemies to fall
        this.gravity = 800;
        this.grounded = false;
        
        // Set a higher z-index so enemies render on top of most objects
        this.zIndex = 5;
    }
    
    update(deltaTime, engine) {
        if (this.stunned) {
            // Update stun timer
            this.stunTime += deltaTime;
            if (this.stunTime >= this.stunDuration) {
                this.stunned = false;
                this.stunTime = 0;
            }
            
            // Stunned enemies still fall
            this.applyGravity(deltaTime, engine);
            return;
        }
        
        // Normal movement
        this.move(deltaTime, engine);
        
        // Apply gravity
        this.applyGravity(deltaTime, engine);
        
        // Check for collisions with the player
        this.checkPlayerCollision(engine);
    }
    
    move(deltaTime, engine) {
        // Basic movement - patrol back and forth
        this.x += this.speed * this.direction * deltaTime;
        
        // Check if we've reached the patrol limits
        if (this.x > this.startX + this.patrolDistance) {
            this.x = this.startX + this.patrolDistance;
            this.direction = -1;
        } else if (this.x < this.startX - this.patrolDistance) {
            this.x = this.startX - this.patrolDistance;
            this.direction = 1;
        }
        
        // Check for collisions with blocks
        for (const obj of engine.gameObjects) {
            if (obj.solid && obj.type === 'block' && engine.checkCollision(this, obj)) {
                // Turn around if hitting a wall
                if (this.direction > 0) {
                    this.x = obj.x - this.width;
                } else {
                    this.x = obj.x + obj.width;
                }
                
                this.direction *= -1;
                break;
            }
        }
    }
    
    applyGravity(deltaTime, engine) {
        // Apply gravity
        this.velY += this.gravity * deltaTime;
        
        // Update position
        this.y += this.velY * deltaTime;
        
        // Check for collisions with the ground
        this.grounded = false;
        
        for (const obj of engine.gameObjects) {
            if (obj.solid && obj.type === 'block' && engine.checkCollision(this, obj)) {
                // Only resolve when falling
                if (this.velY > 0) {
                    this.y = obj.y - this.height;
                    this.velY = 0;
                    this.grounded = true;
                } else if (this.velY < 0) {
                    // Hit ceiling
                    this.y = obj.y + obj.height;
                    this.velY = 0;
                }
            }
        }
    }
    
    checkPlayerCollision(engine) {
        const player = engine.player;
        if (!player || player.invulnerable) return;
        
        if (engine.checkCollision(this, player)) {
            // Check if player is stomping on the enemy from above
            if (player.velY > 0 && player.y + player.height < this.y + this.height / 2) {
                // Player stomps the enemy
                this.getStomped(player);
            } else {
                // Player gets eaten/damaged by enemy
                if (player.takeDamage()) {
                    // If the player is still alive, push them back
                    const knockbackDirection = player.x < this.x ? -1 : 1;
                    player.velX = player.jumpForce * 0.4 * knockbackDirection;
                }
            }
        }
    }
    
    getStomped(player) {
        // Default behavior - get stunned
        this.stun(2);
        
        // Bounce the player
        player.velY = -player.jumpForce * 0.7;
        
        // Award points
        engine.score += 50;
    }
    
    stun(duration) {
        this.stunned = true;
        this.stunTime = 0;
        this.stunDuration = duration;
    }
    
    render(ctx) {
        // Different display if stunned
        if (this.stunned) {
            this.renderStunned(ctx);
            return;
        }
        
        // Normal enemy rendering
        this.renderNormal(ctx);
    }
    
    renderNormal(ctx) {
        // Base enemy appearance - will be overridden
        ctx.fillStyle = '#FF69B4';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
    
    renderStunned(ctx) {
        // Stunned appearance - covered in condiments
        ctx.fillStyle = '#FF69B4';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Draw stunned face
        ctx.fillStyle = 'black';
        
        // X eyes
        const eyeSize = 3;
        
        // Left eye (X)
        const leftEyeX = this.x + this.width * 0.3;
        const leftEyeY = this.y + this.height * 0.3;
        
        ctx.beginPath();
        ctx.moveTo(leftEyeX - eyeSize, leftEyeY - eyeSize);
        ctx.lineTo(leftEyeX + eyeSize, leftEyeY + eyeSize);
        ctx.moveTo(leftEyeX + eyeSize, leftEyeY - eyeSize);
        ctx.lineTo(leftEyeX - eyeSize, leftEyeY + eyeSize);
        ctx.stroke();
        
        // Right eye (X)
        const rightEyeX = this.x + this.width * 0.7;
        const rightEyeY = this.y + this.height * 0.3;
        
        ctx.beginPath();
        ctx.moveTo(rightEyeX - eyeSize, rightEyeY - eyeSize);
        ctx.lineTo(rightEyeX + eyeSize, rightEyeY + eyeSize);
        ctx.moveTo(rightEyeX + eyeSize, rightEyeY - eyeSize);
        ctx.lineTo(rightEyeX - eyeSize, rightEyeY + eyeSize);
        ctx.stroke();
        
        // Draw condiment stains
        for (let i = 0; i < 10; i++) {
            const stainX = this.x + Math.random() * this.width;
            const stainY = this.y + Math.random() * this.height;
            const stainSize = 2 + Math.random() * 3;
            
            // Random condiment color
            const colors = ['#FF0000', '#FFD700', '#32CD32'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(stainX, stainY, stainSize, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// Basic enemy - walks back and forth, tries to eat the player
class BasicEnemy extends Enemy {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.speed = 50; // Reduced from 80
        this.patrolDistance = 120;
    }
    
    renderNormal(ctx) {
        // Body
        ctx.fillStyle = '#FF69B4';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Face looking in the direction of movement
        const faceX = this.direction > 0 ? 
            this.x + this.width * 0.7 : 
            this.x + this.width * 0.3;
        
        // Eyes
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(
            faceX - 5 * this.direction,
            this.y + this.height * 0.2,
            5, 0, Math.PI * 2
        );
        ctx.fill();
        
        // Pupil
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(
            faceX - 6 * this.direction,
            this.y + this.height * 0.2,
            2, 0, Math.PI * 2
        );
        ctx.fill();
        
        // Mouth (hungry)
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(
            faceX,
            this.y + this.height * 0.6,
            10,
            Math.PI * 0.1, Math.PI * 0.9,
            false
        );
        ctx.fill();
    }
}

// Hungry enemy - actively chases the player when nearby
class HungryEnemy extends Enemy {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.speed = 60; // Reduced from 120
        this.patrolDistance = 80;
        this.detectionRange = 180; // Slightly reduced detection range
        this.chasingPlayer = false;
    }
    
    move(deltaTime, engine) {
        // Check if player is nearby
        const player = engine.player;
        
        if (player) {
            const distanceToPlayer = Math.abs(player.x - this.x);
            
            if (distanceToPlayer < this.detectionRange) {
                // Chase the player (slower chase multiplier - reduced from 1.5 to 1.2)
                this.chasingPlayer = true;
                this.direction = player.x > this.x ? 1 : -1;
                this.x += this.speed * 1.2 * this.direction * deltaTime;
                
                // Jump if there's an obstacle in the way
                if (this.grounded) {
                    // Check for blocks in front
                    const blockCheckX = this.x + (this.width + 10) * this.direction;
                    const blockCheckY = this.y + this.height / 2;
                    
                    for (const obj of engine.gameObjects) {
                        if (obj.solid && obj.type === 'block' &&
                            blockCheckX >= obj.x && blockCheckX <= obj.x + obj.width &&
                            blockCheckY >= obj.y && blockCheckY <= obj.y + obj.height) {
                            // Jump to try to clear the obstacle
                            this.velY = -400;
                            this.grounded = false;
                            break;
                        }
                    }
                }
            } else {
                this.chasingPlayer = false;
                // Normal patrol behavior
                super.move(deltaTime, engine);
            }
        } else {
            // Fallback to normal patrol if no player
            super.move(deltaTime, engine);
        }
    }
    
    renderNormal(ctx) {
        // Body
        ctx.fillStyle = this.chasingPlayer ? '#FF3366' : '#FF69B4';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Face looking in the direction of movement
        const faceX = this.direction > 0 ? 
            this.x + this.width * 0.7 : 
            this.x + this.width * 0.3;
        
        // Eyes
        const eyeSize = this.chasingPlayer ? 8 : 5;
        
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(
            faceX - 5 * this.direction,
            this.y + this.height * 0.2,
            eyeSize, 0, Math.PI * 2
        );
        ctx.fill();
        
        // Pupil - widens when chasing
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(
            faceX - 6 * this.direction,
            this.y + this.height * 0.2,
            this.chasingPlayer ? 4 : 2, 
            0, Math.PI * 2
        );
        ctx.fill();
        
        // Mouth - larger when chasing
        ctx.fillStyle = 'black';
        ctx.beginPath();
        
        if (this.chasingPlayer) {
            // Big open mouth when chasing
            ctx.arc(
                faceX,
                this.y + this.height * 0.6,
                15,
                0, Math.PI,
                false
            );
        } else {
            // Smaller mouth when patrolling
            ctx.arc(
                faceX,
                this.y + this.height * 0.6,
                10,
                Math.PI * 0.1, Math.PI * 0.9,
                false
            );
        }
        ctx.fill();
        
        // Drooling when chasing
        if (this.chasingPlayer) {
            ctx.fillStyle = 'rgba(0, 191, 255, 0.7)';
            ctx.beginPath();
            ctx.ellipse(
                faceX,
                this.y + this.height * 0.8,
                5, 10,
                0, 0, Math.PI * 2
            );
            ctx.fill();
        }
    }
}

// Stomper enemy - tries to jump on and squish the player
class StomperEnemy extends Enemy {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.speed = 40; // Reduced from 60
        this.patrolDistance = 150;
        this.detectionRange = 120; // Reduced from 150
        this.jumpPower = 450; // Reduced from 500
        this.jumpCooldown = 0;
        this.preparingJump = false;
        this.jumpSquatTimer = 0;
        this.jumpDelay = 0.7; // Increased from 0.5 - more time to prepare jump (warning for player)
    }
    
    move(deltaTime, engine) {
        // Don't move horizontally while jumping
        if (!this.grounded && this.velY !== 0) {
            return;
        }
        
        // Update jump cooldown
        if (this.jumpCooldown > 0) {
            this.jumpCooldown -= deltaTime;
        }
        
        // Check if player is nearby and below
        const player = engine.player;
        
        if (player && this.jumpCooldown <= 0 && !this.preparingJump) {
            const distanceToPlayer = Math.abs(player.x - this.x);
            const isPlayerBelow = player.y > this.y + this.height / 2;
            
            if (distanceToPlayer < this.detectionRange && isPlayerBelow) {
                // Prepare to jump on the player
                this.preparingJump = true;
                this.jumpSquatTimer = 0;
                return;
            }
        }
        
        // Jump preparation
        if (this.preparingJump) {
            this.jumpSquatTimer += deltaTime;
            
            if (this.jumpSquatTimer >= this.jumpDelay) {
                // Execute the jump
                this.velY = -this.jumpPower;
                this.grounded = false;
                this.preparingJump = false;
                this.jumpCooldown = 3.0; // Wait before jumping again
                
                // Target the player's position for the jump
                if (player) {
                    this.direction = player.x > this.x ? 1 : -1;
                    
                    // Calculate jump velocity to try to land on the player
                    const timeToTarget = 0.5; // desired time to reach target
                    const targetX = player.x;
                    const distanceX = targetX - this.x;
                    
                    // Set horizontal velocity to intercept the player
                    this.velX = distanceX / timeToTarget;
                    
                    // Clamp to prevent super-speed
                    this.velX = Math.max(Math.min(this.velX, 300), -300);
                }
            }
            return;
        }
        
        // Normal patrol behavior when not targeting the player
        super.move(deltaTime, engine);
    }
    
    update(deltaTime, engine) {
        if (this.stunned) {
            super.update(deltaTime, engine);
            return;
        }
        
        // Normal movement
        this.move(deltaTime, engine);
        
        // Apply gravity
        this.applyGravity(deltaTime, engine);
        
        // Apply horizontal movement from jumps
        if (!this.grounded && this.velX !== 0) {
            this.x += this.velX * deltaTime;
            
            // Slow down horizontal velocity
            this.velX *= 0.98;
        }
        
        // Check for collisions with the player
        this.checkPlayerCollision(engine);
        
        // Create shadow when jumping
        if (!this.grounded && !this.stunned) {
            // Only create shadow occasionally to avoid performance issues
            if (Math.random() < 0.1) {
                const shadow = new GameObject(
                    this.x + this.width / 4, 
                    this.y + this.height, 
                    this.width / 2, 
                    5
                );
                shadow.solid = false;
                shadow.zIndex = 1;
                shadow.lifespan = 0.5;
                shadow.age = 0;
                
                shadow.update = (dt) => {
                    shadow.age += dt;
                    if (shadow.age >= shadow.lifespan) {
                        shadow.destroy();
                    }
                    
                    // Fade out
                    shadow.opacity = 1 - (shadow.age / shadow.lifespan);
                };
                
                shadow.render = (ctx) => {
                    ctx.fillStyle = `rgba(0, 0, 0, ${shadow.opacity * 0.5})`;
                    ctx.beginPath();
                    ctx.ellipse(
                        shadow.x + shadow.width / 2,
                        shadow.y + shadow.height / 2,
                        shadow.width / 2,
                        shadow.height / 2,
                        0, 0, Math.PI * 2
                    );
                    ctx.fill();
                };
                
                engine.addObject(shadow);
            }
        }
    }
    
    renderNormal(ctx) {
        // Body - squished when preparing to jump
        if (this.preparingJump) {
            const squatProgress = this.jumpSquatTimer / this.jumpDelay;
            const squishFactor = 1 - squatProgress * 0.3;
            
            // Squished body
            ctx.fillStyle = '#FF69B4';
            ctx.fillRect(
                this.x - (this.width * (1 - squishFactor)) / 2,
                this.y + this.height * (1 - squishFactor),
                this.width * (2 - squishFactor),
                this.height * squishFactor
            );
            
            // Angry eyes
            ctx.fillStyle = 'white';
            
            // Left eye
            ctx.beginPath();
            ctx.arc(
                this.x + this.width * 0.25,
                this.y + this.height * (1 - squishFactor * 0.2),
                6, 0, Math.PI * 2
            );
            ctx.fill();
            
            // Right eye
            ctx.beginPath();
            ctx.arc(
                this.x + this.width * 0.75,
                this.y + this.height * (1 - squishFactor * 0.2),
                6, 0, Math.PI * 2
            );
            ctx.fill();
            
            // Angry eyebrows
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            
            // Left eyebrow
            ctx.beginPath();
            ctx.moveTo(this.x + this.width * 0.15, this.y + this.height * (1 - squishFactor * 0.3));
            ctx.lineTo(this.x + this.width * 0.35, this.y + this.height * (1 - squishFactor * 0.4));
            ctx.stroke();
            
            // Right eyebrow
            ctx.beginPath();
            ctx.moveTo(this.x + this.width * 0.65, this.y + this.height * (1 - squishFactor * 0.4));
            ctx.lineTo(this.x + this.width * 0.85, this.y + this.height * (1 - squishFactor * 0.3));
            ctx.stroke();
            
            // Grimacing mouth
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(this.x + this.width * 0.3, this.y + this.height * (1 - squishFactor * 0.15));
            ctx.lineTo(this.x + this.width * 0.7, this.y + this.height * (1 - squishFactor * 0.15));
            ctx.stroke();
            
        } else {
            // Normal stomper appearance
            ctx.fillStyle = '#FF69B4';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            // Face - always faces forward for stompers
            
            // Eyes
            ctx.fillStyle = 'white';
            
            // Left eye
            ctx.beginPath();
            ctx.arc(
                this.x + this.width * 0.3,
                this.y + this.height * 0.3,
                6, 0, Math.PI * 2
            );
            ctx.fill();
            
            // Right eye
            ctx.beginPath();
            ctx.arc(
                this.x + this.width * 0.7,
                this.y + this.height * 0.3,
                6, 0, Math.PI * 2
            );
            ctx.fill();
            
            // Pupils
            ctx.fillStyle = 'black';
            
            // Left pupil
            ctx.beginPath();
            ctx.arc(
                this.x + this.width * 0.3,
                this.y + this.height * 0.3,
                3, 0, Math.PI * 2
            );
            ctx.fill();
            
            // Right pupil
            ctx.beginPath();
            ctx.arc(
                this.x + this.width * 0.7,
                this.y + this.height * 0.3,
                3, 0, Math.PI * 2
            );
            ctx.fill();
            
            // Smile
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(
                this.x + this.width * 0.5,
                this.y + this.height * 0.5,
                this.width * 0.3,
                Math.PI * 0.2, Math.PI * 0.8,
                false
            );
            ctx.stroke();
        }
        
        // Draw some boots/feet
        ctx.fillStyle = '#8B4513';
        
        // Left boot
        ctx.fillRect(
            this.x + this.width * 0.1,
            this.y + this.height * 0.9,
            this.width * 0.3,
            this.height * 0.1
        );
        
        // Right boot
        ctx.fillRect(
            this.x + this.width * 0.6,
            this.y + this.height * 0.9,
            this.width * 0.3,
            this.height * 0.1
        );
    }
    
    getStomped(player) {
        // Stompers are harder to stomp
        if (Math.random() < 0.5) {
            super.getStomped(player);
        } else {
            // Just bounce the player but don't stun
            player.velY = -player.jumpForce * 0.7;
        }
    }
}