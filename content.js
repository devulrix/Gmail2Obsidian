// content.js
// Expose an API the worker calls
window.__gmailToMd = { extractPlain };

/**
 * Extracts a Gmail thread into Markdown-friendly plain text + metadata.
 * Options:
 *  - containerSelector: comma-separated selectors (fallback only)
 *  - subjectSelector:   selector for the subject
 *  - includeFM:         boolean (YAML frontmatter)
 *  - includeQuotes:     boolean (include hidden/trimmed quoted history)
 *  - stripWrote:        boolean (cut content after "On ... wrote:")
 *  - limitMessages:     number (0 = all; otherwise last N messages)
 */
function extractPlain({
  containerSelector,
  subjectSelector,
  includeFM,
  includeQuotes,
  stripWrote,
  limitMessages
}) {
  const subjectEl = document.querySelector(subjectSelector || ".hP");
  const subject = subjectEl ? subjectEl.textContent.trim() : "";

  // 1) Find each message wrapper in the thread
  let wraps = Array.from(document.querySelectorAll("div.adn"));
  if (wraps.length === 0) {
    // Fallback: use provided selectors as message containers
    const sels = (containerSelector || ".a3s.aiL, .a3s.ajx")
      .split(",").map(s => s.trim()).filter(Boolean);
    wraps = sels.flatMap(sel => Array.from(document.querySelectorAll(sel)))
                .map(n => n.closest("div") || n);
  }
  if (wraps.length === 0) {
    const fb = document.querySelector(".adn.ads") || document.body;
    wraps = [fb];
  }

  // Limit to last N if requested
  const N = Number(limitMessages) || 0;
  if (N > 0 && wraps.length > N) wraps = wraps.slice(-N);

  // 2) Participants (dedupe by email)
  const senderSpans = Array.from(document.querySelectorAll("span.gD[email]"));
  const moreSender = Array.from(document.querySelectorAll("span[email].gF, span[email].go"));
  const nodes = dedupeNodes(senderSpans.concat(moreSender));

  const seen = new Set();
  const participants = [];
  for (const el of nodes) {
    const email = (el.getAttribute("email") || "").trim();
    if (!email || seen.has(email)) continue;
    seen.add(email);
    const nameAttr = (el.getAttribute("name") || "").trim();
    const inner = (el.textContent || "").trim();
    const name = nameAttr || inner || email;
    participants.push({ name, email });
  }
  const mainFrom = participants[0] || { name: "", email: "" };

  // 3) Timestamp (best effort from first message header)
  let dateLocal = "", dateISO = "";
  let dtEl = wraps[0]?.querySelector("span.g3[title], span.g3[alt]") ||
             document.querySelector("span.g3[title], span.g3[alt]");
  if (dtEl) {
    dateLocal = (dtEl.getAttribute("title") || dtEl.getAttribute("alt") || dtEl.textContent || "").trim();
    const maybe = new Date(dateLocal);
    if (!isNaN(maybe.getTime())) dateISO = maybe.toISOString();
  }

  // 4) Build thread body — process each message separately, with options
  const out = [];
  for (const wrap of wraps) {
    // Extract timestamp for this message
    let msgDate = "";
    const msgDateEl = wrap.querySelector("span.g3[title], span.g3[alt]");
    if (msgDateEl) {
      msgDate = (msgDateEl.getAttribute("title") || msgDateEl.getAttribute("alt") || "").trim();
    }
    // Prefer body parts containing "a3s" (covers aiL, ajx, etc.)
    // Optionally include quoted/trimmed history blocks
    let parts = Array.from(wrap.querySelectorAll('div[class*="a3s"]'));
    if (includeQuotes) {
      parts = parts.concat(Array.from(wrap.querySelectorAll('blockquote.gmail_quote, blockquote[type="cite"]')));
    }

    if (parts.length === 0) parts = [wrap]; // very defensive fallback

    // Extract text for this message
    const pieces = [];
    for (const part of parts) {
      const clone = part.cloneNode(true);
      // remove obvious non-content
      clone.querySelectorAll("script, style, noscript, img, svg, picture").forEach(n => n.remove());
      // keep quotes if includeQuotes=true (we already added them explicitly)
      // drop tiny Gmail UI shards
      clone.querySelectorAll(".yj6qo, .adL").forEach(n => n.remove());

      collectTextWithBreaks(clone, pieces);
      pieces.push("\n\n"); // break between parts
    }

    // Normalize this message's text
    let msg = pieces.join("")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .split(/\r?\n/)
      .map(s => s.trim())
      .filter(Boolean)
      .join("\n\n");

    // Optionally strip quoted tails that start with: "On ... wrote:"
    if (stripWrote) {
      const wroteRe = /^On .+ wrote:$/i;
      const lines = msg.split(/\r?\n/);
      const idx = lines.findIndex(l => wroteRe.test(l));
      if (idx >= 0) msg = lines.slice(0, idx).join("\n").trim();
    }

    if (msg) {
      // Add timestamp header if available
      if (msgDate) {
        out.push(`**${msgDate}**\n\n`);
      }
      // Per-message separator (helps readability in threads)
      out.push(msg.trim(), "\n\n---\n\n");
    }
  }

  let bodyText = out.join("")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // Fallback if empty
  if (!bodyText) {
    const fc = (wraps[0] || document.body).cloneNode(true);
    fc.querySelectorAll("script, style, noscript, img, svg, picture").forEach(n => n.remove());
    bodyText = (fc.textContent || "").replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  }

  bodyText = bodyText ? (bodyText + "\n") : "";

  // 5) Assemble output
  const sourceUrl = window.location.href;
  const participantStrings = participants.map(p => {
    const n = (p.name || "").trim();
    const e = (p.email || "").trim();
    return n && e ? `${n} <${e}>` : (e || n);
  }).filter(Boolean);

  let body;
  if (includeFM) {
    const fm = [
      "---",
      `title: "${escapeYaml(subject || "email")}"`,
      `source: "Gmail"`,
      `source_url: "${escapeYaml(sourceUrl)}"`,
      `exported: "${new Date().toISOString()}"`,
      `from_name: "${escapeYaml(mainFrom.name)}"`,
      `from_email: "${escapeYaml(mainFrom.email)}"`,
      `date_local: "${escapeYaml(dateLocal)}"`,
      `date_iso: "${escapeYaml(dateISO)}"`
    ];
    if (participantStrings.length) {
      fm.push("participants:");
      for (const s of participantStrings) fm.push(`  - "${escapeYaml(s)}"`);
    } else {
      fm.push("participants: []");
    }
    fm.push("---", "");
    body = fm.join("\n") + bodyText;
  } else {
    const hdr = [];
    if (mainFrom.name || mainFrom.email) hdr.push(`From: ${formatFrom(mainFrom)}`);
    if (dateLocal) hdr.push(`Date: ${dateLocal}${dateISO ? ` (${dateISO})` : ""}`);
    hdr.push(`Source: ${sourceUrl}`, "", "---", "");
    body = hdr.join("\n") + bodyText;
  }

  return { subject, body };
}

// ---------- Helpers ----------
function collectTextWithBreaks(el, pieces) {
  if (!el) return;

  if (el.nodeType === Node.TEXT_NODE) {
    const t = (el.nodeValue || "").replace(/\s+/g, " ").trim();
    if (t) pieces.push(t + " ");
    return;
  }
  if (el.nodeType !== Node.ELEMENT_NODE) return;

  // Skip only obvious non-content
  if (el.matches("script, style, noscript, img, svg, picture, .yj6qo, .adL")) return;

  for (const child of el.childNodes) collectTextWithBreaks(child, pieces);

  const tag = el.tagName;
  if (tag === "DIV" || tag === "P" || tag === "LI") pieces.push("\n\n");
  else if (tag === "SPAN" || tag === "BR") pieces.push("\n");
}

function escapeYaml(s) { return (s || "").replace(/"/g, '\\"'); }
function formatFrom(p) { return p.name && p.email ? `${p.name} <${p.email}>` : (p.email || p.name || ""); }
function dedupeNodes(arr) {
  const seen = new Set(), out = [];
  for (const el of arr) {
    const key = el && el.outerHTML;
    if (key && !seen.has(key)) { seen.add(key); out.push(el); }
  }
  return out;
}