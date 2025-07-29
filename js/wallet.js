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
            const data = {
                privkey: credentials.privateKey.toWIF(),
                mnemonic: credentials.mnemonic ? credentials.mnemonic.toString() : null,
                derivation: credentials.derivation
            };

            await walletStorage.setMultiple(data);
            this.credentials = credentials;
            
            return true;
        } catch (error) {
            console.error('Failed to store credentials:', error);
            throw error;
        }
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
}

// Create global wallet instance
window.wallet = new WoofWallet();