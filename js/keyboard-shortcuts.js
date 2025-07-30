/**
 * Enhanced Keyboard Shortcuts for Desktop Navigation
 * Provides desktop-optimized keyboard interactions for the wallet interface
 */

class KeyboardShortcuts {
  constructor() {
    this.shortcuts = new Map();
    this.init();
  }

  init() {
    // Register keyboard shortcuts
    this.registerShortcuts();
    
    // Add event listeners
    document.addEventListener('keydown', this.handleKeydown.bind(this));
    document.addEventListener('keyup', this.handleKeyup.bind(this));
    
    // Add visual shortcuts indicator
    this.createShortcutsIndicator();
    
    console.log('Keyboard shortcuts initialized');
  }

  registerShortcuts() {
    // Tab navigation (Alt + Number)
    this.shortcuts.set('Alt+1', () => this.activateTab('tab_overview'));
    this.shortcuts.set('Alt+2', () => this.activateTab('tab_doginals'));
    this.shortcuts.set('Alt+3', () => this.activateTab('tab_send'));
    this.shortcuts.set('Alt+4', () => this.activateTab('tab_history'));
    
    // Quick actions (Ctrl + Letter)
    this.shortcuts.set('Ctrl+s', () => this.triggerQuickSend());
    this.shortcuts.set('Ctrl+r', () => this.triggerQuickReceive());
    this.shortcuts.set('Ctrl+h', () => this.activateTab('tab_history'));
    this.shortcuts.set('Ctrl+d', () => this.activateTab('tab_doginals'));
    
    // Settings and utilities
    this.shortcuts.set('Ctrl+,', () => this.openSettings());
    this.shortcuts.set('Ctrl+k', () => this.openCommandPalette());
    this.shortcuts.set('Escape', () => this.closeModals());
    this.shortcuts.set('F1', () => this.showShortcutsHelp());
    
    // Copy address (Ctrl+C when address is visible)
    this.shortcuts.set('Ctrl+c', () => this.copyAddress());
    
    // Refresh actions
    this.shortcuts.set('Ctrl+F5', () => this.refreshBalance());
    this.shortcuts.set('F5', () => this.refreshCurrentTab());
  }

  handleKeydown(event) {
    // Build shortcut string
    const shortcut = this.buildShortcutString(event);
    
    // Check if we have a registered shortcut
    if (this.shortcuts.has(shortcut)) {
      event.preventDefault();
      event.stopPropagation();
      
      // Add visual feedback
      this.showShortcutFeedback(shortcut);
      
      // Execute shortcut
      const action = this.shortcuts.get(shortcut);
      try {
        action();
      } catch (error) {
        console.error('Error executing shortcut:', error);
      }
    }
    
    // Handle arrow key navigation in tabs
    if (event.target.matches('.tab-button')) {
      this.handleTabNavigation(event);
    }
  }

  handleKeyup(event) {
    // Handle any key up events if needed
  }

  buildShortcutString(event) {
    const keys = [];
    
    if (event.ctrlKey) keys.push('Ctrl');
    if (event.altKey) keys.push('Alt');
    if (event.shiftKey) keys.push('Shift');
    if (event.metaKey) keys.push('Meta');
    
    // Handle special keys
    if (event.key === 'Escape') {
      keys.push('Escape');
    } else if (event.key === 'F1') {
      keys.push('F1');
    } else if (event.key === 'F5') {
      keys.push('F5');
    } else if (event.key.length === 1) {
      keys.push(event.key.toLowerCase());
    }
    
    return keys.join('+');
  }

  activateTab(tabId) {
    const tabButton = document.getElementById(tabId);
    if (tabButton && !tabButton.classList.contains('active')) {
      tabButton.click();
      tabButton.focus();
      this.showNotification(`Switched to ${tabButton.textContent.trim()}`, 'info');
    }
  }

  triggerQuickSend() {
    const sendButton = document.getElementById('quick_send_button');
    if (sendButton) {
      sendButton.click();
      this.showNotification('Quick Send activated', 'success');
    } else {
      // If not on overview tab, switch to send tab
      this.activateTab('tab_send');
    }
  }

  triggerQuickReceive() {
    const receiveButton = document.getElementById('quick_receive_button');
    if (receiveButton) {
      receiveButton.click();
      this.showNotification('Quick Receive activated', 'success');
    }
  }

