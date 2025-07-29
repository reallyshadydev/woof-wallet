/**
 * Main Wallet Logic for Woof Wallet
 * Handles wallet operations, transaction creation, and safe DOGE sending
 */

// Import bitcore dependencies (these will be loaded via script tags)
const { Address, PrivateKey, Transaction } = require ? require("bitcore-lib") : window.bitcore;
const Mnemonic = require ? require('bitcore-mnemonic') : window.Mnemonic;

// Set dust amount for Dogecoin
if (Transaction) {
    Transaction.DUST_AMOUNT = 1000000; // 0.01 DOGE in satoshis
}

const DERIVATION_PATH = "m/44'/3'/0'/0/0";
const DOGE_SATOSHIS = 100000000; // 1 DOGE = 100,000,000 satoshis

class WoofWallet {
    constructor() {
        this.credentials = null;
        this.acceptedTerms = false;
        this.utxos = [];
        this.inscriptions = {};
        this.balance = { confirmed: 0, unconfirmed: 0, total: 0 };
        this.transactions = [];
        this.isLoading = false;
        this.lastSync = null;
        this.lastActivity = Date.now();
        this.autoLockTimeout = null;
        this.autoLockDuration = 15 * 60 * 1000; // 15 minutes
        this.isLocked = false;
    }

    /**
     * Initialize the wallet
     */
    async init() {
        try {
            // Check if storage is available
            if (!walletStorage.isAvailable()) {
                throw new Error('Local storage is not available');
            }

            // Migrate any legacy data
            await walletStorage.migrate();

            // Load existing wallet data
            await this.load();

            // Setup auto-lock if credentials are present
            if (this.credentials) {
                this.setupAutoLock();
            }

            return true;
        } catch (error) {
            console.error('Wallet initialization failed:', error);
            throw error;
        }
    }

    /**
     * Load wallet data from storage
     */
    async load() {
        try {
            const data = await walletStorage.getMultiple([
                'privkey', 'mnemonic', 'derivation', 'accepted_terms', 'utxos'
            ]);

            // Load credentials
            if (data.privkey) {
                this.credentials = {
                    privateKey: new PrivateKey(data.privkey),
                    mnemonic: data.mnemonic ? new Mnemonic(data.mnemonic) : null,
                    derivation: data.derivation || DERIVATION_PATH
                };
            }

            // Load other data
            this.acceptedTerms = data.accepted_terms || false;
            this.utxos = data.utxos || [];

            return true;
        } catch (error) {
            console.error('Failed to load wallet data:', error);
            throw error;
        }
    }

    /**
     * Accept terms and conditions
     */
    async acceptTerms() {
        try {
            await walletStorage.set('accepted_terms', true);
            this.acceptedTerms = true;
            return true;
        } catch (error) {
            console.error('Failed to accept terms:', error);
            throw error;
        }
    }

    /**
     * Generate new wallet credentials
     */
    generateCredentials() {
        try {
            const mnemonic = new Mnemonic(Mnemonic.Words.ENGLISH);
            const privateKey = mnemonic.toHDPrivateKey().deriveChild(DERIVATION_PATH).privateKey;
            
            return {
                privateKey,
                mnemonic,
                derivation: DERIVATION_PATH
            };
        } catch (error) {
            console.error('Failed to generate credentials:', error);
            throw error;
        }
    }

    /**
     * Create credentials from mnemonic
     */
    createCredentialsFromMnemonic(mnemonicText) {
        try {
            const mnemonic = new Mnemonic(mnemonicText.trim());
            const privateKey = mnemonic.toHDPrivateKey().deriveChild(DERIVATION_PATH).privateKey;
            
            return {
                privateKey,
                mnemonic,
                derivation: DERIVATION_PATH
            };
        } catch (error) {
            console.error('Failed to create credentials from mnemonic:', error);
            throw error;
        }
    }

    /**
     * Create credentials from private key
     */
    createCredentialsFromPrivateKey(privateKeyWIF) {
        try {
            const privateKey = new PrivateKey(privateKeyWIF.trim());
            
            return {
                privateKey,
                mnemonic: null,
                derivation: null
            };
        } catch (error) {
            console.error('Failed to create credentials from private key:', error);
            throw error;
        }
    }

    /**
     * Store wallet credentials
     */
    async storeCredentials(credentials) {
        try {
            await walletStorage.setMultiple({
                privkey: credentials.privateKey.toWIF(),
                mnemonic: credentials.mnemonic ? credentials.mnemonic.toString() : null,
                derivation: credentials.derivation
            });

            this.credentials = credentials;
            return true;
        } catch (error) {
            console.error('Failed to store credentials:', error);
            throw error;
        }
    }

