/**
 * Main Application Controller for Woof Wallet
 * Initializes and coordinates all wallet components
 */

class WoofWalletApp {
    constructor() {
        this.initialized = false;
        this.initializationError = null;
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log('🐕 Initializing Woof Wallet...');
            
            // Set up fail-safe to hide loading screen after maximum 10 seconds
            const loadingFailSafe = setTimeout(() => {
                console.warn('⚠️ Loading screen fail-safe triggered - hiding loading screen');
                const loadingScreen = document.getElementById('loading_screen');
                if (loadingScreen && loadingScreen.classList.contains('active')) {
                    loadingScreen.classList.remove('active');
                    // Show error or try to determine initial screen again
                    if (!this.initialized) {
                        this.handleInitializationError(new Error('Initialization timed out'));
                    }
                }
            }, 10000);
            
            // Initialize UI first
            ui.init();
            
            // Initialize wallet
            await wallet.init();
            
            // Determine initial screen based on wallet state
            await this.determineInitialScreen();
            
            // Clear the fail-safe timer since initialization completed
            clearTimeout(loadingFailSafe);
            
            this.initialized = true;
            console.log('🐕 Woof Wallet initialized successfully!');
            
        } catch (error) {
            console.error('Failed to initialize Woof Wallet:', error);
            this.initializationError = error;
            this.handleInitializationError(error);
        }
    }

    /**
     * Determine which screen to show initially
     */
    async determineInitialScreen() {
        try {
            console.log('🔍 Determining initial screen...');
            console.log('Terms accepted:', wallet.acceptedTerms);
            console.log('Wallet credentials exist:', !!wallet.credentials);
            
            // Check if terms are accepted
            if (!wallet.acceptedTerms) {
                console.log('➡️ Showing terms screen');
                ui.showTermsScreen();
                return;
            }

            // Check if wallet exists
            if (!wallet.credentials) {
                console.log('➡️ Showing setup screen');
                ui.showSetupScreen();
                return;
            }

            // Check if wallet is locked
            if (wallet.isWalletLocked()) {
                console.log('➡️ Showing lock screen');
                ui.handleWalletLock();
                return;
            }

            // Wallet exists and is unlocked, show main wallet screen
            console.log('➡️ Showing wallet screen');
            ui.showWalletScreen();
            console.log('✅ Wallet screen should now be visible');
            
            // Refresh wallet data in background
            setTimeout(async () => {
                try {
                    console.log('🔄 Starting background wallet refresh...');
                    await ui.handleRefresh();
                    console.log('✅ Background wallet refresh completed');
                } catch (error) {
                    console.error('Failed to refresh wallet data on startup:', error);
                }
            }, 500);
            
        } catch (error) {
            console.error('Failed to determine initial screen:', error);
            ui.showError('Failed to load wallet state');
        }
    }

    /**
     * Handle initialization errors
     */
    handleInitializationError(error) {
        // Show a basic error screen
        document.body.innerHTML = `
            <div style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                padding: 2rem;
                text-align: center;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                font-family: 'Inter', sans-serif;
            ">
                <div style="
                    background: rgba(255, 255, 255, 0.1);
                    padding: 2rem;
                    border-radius: 16px;
                    max-width: 400px;
                ">
                    <h1 style="margin-bottom: 1rem;">🐕 Woof Wallet</h1>
                    <h2 style="color: #ff6b6b; margin-bottom: 1rem;">Initialization Failed</h2>
                    <p style="margin-bottom: 1.5rem;">
                        Failed to initialize the wallet. This might be due to:
                    </p>
                    <ul style="text-align: left; margin-bottom: 1.5rem;">
                        <li>Browser compatibility issues</li>
                        <li>Local storage not available</li>
                        <li>Network connectivity problems</li>
                        <li>JavaScript execution errors</li>
                    </ul>
                    <p style="font-size: 0.9rem; opacity: 0.8; margin-bottom: 1.5rem;">
                        Error: ${error.message}
                    </p>
                    <button onclick="location.reload()" style="
                        background: linear-gradient(135deg, #ff6b6b, #ee5a24);
                        color: white;
                        border: none;
                        padding: 1rem 2rem;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 1rem;
                        font-weight: 600;
                    ">
                        Reload Page
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Get application status
     */
    getStatus() {
        return {
            initialized: this.initialized,
            error: this.initializationError,
            walletLoaded: wallet.credentials !== null,
            termsAccepted: wallet.acceptedTerms,
            currentScreen: ui.currentScreen,
            currentTab: ui.currentTab
        };
    }

    /**
     * Reset the application (clear all data)
     */
    async reset() {
        try {
            console.log('Resetting Woof Wallet...');
            
            // Clear wallet data
            await wallet.clearWallet();
            
            // Reset UI
            ui.currentScreen = null;
            ui.currentTab = 'overview';
            ui.selectedInscription = null;
            
            // Show setup screen
            ui.showSetupScreen();
            
            console.log('Woof Wallet reset completed');
            return true;
        } catch (error) {
            console.error('Failed to reset wallet:', error);
            throw error;
        }
    }

    /**
     * Export wallet data for backup
     */
    async exportWallet() {
        try {
            if (!wallet.credentials) {
                throw new Error('No wallet loaded');
            }

            const backupData = await walletStorage.exportData();
            const dataStr = JSON.stringify(backupData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            // Create download link
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `woof-wallet-backup-${new Date().toISOString().split('T')[0]}.json`;
            
            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up
            URL.revokeObjectURL(url);
            
            return true;
        } catch (error) {
            console.error('Failed to export wallet:', error);
            throw error;
        }
    }

    /**
     * Import wallet data from backup
     */
    async importWallet(backupData) {
        try {
            // Validate backup data
            if (!backupData || !backupData.data) {
                throw new Error('Invalid backup data');
            }

            // Clear existing data
            await wallet.clearWallet();
            
            // Import data
            await walletStorage.importData(backupData);
            
            // Reload wallet
            await wallet.load();
            
            // Show wallet screen if credentials exist
            if (wallet.credentials) {
                ui.showWalletScreen();
                await ui.handleRefresh();
            } else {
                ui.showSetupScreen();
            }
            
            return true;
        } catch (error) {
            console.error('Failed to import wallet:', error);
            throw error;
        }
    }

    /**
     * Handle page visibility changes
     */
    handleVisibilityChange() {
        if (document.hidden) {
            console.log('Wallet hidden - pausing background tasks');
        } else {
            console.log('Wallet visible - resuming background tasks');
            
            // Refresh wallet data when page becomes visible again
            if (wallet.credentials && ui.currentScreen === 'wallet_screen') {
                setTimeout(() => {
                    ui.handleRefresh().catch(error => {
                        console.error('Failed to refresh on visibility change:', error);
                    });
                }, 1000);
            }
        }
    }

    /**
     * Handle window beforeunload (user leaving page)
     */
    handleBeforeUnload(event) {
        // Only show warning if wallet is loaded and has funds
        if (wallet.credentials && wallet.balance.total > 0) {
            const message = 'You have an active wallet loaded. Make sure you have backed up your recovery phrase before leaving.';
            event.returnValue = message;
            return message;
        }
    }

    /**
     * Set up global event listeners
     */
    setupGlobalEventListeners() {
        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });

        // Handle page unload
        window.addEventListener('beforeunload', (event) => {
            this.handleBeforeUnload(event);
        });

        // Handle uncaught errors
        window.addEventListener('error', (event) => {
            console.error('Uncaught error:', event.error);
            
            if (this.initialized) {
                ui.showError('An unexpected error occurred. Please refresh the page.');
            }
        });

        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            
            if (this.initialized) {
                ui.showError('An unexpected error occurred. Please try again.');
            }
        });

        // Handle online/offline status
        window.addEventListener('online', () => {
            console.log('Connection restored');
            if (wallet.credentials && ui.currentScreen === 'wallet_screen') {
                ui.handleRefresh().catch(error => {
                    console.error('Failed to refresh after coming online:', error);
                });
            }
        });

        window.addEventListener('offline', () => {
            console.log('Connection lost');
            ui.showError('Internet connection lost. Some features may not work until connection is restored.');
        });
    }
}

// Create global app instance
window.app = new WoofWalletApp();

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded, initializing Woof Wallet...');
    
    // Set up global event listeners
    app.setupGlobalEventListeners();
    
    // Initialize the app
    await app.init();
});

// Also initialize if DOM is already loaded
if (document.readyState === 'loading') {
    // DOM hasn't finished loading yet
    console.log('DOM still loading...');
} else {
    // DOM has already loaded
    console.log('DOM already loaded, initializing immediately...');
    
    // Small delay to ensure all scripts are loaded
    setTimeout(async () => {
        app.setupGlobalEventListeners();
        await app.init();
    }, 100);
}

// Expose useful functions to global scope for debugging
window.woofWallet = {
    app,
    wallet,
    ui,
    walletAPI,
    walletStorage,
    
    // Utility functions
    reset: () => app.reset(),
    export: () => app.exportWallet(),
    status: () => app.getStatus(),
    
    // Development helpers
    dev: {
        clearStorage: () => walletStorage.clear(),
        getStorageInfo: () => walletStorage.getStorageInfo(),
        testAPI: async (address) => {
            const testAddr = address || 'D7P2gNgUdyFGnRRRZFCEgZCyNLDJ8cFoKN';
            console.log('Testing API with address:', testAddr);
            
            try {
                const [balance, utxos, transactions] = await Promise.all([
                    walletAPI.getBalance(testAddr),
                    walletAPI.getUTXOs(testAddr),
                    walletAPI.getTransactions(testAddr, 10)
                ]);
                
                console.log('API Test Results:', {
                    balance,
                    utxoCount: utxos.length,
                    transactionCount: transactions.length
                });
                
                return { balance, utxos, transactions };
            } catch (error) {
                console.error('API test failed:', error);
                throw error;
            }
        }
    }
};

console.log('🐕 Woof Wallet scripts loaded successfully!');
console.log('💡 Use window.woofWallet for debugging and development');