# Gmail → Obsidian (Plain Markdown Export)

A Chrome Manifest V3 extension that exports the text from the **currently open Gmail message or anexpanded thread of messages** to clean Markdown and saves it directly into your Obsidian vault (clipboard-first, via `obsidian://`), or falls back to file download when necessary.

- ✅ Subject, sender, timestamp, `source_url`
- ✅ Participants (YAML list)
- ✅ Line breaks after DIV/SPAN so text doesn’t run together
- ✅ Supports multiple messages in a thread (only the parts you expand)
- ✅ All processing runs locally in your browser

---

## Why

Email often contains important decisions and information. This extension turns an open Gmail message (or thread) into a tidy Markdown note you can file in your second brain. The current Obsidian plugin, Web Clipper, does not support Gmail. This extension fills that gap.

---

## Features

- **Toolbar popup.** Manage settings and export right from the extension’s popup (no new tab for settings).
- **One-click export.** Click **Export current email** in the popup.
- **Frontmatter.** YAML properties (title, source, exported, from, date, participants).
- **Thread support.** Exports any messages you manually expand inside a thread.
- **Last-N limit.** Optionally limit export to the last N messages (0 = all expanded).
- **Clipboard-first.** Sends Markdown to clipboard, then calls `obsidian://new?clipboard=true`, so notes appear directly in your vault without hitting URL length limits.
- **Fallbacks.** If clipboard fails, tries a `content=` URI; if too large, saves as `.md` via Chrome Downloads.

---

## Install (unpacked)

1. Clone or download this repo.
2. In Chrome, open `chrome://extensions`.
3. Enable **Developer mode** (top-right).
4. Click **Load unpacked** and select the project folder.
5. Pin the extension icon to your toolbar.

---

## Using It

1. Open **Gmail** in Chrome.
2. Open a message or a thread.
3. Expand any messages you want included (including hidden “three dots” sections).
4. Click the extension icon → **Export current email**.
5. A new note appears in your Obsidian vault (if clipboard/URI succeeds), or Chrome prompts you to save the file.

The file name defaults to  
`YYYY-MM-DD - <Subject>.md`.

---

## Popup Options

- **Vault name** – must match your Obsidian vault name. Open the vault once in the Obsidian app so it’s registered.
- **Default note folder** – optional; folder inside the vault (e.g. `Email` or `Clips/Gmail`).
- **Gmail body selector(s)** – defaults to `.a3s.aiL, .a3s.ajx`. We expose these as a setting just in case Gmail changes their selectors.
- **Gmail Subject selector** – defaults to `.hP`.
- **Include YAML frontmatter** – on by default. This creates a meta section at the top of the note to provide context.
- **Limit to last N messages** – 0 = all expanded messages.

---

## What gets exported

Example frontmatter:

```yaml
---
title: "This is the Subject"
source: "Gmail"
source_url: "https://mail.google.com/…"
exported: "2025-09-10T18:12:10.274Z"
from_name: "Gideon Marken"
from_email: "gideonmarken@it.com"
date_local: "Sep 10, 2025, 10:24 AM"
date_iso: "2025-09-10T17:24:00.000Z"
participants:
  - "Gideon Marken <gideonmarken@it.com>"
  - "Jerry Garcia <jerry@gd.com>"
---

This is the body of the email.
```

Developed by: 
Gideon Marken
https://www.linkedin.com/in/gideonmarken/
https://github.com/Emaj7th
https://sonicwallpaper.bandcamp.com/
