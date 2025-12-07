const DEFAULT_SETTINGS = {
  minViews: 50000,
  maxAgeDays: 30,
};

// Simple logger to help verify the content script is running on YouTube pages
function log(...args) {
  console.log('[YT Focus Filter]', ...args);
}

const TARGET_SELECTORS = [
  'ytd-rich-item-renderer',
  'ytd-video-renderer',
  'ytd-grid-video-renderer',
  'ytd-compact-video-renderer',
];

let currentSettings = { ...DEFAULT_SETTINGS };

function parseViewCount(text) {
  const match = text.match(/([\d.,]+)\s*(K|M|B)?\s+views/i);
  if (!match) return null;
  const [, numberPart, suffix] = match;
  const normalized = parseFloat(numberPart.replace(/,/g, ''));
  if (Number.isNaN(normalized)) return null;

  const multipliers = {
    K: 1_000,
    M: 1_000_000,
    B: 1_000_000_000,
  };

  const multiplier = suffix ? multipliers[suffix.toUpperCase()] || 1 : 1;
  return normalized * multiplier;
}

function parseAgeDays(text) {
  const match = text.match(/(\d+)\s*(hour|day|week|month|year)s?\s+ago/i);
  if (!match) return null;
  const [, numberPart, unit] = match;
  const value = parseInt(numberPart, 10);
  if (Number.isNaN(value)) return null;

  const daysPerUnit = {
    hour: 1 / 24,
    day: 1,
    week: 7,
    month: 30,
    year: 365,
  };

  const multiplier = daysPerUnit[unit.toLowerCase()];
  if (!multiplier) return null;

  return value * multiplier;
}

function extractMetadataText(card) {
  const metadataItems = card.querySelectorAll('#metadata-line span, .inline-metadata-item');
  const parts = Array.from(metadataItems)
    .map((el) => el.textContent.trim())
    .filter(Boolean);

  if (parts.length === 0) return null;
  return parts.join(' • ');
}

function shouldHide(viewCount, ageDays) {
  return viewCount < currentSettings.minViews || ageDays > currentSettings.maxAgeDays;
}

function applyFilterToCard(card) {
  const metadataText = extractMetadataText(card);
  if (!metadataText) return;

  const viewCount = parseViewCount(metadataText);
  const ageDays = parseAgeDays(metadataText);

  if (viewCount === null || ageDays === null) return;

  if (shouldHide(viewCount, ageDays)) {
    card.style.display = 'none';
  } else {
    card.style.display = '';
  }
}

function findCardsInNode(node) {
  if (!(node instanceof Element)) return [];
  const matches = [];
  if (TARGET_SELECTORS.some((selector) => node.matches(selector))) {
    matches.push(node);
  }
  TARGET_SELECTORS.forEach((selector) => {
    matches.push(...node.querySelectorAll(selector));
  });
  return matches;
}

function applyFiltersToDocument() {
  log('Applying filters to document with settings', currentSettings);
  TARGET_SELECTORS.forEach((selector) => {
    document.querySelectorAll(selector).forEach(applyFilterToCard);
  });
}

function handleMutations(mutations) {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      findCardsInNode(node).forEach(applyFilterToCard);
    });
  });
}

function startObserver() {
  const observer = new MutationObserver(handleMutations);
  observer.observe(document.body, { childList: true, subtree: true });
}

function loadSettings() {
  chrome.storage.sync.get(DEFAULT_SETTINGS, (items) => {
    currentSettings = {
      minViews: Number(items.minViews) || DEFAULT_SETTINGS.minViews,
      maxAgeDays: Number(items.maxAgeDays) || DEFAULT_SETTINGS.maxAgeDays,
    };
    log('Loaded settings', currentSettings);
    applyFiltersToDocument();
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.type === 'YT_FILTER_UPDATE' && message.payload) {
    const { minViews, maxAgeDays } = message.payload;
    currentSettings = {
      minViews: Number(minViews) || DEFAULT_SETTINGS.minViews,
      maxAgeDays: Number(maxAgeDays) || DEFAULT_SETTINGS.maxAgeDays,
    };
    log('Received settings update', currentSettings);
    applyFiltersToDocument();
    sendResponse({ status: 'applied' });
  }
});

loadSettings();
startObserver();
log('Content script initialized');
