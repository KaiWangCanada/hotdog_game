/**
 * Game Engine for the Runaway Hotdog game
 * Handles canvas, rendering, collisions, input, and game loop
 */

class GameEngine {
    constructor(canvasId, width = 800, height = 600) {
        this.canvas = document.getElementById(canvasId);
        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.gameObjects = [];
        this.player = null;
        this.gravity = 0.5;
        this.friction = 0.8;
        this.isRunning = false;
        this.gameTime = 0;
        
        // Input handling
        this.keys = {};
        this.setupInput();
        
        // Game bounds
        this.bounds = {
            left: 0,
            top: 0,
            right: width,
            bottom: height
        };
        
        // Camera
        this.camera = {
            x: 0,
            y: 0,
            width: width,
            height: height,
            following: null
        };
        
        // Timing
        this.lastTime = 0;
        this.accumulator = 0;
        this.timeStep = 1000 / 60; // 60 fps
    }
    
    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.lastTime = performance.now();
            requestAnimationFrame(this.gameLoop.bind(this));
        }
    }
    
    stop() {
        this.isRunning = false;
    }
    
    // Main game loop
    gameLoop(currentTime) {
        if (!this.isRunning) return;
        
        // Calculate time delta
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Prevent spiral of death with large delta times
        const safeDelta = Math.min(deltaTime, 100);
        this.accumulator += safeDelta;
        
        // Update game time
        this.gameTime += safeDelta;
        
        // Fixed time step updates
        while (this.accumulator >= this.timeStep) {
            this.update(this.timeStep / 1000);
            this.accumulator -= this.timeStep;
        }
        
        // Render the game
        this.render();
        
        // Continue the loop
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    // Update game state
    update(deltaTime) {
        // Update all game objects
        for (const obj of this.gameObjects) {
            if (obj.active) obj.update(deltaTime, this);
        }
        
        // Update camera if following an object
        if (this.camera.following) {
            this.updateCamera();
        }
        
        // Check and resolve collisions
        this.checkCollisions();
        
        // Clean up destroyed objects
        this.gameObjects = this.gameObjects.filter(obj => !obj.destroyed);
    }
    
    // Render the game
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Set camera transform
        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        // Sort objects by z-index before rendering
        const sortedObjects = [...this.gameObjects].sort((a, b) => a.zIndex - b.zIndex);
        
        // Render all game objects
        for (const obj of sortedObjects) {
            if (obj.active && this.isVisible(obj)) {
                obj.render(this.ctx);
            }
        }
        
        this.ctx.restore();
    }
    
    // Check if object is visible in camera view
    isVisible(obj) {
        return !(obj.x + obj.width < this.camera.x || 
                 obj.x > this.camera.x + this.camera.width || 
                 obj.y + obj.height < this.camera.y || 
                 obj.y > this.camera.y + this.camera.height);
    }
    
    // Update camera position to follow player
    updateCamera() {
        const target = this.camera.following;
        
        // Target the center of the camera on the player
        const targetX = target.x + target.width / 2 - this.camera.width / 2;
        const targetY = target.y + target.height / 2 - this.camera.height / 2;
        
        // Smooth camera movement
        this.camera.x = Math.max(0, targetX);
        this.camera.y = Math.max(0, targetY);
        
        // Don't go past the level bounds
        if (this.levelWidth) {
            this.camera.x = Math.min(this.camera.x, this.levelWidth - this.camera.width);
        }
        if (this.levelHeight) {
            this.camera.y = Math.min(this.camera.y, this.levelHeight - this.camera.height);
        }
    }
    
    // Add a game object to the engine
    addObject(obj) {
        this.gameObjects.push(obj);
        return obj;
    }
    
    // Remove a game object from the engine
    removeObject(obj) {
        const index = this.gameObjects.indexOf(obj);
        if (index !== -1) {
            this.gameObjects.splice(index, 1);
        }
    }
    
    // Set the player object and make camera follow it
    setPlayer(player) {
        this.player = player;
        this.camera.following = player;
    }
    
    // Check and resolve collisions between game objects
    checkCollisions() {
        const collidableObjects = this.gameObjects.filter(obj => obj.active && obj.solid);
        
        for (let i = 0; i < collidableObjects.length; i++) {
            const objA = collidableObjects[i];
            
            // Check collisions with other objects
            for (let j = i + 1; j < collidableObjects.length; j++) {
                const objB = collidableObjects[j];
                
                if (this.checkCollision(objA, objB)) {
                    objA.onCollision(objB);
                    objB.onCollision(objA);
                }
            }
        }
    }
    
    // Check collision between two objects using AABB
    checkCollision(objA, objB) {
        return objA.x < objB.x + objB.width &&
               objA.x + objA.width > objB.x &&
               objA.y < objB.y + objB.height &&
               objA.y + objA.height > objB.y;
    }
    
    // Set up keyboard input
    setupInput() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    // Check if a key is pressed
    isKeyPressed(keyCode) {
        return this.keys[keyCode] === true;
    }
    
    // Set the level dimensions
    setLevelBounds(width, height) {
        this.levelWidth = width;
        this.levelHeight = height;
    }
    
    // Clear all game objects
    clearObjects() {
        this.gameObjects = [];
    }
}