  openSettings() {
    const settingsButton = document.getElementById('main_settings_button');
    if (settingsButton) {
      settingsButton.click();
      this.showNotification('Settings opened', 'info');
    }
  }

  openCommandPalette() {
    // Future enhancement: Command palette
    this.showNotification('Command palette (Coming soon)', 'info');
  }

  closeModals() {
    // Close any open modals or overlays
    const modals = document.querySelectorAll('.modal.active, .overlay.active');
    modals.forEach(modal => {
      modal.classList.remove('active');
    });
    
    // Close settings menu if open
    const settingsMenu = document.querySelector('.settings-menu.active');
    if (settingsMenu) {
      settingsMenu.classList.remove('active');
    }
    
    if (modals.length > 0) {
      this.showNotification('Modals closed', 'info');
    }
  }

  copyAddress() {
    const copyButton = document.getElementById('copy_address_button');
    if (copyButton && document.activeElement !== document.querySelector('input')) {
      copyButton.click();
    }
  }

  refreshBalance() {
    // Refresh wallet balance
    if (window.wallet && typeof window.wallet.refreshBalance === 'function') {
      window.wallet.refreshBalance();
      this.showNotification('Balance refreshed', 'success');
    }
  }

  refreshCurrentTab() {
    const activeTab = document.querySelector('.tab-button.active');
    if (activeTab) {
      const tabId = activeTab.id;
      
      // Trigger refresh based on current tab
      if (tabId === 'tab_doginals') {
        const refreshButton = document.getElementById('refresh_doginals_button');
        if (refreshButton) refreshButton.click();
      } else if (tabId === 'tab_history') {
        const refreshButton = document.getElementById('refresh_history_button');
        if (refreshButton) refreshButton.click();
      }
      
      this.showNotification(`${activeTab.textContent.trim()} refreshed`, 'success');
    }
  }

  handleTabNavigation(event) {
    const tabs = Array.from(document.querySelectorAll('.tab-button'));
    const currentIndex = tabs.indexOf(event.target);
    
    let nextIndex = currentIndex;
    
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
      event.preventDefault();
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
      event.preventDefault();
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.target.click();
      event.preventDefault();
    }
    
