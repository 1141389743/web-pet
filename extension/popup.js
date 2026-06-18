document.getElementById('enabled').addEventListener('change', (e) => {
  chrome.runtime.sendMessage({ type: 'TOGGLE_PET' });
});

document.getElementById('hide-btn').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { type: 'TOGGLE_PET', enabled: false });
  });
});

document.getElementById('reset-btn').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { type: 'RESET_POSITION' });
  });
});

document.getElementById('settings-btn').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { type: 'OPEN_SETTINGS' });
  });
});