// Base class for all game objects
class GameObject {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.velX = 0;
        this.velY = 0;
        this.active = true;
        this.solid = true;
        this.destroyed = false;
        this.zIndex = 0;
        this.type = 'gameObject';
    }
    
    update(deltaTime, engine) {
        // Basic movement with velocity
        this.x += this.velX * deltaTime;
        this.y += this.velY * deltaTime;
    }
    
    render(ctx) {
        // Default rendering - a colored rectangle
        ctx.fillStyle = 'purple';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
    
    onCollision(other) {
        // Default collision handler - do nothing
    }
    
    destroy() {
        this.destroyed = true;
    }
}

// Sprite class for game objects with images
class Sprite extends GameObject {
    constructor(x, y, width, height, imageSrc) {
        super(x, y, width, height);
        this.image = new Image();
        this.image.src = imageSrc;
        this.loaded = false;
        this.image.onload = () => {
            this.loaded = true;
        };
        this.frameX = 0;
        this.frameY = 0;
        this.numFrames = 1;
        this.animationSpeed = 0.1;
        this.animationTimer = 0;
    }
    
    update(deltaTime, engine) {
        super.update(deltaTime, engine);
        
        // Animation
        if (this.numFrames > 1) {
            this.animationTimer += deltaTime;
            if (this.animationTimer > this.animationSpeed) {
                this.frameX = (this.frameX + 1) % this.numFrames;
                this.animationTimer = 0;
            }
        }
    }
    
    render(ctx) {
        if (!this.loaded) {
            // Fallback rendering if image not loaded
            super.render(ctx);
            return;
        }
        
        // Draw the appropriate frame from the sprite sheet
        const frameWidth = this.image.width / this.numFrames;
        const frameHeight = this.image.height;
        
        ctx.drawImage(
            this.image,
            this.frameX * frameWidth, this.frameY * frameHeight,
            frameWidth, frameHeight,
            this.x, this.y,
            this.width, this.height
        );
    }
}

// Text display class
class TextDisplay {
    constructor(engine) {
        this.engine = engine;
    }
    
    showMessage(text, x, y, options = {}) {
        const defaultOptions = {
            color: 'white',
            font: '20px Comic Sans MS',
            duration: 2,
            shadow: true,
            shadowColor: 'black',
            align: 'center'
        };
        
        const settings = { ...defaultOptions, ...options };
        
        const textObj = new GameObject(x, y, 0, 0);
        textObj.text = text;
        textObj.options = settings;
        textObj.timeCreated = this.engine.gameTime;
        textObj.zIndex = 100;
        textObj.solid = false;
        
        textObj.render = (ctx) => {
            ctx.font = settings.font;
            ctx.textAlign = settings.align;
            
            if (settings.shadow) {
                ctx.fillStyle = settings.shadowColor;
                ctx.fillText(text, x + 2, y + 2);
            }
            
            ctx.fillStyle = settings.color;
            ctx.fillText(text, x, y);
        };
        
        textObj.update = (deltaTime, engine) => {
            const elapsed = (engine.gameTime - textObj.timeCreated) / 1000;
            if (elapsed >= settings.duration) {
                textObj.destroy();
            }
        };
        
        this.engine.addObject(textObj);
        return textObj;
    }
}

// Sound manager
class SoundManager {
    constructor() {
        this.sounds = {};
        this.musicTrack = null;
        this.isMuted = false;
    }
    
    loadSound(name, src) {
        const sound = new Audio(src);
        sound.preload = 'auto';
        this.sounds[name] = sound;
        return sound;
    }
    