    if (nextIndex !== currentIndex) {
      tabs[nextIndex].focus();
    }
  }

  showShortcutFeedback(shortcut) {
    // Create visual feedback element
    const feedback = document.createElement('div');
    feedback.className = 'shortcut-feedback';
    feedback.textContent = shortcut;
    feedback.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--color-primary);
      color: white;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      z-index: 10000;
      animation: shortcutFeedback 0.8s ease-out forwards;
      pointer-events: none;
    `;
    
    // Add CSS animation if not already present
    if (!document.getElementById('shortcut-feedback-styles')) {
      const style = document.createElement('style');
      style.id = 'shortcut-feedback-styles';
      style.textContent = `
        @keyframes shortcutFeedback {
          0% {
            opacity: 0;
            transform: translateY(-10px) scale(0.9);
          }
          20% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          80% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-10px) scale(0.9);
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(feedback);
    
    // Remove after animation
    setTimeout(() => {
      if (feedback.parentNode) {
        feedback.parentNode.removeChild(feedback);
      }
    }, 800);
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      z-index: 10000;
      max-width: 300px;
      animation: notificationSlide 3s ease-out forwards;
      pointer-events: none;
    `;
    
    // Set colors based on type
    const colors = {
      info: { bg: 'var(--color-primary)', color: 'white' },
      success: { bg: 'var(--text-success)', color: 'white' },
      warning: { bg: 'var(--text-warning)', color: 'white' },
      error: { bg: 'var(--text-error)', color: 'white' }
    };
    
    const colorScheme = colors[type] || colors.info;
    notification.style.background = colorScheme.bg;
    notification.style.color = colorScheme.color;
    
    // Add notification animation if not already present
    if (!document.getElementById('notification-styles')) {
      const style = document.createElement('style');
      style.id = 'notification-styles';
      style.textContent = `
        @keyframes notificationSlide {
          0% {
            opacity: 0;
            transform: translateX(100%);
          }
          10% {
            opacity: 1;
            transform: translateX(0);
          }
          90% {
            opacity: 1;
            transform: translateX(0);
          }
          100% {
            opacity: 0;
            transform: translateX(100%);
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Remove after animation
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  createShortcutsIndicator() {
    // Add shortcuts indicator to help users discover keyboard shortcuts
    const indicator = document.createElement('div');
    indicator.className = 'shortcuts-indicator';
    indicator.innerHTML = `
      <div class="shortcuts-tip">
        <span>💡</span>
        <span>Press F1 for keyboard shortcuts</span>
      </div>
    `;
    
    indicator.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      z-index: 1000;
      opacity: 0.7;
      transition: opacity 0.3s ease;
      pointer-events: none;
    `;
    
    const tip = indicator.querySelector('.shortcuts-tip');
    tip.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      padding: 8px 12px;
      border-radius: 20px;
      font-size: 12px;
      color: var(--text-tertiary);
      box-shadow: var(--shadow-sm);
    `;
    
    document.body.appendChild(indicator);
    
    // Hide after 5 seconds
    setTimeout(() => {
      indicator.style.opacity = '0';
      setTimeout(() => {
        if (indicator.parentNode) {
          indicator.parentNode.removeChild(indicator);
        }
      }, 300);
    }, 5000);
  }

  showShortcutsHelp() {
    const helpContent = `
      <h3>Keyboard Shortcuts</h3>
      <div class="shortcuts-grid">
        <div class="shortcut-group">
          <h4>Navigation</h4>
          <div><kbd>Alt + 1</kbd> Overview</div>
          <div><kbd>Alt + 2</kbd> Doginals</div>
          <div><kbd>Alt + 3</kbd> Send</div>
          <div><kbd>Alt + 4</kbd> History</div>
        </div>
        <div class="shortcut-group">
          <h4>Quick Actions</h4>
          <div><kbd>Ctrl + S</kbd> Quick Send</div>
          <div><kbd>Ctrl + R</kbd> Quick Receive</div>
          <div><kbd>Ctrl + C</kbd> Copy Address</div>
          <div><kbd>F5</kbd> Refresh Tab</div>
        </div>
        <div class="shortcut-group">
          <h4>Utilities</h4>
          <div><kbd>Ctrl + ,</kbd> Settings</div>
          <div><kbd>Escape</kbd> Close Modals</div>
          <div><kbd>F1</kbd> This Help</div>
        </div>
      </div>
    `;
    
    this.showModal('Keyboard Shortcuts', helpContent);
  }

  showModal(title, content) {
    // Remove existing modal
    const existingModal = document.getElementById('shortcuts-modal');
    if (existingModal) {
      existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.id = 'shortcuts-modal';
    modal.className = 'modal active';
    modal.innerHTML = `
      <div class="modal-overlay" onclick="this.parentNode.remove()"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h2>${title}</h2>
          <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
        </div>
        <div class="modal-body">
          ${content}
        </div>
      </div>
    `;
    
    // Add modal styles
    const modalStyles = `
      .modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10000;
        display: none;
      }
      .modal.active {
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .modal-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
      }
      .modal-content {
        background: var(--color-surface);
        border-radius: var(--radius-2xl);
        box-shadow: var(--shadow-2xl);
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        position: relative;
        animation: modalSlideIn 0.3s ease-out;
      }
      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-6);
        border-bottom: 1px solid var(--color-border);
      }
      .modal-body {
        padding: var(--space-6);
      }
      .close-btn {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: var(--text-tertiary);
        padding: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--radius-md);
      }
      .close-btn:hover {
        background: var(--color-surface-hover);
        color: var(--text-primary);
      }
      .shortcuts-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--space-6);
      }
      .shortcut-group h4 {
        margin-bottom: var(--space-3);
        color: var(--color-primary);
        font-size: var(--font-lg);
      }
      .shortcut-group div {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-2) 0;
        border-bottom: 1px solid var(--color-border-light);
      }
      .shortcut-group div:last-child {
        border-bottom: none;
      }
      kbd {
        background: var(--color-surface-alt);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        padding: var(--space-1) var(--space-2);
        font-family: var(--font-family-mono);
        font-size: var(--font-xs);
        color: var(--text-primary);
      }
      @keyframes modalSlideIn {
        from {
          opacity: 0;
          transform: translateY(-50px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
    `;
    
    // Add styles if not already present
    if (!document.getElementById('modal-styles')) {
      const style = document.createElement('style');
      style.id = 'modal-styles';
      style.textContent = modalStyles;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(modal);
  }
}

// Initialize keyboard shortcuts when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new KeyboardShortcuts();
  });
} else {
  new KeyboardShortcuts();
}

// Export for use in other modules
window.KeyboardShortcuts = KeyboardShortcuts;