document.addEventListener('DOMContentLoaded', () => {
  const timeline = anime.timeline({
    loop: true,
    easing: "easeOutElastic(1, .8)",
  });

  function applyBodyGradient() {
    // Add class to trigger the gradient fade-in via CSS
    requestAnimationFrame(() => {
      document.body.classList.add('gradient-active');
      console.log('Gradient fade-in started');
    });
  }



  // Progress logic: show percentage and progressive fill while animations loop
  let timeEntervaltoWait = 1999; // e qual to 1 seconds
  const progressText = document.getElementById('progress-text');
  const progressFill = document.getElementById('progress-fill');
  const progressHint = document.getElementById('progress-hint');

  // Internal progress state
  let progress = 0;
  let progressInterval = null;
  let lastAdvanceAt = Date.now();

  function startProgress() {
    // Soft-increment behavior: faster at start, then slower; cap at 95% until ready
    if (progressInterval) return;
    progressInterval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastAdvanceAt;

      // small randomization to feel organic
      const step = progress < 60 ? (0.8 + Math.random() * 1.8) : (progress < 85 ? (0.3 + Math.random() * 0.6) : (0.1 + Math.random() * 0.25));
      progress = Math.min(95, progress + step);
      updateProgressUI(progress);
      lastAdvanceAt = now;

      // If we haven't moved much for >7s, show a network hint
      if (progress >= 90 && Date.now() - lastAdvanceAt > 7543) {
        progressHint.textContent = 'Still loading — check your internet or try refreshing.';
      }
    }, 450);
  }

  function stopProgress() {
    if (progressInterval) {
      clearInterval(progressInterval);
      progressInterval = null;
    }
  }

  function updateProgressUI(p) {
    const pct = Math.round(p);
    if (progressText) progressText.textContent = `${pct}%`;
    if (progressFill) progressFill.style.width = `${pct}%`;
    const bar = document.getElementById('progress-bar');
    if (bar) bar.setAttribute('aria-valuenow', String(pct));
  }

  function completeProgressAndHide() {
    stopProgress();
    progress = 100;
    updateProgressUI(progress);

    // Wait 1 second at 100% before starting to fade
    setTimeout(() => {
      // Fade out and slide down loading screen smoothly
      const loading = document.getElementById('loading-screen');
      if (loading) {
        // Ensure loading screen stays in place during animation
        loading.style.position = 'fixed';
        loading.style.top = '0';
        loading.style.left = '0';
        loading.style.width = '100%';
        loading.style.height = '100%';
        
        loading.style.transition = 'opacity 600ms ease, transform 600ms ease, visibility 600ms ease';
        loading.style.opacity = '0';
        loading.style.transform = 'translateY(30px)';
        loading.style.visibility = 'hidden';
        
        // Show the GIF container while loading screen is fading
        setTimeout(() => {
          const gifContainer = document.getElementById('empty-state-gif');
          if (gifContainer) {
            console.log('Making GIF visible while loading screen fades');
            gifContainer.style.visibility = 'visible';
            // Force immediate opacity without transition
            gifContainer.style.transition = 'none';
            gifContainer.style.opacity = '1';
            // Restore transition after it's visible
            setTimeout(() => {
              gifContainer.style.transition = 'opacity 0.4s ease';
            }, 50);
          }
        }, 100); // Show GIF 100ms into the fade
        

        // remove from flow after fade
        setTimeout(() => {
          if (loading && loading.parentNode) loading.parentNode.removeChild(loading);
          // Restore body scroll and position after loading screen is removed
          document.documentElement.style.overflow = '';
          document.body.style.overflow = '';
          document.body.style.position = '';
          document.body.style.width = '';
          document.body.style.height = '';
          
          // Apply gradient AFTER body position is restored for smooth transition
          
          document.body.style.height = '';
          
        }, 650);
        
      }
    setTimeout(() => {
            applyBodyGradient();
          }, 800);
    }, timeEntervaltoWait); // Wait 1 second at 100%
    
      
  }

  // Preload the Collaboration_Animation.gif while loading screen is active
  const gifPreload = new Image();
  let gifLoaded = false;
  let appReady = false;
  
  gifPreload.onload = () => {
    gifLoaded = true;
    console.log('GIF loaded');
    // Pre-render the GIF container so it's ready to show instantly
    prepareGifContainer();
  };
  
  gifPreload.onerror = () => {
    // If GIF fails to load, still allow page to continue
    gifLoaded = true;
  };
  
  gifPreload.src = 'assets/icons/Collaboration_Animation.gif';

  // Pre-create the GIF container while loading so it's ready to display
  function prepareGifContainer() {
    const gifId = "empty-state-gif";
    let gifContainer = document.getElementById(gifId);
    
    if (!gifContainer) {
      // Lock viewport to prevent any shifts
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
      
      // Inject CSS if not already present
      if (!document.getElementById("empty-state-style")) {
        const style = document.createElement("style");
        style.id = "empty-state-style";
        style.textContent = `
          #empty-state-gif {
            display: block;
            visibility: hidden;
            text-align: center;
            margin: 40px auto;
            opacity: 0;
            transition: opacity 0.4s ease;
            position: relative;
            z-index: 1;
          }
          #empty-state-gif img {
            max-width: 300px;
            height: auto;
            display: block;
            margin: 0 auto;
          }
          #message-container {
            position: relative;
            overflow: hidden;
            height: 1.9em;
            margin-top: 20px;
            color: #6b7280;
            font-weight: 500;
          }
          #empty-text {
            position: absolute;
            width: 100%;
            left: 0;
            top: 0;
            text-align: center;
            transform: translateY(0);
            transition: transform 0.6s ease;
          }
          @media (max-width: 600px) {
            #empty-state-gif img {
              max-width: 220px;
            }
            #message-container {
              font-size: 1.2rem;
              margin-top: 12px;
            }
          }
          @media (min-width: 601px) and (max-width: 1024px) {
            #empty-state-gif img {
              max-width: 260px;
            }
            #message-container {
              font-size: 1.6rem;
            }
          }
          @media (min-width: 1025px) {
            #message-container {
              font-size: 2rem;
            }
          }
        `;
        document.head.appendChild(style);
      }

      // Create the container
      gifContainer = document.createElement("div");
      gifContainer.id = gifId;
      gifContainer.innerHTML = `
        <img src="assets/icons/Collaboration_Animation.gif" 
             alt="Collaboration animation" />
        <div id="message-container">
          <p id="empty-text">Hello There!</p>
        </div>
      `;

      const tabsContainer = document.getElementById("tabs-container");
      if (tabsContainer) {
        tabsContainer.insertAdjacentElement("afterend", gifContainer);
      } else {
        document.body.appendChild(gifContainer);
      }
      
      console.log('GIF container pre-created and ready');
    }
  }

  // Start progressive indicator
  startProgress();

  // Custom event: main app dispatches this when data is loaded and ready
  window.addEventListener('app-ready', () => {
    console.log('App ready event received');
    appReady = true;
    
    // Wait for GIF to load, then hide after showing 100% briefly
    const checkAndHide = () => {
      if (gifLoaded) {
        console.log('Both GIF and app ready - hiding loading screen');
        // Show 100% for 200ms so user sees completion
        setTimeout(completeProgressAndHide, 200);
      } else {
        // Check again in 50ms
        setTimeout(checkAndHide, 50);
      }
    };
    checkAndHide();
  });

  // Fallback: if app-ready doesn't fire, use window load
  window.addEventListener('load', () => {
    setTimeout(() => {
      if (!appReady) {
        console.log('Fallback: using window load event');
        appReady = true;
        const checkAndHide = () => {
          if (gifLoaded) {
            setTimeout(completeProgressAndHide, 200);
          } else {
            setTimeout(checkAndHide, 50);
          }
        };
        checkAndHide();
      }
    }, 500);
  });

  // Safety: if nothing happened after 12s, show actionable hint and allow manual dismiss
  setTimeout(() => {
    if (progress < 95) {
      progressHint.innerHTML = 'Taking longer than usual — <a id="loading-refresh" href="#">refresh</a> or check your connection.';
      const refreshLink = document.getElementById('loading-refresh');
      if (refreshLink) {
        refreshLink.addEventListener('click', (e) => { e.preventDefault(); location.reload(); });
      }
    }
  }, 12000);

  timeline.add({
      targets: "#loading-screen .g",
      opacity: [0, 1],
      scale: [0.8, 1],
      rotateX: [90, 0],
      duration: 700,
    })
    .add({
      targets: "#loading-screen .p",
      opacity: [0, 1],
      scale: [0.8, 1],
      rotateX: [90, 0],
      duration: 700,
    }, "-=400")
    .add({
      targets: "#loading-screen .tracker",
      opacity: [0, 1],
      scale: [0.8, 1],
      rotateX: [90, 0],
      duration: 800,
    }, "-=500")
    .add({
      targets: "#loading-screen .payment",
      opacity: [0, 1],
      scale: [0.8, 1],
      rotateY: [-90, 0],
      duration: 700,
    }, "-=600")
    .add({
      targets: "#loading-screen .group",
      opacity: [0, 1],
      scale: [0.8, 1],
      rotateY: [-90, 0],
      duration: 700,
    }, "-=400")
    .add({
      targets: "#loading-screen .word",
      translateY: [0, -10],
      direction: "alternate",
      easing: "easeInOutSine",
      duration: 800,
      delay: anime.stagger(120),
    });

  timeline
    .add({
      targets: '#loading-screen .word',
      opacity: [1, 0],
      scale: [1, 0.6],
      rotateX: [0, -70],
      duration: 600,
      easing: 'easeInQuad',
      delay: anime.stagger(-80)
    })
    .add({ duration: 300 });  // Smoother pause
});