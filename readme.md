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
from_email: "gideonmarken@it.com"
date_local: "Sep 10, 2025, 10:24 AM"
date_iso: "2025-09-10T17:24:00.000Z"
participants:
  - "Gideon Marken <gideonmarken@it.com>"
  - "Jerry Garcia <jerry@gd.com>"
---
```

Body text respects paragraphs and inserts line breaks so inline spans don’t run together.

---

## Troubleshooting

- **“Couldn’t extract all of the email body in an email thread.”**  
  Make sure a message is open; if it’s a thread, expand the messages you want included.


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

## License

MIT
