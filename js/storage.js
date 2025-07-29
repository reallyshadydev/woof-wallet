/**
 * Storage Layer for Woof Wallet
 * Replaces browser.storage with localStorage for web compatibility
 */

class WalletStorage {
    constructor() {
        this.prefix = 'woof_wallet_';
    }

    /**
     * Get a prefixed key
     */
    getKey(key) {
        return `${this.prefix}${key}`;
    }

    /**
     * Set a single item
     */
    async set(key, value) {
        try {
            const prefixedKey = this.getKey(key);
            const serializedValue = JSON.stringify(value);
            localStorage.setItem(prefixedKey, serializedValue);
            return true;
        } catch (error) {
            console.error('Storage set error:', error);
            throw new Error(`Failed to store ${key}: ${error.message}`);
        }
    }

    /**
     * Set multiple items at once
     */
    async setMultiple(items) {
        try {
            for (const [key, value] of Object.entries(items)) {
                await this.set(key, value);
            }
            return true;
        } catch (error) {
            console.error('Storage setMultiple error:', error);
            throw error;
        }
    }

    /**
     * Get a single item
     */
    async get(key) {
        try {
            const prefixedKey = this.getKey(key);
            const serializedValue = localStorage.getItem(prefixedKey);
            
            if (serializedValue === null) {
                return undefined;
            }
            
            return JSON.parse(serializedValue);
        } catch (error) {
            console.error('Storage get error:', error);
            return undefined;
        }
    }

    /**
     * Get multiple items at once
     */
    async getMultiple(keys) {
        try {
            const result = {};
            
            for (const key of keys) {
                const value = await this.get(key);
                if (value !== undefined) {
                    result[key] = value;
                }
            }
            
            return result;
        } catch (error) {
            console.error('Storage getMultiple error:', error);
            return {};
        }
    }

    /**
     * Remove a single item
     */
    async remove(key) {
        try {
            const prefixedKey = this.getKey(key);
            localStorage.removeItem(prefixedKey);
            return true;
        } catch (error) {
            console.error('Storage remove error:', error);
            throw new Error(`Failed to remove ${key}: ${error.message}`);
        }
    }

    /**
     * Remove multiple items
     */
    async removeMultiple(keys) {
        try {
            for (const key of keys) {
                await this.remove(key);
            }
            return true;
        } catch (error) {
            console.error('Storage removeMultiple error:', error);
            throw error;
        }
    }

    /**
     * Clear all wallet data
     */
    async clear() {
        try {
            const keys = Object.keys(localStorage);
            const walletKeys = keys.filter(key => key.startsWith(this.prefix));
            
            for (const key of walletKeys) {
                localStorage.removeItem(key);
            }
            
            return true;
        } catch (error) {
            console.error('Storage clear error:', error);
            throw new Error(`Failed to clear storage: ${error.message}`);
        }
    }

    /**
     * Get all keys with the wallet prefix
     */
    async getAllKeys() {
        try {
            const keys = Object.keys(localStorage);
            return keys
                .filter(key => key.startsWith(this.prefix))
                .map(key => key.replace(this.prefix, ''));
        } catch (error) {
            console.error('Storage getAllKeys error:', error);
            return [];
        }
    }

    /**
     * Get storage usage information
     */
    getStorageInfo() {
        try {
            let totalSize = 0;
            let itemCount = 0;
            
            const keys = Object.keys(localStorage);
            const walletKeys = keys.filter(key => key.startsWith(this.prefix));
            
            for (const key of walletKeys) {
                const value = localStorage.getItem(key);
                totalSize += key.length + (value ? value.length : 0);
                itemCount++;
            }
            
            return {
                itemCount,
                totalSize,
                totalSizeKB: Math.round(totalSize / 1024 * 100) / 100
            };
        } catch (error) {
            console.error('Storage getStorageInfo error:', error);
            return {
                itemCount: 0,
                totalSize: 0,
                totalSizeKB: 0
            };
        }
    }

    /**
     * Check if storage is available
     */
    isAvailable() {
        try {
            const testKey = `${this.prefix}test`;
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch (error) {
            console.error('Storage not available:', error);
            return false;
        }
    }

    /**
     * Backup wallet data to JSON
     */
    async exportData() {
        try {
            const keys = await this.getAllKeys();
            const data = {};
            
            for (const key of keys) {
                const value = await this.get(key);
                if (value !== undefined) {
                    data[key] = value;
                }
            }
            
            return {
                version: '1.0',
                timestamp: new Date().toISOString(),
                data
            };
        } catch (error) {
            console.error('Storage export error:', error);
            throw new Error(`Failed to export data: ${error.message}`);
        }
    }

    /**
     * Restore wallet data from JSON
     */
    async importData(backupData) {
        try {
            if (!backupData.data || typeof backupData.data !== 'object') {
                throw new Error('Invalid backup data format');
            }
            
            // Clear existing data first
            await this.clear();
            
            // Import new data
            for (const [key, value] of Object.entries(backupData.data)) {
                await this.set(key, value);
            }
            
            return true;
        } catch (error) {
            console.error('Storage import error:', error);
            throw new Error(`Failed to import data: ${error.message}`);
        }
    }

    /**
     * Migrate data from old storage format if needed
     */
    async migrate() {
        try {
            // Check if we need to migrate from any old format
            // This could be expanded later if needed
            
            const hasLegacyData = localStorage.getItem('wallet_privkey') || 
                                localStorage.getItem('wallet_mnemonic');
            
            if (hasLegacyData) {
                console.log('Migrating legacy wallet data...');
                
                // Migrate private key
                const privkey = localStorage.getItem('wallet_privkey');
                if (privkey) {
                    await this.set('privkey', privkey);
                    localStorage.removeItem('wallet_privkey');
                }
                
                // Migrate mnemonic
                const mnemonic = localStorage.getItem('wallet_mnemonic');
                if (mnemonic) {
                    await this.set('mnemonic', mnemonic);
                    localStorage.removeItem('wallet_mnemonic');
                }
                
                // Migrate other common keys
                const commonKeys = ['accepted_terms', 'derivation', 'utxos'];
                for (const key of commonKeys) {
                    const value = localStorage.getItem(`wallet_${key}`);
                    if (value) {
                        await this.set(key, JSON.parse(value));
                        localStorage.removeItem(`wallet_${key}`);
                    }
                }
                
                console.log('Legacy data migration completed');
            }
            
            return true;
        } catch (error) {
            console.error('Storage migration error:', error);
            // Don't throw error for migration issues
            return false;
        }
    }
}

// Create global storage instance
window.walletStorage = new WalletStorage();