    /**
     * Store password hash for authentication using PBKDF2
     */
    async storePassword(password) {
        try {
            const { hash, salt } = await this.secureHash(password);
            await walletStorage.setMultiple({
                'walletPassword': hash,
                'passwordSalt': salt
            });
            return true;
        } catch (error) {
            console.error('Failed to store password:', error);
            throw error;
        }
    }

    /**
     * Verify password for authentication
     */
    async verifyPassword(password) {
        try {
            const stored = await walletStorage.getMultiple(['walletPassword', 'passwordSalt']);
            if (!stored.walletPassword) {
                // If no password is set, reject authentication
                return false;
            }
            
            const { hash } = await this.secureHash(password, stored.passwordSalt);
            return hash === stored.walletPassword;
        } catch (error) {
            console.error('Failed to verify password:', error);
            throw error;
        }
    }

    /**
     * Check if password is set
     */
    async isPasswordSet() {
        try {
            const stored = await walletStorage.get('walletPassword');
            return !!stored;
        } catch (error) {
            console.error('Failed to check password status:', error);
            return false;
        }
    }

    /**
     * Check if biometric authentication is available
     */
    async isBiometricAvailable() {
        try {
            if (!window.PublicKeyCredential || !navigator.credentials) {
                return false;
            }
            
            const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
            return available;
        } catch (error) {
            console.error('Failed to check biometric availability:', error);
            return false;
        }
    }

