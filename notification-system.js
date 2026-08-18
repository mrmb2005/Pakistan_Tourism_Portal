/**
 * Professional Notification System
 * Replaces alert(), confirm() with beautiful toast notifications and modals
 */

// Notification styles (inject once)
if (!document.getElementById('notification-styles')) {
  const styles = document.createElement('style');
  styles.id = 'notification-styles';
  styles.textContent = `
    /* Notification Container */
    .notification-container {
      position: fixed;
      top: 80px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 400px;
      pointer-events: none;
    }

    /* Toast Notification */
    .toast-notification {
      background: white;
      padding: 16px 20px;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 300px;
      pointer-events: auto;
      animation: slideInRight 0.3s ease-out;
      border-left: 4px solid;
      position: relative;
      overflow: hidden;
    }

    .toast-notification::before {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      height: 3px;
      background: currentColor;
      animation: progressBar 3s linear;
    }

    @keyframes progressBar {
      from { width: 100%; }
      to { width: 0%; }
    }

    .toast-notification.success {
      border-left-color: #10b981;
      color: #10b981;
    }

    .toast-notification.error {
      border-left-color: #ef4444;
      color: #ef4444;
    }

    .toast-notification.warning {
      border-left-color: #f59e0b;
      color: #f59e0b;
    }

    .toast-notification.info {
      border-left-color: #3b82f6;
      color: #3b82f6;
    }

    .toast-icon {
      font-size: 24px;
      flex-shrink: 0;
    }

    .toast-content {
      flex: 1;
      color: #333;
    }

    .toast-title {
      font-weight: 600;
      margin-bottom: 4px;
      color: #1f2937;
    }

    .toast-message {
      font-size: 14px;
      color: #6b7280;
      line-height: 1.4;
    }

    .toast-close {
      background: none;
      border: none;
      color: #9ca3af;
      font-size: 20px;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: all 0.2s;
    }

    .toast-close:hover {
      background: #f3f4f6;
      color: #1f2937;
    }

    @keyframes slideInRight {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes slideOutRight {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }

    .toast-notification.removing {
      animation: slideOutRight 0.3s ease-out forwards;
    }

    /* Confirmation Modal */
    .confirm-modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.2s ease-out;
    }

    .confirm-modal {
      background: white;
      border-radius: 16px;
      padding: 24px;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
      animation: scaleIn 0.3s ease-out;
    }

    .confirm-modal-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
      font-size: 24px;
    }

    .confirm-modal-icon.warning {
      background: #fef3c7;
      color: #f59e0b;
    }

    .confirm-modal-icon.danger {
      background: #fee2e2;
      color: #ef4444;
    }

    .confirm-modal-icon.info {
      background: #dbeafe;
      color: #3b82f6;
    }

    .confirm-modal-title {
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
      text-align: center;
      margin-bottom: 8px;
    }

    .confirm-modal-message {
      font-size: 14px;
      color: #6b7280;
      text-align: center;
      margin-bottom: 24px;
      line-height: 1.5;
    }

    .confirm-modal-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
    }

    .confirm-btn {
      padding: 10px 24px;
      border-radius: 8px;
      border: none;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 14px;
    }

    .confirm-btn-primary {
      background: #b85c72;
      color: white;
    }

    .confirm-btn-primary:hover {
      background: #a04d61;
      transform: translateY(-2px);
    }

    .confirm-btn-secondary {
      background: #f3f4f6;
      color: #6b7280;
    }

    .confirm-btn-secondary:hover {
      background: #e5e7eb;
    }

    .confirm-btn-danger {
      background: #ef4444;
      color: white;
    }

    .confirm-btn-danger:hover {
      background: #dc2626;
      transform: translateY(-2px);
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes scaleIn {
      from {
        transform: scale(0.9);
        opacity: 0;
      }
      to {
        transform: scale(1);
        opacity: 1;
      }
    }

    /* Loading Overlay */
    .loading-overlay {
      position: fixed;
      inset: 0;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(8px);
      z-index: 10001;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.2s ease-out;
    }

    .loading-spinner {
      width: 50px;
      height: 50px;
      border: 4px solid #f3f4f6;
      border-top-color: #b85c72;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .loading-text {
      margin-top: 16px;
      color: #6b7280;
      font-weight: 500;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .notification-container {
        right: 10px;
        left: 10px;
        max-width: none;
      }

      .toast-notification {
        min-width: 0;
      }

      .confirm-modal {
        margin: 20px;
      }
    }
  `;
  document.head.appendChild(styles);
}

