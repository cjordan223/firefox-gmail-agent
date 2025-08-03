// Background script for Gmail Email Tracker (Manifest v2)
// This handles API requests to avoid content script restrictions

console.log('Gmail Email Tracker background script loaded');

// Listen for installation
browser.runtime.onInstalled.addListener(() => {
  console.log('Gmail Email Tracker extension installed');
});

// Handle messages from content script
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);
  
  if (message.type === 'capture_email') {
    // Make the API request from background script
    fetch('http://localhost:8000/capture', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message.emailData)
    })
    .then(response => {
      if (response.ok) {
        return response.json();
      } else {
        return response.text().then(text => {
          throw new Error(`HTTP ${response.status}: ${text}`);
        });
      }
    })
    .then(result => {
      console.log('Capture successful:', result);
      sendResponse({ success: true, data: result });
    })
    .catch(error => {
      console.error('Capture failed:', error);
      sendResponse({ success: false, error: error.message });
    });
    
    return true; // Keep the message channel open for async response
  }
  
  sendResponse({ status: 'received' });
}); 