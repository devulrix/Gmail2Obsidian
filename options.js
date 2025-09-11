// options.js (MV3-safe)

const defaults = {
  containerSelector: ".a3s.aiL, .a3s.ajx",
  subjectSelector: ".hP",
  frontmatter: true,
  includeQuotes: false,
  stripWrote: true,
  limitMessages: 0
};

function loadOptions() {
  chrome.storage.sync.get(defaults, (cfg) => {
    for (const k of Object.keys(defaults)) {
      const el = document.getElementById(k);
      if (!el) continue;
      if (el.type === "checkbox") el.checked = !!cfg[k];
      else el.value = cfg[k];
    }
  });
}

function saveOptions() {
  const cfg = {};
  for (const k of Object.keys(defaults)) {
    const el = document.getElementById(k);
    if (!el) continue;
    cfg[k] = el.type === "checkbox" ? el.checked : (el.type === "number" ? Number(el.value) || 0 : el.value.trim());
  }
  chrome.storage.sync.set(cfg, () => alert("Saved."));
}

document.addEventListener("DOMContentLoaded", () => {
  loadOptions();
  const btn = document.getElementById("saveBtn");
  if (btn) btn.addEventListener("click", saveOptions);
});
