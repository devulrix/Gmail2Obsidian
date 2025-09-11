// service_worker.js (MV3)

// ---------- Helpers ----------
function storageGet(defaults) {
  return new Promise(function (resolve) {
    chrome.storage.sync.get(defaults || {}, function (cfg) {
      resolve(cfg || {});
    });
  });
}

function injectContent(tabId, files) {
  return chrome.scripting.executeScript({
    target: { tabId: tabId },
    files: files
  });
}

function evalInTab(tabId, func, args) {
  return chrome.scripting.executeScript({
    target: { tabId: tabId },
    func: func,
    args: args || []
  });
}

function flashBadge(tabId, text, color, ms) {
  ms = typeof ms === "number" ? ms : 1200;
  try {
    chrome.action.setBadgeText({ tabId: tabId, text: text });
    if (color) chrome.action.setBadgeBackgroundColor({ tabId: tabId, color: color });
    if (ms > 0) {
      setTimeout(function () {
        chrome.action.setBadgeText({ tabId: tabId, text: "" });
      }, ms);
    }
  } catch (e) {
    // ignore
  }
}

function notify(title, message) {
  // Requires "notifications" permission in manifest
  try {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "images/icon_128.png",
      title: title || "Gmail → Obsidian",
      message: message || ""
    });
  } catch (e) {
    // ignore
  }
}

// Sanitize a single filename component
function safeComponent(s) {
  return (s || "")
    .replace(/[\\/:*?"<>|]+/g, "_")
    .replace(/\u0000/g, "")
    .replace(/^\.+$/, "_")
    .replace(/[ \t]+$/g, "")
    .slice(0, 140);
}

// ---------- Defaults ----------
var DEFAULTS = {
  containerSelector: ".a3s.aiL, .a3s.ajx",
  subjectSelector: ".hP",
  frontmatter: true,
  includeQuotes: false, // hidden quoted history ("…")
  stripWrote: true,     // cut tails that start with "On … wrote:"
  limitMessages: 0      // 0 = all; otherwise last N messages
};

// ---------- Install-time defaults / migrations ----------
chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason === "install") {
    chrome.storage.sync.set(DEFAULTS);
  } else if (details.reason === "update") {
    storageGet(null).then(function (cur) {
      var patch = {};
      Object.keys(DEFAULTS).forEach(function (k) {
        if (cur[k] == null) patch[k] = DEFAULTS[k];
      });
      if (Object.keys(patch).length) chrome.storage.sync.set(patch);
    });
  }
});

// ---------- Main action ----------
chrome.action.onClicked.addListener(function (tab) {
  try {
    if (!tab || !tab.id) return;
    var tabId = tab.id;

    // Ensure content script is present
    injectContent(tabId, ["content.js"]).then(function () {
      return storageGet(DEFAULTS);
    }).then(function (cfg) {
      // Call page extractor with all options
      return evalInTab(
        tabId,
        function (containerSelector, subjectSelector, includeFM, includeQuotes, stripWrote, limitMessages) {
          return (window.__gmailToMd && window.__gmailToMd.extractPlain)
            ? window.__gmailToMd.extractPlain({
                containerSelector: containerSelector,
                subjectSelector: subjectSelector,
                includeFM: includeFM,
                includeQuotes: includeQuotes,
                stripWrote: stripWrote,
                limitMessages: limitMessages
              })
            : null;
        },
        [cfg.containerSelector, cfg.subjectSelector, cfg.frontmatter, cfg.includeQuotes, cfg.stripWrote, cfg.limitMessages]
      );
    }).then(function (respArr) {
      var resp = respArr && respArr[0];
      var result = resp && resp.result;

      if (!result || !result.body) {
        flashBadge(tabId, "!", "#d33", 1500);
        notify("Gmail → Obsidian", "Couldn’t extract the email body. Check Options and ensure a message is open.");
        return;
      }

      // Filename: YYYY-MM-DD - <Subject>.md (no subpath; Save As will choose folder)
      var now = new Date();
      var y = now.getFullYear();
      var m = String(now.getMonth() + 1).padStart(2, "0");
      var d = String(now.getDate()).padStart(2, "0");
      var baseName = y + "-" + m + "-" + d + " - " + safeComponent(result.subject || "email") + ".md";

      // Trigger Save As; callback form avoids Promise quirks
      chrome.downloads.download(
        {
          url: "data:text/markdown;charset=utf-8," + encodeURIComponent(result.body),
          filename: baseName,
          saveAs: true
        },
        function (downloadId) {
          if (chrome.runtime.lastError || !downloadId) {
            console.error("Downloads API error:", chrome.runtime.lastError && (chrome.runtime.lastError.message || chrome.runtime.lastError));
            flashBadge(tabId, "!", "#d33", 1500);
            notify("Gmail → Obsidian", "Export failed. See extension errors for details.");
            return;
          }
          flashBadge(tabId, "✓", "#2ea44f", 1200);
        }
      );
    }).catch(function (err) {
      console.error("Export flow error:", err);
      flashBadge(tabId, "!", "#d33", 1500);
      notify("Gmail → Obsidian", "Export failed. See extension errors for details.");
    });

  } catch (err) {
    console.error("Gmail → Obsidian export failed:", err);
    if (tab && tab.id) {
      flashBadge(tab.id, "!", "#d33", 1500);
      notify("Gmail → Obsidian", "Export failed. See extension errors for details.");
    }
  }
});
