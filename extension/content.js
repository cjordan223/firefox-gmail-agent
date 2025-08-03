// Gmail Email Tracker Content Script
class GmailEmailTracker {
  constructor() {
    this.observer = null;
    this.captureButton = null;
    this.lastInjectionTime = 0;
    this.injectionThrottle = 1000; // 1 second throttle
    this.isInjecting = false;
    this.currentEmailId = null;
    this.init();
  }

  init() {
    // Wait for Gmail to load
    this.waitForGmail();
    
    // Listen for URL changes (Gmail uses pushState for navigation)
    this.setupUrlChangeListener();
  }

  waitForGmail() {
    const checkGmail = () => {
      const gmailContainer = document.querySelector('[role="main"]');
      if (gmailContainer) {
        this.setupObserver();
        this.injectCaptureButton();
      } else {
        setTimeout(checkGmail, 1000);
      }
    };
    checkGmail();
  }

  setupObserver() {
    // Only setup observer once
    if (this.observer) {
      this.observer.disconnect();
    }

    // Use a more efficient observer with throttling
    let timeoutId = null;
    this.observer = new MutationObserver((mutations) => {
      // Only process if we're not already injecting
      if (this.isInjecting) return;
      
      // Check if we're viewing a different email
      const newEmailId = this.getCurrentEmailId();
      if (newEmailId !== this.currentEmailId) {
        this.currentEmailId = newEmailId;
        // Clear any existing buttons when switching emails
        this.removeAllCaptureButtons();
        
        // Throttle the injection to prevent excessive calls
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        
        timeoutId = setTimeout(() => {
          // Only inject if we're not already injecting and enough time has passed
          const now = Date.now();
          if (!this.isInjecting && (now - this.lastInjectionTime) > this.injectionThrottle) {
            this.injectCaptureButton();
          }
        }, 200); // Increased debounce to 200ms
      }
    });

    // Only observe specific areas that matter for email viewing
    const mainContent = document.querySelector('[role="main"]');
    if (mainContent) {
      this.observer.observe(mainContent, {
        childList: true,
        subtree: true,
        attributes: false, // Don't observe attribute changes
        characterData: false // Don't observe text changes
      });
    }
  }

  getCurrentEmailId() {
    // Extract email ID from URL or content to detect email changes
    const urlParams = new URLSearchParams(window.location.search);
    let messageId = urlParams.get('th');
    
    if (!messageId && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
      messageId = hashParams.get('th');
    }
    
    if (!messageId) {
      const urlMatch = window.location.href.match(/[?&]th=([^&]+)/);
      messageId = urlMatch ? urlMatch[1] : null;
    }
    
    // Fallback: use subject line as identifier
    if (!messageId) {
      const subject = this.extractSubject();
      if (subject) {
        messageId = btoa(subject).substring(0, 20);
      }
    }
    
    return messageId || 'unknown';
  }

  removeAllCaptureButtons() {
    // Remove all existing capture buttons
    const existingButtons = document.querySelectorAll('.gmail-tracker-capture-btn');
    existingButtons.forEach(button => {
      if (button.parentNode) {
        button.parentNode.removeChild(button);
      }
    });
  }

