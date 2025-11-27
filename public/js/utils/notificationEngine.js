// Unified notification system
export function showNotification(msg, type = 'info') {
  // Remove existing notification if any
  const existing = document.querySelector('.custom-notification');
  if (existing) {
    existing.remove();
  }

  // Create notification element
  const notification = document.createElement('div');
  notification.className = `custom-notification ${type}`;
  notification.textContent = msg;
  
  // Add styles
  Object.assign(notification.style, {
    position: 'fixed',
    bottom: '2rem',
    right: '2rem',
    padding: '1rem 1.5rem',
    background: getNotificationColor(type),
    color: 'white',
    borderRadius: '0.75rem',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
    zIndex: '9999',
    fontWeight: '500',
    fontSize: '0.95rem',
    animation: 'slideInUp 0.3s ease',
    maxWidth: '300px'
  });

  document.body.appendChild(notification);

  // Auto remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOutDown 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function getNotificationColor(type) {
  const colors = {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6'
  };
  return colors[type] || colors.info;
}

// Add notification styles to document
export function initNotificationStyles() {
  if (document.getElementById('notification-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'notification-styles';
  style.textContent = `
    @keyframes slideInUp {
      from {
        transform: translateY(100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
    
    @keyframes slideOutDown {
      from {
        transform: translateY(0);
        opacity: 1;
      }
      to {
        transform: translateY(100%);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}