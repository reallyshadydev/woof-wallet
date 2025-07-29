/**
 * API Integration Layer for Woof Wallet
 * Integrates with DogePay Wallet API and Wonky Ord API
 */

class WalletAPI {
    constructor() {
        this.blockchainAPI = {
            baseUrl: 'https://api.dogepaywallet.space',
            name: 'DogePay API'
        };
        
        this.inscriptionsAPI = {
            baseUrl: 'https://wonky-ord.dogeord.io',
            name: 'Wonky Ord API'
        };
        
        this.retryCount = 3;
        this.retryDelay = 1000; // 1 second
    }

    /**
     * Generic fetch with retry logic and error handling
     */
    async fetchWithRetry(url, options = {}, retries = this.retryCount) {
        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(url, {
                    ...options,
                    headers: {
                        'Content-Type': 'application/json',
                        ...options.headers
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                return response;
            } catch (error) {
                console.error(`API call failed (attempt ${i + 1}/${retries}):`, error);
                
                if (i === retries - 1) {
                    throw error;
                }
                
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, this.retryDelay));
            }
        }
    }

    /**
     * Get UTXOs for an address
     */
    async getUTXOs(address) {
        try {
            const url = `${this.blockchainAPI.baseUrl}/address/${address}/utxo`;
            const response = await this.fetchWithRetry(url);
            const data = await response.json();
            
            // Convert to our expected format
            return data.map(utxo => ({
                txid: utxo.txid,
                vout: utxo.vout,
                script: utxo.scriptPubKey,
                satoshis: utxo.value,
                confirmations: utxo.confirmations || 0
            }));
        } catch (error) {
            console.error('Failed to fetch UTXOs:', error);
            throw new Error(`Failed to fetch UTXOs: ${error.message}`);
        }
    }

    /**
     * Get balance for an address
     */
    async getBalance(address) {
        try {
            const url = `${this.blockchainAPI.baseUrl}/address/${address}/balance`;
            const response = await this.fetchWithRetry(url);
            const data = await response.json();
            
            return {
                confirmed: data.confirmed || 0,
                unconfirmed: data.unconfirmed || 0,
                total: (data.confirmed || 0) + (data.unconfirmed || 0)
            };
        } catch (error) {
            console.error('Failed to fetch balance:', error);
            throw new Error(`Failed to fetch balance: ${error.message}`);
        }
    }

    /**
     * Get transaction history for an address
     */
    async getTransactions(address, limit = 50) {
        try {
            const url = `${this.blockchainAPI.baseUrl}/address/${address}/txs?limit=${limit}`;
            const response = await this.fetchWithRetry(url);
            const data = await response.json();
            
            return data.map(tx => ({
                txid: tx.txid,
                time: tx.time || tx.blocktime,
                confirmations: tx.confirmations || 0,
                inputs: tx.vin || [],
                outputs: tx.vout || [],
                fee: tx.fee || 0,
                value: tx.value || 0
            }));
        } catch (error) {
            console.error('Failed to fetch transactions:', error);
            throw new Error(`Failed to fetch transactions: ${error.message}`);
        }
    }

    /**
     * Get specific transaction details
     */
    async getTransaction(txid) {
        try {
            const url = `${this.blockchainAPI.baseUrl}/tx/${txid}`;
            const response = await this.fetchWithRetry(url);
            return await response.json();
        } catch (error) {
            console.error('Failed to fetch transaction:', error);
            throw new Error(`Failed to fetch transaction: ${error.message}`);
        }
    }

    /**
     * Get current block tip height
     */
    async getBlockTipHeight() {
        try {
            const url = `${this.blockchainAPI.baseUrl}/blocks/tip/height`;
            const response = await this.fetchWithRetry(url);
            const data = await response.json();
            return data.height || data;
        } catch (error) {
            console.error('Failed to fetch block tip height:', error);
            throw new Error(`Failed to fetch block tip height: ${error.message}`);
        }
    }

    /**
     * Get current block tip hash
     */
    async getBlockTipHash() {
        try {
            const url = `${this.blockchainAPI.baseUrl}/blocks/tip/hash`;
            const response = await this.fetchWithRetry(url);
            const data = await response.json();
            return data.hash || data;
        } catch (error) {
            console.error('Failed to fetch block tip hash:', error);
            throw new Error(`Failed to fetch block tip hash: ${error.message}`);
        }
    }

    /**
     * Broadcast a transaction
     */
    async broadcastTransaction(rawTx) {
        try {
            const url = `${this.blockchainAPI.baseUrl}/tx`;
            const response = await this.fetchWithRetry(url, {
                method: 'POST',
                body: JSON.stringify({ hex: rawTx })
            });
            
            const result = await response.json();
            return result.txid || result;
        } catch (error) {
            console.error('Failed to broadcast transaction:', error);
            throw new Error(`Failed to broadcast transaction: ${error.message}`);
        }
    }

    /**
     * Get inscription data for an output
     */
    async getInscriptionOutput(outpoint) {
        try {
            const url = `${this.inscriptionsAPI.baseUrl}/output/${outpoint}`;
            const response = await this.fetchWithRetry(url);
            
            if (response.status === 404) {
                return null; // No inscriptions at this output
            }
            
            const html = await response.text();
            return this.parseInscriptionHTML(html, outpoint);
        } catch (error) {
            console.error('Failed to fetch inscription output:', error);
            // Don't throw error for inscription queries - just return null
            return null;
        }
    }

    /**
     * Parse inscription HTML response
     */
    parseInscriptionHTML(html, outpoint) {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const main = doc.getElementsByTagName("main")[0];
            
            if (!main) return null;
            
            const list = main.getElementsByTagName("dl")[0];
            if (!list) return null;
            
            const thumbnails = Array.from(list.getElementsByTagName("dd"))
                .filter(x => x.className === "thumbnails");
            
            const inscriptionIds = thumbnails.map(x => {
                const link = x.getElementsByTagName("a")[0];
                if (link) {
                    const href = link.getAttribute("href");
                    return href ? href.split("/shibescription/")[1] : null;
                }
                return null;
            }).filter(id => id !== null);
            
            return inscriptionIds.length > 0 ? inscriptionIds : null;
        } catch (error) {
            console.error('Failed to parse inscription HTML:', error);
            return null;
        }
    }

    /**
     * Get inscription content
     */
    async getInscriptionContent(inscriptionId) {
        try {
            const url = `${this.inscriptionsAPI.baseUrl}/content/${inscriptionId}`;
            const response = await this.fetchWithRetry(url);
            
            const contentType = response.headers.get('content-type') || 'application/octet-stream';
            
            if (contentType.startsWith('image/')) {
                const blob = await response.blob();
                return {
                    type: 'image',
                    contentType,
                    data: URL.createObjectURL(blob),
                    blob
                };
            } else if (contentType.startsWith('text/')) {
                const text = await response.text();
                return {
                    type: 'text',
                    contentType,
                    data: text
                };
            } else {
                // Handle other content types
                const blob = await response.blob();
                return {
                    type: 'binary',
                    contentType,
                    data: URL.createObjectURL(blob),
                    blob
                };
            }
        } catch (error) {
            console.error('Failed to fetch inscription content:', error);
            throw new Error(`Failed to fetch inscription content: ${error.message}`);
        }
    }

    /**
     * Get inscription metadata (shibescription)
     */
    async getInscriptionMetadata(inscriptionId) {
        try {
            const url = `${this.inscriptionsAPI.baseUrl}/shibescription/${inscriptionId}`;
            const response = await this.fetchWithRetry(url);
            const html = await response.text();
            
            return this.parseInscriptionMetadata(html, inscriptionId);
        } catch (error) {
            console.error('Failed to fetch inscription metadata:', error);
            throw new Error(`Failed to fetch inscription metadata: ${error.message}`);
        }
    }

    /**
     * Parse inscription metadata from HTML
     */
    parseInscriptionMetadata(html, inscriptionId) {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Extract inscription number and other metadata
            const metadata = {
                id: inscriptionId,
                number: null,
                timestamp: null,
                fee: null,
                address: null,
                output: null
            };
            
            // Try to extract inscription number from the page
            const numberElement = doc.querySelector('h1');
            if (numberElement) {
                const numberMatch = numberElement.textContent.match(/Inscription (\d+)/);
                if (numberMatch) {
                    metadata.number = parseInt(numberMatch[1]);
                }
            }
            
            // Extract other metadata from dl elements
            const dlElements = doc.querySelectorAll('dl dt');
            dlElements.forEach(dt => {
                const dd = dt.nextElementSibling;
                if (dd) {
                    const key = dt.textContent.toLowerCase().trim();
                    const value = dd.textContent.trim();
                    
                    switch (key) {
                        case 'timestamp':
                            metadata.timestamp = value;
                            break;
                        case 'fee':
                            metadata.fee = value;
                            break;
                        case 'address':
                            metadata.address = value;
                            break;
                        case 'output':
                            metadata.output = value;
                            break;
                    }
                }
            });
            
            return metadata;
        } catch (error) {
            console.error('Failed to parse inscription metadata:', error);
            return {
                id: inscriptionId,
                number: null,
                timestamp: null,
                fee: null,
                address: null,
                output: null
            };
        }
    }

    /**
     * Check if UTXOs are safe to spend (don't contain inscriptions)
     */
    async getSafeUTXOs(address, utxos) {
        const safeUTXOs = [];
        const inscriptionUTXOs = [];
        
        for (const utxo of utxos) {
            const outpoint = `${utxo.txid}:${utxo.vout}`;
            const inscriptions = await this.getInscriptionOutput(outpoint);
            
            if (inscriptions && inscriptions.length > 0) {
                inscriptionUTXOs.push({
                    ...utxo,
                    inscriptions
                });
            } else {
                safeUTXOs.push(utxo);
            }
        }
        
        return {
            safe: safeUTXOs,
            withInscriptions: inscriptionUTXOs
        };
    }

    /**
     * Get all inscriptions for an address
     */
    async getAddressInscriptions(address, utxos) {
        const inscriptions = {};
        
        for (const utxo of utxos) {
            const outpoint = `${utxo.txid}:${utxo.vout}`;
            const inscriptionIds = await this.getInscriptionOutput(outpoint);
            
            if (inscriptionIds && inscriptionIds.length > 0) {
                for (const inscriptionId of inscriptionIds) {
                    try {
                        const [content, metadata] = await Promise.all([
                            this.getInscriptionContent(inscriptionId),
                            this.getInscriptionMetadata(inscriptionId)
                        ]);
                        
                        inscriptions[`inscription_${inscriptionId}`] = {
                            id: inscriptionId,
                            outpoint,
                            content,
                            metadata,
                            utxo
                        };
                    } catch (error) {
                        console.error(`Failed to fetch inscription ${inscriptionId}:`, error);
                    }
                }
            }
        }
        
        return inscriptions;
    }
}

// Create global API instance
window.walletAPI = new WalletAPI();