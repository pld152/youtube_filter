const DEFAULT_SETTINGS = {
  minViews: 50000,
  maxAgeDays: 30,
};

const minViewsInput = document.getElementById('minViews');
const maxAgeDaysInput = document.getElementById('maxAgeDays');
const saveBtn = document.getElementById('saveBtn');
const statusEl = document.getElementById('status');

function showStatus(message) {
  statusEl.textContent = message;
  setTimeout(() => {
    statusEl.textContent = '';
  }, 2000);
}

function loadSettings() {
  chrome.storage.sync.get(DEFAULT_SETTINGS, (items) => {
    minViewsInput.value = items.minViews;
    maxAgeDaysInput.value = items.maxAgeDays;
  });
}

function getValidatedSettings() {
  const minViews = Number(minViewsInput.value);
  const maxAgeDays = Number(maxAgeDaysInput.value);

  return {
    minViews: Number.isFinite(minViews) && minViews >= 0 ? minViews : DEFAULT_SETTINGS.minViews,
    maxAgeDays: Number.isFinite(maxAgeDays) && maxAgeDays > 0 ? maxAgeDays : DEFAULT_SETTINGS.maxAgeDays,
  };
}

function sendUpdateToActiveTab(settings) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    if (!activeTab || !activeTab.id || !activeTab.url || !activeTab.url.includes('youtube.com')) return;

    chrome.tabs.sendMessage(activeTab.id, {
      type: 'YT_FILTER_UPDATE',
      payload: settings,
    });
  });
}

saveBtn.addEventListener('click', () => {
  const settings = getValidatedSettings();

  chrome.storage.sync.set(settings, () => {
    showStatus('Saved');
    sendUpdateToActiveTab(settings);
  });
});

loadSettings();
