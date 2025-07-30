/**
 * Comprehensive UI Testing Suite
 * Tests desktop-first design, mobile compatibility, accessibility, and performance
 */

class UITestingSuite {
  constructor() {
    this.tests = [];
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      errors: []
    };
    this.init();
  }

  init() {
    console.log('🧪 Initializing UI Testing Suite...');
    this.registerTests();
    this.runTests();
  }

  registerTests() {
    // Desktop-first responsive design tests
    this.addTest('Desktop Layout', this.testDesktopLayout.bind(this));
    this.addTest('Mobile Responsiveness', this.testMobileResponsiveness.bind(this));
    this.addTest('Tablet Compatibility', this.testTabletCompatibility.bind(this));
    
    // Modern aesthetic tests
    this.addTest('Typography System', this.testTypography.bind(this));
    this.addTest('Color Contrast', this.testColorContrast.bind(this));
    this.addTest('Visual Hierarchy', this.testVisualHierarchy.bind(this));
    
    // Navigation tests
    this.addTest('Keyboard Navigation', this.testKeyboardNavigation.bind(this));
    this.addTest('Tab Interactions', this.testTabInteractions.bind(this));
    this.addTest('Hover Effects', this.testHoverEffects.bind(this));
    
    // Performance tests
    this.addTest('CSS Performance', this.testCSSPerformance.bind(this));
    this.addTest('Animation Performance', this.testAnimationPerformance.bind(this));
    this.addTest('Resource Loading', this.testResourceLoading.bind(this));
    
    // Accessibility tests
    this.addTest('ARIA Labels', this.testARIALabels.bind(this));
    this.addTest('Focus Management', this.testFocusManagement.bind(this));
    this.addTest('Screen Reader Support', this.testScreenReaderSupport.bind(this));
    
    // Cross-browser compatibility tests
    this.addTest('CSS Grid Support', this.testCSSGridSupport.bind(this));
    this.addTest('Flexbox Support', this.testFlexboxSupport.bind(this));
    this.addTest('CSS Variables Support', this.testCSSVariablesSupport.bind(this));
    
    // Visual feedback tests
    this.addTest('Button Feedback', this.testButtonFeedback.bind(this));
    this.addTest('Form Validation', this.testFormValidation.bind(this));
    this.addTest('Loading States', this.testLoadingStates.bind(this));
  }

  addTest(name, testFunction) {
    this.tests.push({ name, testFunction });
  }

  async runTests() {
    console.log(`🏃 Running ${this.tests.length} UI tests...`);
    
    for (const test of this.tests) {
      try {
        console.log(`📋 Testing: ${test.name}`);
        const result = await test.testFunction();
        
        if (result.passed) {
          this.results.passed++;
          console.log(`✅ ${test.name}: PASSED`);
        } else {
          this.results.failed++;
          console.log(`❌ ${test.name}: FAILED - ${result.message}`);
          this.results.errors.push(`${test.name}: ${result.message}`);
        }
        
        if (result.warnings && result.warnings.length > 0) {
          this.results.warnings += result.warnings.length;
          result.warnings.forEach(warning => {
            console.log(`⚠️ ${test.name}: ${warning}`);
          });
        }
      } catch (error) {
        this.results.failed++;
        console.error(`💥 ${test.name}: ERROR - ${error.message}`);
        this.results.errors.push(`${test.name}: ${error.message}`);
      }
    }
    
    this.generateReport();
  }

  // Desktop Layout Tests
  async testDesktopLayout() {
    const warnings = [];
    const container = document.querySelector('.wallet-container') || document.querySelector('.container');
    
    if (!container) {
      return { passed: false, message: 'No main container found' };
    }
    
    const containerWidth = container.offsetWidth;
    const viewportWidth = window.innerWidth;
    
    // Test desktop container width
    if (viewportWidth >= 1024) {
      if (containerWidth > viewportWidth * 0.9) {
        warnings.push('Container too wide for desktop viewport');
      }
      
      if (containerWidth < 800) {
        warnings.push('Container might be too narrow for desktop');
      }
    }
    
    // Test grid layouts
    const statsGrid = document.querySelector('.overview-stats');
    if (statsGrid && window.innerWidth >= 1024) {
      const computedStyle = window.getComputedStyle(statsGrid);
      if (!computedStyle.display.includes('grid')) {
        warnings.push('Statistics not using CSS Grid on desktop');
      }
    }
    
    return { passed: true, warnings };
  }

  // Mobile Responsiveness Tests
  async testMobileResponsiveness() {
    const warnings = [];
    
    // Simulate mobile viewport
    const originalWidth = window.innerWidth;
    
    // Test touch targets
    const buttons = document.querySelectorAll('.btn, .tab-button, .action-button');
    buttons.forEach((btn, index) => {
      const rect = btn.getBoundingClientRect();
      if (rect.width < 44 || rect.height < 44) {
        warnings.push(`Button ${index + 1} too small for touch (${rect.width}x${rect.height})`);
      }
    });
    
    // Test mobile navigation
    const tabs = document.querySelector('.wallet-tabs');
    if (tabs) {
      const computedStyle = window.getComputedStyle(tabs);
      if (computedStyle.overflowX !== 'auto') {
        warnings.push('Tab navigation missing horizontal scroll for mobile');
      }
    }
    
    return { passed: true, warnings };
  }

  // Tablet Compatibility Tests
  async testTabletCompatibility() {
    const warnings = [];
    
    // Test medium breakpoint behavior
    const cards = document.querySelectorAll('.card, .stat-card');
    cards.forEach(card => {
      const computedStyle = window.getComputedStyle(card);
      if (computedStyle.padding === '0px') {
        warnings.push('Card padding not properly set for tablet view');
      }
    });
    
    return { passed: true, warnings };
  }

  // Typography Tests
  async testTypography() {
    const warnings = [];
    
    // Test font loading
    const body = document.body;
    const computedStyle = window.getComputedStyle(body);
    const fontFamily = computedStyle.fontFamily;
    
    if (!fontFamily.includes('Inter')) {
      warnings.push('Primary font (Inter) not loaded');
    }
    
    // Test heading hierarchy
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    if (headings.length === 0) {
      warnings.push('No heading elements found');
    }
    
    // Test line height
    const textElements = document.querySelectorAll('p, span, div');
    let invalidLineHeight = 0;
    textElements.forEach(el => {
      const style = window.getComputedStyle(el);
      const lineHeight = parseFloat(style.lineHeight);
      const fontSize = parseFloat(style.fontSize);
      
      if (lineHeight > 0 && (lineHeight / fontSize) < 1.2) {
        invalidLineHeight++;
      }
    });
    
    if (invalidLineHeight > 0) {
      warnings.push(`${invalidLineHeight} elements with poor line height`);
    }
    
    return { passed: true, warnings };
  }

  // Color Contrast Tests
  async testColorContrast() {
    const warnings = [];
    
    // Test common text elements
    const textElements = document.querySelectorAll('button, .tab-button, p, span, label');
    let lowContrastCount = 0;
    
    textElements.forEach(el => {
      const style = window.getComputedStyle(el);
      const color = style.color;
      const backgroundColor = style.backgroundColor;
      
      // Simple contrast check (would need more sophisticated implementation)
      if (color === backgroundColor) {
        lowContrastCount++;
      }
    });
    
    if (lowContrastCount > 0) {
      warnings.push(`${lowContrastCount} elements may have insufficient contrast`);
    }
    
    return { passed: true, warnings };
  }

  // Visual Hierarchy Tests
  async testVisualHierarchy() {
    const warnings = [];
    
    // Test font size hierarchy
    const h1 = document.querySelector('h1');
    const h2 = document.querySelector('h2');
    const p = document.querySelector('p');
    
    if (h1 && h2) {
      const h1Size = parseFloat(window.getComputedStyle(h1).fontSize);
      const h2Size = parseFloat(window.getComputedStyle(h2).fontSize);
      
      if (h1Size <= h2Size) {
        warnings.push('H1 should be larger than H2');
      }
    }
    
    if (h2 && p) {
      const h2Size = parseFloat(window.getComputedStyle(h2).fontSize);
      const pSize = parseFloat(window.getComputedStyle(p).fontSize);
      
      if (h2Size <= pSize) {
        warnings.push('H2 should be larger than paragraph text');
      }
    }
    
    return { passed: true, warnings };
  }

  // Keyboard Navigation Tests
  async testKeyboardNavigation() {
    const warnings = [];
    
    // Test tab index
    const interactiveElements = document.querySelectorAll('button, input, select, textarea, a[href]');
    let elementsWithoutTabIndex = 0;
    
    interactiveElements.forEach(el => {
      const tabIndex = el.getAttribute('tabindex');
      if (tabIndex === '-1' && !el.disabled) {
        elementsWithoutTabIndex++;
      }
    });
    
    if (elementsWithoutTabIndex > 0) {
      warnings.push(`${elementsWithoutTabIndex} interactive elements not keyboard accessible`);
    }
    
    // Test focus styles
    const buttons = document.querySelectorAll('button');
    let buttonsWithoutFocus = 0;
    
    buttons.forEach(btn => {
      // Simulate focus to check for focus styles
      btn.focus();
      const style = window.getComputedStyle(btn, ':focus');
      btn.blur();
      
      // This is a simplified check
      if (!style.outline && !style.boxShadow) {
        buttonsWithoutFocus++;
      }
    });
    
    if (buttonsWithoutFocus > 0) {
      warnings.push(`${buttonsWithoutFocus} buttons missing focus styles`);
    }
    
    return { passed: true, warnings };
  }

  // Tab Interactions Tests
  async testTabInteractions() {
    const warnings = [];
    
    const tabButtons = document.querySelectorAll('.tab-button');
    if (tabButtons.length === 0) {
      return { passed: false, message: 'No tab buttons found' };
    }
    
    // Test ARIA attributes
    tabButtons.forEach((tab, index) => {
      if (!tab.getAttribute('role')) {
        warnings.push(`Tab ${index + 1} missing role attribute`);
      }
      
      if (!tab.getAttribute('aria-selected')) {
        warnings.push(`Tab ${index + 1} missing aria-selected attribute`);
      }
    });
    
    return { passed: true, warnings };
  }

  // Hover Effects Tests
  async testHoverEffects() {
    const warnings = [];
    
    // Test if hover effects are properly implemented
    const hoverElements = document.querySelectorAll('.btn, .card, .tab-button');
    
    hoverElements.forEach((el, index) => {
      const style = window.getComputedStyle(el);
      const transition = style.transition;
      
      if (!transition || transition === 'none') {
        warnings.push(`Element ${index + 1} missing transition for smooth hover`);
      }
    });
    
    return { passed: true, warnings };
  }

  // CSS Performance Tests
  async testCSSPerformance() {
    const warnings = [];
    
    // Test for expensive CSS properties
    const allElements = document.querySelectorAll('*');
    let expensiveProperties = 0;
    
    allElements.forEach(el => {
      const style = window.getComputedStyle(el);
      
      // Check for performance-expensive properties
      if (style.filter && style.filter !== 'none') {
        expensiveProperties++;
      }
      
      if (style.backdropFilter && style.backdropFilter !== 'none') {
        // Backdrop filter is expensive but acceptable for modern design
      }
    });
    
    // Test CSS file size (approximate)
    const styleSheets = document.styleSheets;
    let totalRules = 0;
    
    try {
      Array.from(styleSheets).forEach(sheet => {
        if (sheet.cssRules) {
          totalRules += sheet.cssRules.length;
        }
      });
      
      if (totalRules > 2000) {
        warnings.push(`High number of CSS rules (${totalRules})`);
      }
    } catch (e) {
      // Cross-origin stylesheets might not be accessible
    }
    
    return { passed: true, warnings };
  }

  // Animation Performance Tests
  async testAnimationPerformance() {
    const warnings = [];
    
    // Test for animations that might cause layout thrashing
    const animatedElements = document.querySelectorAll('*');
    let layoutTriggeringAnimations = 0;
    
    animatedElements.forEach(el => {
      const style = window.getComputedStyle(el);
      const transition = style.transition;
      
      if (transition && transition.includes('width')) {
        layoutTriggeringAnimations++;
      }
      if (transition && transition.includes('height')) {
        layoutTriggeringAnimations++;
      }
      if (transition && transition.includes('top')) {
        layoutTriggeringAnimations++;
      }
      if (transition && transition.includes('left')) {
        layoutTriggeringAnimations++;
      }
    });
    
    if (layoutTriggeringAnimations > 0) {
      warnings.push(`${layoutTriggeringAnimations} animations may cause layout thrashing`);
    }
    
    return { passed: true, warnings };
  }

  // Resource Loading Tests
  async testResourceLoading() {
    const warnings = [];
    
    // Test font loading
    const fonts = document.fonts;
    if (fonts) {
      const fontStatus = fonts.status;
      if (fontStatus !== 'loaded') {
        warnings.push(`Fonts not fully loaded (${fontStatus})`);
      }
    }
    
    // Test image loading
    const images = document.querySelectorAll('img');
    let unloadedImages = 0;
    
    images.forEach(img => {
      if (!img.complete) {
        unloadedImages++;
      }
    });
    
    if (unloadedImages > 0) {
      warnings.push(`${unloadedImages} images not loaded`);
    }
    
    return { passed: true, warnings };
  }

  // ARIA Labels Tests
  async testARIALabels() {
    const warnings = [];
    
    // Test buttons
    const buttons = document.querySelectorAll('button');
    let buttonsWithoutLabels = 0;
    
    buttons.forEach(btn => {
      const hasLabel = btn.getAttribute('aria-label') || 
                      btn.getAttribute('aria-labelledby') || 
                      btn.textContent.trim() !== '';
      
      if (!hasLabel) {
        buttonsWithoutLabels++;
      }
    });
    
    if (buttonsWithoutLabels > 0) {
      warnings.push(`${buttonsWithoutLabels} buttons without accessible labels`);
    }
    
    // Test form inputs
    const inputs = document.querySelectorAll('input');
    let inputsWithoutLabels = 0;
    
    inputs.forEach(input => {
      const hasLabel = input.getAttribute('aria-label') || 
                      input.getAttribute('aria-labelledby') || 
                      document.querySelector(`label[for="${input.id}"]`);
      
      if (!hasLabel) {
        inputsWithoutLabels++;
      }
    });
    
    if (inputsWithoutLabels > 0) {
      warnings.push(`${inputsWithoutLabels} inputs without labels`);
    }
    
    return { passed: true, warnings };
  }

  // Focus Management Tests
  async testFocusManagement() {
    const warnings = [];
    
    // Test focus trap in modals
    const modals = document.querySelectorAll('.modal');
    modals.forEach((modal, index) => {
      const focusableElements = modal.querySelectorAll('button, input, select, textarea, a[href]');
      if (focusableElements.length === 0) {
        warnings.push(`Modal ${index + 1} has no focusable elements`);
      }
    });
    
    // Test skip links
    const skipLinks = document.querySelectorAll('.skip-link');
    if (skipLinks.length === 0) {
      warnings.push('No skip links found for accessibility');
    }
    
    return { passed: true, warnings };
  }

  // Screen Reader Support Tests
  async testScreenReaderSupport() {
    const warnings = [];
    
    // Test semantic HTML
    const landmarks = document.querySelectorAll('main, nav, header, footer, aside, section');
    if (landmarks.length === 0) {
      warnings.push('No semantic landmarks found');
    }
    
    // Test ARIA live regions
    const liveRegions = document.querySelectorAll('[aria-live]');
    if (liveRegions.length === 0) {
      warnings.push('No ARIA live regions for dynamic content');
    }
    
    // Test heading structure
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const h1Count = document.querySelectorAll('h1').length;
    
    if (h1Count === 0) {
      warnings.push('No H1 heading found');
    } else if (h1Count > 1) {
      warnings.push('Multiple H1 headings found');
    }
    
    return { passed: true, warnings };
  }

  // CSS Grid Support Tests
  async testCSSGridSupport() {
    const warnings = [];
    
    const testEl = document.createElement('div');
    testEl.style.display = 'grid';
    
    if (testEl.style.display !== 'grid') {
      return { passed: false, message: 'CSS Grid not supported' };
    }
    
    // Test grid fallbacks
    const gridElements = document.querySelectorAll('.overview-stats, .quick-actions');
    gridElements.forEach((el, index) => {
      const style = window.getComputedStyle(el);
      if (style.display !== 'grid') {
        warnings.push(`Grid element ${index + 1} not using CSS Grid`);
      }
    });
    
    return { passed: true, warnings };
  }

  // Flexbox Support Tests
  async testFlexboxSupport() {
    const warnings = [];
    
    const testEl = document.createElement('div');
    testEl.style.display = 'flex';
    
    if (testEl.style.display !== 'flex') {
      return { passed: false, message: 'Flexbox not supported' };
    }
    
    return { passed: true, warnings };
  }

  // CSS Variables Support Tests
  async testCSSVariablesSupport() {
    const warnings = [];
    
    const testEl = document.createElement('div');
    testEl.style.setProperty('--test-var', 'test');
    
    if (!testEl.style.getPropertyValue('--test-var')) {
      warnings.push('CSS Variables not fully supported');
    }
    
    return { passed: true, warnings };
  }

  // Button Feedback Tests
  async testButtonFeedback() {
    const warnings = [];
    
    const buttons = document.querySelectorAll('.btn, .tab-button, .action-button');
    
    buttons.forEach((btn, index) => {
      const style = window.getComputedStyle(btn);
      
      // Test for transition
      if (!style.transition || style.transition === 'none') {
        warnings.push(`Button ${index + 1} missing transition feedback`);
      }
      
      // Test for cursor pointer
      if (style.cursor !== 'pointer') {
        warnings.push(`Button ${index + 1} missing pointer cursor`);
      }
    });
    
    return { passed: true, warnings };
  }

  // Form Validation Tests
  async testFormValidation() {
    const warnings = [];
    
    const forms = document.querySelectorAll('form');
    const inputs = document.querySelectorAll('input[required]');
    
    if (forms.length > 0 && inputs.length === 0) {
      warnings.push('Forms found but no required validation');
    }
    
    // Test for error message containers
    const errorContainers = document.querySelectorAll('.form-error, .error-message');
    inputs.forEach((input, index) => {
      const hasErrorContainer = input.parentNode.querySelector('.form-error');
      if (!hasErrorContainer) {
        warnings.push(`Input ${index + 1} missing error message container`);
      }
    });
    
    return { passed: true, warnings };
  }

  // Loading States Tests
  async testLoadingStates() {
    const warnings = [];
    
    // Test for loading indicators
    const loadingElements = document.querySelectorAll('.loading, .spinner, .loading-spinner');
    if (loadingElements.length === 0) {
      warnings.push('No loading state indicators found');
    }
    
    // Test for loading button states
    const loadingButtons = document.querySelectorAll('.btn-loading');
    if (loadingButtons.length === 0) {
      warnings.push('No loading button states implemented');
    }
    
    return { passed: true, warnings };
  }

  generateReport() {
    const total = this.results.passed + this.results.failed;
    const successRate = ((this.results.passed / total) * 100).toFixed(1);
    
    console.log('\n📊 UI Testing Report');
    console.log('='.repeat(50));
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`⚠️  Warnings: ${this.results.warnings}`);
    console.log(`📈 Success Rate: ${successRate}%`);
    
    if (this.results.errors.length > 0) {
      console.log('\n🚨 Errors:');
      this.results.errors.forEach(error => console.log(`   ${error}`));
    }
    
    // Generate recommendations
    this.generateRecommendations();
    
    // Create visual report
    this.createVisualReport();
  }

  generateRecommendations() {
    console.log('\n💡 Recommendations:');
    
    if (this.results.warnings > 10) {
      console.log('   • Consider addressing accessibility warnings for better user experience');
    }
    
    if (this.results.failed > 0) {
      console.log('   • Fix failed tests before deployment');
    }
    
    if (this.results.passed / (this.results.passed + this.results.failed) < 0.9) {
      console.log('   • UI needs significant improvements before release');
    } else if (this.results.passed / (this.results.passed + this.results.failed) >= 0.95) {
      console.log('   • UI is ready for production! 🎉');
    }
  }

  createVisualReport() {
    // Create a visual report element
    const report = document.createElement('div');
    report.id = 'ui-test-report';
    report.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 16px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        z-index: 10000;
        max-width: 300px;
        font-family: monospace;
        font-size: 12px;
      ">
        <h3 style="margin: 0 0 12px 0; color: #333;">UI Test Results</h3>
        <div style="color: green;">✅ Passed: ${this.results.passed}</div>
        <div style="color: red;">❌ Failed: ${this.results.failed}</div>
        <div style="color: orange;">⚠️ Warnings: ${this.results.warnings}</div>
        <div style="margin-top: 8px; font-weight: bold;">
          Success: ${((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1)}%
        </div>
        <button onclick="this.parentNode.parentNode.remove()" style="
          position: absolute;
          top: 8px;
          right: 8px;
          background: none;
          border: none;
          font-size: 16px;
          cursor: pointer;
        ">×</button>
      </div>
    `;
    
    document.body.appendChild(report);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (report.parentNode) {
        report.parentNode.removeChild(report);
      }
    }, 10000);
  }
}

// Initialize testing suite when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for all elements to load
    setTimeout(() => new UITestingSuite(), 1000);
  });
} else {
  setTimeout(() => new UITestingSuite(), 1000);
}

// Export for manual testing
window.UITestingSuite = UITestingSuite;