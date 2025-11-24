let movementCount = 0;
let lastX = null;
let lastY = null;
let threshold = 15;
let movementCooldown = false;
let audioEnabled = false;
let isPlaying = false;
let movementTimeout = null;
let deviceMotionEnabled = false;

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
    
    console.log("Movement detected! Count:", movementCount);
    
    // Visual feedback
    counterDisplay.style.transform = 'scale(1.3)';
    setTimeout(() => {
        counterDisplay.style.transform = 'scale(1)';
    }, 200);
    
    // Handle music based on movement
    handleMovementMusic();
    
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
    // Start music on first movement (when count goes from 0 to 1)
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
    if (!audioEnabled) {
        console.log("❌ Audio not enabled yet");
        return;
    }
    
    console.log("🎵 Starting music from beginning...");
    
    sound.currentTime = 0;
    sound.volume = 0.7;
    
    sound.play().then(() => {
        console.log("✅ Music started successfully!");
        isPlaying = true;
    }).catch(error => {
        console.log("❌ Music play failed:", error);
    });
}

// ----------------------------------------------------
// 4) RESUME MUSIC (from current position)
// ----------------------------------------------------
function resumeMusic() {
    console.log("▶️ Resuming music...");
    
    sound.play().then(() => {
        console.log("✅ Music resumed!");
    }).catch(error => {
        console.log("❌ Resume failed");
    });
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
// 7) MOUSE MOVEMENT DETECTION (DESKTOP)
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
// 8) SIMPLE MOBILE SHAKE DETECTION
// ----------------------------------------------------
let lastShakeTime = 0;
let lastAcceleration = { x: null, y: null, z: null };

function handleDeviceMotion(event) {
    if (movementCooldown || !deviceMotionEnabled) return;
    
    const acceleration = event.accelerationIncludingGravity;
    if (!acceleration) return;
    
    const x = acceleration.x || 0;
    const y = acceleration.y || 0;
    const z = acceleration.z || 0;
    
    // If we don't have previous values, set them and return
    if (lastAcceleration.x === null) {
        lastAcceleration = { x, y, z };
        return;
    }
    
    // Calculate change in acceleration (how much device moved)
    const deltaX = Math.abs(x - lastAcceleration.x);
    const deltaY = Math.abs(y - lastAcceleration.y);
    const deltaZ = Math.abs(z - lastAcceleration.z);
    
    // Total movement
    const totalMovement = deltaX + deltaY + deltaZ;
    
    const currentTime = Date.now();
    
    // Register movement if significant shake detected
    if (totalMovement > 10 && (currentTime - lastShakeTime) > 400) {
        console.log("📱 Shake detected! Movement:", totalMovement.toFixed(2));
        registerMovement();
        lastShakeTime = currentTime;
    }
    
    // Update last acceleration values
    lastAcceleration = { x, y, z };
}

// ----------------------------------------------------
// 9) ENABLE MOTION DETECTION
// ----------------------------------------------------
function enableMotionDetection() {
    if (window.DeviceMotionEvent) {
        // For iOS 13+, request permission
        if (typeof DeviceMotionEvent.requestPermission === 'function') {
            DeviceMotionEvent.requestPermission()
                .then(permissionState => {
                    if (permissionState === 'granted') {
                        deviceMotionEnabled = true;
                        window.addEventListener('devicemotion', handleDeviceMotion);
                        console.log("✅ iOS Motion detection enabled");
                        showMobileMessage("✅ Shake to move!");
                    }
                })
                .catch(error => {
                    console.log("❌ Motion permission error:", error);
                    showMobileMessage("❌ Allow motion access");
                });
        } else {
            // Android and other devices
            deviceMotionEnabled = true;
            window.addEventListener('devicemotion', handleDeviceMotion);
            console.log("✅ Android Motion detection enabled");
            showMobileMessage("✅ Shake to move!");
        }
    } else {
        console.log("❌ Device motion not supported");
        showMobileMessage("❌ Motion not supported");
    }
}

// ----------------------------------------------------
// 10) SHOW MOBILE MESSAGES
// ----------------------------------------------------
function showMobileMessage(message) {
    // Remove existing message
    const existingMsg = document.getElementById('mobile-message');
    if (existingMsg) {
        existingMsg.remove();
    }
    
    // Add new message
    const msgElement = document.createElement('p');
    msgElement.id = 'mobile-message';
    msgElement.style.cssText = 'color: yellow; margin-top: 10px; font-size: 0.9rem;';
    msgElement.textContent = message;
    document.body.appendChild(msgElement);
}

// ----------------------------------------------------
// 11) ENABLE AUDIO ON USER INTERACTION
// ----------------------------------------------------
function enableAudioOnInteraction() {
    if (!audioEnabled) {
        audioEnabled = true;
        console.log("✅ Audio enabled");
        
        // On mobile, also enable motion detection when user interacts
        if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            if (!deviceMotionEnabled) {
                enableMotionDetection();
            }
        }
    }
}

// ----------------------------------------------------
// 12) SINGLE TAP/CLICK TO ENABLE EVERYTHING
// ----------------------------------------------------
document.addEventListener('click', enableAudioOnInteraction);
document.addEventListener('touchstart', enableAudioOnInteraction);

// ----------------------------------------------------
// 13) RESET BUTTON
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
    lastAcceleration = { x: null, y: null, z: null };
    counterDisplay.style.transform = 'scale(1)';
    
    console.log("🔄 Counter reset");
});

// ----------------------------------------------------
// 14) MUSIC END EVENT
// ----------------------------------------------------
sound.addEventListener('ended', () => {
    console.log("🎵 Music finished playing");
    isPlaying = false;
});

// ----------------------------------------------------
// 15) AUTO-DETECT MOBILE
// ----------------------------------------------------
if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    console.log("📱 Mobile device detected");
    showMobileMessage("📱 Tap screen, then shake phone!");
}

console.log("🚀 Movement Counter Loaded!");
console.log("Desktop: Move mouse to start");
console.log("Mobile: Tap screen, then shake phone");
