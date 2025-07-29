#!/usr/bin/env node
/**
 * Woof Wallet - Node.js Development Server
 * Serves the wallet application with proper routing and security headers
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const { createProxyMiddleware } = require('http-proxy-middleware');

// Configuration
const PORT = process.env.PORT || 8000;
const app = express();

// Middleware for CORS and security headers
app.use((req, res, next) => {
    // CORS headers for local development
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Security headers
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'DENY');
    res.header('X-XSS-Protection', '1; mode=block');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Middleware for JSON parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Proxy middleware for external APIs to handle CORS
// DogePay Wallet API proxy
app.use('/api/dogepaywallet', createProxyMiddleware({
    target: 'https://api.dogepaywallet.space',
    changeOrigin: true,
    pathRewrite: {
        '^/api/dogepaywallet': '', // Remove /api/dogepaywallet prefix
    },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`[PROXY] ${req.method} ${req.url} -> https://api.dogepaywallet.space${req.url.replace('/api/dogepaywallet', '')}`);
    },
    onError: (err, req, res) => {
        console.error('Proxy error:', err);
        res.status(500).json({ error: 'Proxy error', message: err.message });
    }
}));

// Wonky Ord API proxy
app.use('/api/wonkyord', createProxyMiddleware({
    target: 'https://wonky-ord.dogeord.io',
    changeOrigin: true,
    pathRewrite: {
        '^/api/wonkyord': '', // Remove /api/wonkyord prefix
    },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`[PROXY] ${req.method} ${req.url} -> https://wonky-ord.dogeord.io${req.url.replace('/api/wonkyord', '')}`);
    },
    onError: (err, req, res) => {
        console.error('Proxy error:', err);
        res.status(500).json({ error: 'Proxy error', message: err.message });
    }
}));

// Static file serving with proper MIME types
app.use(express.static('.', {
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.set('Content-Type', 'application/javascript');
        } else if (path.endsWith('.css')) {
            res.set('Content-Type', 'text/css');
        } else if (path.endsWith('.html')) {
            res.set('Content-Type', 'text/html');
        } else if (path.endsWith('.json')) {
            res.set('Content-Type', 'application/json');
        }
    }
}));

// API Routes for wallet functionality
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        service: 'Woof Wallet Server'
    });
});

// Wallet API routes
app.get('/api/wallet/balance/:address', (req, res) => {
    const { address } = req.params;
    // This would typically fetch from a blockchain API
    res.json({
        address,
        balance: 0,
        unconfirmed: 0,
        currency: 'DOGE'
    });
});

app.post('/api/wallet/transaction', (req, res) => {
    const { from, to, amount, fee } = req.body;
    
    if (!from || !to || !amount) {
        return res.status(400).json({
            error: 'Missing required fields: from, to, amount'
        });
    }
    
    // This would typically broadcast to the network
    res.json({
        txid: 'mock_transaction_id_' + Date.now(),
        status: 'pending',
        from,
        to,
        amount,
        fee: fee || 0.001
    });
});

// Doginals/NFT routes
app.get('/api/doginals/:address', (req, res) => {
    const { address } = req.params;
    res.json({
        address,
        doginals: [],
        count: 0
    });
});

app.get('/api/doginal/:inscriptionId', (req, res) => {
    const { inscriptionId } = req.params;
    res.json({
        inscriptionId,
        contentType: 'text/plain',
        content: '',
        owner: '',
        genesis: ''
    });
});

// Storage API routes for wallet data
app.get('/api/storage/:key', (req, res) => {
    const { key } = req.params;
    // In a real implementation, this would use secure storage
    res.json({
        key,
        exists: false,
        data: null
    });
});

app.post('/api/storage/:key', (req, res) => {
    const { key } = req.params;
    const { data } = req.body;
    
    // In a real implementation, this would securely store the data
    res.json({
        key,
        stored: true,
        timestamp: new Date().toISOString()
    });
});

// Serve the main wallet application
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve popup window
app.get('/popup', (req, res) => {
    const popupPath = path.join(__dirname, 'popup', 'popup.html');
    if (fs.existsSync(popupPath)) {
        res.sendFile(popupPath);
    } else {
        res.redirect('/');
    }
});

// Serve options page
app.get('/options', (req, res) => {
    const optionsPath = path.join(__dirname, 'options', 'options.html');
    if (fs.existsSync(optionsPath)) {
        res.sendFile(optionsPath);
    } else {
        res.redirect('/');
    }
});

// Handle 404s by serving the main app (for SPA routing)
app.get('*', (req, res) => {
    // Don't redirect API calls
    if (req.path.startsWith('/api/')) {
        res.status(404).json({ error: 'API endpoint not found' });
    } else {
        res.sendFile(path.join(__dirname, 'index.html'));
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// Start the server
function startServer() {
    const server = app.listen(PORT, () => {
        console.log('🐕 Woof Wallet development server starting...');
        console.log(`📡 Server running at: http://localhost:${PORT}`);
        console.log(`📁 Serving directory: ${__dirname}`);
        console.log(`🌐 Open http://localhost:${PORT} in your browser`);
        console.log(`⏹️  Press Ctrl+C to stop the server`);
        console.log('-'.repeat(50));
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Server stopped by user');
        server.close(() => {
            process.exit(0);
        });
    });

    process.on('SIGTERM', () => {
        console.log('\n🛑 Server terminated');
        server.close(() => {
            process.exit(0);
        });
    });

    // Handle server errors
    server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
            console.log(`❌ Port ${PORT} is already in use`);
            console.log(`💡 Try a different port or stop the existing server`);
        } else {
            console.log(`❌ Server error: ${error.message}`);
        }
        process.exit(1);
    });
}

// Start the server if this file is run directly
if (require.main === module) {
    startServer();
}

module.exports = app;