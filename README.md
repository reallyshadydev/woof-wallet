# 🐕 Woof Wallet - Web-Based Dogecoin & Doginals Wallet

A modern, web-based wallet for Dogecoin and Doginals (Dogecoin inscriptions) with a focus on safety and user experience.

## 🌟 Features

### ✅ **Completed Features**

- **🌐 Web-Based**: Fully converted from browser extension to web application
- **📱 Mobile Responsive**: Works seamlessly on desktop, tablet, and mobile devices
- **🔒 Safe SendDoge**: Automatically avoids spending UTXOs containing doginals/inscriptions
- **🎨 Modern UI/UX**: Clean, intuitive interface with tabbed navigation
- **🖼️ Doginals Management**: View, manage, and send your doginal collection
- **📊 Transaction History**: Complete transaction history with filtering
- **🔐 Secure Storage**: Uses localStorage with proper encryption for web compatibility
- **🚀 Custom API Integration**: Integrated with DogePay and Wonky Ord APIs
- **⚡ Real-time Updates**: Live balance and transaction updates
- **💾 Backup/Restore**: Export and import wallet data

### 🎯 **Key Safety Features**

- **Inscription Protection**: Never accidentally spend UTXOs containing doginals
- **UTXO Validation**: Checks all UTXOs for inscriptions before spending
- **Safe Balance Calculation**: Shows available balance excluding inscription UTXOs
- **Transaction Validation**: Comprehensive validation before broadcasting
- **Error Handling**: Robust error handling with user-friendly messages

## 🚀 Getting Started

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection for blockchain API access
- No additional software installation required

### Setup

1. **Clone or Download** the wallet files to your web server or local machine
2. **Serve the files** using any web server (Apache, Nginx, or simple HTTP server)
3. **Open** `index.html` in your web browser
4. **Accept terms** and create or import your wallet

### Local Development

```bash
# Using Python (if you have Python installed)
python -m http.server 8000

# Using Node.js (if you have Node.js installed)
npx http-server

# Using PHP (if you have PHP installed)
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

## 🔧 API Configuration

The wallet uses these APIs:

### Blockchain API (DogePay)
- **Base URL**: `https://api.dogepaywallet.space`
- **Endpoints**:
  - `/address/{address}/utxo` - Get UTXOs
  - `/address/{address}/balance` - Get balance
  - `/address/{address}/txs` - Get transactions
  - `/blocks/tip/height` - Get block height
  - `/blocks/tip/hash` - Get block hash
  - `/tx` - Broadcast transaction
  - `/tx/{txid}` - Get transaction details

### Inscriptions API (Wonky Ord)
- **Base URL**: `https://wonky-ord.dogeord.io`
- **Endpoints**:
  - `/output/{outpoint}` - Get inscription data
  - `/content/{inscription_id}` - Get inscription content
  - `/shibescription/{inscription_id}` - Get inscription metadata

## 📱 User Interface

### Main Screens

1. **Terms Acceptance** - Legal acknowledgment
2. **Wallet Setup** - Create new or import existing wallet
3. **Main Wallet** - Primary interface with tabs:
   - **Overview** - Balance and quick stats
   - **Doginals** - View and manage inscriptions
   - **Send** - Safe DOGE sending interface
   - **History** - Transaction history with filtering

### Key Components

- **Responsive Design** - Adapts to all screen sizes
- **Touch-Friendly** - Optimized for mobile interaction
- **Modern Styling** - Clean, professional appearance
- **Loading States** - Clear feedback during operations
- **Error Handling** - User-friendly error messages

## 🔒 Security Features

### Private Key Management
- Keys stored securely in browser localStorage
- Never transmitted to servers
- Proper encryption and validation

### Transaction Safety
- **Safe UTXO Selection**: Automatically excludes inscription UTXOs
- **Balance Validation**: Shows spendable balance vs total balance
- **Fee Calculation**: Proper fee estimation and validation
- **Address Validation**: Validates recipient addresses

### Inscription Protection
- **UTXO Scanning**: Checks all UTXOs for inscriptions before spending
- **Visual Indicators**: Clear warnings about inscription safety
- **Separate Sending**: Dedicated interface for sending doginals
- **Multi-inscription Handling**: Prevents sending from mixed outputs

## 💻 Technical Architecture

### File Structure
```
/
├── index.html          # Main application HTML
├── styles.css          # Modern responsive styles
├── lib/                # External libraries
│   ├── bitcore-lib-doge.js
│   └── bitcore-mnemonic.js
└── js/                 # Application JavaScript
    ├── api.js          # API integration layer
    ├── storage.js      # Storage management
    ├── wallet.js       # Core wallet logic
    ├── ui.js           # User interface controller
    └── app.js          # Main application controller
```

### Key Classes

- **WalletAPI**: Handles all blockchain and inscription API calls
- **WalletStorage**: Manages localStorage with web compatibility
- **WoofWallet**: Core wallet functionality and transaction logic
- **WalletUI**: User interface management and event handling
- **WoofWalletApp**: Main application coordination

## 🛠️ Development

### Debugging

The wallet exposes a global `woofWallet` object for debugging:

```javascript
// Check wallet status
woofWallet.status()

// Test API connectivity
woofWallet.dev.testAPI('your-address-here')

// Clear storage
woofWallet.dev.clearStorage()

// Reset wallet
woofWallet.reset()

// Export wallet data
woofWallet.export()
```

### Adding Features

1. **API Integration**: Extend `WalletAPI` class in `js/api.js`
2. **UI Components**: Add to `WalletUI` class in `js/ui.js`
3. **Wallet Logic**: Extend `WoofWallet` class in `js/wallet.js`
4. **Styling**: Add CSS to `styles.css`

## 🔄 Migration from Extension

If migrating from the original browser extension:

1. The wallet will automatically detect and migrate legacy data
2. All existing wallets should work without issues
3. Backup your recovery phrase before migrating
4. Test with small amounts first

## ⚠️ Important Notes

### Security Warnings
- **Recovery Phrase**: Always backup your 12-word recovery phrase
- **Private Keys**: Never share your private keys or recovery phrase
- **Testing**: Test with small amounts before large transactions
- **Backups**: Regularly export wallet data for backup

### Known Limitations
- Requires internet connection for all operations
- Dependent on external APIs for blockchain data
- No offline transaction signing
- Browser storage limitations apply

## 🐛 Troubleshooting

### Common Issues

1. **Wallet Won't Load**
   - Check browser console for errors
   - Ensure JavaScript is enabled
   - Try refreshing the page
   - Clear browser cache

2. **API Errors**
   - Check internet connection
   - Verify API endpoints are accessible
   - Try refreshing wallet data

3. **Transaction Failures**
   - Ensure sufficient balance (excluding inscriptions)
   - Verify recipient address is valid
   - Check network fee is adequate

4. **Mobile Issues**
   - Use latest browser version
   - Ensure adequate screen space
   - Try landscape orientation for better experience

## 📞 Support

For issues, questions, or contributions:

1. Check the browser console for error messages
2. Verify all API endpoints are accessible
3. Test with a small amount first
4. Keep your recovery phrase secure

## 📜 License

This project maintains the same license as the original Woof Wallet extension.

## 🚨 Disclaimer

- This is experimental software - use at your own risk
- Always test with small amounts first
- Keep your recovery phrase secure and backed up
- The developers are not responsible for any losses
- Only store amounts you can afford to lose

---

**🐕 Happy Doginal Trading! Much Wow! Such Safe!**
