/**
 * UI Controller for Woof Wallet
 * Enhanced with accessibility, touch support, and responsive design
 */

class WalletUI {
    constructor() {
        this.currentScreen = null;
        this.currentTab = 'overview';
        this.isLoading = false;
        this.selectedInscription = null;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.lastActivity = Date.now();
        this.accessibilityMode = false;
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.highContrast = window.matchMedia('(prefers-contrast: high)').matches;
    }

    /**
     * Initialize the UI with enhanced accessibility and touch support
     */
    init() {
        this.setupEventListeners();
        this.setupAccessibilityFeatures();
        this.setupTouchSupport();
        this.setupKeyboardNavigation();
        this.showLoadingScreen();
        this.announceToScreenReader('Woof Wallet is loading');
    }

    /**
     * Set up accessibility features
     */
    setupAccessibilityFeatures() {
        // Monitor accessibility preferences
        window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
            this.reducedMotion = e.matches;
            document.body.classList.toggle('reduced-motion', e.matches);
        });

        window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
            this.highContrast = e.matches;
            document.body.classList.toggle('high-contrast', e.matches);
        });

        // Add focus trap for modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeActiveModal();
            }
        });

        // Announce dynamic content changes
        this.setupLiveRegions();
    }

    /**
     * Set up touch support for mobile devices
     */
    setupTouchSupport() {
        // Touch events for tab swiping
        const tabContainer = document.querySelector('.wallet-tabs');
        if (tabContainer) {
            tabContainer.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
            tabContainer.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
            tabContainer.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
        }

        // Add haptic feedback for supported devices
        this.setupHapticFeedback();

        // Optimize touch targets
        this.optimizeTouchTargets();
    }

    /**
     * Handle touch start events
     */
    handleTouchStart(e) {
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
    }

    /**
     * Handle touch move events
     */
    handleTouchMove(e) {
        if (!this.touchStartX || !this.touchStartY) {
            return;
        }

        const touchEndX = e.touches[0].clientX;
        const touchEndY = e.touches[0].clientY;
        const diffX = this.touchStartX - touchEndX;
        const diffY = this.touchStartY - touchEndY;

        // Prevent vertical scrolling if horizontal swipe is detected
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
            e.preventDefault();
        }
    }

    /**
     * Handle touch end events for tab swiping
     */
    handleTouchEnd(e) {
        if (!this.touchStartX || !this.touchStartY) {
            return;
        }

        const touchEndX = e.changedTouches[0].clientX;
        const diffX = this.touchStartX - touchEndX;

        // Minimum swipe distance
        if (Math.abs(diffX) > 100) {
            if (diffX > 0) {
                this.switchToNextTab();
            } else {
                this.switchToPreviousTab();
            }
        }

        this.touchStartX = 0;
        this.touchStartY = 0;
    }

    /**
     * Set up keyboard navigation
     */
    setupKeyboardNavigation() {
        // Tab navigation
        document.addEventListener('keydown', (e) => {
            if (e.target.classList.contains('tab-button')) {
                this.handleTabKeyNavigation(e);
            }
        });

        // General keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case '1':
                        e.preventDefault();
                        this.switchToTab('overview');
                        break;
                    case '2':
                        e.preventDefault();
                        this.switchToTab('doginals');
                        break;
                    case '3':
                        e.preventDefault();
                        this.switchToTab('send');
                        break;
                    case '4':
                        e.preventDefault();
                        this.switchToTab('history');
                        break;
                    case 'r':
                        e.preventDefault();
                        this.refreshCurrentTab();
                        break;
                }
            }
        });
    }

    /**
     * Handle keyboard navigation for tabs
     */
    handleTabKeyNavigation(e) {
        const tabs = Array.from(document.querySelectorAll('.tab-button'));
        const currentIndex = tabs.findIndex(tab => tab === e.target);

        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                const prevIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
                tabs[prevIndex].focus();
                break;
            case 'ArrowRight':
                e.preventDefault();
                const nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
                tabs[nextIndex].focus();
                break;
            case 'Home':
                e.preventDefault();
                tabs[0].focus();
                break;
            case 'End':
                e.preventDefault();
                tabs[tabs.length - 1].focus();
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                e.target.click();
                break;
        }
    }

    /**
     * Set up haptic feedback for touch interactions
     */
    setupHapticFeedback() {
        if ('vibrate' in navigator) {
            // Add haptic feedback to buttons
            document.addEventListener('touchstart', (e) => {
                if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
                    navigator.vibrate(10); // Short vibration
                }
            });
        }
    }

    /**
     * Optimize touch targets for mobile accessibility
     */
    optimizeTouchTargets() {
        const smallTargets = document.querySelectorAll('button, a, input, select');
        smallTargets.forEach(target => {
            const rect = target.getBoundingClientRect();
            if (rect.width < 44 || rect.height < 44) {
                target.style.minWidth = '44px';
                target.style.minHeight = '44px';
                target.style.display = 'inline-flex';
                target.style.alignItems = 'center';
                target.style.justifyContent = 'center';
            }
        });
    }

    /**
     * Set up live regions for screen reader announcements
     */
    setupLiveRegions() {
        // Create announcement region if it doesn't exist
        if (!document.getElementById('announcements')) {
            const announcements = document.createElement('div');
            announcements.id = 'announcements';
            announcements.className = 'sr-only';
            announcements.setAttribute('aria-live', 'polite');
            announcements.setAttribute('aria-atomic', 'true');
            document.body.appendChild(announcements);
        }
    }

    /**
     * Announce messages to screen readers
     */
    announceToScreenReader(message) {
        const announcements = document.getElementById('announcements');
        if (announcements) {
            announcements.textContent = message;
            setTimeout(() => {
                announcements.textContent = '';
            }, 1000);
        }
    }

    /**
     * Switch to next tab
     */
    switchToNextTab() {
        const tabs = ['overview', 'doginals', 'send', 'history'];
        const currentIndex = tabs.indexOf(this.currentTab);
        const nextIndex = (currentIndex + 1) % tabs.length;
        this.switchToTab(tabs[nextIndex]);
    }

    /**
     * Switch to previous tab
     */
    switchToPreviousTab() {
        const tabs = ['overview', 'doginals', 'send', 'history'];
        const currentIndex = tabs.indexOf(this.currentTab);
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
        this.switchToTab(tabs[prevIndex]);
    }

    /**
     * Enhanced tab switching with accessibility support
     */
    switchToTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
            const isActive = btn.id === `tab_${tabName}`;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-selected', isActive);
            btn.setAttribute('tabindex', isActive ? '0' : '-1');
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            const isActive = content.id === `${tabName}_tab`;
            content.classList.toggle('active', isActive);
            content.setAttribute('aria-hidden', !isActive);
        });

        this.currentTab = tabName;
        this.announceToScreenReader(`Switched to ${tabName} tab`);
        
        // Add visual feedback
        this.addVisualFeedback(`tab_${tabName}`);
    }

    /**
     * Refresh current tab content
     */
    refreshCurrentTab() {
        switch (this.currentTab) {
            case 'doginals':
                document.getElementById('refresh_doginals_button')?.click();
                break;
            case 'history':
                document.getElementById('refresh_history_button')?.click();
                break;
            default:
                // Refresh balance and overview
                if (window.walletManager) {
                    window.walletManager.updateBalance();
                }
        }
        this.announceToScreenReader(`${this.currentTab} tab refreshed`);
    }

    /**
     * Add visual feedback to UI interactions
     */
    addVisualFeedback(elementId) {
        const element = document.getElementById(elementId);
        if (!element || this.reducedMotion) return;

        element.classList.add('feedback-flash');
        setTimeout(() => {
            element.classList.remove('feedback-flash');
        }, 150);
    }

    /**
     * Show loading state with accessibility support
     */
    showLoadingState(element, message = 'Loading...') {
        if (!element) return;

        element.classList.add('loading-state');
        element.setAttribute('aria-busy', 'true');
        
        // Update screen reader
        const statusElement = element.querySelector('[role="status"]') || element;
        const originalText = statusElement.textContent;
        statusElement.textContent = message;

        return () => {
            element.classList.remove('loading-state');
            element.setAttribute('aria-busy', 'false');
            statusElement.textContent = originalText;
        };
    }

    /**
     * Enhanced button feedback with accessibility
     */
    addButtonFeedback(button, type = 'success') {
        if (!button) return;

        const originalText = button.textContent;
        const feedback = {
            success: { text: '✓ Success', class: 'btn-success' },
            error: { text: '✗ Error', class: 'btn-error' },
            loading: { text: '⌛ Loading...', class: 'btn-loading' }
        };

        if (feedback[type]) {
            button.textContent = feedback[type].text;
            button.classList.add(feedback[type].class);
            button.setAttribute('aria-live', 'polite');

            setTimeout(() => {
                button.textContent = originalText;
                button.classList.remove(feedback[type].class);
                button.removeAttribute('aria-live');
            }, 2000);
        }
    }

    /**
     * Close active modal with accessibility support
     */
    closeActiveModal() {
        const activeModal = document.querySelector('.modal.active');
        if (activeModal) {
            activeModal.classList.remove('active');
            activeModal.setAttribute('aria-hidden', 'true');
            
            // Return focus to trigger element
            const triggerId = activeModal.dataset.triggeredBy;
            if (triggerId) {
                const triggerElement = document.getElementById(triggerId);
                if (triggerElement) {
                    triggerElement.focus();
                }
            }
            
            this.announceToScreenReader('Modal closed');
        }
    }

    /**
     * Enhanced copy functionality with feedback
     */
    async copyToClipboard(text, button) {
        try {
            await navigator.clipboard.writeText(text);
            this.addButtonFeedback(button, 'success');
            this.announceToScreenReader('Copied to clipboard');
            
            // Haptic feedback
            if ('vibrate' in navigator) {
                navigator.vibrate(50);
            }
        } catch (err) {
            this.addButtonFeedback(button, 'error');
            this.announceToScreenReader('Failed to copy');
            console.error('Failed to copy text: ', err);
        }
    }

    /**
     * Set up all event listeners with enhanced functionality
     */
    setupEventListeners() {
        // Terms acceptance
        const acceptTermsBtn = document.getElementById('accept_terms_button');
        if (acceptTermsBtn) {
            acceptTermsBtn.addEventListener('click', () => {
                this.addVisualFeedback('accept_terms_button');
                this.handleAcceptTerms();
            });
        }

        // Wallet setup with enhanced feedback
        const newWalletBtn = document.getElementById('new_wallet_button');
        const importWalletBtn = document.getElementById('import_wallet_button');
        
        if (newWalletBtn) {
            newWalletBtn.addEventListener('click', () => {
                this.addVisualFeedback('new_wallet_button');
                this.showCreateScreen();
            });
        }
        
        if (importWalletBtn) {
            importWalletBtn.addEventListener('click', () => {
                this.addVisualFeedback('import_wallet_button');
                this.showImportOptionsScreen();
            });
        }

        // Enhanced tab switching
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const tabName = e.target.id.replace('tab_', '');
                this.switchToTab(tabName);
            });
        });

        // Copy button with enhanced feedback
        const copyAddressBtn = document.getElementById('copy_address_button');
        if (copyAddressBtn) {
            copyAddressBtn.addEventListener('click', () => {
                const address = document.getElementById('wallet_address').textContent;
                this.copyToClipboard(address, copyAddressBtn);
            });
        }

        // Enhanced form validation
        this.setupFormValidation();

        // Set up remaining event listeners...
        this.setupBackButtons();
        this.setupWalletActions();
        this.setupModals();
        this.setupSettings();
        this.setupPasswordSetup();
        this.setupWalletUnlock();
        this.setupActivityTracking();
    }

    /**
     * Enhanced form validation with accessibility
     */
    setupFormValidation() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            const inputs = form.querySelectorAll('input[required]');
            inputs.forEach(input => {
                input.addEventListener('blur', () => this.validateInput(input));
                input.addEventListener('input', () => this.clearValidationError(input));
            });
        });
    }

    /**
     * Validate individual input with accessibility feedback
     */
    validateInput(input) {
        const isValid = input.checkValidity();
        const errorId = `${input.id}-error`;
        let errorElement = document.getElementById(errorId);

        if (!isValid) {
            if (!errorElement) {
                errorElement = document.createElement('div');
                errorElement.id = errorId;
                errorElement.className = 'input-error';
                errorElement.setAttribute('role', 'alert');
                input.parentNode.appendChild(errorElement);
            }
            
            errorElement.textContent = input.validationMessage;
            input.setAttribute('aria-describedby', errorId);
            input.classList.add('invalid');
        } else {
            this.clearValidationError(input);
        }

        return isValid;
    }

    /**
     * Clear validation error
     */
    clearValidationError(input) {
        const errorId = `${input.id}-error`;
        const errorElement = document.getElementById(errorId);
        
        if (errorElement) {
            errorElement.remove();
        }
        
        input.removeAttribute('aria-describedby');
        input.classList.remove('invalid');
    }

    /**
     * Set up back buttons
     */
    setupBackButtons() {
        const backButtons = [
            'back_to_setup_button',
            'back_to_import_options_button',
            'back_to_import_options_button2'
        ];

        backButtons.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', () => {
                    if (id === 'back_to_setup_button') {
                        this.showSetupScreen();
                    } else {
                        this.showImportOptionsScreen();
                    }
                });
            }
        });
    }

    /**
     * Set up wallet tabs
     */
    setupWalletTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.id.replace('tab_', '');
                this.switchTab(tabId);
            });
        });
    }

    /**
     * Set up wallet actions
     */
    setupWalletActions() {
        // Send DOGE
        const sendBtn = document.getElementById('send_doge_button');
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.handleSendDoge());
        }

        // Quick actions
        const quickSendBtn = document.getElementById('quick_send_button');
        const quickReceiveBtn = document.getElementById('quick_receive_button');
        
        if (quickSendBtn) {
            quickSendBtn.addEventListener('click', () => this.switchTab('send'));
        }
        
        if (quickReceiveBtn) {
            quickReceiveBtn.addEventListener('click', () => this.showReceiveModal());
        }

        // Refresh buttons
        const refreshBtns = document.querySelectorAll('.refresh-button');
        refreshBtns.forEach(btn => {
            btn.addEventListener('click', () => this.handleRefresh());
        });

        // Send doginal
        const sendDoginalBtn = document.getElementById('send_doginal_button');
        if (sendDoginalBtn) {
            sendDoginalBtn.addEventListener('click', () => this.handleSendDoginal());
        }
    }

    /**
     * Set up modal controls
     */
    setupModals() {
        // Close buttons
        const closeButtons = document.querySelectorAll('.close-button');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    this.hideModal(modal.id);
                }
            });
        });

        // Modal backgrounds (click to close)
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modal.id);
                }
            });
        });

        // Error modal OK button
        const errorOkBtn = document.getElementById('close_error_button');
        if (errorOkBtn) {
            errorOkBtn.addEventListener('click', () => this.hideModal('error_modal'));
        }
    }

    /**
     * Set up copy buttons
     */
    setupCopyButtons() {
        const copyButtons = document.querySelectorAll('.copy-button');
        copyButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.target;
                let textToCopy = '';

                if (target.id === 'copy_address_button') {
                    textToCopy = document.getElementById('wallet_address').textContent;
                } else if (target.id === 'copy_txid_button') {
                    textToCopy = document.getElementById('success_txid').textContent;
                } else {
                    // Find adjacent text element
                    const textElement = target.previousElementSibling;
                    if (textElement) {
                        textToCopy = textElement.textContent;
                    }
                }

                if (textToCopy) {
                    this.copyToClipboard(textToCopy);
                }
            });
        });
    }

    /**
     * Hide all screens
     */
    hideAllScreens() {
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => {
            screen.classList.remove('active');
            console.log(`❌ Hiding screen: ${screen.id}`);
        });
    }

    /**
     * Show a specific screen
     */
    showScreen(screenId) {
        console.log(`🖥️ Switching to screen: ${screenId}`);
        
        // Hide all screens
        this.hideAllScreens();

        // Show target screen
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenId;
            console.log(`✅ Showing screen: ${screenId}`);
        } else {
            console.error(`❌ Screen not found: ${screenId}`);
        }
    }

    /**
     * Show loading screen
     */
    showLoadingScreen() {
        this.showScreen('loading_screen');
    }

    /**
     * Show terms acceptance screen
     */
    showTermsScreen() {
        this.showScreen('accept_terms_screen');
    }

    /**
     * Show wallet setup screen
     */
    showSetupScreen() {
        this.showScreen('setup_screen');
    }

    /**
     * Show create wallet screen
     */
    showCreateScreen() {
        this.showScreen('create_screen');
        this.generateAndDisplayMnemonic();
    }

    /**
     * Show import options screen
     */
    showImportOptionsScreen() {
        this.showScreen('import_options_screen');
    }

    /**
     * Show import seed screen
     */
    showImportSeedScreen() {
        this.showScreen('import_seed_screen');
        // Clear previous input
        const textarea = document.getElementById('seed_textarea');
        if (textarea) {
            textarea.value = '';
        }
    }

    /**
     * Show import key screen
     */
    showImportKeyScreen() {
        this.showScreen('import_key_screen');
        // Clear previous input
        const textarea = document.getElementById('private_key_textarea');
        if (textarea) {
            textarea.value = '';
        }
    }

    /**
     * Show wallet screen
     */
    showWalletScreen() {
        this.showScreen('wallet_screen');
        this.updateWalletDisplay();
        this.switchTab('overview');
        
        // Extra safety check to ensure loading screen is hidden
        setTimeout(() => {
            const loadingScreen = document.getElementById('loading_screen');
            if (loadingScreen && loadingScreen.classList.contains('active')) {
                console.warn('⚠️ Loading screen still active after wallet screen shown - force hiding');
                loadingScreen.classList.remove('active');
            }
        }, 100);
    }

    /**
     * Switch wallet tabs
     */
    switchTab(tabId) {
        // Update tab buttons
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(btn => {
            btn.classList.remove('active');
        });

        const activeTabBtn = document.getElementById(`tab_${tabId}`);
        if (activeTabBtn) {
            activeTabBtn.classList.add('active');
        }

        // Update tab content
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(content => {
            content.classList.remove('active');
        });

        const activeTabContent = document.getElementById(`${tabId}_tab`);
        if (activeTabContent) {
            activeTabContent.classList.add('active');
        }

        this.currentTab = tabId;

        // Load tab-specific data
        this.loadTabData(tabId);
    }

    /**
     * Load data for specific tab
     */
    async loadTabData(tabId) {
        try {
            switch (tabId) {
                case 'overview':
                    await this.updateOverviewTab();
                    break;
                case 'doginals':
                    await this.updateDoginalsTab();
                    break;
                case 'send':
                    await this.updateSendTab();
                    break;
                case 'history':
                    await this.updateHistoryTab();
                    break;
            }
        } catch (error) {
            console.error(`Failed to load ${tabId} tab data:`, error);
        }
    }

    /**
     * Generate and display mnemonic
     */
    generateAndDisplayMnemonic() {
        try {
            const credentials = wallet.generateCredentials();
            this.pendingCredentials = credentials;

            const mnemonicDisplay = document.getElementById('mnemonic_display');
            if (mnemonicDisplay) {
                const words = credentials.mnemonic.toString().split(' ');
                mnemonicDisplay.innerHTML = '';

                words.forEach((word, index) => {
                    const wordElement = document.createElement('div');
                    wordElement.className = 'mnemonic-word';
                    wordElement.textContent = `${index + 1}. ${word}`;
                    mnemonicDisplay.appendChild(wordElement);
                });
            }
        } catch (error) {
            console.error('Failed to generate mnemonic:', error);
            this.showError('Failed to generate recovery phrase');
        }
    }

    /**
     * Handle terms acceptance
     */
    async handleAcceptTerms() {
        try {
            this.setButtonLoading('accept_terms_button', true);
            await wallet.acceptTerms();
            this.showSetupScreen();
        } catch (error) {
            console.error('Failed to accept terms:', error);
            this.showError('Failed to accept terms');
        } finally {
            this.setButtonLoading('accept_terms_button', false);
        }
    }

    /**
     * Handle create wallet
     */
    async handleCreateWallet() {
        try {
            this.setButtonLoading('create_wallet_ok_button', true);
            
            if (!this.pendingCredentials) {
                throw new Error('No credentials generated');
            }

            await wallet.storeCredentials(this.pendingCredentials);
            this.pendingCredentials = null;
            
            this.showWalletScreen();
            await this.handleRefresh();
        } catch (error) {
            console.error('Failed to create wallet:', error);
            this.showError('Failed to create wallet');
        } finally {
            this.setButtonLoading('create_wallet_ok_button', false);
        }
    }

    /**
     * Handle import seed
     */
    async handleImportSeed() {
        try {
            this.setButtonLoading('import_seed_ok_button', true);
            
            const textarea = document.getElementById('seed_textarea');
            const seedText = textarea.value.trim();
            
            if (!seedText) {
                throw new Error('Please enter your seed phrase');
            }

            const credentials = wallet.createCredentialsFromMnemonic(seedText);
            await wallet.storeCredentials(credentials);
            
            this.showWalletScreen();
            await this.handleRefresh();
        } catch (error) {
            console.error('Failed to import seed:', error);
            this.showError('Failed to import seed phrase: ' + error.message);
        } finally {
            this.setButtonLoading('import_seed_ok_button', false);
        }
    }

    /**
     * Handle import private key
     */
    async handleImportKey() {
        try {
            this.setButtonLoading('import_key_ok_button', true);
            
            const textarea = document.getElementById('private_key_textarea');
            const keyText = textarea.value.trim();
            
            if (!keyText) {
                throw new Error('Please enter your private key');
            }

            const credentials = wallet.createCredentialsFromPrivateKey(keyText);
            await wallet.storeCredentials(credentials);
            
            this.showWalletScreen();
            await this.handleRefresh();
        } catch (error) {
            console.error('Failed to import private key:', error);
            this.showError('Failed to import private key: ' + error.message);
        } finally {
            this.setButtonLoading('import_key_ok_button', false);
        }
    }

    /**
     * Handle refresh
     */
    async handleRefresh() {
        try {
            if (!wallet.credentials) return;
            
            this.setLoading(true);
            await wallet.refreshAll();
            this.updateWalletDisplay();
            this.loadTabData(this.currentTab);
        } catch (error) {
            console.error('Failed to refresh:', error);
            this.showError('Failed to refresh wallet data');
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Handle send DOGE
     */
    async handleSendDoge() {
        try {
            const addressInput = document.getElementById('send_address');
            const amountInput = document.getElementById('send_amount');
            const feeInput = document.getElementById('send_fee');
            
            const address = addressInput.value.trim();
            const amount = parseFloat(amountInput.value);
            const fee = parseFloat(feeInput.value);
            
            if (!address || !amount || !fee) {
                throw new Error('Please fill in all fields');
            }

            this.setButtonLoading('send_doge_button', true);
            
            const txid = await wallet.sendDoge(address, amount, fee);
            
            // Clear form
            addressInput.value = '';
            amountInput.value = '';
            
            this.showSuccessModal(txid);
        } catch (error) {
            console.error('Failed to send DOGE:', error);
            this.showError('Failed to send DOGE: ' + error.message);
        } finally {
            this.setButtonLoading('send_doge_button', false);
        }
    }

    /**
     * Handle send doginal
     */
    async handleSendDoginal() {
        try {
            if (!this.selectedInscription) {
                throw new Error('No inscription selected');
            }

            const addressInput = document.getElementById('doginal_send_address');
            const address = addressInput.value.trim();
            
            if (!address) {
                throw new Error('Please enter recipient address');
            }

            this.setButtonLoading('send_doginal_button', true);
            
            const txid = await wallet.sendDoginal(this.selectedInscription.id, address);
            
            this.hideModal('doginal_modal');
            this.showSuccessModal(txid);
        } catch (error) {
            console.error('Failed to send doginal:', error);
            this.showError('Failed to send doginal: ' + error.message);
        } finally {
            this.setButtonLoading('send_doginal_button', false);
        }
    }

    /**
     * Update wallet display
     */
    updateWalletDisplay() {
        if (!wallet.credentials) return;

        // Update address
        const addressElement = document.getElementById('wallet_address');
        if (addressElement) {
            addressElement.textContent = wallet.getAddress();
        }

        // Update balance
        const balanceElement = document.getElementById('doge_balance');
        if (balanceElement) {
            const balance = wallet.balance.total / 100000000; // Convert to DOGE
            balanceElement.textContent = `${balance.toFixed(8)} DOGE`;
        }
    }

    /**
     * Update overview tab
     */
    async updateOverviewTab() {
        const balanceElement = document.getElementById('overview_balance');
        const doginalsCountElement = document.getElementById('overview_doginals_count');
        const pendingElement = document.getElementById('overview_pending');

        if (balanceElement) {
            const balance = wallet.balance.total / 100000000;
            balanceElement.textContent = `${balance.toFixed(2)} DOGE`;
        }

        if (doginalsCountElement) {
            doginalsCountElement.textContent = Object.keys(wallet.inscriptions).length;
        }

        if (pendingElement) {
            pendingElement.textContent = wallet.numUnconfirmed || 0;
        }
    }

    /**
     * Update doginals tab
     */
    async updateDoginalsTab() {
        const container = document.getElementById('doginals_container');
        if (!container) return;

        const inscriptions = Object.values(wallet.inscriptions);
        
        if (inscriptions.length === 0) {
            container.innerHTML = '<div class="loading-message">No doginals found</div>';
            return;
        }

        container.innerHTML = '';
        
        inscriptions.forEach(inscription => {
            const item = this.createDoginalItem(inscription);
            container.appendChild(item);
        });
    }

    /**
     * Create doginal item element
     */
    createDoginalItem(inscription) {
        const item = document.createElement('div');
        item.className = 'doginal-item';
        item.addEventListener('click', () => this.showDoginalModal(inscription));

        const preview = document.createElement('div');
        preview.className = 'doginal-preview';

        if (inscription.content.type === 'image') {
            const img = document.createElement('img');
            img.src = inscription.content.data;
            img.alt = `Inscription ${inscription.id}`;
            preview.appendChild(img);
        } else {
            preview.textContent = inscription.content.type.toUpperCase();
        }

        const info = document.createElement('div');
        info.className = 'doginal-info';
        info.innerHTML = `
            <div>ID: ${inscription.id.substring(0, 8)}...</div>
            <div>Number: ${inscription.metadata.number || 'Unknown'}</div>
        `;

        item.appendChild(preview);
        item.appendChild(info);

        return item;
    }

    /**
     * Update send tab
     */
    async updateSendTab() {
        const availableElement = document.getElementById('available_balance');
        if (availableElement) {
            const available = await wallet.getAvailableBalance();
            availableElement.textContent = `${available.toFixed(8)} DOGE`;
        }
    }

    /**
     * Update history tab
     */
    async updateHistoryTab() {
        const container = document.getElementById('history_container');
        if (!container) return;

        const transactions = wallet.transactions;
        
        if (transactions.length === 0) {
            container.innerHTML = '<div class="loading-message">No transactions found</div>';
            return;
        }

        container.innerHTML = '';
        
        transactions.forEach(tx => {
            const item = this.createHistoryItem(tx);
            container.appendChild(item);
        });
    }

    /**
     * Create history item element
     */
    createHistoryItem(tx) {
        const item = document.createElement('div');
        item.className = 'history-item';

        const walletAddress = wallet.getAddress();
        const isReceived = tx.outputs.some(out => out.addresses && out.addresses.includes(walletAddress));
        const isSent = tx.inputs.some(inp => inp.addresses && inp.addresses.includes(walletAddress));

        if (isReceived && !isSent) {
            item.classList.add('received');
        } else {
            item.classList.add('sent');
        }

        const main = document.createElement('div');
        main.className = 'history-main';

        const type = document.createElement('div');
        type.className = 'history-type';
        type.textContent = isReceived && !isSent ? 'Received' : 'Sent';

        const address = document.createElement('div');
        address.className = 'history-address';
        address.textContent = tx.txid.substring(0, 16) + '...';

        const date = document.createElement('div');
        date.className = 'history-date';
        date.textContent = tx.time ? new Date(tx.time * 1000).toLocaleDateString() : 'Pending';

        main.appendChild(type);
        main.appendChild(address);
        main.appendChild(date);

        const amount = document.createElement('div');
        amount.className = 'history-amount';
        amount.textContent = `${(tx.value / 100000000).toFixed(8)} DOGE`;

        item.appendChild(main);
        item.appendChild(amount);

        return item;
    }

    /**
     * Show doginal modal
     */
    showDoginalModal(inscription) {
        this.selectedInscription = inscription;
        
        const modal = document.getElementById('doginal_modal');
        const contentDisplay = document.getElementById('doginal_content_display');
        const inscriptionId = document.getElementById('doginal_inscription_id');
        const number = document.getElementById('doginal_number');
        const sendAddress = document.getElementById('doginal_send_address');

        if (contentDisplay && inscription.content.type === 'image') {
            contentDisplay.innerHTML = `<img src="${inscription.content.data}" alt="Inscription ${inscription.id}" />`;
        } else if (contentDisplay) {
            contentDisplay.innerHTML = `<div class="text-content">${inscription.content.data}</div>`;
        }

        if (inscriptionId) {
            inscriptionId.textContent = inscription.id;
        }

        if (number) {
            number.textContent = inscription.metadata.number || 'Unknown';
        }

        if (sendAddress) {
            sendAddress.value = '';
        }

        this.showModal('doginal_modal');
    }

    /**
     * Show success modal
     */
    showSuccessModal(txid) {
        const txidElement = document.getElementById('success_txid');
        const explorerBtn = document.getElementById('view_explorer_button');

        if (txidElement) {
            txidElement.textContent = txid;
        }

        if (explorerBtn) {
            explorerBtn.onclick = () => {
                window.open(`https://dogechain.info/tx/${txid}`, '_blank');
            };
        }

        this.showModal('success_modal');
    }

    /**
     * Show error modal
     */
    showError(message) {
        const errorMessage = document.getElementById('error_message');
        if (errorMessage) {
            errorMessage.textContent = message;
        }
        this.showModal('error_modal');
    }

    /**
     * Show modal
     */
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    }

    /**
     * Hide modal
     */
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    }

    /**
     * Set button loading state
     */
    setButtonLoading(buttonId, loading) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.disabled = loading;
            if (loading) {
                button.dataset.originalText = button.textContent;
                button.textContent = 'Loading...';
            } else {
                button.textContent = button.dataset.originalText || button.textContent;
            }
        }
    }

    /**
     * Set global loading state
     */
    setLoading(loading) {
        this.isLoading = loading;
        // You could add a global loading indicator here
    }

    /**
     * Copy text to clipboard
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            // Show brief feedback
            console.log('Copied to clipboard:', text);
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
        }
    }

    /**
     * Show receive modal with enhanced functionality
     */
    showReceiveModal() {
        if (!wallet.credentials) {
            this.showErrorModal('Wallet not loaded. Please wait for the wallet to initialize.');
            return;
        }

        const address = wallet.getAddress();
        
        // Update address display
        const addressElement = document.getElementById('modal_wallet_address');
        if (addressElement) {
            addressElement.textContent = address;
        }

        // Generate and display QR code
        this.generateReceiveQRCode(address);

        // Set up copy functionality
        this.setupReceiveModalCopy(address);

        // Set up keyboard navigation
        this.setupReceiveModalKeyboard(address);

        // Show the modal
        this.showModal('receive_modal');
    }

    /**
     * Generate QR code for receive modal
     */
    generateReceiveQRCode(address) {
        const qrContainer = document.getElementById('modal_qr_code');
        const qrFallback = document.getElementById('modal_qr_fallback');
        
        if (!qrContainer) return;

        try {
            const qrCode = createQRCode(address);
            const canvas = document.createElement('canvas');
            renderQRToCanvas(qrCode, canvas, 200);
            
            qrContainer.innerHTML = '';
            qrContainer.appendChild(canvas);
            qrContainer.setAttribute('aria-label', `QR code containing wallet address: ${address}`);
            
            if (qrFallback) {
                qrFallback.style.display = 'none';
            }
        } catch (error) {
            console.error('Error generating QR code:', error);
            
            qrContainer.innerHTML = '';
            qrContainer.setAttribute('aria-label', 'QR code generation failed. Use the address above instead.');
            
            if (qrFallback) {
                qrFallback.style.display = 'block';
            }
        }
    }

    /**
     * Set up copy functionality for receive modal
     */
    setupReceiveModalCopy(address) {
        const copyButton = document.getElementById('copy_modal_address_button');
        if (!copyButton) return;

        // Remove existing event listeners
        const newCopyButton = copyButton.cloneNode(true);
        copyButton.parentNode.replaceChild(newCopyButton, copyButton);

        newCopyButton.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(address);
                
                // Visual feedback
                const originalHTML = newCopyButton.innerHTML;
                newCopyButton.innerHTML = '<span class="button-icon" aria-hidden="true">✓</span>Copied!';
                newCopyButton.setAttribute('aria-label', 'Address copied to clipboard');
                
                // Announce to screen readers
                this.announceToScreenReader('Address copied to clipboard');
                
                setTimeout(() => {
                    newCopyButton.innerHTML = originalHTML;
                    newCopyButton.setAttribute('aria-label', 'Copy wallet address to clipboard');
                }, 2000);
            } catch (error) {
                console.error('Failed to copy address:', error);
                
                // Fallback: create temporary text area for copying
                const textArea = document.createElement('textarea');
                textArea.value = address;
                document.body.appendChild(textArea);
                textArea.select();
                
                try {
                    document.execCommand('copy');
                    this.announceToScreenReader('Address copied to clipboard using fallback method');
                } catch (fallbackError) {
                    this.announceToScreenReader('Failed to copy address. Please select and copy manually.');
                    console.error('Fallback copy also failed:', fallbackError);
                }
                
                document.body.removeChild(textArea);
            }
        });
    }

    /**
     * Set up keyboard navigation for receive modal
     */
    setupReceiveModalKeyboard(address) {
        const addressDisplay = document.getElementById('modal_wallet_address');
        const qrContainer = document.getElementById('modal_qr_code');

        if (addressDisplay) {
            addressDisplay.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    document.getElementById('copy_modal_address_button')?.click();
                }
            });
        }

        if (qrContainer) {
            qrContainer.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.announceToScreenReader(`QR code displayed for wallet address: ${address}`);
                }
            });
        }
    }

    /**
     * Helper function to announce messages to screen readers
     */
    announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            if (document.body.contains(announcement)) {
                document.body.removeChild(announcement);
            }
        }, 1000);
    }

    /**
     * Set up settings functionality
     */
    setupSettings() {
        // Settings button
        const settingsBtn = document.getElementById('main_settings_button');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.showSettingsModal());
        }

        // Settings modal close buttons
        const closeSettingsBtn = document.getElementById('close_settings_modal');
        if (closeSettingsBtn) {
            closeSettingsBtn.addEventListener('click', () => this.hideModal('settings_modal'));
        }

        // Settings options
        const showSeedBtn = document.getElementById('main_show_seed_button');
        const showPrivateKeyBtn = document.getElementById('main_show_private_key_button');
        const logoutBtn = document.getElementById('main_logout_button');

        if (showSeedBtn) {
            showSeedBtn.addEventListener('click', () => this.requestSeedPhrase());
        }

        if (showPrivateKeyBtn) {
            showPrivateKeyBtn.addEventListener('click', () => this.requestPrivateKey());
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Authentication modal
        this.setupAuthModal();
        this.setupSensitiveDataModal();
    }

    /**
     * Set up authentication modal
     */
    setupAuthModal() {
        const closeAuthBtn = document.getElementById('close_auth_modal');
        const confirmAuthBtn = document.getElementById('confirm_auth_button');
        const cancelAuthBtn = document.getElementById('cancel_auth_button');
        const passwordInput = document.getElementById('main_password_input');

        if (closeAuthBtn) {
            closeAuthBtn.addEventListener('click', () => this.hideModal('auth_modal'));
        }

        if (cancelAuthBtn) {
            cancelAuthBtn.addEventListener('click', () => this.hideModal('auth_modal'));
        }

        if (passwordInput) {
            passwordInput.addEventListener('input', () => {
                const password = passwordInput.value;
                if (confirmAuthBtn) {
                    confirmAuthBtn.disabled = password.length < 4;
                }
            });

            passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && confirmAuthBtn && !confirmAuthBtn.disabled) {
                    confirmAuthBtn.click();
                }
            });
        }

        if (confirmAuthBtn) {
            confirmAuthBtn.addEventListener('click', () => this.handleAuthentication());
        }
    }

    /**
     * Set up sensitive data display modal
     */
    setupSensitiveDataModal() {
        const closeBtn = document.getElementById('close_sensitive_modal');
        const closeDataBtn = document.getElementById('close_sensitive_data_button');
        const copyBtn = document.getElementById('copy_sensitive_data_button');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideModal('sensitive_data_modal'));
        }

        if (closeDataBtn) {
            closeDataBtn.addEventListener('click', () => this.hideModal('sensitive_data_modal'));
        }

        if (copyBtn) {
            copyBtn.addEventListener('click', () => this.copySensitiveData());
        }
    }

    /**
     * Show settings modal
     */
    showSettingsModal() {
        if (!wallet.credentials) {
            this.showErrorModal('Wallet not loaded. Please wait for the wallet to initialize.');
            return;
        }

        this.showModal('settings_modal');
    }



    /**
     * Show authentication modal
     */
    showAuthModal(title, message) {
        const titleElement = document.getElementById('auth_modal_title');
        const messageElement = document.getElementById('auth_modal_message');
        const passwordInput = document.getElementById('main_password_input');
        const confirmBtn = document.getElementById('confirm_auth_button');

        if (titleElement) titleElement.textContent = title;
        if (messageElement) messageElement.textContent = message;
        if (passwordInput) {
            passwordInput.value = '';
            passwordInput.focus();
        }
        if (confirmBtn) confirmBtn.disabled = true;

        this.hideModal('settings_modal');
        this.showModal('auth_modal');
    }



    /**
     * Show sensitive data
     */
    showSensitiveData() {
        const titleElement = document.getElementById('sensitive_data_title');
        const warningElement = document.getElementById('sensitive_warning_text');
        const dataElement = document.getElementById('sensitive_data_display');

        let title, warning, data;

        try {
            if (this.currentSensitiveAction === 'seed_phrase') {
                title = 'Seed Phrase';
                warning = 'Never share your seed phrase with anyone! This is the master key to your wallet.';
                data = wallet.getSeedPhrase();
                
                if (!data) {
                    data = 'No seed phrase available (wallet created from private key)';
                }
            } else if (this.currentSensitiveAction === 'private_key') {
                title = 'Private Key';
                warning = 'Never share your private key with anyone! Anyone with this key has full control of your wallet.';
                data = wallet.getPrivateKey();
            }

            if (titleElement) titleElement.textContent = title;
            if (warningElement) warningElement.textContent = warning;
            if (dataElement) {
                dataElement.textContent = data;
                dataElement.setAttribute('data-sensitive', data);
            }

            this.showModal('sensitive_data_modal');
        } catch (error) {
            console.error('Error displaying sensitive data:', error);
            this.showErrorModal('Failed to retrieve sensitive data. Please try again.');
        }
    }

    /**
     * Copy sensitive data to clipboard
     */
    async copySensitiveData() {
        const dataElement = document.getElementById('sensitive_data_display');
        const copyBtn = document.getElementById('copy_sensitive_data_button');
        
        if (!dataElement || !copyBtn) return;

        const data = dataElement.getAttribute('data-sensitive');
        if (!data || data === 'No seed phrase available (wallet created from private key)') {
            this.showErrorModal('No data available to copy.');
            return;
        }

        try {
            await navigator.clipboard.writeText(data);
            
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '<span class="button-icon">✓</span>Copied!';
            copyBtn.disabled = true;

            setTimeout(() => {
                copyBtn.innerHTML = originalText;
                copyBtn.disabled = false;
            }, 2000);

            this.announceToScreenReader('Sensitive data copied to clipboard');
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            this.showErrorModal('Failed to copy to clipboard. Please select and copy manually.');
        }
    }

    /**
     * Handle logout
     */
    async handleLogout() {
        const confirmLogout = confirm(
            'Are you sure you want to logout?\n\n' +
            '⚠️ WARNING: Make sure you have your seed phrase or private key saved securely. ' +
            'Without it, you will lose access to your wallet permanently!\n\n' +
            'This action cannot be undone.'
        );

        if (!confirmLogout) return;

        try {
            await wallet.logout();
            this.hideModal('settings_modal');
            // Reload the page to return to setup screen
            window.location.reload();
        } catch (error) {
            console.error('Logout error:', error);
            this.showErrorModal('Failed to logout. Please try again.');
        }
    }

    /**
     * Set up password setup functionality
     */
    setupPasswordSetup() {
        // Password input validation
        const passwordInput = document.getElementById('wallet_password_input');
        const confirmInput = document.getElementById('wallet_password_confirm');
        const setupButton = document.getElementById('setup_password_button');
        const backButton = document.getElementById('back_to_create_button');

        // Password visibility toggles
        const togglePassword = document.getElementById('toggle_password_visibility');
        const toggleConfirm = document.getElementById('toggle_confirm_visibility');

        if (passwordInput) {
            passwordInput.addEventListener('input', () => this.validatePasswordInput());
        }

        if (confirmInput) {
            confirmInput.addEventListener('input', () => this.validatePasswordMatch());
        }

        if (setupButton) {
            setupButton.addEventListener('click', () => this.handlePasswordSetup());
        }

        if (backButton) {
            backButton.addEventListener('click', () => this.showCreateScreen());
        }

        if (togglePassword) {
            togglePassword.addEventListener('click', () => this.togglePasswordVisibility('wallet_password_input', 'toggle_password_visibility'));
        }

        if (toggleConfirm) {
            toggleConfirm.addEventListener('click', () => this.togglePasswordVisibility('wallet_password_confirm', 'toggle_confirm_visibility'));
        }

        // Biometric setup
        const biometricButton = document.getElementById('enable_biometric_button');
        if (biometricButton) {
            biometricButton.addEventListener('click', () => this.handleBiometricSetup());
        }
    }

    /**
     * Show password setup screen
     */
    showPasswordSetup() {
        this.currentScreen = 'password_setup_screen';
        this.hideAllScreens();
        document.getElementById('password_setup_screen').classList.add('active');
        
        // Reset password inputs
        const passwordInput = document.getElementById('wallet_password_input');
        const confirmInput = document.getElementById('wallet_password_confirm');
        
        if (passwordInput) passwordInput.value = '';
        if (confirmInput) confirmInput.value = '';
        
        this.validatePasswordInput();
        this.validatePasswordMatch();
        
        // Focus on password input
        if (passwordInput) {
            setTimeout(() => passwordInput.focus(), 100);
        }

        // Check and setup biometric option
        this.setupBiometricOption();
    }

    /**
     * Validate password input and update UI
     */
    validatePasswordInput() {
        const passwordInput = document.getElementById('wallet_password_input');
        const password = passwordInput ? passwordInput.value : '';
        
        const validation = wallet.validatePasswordStrength(password);
        
        // Update requirement indicators
        this.updateRequirement('req_length', validation.requirements.length);
        this.updateRequirement('req_uppercase', validation.requirements.uppercase);
        this.updateRequirement('req_lowercase', validation.requirements.lowercase);
        this.updateRequirement('req_number', validation.requirements.number);
        this.updateRequirement('req_special', validation.requirements.special);
        
        // Update strength meter
        this.updateStrengthMeter(validation.strength);
        
        // Update form validity
        this.updatePasswordFormValidity();
        
        return validation;
    }

    /**
     * Validate password match
     */
    validatePasswordMatch() {
        const passwordInput = document.getElementById('wallet_password_input');
        const confirmInput = document.getElementById('wallet_password_confirm');
        const feedback = document.getElementById('password_match_feedback');
        
        const password = passwordInput ? passwordInput.value : '';
        const confirm = confirmInput ? confirmInput.value : '';
        
        if (!feedback) return;
        
        if (confirm === '') {
            feedback.textContent = '';
            feedback.className = 'password-feedback';
        } else if (password === confirm) {
            feedback.textContent = '✓ Passwords match';
            feedback.className = 'password-feedback match';
        } else {
            feedback.textContent = '✗ Passwords do not match';
            feedback.className = 'password-feedback mismatch';
        }
        
        this.updatePasswordFormValidity();
    }

    /**
     * Update requirement indicator
     */
    updateRequirement(reqId, satisfied) {
        const element = document.getElementById(reqId);
        if (!element) return;
        
        const icon = element.querySelector('.req-icon');
        if (icon) {
            icon.textContent = satisfied ? '✓' : '❌';
        }
        
        if (satisfied) {
            element.classList.add('satisfied');
        } else {
            element.classList.remove('satisfied');
        }
    }

    /**
     * Update strength meter
     */
    updateStrengthMeter(strength) {
        const strengthBar = document.getElementById('strength_bar');
        const strengthText = document.getElementById('strength_text');
        
        if (strengthBar) {
            strengthBar.className = `strength-bar ${strength}`;
        }
        
        if (strengthText) {
            strengthText.textContent = `Password strength: ${strength.charAt(0).toUpperCase() + strength.slice(1)}`;
            strengthText.className = `strength-text ${strength}`;
        }
    }

    /**
     * Update password form validity
     */
    updatePasswordFormValidity() {
        const passwordInput = document.getElementById('wallet_password_input');
        const confirmInput = document.getElementById('wallet_password_confirm');
        const setupButton = document.getElementById('setup_password_button');
        
        const password = passwordInput ? passwordInput.value : '';
        const confirm = confirmInput ? confirmInput.value : '';
        
        const validation = wallet.validatePasswordStrength(password);
        const passwordsMatch = password === confirm && confirm !== '';
        const isValid = validation.isValid && passwordsMatch;
        
        if (setupButton) {
            setupButton.disabled = !isValid;
        }
    }

    /**
     * Toggle password visibility
     */
    togglePasswordVisibility(inputId, buttonId) {
        const input = document.getElementById(inputId);
        const button = document.getElementById(buttonId);
        
        if (!input || !button) return;
        
        if (input.type === 'password') {
            input.type = 'text';
            button.textContent = '🙈';
            button.setAttribute('aria-label', 'Hide password');
        } else {
            input.type = 'password';
            button.textContent = '👁️';
            button.setAttribute('aria-label', 'Show password');
        }
    }

    /**
     * Handle password setup completion
     */
    async handlePasswordSetup() {
        try {
            this.setButtonLoading('setup_password_button', true);
            
            const passwordInput = document.getElementById('wallet_password_input');
            const password = passwordInput ? passwordInput.value : '';
            
            // Validate password one more time
            const validation = wallet.validatePasswordStrength(password);
            if (!validation.isValid) {
                throw new Error('Password does not meet security requirements');
            }
            
            // Store the password
            await wallet.storePassword(password);
            
            // Complete wallet creation
            await this.completeWalletCreation();
            
        } catch (error) {
            console.error('Failed to setup password:', error);
            this.showError('Failed to setup password: ' + error.message);
        } finally {
            this.setButtonLoading('setup_password_button', false);
        }
    }

    /**
     * Complete wallet creation after password setup
     */
    async completeWalletCreation() {
        try {
            if (!this.pendingCredentials) {
                throw new Error('No credentials available for wallet creation');
            }

            await wallet.storeCredentials(this.pendingCredentials);
            this.pendingCredentials = null;
            
            this.showWalletScreen();
            await this.handleRefresh();
        } catch (error) {
            console.error('Failed to complete wallet creation:', error);
            this.showError('Failed to create wallet');
            throw error;
        }
    }

    /**
     * Handle import seed validation before password setup
     */
    async handleImportSeedValidation() {
        try {
            this.setButtonLoading('import_seed_ok_button', true);
            
            const textarea = document.getElementById('seed_textarea');
            const seedText = textarea.value.trim();
            
            if (!seedText) {
                throw new Error('Please enter your seed phrase');
            }

            // Validate seed phrase
            const credentials = wallet.createCredentialsFromMnemonic(seedText);
            this.pendingCredentials = credentials;
            
            // Show password setup
            this.showPasswordSetup();
            
        } catch (error) {
            console.error('Failed to validate seed:', error);
            this.showError('Failed to validate seed phrase: ' + error.message);
        } finally {
            this.setButtonLoading('import_seed_ok_button', false);
        }
    }

    /**
     * Handle import private key validation before password setup
     */
    async handleImportKeyValidation() {
        try {
            this.setButtonLoading('import_key_ok_button', true);
            
            const textarea = document.getElementById('private_key_textarea');
            const keyText = textarea.value.trim();
            
            if (!keyText) {
                throw new Error('Please enter your private key');
            }

            // Validate private key
            const credentials = wallet.createCredentialsFromPrivateKey(keyText);
            this.pendingCredentials = credentials;
            
            // Show password setup
            this.showPasswordSetup();
            
        } catch (error) {
            console.error('Failed to validate private key:', error);
            this.showError('Failed to validate private key: ' + error.message);
        } finally {
            this.setButtonLoading('import_key_ok_button', false);
        }
    }

    /**
     * Enhanced authentication with better error handling
     */
    async handleAuthentication() {
        const passwordInput = document.getElementById('main_password_input');
        const password = passwordInput ? passwordInput.value : '';

        if (password.length < 4) {
            this.showErrorModal('Password must be at least 4 characters long.');
            return;
        }

        try {
            this.setButtonLoading('confirm_auth_button', true);
            
            const isValid = await wallet.verifyPassword(password);
            
            if (isValid) {
                this.hideModal('auth_modal');
                this.showSensitiveData();
            } else {
                this.showErrorModal('Incorrect password. Please try again.');
                if (passwordInput) {
                    passwordInput.value = '';
                    passwordInput.focus();
                }
            }
        } catch (error) {
            console.error('Authentication error:', error);
            this.showErrorModal('Authentication failed. Please try again.');
        } finally {
            this.setButtonLoading('confirm_auth_button', false);
        }
    }

    /**
     * Setup biometric authentication option
     */
    async setupBiometricOption() {
        try {
            const biometricSection = document.getElementById('biometric_setup_section');
            const biometricButton = document.getElementById('enable_biometric_button');
            
            if (!biometricSection || !biometricButton) return;

            const isAvailable = await wallet.isBiometricAvailable();
            
            if (isAvailable) {
                biometricSection.style.display = 'block';
                biometricButton.disabled = false;
            } else {
                biometricSection.style.display = 'none';
            }
        } catch (error) {
            console.error('Failed to setup biometric option:', error);
        }
    }

    /**
     * Handle biometric authentication setup
     */
    async handleBiometricSetup() {
        try {
            const biometricButton = document.getElementById('enable_biometric_button');
            
            if (biometricButton) {
                biometricButton.disabled = true;
                biometricButton.textContent = 'Setting up...';
            }

            const success = await wallet.setupBiometric();
            
            if (success) {
                if (biometricButton) {
                    biometricButton.textContent = '✓ Biometric Enabled';
                    biometricButton.style.background = '#4caf50';
                }
                
                this.showErrorModal('Biometric authentication enabled successfully! You can now use biometrics to access sensitive information.', 'Success');
            } else {
                throw new Error('Failed to setup biometric authentication');
            }
        } catch (error) {
            console.error('Failed to setup biometric:', error);
            this.showErrorModal('Failed to setup biometric authentication: ' + error.message);
            
            const biometricButton = document.getElementById('enable_biometric_button');
            if (biometricButton) {
                biometricButton.disabled = false;
                biometricButton.textContent = 'Enable Biometric Authentication';
            }
        }
    }

    /**
     * Enhanced authentication with biometric support
     */
    async requestSeedPhrase() {
        this.currentSensitiveAction = 'seed_phrase';
        
        // Check if biometric is enabled
        const biometricEnabled = await wallet.isBiometricEnabled();
        
        if (biometricEnabled) {
            try {
                const biometricSuccess = await wallet.verifyBiometric();
                if (biometricSuccess) {
                    this.hideModal('settings_modal');
                    this.showSensitiveData();
                    return;
                }
            } catch (error) {
                console.log('Biometric authentication failed, falling back to password');
            }
        }
        
        this.showAuthModal('Seed Phrase Access', 'Enter your password to view the seed phrase');
    }

    /**
     * Enhanced private key access with biometric support
     */
    async requestPrivateKey() {
        this.currentSensitiveAction = 'private_key';
        
        // Check if biometric is enabled
        const biometricEnabled = await wallet.isBiometricEnabled();
        
        if (biometricEnabled) {
            try {
                const biometricSuccess = await wallet.verifyBiometric();
                if (biometricSuccess) {
                    this.hideModal('settings_modal');
                    this.showSensitiveData();
                    return;
                }
            } catch (error) {
                console.log('Biometric authentication failed, falling back to password');
            }
        }
        
        this.showAuthModal('Private Key Access', 'Enter your password to view the private key');
    }

    /**
     * Setup wallet unlock functionality
     */
    setupWalletUnlock() {
        const unlockInput = document.getElementById('unlock_password_input');
        const unlockButton = document.getElementById('unlock_wallet_button');
        const logoutButton = document.getElementById('logout_from_lock_button');
        const toggleUnlock = document.getElementById('toggle_unlock_visibility');

        if (unlockInput) {
            unlockInput.addEventListener('input', () => {
                const password = unlockInput.value;
                if (unlockButton) {
                    unlockButton.disabled = password.length < 4;
                }
            });

            unlockInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && unlockButton && !unlockButton.disabled) {
                    unlockButton.click();
                }
            });
        }

        if (unlockButton) {
            unlockButton.addEventListener('click', () => this.handleWalletUnlock());
        }

        if (logoutButton) {
            logoutButton.addEventListener('click', () => this.handleLogout());
        }

        if (toggleUnlock) {
            toggleUnlock.addEventListener('click', () => this.togglePasswordVisibility('unlock_password_input', 'toggle_unlock_visibility'));
        }
    }

    /**
     * Setup activity tracking for auto-lock
     */
    setupActivityTracking() {
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        
        events.forEach(event => {
            document.addEventListener(event, () => {
                if (wallet && wallet.credentials && !wallet.isWalletLocked()) {
                    wallet.updateActivity();
                }
            }, true);
        });
    }

    /**
     * Handle wallet lock
     */
    handleWalletLock() {
        this.currentScreen = 'wallet_lock_screen';
        this.hideAllScreens();
        document.getElementById('wallet_lock_screen').classList.add('active');
        
        // Clear and focus unlock input
        const unlockInput = document.getElementById('unlock_password_input');
        if (unlockInput) {
            unlockInput.value = '';
            setTimeout(() => unlockInput.focus(), 100);
        }
    }

    /**
     * Handle wallet unlock
     */
    async handleWalletUnlock() {
        try {
            this.setButtonLoading('unlock_wallet_button', true);
            
            const unlockInput = document.getElementById('unlock_password_input');
            const password = unlockInput ? unlockInput.value : '';
            
            if (password.length < 4) {
                throw new Error('Password must be at least 4 characters long');
            }

            const success = await wallet.unlockWallet(password);
            
            if (success) {
                // Return to wallet screen
                this.showWalletScreen();
                await this.handleRefresh();
            } else {
                throw new Error('Failed to unlock wallet');
            }
            
        } catch (error) {
            console.error('Failed to unlock wallet:', error);
            this.showError('Failed to unlock wallet: ' + error.message);
            
            // Clear password input
            const unlockInput = document.getElementById('unlock_password_input');
            if (unlockInput) {
                unlockInput.value = '';
                unlockInput.focus();
            }
        } finally {
            this.setButtonLoading('unlock_wallet_button', false);
        }
    }
}

// Create global UI instance
window.ui = new WalletUI();