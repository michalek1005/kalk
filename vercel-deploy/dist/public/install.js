// PWA Installation prompt for mobile devices
let deferredPrompt;
let installButton;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  showInstallButton();
});

function showInstallButton() {
  // Create install button if it doesn't exist
  if (!installButton) {
    installButton = document.createElement('button');
    installButton.textContent = 'Zainstaluj aplikację';
    installButton.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #22c55e;
      color: white;
      border: none;
      padding: 12px 20px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      cursor: pointer;
      z-index: 1000;
      display: none;
    `;
    
    installButton.addEventListener('click', installApp);
    document.body.appendChild(installButton);
  }
  
  // Show button only on mobile
  if (window.innerWidth <= 768) {
    installButton.style.display = 'block';
  }
}

async function installApp() {
  if (!deferredPrompt) return;
  
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  
  if (outcome === 'accepted') {
    console.log('PWA installed');
    installButton.style.display = 'none';
  }
  
  deferredPrompt = null;
}

// Hide install button if app is already installed
window.addEventListener('appinstalled', () => {
  if (installButton) {
    installButton.style.display = 'none';
  }
  deferredPrompt = null;
});

// Show/hide install button based on screen size
window.addEventListener('resize', () => {
  if (installButton) {
    if (window.innerWidth <= 768 && deferredPrompt) {
      installButton.style.display = 'block';
    } else {
      installButton.style.display = 'none';
    }
  }
});