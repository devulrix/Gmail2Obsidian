// options.js
const defaults = {
  containerSelector: ".a3s.aiL, .a3s.ajx",
  subjectSelector: ".hP",
  frontmatter: true,
  includeQuotes: false,
  stripWrote: true,
  limitMessages: 0,
  vaultName: "",
  defaultNoteFolder: "Email"
};

function setVal(id, val) {
  const el = document.getElementById(id);
  if (!el) return;
  if (el.type === "checkbox") el.checked = !!val;
  else el.value = val ?? "";
}

document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.sync.get(null, (cfg) => {
    setVal("vaultName", cfg.vaultName ?? "");
    setVal("defaultNoteFolder", cfg.defaultNoteFolder ?? "Email");
    setVal("containerSelector", cfg.containerSelector ?? defaults.containerSelector);
    setVal("subjectSelector", cfg.subjectSelector ?? defaults.subjectSelector);
    setVal("frontmatter", cfg.frontmatter ?? true);
    setVal("includeQuotes", cfg.includeQuotes ?? false);
    setVal("stripWrote", cfg.stripWrote ?? true);
    setVal("limitMessages", cfg.limitMessages ?? 0);
  });

  document.getElementById("saveBtn")?.addEventListener("click", () => {
    const val = (id, type) => {
      const el = document.getElementById(id);
      if (type === "checkbox") return !!el.checked;
      if (type === "number") return Number(el.value) || 0;
      return (el.value || "").trim();
    };
    const cfg = {
      vaultName: val("vaultName"),
      defaultNoteFolder: val("defaultNoteFolder"),
      containerSelector: val("containerSelector"),
      subjectSelector: val("subjectSelector"),
      frontmatter: val("frontmatter", "checkbox"),
      includeQuotes: val("includeQuotes", "checkbox"),
      stripWrote: val("stripWrote", "checkbox"),
      limitMessages: val("limitMessages", "number")
    };
    chrome.storage.sync.set(cfg, () => alert("Saved."));
  });
});
