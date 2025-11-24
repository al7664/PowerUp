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
    console.log("Starting music from beginning...");
    
    sound.currentTime = 0;
    sound.volume = 0.7;
    
    const playPromise = sound.play();
    
    if (playPromise !== undefined) {
        playPromise.then(() => {
            console.log("Music started successfully!");
            isPlaying = true;
            audioEnabled = true;
        }).catch(error => {
            console.log("Music failed - need user interaction first");
        });
    }
}

// ----------------------------------------------------
// 4) RESUME MUSIC (from current position)
// ----------------------------------------------------
function resumeMusic() {
    console.log("Resuming music...");
    
    const playPromise = sound.play();
    
    if (playPromise !== undefined) {
        playPromise.then(() => {
            console.log("Music resumed!");
        }).catch(error => {
            console.log("Resume failed");
        });
    }
}

// ----------------------------------------------------
// 5) PAUSE MUSIC WHEN NO MOVEMENT
// ----------------------------------------------------
function pauseMusic() {
    if (isPlaying && !sound.paused) {
        console.log("Pausing music (no movement detected)");
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
        console.log("Movement timeout - pausing music");
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
// 8) SIMPLE MOBILE MOTION DETECTION
// ----------------------------------------------------
let lastShakeTime = 0;
const SHAKE_THRESHOLD = 15; // Lower threshold for easier detection

function handleDeviceMotion(event) {
    if (movementCooldown || !deviceMotionEnabled) return;
    
    const acceleration = event.accelerationIncludingGravity;
    if (!acceleration) return;
    
    // Get acceleration values
    const x = acceleration.x || 0;
    const y = acceleration.y || 0;
    const z = acceleration.z || 0;
    
    // Calculate overall force
    const force = Math.sqrt(x * x + y * y + z * z);
    
    const currentTime = Date.now();
    
    // Only register shake if enough time has passed
    if (force > SHAKE_THRESHOLD && (currentTime - lastShakeTime) > 500) {
        console.log("Shake detected! Force:", force.toFixed(2));
        registerMovement();
        lastShakeTime = currentTime;
    }
}

// ----------------------------------------------------
// 9) ENABLE MOTION DETECTION AUTOMATICALLY
// ----------------------------------------------------
function enableMotionDetection() {
    // Check if device supports motion events
    if (window.DeviceMotionEvent) {
        // For iOS 13+, we need to request permission
        if (typeof DeviceMotionEvent.requestPermission === 'function') {
            DeviceMotionEvent.requestPermission()
                .then(permissionState => {
                    if (permissionState === 'granted') {
                        deviceMotionEnabled = true;
                        window.addEventListener('devicemotion', handleDeviceMotion);
                        console.log("✅ Motion detection enabled (iOS)");
                        showMobileMessage("✅ Shake detection enabled!");
                    } else {
                        console.log("❌ Motion permission denied");
                        showMobileMessage("❌ Enable motion access in settings");
                    }
                })
                .catch(console.error);
        } else {
            // Android and other devices - enable automatically
            deviceMotionEnabled = true;
            window.addEventListener('devicemotion', handleDeviceMotion);
            console.log("✅ Motion detection enabled (Android/Other)");
        }
    } else {
        console.log("❌ Device motion not supported");
        showMobileMessage("❌ Motion not supported on this device");
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
// 11) TOUCH TO ENABLE AUDIO AND MOTION
// ----------------------------------------------------
document.addEventListener('touchstart', (event) => {
    if (!audioEnabled) {
        audioEnabled = true;
        console.log("✅ Audio enabled via touch");
    }
    
    // Enable motion detection on first touch (if not already enabled)
    if (!deviceMotionEnabled) {
        enableMotionDetection();
    }
});

// ----------------------------------------------------
// 12) CLICK TO ENABLE AUDIO (DESKTOP)
// ----------------------------------------------------
document.addEventListener('click', () => {
    if (!audioEnabled) {
        audioEnabled = true;
        console.log("✅ Audio enabled via click");
    }
});

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
    counterDisplay.style.transform = 'scale(1)';
    
    console.log("Counter reset - music stopped and reset");
});

// ----------------------------------------------------
// 14) MUSIC END EVENT
// ----------------------------------------------------
sound.addEventListener('ended', () => {
    console.log("Music finished playing");
    isPlaying = false;
});

// ----------------------------------------------------
// 15) AUTO-DETECT MOBILE AND ENABLE MOTION
// ----------------------------------------------------
if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    console.log("📱 Mobile device detected - enabling motion detection");
    showMobileMessage("📱 Shake your phone to start!");
    
    // Try to enable motion detection automatically after a short delay
    setTimeout(() => {
        if (!deviceMotionEnabled) {
            enableMotionDetection();
        }
    }, 1000);
}

console.log("🎯 Movement Counter Loaded!");
console.log("Desktop: Move mouse to start");
console.log("Mobile: Shake device to start");
