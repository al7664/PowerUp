let movementCount = 0;
let lastX = null;
let lastY = null;
let threshold = 15;
let movementCooldown = false;
let audioEnabled = false;
let isPlaying = false;
let movementTimeout = null;
let lastMovementTime = 0;

const counterDisplay = document.getElementById("count");
const sound = document.getElementById("movementSound");

// Time before music pauses when no movement (in milliseconds)
const MOVEMENT_TIMEOUT = 2000; // 2 seconds

// ----------------------------------------------------
// 1) MOVEMENT DETECTION
// ----------------------------------------------------
function registerMovement() {
    movementCount++;
    counterDisplay.textContent = movementCount;
    
    console.log("🎯 Movement detected! Count:", movementCount);
    
    // Visual feedback
    counterDisplay.style.transform = 'scale(1.3)';
    setTimeout(() => {
        counterDisplay.style.transform = 'scale(1)';
    }, 200);
    
    // Handle music based on movement
    handleMovementMusic();
    
    // Update last movement time
    lastMovementTime = Date.now();
    
    // Reset movement timeout
    resetMovementTimeout();
    
    // Cooldown to prevent spam
    movementCooldown = true;
    setTimeout(() => {
        movementCooldown = false;
    }, 300);
}

// ----------------------------------------------------
// 2) MUSIC CONTROL BASED ON MOVEMENT
// ----------------------------------------------------
function handleMovementMusic() {
    // Start music on first movement
    if (movementCount === 1 && !isPlaying) {
        startMusic();
    }
    // Resume music if it was paused and movement continues
    else if (isPlaying && sound.paused) {
        resumeMusic();
    }
}

// ----------------------------------------------------
// 3) START MUSIC
// ----------------------------------------------------
function startMusic() {
    console.log("🎵 Starting music from beginning...");
    
    sound.currentTime = 0;
    sound.volume = 0.7;
    
    const playPromise = sound.play();
    
    if (playPromise !== undefined) {
        playPromise.then(() => {
            console.log("✅ Music started successfully!");
            isPlaying = true;
            audioEnabled = true;
        }).catch(error => {
            console.log("❌ Music failed - need user interaction first");
            // Set up one-time click listener to enable audio
            document.addEventListener('click', enableAudioOnce, { once: true });
        });
    }
}

// ----------------------------------------------------
// 4) RESUME MUSIC (from current position)
// ----------------------------------------------------
function resumeMusic() {
    console.log("▶️ Resuming music...");
    
    const playPromise = sound.play();
    
    if (playPromise !== undefined) {
        playPromise.then(() => {
            console.log("✅ Music resumed!");
        }).catch(error => {
            console.log("❌ Resume failed");
        });
    }
}

// ----------------------------------------------------
// 5) PAUSE MUSIC WHEN NO MOVEMENT
// ----------------------------------------------------
function pauseMusic() {
    if (isPlaying && !sound.paused) {
        console.log("⏸️ Pausing music (no movement detected)");
        sound.pause();
    }
}

// ----------------------------------------------------
// 6) MOVEMENT TIMEOUT SYSTEM
// ----------------------------------------------------
function resetMovementTimeout() {
    // Clear existing timeout
    if (movementTimeout) {
        clearTimeout(movementTimeout);
    }
    
    // Set new timeout to pause music
    movementTimeout = setTimeout(() => {
        console.log("⏰ Movement timeout - pausing music");
        pauseMusic();
    }, MOVEMENT_TIMEOUT);
}

// ----------------------------------------------------
// 7) MOUSE MOVEMENT DETECTION
// ----------------------------------------------------
document.addEventListener("mousemove", (event) => {
    if (movementCooldown) return;
    
    if (lastX === null || lastY === null) {
        lastX = event.clientX;
        lastY = event.clientY;
        return;
    }

    const dx = Math.abs(event.clientX - lastX);
    const dy = Math.abs(event.clientY - lastY);

    if (dx > threshold || dy > threshold) {
        registerMovement();
        lastX = event.clientX;
        lastY = event.clientY;
    }
});

// ----------------------------------------------------
// 8) MOBILE DEVICE MOTION DETECTION
// ----------------------------------------------------
let lastAcceleration = null;
window.addEventListener("devicemotion", (event) => {
    if (movementCooldown) return;
    
    const acceleration = event.accelerationIncludingGravity;
    if (!acceleration) return;
    
    const ax = acceleration.x || 0;
    const ay = acceleration.y || 0;
    const az = acceleration.z || 0;
    
    if (lastAcceleration === null) {
        lastAcceleration = { x: ax, y: ay, z: az };
        return;
    }
    
    const dx = Math.abs(ax - lastAcceleration.x);
    const dy = Math.abs(ay - lastAcceleration.y);
    const dz = Math.abs(az - lastAcceleration.z);
    
    const magnitude = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    if (magnitude > 1.5) {
        registerMovement();
        lastAcceleration = { x: ax, y: ay, z: az };
    }
});

// ----------------------------------------------------
// 9) RESET BUTTON - STOP MUSIC AND RESET EVERYTHING
// ----------------------------------------------------
document.getElementById("resetBtn").addEventListener("click", () => {
    movementCount = 0;
    counterDisplay.textContent = 0;
    
    // Stop music completely
    sound.pause();
    sound.currentTime = 0;
    isPlaying = false;
    
    // Clear movement timeout
    if (movementTimeout) {
        clearTimeout(movementTimeout);
        movementTimeout = null;
    }
    
    lastX = null;
    lastY = null;
    lastAcceleration = null;
    counterDisplay.style.transform = 'scale(1)';
    
    console.log("🔄 Counter reset - music stopped and reset");
});

// ----------------------------------------------------
// 10) AUDIO ENABLEMENT
// ----------------------------------------------------
function enableAudioOnce() {
    console.log("✅ Audio enabled via user interaction");
    audioEnabled = true;
    // Try to start music if we already had movement
    if (movementCount >= 1 && !isPlaying) {
        startMusic();
    }
}

// ----------------------------------------------------
// 11) MUSIC END EVENT
// ----------------------------------------------------
sound.addEventListener('ended', () => {
    console.log("🎵 Music finished playing");
    isPlaying = false;
});

// ----------------------------------------------------
// 12) INITIAL AUDIO ENABLEMENT
// ----------------------------------------------------
document.addEventListener('click', enableAudioOnce, { once: true });
document.addEventListener('touchstart', enableAudioOnce, { once: true });

console.log("🚀 Movement Counter Loaded!");
console.log("Move your device or mouse to start!");
console.log("Music plays when moving, pauses when still");
