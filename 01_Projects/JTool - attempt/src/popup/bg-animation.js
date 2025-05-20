(function () {
  const browserAPI = chrome || browser;
  browserAPI.storage.local.get({ settings: { showAnimation: true } }, (data) => {
    if (!data.settings?.showAnimation) {
      const canvas = document.getElementById("bgCanvas");
      if (canvas) canvas.remove();
      return;
    }

    const canvas = document.getElementById("bgCanvas");
    if (!canvas) {
      console.warn("Background canvas element not found.");
      return;
    }
  canvas.style.position = "fixed";
  canvas.style.top = 0;
  canvas.style.left = 0;
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.zIndex = "-1";
  canvas.style.pointerEvents = "none";

  const ctx = canvas.getContext("2d");

  // --- Color Palettes ---
  let particleColor, connectionColorStart, connectionColorEnd, glowColor;

  function setColors(isDarkMode) {
    if (isDarkMode) {
      // Dark Mode Colors (Lighter, vibrant blues)
      particleColor = "rgba(173, 216, 230, 0.8)"; // Light Blue base (slightly more opaque)
      connectionColorStart = "rgba(135, 206, 250, 0.4)"; // Lighter Blue (slightly more opaque)
      connectionColorEnd = "rgba(70, 130, 180, 0.6)"; // Steel Blue (slightly more opaque)
      glowColor = "rgba(173, 216, 230, 0.6)"; // Subtle glow (slightly more opaque)
    } else {
      // Light Mode Colors (Darker, contrasting blues/greys)
      particleColor = "rgba(40, 60, 80, 0.7)"; // Dark Slate Blue
      connectionColorStart = "rgba(70, 100, 130, 0.4)"; // Darker Steel Blue
      connectionColorEnd = "rgba(20, 40, 60, 0.5)"; // Very Dark Blue
      glowColor = "rgba(40, 60, 80, 0.5)"; // Dark subtle glow
    }
  }

  // --- Theme Detection ---
  let currentIsDarkMode = document.body.classList.contains('dark-mode');
  setColors(currentIsDarkMode);

  // Optional: Observe theme changes if the theme can change dynamically
  // without a page reload (e.g., via a toggle button handled elsewhere)
  const themeObserver = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.attributeName === 'class') {
        const newIsDarkMode = document.body.classList.contains('dark-mode');
        if (newIsDarkMode !== currentIsDarkMode) {
          currentIsDarkMode = newIsDarkMode;
          setColors(currentIsDarkMode);
          // No need to re-init nodes or restart animation, just redraw with new colors
        }
      }
    });
  });
  themeObserver.observe(document.body, { attributes: true });


  // --- Animation Variables ---
  let nodes = [];
  const gridSpacing = 80; // Adjust for density
  const connectionDistance = gridSpacing * 1.8; // Connection range
  const springConstant = 0.015; // Softer spring
  const damping = 0.97; // Gentle damping

  class Node {
    constructor(x, y) {
      this.ox = x;
      this.oy = y;
      this.x = x + (Math.random() - 0.5) * 20; // Initial random offset
      this.y = y + (Math.random() - 0.5) * 20;
      this.vx = (Math.random() - 0.5) * 0.02;
      this.vy = (Math.random() - 0.5) * 0.02;
      this.baseSize = Math.random() * 2 + 1.5; // Base particle size
      this.pulsePhase = Math.random() * Math.PI * 2;
      this.pulseSpeed = Math.random() * 0.5 + 0.5; // Vary pulse speed
    }

    update(deltaSec, timestamp) {
      // Spring physics towards original position
      const dx = this.ox - this.x;
      const dy = this.oy - this.y;
      this.vx += dx * springConstant * deltaSec;
      this.vy += dy * springConstant * deltaSec;
      this.vx *= damping;
      this.vy *= damping;
      this.x += this.vx * deltaSec * 60; // Multiply by 60 for smoother movement if deltaSec is small
      this.y += this.vy * deltaSec * 60;

      // Pulsing size
      this.pulse = 1 + 0.3 * Math.sin(timestamp / 1000 * this.pulseSpeed + this.pulsePhase);
      this.currentSize = this.baseSize * this.pulse;
    }

    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);

      // Subtle Glow
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 8 * this.pulse; // Reduced glow intensity
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Draw Particle (Circle)
      ctx.beginPath();
      ctx.arc(0, 0, this.currentSize, 0, Math.PI * 2);
      ctx.fillStyle = particleColor;
      ctx.fill();

      ctx.restore();
    }
  }

  function resize() {
    const bodyWidth = document.body.clientWidth || 400;
    const bodyHeight = document.body.clientHeight || 550;
    canvas.width = bodyWidth * window.devicePixelRatio; // Adjust for pixel density
    canvas.height = bodyHeight * window.devicePixelRatio;
    canvas.style.width = `${bodyWidth}px`;
    canvas.style.height = `${bodyHeight}px`;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio); // Scale context
    initNodes(); // Reinitialize nodes on resize
  }

  if (typeof ResizeObserver !== 'undefined') {
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(document.body);
  } else {
    window.addEventListener("resize", resize);
  }

  // Initial size calculation with slight delay
  setTimeout(resize, 50);


  function initNodes() {
    nodes = [];
    const cols = Math.ceil(canvas.width / window.devicePixelRatio / gridSpacing) + 2;
    const rows = Math.ceil(canvas.height / window.devicePixelRatio / gridSpacing) + 2;
    const gridWidth = (cols - 1) * gridSpacing;
    const gridHeight = (rows - 1) * gridSpacing;
    const offsetX = (canvas.width / window.devicePixelRatio - gridWidth) / 2;
    const offsetY = (canvas.height / window.devicePixelRatio - gridHeight) / 2;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = offsetX + col * gridSpacing;
        const y = offsetY + row * gridSpacing;
        // Add jitter for less rigid grid
        const jitterX = (Math.random() - 0.5) * gridSpacing * 0.4;
        const jitterY = (Math.random() - 0.5) * gridSpacing * 0.4;
        nodes.push(new Node(x + jitterX, y + jitterY));
      }
    }
  }

  let lastTimestamp = 0;
  function animate(timestamp) {
    const deltaSec = Math.min((timestamp - lastTimestamp) / 1000, 0.1);
    lastTimestamp = timestamp;

    // Use device pixel ratio for width/height
    const scaledWidth = canvas.width / window.devicePixelRatio;
    const scaledHeight = canvas.height / window.devicePixelRatio;

    ctx.clearRect(0, 0, scaledWidth, scaledHeight); // Use scaled dimensions

    // Update nodes
    nodes.forEach((node) => node.update(deltaSec, timestamp));

    // Draw connections
    ctx.lineWidth = 0.5; // Thinner lines
    ctx.globalAlpha = 0.6; // Overall transparency for connections

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < connectionDistance) {
          const opacity = Math.max(0, (1 - dist / connectionDistance) * 0.7); // Fade with distance

          const gradient = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
          gradient.addColorStop(0, connectionColorStart.replace(/[\d\.]+\)$/g, `${opacity})`)); // Adjust alpha
          gradient.addColorStop(1, connectionColorEnd.replace(/[\d\.]+\)$/g, `${opacity})`)); // Adjust alpha

          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = gradient;
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1.0; // Reset alpha for particles

    // Draw nodes
    nodes.forEach((node) => node.draw(ctx));

    requestAnimationFrame(animate);
  }

  // Start
  requestAnimationFrame(animate);

  // Cleanup observer on unload (good practice, though likely not strictly necessary for extension popups)
  window.addEventListener('unload', () => {
    if (themeObserver) {
        themeObserver.disconnect();
    }
    if (resizeObserver) {
        resizeObserver.disconnect(); // Assuming resizeObserver is defined earlier
    }
  });

  }); // end storage.get callback

})();