# AGENTS instructions for Codex

## Project

This repo is a Chrome extension called "YT Focus Filter".

Goal:  
Hide YouTube videos in the UI that do not meet user defined filters:
- Minimum views (view count)  
- Maximum age in days  

We do NOT modify YouTube's backend recommendation engine. We only run in the browser as a content script and hide DOM elements.

## Tech stack and constraints

- Manifest v3 Chrome extension.
- Plain JavaScript and simple HTML/CSS.
- Keep things simple, minimal dependencies.
- Store settings with `chrome.storage.sync`.

## Desired behavior

1. Content script runs on `https://www.youtube.com/*`.
2. It finds video cards in:
   - Home feed: `ytd-rich-item-renderer`
   - Search results: `ytd-video-renderer`
   - Optional: `ytd-grid-video-renderer`, `ytd-compact-video-renderer`
3. For each card:
   - Parse "X views" from the metadata line.
   - Parse "Y [time unit] ago" to estimate age in days.
   - If `views < minViews` or `ageDays > maxAgeDays`, hide the card (`display: none`).
   - If parsing fails, do NOT hide the card.
4. Use a `MutationObserver` on `document.body` to process newly added cards.

## Popup UI

- Simple popup with two inputs:
  - `minViews` (number)
  - `maxAgeDays` (number)
- Load current values from `chrome.storage.sync`.
- On save:
  - Persist values.
  - Send a message to the content script in the active YouTube tab so it can re-filter immediately.

## File structure

Target structure:

- `manifest.json`
- `content.js`
- `popup.html`
- `popup.js`
- `icons/icon128.png` (placeholder is fine)

## Coding style

- Add short comments where logic is non obvious.
- Handle edge cases gracefully, prefer failing safe (show video instead of hiding).
- Avoid unnecessary abstractions. This is a small project.

## Tasks

When asked, please:

1. Create or update the extension files according to this spec.
2. Keep code focused on the filter logic and popup.
3. Suggest any small improvements if they make the UX better.