  setupUrlChangeListener() {
    // Listen for Gmail's pushState navigation
    let currentUrl = window.location.href;
    
    const checkUrlChange = () => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        // URL changed, clear buttons and re-inject
        this.removeAllCaptureButtons();
        this.currentEmailId = null;
        
        // Wait a bit for Gmail to update the DOM
        setTimeout(() => {
          this.injectCaptureButton();
        }, 500);
      }
    };
    
    // Check for URL changes periodically
    setInterval(checkUrlChange, 1000);
    
    // Also listen for popstate events
    window.addEventListener('popstate', () => {
      setTimeout(() => {
        this.removeAllCaptureButtons();
        this.currentEmailId = null;
        this.injectCaptureButton();
      }, 500);
    });
  }

  injectCaptureButton() {
    // Prevent multiple simultaneous injections
    if (this.isInjecting) return;
    
    this.isInjecting = true;
    this.lastInjectionTime = Date.now();

    try {
      // Check if we're viewing an individual email
      const emailView = document.querySelector('[role="main"]');
      if (!emailView) {
        this.isInjecting = false;
        return;
      }

      // Look for Gmail's email content area
      const emailContent = document.querySelector('.adn');
      if (!emailContent) {
        this.isInjecting = false;
        return;
      }

      // Remove any existing buttons first
      this.removeAllCaptureButtons();

      // Create capture button
      this.createCaptureButton(emailContent);
    } finally {
      this.isInjecting = false;
    }
  }

  createCaptureButton(emailContent) {
    const button = document.createElement('button');
    button.textContent = ' 📧 Capture to Tracker';
    button.className = 'gmail-tracker-capture-btn';
    button.id = 'gmail-tracker-capture-btn-' + Date.now(); // Unique ID
    button.style.cssText = `
      background: linear-gradient(135deg, #1a73e8, #1557b0);
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 20px;
      font-family: 'Google Sans', Roboto, Arial, sans-serif;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(26, 115, 232, 0.3);
      transition: all 0.2s ease;
      margin-left: 8px;
      z-index: 1000;
      position: relative;
    `;

    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-1px)';
      button.style.boxShadow = '0 4px 12px rgba(26, 115, 232, 0.4)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = '0 2px 8px rgba(26, 115, 232, 0.3)';
    });

    button.addEventListener('click', async (event) => {
      // Add debug mode - press Ctrl+Shift+D to enable
      if (event.ctrlKey && event.shiftKey) {
        this.debugGmailStructure();
        return;
      }
      
      await this.captureEmail();
    });

    // Insert button near Gmail's action buttons
    const actionBar = emailContent.querySelector('.iH > div') || 
                     emailContent.querySelector('[role="toolbar"]') ||
                     emailContent.querySelector('.adn > div:first-child') ||
                     emailContent.querySelector('.h7');
    
    if (actionBar) {
      // Check if button already exists in this action bar
      const existingButton = actionBar.querySelector('.gmail-tracker-capture-btn');
      if (!existingButton) {
        actionBar.appendChild(button);
      }
    } else {
      // Fallback: insert at the top of email content
      const existingButton = emailContent.querySelector('.gmail-tracker-capture-btn');
      if (!existingButton) {
        emailContent.insertBefore(button, emailContent.firstChild);
      }
    }

    return button;
  }

  debugGmailStructure() {
    console.log('=== GMAIL DOM DEBUG MODE ===');
    console.log('Current URL:', window.location.href);
    console.log('Page title:', document.title);
    
    // Test optimized email data extraction
    console.log('--- TESTING OPTIMIZED EMAIL EXTRACTION ---');
    const mainContent = document.querySelector('[role="main"]');
    if (mainContent) {
      const emailData = this.extractEmailDataFromDOM(mainContent);
      console.log('Optimized extraction results:', emailData);
    } else {
      console.log('No main content found');
    }
    
    // Test legacy extraction methods
    console.log('--- TESTING LEGACY EXTRACTION ---');
    const testSubject = this.extractSubject();
    const testSender = this.extractSender();
    const testTimestamp = this.extractTimestamp();
    const testBody = this.extractBody();
    
    console.log('Legacy test results:', {
      subject: testSubject,
      sender: testSender,
      timestamp: testTimestamp,
      bodyLength: testBody ? testBody.length : 0
    });
    
    // Quick DOM structure overview (limited to prevent performance issues)
    console.log('--- DOM STRUCTURE OVERVIEW ---');
    const mainAreas = document.querySelectorAll('[role="main"]');
    console.log('Main content areas:', mainAreas.length);
    
    if (mainAreas.length > 0) {
      const mainArea = mainAreas[0];
      console.log('Main area classes:', mainArea.className);
      console.log('Main area children:', mainArea.children.length);
      
      // Sample a few key elements
      const h2s = mainArea.querySelectorAll('h2');
      const gmailElements = mainArea.querySelectorAll('.hP, .gD, .a3s, .ii');
      
      console.log('H2 elements in main area:', h2s.length);
      console.log('Gmail class elements in main area:', gmailElements.length);
      
      // Show first few elements
      h2s.forEach((h2, i) => {
        if (i < 3) { // Limit to first 3
          console.log(`H2 ${i}:`, h2.textContent.trim().substring(0, 50));
        }
      });
    }
    
    console.log('=== END DEBUG MODE ===');
    this.showNotification('🔍 Debug info logged to console (Ctrl+Shift+I)', 'info');
  }

  async captureEmail() {
    try {
      const emailData = this.extractEmailData();
      
      if (!emailData) {
        this.showNotification('No email data found', 'error');
        return;
      }

      console.log('Attempting to capture email:', emailData);

      // Send message to background script to handle the API request
      const response = await browser.runtime.sendMessage({
        type: 'capture_email',
        emailData: emailData
      });

      console.log('Background script response:', response);

      if (response.success) {
        console.log('Capture successful:', response.data);
        this.showNotification('✅ Email captured successfully! Check your dashboard.', 'success');
      } else {
        console.error('Capture failed:', response.error);
        
        let errorMessage = 'Failed to capture email. ';
        if (response.error.includes('already captured')) {
          errorMessage = '📧 This email was already captured!';
        } else if (response.error.includes('NetworkError')) {
          errorMessage += 'Cannot connect to backend. Is it running on http://localhost:8000?';
        } else {
          errorMessage += response.error;
        }
        
        this.showNotification(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Failed to capture email:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      let errorMessage = 'Failed to capture email. ';
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage += 'Cannot connect to backend. Is it running on http://localhost:8000?';
      } else if (error.message.includes('CORS')) {
        errorMessage += 'CORS error. Check backend CORS settings.';
      } else {
        errorMessage += error.message;
      }
      
      this.showNotification(errorMessage, 'error');
    }
  }

  extractEmailData() {
    try {
      console.log('Starting email data extraction...');
      
      // Cache DOM queries to avoid repeated lookups
      const mainContent = document.querySelector('[role="main"]');
      if (!mainContent) {
        console.error('No main content found');
        return null;
      }
      
      // Extract Gmail message ID from URL - try multiple methods
      let messageId = null;
      
      // Method 1: Try URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      messageId = urlParams.get('th');
      
      // Method 2: Try URL hash parameters
      if (!messageId && window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
        messageId = hashParams.get('th');
      }
      
      // Method 3: Try regex extraction from URL
      if (!messageId) {
        const urlMatch = window.location.href.match(/[?&]th=([^&]+)/);
        messageId = urlMatch ? urlMatch[1] : null;
      }
      
      // Extract email data efficiently using cached DOM
      const emailData = this.extractEmailDataFromDOM(mainContent);
      
      // Method 4: Generate a unique ID based on content if no message ID found
      if (!messageId) {
        const subject = emailData.subject || 'No Subject';
        const sender = emailData.sender || 'Unknown Sender';
        const timestamp = emailData.timestamp || new Date().toISOString();
        
        // Create a hash-like ID from content
        messageId = btoa(`${subject}-${sender}-${timestamp}`).replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
      }

      console.log('Extracted data:', {
        messageId,
        ...emailData,
        bodyLength: emailData.body ? emailData.body.length : 0
      });

      if (!emailData.subject && !emailData.sender && !emailData.body) {
        console.error('No email data found - Gmail interface may have changed');
        return null;
      }

      return {
        message_id: messageId,
        subject: emailData.subject || 'No Subject',
        sender: emailData.sender || 'Unknown Sender',
        timestamp: emailData.timestamp || new Date().toISOString(),
        body: emailData.body || 'No body content',
        url: window.location.href,
        captured_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error extracting email data:', error);
      return null;
    }
  }

  extractEmailDataFromDOM(mainContent) {
    // Single pass through DOM to extract all data efficiently
    const data = {
      subject: null,
      sender: null,
      timestamp: null,
      body: null
    };

    // Use a single query to get all potential elements
    const allElements = mainContent.querySelectorAll('h2, .gD, .yW, .xW, .xY, .a3s, .ii, [data-email], [aria-label*="email"], [title*="@"]');
    
    for (const element of allElements) {
      const text = element.textContent.trim();
      if (!text) continue;

      // Determine element type based on class, attributes, or content
      const className = element.className;
      const tagName = element.tagName.toLowerCase();
      
      // Subject detection
      if (!data.subject && (tagName === 'h2' || className.includes('hP'))) {
        if (text.length > 0 && text.length < 200) {
          data.subject = text;
        }
      }
      
      // Sender detection
      if (!data.sender && (className.includes('gD') || className.includes('yW') || text.includes('@'))) {
        if (text.includes('@') && text.length < 100) {
          data.sender = text;
        }
      }
      
      // Timestamp detection
      if (!data.timestamp && (className.includes('xW') || className.includes('xY'))) {
        if (text.length < 50) {
          data.timestamp = text;
        }
      }
      
      // Body detection
      if (!data.body && (className.includes('a3s') || className.includes('ii'))) {
        if (text.length > 100) {
          data.body = text;
        }
      }
    }

    // Fallback for body if not found in specific elements
    if (!data.body) {
      const bodyElements = mainContent.querySelectorAll('*');
      let bestBody = null;
      let maxLength = 0;

      for (const element of bodyElements) {
        const text = element.textContent.trim();
        if (text && text.length > 200 && text.length > maxLength) {
          const childCount = element.children.length;
          if (childCount < 50) {
            const isLikelyBody = !element.closest('nav') && 
                                !element.closest('header') && 
                                !element.closest('footer') &&
                                !element.closest('[role="navigation"]') &&
                                !element.closest('[role="banner"]') &&
                                !element.closest('[role="complementary"]');
            
            if (isLikelyBody) {
              bestBody = text;
              maxLength = text.length;
            }
          }
        }
      }
      
      if (bestBody) {
        data.body = bestBody;
      }
    }

    return data;
  }

  // Legacy extraction methods - kept for debug mode compatibility
  extractSubject() {
    const mainContent = document.querySelector('[role="main"]');
    if (!mainContent) return null;
    
    const h2s = mainContent.querySelectorAll('h2');
    for (const h2 of h2s) {
      const text = h2.textContent.trim();
      if (text && text.length > 0 && text.length < 200) {
        return text;
      }
    }
    return null;
  }

  extractSender() {
    const mainContent = document.querySelector('[role="main"]');
    if (!mainContent) return null;
    
    const elements = mainContent.querySelectorAll('.gD, .yW, [data-email], [aria-label*="email"]');
    for (const element of elements) {
      const text = element.textContent.trim();
      if (text && text.includes('@') && text.length < 100) {
        return text;
      }
    }
    return null;
  }

  extractTimestamp() {
    const mainContent = document.querySelector('[role="main"]');
    if (!mainContent) return null;
    
    const elements = mainContent.querySelectorAll('.xW, .xY, [data-timestamp]');
    for (const element of elements) {
      const text = element.textContent.trim();
      if (text && text.length < 50) {
        return text;
      }
    }
    return new Date().toISOString();
  }

  extractBody() {
    const mainContent = document.querySelector('[role="main"]');
    if (!mainContent) return null;
    
    const elements = mainContent.querySelectorAll('.a3s, .ii');
    for (const element of elements) {
      const text = element.textContent.trim();
      if (text && text.length > 100) {
        return text;
      }
    }
    return null;
  }

  extractMessageIdFromUrl() {
    // Fallback method to extract message ID from URL
    const match = window.location.href.match(/[?&]th=([^&]+)/);
    return match ? match[1] : null;
  }

  showNotification(message, type = 'info') {
    // Remove any existing notifications first
    const existingNotifications = document.querySelectorAll('.gmail-tracker-notification');
    existingNotifications.forEach(notification => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    });

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `gmail-tracker-notification gmail-tracker-${type}`;
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 16px;">
          ${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
        </span>
        <span>${message}</span>
      </div>
    `;

    // Add to page
    document.body.appendChild(notification);

    // Add entrance animation
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(-20px)';
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateY(0)';
    }, 10);

    // Remove after 5 seconds (longer for better visibility)
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }
    }, 5000);
  }
}

// Initialize the tracker when the script loads
const tracker = new GmailEmailTracker();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (tracker.observer) {
    tracker.observer.disconnect();
  }
  tracker.removeAllCaptureButtons();
}); 