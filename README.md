# YT Focus Filter (Working Title)

A lightweight Chrome extension that lets you control which YouTube videos you *actually* see by filtering your feed by:

- Minimum view count  
- Maximum video age (in days)

It does **not** change YouTube’s recommendation engine. YouTube still decides what to recommend. The extension just hides anything that does not meet your filters in the UI.

---

## Why

YouTube’s home and Explore feeds are powerful, but:

- You cannot filter by views or freshness.
- You get a mix of low signal and high signal content.
- Tools like vidIQ give some of this functionality, but focus on search and are often paywalled.

This extension is meant to be a simple “quality gate” in front of your existing recommendations so that you can:

- See only fresh content above a certain traction level.
- Tune your feed to your own definition of “signal”.

---

## Core Features

- Set a **minimum views** threshold  
- Set a **maximum age (in days)**  
- Apply filters on:
  - YouTube home feed (primary surface)
  - Optionally search results and related videos (MVP can include or follow this)
- Settings are stored in `chrome.storage.sync` so they persist across sessions
- Filters are applied automatically using a `MutationObserver` as you scroll

---

## How It Works

1. YouTube loads your normal recommendations.
2. A content script runs on `youtube.com` and:
   - Finds each video card (home feed, search results, etc).
   - Reads the metadata line, for example: `123K views • 3 days ago`.
   - Parses:
     - `viewCount` from the “views” text.
     - `ageInDays` from the “X [unit] ago” text.
3. If a video does not satisfy your filters:
   - `viewCount < minViews`  
   - or `ageInDays > maxAgeDays`
   then the extension hides that card with CSS.

If parsing fails (for example “Live now”), the extension leaves the card visible in order to fail safe.

---

## Screens and UX

### Extension Popup

When you click the extension icon you see:

- Input: **Minimum views**  
  - Example: `50000` for 50k views  
- Input: **Maximum age (days)**  
  - Example: `7` for last week, `30` for last month  
- Button: **Save and apply**

Behavior:

- On open, the popup loads the current settings from `chrome.storage.sync`.
- On Save:
  - Settings are stored.
  - A message is sent to the active YouTube tab so the new filters apply immediately without reload.

### On YouTube

- Home feed: `ytd-rich-item-renderer`
- Search results: `ytd-video-renderer`
- Optional: grid and compact renderers, for subscriptions and “Up next”

As new videos are loaded (infinite scroll, navigation inside YouTube’s SPA), the MutationObserver in the content script picks them up and applies the same filter logic.

---

## Project Structure

Suggested repo layout:

```text
yt-focus-filter/
  manifest.json
  content.js
  popup.html
  popup.js
  icons/
    icon128.png
  README.md
