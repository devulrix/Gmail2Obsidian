// service_worker.js (MV3) — Clipboard-first Obsidian flow

// ---------- Helpers ----------
function storageGet() {
  return new Promise((resolve) => chrome.storage.sync.get(null, (cfg) => resolve(cfg || {})));
}
function storageMergeDefaults(DEFAULTS) {
  chrome.storage.sync.get(null, (cur) => {
    const patch = {};
    for (const k in DEFAULTS) if (cur[k] == null) patch[k] = DEFAULTS[k];
    if (Object.keys(patch).length) chrome.storage.sync.set(patch);
  });
}
function injectContent(tabId, files) {
  return chrome.scripting.executeScript({ target: { tabId }, files });
}
function evalInTab(tabId, func, args) {
  return chrome.scripting.executeScript({ target: { tabId }, func, args: args || [] });
}
function flashBadge(tabId, text, color, ms) {
  ms = typeof ms === "number" ? ms : 1200;
  try {
    chrome.action.setBadgeText({ tabId, text });
    if (color) chrome.action.setBadgeBackgroundColor({ tabId, color });
    if (ms > 0) setTimeout(() => chrome.action.setBadgeText({ tabId, text: "" }), ms);
  } catch {}
}
function notify(title, message) {
  try {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "images/icon_128.png",
      title: title || "Gmail → Obsidian",
      message: message || ""
    });
  } catch {}
}
function safeComponent(s) {
  return (s || "")
    .replace(/[\\/:*?"<>|]+/g, "_")
    .replace(/\u0000/g, "")
    .replace(/^\.+$/, "_")
    .replace(/[ \t]+$/g, "")
    .slice(0, 140);
}
function joinPath(folder, base) {
  if (!folder) return base;
  return folder.replace(/^\/+|\/+$/g, "") + "/" + base;
}
function buildObsidianURIClipboard(vault, filePath) {
  // Keep slashes and spaces raw in 'file'
  let uri = "obsidian://new?";
  const parts = [];
  if (vault) parts.push("vault=" + encodeURIComponent(vault));
  parts.push("file=" + encodeURIComponent(filePath).replace(/%2F/g, "/").replace(/%20/g, " "));
  parts.push("clipboard=true");
  uri += parts.join("&");
  return uri;
}
function buildObsidianURIContent(vault, filePath, encodedContent) {
  let uri = "obsidian://new?";
  const parts = [];
  if (vault) parts.push("vault=" + encodeURIComponent(vault));
  parts.push("file=" + encodeURIComponent(filePath).replace(/%2F/g, "/").replace(/%20/g, " "));
  parts.push("content=" + encodedContent);
  uri += parts.join("&");
  return uri;
}

function fallbackDownload(tabId, filename, content) {
  chrome.downloads.download(
    {
      url: "data:text/markdown;charset=utf-8," + encodeURIComponent(content),
      filename,
      saveAs: true
    },
    (downloadId) => {
      if (chrome.runtime.lastError || !downloadId) {
        console.error("Downloads API error:", chrome.runtime.lastError?.message || chrome.runtime.lastError);
        flashBadge(tabId, "!", "#d33", 1500);
        notify("Gmail → Obsidian", "Export failed. See extension errors for details.");
        return;
      }
      flashBadge(tabId, "✓", "#2ea44f", 1200);
    }
  );
}

// 8k is a conservative ceiling for many URI handlers. Clipboard path avoids this entirely.
const URI_SIZE_LIMIT = 8000;

// ---------- Defaults ----------
const DEFAULTS = {
  containerSelector: ".a3s.aiL, .a3s.ajx",
  subjectSelector: ".hP",
  frontmatter: true,
  includeQuotes: false,
  stripWrote: true,
  limitMessages: 0,
  vaultName: "",
  defaultNoteFolder: "Email"
};

// ---------- Install / Update ----------
chrome.runtime.onInstalled.addListener((details) => {
  storageMergeDefaults(DEFAULTS);
});

// ---------- Main action ----------
chrome.action.onClicked.addListener((tab) => {
  (async () => {
    if (!tab?.id) return;
    const tabId = tab.id;

    try {
      await injectContent(tabId, ["content.js"]);
      const cfg = Object.assign({}, DEFAULTS, await storageGet());

      // 1) Extract markdown in page
      const [resp] = await evalInTab(
        tabId,
        (containerSelector, subjectSelector, includeFM, includeQuotes, stripWrote, limitMessages) => {
          return (window.__gmailToMd && window.__gmailToMd.extractPlain)
            ? window.__gmailToMd.extractPlain({
                containerSelector, subjectSelector, includeFM, includeQuotes, stripWrote, limitMessages
              })
            : null;
        },
        [cfg.containerSelector, cfg.subjectSelector, cfg.frontmatter, cfg.includeQuotes, cfg.stripWrote, cfg.limitMessages]
      );
      const result = resp && resp.result;
      if (!result || !result.body) {
        flashBadge(tabId, "!", "#d33", 1500);
        notify("Gmail → Obsidian", "Couldn’t extract the email body. Expand thread messages and try again.");
        return;
      }

      // 2) Build filename/path
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, "0");
      const d = String(now.getDate()).padStart(2, "0");
      const baseName = `${y}-${m}-${d} - ${safeComponent(result.subject || "email")}.md`;

      const vault = (cfg.vaultName || "").trim();
      const folder = (cfg.defaultNoteFolder || "").trim();
      const relPath = joinPath(folder, baseName);

      // 3) Clipboard-first route (mirrors official Clipper)
      if (vault) {
        // 3a) Write to clipboard in page context.
        const toWrite = result.body;
        const [clipRes] = await evalInTab(
          tabId,
          async (text) => {
            try {
              await navigator.clipboard.writeText(text);
              return { ok: true };
            } catch (e) {
              return { ok: false, err: String(e) };
            }
          },
          [toWrite]
        );

        if (clipRes?.result?.ok) {
          // 3b) Tell Obsidian to create from clipboard
          const uri = buildObsidianURIClipboard(vault, relPath);

          // Update current tab to the obsidian:// URI (no extra tabs)
          chrome.tabs.update(tabId, { url: uri }, () => {
            if (chrome.runtime.lastError) {
              console.error("Obsidian URI (clipboard) error:", chrome.runtime.lastError?.message || chrome.runtime.lastError);
              // fallback to content URI, then download
              tryContentURIOrDownload();
            } else {
              // Optional: jump back to Gmail after Obsidian catches the URI
              setTimeout(() => chrome.tabs.goBack(tabId, () => {}), 700);
              flashBadge(tabId, "✓", "#2ea44f", 1200);
            }
          });
          return;
        } else {
          console.warn("Clipboard write failed:", clipRes?.result?.err);
          // fall through to content URI / download
          await tryContentURIOrDownload();
          return;
        }
      }

      // No vault configured → download
      fallbackDownload(tabId, baseName, result.body);

      // --- helpers in scope ---
      async function tryContentURIOrDownload() {
        const encoded = encodeURIComponent(result.body);
        const uri = buildObsidianURIContent(vault, relPath, encoded);

        if (uri.length <= URI_SIZE_LIMIT) {
          chrome.tabs.update(tabId, { url: uri }, () => {
            if (chrome.runtime.lastError) {
              console.error("Obsidian URI (content) error:", chrome.runtime.lastError?.message || chrome.runtime.lastError);
              fallbackDownload(tabId, baseName, result.body);
            } else {
              setTimeout(() => chrome.tabs.goBack(tabId, () => {}), 700);
              flashBadge(tabId, "✓", "#2ea44f", 1200);
            }
          });
        } else {
          notify("Gmail → Obsidian", "Large note sent via download (clipboard/URI not available).");
          fallbackDownload(tabId, baseName, result.body);
        }
      }

    } catch (err) {
      console.error("Gmail → Obsidian export failed:", err);
      flashBadge(tabId, "!", "#d33", 1500);
      notify("Gmail → Obsidian", "Export failed. See extension errors for details.");
    }
  })();
});