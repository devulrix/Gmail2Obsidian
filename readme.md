# Gmail → Obsidian (Plain Markdown Export)

A minimal Chrome MV3 extension that exports the **currently open Gmail message or thread** to clean Markdown and saves it via Chrome’s **Save As** dialog—perfect for dropping into an Obsidian vault.

- ✅ Subject, sender, timestamp, `source_url`
- ✅ Participants (YAML list)
- ✅ Line breaks after DIV/SPAN so text doesn’t run together
- ✅ Thread-aware (controls to include/trim history)
- ✅ All processing runs locally in your browser

---

## Why

Email is often where decisions and info live. This extension turns an open Gmail message (or thread) into a tidy Markdown note you can file in your second brain.

---

## Features

- **One‑click export.** Click the toolbar button on any Gmail message/page.
- **Frontmatter.** YAML properties (title, source, exported, from, date, participants).
- **Thread controls.**
  - **Include hidden quoted history** (Gmail’s “…” trimmed blocks) — optional
  - **Strip `On … wrote:` tails** — optional (keeps only the new part of each message)
  - **Limit to last N messages** — optional (0 = all)
- **Robust extraction.** Targets Gmail’s stable body containers and walks the DOM, inserting sensible line breaks (paragraphs, spans, `<br>`).
- **Resilient.** If Gmail tweaks CSS, you can adjust selectors in Options.

---

## Install (unpacked)

1. Clone or download this repo.
2. In Chrome, open `chrome://extensions`.
3. Enable **Developer mode** (top‑right).
4. Click **Load unpacked** and select the project folder.
5. (Optional) Pin the extension icon to the toolbar.

> **Icons:** If you don’t have `images/icon_16.png` and `images/icon_128.png`, remove the `icons` and `action.default_icon` blocks from `manifest.json` or add your own PNGs.

---

## Using It

1. Open **Gmail** in Chrome.
2. Open a message or a thread.
3. Click the **Gmail → Obsidian** toolbar button.
4. Choose a save location (Chrome always asks; see *Why no absolute path?*).
5. The file name defaults to  
   `YYYY-MM-DD - <Subject>.md`.

### Capturing sub‑emails in a thread (important)

Gmail collapses earlier messages and quoted history behind UI controls.  
If you want **everything**, **manually expand** the messages inside the thread (and any “three dots” trimmed content) **before** clicking the export button.  
The extractor will then capture those expanded parts in order.

You can also tune history behavior under **Options → Thread controls**.

---

## Options

Open the extension’s Options page (right‑click the toolbar icon → **Options**) to set:

- **Gmail body selector(s)**  
  Defaults to `.a3s.aiL, .a3s.ajx`. Multiple selectors allowed, comma‑separated.
- **Subject selector**  
  Defaults to `.hP`.
- **Include YAML frontmatter**  
  On by default. Great for Obsidian Properties/Dataview.
- **Include hidden quoted history**  
  Off by default. When on, includes Gmail’s trimmed “…” blocks that are normally hidden.
- **Strip “On … wrote:”**  
  On by default. Removes repeated quoted tails so each message is mostly the *new* content.
- **Limit to last N messages**  
  0 = all. Useful for keeping exports short.

---

## What gets exported

Example frontmatter (when enabled):

```yaml
---
title: "This is the Subject"
source: "Gmail"
source_url: "https://mail.google.com/…"
exported: "2025-09-10T18:12:10.274Z"
from_name: "Gideon Marken"
from_email: "gideonmarken@gmail.com"
date_local: "Sep 10, 2025, 10:24 AM"
date_iso: "2025-09-10T17:24:00.000Z"
participants:
  - "Gideon Marken <gideonmarken@gmail.com>"
  - "Simon Golden <simong@yourgoldenstories.org>"
---
```

Body text respects paragraphs and inserts line breaks so inline spans don’t run together.

---

## Why no absolute path?

Chrome’s `downloads.download` **does not allow absolute paths** from extensions (security restriction).  
The extension always shows a **Save As** dialog. Tip: add a **shortcut/alias** to your Obsidian vault **inside your Downloads** folder to make saving two clicks.

---

## Troubleshooting

- **“Couldn’t extract the email body.”**  
  Make sure a message is open; if it’s a thread, expand the messages you want included. Check **Options → selectors** if Gmail’s UI changed.

- **“Downloads API error: Invalid filename.”**  
  You tried to save to an absolute path or the filename contained illegal characters. The extension sanitizes the subject and always uses Save As; just pick a folder.

- **It missed parts of a thread.**  
  Expand those messages and the “three dots” trimmed areas, then export. Or enable **Include hidden quoted history** in Options.

- **Inline text is jammed together.**  
  The extractor converts Gmail’s DIV/SPAN layout to paragraphs/lines; if a specific tag in your email needs custom handling (e.g., tables), open an issue with a small sample.

---

## Privacy & Security

- Runs **entirely in your browser**; no external servers.
- Permissions:
  - `activeTab`, `scripting` – injects the extractor on Gmail tabs
  - `downloads` – saves the Markdown file
  - `storage` – saves Options
  - `notifications` – basic success/error notifications
  - `host_permissions: https://mail.google.com/*` – restricts script injection to Gmail
- Images are skipped by design (export is text‑only).

---

## Design Trade‑offs

**Pros**
- Simple, local, transparent; easy to tweak.
- Clean Markdown with reliable frontmatter.
- Thread controls let you tune “too little vs. too much” history.

**Cons**
- Gmail UI classes can change; you may need to adjust selectors.
- Threads are inherently noisy; to capture *everything* you may need to manually expand messages or enable quoted history.
- Tables/complex HTML are flattened to text.

**Assessment**  
For a “capture now, curate later” workflow, the defaults (strip wrote, don’t include hidden history) keep exports readable. When you need a full archive, enable “Include hidden quoted history” and/or expand the thread before exporting.

---

## Development Notes

- **Manifest v3** service worker (no `alert` in worker; notifications used instead).
- Content script exposes `window.__gmailToMd.extractPlain(opts)`.
- Filename sanitized: `YYYY-MM-DD - <Subject>.md`.
- Main files:
  - `manifest.json`
  - `service_worker.js`
  - `content.js`
  - `options.html`, `options.js`
  - `images/` (icons, optional)

---

## Roadmap / Ideas

- Optional table handling (pipe tables when feasible).
- Toggle to export each message as its own section with per‑message headers.
- Obsidian URI support (`obsidian://new?…`) as an alt save path for advanced users.
- Keyboard shortcut.

---

## Contributing

PRs welcome! If you hit a Gmail layout that doesn’t export well, open an issue with:
- a redacted screenshot,
- the problematic HTML snippet (or class names around the message area),
- your Options (selectors + thread controls).

---

## License

MIT
