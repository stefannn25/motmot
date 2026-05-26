/* ==========================================================================
   Romantic Interactive Scrapbook JavaScript Logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // ==========================================
  // 0. Web Audio API Sound Effects (Click & Scratch)
  // ==========================================
  let audioCtx = null;
  let scratchBuffer = null;

  function initAudioCtx() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  // Generate cozy mechanical/paper tap sound
  function playClickSound() {
    try {
      initAudioCtx();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      // Warm sound profile (triangle wave, fast pitch drop, short decay)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, audioCtx.currentTime); // Low fundamental
      osc.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 0.06); // Pitch drop

      gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.06); // Quick decay

      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.06);
    } catch (e) {
      console.warn("Web Audio click sound blocked or failed:", e);
    }
  }

  // Pre-generate white noise buffer for scratch sound
  function getScratchBuffer() {
    if (scratchBuffer) return scratchBuffer;
    initAudioCtx();
    const bufferSize = audioCtx.sampleRate * 0.15; // 0.15s of noise
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    scratchBuffer = buffer;
    return scratchBuffer;
  }

  let lastScratchTime = 0;
  function playScratchSound() {
    const now = Date.now();
    if (now - lastScratchTime < 70) return; // Rate limit triggers
    lastScratchTime = now;

    try {
      initAudioCtx();
      const buffer = getScratchBuffer();
      const source = audioCtx.createBufferSource();
      source.buffer = buffer;

      // Filter noise to sound like paper texture friction
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 500; // Muted mid tone
      filter.Q.value = 2.0;

      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.03 + Math.random() * 0.03, audioCtx.currentTime); // Subtle volume
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);

      source.start();
    } catch (e) {
      console.warn("Scratch sound failed:", e);
    }
  }

  // Attach click sound to all interactive elements globally
  document.addEventListener('click', (e) => {
    if (e.target.closest('button') ||
      e.target.closest('.wax-seal') ||
      e.target.closest('.envelope') ||
      e.target.closest('.player-btn')) {
      playClickSound();
    }
  });

  // ==========================================
  // 1. Audio Player & Autoplay Entrance Overlay
  // ==========================================

  // Playlist of exactly two local tracks
  // USER: Place your mp3 files in the same folder as index.html and update these filenames
  const playlist = ['song1.mp3', 'song2.mp3'];

  // Visual track names displayed in the header
  const trackNames = ['Tadhana', 'Fooled Around and Fell Inlove'];

  let currentTrackIndex = 0;
  let isPlaying = false;

  const audio = document.getElementById('bg-audio');
  const playBtn = document.getElementById('play-btn');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const trackTitle = document.getElementById('current-track-title');
  const progressBar = document.getElementById('player-progress');

  const entranceOverlay = document.getElementById('entrance-overlay');
  const entranceBtn = document.getElementById('entrance-btn');
  const mainContent = document.getElementById('main-content');
  const waxSeal = document.querySelector('.wax-seal');

  // Load a track
  function loadTrack(index) {
    audio.src = playlist[index];
    trackTitle.textContent = trackNames[index];
    progressBar.style.width = '0%';
  }

  // Play a track
  function playTrack() {
    audio.play().then(() => {
      isPlaying = true;
      togglePlayIcons(true);
    }).catch(err => {
      console.warn("Playback prevented or error playing audio:", err);
      isPlaying = false;
      togglePlayIcons(false);
    });
  }

  // Pause track
  function pauseTrack() {
    audio.pause();
    isPlaying = false;
    togglePlayIcons(false);
  }

  // Toggle play/pause icon states
  function togglePlayIcons(playing) {
    const playIcon = playBtn.querySelector('.play-icon');
    const pauseIcon = playBtn.querySelector('.pause-icon');
    if (playing) {
      playIcon.classList.add('hidden');
      pauseIcon.classList.remove('hidden');
      playBtn.classList.add('play-active');
    } else {
      playIcon.classList.remove('hidden');
      pauseIcon.classList.add('hidden');
      playBtn.classList.remove('play-active');
    }
  }

  // Advance to next track
  function nextTrack() {
    currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
    loadTrack(currentTrackIndex);
    playTrack();
  }

  // Go to previous track
  function prevTrack() {
    currentTrackIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
    loadTrack(currentTrackIndex);
    playTrack();
  }

  // Audio Event Listeners
  audio.addEventListener('ended', () => {
    // Automatically advance to track 2 (and loop the playlist) when track finishes
    nextTrack();
  });

  audio.addEventListener('timeupdate', () => {
    if (audio.duration) {
      const percentage = (audio.currentTime / audio.duration) * 100;
      progressBar.style.width = `${percentage}%`;
    }
  });

  // Player Control Listeners
  playBtn.addEventListener('click', () => {
    if (isPlaying) {
      pauseTrack();
    } else {
      playTrack();
    }
  });

  nextBtn.addEventListener('click', nextTrack);
  prevBtn.addEventListener('click', prevTrack);

  // Initialize first track
  loadTrack(currentTrackIndex);

  // Entrance Reveal & Autoplay trigger
  function openScrapbook() {
    // Fade out overlay
    entranceOverlay.classList.add('hidden');
    // Reveal main page content
    mainContent.classList.add('show');
    // Start music
    playTrack();
  }

  entranceBtn.addEventListener('click', openScrapbook);
  waxSeal.addEventListener('click', openScrapbook);


  // ==========================================
  // 2. Floating Lily Flowers Physics Engine
  // ==========================================

  const canvas = document.getElementById('lily-canvas');
  const ctx = canvas.getContext('2d');

  let lilies = [];
  const numLilies = 18;
  const mouse = { x: null, y: null, active: false };

  // Detect touch screens for degradation rule
  const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
  const evasionRadius = isTouchDevice ? 60 : 120; // Degrade gracefully on touch
  const repulsionStrength = isTouchDevice ? 0.3 : 1.2;

  // Resize canvas to cover screen
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Track cursor coordinates
  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
  });

  window.addEventListener('mouseleave', () => {
    mouse.active = false;
  });

  // Track touches gently
  window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
      mouse.x = e.touches[0].clientX;
      mouse.y = e.touches[0].clientY;
      mouse.active = true;
    }
  }, { passive: true });

  window.addEventListener('touchend', () => {
    mouse.active = false;
  });

  // Lily Particle Constructor
  class Lily {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      this.radius = Math.random() * 15 + 18; // Size between 18 and 33px

      if (initial) {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
      } else {
        // Spawn off-screen depending on velocity direction
        if (Math.random() > 0.5) {
          this.x = Math.random() * canvas.width;
          this.y = this.vy > 0 ? -this.radius : canvas.height + this.radius;
        } else {
          this.x = this.vx > 0 ? -this.radius : canvas.width + this.radius;
          this.y = Math.random() * canvas.height;
        }
      }

      // Base drifting velocities (very slow, gentle wind)
      this.vx = (Math.random() - 0.5) * 0.3;
      this.vy = (Math.random() - 0.5) * 0.3;

      // Target wandering drift velocities
      this.targetVx = this.vx;
      this.targetVy = this.vy;

      // Natural slow rotation
      this.angle = Math.random() * Math.PI * 2;
      this.spin = (Math.random() - 0.5) * 0.003;

      // Determine type: lily pad or flower
      this.type = Math.random() > 0.4 ? 'flower' : 'pad';
    }

    update() {
      // 1. Gentle drift parameter wandering
      if (Math.random() < 0.005) {
        this.targetVx = (Math.random() - 0.5) * 0.4;
        this.targetVy = (Math.random() - 0.5) * 0.4;
      }

      // 2. Mouse evasion physics
      if (mouse.active && mouse.x !== null && mouse.y !== null) {
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < evasionRadius) {
          // Calculate evasion force (stronger closer to cursor, easing smoothly)
          const force = Math.pow((evasionRadius - dist) / evasionRadius, 1.5);
          const angle = Math.atan2(dy, dx);

          // Apply repulsion force acceleration
          const ax = Math.cos(angle) * force * repulsionStrength;
          const ay = Math.sin(angle) * force * repulsionStrength;

          this.vx += ax;
          this.vy += ay;
        }
      }

      // 3. Apply physics formulas: Velocity and friction
      this.x += this.vx;
      this.y += this.vy;
      this.angle += this.spin;

      // Damp speed back towards target drift velocity (simulates fluid resistance)
      this.vx += (this.targetVx - this.vx) * 0.03;
      this.vy += (this.targetVy - this.vy) * 0.03;

      // 4. Wrap around boundaries smoothly
      const margin = this.radius * 2;
      if (this.x < -margin) this.x = canvas.width + margin;
      if (this.x > canvas.width + margin) this.x = -margin;
      if (this.y < -margin) this.y = canvas.height + margin;
      if (this.y > canvas.height + margin) this.y = -margin;
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);

      if (this.type === 'pad') {
        // Draw a cozy green lily pad
        ctx.fillStyle = 'rgba(200, 214, 199, 0.7)'; // Sage green with slight opacity
        ctx.beginPath();
        // Circle with a small slice missing
        ctx.arc(0, 0, this.radius, 0.22 * Math.PI, 1.78 * Math.PI);
        ctx.lineTo(0, 0);
        ctx.closePath();
        ctx.fill();

        // Leaf veins inside pad
        ctx.strokeStyle = 'rgba(164, 185, 163, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let a = 0.4; a < 1.6; a += 0.3) {
          const vx = Math.cos(a * Math.PI) * this.radius * 0.8;
          const vy = Math.sin(a * Math.PI) * this.radius * 0.8;
          ctx.moveTo(0, 0);
          ctx.lineTo(vx, vy);
        }
        ctx.stroke();

      } else {
        // Draw a soft water lily flower
        const petals = 8;
        ctx.fillStyle = '#FFFDF9'; // Warm ivory petals
        ctx.strokeStyle = 'rgba(232, 197, 200, 0.8)'; // Blush pink borders
        ctx.lineWidth = 1;

        // Draw petals rotated in circle
        for (let i = 0; i < petals; i++) {
          ctx.rotate((2 * Math.PI) / petals);
          ctx.beginPath();
          // Draw sweet oval petals
          ctx.ellipse(this.radius * 0.45, 0, this.radius * 0.55, this.radius * 0.24, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }

        // Draw soft gold pistil center
        ctx.fillStyle = '#D2B48C';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.28, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  // Populate floating lily array
  for (let i = 0; i < numLilies; i++) {
    lilies.push(new Lily());
  }

  // Animation Loop
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    lilies.forEach(lily => {
      lily.update();
      lily.draw();
    });

    requestAnimationFrame(animate);
  }
  animate();


  // ==========================================
  // 3. Interactive Envelopes Logic
  // ==========================================

  const envelopeWrappers = document.querySelectorAll('.envelope-wrapper');
  const letterModal = document.getElementById('global-letter-modal');
  const modalContent = document.getElementById('modal-letter-content');

  envelopeWrappers.forEach(wrapper => {
    const envelope = wrapper.querySelector('.envelope');
    const closeBtn = wrapper.querySelector('.close-letter-btn');

    // Click envelope body to open
    envelope.addEventListener('click', (e) => {
      // Ignore clicks on close button
      if (e.target.classList.contains('close-letter-btn')) return;

      if (!wrapper.classList.contains('open')) {
        // Close any other open envelopes to keep desktop clear
        envelopeWrappers.forEach(w => {
          w.classList.remove('open');
        });

        wrapper.classList.add('open');
      } else {
        // If already open, clicking it opens the global modal to view the letter clearly
        const letterInner = wrapper.querySelector('.letter-inner');
        modalContent.innerHTML = letterInner.innerHTML;
        letterModal.classList.add('active');
      }
    });

    // Close button tucks it back inside
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Avoid triggering open card handler
      wrapper.classList.remove('open');
    });
  });

  // Global Modal Close Handlers
  letterModal.addEventListener('click', (e) => {
    if (e.target === letterModal || e.target.classList.contains('modal-close-btn')) {
      letterModal.classList.remove('active');
      playClickSound();
    }
  });


  // ==========================================
  // 4. Scratch-to-Reveal Memory Logic
  // ==========================================

  const scratchCanvas = document.getElementById('scratch-canvas');
  const scratchCtx = scratchCanvas.getContext('2d');
  const secretNote = document.querySelector('.secret-note');
  const instructionOverlay = document.querySelector('.scratch-instruction-overlay');

  let isScratching = false;
  let pointsScratched = 0;

  // Make canvas responsive to polaroid bounds
  function fitScratchCanvas() {
    const rect = scratchCanvas.parentElement.getBoundingClientRect();
    scratchCanvas.width = rect.width;
    scratchCanvas.height = rect.height;

    // Draw/re-draw the textured paint layer
    drawScratchTexture();
  }

  // Draw textured paper mockup onto scratching canvas
  function drawScratchTexture() {
    scratchCtx.save();

    // Draw subtle gradient
    const grad = scratchCtx.createLinearGradient(0, 0, scratchCanvas.width, scratchCanvas.height);
    grad.addColorStop(0, '#BACBB6'); // Sage green
    grad.addColorStop(0.5, '#F3D8DA'); // Soft blush
    grad.addColorStop(1, '#FAF6F0'); // Soft ivory
    scratchCtx.fillStyle = grad;
    scratchCtx.fillRect(0, 0, scratchCanvas.width, scratchCanvas.height);

    // Apply overlay pattern of handmade paper flecks
    scratchCtx.fillStyle = 'rgba(74, 62, 61, 0.08)';
    for (let i = 0; i < 400; i++) {
      const x = Math.random() * scratchCanvas.width;
      const y = Math.random() * scratchCanvas.height;
      const radius = Math.random() * 1.5 + 0.5;
      scratchCtx.beginPath();
      scratchCtx.arc(x, y, radius, 0, Math.PI * 2);
      scratchCtx.fill();
    }

    // Drawing soft decorative plant outline inside masking layer
    scratchCtx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    scratchCtx.lineWidth = 3;
    scratchCtx.setLineDash([5, 10]);
    scratchCtx.strokeRect(10, 10, scratchCanvas.width - 20, scratchCanvas.height - 20);

    scratchCtx.restore();
  }

  // Call after layout stabilizes
  setTimeout(fitScratchCanvas, 100);
  window.addEventListener('resize', fitScratchCanvas);

  // Scratch action drawing setup
  const brushRadius = 26;

  function getMouseCoordinates(e) {
    const rect = scratchCanvas.getBoundingClientRect();
    let clientX, clientY;

    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Scale canvas dimensions matching CSS bounds
    return {
      x: ((clientX - rect.left) / rect.width) * scratchCanvas.width,
      y: ((clientY - rect.top) / rect.height) * scratchCanvas.height
    };
  }

  function scratch(e) {
    if (!isScratching) return;

    // Play scratching sound
    playScratchSound();

    // Hide instructions once user starts dragging
    if (instructionOverlay) {
      instructionOverlay.style.opacity = '0';
    }

    const coords = getMouseCoordinates(e);

    // Erase circle around coordinates
    scratchCtx.globalCompositeOperation = 'destination-out';
    scratchCtx.beginPath();
    scratchCtx.arc(coords.x, coords.y, brushRadius, 0, Math.PI * 2);
    scratchCtx.fill();

    pointsScratched++;
    // Throttle calculation of cleared area to prevent lag
    if (pointsScratched % 25 === 0) {
      checkClearedPercentage();
    }
  }

  // Check how much surface has been cleared
  function checkClearedPercentage() {
    const imgData = scratchCtx.getImageData(0, 0, scratchCanvas.width, scratchCanvas.height);
    const pixels = imgData.data;
    let clearedCount = 0;
    const totalPixels = pixels.length / 4;

    // Check transparency of every 6th pixel (faster than counting every pixel)
    for (let i = 3; i < pixels.length; i += 24) {
      if (pixels[i] === 0) {
        clearedCount++;
      }
    }

    // Ratio threshold
    const percentCleared = (clearedCount / (totalPixels / 6)) * 100;

    if (percentCleared > 62) {
      // Auto-reveal the rest with transition
      scratchCanvas.style.opacity = '0';
      scratchCanvas.style.pointerEvents = 'none';
      if (instructionOverlay) instructionOverlay.style.display = 'none';

      // Play the revealed video
      const revealedVideo = document.getElementById('revealed-video');
      if (revealedVideo) {
        revealedVideo.play().catch(e => console.warn("Video playback blocked or failed:", e));
      }

      // Reveal the secret note caption below polaroid
      secretNote.classList.add('revealed');
    }
  }

  // Scratch Event Bindings
  function startScratching(e) {
    isScratching = true;
    scratch(e);
  }

  function stopScratching() {
    isScratching = false;
    checkClearedPercentage();
  }

  // Mouse bindings
  scratchCanvas.addEventListener('mousedown', startScratching);
  scratchCanvas.addEventListener('mousemove', scratch);
  window.addEventListener('mouseup', stopScratching);

  // Touch bindings
  scratchCanvas.addEventListener('touchstart', startScratching, { passive: true });
  scratchCanvas.addEventListener('touchmove', scratch, { passive: true });
  window.addEventListener('touchend', stopScratching);

});