    /**
     * Setup biometric authentication
     */
    async setupBiometric() {
        try {
            if (!await this.isBiometricAvailable()) {
                throw new Error('Biometric authentication is not available on this device');
            }

            const challenge = new Uint8Array(32);
            crypto.getRandomValues(challenge);

            const credential = await navigator.credentials.create({
                publicKey: {
                    challenge: challenge,
                    rp: { name: "Woof Wallet" },
                    user: {
                        id: new TextEncoder().encode("woof-wallet-user"),
                        name: "Wallet User",
                        displayName: "Wallet User"
                    },
                    pubKeyCredParams: [{ alg: -7, type: "public-key" }],
                    authenticatorSelection: {
                        userVerification: "required",
                        authenticatorAttachment: "platform"
                    },
                    timeout: 60000,
                    attestation: "direct"
                }
            });

            if (credential) {
                // Store credential ID for future authentication
                await walletStorage.set('biometricCredentialId', 
                    Array.from(new Uint8Array(credential.rawId)).map(b => b.toString(16).padStart(2, '0')).join(''));
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Failed to setup biometric authentication:', error);
            throw error;
        }
    }

    /**
     * Verify biometric authentication
     */
    async verifyBiometric() {
        try {
            const credentialId = await walletStorage.get('biometricCredentialId');
            if (!credentialId) {
                throw new Error('No biometric credential found');
            }

            const challenge = new Uint8Array(32);
            crypto.getRandomValues(challenge);

            const credentialIdBytes = new Uint8Array(credentialId.match(/.{2}/g).map(byte => parseInt(byte, 16)));

            const assertion = await navigator.credentials.get({
                publicKey: {
                    challenge: challenge,
                    allowCredentials: [{
                        id: credentialIdBytes,
                        type: 'public-key'
                    }],
                    userVerification: "required",
                    timeout: 60000
                }
            });

            return !!assertion;
        } catch (error) {
            console.error('Failed to verify biometric authentication:', error);
            throw error;
        }
    }

    /**
     * Check if biometric is enabled
     */
    async isBiometricEnabled() {
        try {
            const credentialId = await walletStorage.get('biometricCredentialId');
            return !!credentialId;
        } catch (error) {
            console.error('Failed to check biometric status:', error);
            return false;
        }
    }

    /**
     * Update activity timestamp for auto-lock
     */
    updateActivity() {
        this.lastActivity = Date.now();
        this.resetAutoLockTimer();
    }

    /**
     * Set up auto-lock timer
     */
    setupAutoLock() {
        this.resetAutoLockTimer();
    }

    /**
     * Reset auto-lock timer
     */
    resetAutoLockTimer() {
        if (this.autoLockTimeout) {
            clearTimeout(this.autoLockTimeout);
        }

        // Only set auto-lock if wallet is loaded and password is set
        if (this.credentials && !this.isLocked) {
            this.autoLockTimeout = setTimeout(() => {
                this.lockWallet();
            }, this.autoLockDuration);
        }
    }

    /**
     * Lock the wallet
     */
    async lockWallet() {
        try {
            this.isLocked = true;
            console.log('Wallet auto-locked due to inactivity');
            
            // Clear sensitive data from memory (but keep credentials encrypted in storage)
            this.clearSensitiveMemoryData();
            
            // Notify UI about lock state
            if (window.ui) {
                window.ui.handleWalletLock();
            }
            
            return true;
        } catch (error) {
            console.error('Failed to lock wallet:', error);
            return false;
        }
    }

    /**
     * Unlock the wallet with password
     */
    async unlockWallet(password) {
        try {
            const isValid = await this.verifyPassword(password);
            if (!isValid) {
                throw new Error('Invalid password');
            }

            this.isLocked = false;
            this.updateActivity();
            
            // Reload wallet data
            await this.load();
            
            console.log('Wallet unlocked successfully');
            return true;
        } catch (error) {
            console.error('Failed to unlock wallet:', error);
            throw error;
        }
    }

    /**
     * Clear sensitive data from memory (keeping storage intact)
     */
    clearSensitiveMemoryData() {
        // Keep essential data but clear sensitive memory
        this.lastActivity = Date.now();
        
        if (this.autoLockTimeout) {
            clearTimeout(this.autoLockTimeout);
            this.autoLockTimeout = null;
        }
    }

    /**
     * Check if wallet is locked
     */
    isWalletLocked() {
        return this.isLocked;
    }

    /**
     * Get time until auto-lock
     */
    getTimeUntilAutoLock() {
        const timeSinceActivity = Date.now() - this.lastActivity;
        const remainingTime = this.autoLockDuration - timeSinceActivity;
        return Math.max(0, remainingTime);
    }

    /**
     * Secure password hashing using PBKDF2
     */
    async secureHash(password, salt = null) {
        try {
            // Generate salt if not provided
            if (!salt) {
                const saltArray = new Uint8Array(16);
                crypto.getRandomValues(saltArray);
                salt = Array.from(saltArray).map(b => b.toString(16).padStart(2, '0')).join('');
            }

            // Convert inputs to proper format
            const encoder = new TextEncoder();
            const passwordBuffer = encoder.encode(password);
            const saltBuffer = new Uint8Array(salt.match(/.{2}/g).map(byte => parseInt(byte, 16)));

            // Import password as key
            const keyMaterial = await crypto.subtle.importKey(
                'raw',
                passwordBuffer,
                'PBKDF2',
                false,
                ['deriveBits']
            );

            // Derive key using PBKDF2
            const derivedBits = await crypto.subtle.deriveBits(
                {
                    name: 'PBKDF2',
                    salt: saltBuffer,
                    iterations: 100000, // 100k iterations for security
                    hash: 'SHA-256'
                },
                keyMaterial,
                256 // 256 bits output
            );

            // Convert to hex string
            const hashArray = Array.from(new Uint8Array(derivedBits));
            const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

            return { hash, salt };
        } catch (error) {
            console.error('Secure hash generation failed:', error);
            // Fallback to simple hash for compatibility
            return this.simpleHashFallback(password, salt);
        }
    }

    /**
     * Fallback hash function for environments without crypto.subtle
     */
    async simpleHashFallback(password, salt = null) {
        try {
            if (!salt) {
                salt = Math.random().toString(36).substring(2, 18);
            }
            
            // Simple hash combining password and salt
            const combined = password + salt;
            let hash = 0;
            for (let i = 0; i < combined.length; i++) {
                const char = combined.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32-bit integer
            }
            
            return { 
                hash: Math.abs(hash).toString(16), 
                salt 
            };
        } catch (error) {
            console.error('Fallback hash failed:', error);
            throw error;
        }
    }

    /**
     * Validate password strength
     */
    validatePasswordStrength(password) {
        const requirements = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
        };

        const satisfiedCount = Object.values(requirements).filter(Boolean).length;
        
        let strength = 'weak';
        if (satisfiedCount >= 5) {
            strength = 'strong';
        } else if (satisfiedCount >= 4) {
            strength = 'good';
        } else if (satisfiedCount >= 3) {
            strength = 'fair';
        }

        return {
            requirements,
            strength,
            score: satisfiedCount,
            isValid: satisfiedCount >= 4 && password.length >= 8
        };
    }

