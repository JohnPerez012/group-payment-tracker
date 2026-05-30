/**
 * ============================================
 * MAINTENANCE OVERLAY
 * ============================================
 * Displays a full-screen blur overlay with a sad message
 * indicating the app is no longer maintained
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    enabled: true, // Set to false to disable the overlay
    showImmediately: true, // Show as soon as page loads
    allowClose: false // Set to true if you want to allow users to close it
  };

  /**
   * Create and inject the maintenance overlay
   */
  function createMaintenanceOverlay() {
    // Check if overlay already exists
    if (document.getElementById('maintenance-overlay')) {
      return;
    }

    // Create overlay container
    const overlay = document.createElement('div');
    overlay.id = 'maintenance-overlay';
    overlay.className = 'maintenance-overlay';

    // Create dialog box
    const dialog = document.createElement('div');
    dialog.className = 'maintenance-dialog';

    // Build the content
    dialog.innerHTML = `
      <div class="maintenance-icon">😢</div>
      
      <h1 class="maintenance-title">
        Service Discontinued
      </h1>
      
      <p class="maintenance-message">
        We're sad to inform you that this web application is no longer maintained or available.
      </p>
      
      <p class="maintenance-submessage">
        Thank you for being part of our journey. We appreciate all the support and memories we've shared together.
      </p>
      
      <div class="maintenance-footer">
        Made with <span class="maintenance-heart">♥</span> but no longer supported
      </div>
    `;

    // Append dialog to overlay
    overlay.appendChild(dialog);

    // Add to body
    document.body.appendChild(overlay);
    document.body.classList.add('maintenance-active');

    // Prevent any clicks from reaching background
    overlay.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
    }, true);

    // Prevent scrolling
    document.addEventListener('wheel', preventScroll, { passive: false });
    document.addEventListener('touchmove', preventScroll, { passive: false });
    document.addEventListener('keydown', preventKeyboardScroll, { passive: false });

    console.log('🚫 Maintenance overlay activated');
  }

  /**
   * Prevent scroll events
   */
  function preventScroll(e) {
    if (document.getElementById('maintenance-overlay')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }

  /**
   * Prevent keyboard scrolling (arrow keys, space, page up/down)
   */
  function preventKeyboardScroll(e) {
    if (document.getElementById('maintenance-overlay')) {
      const scrollKeys = [32, 33, 34, 35, 36, 37, 38, 39, 40];
      if (scrollKeys.includes(e.keyCode)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }
  }

  /**
   * Remove the maintenance overlay (if allowed)
   */
  function removeMaintenanceOverlay() {
    const overlay = document.getElementById('maintenance-overlay');
    if (overlay) {
      overlay.remove();
      document.body.classList.remove('maintenance-active');
      
      // Re-enable scrolling
      document.removeEventListener('wheel', preventScroll);
      document.removeEventListener('touchmove', preventScroll);
      document.removeEventListener('keydown', preventKeyboardScroll);
      
      console.log('✅ Maintenance overlay removed');
    }
  }

  /**
   * Initialize the overlay
   */
  function init() {
    if (!CONFIG.enabled) {
      console.log('ℹ️ Maintenance overlay is disabled');
      return;
    }

    if (CONFIG.showImmediately) {
      // Show immediately when DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createMaintenanceOverlay);
      } else {
        createMaintenanceOverlay();
      }
    }

    // Expose functions globally for manual control
    window.maintenanceOverlay = {
      show: createMaintenanceOverlay,
      hide: CONFIG.allowClose ? removeMaintenanceOverlay : () => {
        console.warn('⚠️ Closing maintenance overlay is not allowed');
      },
      config: CONFIG
    };
  }

  // Start initialization
  init();

})();
