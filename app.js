const statusText = document.querySelector('#api-status');
const statusDot = document.querySelector('#status-dot');

async function checkApiStatus() {
  if (!statusText || !statusDot) {
    return;
  }

  try {
    const response = await fetch('/api/health');
    if (!response.ok) {
      throw new Error('API indisponible');
    }

    statusText.textContent = 'Service opérationnel';
    statusDot.parentElement.classList.add('online');
  } catch {
    statusText.textContent = 'Service hors ligne - démarrez le backend';
  }
}

checkApiStatus();