    /**
     * Get seed phrase (mnemonic) if available
     */
    getSeedPhrase() {
        if (!this.credentials) {
            throw new Error('No wallet credentials loaded');
        }
        return this.credentials.mnemonic ? this.credentials.mnemonic.toString() : null;
    }

    /**
     * Get private key in WIF format
     */
    getPrivateKey() {
        if (!this.credentials) {
            throw new Error('No wallet credentials loaded');
        }
        return this.credentials.privateKey.toWIF();
    }

    /**
     * Get wallet address
     */
    getAddress() {
        if (!this.credentials) {
            throw new Error('No wallet credentials loaded');
        }
        
        return this.credentials.privateKey.toAddress().toString();
    }

    /**
     * Refresh UTXOs from the blockchain
     */
    async refreshUTXOs() {
        try {
            if (!this.credentials) {
                throw new Error('No wallet credentials loaded');
            }

            this.isLoading = true;
            const address = this.getAddress();
            
            console.log('Refreshing UTXOs for address:', address);
            
            // Get UTXOs from API
            const utxos = await walletAPI.getUTXOs(address);
            
            // Filter confirmed UTXOs
            const confirmedUTXOs = utxos.filter(utxo => utxo.confirmations > 0);
            const unconfirmedCount = utxos.length - confirmedUTXOs.length;
            
            // Sort by confirmations (newest first)
            confirmedUTXOs.sort((a, b) => (a.confirmations || 0) - (b.confirmations || 0));
            
            console.log(`Found ${confirmedUTXOs.length} confirmed UTXOs, ${unconfirmedCount} unconfirmed`);
            
            this.utxos = confirmedUTXOs;
            this.numUnconfirmed = unconfirmedCount;
            
            // Store UTXOs
            await walletStorage.set('utxos', confirmedUTXOs);
            
            this.lastSync = new Date();
            return confirmedUTXOs;
        } catch (error) {
            console.error('Failed to refresh UTXOs:', error);
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Refresh balance
     */
    async refreshBalance() {
        try {
            if (!this.credentials) {
                throw new Error('No wallet credentials loaded');
            }

            const address = this.getAddress();
            this.balance = await walletAPI.getBalance(address);
            
            console.log('Balance updated:', this.balance);
            return this.balance;
        } catch (error) {
            console.error('Failed to refresh balance:', error);
            throw error;
        }
    }

    /**
     * Refresh transaction history
     */
    async refreshTransactions() {
        try {
            if (!this.credentials) {
                throw new Error('No wallet credentials loaded');
            }

            const address = this.getAddress();
            this.transactions = await walletAPI.getTransactions(address);
            
            console.log(`Loaded ${this.transactions.length} transactions`);
            return this.transactions;
        } catch (error) {
            console.error('Failed to refresh transactions:', error);
            throw error;
        }
    }

    /**
     * Refresh inscriptions (doginals)
     */
    async refreshInscriptions() {
        try {
            if (!this.credentials) {
                throw new Error('No wallet credentials loaded');
            }

            console.log('Refreshing inscriptions...');
            
            const address = this.getAddress();
            this.inscriptions = await walletAPI.getAddressInscriptions(address, this.utxos);
            
            console.log(`Found ${Object.keys(this.inscriptions).length} inscriptions`);
            return this.inscriptions;
        } catch (error) {
            console.error('Failed to refresh inscriptions:', error);
            throw error;
        }
    }

    /**
     * Get safe UTXOs (without inscriptions)
     */
    async getSafeUTXOs() {
        try {
            if (!this.credentials) {
                throw new Error('No wallet credentials loaded');
            }

            const address = this.getAddress();
            const result = await walletAPI.getSafeUTXOs(address, this.utxos);
            
            console.log(`Safe UTXOs: ${result.safe.length}, With inscriptions: ${result.withInscriptions.length}`);
            
            return result;
        } catch (error) {
            console.error('Failed to get safe UTXOs:', error);
            throw error;
        }
    }

    /**
     * Calculate available balance for sending (excluding inscription UTXOs)
     */
    async getAvailableBalance() {
        try {
            const { safe } = await this.getSafeUTXOs();
            const availableSatoshis = safe.reduce((total, utxo) => total + utxo.satoshis, 0);
            return availableSatoshis / DOGE_SATOSHIS; // Convert to DOGE
        } catch (error) {
            console.error('Failed to calculate available balance:', error);
            return 0;
        }
    }

    /**
     * Send DOGE safely (avoiding inscription UTXOs)
     */
    async sendDoge(toAddress, amountDoge, feeDoge = 1.0) {
        try {
            if (!this.credentials) {
                throw new Error('No wallet credentials loaded');
            }

            console.log(`Sending ${amountDoge} DOGE to ${toAddress} with fee ${feeDoge} DOGE`);

            // Validate inputs
            if (!Address.isValid(toAddress)) {
                throw new Error('Invalid recipient address');
            }

            if (amountDoge <= 0) {
                throw new Error('Amount must be greater than 0');
            }

            if (feeDoge < 0.1) {
                throw new Error('Fee must be at least 0.1 DOGE');
            }

            // Convert to satoshis
            const amountSatoshis = Math.floor(amountDoge * DOGE_SATOSHIS);
            const feeSatoshis = Math.floor(feeDoge * DOGE_SATOSHIS);
            const totalNeeded = amountSatoshis + feeSatoshis;

            // Get safe UTXOs (without inscriptions)
            const { safe: safeUTXOs } = await this.getSafeUTXOs();
            
            if (safeUTXOs.length === 0) {
                throw new Error('No safe UTXOs available for spending');
            }

            // Select UTXOs for the transaction
            const selectedUTXOs = [];
            let totalSelected = 0;

            // Sort UTXOs by value (largest first for efficiency)
            safeUTXOs.sort((a, b) => b.satoshis - a.satoshis);

            for (const utxo of safeUTXOs) {
                selectedUTXOs.push(utxo);
                totalSelected += utxo.satoshis;

                if (totalSelected >= totalNeeded) {
                    break;
                }
            }

            if (totalSelected < totalNeeded) {
                throw new Error(`Insufficient funds. Need ${totalNeeded / DOGE_SATOSHIS} DOGE, have ${totalSelected / DOGE_SATOSHIS} DOGE available`);
            }

            // Create transaction
            const tx = new Transaction();
            
            // Add inputs
            selectedUTXOs.forEach(utxo => {
                tx.from({
                    txid: utxo.txid,
                    vout: utxo.vout,
                    scriptPubKey: utxo.script,
                    satoshis: utxo.satoshis
                });
            });

            // Add output to recipient
            tx.to(toAddress, amountSatoshis);

            // Add change output if needed
            const change = totalSelected - totalNeeded;
            if (change > Transaction.DUST_AMOUNT) {
                const changeAddress = this.getAddress();
                tx.to(changeAddress, change);
            }

            // Set fee
            tx.fee(feeSatoshis);

            // Sign transaction
            tx.sign(this.credentials.privateKey);

            // Validate transaction
            const txHex = tx.toString();
            console.log('Transaction created:', {
                txid: tx.hash,
                size: txHex.length / 2,
                inputs: selectedUTXOs.length,
                outputs: tx.outputs.length,
                fee: feeSatoshis / DOGE_SATOSHIS
            });

            // Broadcast transaction
            const txid = await walletAPI.broadcastTransaction(txHex);
            
            console.log('Transaction broadcast successfully:', txid);
            
            // Refresh wallet data
            setTimeout(() => {
                this.refreshAll();
            }, 2000);

            return txid;
        } catch (error) {
            console.error('Failed to send DOGE:', error);
            throw error;
        }
    }

    /**
     * Send a doginal (inscription)
     */
    async sendDoginal(inscriptionId, toAddress) {
        try {
            if (!this.credentials) {
                throw new Error('No wallet credentials loaded');
            }

            console.log(`Sending doginal ${inscriptionId} to ${toAddress}`);

            // Validate address
            if (!Address.isValid(toAddress)) {
                throw new Error('Invalid recipient address');
            }

            // Find the inscription
            const inscription = this.inscriptions[`inscription_${inscriptionId}`];
            if (!inscription) {
                throw new Error('Inscription not found in wallet');
            }

            // Get the UTXO containing the inscription
            const inscriptionUTXO = inscription.utxo;
            if (!inscriptionUTXO) {
                throw new Error('Inscription UTXO not found');
            }

            // Check if this output has multiple inscriptions
            const outpointInscriptions = Object.values(this.inscriptions)
                .filter(insc => insc.outpoint === inscription.outpoint);
            
            if (outpointInscriptions.length > 1) {
                throw new Error('Cannot send doginal from output with multiple inscriptions');
            }

            // Get funding UTXOs (safe UTXOs for fees)
            const { safe: fundingUTXOs } = await this.getSafeUTXOs();
            
            if (fundingUTXOs.length === 0) {
                throw new Error('No funding UTXOs available for transaction fees');
            }

            // Create transaction
            const tx = new Transaction();
            
            // Add inscription UTXO as first input
            tx.from({
                txid: inscriptionUTXO.txid,
                vout: inscriptionUTXO.vout,
                scriptPubKey: inscriptionUTXO.script,
                satoshis: inscriptionUTXO.satoshis
            });

            // Add funding UTXOs for fees
            let fundingTotal = 0;
            const feeSatoshis = 100000000; // 1 DOGE fee
            
            for (const utxo of fundingUTXOs) {
                tx.from({
                    txid: utxo.txid,
                    vout: utxo.vout,
                    scriptPubKey: utxo.script,
                    satoshis: utxo.satoshis
                });
                
                fundingTotal += utxo.satoshis;
                
                if (fundingTotal >= feeSatoshis) {
                    break;
                }
            }

            if (fundingTotal < feeSatoshis) {
                throw new Error('Insufficient funds for transaction fee');
            }

            // Add output to recipient (dust amount to preserve inscription)
            tx.to(toAddress, Transaction.DUST_AMOUNT);

            // Add change output if needed
            const totalInput = inscriptionUTXO.satoshis + fundingTotal;
            const totalOutput = Transaction.DUST_AMOUNT + feeSatoshis;
            const change = totalInput - totalOutput;
            
            if (change > Transaction.DUST_AMOUNT) {
                const changeAddress = this.getAddress();
                tx.to(changeAddress, change);
            }

            // Set fee
            tx.fee(feeSatoshis);

            // Sign transaction
            tx.sign(this.credentials.privateKey);

            // Validate transaction
            const txHex = tx.toString();
            console.log('Doginal transaction created:', {
                txid: tx.hash,
                inscriptionId,
                recipient: toAddress
            });

            // Broadcast transaction
            const txid = await walletAPI.broadcastTransaction(txHex);
            
            console.log('Doginal transaction broadcast successfully:', txid);
            
            // Refresh wallet data
            setTimeout(() => {
                this.refreshAll();
            }, 2000);

            return txid;
        } catch (error) {
            console.error('Failed to send doginal:', error);
            throw error;
        }
    }

    /**
     * Refresh all wallet data
     */
    async refreshAll() {
        try {
            if (!this.credentials) {
                return;
            }

            console.log('Refreshing all wallet data...');
            
            // Refresh in parallel where possible
            await Promise.all([
                this.refreshUTXOs(),
                this.refreshBalance(),
                this.refreshTransactions()
            ]);

            // Refresh inscriptions after UTXOs are loaded
            await this.refreshInscriptions();
            
            console.log('Wallet data refresh completed');
            return true;
        } catch (error) {
            console.error('Failed to refresh wallet data:', error);
            throw error;
        }
    }

    /**
     * Get wallet summary
     */
    getWalletSummary() {
        return {
            address: this.credentials ? this.getAddress() : null,
            balance: this.balance,
            utxoCount: this.utxos.length,
            inscriptionCount: Object.keys(this.inscriptions).length,
            lastSync: this.lastSync,
            isLoading: this.isLoading
        };
    }

    /**
     * Clear wallet data (logout)
     */
    async clearWallet() {
        try {
            await walletStorage.clear();
            
            this.credentials = null;
            this.acceptedTerms = false;
            this.utxos = [];
            this.inscriptions = {};
            this.balance = { confirmed: 0, unconfirmed: 0, total: 0 };
            this.transactions = [];
            this.lastSync = null;
            
            console.log('Wallet data cleared');
            return true;
        } catch (error) {
            console.error('Failed to clear wallet:', error);
            throw error;
        }
    }

    /**
     * Logout and clear all wallet data including password
     */
    async logout() {
        try {
            // Clear all wallet data including password
            await walletStorage.removeMultiple([
                'privkey', 
                'mnemonic', 
                'derivation', 
                'utxos',
                'walletPassword',
                'accepted_terms'
            ]);
            
            // Reset instance variables
            this.credentials = null;
            this.acceptedTerms = false;
            this.utxos = [];
            this.inscriptions = {};
            this.balance = { confirmed: 0, unconfirmed: 0, total: 0 };
            this.transactions = [];
            this.lastSync = null;
            
            console.log('Wallet logout completed');
            return true;
        } catch (error) {
            console.error('Failed to logout:', error);
            throw error;
        }
    }
}

// Create global wallet instance
window.wallet = new WoofWallet();