    play(name, loop = false) {
        if (this.isMuted) return;
        
        const sound = this.sounds[name];
        if (sound) {
            sound.loop = loop;
            sound.currentTime = 0;
            sound.play().catch(e => console.log('Audio play error:', e));
        }
    }
    
    playMusic(name) {
        if (this.musicTrack) {
            this.musicTrack.pause();
        }
        
        this.musicTrack = this.sounds[name];
        if (this.musicTrack && !this.isMuted) {
            this.musicTrack.loop = true;
            this.musicTrack.play().catch(e => console.log('Music play error:', e));
        }
    }
    
    stopMusic() {
        if (this.musicTrack) {
            this.musicTrack.pause();
            this.musicTrack.currentTime = 0;
        }
    }
    
    setMute(mute) {
        this.isMuted = mute;
        if (mute && this.musicTrack) {
            this.musicTrack.pause();
        } else if (!mute && this.musicTrack) {
            this.musicTrack.play().catch(e => console.log('Music play error:', e));
        }
    }
}

// Particle system
class ParticleSystem {
    constructor(engine) {
        this.engine = engine;
    }
    
    createParticle(x, y, options = {}) {
        const defaultOptions = {
            color: 'white',
            size: 5,
            speed: 100,
            lifetime: 1,
            gravity: 0,
            direction: Math.random() * Math.PI * 2
        };
        
        const settings = { ...defaultOptions, ...options };
        
        const particle = new GameObject(x, y, settings.size, settings.size);
        particle.solid = false;
        particle.zIndex = 10;
        particle.color = settings.color;
        
        const angle = settings.direction;
        particle.velX = Math.cos(angle) * settings.speed;
        particle.velY = Math.sin(angle) * settings.speed;
        
        particle.lifetime = settings.lifetime;
        particle.age = 0;
        particle.gravity = settings.gravity;
        
        particle.update = (deltaTime, engine) => {
            particle.age += deltaTime;
            if (particle.age >= particle.lifetime) {
                particle.destroy();
                return;
            }
            
            // Apply gravity
            particle.velY += particle.gravity * deltaTime;
            
            // Update position
            particle.x += particle.velX * deltaTime;
            particle.y += particle.velY * deltaTime;
            
            // Fade out as it ages
            particle.opacity = 1 - (particle.age / particle.lifetime);
        };
        
        particle.render = (ctx) => {
            ctx.globalAlpha = particle.opacity;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(
                particle.x + particle.width / 2, 
                particle.y + particle.height / 2, 
                particle.width / 2, 
                0, Math.PI * 2
            );
            ctx.fill();
            ctx.globalAlpha = 1;
        };
        
        this.engine.addObject(particle);
        return particle;
    }
    
    createExplosion(x, y, options = {}) {
        const defaultOptions = {
            count: 20,
            color: 'red',
            size: 3,
            speed: 100,
            lifetime: 1,
            gravity: 100
        };
        
        const settings = { ...defaultOptions, ...options };
        
        for (let i = 0; i < settings.count; i++) {
            this.createParticle(x, y, {
                color: settings.color,
                size: settings.size,
                speed: settings.speed * (0.5 + Math.random()),
                lifetime: settings.lifetime * (0.5 + Math.random()),
                gravity: settings.gravity,
                direction: Math.random() * Math.PI * 2
            });
        }
    }
}

// Animation helper
class Animation {
    static bounce(object, duration = 0.5, height = 20) {
        const originalY = object.y;
        const startTime = performance.now();
        
        function animate() {
            const elapsed = (performance.now() - startTime) / 1000;
            const progress = Math.min(elapsed / duration, 1);
            
            // Simple bounce calculation
            const bounce = Math.sin(progress * Math.PI) * height;
            object.y = originalY - bounce;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                object.y = originalY;
            }
        }
        
        animate();
    }
    
    static shake(canvas, duration = 0.5, intensity = 5) {
        const originalStyle = canvas.style.transform;
        const startTime = performance.now();
        
        function animate() {
            const elapsed = (performance.now() - startTime) / 1000;
            const progress = Math.min(elapsed / duration, 1);
            
            if (progress < 1) {
                const dx = (Math.random() - 0.5) * 2 * intensity * (1 - progress);
                const dy = (Math.random() - 0.5) * 2 * intensity * (1 - progress);
                canvas.style.transform = `translate(${dx}px, ${dy}px)`;
                requestAnimationFrame(animate);
            } else {
                canvas.style.transform = originalStyle;
            }
        }
        
        animate();
    }
}