// Create notification container
let notificationContainer = document.getElementById('notification-container');
if (!notificationContainer) {
  notificationContainer = document.createElement('div');
  notificationContainer.id = 'notification-container';
  notificationContainer.className = 'notification-container';
  document.body.appendChild(notificationContainer);
}

// Notification System
const Notify = {
  /**
   * Show a toast notification
   * @param {string} message - The message to display
   * @param {string} type - Type: 'success', 'error', 'warning', 'info'
   * @param {string} title - Optional title
   * @param {number} duration - Duration in ms (default: 3000)
   */
  toast(message, type = 'info', title = '', duration = 3000) {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };

    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    toast.innerHTML = `
      <div class="toast-icon">${icons[type] || icons.info}</div>
      <div class="toast-content">
        ${title ? `<div class="toast-title">${title}</div>` : ''}
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;

    notificationContainer.appendChild(toast);

    // Auto remove after duration
    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 300);
    }, duration);

    return toast;
  },

  success(message, title = 'Success') {
    return this.toast(message, 'success', title);
  },

  error(message, title = 'Error') {
    return this.toast(message, 'error', title);
  },

  warning(message, title = 'Warning') {
    return this.toast(message, 'warning', title);
  },

  info(message, title = '') {
    return this.toast(message, 'info', title);
  },

  /**
   * Show a confirmation dialog
   * @param {string} message - The message to display
   * @param {object} options - Options {title, confirmText, cancelText, type}
   * @returns {Promise<boolean>} - Resolves to true if confirmed, false if cancelled
   */
  confirm(message, options = {}) {
    return new Promise((resolve) => {
      const {
        title = 'Confirm Action',
        confirmText = 'Confirm',
        cancelText = 'Cancel',
        type = 'warning', // warning, danger, info
        isDanger = false
      } = options;

      const icons = {
        warning: '⚠️',
        danger: '🗑️',
        info: 'ℹ️'
      };

      const overlay = document.createElement('div');
      overlay.className = 'confirm-modal-overlay';
      overlay.innerHTML = `
        <div class="confirm-modal">
          <div class="confirm-modal-icon ${type}">
            ${icons[type] || icons.warning}
          </div>
          <h3 class="confirm-modal-title">${title}</h3>
          <p class="confirm-modal-message">${message}</p>
          <div class="confirm-modal-actions">
            <button class="confirm-btn confirm-btn-secondary" id="confirm-cancel">
              ${cancelText}
            </button>
            <button class="confirm-btn ${isDanger ? 'confirm-btn-danger' : 'confirm-btn-primary'}" id="confirm-ok">
              ${confirmText}
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);

      const handleClose = (result) => {
        overlay.style.animation = 'fadeOut 0.2s ease-out';
        setTimeout(() => {
          overlay.remove();
          resolve(result);
        }, 200);
      };

      overlay.querySelector('#confirm-ok').addEventListener('click', () => handleClose(true));
      overlay.querySelector('#confirm-cancel').addEventListener('click', () => handleClose(false));
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) handleClose(false);
      });
    });
  },

  /**
   * Show loading overlay
   * @param {string} message - Loading message
   * @returns {object} - Object with hide() method
   */
  loading(message = 'Loading...') {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
      <div class="loading-spinner"></div>
      <div class="loading-text">${message}</div>
    `;
    document.body.appendChild(overlay);

    return {
      hide() {
        overlay.style.animation = 'fadeOut 0.2s ease-out';
        setTimeout(() => overlay.remove(), 200);
      },
      updateMessage(newMessage) {
        overlay.querySelector('.loading-text').textContent = newMessage;
      }
    };
  }
};

// Make it globally available
window.Notify = Notify;

// Add fadeOut animation
const fadeOutStyle = document.createElement('style');
fadeOutStyle.textContent = `
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
`;
document.head.appendChild(fadeOutStyle);
