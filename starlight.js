#!/usr/bin/env node
/**
 * starlight.js — v9
 * Single-file resolver (13 providers):
 *   Rekonise · MediaFire · SFile · Safelinku · Sub2Unlock · Unshorten
 *   Pixeldrain · Krakenfiles · GDrive · Doodstream · Catbox · TikTok · TeraBox
 *
 * Runtime: Node.js >= 18 (CommonJS)
 * Deps:    axios, cheerio, prompts, cli-table3
 *
 * Install (Termux):
 *   pkg install nodejs -y
 *   npm i axios cheerio prompts cli-table3
 *   termux-setup-storage
 *   node starlight.js
 *
 * Credits: Patrick
 */

"use strict";

const axios = require("axios");
const cheerio = require("cheerio");
const prompts = require("prompts");
const Table = require("cli-table3");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const os = require("os");

// ─────────────────────────────────────────────────────────────────────────────
// ANSI palette (zero-ESM)
// ─────────────────────────────────────────────────────────────────────────────

const IS_TTY = process.stdout.isTTY !== false;
const NO_COLOR = process.env.NO_COLOR === "1" || process.env.TERM === "dumb";
const on = IS_TTY && !NO_COLOR;

const C = {
  reset: "\x1b[0m", bold: "\x1b[1m", dim: "\x1b[2m", underline: "\x1b[4m",
  red: "\x1b[31m", green: "\x1b[32m", yellow: "\x1b[33m", blue: "\x1b[34m",
  magenta: "\x1b[35m", cyan: "\x1b[36m", gray: "\x1b[90m", white: "\x1b[37m",
};

const paint = (code, s) => (on ? code + String(s) + C.reset : String(s));
const chalk = {
  red: (s) => paint(C.red, s), green: (s) => paint(C.green, s),
  yellow: (s) => paint(C.yellow, s), blue: (s) => paint(C.blue, s),
  magenta: (s) => paint(C.magenta, s), cyan: (s) => paint(C.cyan, s),
  gray: (s) => paint(C.gray, s), white: (s) => paint(C.white, s),
  bold: (s) => paint(C.bold, s), dim: (s) => paint(C.dim, s),
  underline: (s) => paint(C.underline, s),
};

function makeSpinner(initial = "") {
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  let i = 0, text = initial, timer = null, active = false;
  const draw = () => {
    if (!on || !active) return;
    process.stderr.write(`\r${chalk.cyan(frames[i++ % frames.length])} ${text}\x1b[K`);
  };
  return {
    start(t) {
      if (t) text = t;
      active = true;
      if (!on) { if (text) process.stderr.write("• " + text + "\n"); return this; }
      timer = setInterval(draw, 80); draw(); return this;
    },
    set(t) {
      text = t;
      if (!on && text) process.stderr.write("• " + text + "\n");
      return this;
    },
    stop(finalLine) {
      active = false;
      if (timer) { clearInterval(timer); timer = null; }
      if (on) process.stderr.write("\r\x1b[K");
      if (finalLine) process.stderr.write(finalLine + "\n");
      return this;
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// config
// ─────────────────────────────────────────────────────────────────────────────

const APP = { name: "Starlight", version: "9.0.0", credits: "Patrick" };

function termuxDownloadDir() {
  const sharedDownload = path.join(process.env.HOME || "", "storage", "shared", "Download");
  if (fs.existsSync(path.join(process.env.HOME || "", "storage", "shared"))) return sharedDownload;
  return path.join(os.homedir(), "Downloads");
}

const CFG = {
  UA: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  REKONISE_BASE: "https://rekonise.com",
  REKONISE_API: "https://api.rekonise.com",
  REKONISE_WAIT_MS: 11000,
  TIMEOUT_MS: 15000,
  OUT_DIR: path.join(process.cwd(), "out"),
  DL_ROOT: path.join(termuxDownloadDir(), "Starlight"),
};

// ─────────────────────────────────────────────────────────────────────────────
// shared utils
// ─────────────────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function extractCleanUrl(text) {
  if (!text || typeof text !== "string") return "";
  const match = text.match(/https?:\/\/[^\s]+/i);
  let clean = match ? match[0] : text.trim();
  if (!clean.startsWith("http://") && !clean.startsWith("https://")) clean = "https://" + clean;
  return clean;
}

function extractSlug(input) {
  if (!input || typeof input !== "string") return "";
  let clean = input.trim();
  const match = clean.match(/rekonise\.com\/([a-zA-Z0-9_-]+)/i);
  if (match) return match[1];
  clean = clean.replace(/^https?:\/\//i, "").replace(/\/$/, "");
  return clean.split("/").pop() || clean;
}

function computeWaitMs(token) {
  try {
    const parts = token.split(".");
    if (parts.length > 1) {
      const payload = JSON.parse(Buffer.from(parts[0], "base64").toString("utf-8"));
      if (payload.issuedAt) {
        const elapsed = Date.now() - payload.issuedAt;
        return Math.max(0, CFG.REKONISE_WAIT_MS - elapsed);
      }
    }
  } catch {}
  return CFG.REKONISE_WAIT_MS;
}

function formatBytes(bytes) {
  if (!bytes || isNaN(bytes)) return "Unknown";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0, num = Number(bytes);
  while (num >= 1024 && i < units.length - 1) { num /= 1024; i++; }
  return `${num.toFixed(2)} ${units[i]}`;
}

function sanitizeFilename(name) {
  return (
    String(name || "download")
      .replace(/[\/\\?%*:|"<>]/g, "_")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 120) || "download"
  );
}

function ensureOutDir() {
  if (!fs.existsSync(CFG.OUT_DIR)) fs.mkdirSync(CFG.OUT_DIR, { recursive: true });
}

function ensureDlRoot() {
  try {
    if (!fs.existsSync(CFG.DL_ROOT)) fs.mkdirSync(CFG.DL_ROOT, { recursive: true });
    return CFG.DL_ROOT;
  } catch (e) {
    console.error(chalk.yellow("! ") + "Download dir gagal dibuat: " + e.message);
    console.error(chalk.gray("  jalankan: termux-setup-storage"));
    return CFG.OUT_DIR;
  }
}

function getRandomString(length = 10) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

function detectProvider(url) {
  if (!url) return "rekonise";
  if (/mediafire\.com/i.test(url)) return "mediafire";
  if (/sfile\.(co|mobi)/i.test(url)) return "sfile";
  if (/sub2unlock\.(com|io|net)/i.test(url)) return "sub2unlock";
  if (/safelinku\.(com|net|org|link|id)/i.test(url) || /sfl\./i.test(url)) return "safelinku";
  if (/pixeldrain\.com/i.test(url)) return "pixeldrain";
  if (/krakenfiles\.com/i.test(url)) return "krakenfiles";
  if (/drive\.google\.com/i.test(url) || /docs\.google\.com/i.test(url)) return "gdrive";
  if (/(?:dood(?:stream)?\.[a-z]+|ds2play\.[a-z]+|doods\.[a-z]+|playmogo\.[a-z]+)/i.test(url)) return "doodstream";
  if (/catbox\.moe/i.test(url)) return "catbox";
  if (/(?:tiktok\.com|vt\.tiktok\.com|vm\.tiktok\.com)/i.test(url)) return "tiktok";
  if (/(?:terabox\.(?:com|app)|1024terabox\.com|teraboxapp\.com|freeterabox\.com|1024tera\.com|4funbox\.(?:com|co))/i.test(url)) return "terabox";
  if (/rekonise\.com/i.test(url)) return "rekonise";
  if (/^[a-zA-Z0-9_-]{25,50}$/.test(url.trim())) return "gdrive";
  if (/^[a-zA-Z0-9_-]{6,16}$/.test(url.trim())) return "pixeldrain";
  return "auto";
}

function rekoniseHeaders(pageUrl) {
  return {
    "User-Agent": CFG.UA,
    Origin: CFG.REKONISE_BASE,
    Referer: pageUrl,
    Accept: "application/json, text/plain, */*",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// cookie helpers
// ─────────────────────────────────────────────────────────────────────────────

function parseCookies(setCookieHeaders) {
  if (!setCookieHeaders) return "";
  const headers = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
  return headers.map((c) => c.split(";")[0].trim()).filter(Boolean).join("; ");
}

function mergeCookies(oldCookie, newCookie) {
  const map = new Map();
  const add = (str) => {
    if (!str) return;
    str.split(";").forEach((pair) => {
      const idx = pair.indexOf("=");
      if (idx !== -1) map.set(pair.slice(0, idx).trim(), pair.slice(idx + 1).trim());
    });
  };
  add(oldCookie); add(newCookie);
  return Array.from(map.entries()).map(([k, v]) => `${k}=${v}`).join("; ");
}

class SimpleCookieJar {
  constructor() { this.cookies = new Map(); }
  setFromHeaders(headers) {
    if (!headers) return;
    const raw = headers["set-cookie"];
    if (!raw) return;
    const list = Array.isArray(raw) ? raw : [raw];
    for (const item of list) {
      if (!item) continue;
      const part = item.split(";")[0].trim();
      const eqIdx = part.indexOf("=");
      if (eqIdx !== -1) {
        const name = part.slice(0, eqIdx).trim();
        const value = part.slice(eqIdx + 1).trim();
        if (name) this.cookies.set(name, value);
      }
    }
  }
  getCookieHeader() {
    const pairs = [];
    for (const [k, v] of this.cookies.entries()) pairs.push(`${k}=${v}`);
    return pairs.join("; ");
  }
  get(name) { return this.cookies.get(name); }
}

// ─────────────────────────────────────────────────────────────────────────────
// download helpers — streaming ke disk
// ─────────────────────────────────────────────────────────────────────────────

function resolveExtFromUrl(url, fallback = "bin") {
  try {
    const u = new URL(url);
    const base = path.basename(u.pathname || "");
    const ext = path.extname(base || "").replace(".", "");
    if (ext && ext.length <= 6) return ext;
  } catch {}
  return fallback;
}

async function downloadToFile(url, destDir, baseName, onStep = () => {}) {
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  const safeBase = sanitizeFilename(baseName || "file");
  let filename = safeBase;
  let dest = path.join(destDir, filename);
  let counter = 1;
  while (fs.existsSync(dest)) {
    const ext = path.extname(safeBase);
    const stem = path.basename(safeBase, ext);
    filename = `${stem} (${counter})${ext}`;
    dest = path.join(destDir, filename);
    counter++;
  }

  onStep("download", `Streaming ${filename}`);
  const res = await axios.get(url, {
    responseType: "stream",
    headers: { "User-Agent": CFG.UA, Accept: "*/*" },
    timeout: 60000,
    maxRedirects: 5,
    validateStatus: (s) => s >= 200 && s < 300,
  });

  const total = Number(res.headers["content-length"] || 0);
  let written = 0;
  let lastTick = Date.now();

  await new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(dest);
    res.data.on("data", (chunk) => {
      written += chunk.length;
      const now = Date.now();
      if (now - lastTick > 200) {
        lastTick = now;
        const pct = total ? ((written / total) * 100).toFixed(1) + "%" : formatBytes(written);
        onStep("download", `${filename} — ${pct}`);
      }
    });
    res.data.pipe(writer);
    writer.on("finish", resolve);
    writer.on("error", reject);
    res.data.on("error", reject);
  });

  const st = fs.statSync(dest);
  return { path: dest, filename, size: st.size };
}

// ─────────────────────────────────────────────────────────────────────────────
// resolver: rekonise
// ─────────────────────────────────────────────────────────────────────────────

async function rekoniseScrape(input, options = {}) {
  const onStep = typeof options.onStep === "function" ? options.onStep : () => {};
  try {
    if (!input || typeof input !== "string") throw new Error("Invalid URL.");
    const slug = extractSlug(input);
    if (!slug) throw new Error("Slug Rekonise tidak ditemukan dari URL.");

    const autoResolve = options.autoResolve !== false;
    const pageUrl = `${CFG.REKONISE_BASE}/${slug}`;
    const headers = rekoniseHeaders(pageUrl);

    onStep("rekonise", `Ambil metadata "${slug}"`);
    const infoRes = await axios.get(`${CFG.REKONISE_API}/social-unlocks/${slug}`, {
      headers, timeout: CFG.TIMEOUT_MS,
    });

    const data = infoRes.data;
    if (!data || !data.unlock_token) throw new Error("Response invalid — unlock_token kosong.");

    const title = data.title || "Rekonise Unlock";
    const token = data.unlock_token;
    const actions = Array.isArray(data.actions) ? data.actions : [];

    onStep("rekonise", `Kirim ${actions.length} action(s)`);
    for (const a of actions) {
      if (a.type && a.value) {
        try {
          await axios.post(
            `${CFG.REKONISE_API}/traffic/action-completed`,
            { actionType: a.type, actionValue: a.value, slug },
            { headers, timeout: 10000 },
          );
        } catch {}
      }
    }

    const waitMs = computeWaitMs(token);
    if (waitMs > 0) { onStep("rekonise", `Tunggu ${(waitMs / 1000).toFixed(1)}s`); await sleep(waitMs); }

    onStep("rekonise", "Minta URL tujuan");
    const unlockRes = await axios.get(
      `${CFG.REKONISE_API}/social-unlocks/${slug}/unlock?token=${encodeURIComponent(token)}`,
      { headers, timeout: CFG.TIMEOUT_MS },
    );

    const destUrl = unlockRes.data?.url;
    if (!destUrl) throw new Error("URL tujuan kosong dari Rekonise.");

    if (autoResolve) {
      const chain = await autoResolveChain(destUrl, { onStep });
      if (chain) {
        return {
          status: true,
          result: {
            ...chain.result,
            title: chain.result.title || title,
            slug,
            originalUrl: pageUrl,
            destinationUrl: destUrl,
            providerChain: ["rekonise", chain.result.provider].filter(Boolean),
          },
        };
      }
    }

    return {
      status: true,
      result: {
        provider: "rekonise",
        title, slug,
        originalUrl: pageUrl,
        destinationUrl: destUrl,
        url: destUrl,
        downloads: [{ type: "link", quality: "Direct Link", url: destUrl }],
      },
    };
  } catch (e) {
    return { status: false, message: e.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// resolver: mediafire
// ─────────────────────────────────────────────────────────────────────────────

async function mediafireScrape(url, onStep = () => {}) {
  try {
    if (!url || typeof url !== "string") throw new Error("Invalid URL.");
    const cleanUrl = extractCleanUrl(url);

    onStep("mediafire", "Fetch halaman MediaFire");
    const res = await axios.get(cleanUrl, {
      headers: {
        "User-Agent": CFG.UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      timeout: CFG.TIMEOUT_MS,
      maxRedirects: 5,
    });

    const html = typeof res.data === "string" ? res.data : "";
    if (html.includes("error.php?errno=") || res.status === 404) {
      throw new Error("MediaFire file not found or has been removed.");
    }

    const $ = cheerio.load(html);

    let directUrl = $("#downloadButton").attr("href") || "";
    if (!directUrl || !directUrl.startsWith("http")) {
      const match = html.match(/href=["'](https?:\/\/download\d*\.mediafire\.com\/[^"']+)["']/i);
      if (match) directUrl = match[1];
    }
    if (!directUrl) {
      const aria = $('a[aria-label^="Download file"]').attr("href");
      if (aria && aria.startsWith("http")) directUrl = aria;
    }
    if (!directUrl) throw new Error("Could not find direct download link on MediaFire page.");

    let filename = $(".filename").first().text().trim();
    if (!filename) {
      const aria = $('a[aria-label^="Download file"]').attr("aria-label");
      if (aria) filename = aria.replace(/^Download file\s*/i, "").trim();
    }
    if (!filename) filename = $('meta[property="og:title"]').attr("content") || "MediaFire File";

    let size = "";
    const sizeLi = $("ul.details li:contains('File size:')");
    if (sizeLi.length > 0) size = sizeLi.find("span").text().trim();
    if (!size) {
      const sizeMatch = html.match(/\(([\d.]+\s*(?:MB|GB|KB|B))\)/i);
      if (sizeMatch) size = sizeMatch[1];
    }

    return {
      status: true,
      result: {
        provider: "mediafire",
        title: filename,
        filename: sanitizeFilename(filename),
        size: size || "Unknown",
        filesize: size || "Unknown",
        url: directUrl,
        downloads: [{ type: "file", quality: "Direct Download", url: directUrl }],
      },
    };
  } catch (error) {
    return { status: false, message: `MediaFire: ${error.message}` };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// resolver: sfile
// ─────────────────────────────────────────────────────────────────────────────

async function sfileScrape(url, onStep = () => {}) {
  try {
    if (!url || typeof url !== "string") throw new Error("Invalid URL.");
    const cleanUrl = extractCleanUrl(url);

    let cookie = "";
    onStep("sfile", "Fetch halaman SFile");
    const res1 = await axios.get(cleanUrl, {
      headers: {
        "User-Agent": CFG.UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      timeout: CFG.TIMEOUT_MS,
      maxRedirects: 5,
    });

    cookie = parseCookies(res1.headers["set-cookie"]);
    const $1 = cheerio.load(res1.data);

    let title =
      $1('meta[property="og:title"]').attr("content") ||
      $1("h1").first().text().trim() ||
      "Sfile Download";
    title = title.replace(/\s*-\s*Sfile\.co$/i, "").trim();

    let size = "";
    const desc = $1('meta[property="og:description"]').attr("content") || "";
    const sizeMatch = desc.match(/size\s+([0-9.]+\s*[KMGT]?B)/i);
    if (sizeMatch) size = sizeMatch[1];
    else {
      const rawText = $1("body").text();
      const matchText = rawText.match(/([0-9.]+\s*(?:KB|MB|GB|B))/i);
      if (matchText) size = matchText[1];
    }

    const downloadBtn = $1("#download, a[data-dw-url]");
    const dwUrl = downloadBtn.attr("data-dw-url");
    if (!dwUrl) throw new Error("Could not find download gate link on Sfile page.");

    const gateUrl = dwUrl.startsWith("http") ? dwUrl : new URL(dwUrl, cleanUrl).href;

    onStep("sfile", "Ikuti gate download");
    const res2 = await axios.get(gateUrl, {
      headers: {
        "User-Agent": CFG.UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: cleanUrl,
        Cookie: cookie,
      },
      timeout: CFG.TIMEOUT_MS,
      maxRedirects: 5,
    });

    const newCookies = parseCookies(res2.headers["set-cookie"]);
    cookie = mergeCookies(cookie, newCookies);

    const html2 = typeof res2.data === "string" ? res2.data : "";
    if (html2.includes("download link for this file has expired")) {
      throw new Error("Sfile download session expired.");
    }

    let directUrl = "";
    const fileMatches = html2.match(/https?:\\?\/\\?\/download\d*\.sfile\.co\\?\/downloadfile\\?\/[^\s"']+/gi);
    if (fileMatches && fileMatches.length > 0) directUrl = fileMatches[0].replace(/\\/g, "");

    if (!directUrl) {
      const directMatch = html2.match(/data-direct-download=["']([^"']+)["']/i);
      if (directMatch) directUrl = directMatch[1].replace(/&amp;/g, "&");
    }
    if (!directUrl) {
      const $2 = cheerio.load(html2);
      directUrl = $2("#download").attr("href") || "";
      if (directUrl === "#" || !directUrl.startsWith("http")) directUrl = "";
    }
    if (!directUrl) throw new Error("Could not extract final direct download URL from Sfile.");

    return {
      status: true,
      result: {
        provider: "sfile",
        title,
        filename: sanitizeFilename(title),
        size: size || "Unknown",
        filesize: size || "Unknown",
        url: directUrl,
        downloads: [{ type: "file", quality: "Direct Download", url: directUrl }],
      },
    };
  } catch (error) {
    return { status: false, message: `SFile: ${error.message}` };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// resolver: safelinku
// ─────────────────────────────────────────────────────────────────────────────

function generateSessionToken(rawXsrfCookie) {
  const unquotedXsrf = decodeURIComponent(rawXsrfCookie);
  const dummyFp = crypto
    .createHash("sha256")
    .update("webgl:ANGLE (Intel, Intel(R) UHD Graphics Direct3D11)||canvas:abc12345||env:Asia/Jakarta,1920,1080")
    .digest("hex");
  const hashPart = "#" + Buffer.from(dummyFp).toString("base64");
  return unquotedXsrf.slice(0, 128 - hashPart.length) + hashPart;
}

async function fetchHttp(url, options = {}, jar) {
  let currentUrl = url;
  let method = options.method || "GET";
  let data = options.data;
  let headers = {
    "User-Agent": CFG.UA,
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    ...(options.headers || {}),
  };

  const maxHops = 10;
  for (let hop = 0; hop < maxHops; hop++) {
    const cookieHeader = jar ? jar.getCookieHeader() : "";
    if (cookieHeader) headers["Cookie"] = cookieHeader;

    const res = await axios({
      url: currentUrl, method, data, headers,
      maxRedirects: 0,
      validateStatus: (status) => status >= 200 && status < 400,
      timeout: CFG.TIMEOUT_MS,
    });

    if (jar) jar.setFromHeaders(res.headers);

    if (res.status >= 300 && res.status < 400 && res.headers.location) {
      headers["Referer"] = currentUrl;
      currentUrl = new URL(res.headers.location, currentUrl).href;
      method = "GET";
      data = undefined;
      continue;
    }

    return { url: currentUrl, status: res.status, headers: res.headers, data: res.data };
  }

  throw new Error("Too many redirects");
}

function checkBase64Params(urlStr) {
  try {
    const parsed = new URL(urlStr);
    const keys = ["url", "link", "target", "go", "u", "dest"];
    for (const key of keys) {
      const val = parsed.searchParams.get(key);
      if (!val) continue;
      try {
        const decoded = Buffer.from(val, "base64").toString("utf-8");
        if (/^https?:\/\//i.test(decoded)) return decoded;
      } catch {}
      if (/^https?:\/\//i.test(val)) return val;
    }
  } catch {}
  return null;
}

async function resolveSafelinkuGateway(html, currentUrl, jar) {
  const formMatch = html.match(/<form[^>]+action=["']([^"']+)["'][^>]*>([\s\S]*?)<\/form>/i);
  const rayMatch = html.match(/name=["']ray_id["']\s+value=["']([^"']+)["']/i);
  const aliasMatch = html.match(/name=["']alias["']\s+value=["']([^"']+)["']/i);

  if (!formMatch || !rayMatch || !aliasMatch) return null;

  const actionUrl = formMatch[1];
  const rayId = rayMatch[1];
  const alias = aliasMatch[1];

  const parsedAction = new URL(actionUrl, currentUrl);
  const blogOrigin = `${parsedAction.protocol}//${parsedAction.host}`;
  const redirectUrl = `${blogOrigin}/redirect.php?ray_id=${encodeURIComponent(rayId)}&alias=${encodeURIComponent(alias)}`;

  const r2 = await fetchHttp(redirectUrl, { headers: { Referer: currentUrl } }, jar);
  const step1PageUrl = r2.url;

  const xsrf1 = jar.get("XSRF-TOKEN");
  if (!xsrf1) return null;

  const tokenPayload1 = generateSessionToken(xsrf1);
  const sessionHeaders = {
    Origin: blogOrigin,
    Referer: step1PageUrl,
    "Content-Type": "application/json",
    Accept: "application/json, text/plain, */*",
    "X-Requested-With": "XMLHttpRequest",
  };

  const sessionRes1 = await fetchHttp(`${blogOrigin}/api/session`, {
    method: "POST", headers: sessionHeaders,
    data: JSON.stringify({ _token: tokenPayload1 }),
  }, jar);

  let sessionData1 = {};
  try {
    sessionData1 = typeof sessionRes1.data === "object" ? sessionRes1.data : JSON.parse(sessionRes1.data);
  } catch {}

  const step = sessionData1.step || 1;
  let step2PageUrl = step1PageUrl;

  if (step === 1) {
    await sleep(800);
    const verifyRes = await fetchHttp(`${blogOrigin}/api/verify`, {
      method: "POST", headers: sessionHeaders,
      data: JSON.stringify({ _a: 0, captcha: null, passcode: null }),
    }, jar);

    let verifyData = {};
    try {
      verifyData = typeof verifyRes.data === "object" ? verifyRes.data : JSON.parse(verifyRes.data);
    } catch {}

    let target = verifyData.target || "/redirect.php";
    if (target.startsWith("/")) target = `${blogOrigin}${target}`;

    const r3 = await fetchHttp(target, { headers: { Referer: step1PageUrl } }, jar);
    step2PageUrl = r3.url;

    const xsrf2 = jar.get("XSRF-TOKEN") || xsrf1;
    sessionHeaders["Referer"] = step2PageUrl;
    await fetchHttp(`${blogOrigin}/api/session`, {
      method: "POST", headers: sessionHeaders,
      data: JSON.stringify({ _token: generateSessionToken(xsrf2) }),
    }, jar);
  }

  await sleep(1500);
  const key = 500;
  const size = `${(1920 + key) * 2}.${(1080 + key) * 2}`;

  sessionHeaders["Referer"] = step2PageUrl;
  const goRes = await fetchHttp(`${blogOrigin}/api/go`, {
    method: "POST", headers: sessionHeaders,
    data: JSON.stringify({ key, size }),
  }, jar);

  let goData = {};
  try {
    goData = typeof goRes.data === "object" ? goRes.data : JSON.parse(goRes.data);
  } catch { return null; }

  let readyUrl = goData.url;
  if (!readyUrl) return null;
  if (!/^https?:\/\//i.test(readyUrl)) readyUrl = new URL(readyUrl, blogOrigin).href;

  const rReady = await fetchHttp(readyUrl, { headers: { Referer: step2PageUrl } }, jar);
  const htmlReady = typeof rReady.data === "string" ? rReady.data : JSON.stringify(rReady.data);

  const destMatch = htmlReady.match(/window\.location\.href\s*=\s*["']([^"']+)["']/i);
  if (destMatch) return destMatch[1].replace(/\\\//g, "/").replace(/\\u0026/g, "&");

  return readyUrl;
}

async function safelinkuScrape(url, options = {}) {
  const onStep = typeof options.onStep === "function" ? options.onStep : () => {};
  try {
    if (!url || typeof url !== "string") throw new Error("Invalid URL.");
    const initialUrl = extractCleanUrl(url);
    const autoResolve = options.autoResolve !== false;

    onStep("safelinku", "Cek base64 param");
    const b64Check = checkBase64Params(initialUrl);
    if (b64Check) {
      onStep("safelinku", `Base64 hit: ${b64Check.slice(0, 60)}…`);
      if (autoResolve) {
        const chain = await autoResolveChain(b64Check, { onStep });
        if (chain) {
          return {
            status: true,
            result: {
              ...chain.result,
              originalUrl: initialUrl,
              destinationUrl: b64Check,
              providerChain: ["safelinku", chain.result.provider].filter(Boolean),
            },
          };
        }
      }
      return {
        status: true,
        result: {
          provider: "safelinku",
          title: "Safelinku Destination Link",
          originalUrl: initialUrl,
          destinationUrl: b64Check,
          url: b64Check,
          downloads: [{ type: "link", quality: "Direct Link", url: b64Check }],
        },
      };
    }

    const jar = new SimpleCookieJar();
    const visited = new Set();
    let currentUrl = initialUrl;
    const maxChain = 8;

    for (let hop = 0; hop < maxChain; hop++) {
      if (visited.has(currentUrl)) break;
      visited.add(currentUrl);

      onStep("safelinku", `Hop ${hop + 1}: ${currentUrl.slice(0, 70)}`);
      const res = await fetchHttp(currentUrl, {}, jar);
      currentUrl = res.url;
      const html = typeof res.data === "string" ? res.data : "";

      if (html.includes('name="ray_id"') || html.includes("name='ray_id'") || html.includes("redirect.php")) {
        onStep("safelinku", "Gateway form terdeteksi — resolve");
        const resolved = await resolveSafelinkuGateway(html, currentUrl, jar);
        if (resolved && resolved !== currentUrl) { currentUrl = resolved; break; }
      }

      const metaRefresh = html.match(/<meta[^>]+http-equiv=["']refresh["'][^>]+content=["'][^"']*url=([^"']+)["']/i);
      if (metaRefresh && metaRefresh[1]) {
        currentUrl = new URL(metaRefresh[1].trim(), currentUrl).href;
        continue;
      }

      const scriptRedirect = html.match(/window\.location(?:\.href)?\s*=\s*["'](https?:\/\/[^"']+)["']/i);
      if (scriptRedirect && scriptRedirect[1] && scriptRedirect[1] !== currentUrl) {
        currentUrl = scriptRedirect[1].replace(/\\\//g, "/");
        continue;
      }

      break;
    }

    if (currentUrl === initialUrl) throw new Error("Could not resolve Safelinku destination URL.");

    onStep("safelinku", `Destination: ${currentUrl.slice(0, 70)}`);
    if (autoResolve) {
      const chain = await autoResolveChain(currentUrl, { onStep });
      if (chain) {
        return {
          status: true,
          result: {
            ...chain.result,
            originalUrl: initialUrl,
            destinationUrl: currentUrl,
            providerChain: ["safelinku", chain.result.provider].filter(Boolean),
          },
        };
      }
    }

    return {
      status: true,
      result: {
        provider: "safelinku",
        title: "Safelinku Destination Link",
        originalUrl: initialUrl,
        destinationUrl: currentUrl,
        url: currentUrl,
        downloads: [{ type: "link", quality: "Direct Link", url: currentUrl }],
      },
    };
  } catch (error) {
    return { status: false, message: `Safelinku: ${error.message}` };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// resolver: sub2unlock
// ─────────────────────────────────────────────────────────────────────────────

function extractSub2UnlockLink(html) {
  const $ = cheerio.load(html);

  const nextDataScript = $("#__NEXT_DATA__").html();
  if (nextDataScript) {
    try {
      const parsed = JSON.parse(nextDataScript);
      const sinkData = parsed?.props?.pageProps?.sink?.data;
      if (sinkData?.unlocked_link) {
        return {
          title: sinkData.title || "Sub2Unlock Link",
          unlockedUrl: sinkData.unlocked_link,
          description: sinkData.description || "",
        };
      }
    } catch {}
  }

  const rawMatch = html.match(
    /["'](?:unlocked_link|destination|target_link|unlockedUrl)["']\s*:\s*["'](https?:\/\/[^"']+)["']/i,
  );
  if (rawMatch) {
    return {
      title: $("title").text().trim() || "Sub2Unlock Link",
      unlockedUrl: rawMatch[1].replace(/\\\//g, "/"),
      description: "",
    };
  }

  const atobMatch = html.match(/atob\(["']([A-Za-z0-9+/=]{16,})["']\)/);
  if (atobMatch) {
    try {
      const decoded = Buffer.from(atobMatch[1], "base64").toString("utf-8");
      if (/^https?:\/\//i.test(decoded)) {
        return {
          title: $("title").text().trim() || "Sub2Unlock Link",
          unlockedUrl: decoded,
          description: "",
        };
      }
    } catch {}
  }

  const btnLink = $(
    "a#btn-download, a.unlocked-btn, a[href*='mediafire.com'], a[href*='drive.google.com']",
  ).attr("href");
  if (btnLink && /^https?:\/\//i.test(btnLink)) {
    return {
      title: $("title").text().trim() || "Sub2Unlock Link",
      unlockedUrl: btnLink,
      description: "",
    };
  }

  return null;
}

async function sub2unlockScrape(url, options = {}) {
  const onStep = typeof options.onStep === "function" ? options.onStep : () => {};
  try {
    if (!url || typeof url !== "string") throw new Error("Invalid URL.");
    const cleanUrl = extractCleanUrl(url);
    const autoResolve = options.autoResolve !== false;

    onStep("sub2unlock", "Fetch halaman Sub2Unlock");
    let res;
    try {
      res = await axios.get(cleanUrl, {
        headers: {
          "User-Agent": CFG.UA,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        timeout: CFG.TIMEOUT_MS,
        maxRedirects: 5,
      });
    } catch (e) {
      if (cleanUrl.includes("sub2unlock.com")) {
        onStep("sub2unlock", "Mirror .com → .io");
        const altUrl = cleanUrl.replace("sub2unlock.com", "sub2unlock.io");
        res = await axios.get(altUrl, {
          headers: {
            "User-Agent": CFG.UA,
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
          },
          timeout: CFG.TIMEOUT_MS,
          maxRedirects: 5,
        });
      } else {
        throw e;
      }
    }

    const html = typeof res.data === "string" ? res.data : "";
    onStep("sub2unlock", "Ekstrak unlocked link");
    const extracted = extractSub2UnlockLink(html);

    if (!extracted || !extracted.unlockedUrl) {
      throw new Error("Could not find unlocked target link on Sub2Unlock page.");
    }

    const destinationUrl = extracted.unlockedUrl;

    if (autoResolve) {
      const chain = await autoResolveChain(destinationUrl, { onStep });
      if (chain) {
        return {
          status: true,
          result: {
            ...chain.result,
            title: chain.result.title || extracted.title,
            originalUrl: cleanUrl,
            destinationUrl,
            providerChain: ["sub2unlock", chain.result.provider].filter(Boolean),
          },
        };
      }
    }

    return {
      status: true,
      result: {
        provider: "sub2unlock",
        title: extracted.title,
        originalUrl: cleanUrl,
        destinationUrl,
        url: destinationUrl,
        downloads: [{ type: "link", quality: "Direct Link", url: destinationUrl }],
      },
    };
  } catch (error) {
    return { status: false, message: `Sub2Unlock: ${error.message}` };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// resolver: unshorten
// ─────────────────────────────────────────────────────────────────────────────

async function unshortenScrape(url, options = {}) {
  const onStep = typeof options.onStep === "function" ? options.onStep : () => {};
  try {
    if (!url || typeof url !== "string") throw new Error("Invalid URL.");
    const initialUrl = extractCleanUrl(url);
    const autoResolve = options.autoResolve !== false;

    let currentUrl = initialUrl;
    const visited = new Set();
    const hops = [currentUrl];
    const maxHops = 10;

    for (let i = 0; i < maxHops; i++) {
      if (visited.has(currentUrl)) break;
      visited.add(currentUrl);

      onStep("unshorten", `Hop ${i + 1}: ${currentUrl.slice(0, 70)}`);

      const res = await axios({
        url: currentUrl,
        method: "GET",
        headers: {
          "User-Agent": CFG.UA,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        maxRedirects: 0,
        validateStatus: (status) => status >= 200 && status < 400,
        timeout: 10000,
      });

      if (res.status >= 300 && res.status < 400 && res.headers.location) {
        const nextUrl = new URL(res.headers.location, currentUrl).href;
        currentUrl = nextUrl;
        hops.push(currentUrl);
        continue;
      }

      const html = typeof res.data === "string" ? res.data : "";
      const metaRefresh = html.match(
        /<meta[^>]+http-equiv=["']refresh["'][^>]+content=["'][^"']*url=([^"']+)["']/i,
      );
      if (metaRefresh && metaRefresh[1]) {
        const nextUrl = new URL(metaRefresh[1].trim(), currentUrl).href;
        currentUrl = nextUrl;
        hops.push(currentUrl);
        continue;
      }

      break;
    }

    if (autoResolve) {
      const chain = await autoResolveChain(currentUrl, { onStep });
      if (chain) {
        return {
          status: true,
          result: {
            ...chain.result,
            originalUrl: initialUrl,
            destinationUrl: currentUrl,
            hops,
            providerChain: ["unshorten", chain.result.provider].filter(Boolean),
          },
        };
      }
    }

    return {
      status: true,
      result: {
        provider: "unshorten",
        title: "Unshortened URL",
        originalUrl: initialUrl,
        destinationUrl: currentUrl,
        url: currentUrl,
        hops,
        downloads: [{ type: "link", quality: "Direct Link", url: currentUrl }],
      },
    };
  } catch (error) {
    return { status: false, message: `Unshorten: ${error.message}` };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// resolver: pixeldrain
// ─────────────────────────────────────────────────────────────────────────────

async function pixeldrainScrape(url, onStep = () => {}) {
  try {
    if (!url || typeof url !== "string") throw new Error("Invalid Pixeldrain URL or ID.");

    const idMatch =
      url.match(/pixeldrain\.com\/(?:u|d|l|api\/file|api\/filesystem)\/([a-zA-Z0-9_-]+)/i) ||
      url.match(/^([a-zA-Z0-9_-]{6,16})$/);
    if (!idMatch) throw new Error("Invalid Pixeldrain URL or ID.");
    const id = idMatch[1];

    const isFs = url.includes("/d/") || url.includes("/filesystem/");
    const isList = url.includes("/l/") || url.includes("/list/");

    if (isList) {
      onStep("pixeldrain", `Fetch list ${id}`);
      const res = await axios.get(`https://pixeldrain.com/api/list/${id}`, { timeout: CFG.TIMEOUT_MS });
      const data = res.data;
      if (!data || !data.success) throw new Error("Pixeldrain list not found.");
      return {
        status: true,
        result: {
          provider: "pixeldrain",
          title: data.title || "Pixeldrain Album",
          type: "album",
          trackCount: data.files?.length || 0,
          url: `https://pixeldrain.com/l/${id}`,
          downloads: (data.files || []).map((f) => ({
            type: "file",
            filename: f.name,
            size: formatBytes(f.size),
            url: `https://pixeldrain.com/api/file/${f.id}?download`,
          })),
        },
      };
    }

    if (isFs) {
      onStep("pixeldrain", `Fetch filesystem ${id}`);
      const res = await axios.get(`https://pixeldrain.com/api/filesystem/${id}?stat`, { timeout: CFG.TIMEOUT_MS });
      const data = res.data;
      const file = data?.path?.[data?.base_index ?? 0];
      if (!file) throw new Error("Pixeldrain file not found.");
      const directUrl = `https://pixeldrain.com/api/filesystem${file.path || "/" + id}?attach`;
      return {
        status: true,
        result: {
          provider: "pixeldrain",
          title: file.name || "Pixeldrain File",
          filename: sanitizeFilename(file.name || "pixeldrain_file"),
          size: formatBytes(file.file_size),
          filesize: formatBytes(file.file_size),
          url: directUrl,
          downloads: [{ type: "file", quality: "Direct Download", url: directUrl }],
        },
      };
    }

    onStep("pixeldrain", `Fetch file info ${id}`);
    try {
      const res = await axios.get(`https://pixeldrain.com/api/file/${id}/info`, { timeout: CFG.TIMEOUT_MS });
      const data = res.data;
      if (data && data.success) {
        const directUrl = `https://pixeldrain.com/api/file/${id}?download`;
        return {
          status: true,
          result: {
            provider: "pixeldrain",
            title: data.name || "Pixeldrain File",
            filename: sanitizeFilename(data.name || "pixeldrain_file"),
            size: formatBytes(data.size),
            filesize: formatBytes(data.size),
            url: directUrl,
            downloads: [{ type: "file", quality: "Direct Download", url: directUrl }],
          },
        };
      }
    } catch (_) {}

    onStep("pixeldrain", "Fallback filesystem stat");
    const fsRes = await axios.get(`https://pixeldrain.com/api/filesystem/${id}?stat`, { timeout: CFG.TIMEOUT_MS });
    const fsData = fsRes.data;
    const file = fsData?.path?.[fsData?.base_index ?? 0];
    if (!file) throw new Error("Pixeldrain file not found.");
    const directUrl = `https://pixeldrain.com/api/filesystem${file.path || "/" + id}?attach`;
    return {
      status: true,
      result: {
        provider: "pixeldrain",
        title: file.name || "Pixeldrain File",
        filename: sanitizeFilename(file.name || "pixeldrain_file"),
        size: formatBytes(file.file_size),
        filesize: formatBytes(file.file_size),
        url: directUrl,
        downloads: [{ type: "file", quality: "Direct Download", url: directUrl }],
      },
    };
  } catch (error) {
    return { status: false, message: `Pixeldrain: ${error.message || "Failed to resolve Pixeldrain link."}` };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// resolver: krakenfiles
// ─────────────────────────────────────────────────────────────────────────────

async function krakenfilesScrape(url, onStep = () => {}) {
  try {
    if (!url || typeof url !== "string") throw new Error("Invalid Krakenfiles URL.");
    const match = url.match(/krakenfiles\.com\/(?:view|download)\/([a-zA-Z0-9]+)/i);
    if (!match) throw new Error("Could not extract Krakenfiles file ID from URL.");
    const fileId = match[1];
    const pageUrl = `https://krakenfiles.com/view/${fileId}/file.html`;

    onStep("krakenfiles", "Fetch halaman Krakenfiles");
    const getRes = await axios.get(pageUrl, {
      headers: {
        "User-Agent": CFG.UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      },
      timeout: CFG.TIMEOUT_MS,
    });

    const html = getRes.data || "";
    if (html.includes("File not found") || html.includes("file-not-found")) {
      throw new Error("Krakenfiles file not found or has been deleted.");
    }

    const cookies = (getRes.headers["set-cookie"] || []).map((c) => c.split(";")[0]).join("; ");
    const $ = cheerio.load(html);

    let filename =
      $(".coin-info h5").text().trim() ||
      $(".coin-info").first().text().trim() ||
      $(".file-name").text().trim() ||
      $("h5.nk-block-title").text().trim() ||
      $("title").text().replace("- Krakenfiles.com", "").trim() ||
      "Krakenfiles File";
    if (filename.includes("\n")) filename = filename.split("\n")[0].trim();

    let size =
      $(".lead-text").filter((_, el) => /[\d.]+\s*(?:MB|GB|KB|bytes)/i.test($(el).text())).first().text().trim() ||
      $(".coin-info span").text().trim() ||
      $(".file-size").text().trim() ||
      "";
    if (!size) {
      const sizeMatch = html.match(/\b([\d.]+\s*(?:MB|GB|KB|bytes|B))\b/i);
      if (sizeMatch) size = sizeMatch[1];
    }

    const dlForm = $("#dl-form");
    const action = dlForm.attr("action") || `/download/${fileId}`;
    const token = dlForm.find('input[name="token"]').val() || "";
    const postUrl = action.startsWith("http") ? action : `https://krakenfiles.com${action}`;

    const formFields = {};
    dlForm.find("input").each((_, inp) => {
      const name = $(inp).attr("name");
      const val = $(inp).val();
      if (name) formFields[name] = val || "";
    });
    if (!formFields.token && token) formFields.token = token;

    let directUrl = "";
    try {
      onStep("krakenfiles", "POST form-token");
      const postRes = await axios.post(
        postUrl,
        new URLSearchParams(formFields).toString(),
        {
          headers: {
            "User-Agent": CFG.UA,
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "X-Requested-With": "XMLHttpRequest",
            Referer: pageUrl,
            Origin: "https://krakenfiles.com",
            Cookie: cookies,
          },
          timeout: CFG.TIMEOUT_MS,
        },
      );
      if (postRes.data?.status === "ok" && postRes.data?.url) directUrl = postRes.data.url;
    } catch (_) {}

    const downloadUrl = directUrl || postUrl;

    return {
      status: true,
      result: {
        provider: "krakenfiles",
        title: filename,
        filename: sanitizeFilename(filename),
        size: size || "Unknown",
        filesize: size || "Unknown",
        url: downloadUrl,
        downloads: [
          {
            type: "file",
            quality: directUrl ? "Direct Download" : "Download Page",
            url: downloadUrl,
          },
        ],
      },
    };
  } catch (error) {
    return { status: false, message: `Krakenfiles: ${error.message || "Failed to resolve Krakenfiles URL."}` };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// resolver: gdrive
// ─────────────────────────────────────────────────────────────────────────────

async function gdriveScrape(url, onStep = () => {}) {
  try {
    if (!url || typeof url !== "string") throw new Error("Invalid Google Drive URL or file ID.");

    const idMatch =
      url.match(
        /(?:drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)|docs\.google\.com\/[a-z]+\/d\/)([a-zA-Z0-9_-]+)/i,
      ) || url.match(/^([a-zA-Z0-9_-]{25,50})$/);
    if (!idMatch) throw new Error("Could not extract Google Drive file ID from URL.");
    const id = idMatch[1];

    const directUrl = `https://drive.usercontent.google.com/download?id=${id}&export=download&authuser=0`;
    const ucUrl = `https://docs.google.com/uc?export=download&id=${id}`;
    let title = "Google Drive File";

    try {
      onStep("gdrive", `Fetch metadata ${id.slice(0, 10)}…`);
      const res = await axios.get(`https://drive.google.com/file/d/${id}/view`, {
        headers: { "User-Agent": CFG.UA },
        timeout: 8000,
      });
      const $ = cheerio.load(res.data);
      title =
        $('meta[property="og:title"]').attr("content") ||
        $("title").text().replace(/ - Google Drive.*$/, "").trim() ||
        "Google Drive File";
    } catch (_) {}

    return {
      status: true,
      result: {
        provider: "gdrive",
        title,
        filename: sanitizeFilename(title),
        fileId: id,
        url: directUrl,
        downloads: [
          { type: "file", quality: "Direct Download (CDN)", url: directUrl },
          { type: "file", quality: "Export URL", url: ucUrl },
        ],
      },
    };
  } catch (error) {
    return { status: false, message: `GDrive: ${error.message || "Failed to resolve Google Drive link."}` };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// resolver: doodstream
// ─────────────────────────────────────────────────────────────────────────────

async function doodstreamScrape(url, onStep = () => {}) {
  try {
    if (!url || typeof url !== "string") throw new Error("Invalid Doodstream URL.");

    const idMatch = url.match(
      /(?:dood(?:stream)?\.[a-z]+|ds2play\.[a-z]+|doods\.[a-z]+|playmogo\.[a-z]+)\/(?:[ed]|download)\/([a-zA-Z0-9]+)/i,
    );
    if (!idMatch) throw new Error("Could not extract Doodstream video ID from URL.");
    const videoId = idMatch[1];

    const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
    const host = urlObj.host || "dood.to";
    const embedUrl = `https://${host}/e/${videoId}`;

    onStep("doodstream", `Fetch embed ${videoId}`);
    let res;
    try {
      res = await axios.get(embedUrl, {
        headers: {
          "User-Agent": CFG.UA,
          Referer: `https://${host}/`,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        },
        timeout: CFG.TIMEOUT_MS,
        maxRedirects: 5,
      });
    } catch (fetchErr) {
      if (
        fetchErr.response?.status === 403 ||
        fetchErr.response?.data?.includes?.("cf-mitigated") ||
        fetchErr.response?.data?.includes?.("challenges.cloudflare.com")
      ) {
        throw new Error("Doodstream is currently protected by Cloudflare challenge.");
      }
      throw fetchErr;
    }

    const html = res.data || "";
    if (html.includes("cf-mitigated") || html.includes("challenges.cloudflare.com")) {
      throw new Error("Doodstream is currently protected by Cloudflare challenge.");
    }
    if (html.includes("File not found") || html.includes("Video not found")) {
      throw new Error("Doodstream video not found or has been deleted.");
    }

    const $ = cheerio.load(html);
    const title =
      $('meta[property="og:title"]').attr("content") ||
      $(".title").first().text().trim() ||
      $("title").text().replace("- DoodStream", "").trim() ||
      "Doodstream Video";

    const passMatch = html.match(/\/pass_md5\/([a-zA-Z0-9_\-\/]+)/);
    if (!passMatch) throw new Error("Could not find pass_md5 token in Doodstream page.");

    const tokenMatch = html.match(/\?token=([a-zA-Z0-9]+)/);
    const token = tokenMatch ? tokenMatch[1] : "";

    const passUrl = `https://${host}/pass_md5/${passMatch[1]}`;
    onStep("doodstream", "Minta playable URL via pass_md5");
    const passRes = await axios.get(passUrl, {
      headers: { "User-Agent": CFG.UA, Referer: embedUrl },
      timeout: CFG.TIMEOUT_MS,
    });

    const rawDirectUrl = typeof passRes.data === "string" ? passRes.data.trim() : "";
    if (!rawDirectUrl || !rawDirectUrl.startsWith("http")) {
      throw new Error("Failed to retrieve playable URL from Doodstream pass endpoint.");
    }

    const finalUrl = `${rawDirectUrl}${getRandomString(10)}?token=${token}&expiry=${Date.now()}`;

    return {
      status: true,
      result: {
        provider: "doodstream",
        title,
        filename: sanitizeFilename(title),
        type: "video",
        url: finalUrl,
        downloads: [{ type: "video", quality: "Direct Stream (MP4)", url: finalUrl }],
      },
    };
  } catch (error) {
    return { status: false, message: `Doodstream: ${error.message || "Failed to resolve Doodstream URL."}` };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// resolver: catbox
// ─────────────────────────────────────────────────────────────────────────────

async function catboxScrape(url, onStep = () => {}) {
  try {
    if (!url || typeof url !== "string") throw new Error("Invalid Catbox URL.");
    const cleanUrl = url.trim();

    const albumMatch = cleanUrl.match(/catbox\.moe\/c\/([a-zA-Z0-9]+)/i);
    if (albumMatch) {
      onStep("catbox", `Fetch album ${albumMatch[1]}`);
      const res = await axios.get(cleanUrl, { timeout: CFG.TIMEOUT_MS });
      const $ = cheerio.load(res.data);
      const title = $(".title h1").text().trim() || $("title").text().trim() || "Catbox Collection";
      const downloads = [];

      $("a[href*='files.catbox.moe'], a[href*='litter.catbox.moe']").each((_, el) => {
        const href = $(el).attr("href");
        if (href && !downloads.some((d) => d.url === href)) {
          const fn = href.split("/").pop() || "file";
          downloads.push({ type: "file", filename: fn, quality: "Original", url: href });
        }
      });

      if (downloads.length === 0) throw new Error("No files found in Catbox collection.");

      return {
        status: true,
        result: {
          provider: "catbox",
          title,
          type: "album",
          trackCount: downloads.length,
          url: cleanUrl,
          downloads,
        },
      };
    }

    const targetUrl = cleanUrl.startsWith("http") ? cleanUrl : `https://${cleanUrl}`;
    const fileMatch = cleanUrl.match(/(?:files|litter|de)\.catbox\.moe\/([a-zA-Z0-9_.-]+)/i);

    let contentLength;
    try {
      onStep("catbox", "HEAD cek file");
      const headRes = await axios.head(targetUrl, { timeout: 10000 });
      contentLength = headRes.headers["content-length"];
    } catch (_) {
      try {
        onStep("catbox", "Range 0-0 fallback");
        const rangeRes = await axios.get(targetUrl, {
          headers: { Range: "bytes=0-0" },
          timeout: 10000,
        });
        contentLength =
          rangeRes.headers["content-length"] ||
          rangeRes.headers["content-range"]?.split("/")[1];
      } catch (err) {}
    }

    const filename = fileMatch
      ? fileMatch[1]
      : targetUrl.split("/").pop().split("?")[0] || "catbox_file";

    return {
      status: true,
      result: {
        provider: "catbox",
        title: filename,
        filename: sanitizeFilename(filename),
        size: formatBytes(contentLength),
        filesize: formatBytes(contentLength),
        url: targetUrl,
        downloads: [{ type: "file", quality: "Direct Download", url: targetUrl }],
      },
    };
  } catch (error) {
    return { status: false, message: `Catbox: ${error.message || "Failed to resolve Catbox URL."}` };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// resolver: tiktok (SnapTik API)
// ─────────────────────────────────────────────────────────────────────────────

const SNAPTIK = {
  salt: "sn4pt1k_v3r1fy2026",
  userAgents: [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15",
  ],
};

function snaptikSha256(text) { return crypto.createHash("sha256").update(text).digest(); }

function snaptikDecryptAes(id, encryptedBase64) {
  const data = Buffer.from(encryptedBase64, "base64");
  const iv = data.subarray(0, 16);
  const encrypted = data.subarray(16);
  const keySource = SNAPTIK.salt + ":" + id;
  const key = snaptikSha256(keySource);
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString("utf8");
}

function snaptikSolveChallenge(challenge) {
  switch (challenge.t) {
    case "b": return ((challenge.a ^ challenge.b) >> challenge.s) & 255;
    case "r": return challenge.n.reduce((m, f) => m + f, 0) * 2 + 1;
    case "c": return challenge.w.charCodeAt(challenge.i) * challenge.m;
    case "m": return ((challenge.a + challenge.b) % 100) * challenge.c;
    case "n": return challenge.a * challenge.b + challenge.b * challenge.c + challenge.c * challenge.a - challenge.a;
    default: throw new Error("Unknown challenge type: " + challenge.t);
  }
}

function extractTiktokSlug(url) {
  try {
    const u = new URL(url.startsWith("http") ? url : "https://" + url);
    const parts = u.pathname.split("/").filter(Boolean);
    const vidIdx = parts.indexOf("video");
    if (vidIdx !== -1 && parts[vidIdx + 1]) return "tiktok_" + parts[vidIdx + 1];
    const photoIdx = parts.indexOf("photo");
    if (photoIdx !== -1 && parts[photoIdx + 1]) return "tiktok_" + parts[photoIdx + 1];
    const last = parts[parts.length - 1] || "tiktok";
    return "tiktok_" + sanitizeFilename(last).slice(0, 40);
  } catch { return "tiktok_" + Date.now(); }
}

async function tiktokScrape(url, options = {}) {
  const onStep = typeof options.onStep === "function" ? options.onStep : () => {};
  try {
    if (!url || typeof url !== "string") throw new Error("Invalid TikTok URL.");

    const userAgent = SNAPTIK.userAgents[Math.floor(Math.random() * SNAPTIK.userAgents.length)];
    const client = axios.create({
      baseURL: "https://snaptik.app",
      timeout: 8000,
      headers: { "User-Agent": userAgent, Referer: "https://snaptik.app/", Origin: "https://snaptik.app" },
    });

    onStep("tiktok", "Minta token SnapTik");
    const resToken = await client.post(
      "/api/token",
      {},
      { headers: { "X-Requested-With": "XMLHttpRequest", "Content-Type": "application/json" } },
    );
    if (!resToken.data || !resToken.data.id || !resToken.data.p) {
      throw new Error("Failed to retrieve token from SnapTik API.");
    }

    const { id, p } = resToken.data;
    const decryptedJson = snaptikDecryptAes(id, p);
    const challenge = JSON.parse(decryptedJson);
    const _e = challenge._e, _h = challenge._h;
    delete challenge._e; delete challenge._h;

    const challengeResult = snaptikSolveChallenge(challenge);
    const xVerify = `${id}:${challengeResult}:${_e}:${_h}`;

    onStep("tiktok", "Ekstrak media URL");
    const resExtract = await client.get(
      `/api/extract?url=${encodeURIComponent(url)}`,
      { headers: { "X-Requested-With": "XMLHttpRequest", "X-Verify": xVerify } },
    );
    if (!resExtract.data || !resExtract.data.success || !resExtract.data.data) {
      throw new Error(resExtract.data?.message || "Failed to extract download details from SnapTik API.");
    }

    const info = resExtract.data.data;
    const downloads = [];
    if (info.downloadUrl) downloads.push({ type: "mp4", quality: "Normal", url: info.downloadUrl });
    if (info.hdDownloadUrl) {
      const hdUrl = info.hdDownloadUrl.startsWith("http") ? info.hdDownloadUrl : "https://snaptik.app" + info.hdDownloadUrl;
      downloads.push({ type: "mp4", quality: "HD", url: hdUrl });
    }
    if (Array.isArray(info.images) && info.images.length > 0) {
      for (let i = 0; i < info.images.length; i++) {
        const imgUrl = info.images[i];
        if (imgUrl && /^https?:\/\//i.test(imgUrl)) {
          downloads.push({ type: "jpg", quality: `Slide ${i + 1}`, url: imgUrl, filename: `slide_${String(i + 1).padStart(2, "0")}.jpg` });
        }
      }
    }
    if (downloads.length === 0) throw new Error("SnapTik tidak mengembalikan URL download apa pun.");

    const title = info.title || "TikTok Video";
    const slug = extractTiktokSlug(url);

    return {
      status: true,
      result: {
        provider: "tiktok",
        title,
        filename: sanitizeFilename(title) || slug,
        slug,
        thumbnail: info.thumbnail || "",
        type: info.type || (info.images?.length ? "photo" : "video"),
        author: info.author || {},
        stats: info.stats || {},
        url: downloads[0].url,
        downloads,
      },
    };
  } catch (error) {
    return { status: false, message: `TikTok: ${error.message || "Failed to resolve TikTok URL."}` };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// resolver: terabox (sechno.com API)
// ─────────────────────────────────────────────────────────────────────────────

function extractTeraBoxSlug(url) {
  try {
    const u = new URL(url.startsWith("http") ? url : "https://" + url);
    const m = u.pathname.match(/\/s\/([a-zA-Z0-9_-]+)/);
    if (m && m[1]) return "terabox_" + m[1];
    const last = u.pathname.split("/").filter(Boolean).pop() || "terabox";
    return "terabox_" + sanitizeFilename(last).slice(0, 40);
  } catch { return "terabox_" + Date.now(); }
}

async function teraboxScrape(url, options = {}) {
  const onStep = typeof options.onStep === "function" ? options.onStep : () => {};
  try {
    if (!url || typeof url !== "string") throw new Error("Invalid URL.");
    const cleanUrl = extractCleanUrl(url);

    onStep("terabox", "POST sechno.com/api/terabox");
    const res = await axios.post(
      "https://sechno.com/api/terabox",
      { url: cleanUrl },
      {
        headers: {
          "Content-Type": "application/json",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
          Referer: "https://sechno.com/tools/terabox-downloader",
        },
        timeout: 20000,
      },
    );

    const data = res.data;
    if (!data || !data.success) throw new Error(data?.error || "Failed to resolve TeraBox link.");

    const title = data.title || "TeraBox Shared Files";
    const files = Array.isArray(data.files) ? data.files : [];
    if (files.length === 0) throw new Error("No files found in TeraBox share.");

    const downloads = [];
    let totalSize = 0;

    files.forEach((f) => {
      if (f.isDir) return;
      if (f.size) totalSize += Number(f.size);

      if (f.downloadUrl) {
        downloads.push({
          type: "file",
          filename: f.filename || "terabox_file",
          size: f.sizeFormatted || (f.size ? `${f.size} B` : "Unknown"),
          quality: "Direct Download",
          url: f.downloadUrl,
        });
      }
      if (f.streamUrl) {
        downloads.push({
          type: "video",
          filename: f.filename || "terabox_file",
          size: f.sizeFormatted || (f.size ? `${f.size} B` : "Unknown"),
          quality: "Fast Stream (m3u8)",
          url: f.streamUrl,
        });
      }
    });

    if (downloads.length === 0) throw new Error("TeraBox share tidak punya file yang bisa di-download.");

    const firstThumb = files.find((f) => f.thumbUrl)?.thumbUrl || "";
    const slug = extractTeraBoxSlug(cleanUrl);

    return {
      status: true,
      result: {
        provider: "terabox",
        title,
        filename: sanitizeFilename(title),
        slug,
        thumbnail: firstThumb,
        type: "share",
        trackCount: downloads.length,
        totalFiles: files.length,
        filesize: totalSize ? formatBytes(totalSize) : "Unknown",
        originalUrl: cleanUrl,
        url: downloads[0].url,
        downloads,
      },
    };
  } catch (error) {
    return { status: false, message: `TeraBox: ${error.message || "Failed to resolve TeraBox URL."}` };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// auto-resolve chain
// ─────────────────────────────────────────────────────────────────────────────

async function autoResolveChain(url, opts = {}) {
  const onStep = typeof opts.onStep === "function" ? opts.onStep : () => {};
  if (!url) return null;

  if (/https?:\/\/(?:www\.)?mediafire\.com\//i.test(url)) {
    onStep("auto", "Auto-resolve MediaFire");
    const r = await mediafireScrape(url, onStep);
    if (r.status) return r;
    onStep("auto-fail", r.message); return null;
  }
  if (/https?:\/\/(?:www\.)?sfile\.(?:co|mobi)\//i.test(url)) {
    onStep("auto", "Auto-resolve SFile");
    const r = await sfileScrape(url, onStep);
    if (r.status) return r;
    onStep("auto-fail", r.message); return null;
  }
  if (/https?:\/\/(?:www\.)?safelinku\.(?:com|net|org|link|id)\//i.test(url) || /sfl\./i.test(url)) {
    onStep("auto", "Auto-resolve Safelinku");
    const r = await safelinkuScrape(url, { autoResolve: false, onStep });
    if (r.status) return r;
    onStep("auto-fail", r.message); return null;
  }
  if (/https?:\/\/(?:www\.)?sub2unlock\.(?:com|io|net)\//i.test(url)) {
    onStep("auto", "Auto-resolve Sub2Unlock");
    const r = await sub2unlockScrape(url, { autoResolve: false, onStep });
    if (r.status) return r;
    onStep("auto-fail", r.message); return null;
  }
  if (/https?:\/\/(?:www\.)?pixeldrain\.com\//i.test(url)) {
    onStep("auto", "Auto-resolve Pixeldrain");
    const r = await pixeldrainScrape(url, onStep);
    if (r.status) return r;
    onStep("auto-fail", r.message); return null;
  }
  if (/https?:\/\/(?:www\.)?krakenfiles\.com\//i.test(url)) {
    onStep("auto", "Auto-resolve Krakenfiles");
    const r = await krakenfilesScrape(url, onStep);
    if (r.status) return r;
    onStep("auto-fail", r.message); return null;
  }
  if (/https?:\/\/(?:drive\.google\.com|docs\.google\.com)\//i.test(url)) {
    onStep("auto", "Auto-resolve GDrive");
    const r = await gdriveScrape(url, onStep);
    if (r.status) return r;
    onStep("auto-fail", r.message); return null;
  }
  if (/(?:dood(?:stream)?\.[a-z]+|ds2play\.[a-z]+|doods\.[a-z]+|playmogo\.[a-z]+)/i.test(url)) {
    onStep("auto", "Auto-resolve Doodstream");
    const r = await doodstreamScrape(url, onStep);
    if (r.status) return r;
    onStep("auto-fail", r.message); return null;
  }
  if (/catbox\.moe/i.test(url)) {
    onStep("auto", "Auto-resolve Catbox");
    const r = await catboxScrape(url, onStep);
    if (r.status) return r;
    onStep("auto-fail", r.message); return null;
  }
  if (/(?:tiktok\.com|vt\.tiktok\.com|vm\.tiktok\.com)/i.test(url)) {
    onStep("auto", "Auto-resolve TikTok");
    const r = await tiktokScrape(url, { onStep });
    if (r.status) return r;
    onStep("auto-fail", r.message); return null;
  }
  if (/(?:terabox\.(?:com|app)|1024terabox\.com|teraboxapp\.com|freeterabox\.com|1024tera\.com|4funbox\.(?:com|co))/i.test(url)) {
    onStep("auto", "Auto-resolve TeraBox");
    const r = await teraboxScrape(url, { onStep });
    if (r.status) return r;
    onStep("auto-fail", r.message); return null;
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// dispatcher
// ─────────────────────────────────────────────────────────────────────────────

async function resolveAny(input, options = {}) {
  const onStep = typeof options.onStep === "function" ? options.onStep : () => {};
  const provider = detectProvider(input);

  if (provider === "mediafire") return mediafireScrape(input, onStep);
  if (provider === "sfile") return sfileScrape(input, onStep);
  if (provider === "safelinku") return safelinkuScrape(input, options);
  if (provider === "sub2unlock") return sub2unlockScrape(input, options);
  if (provider === "pixeldrain") return pixeldrainScrape(input, onStep);
  if (provider === "krakenfiles") return krakenfilesScrape(input, onStep);
  if (provider === "gdrive") return gdriveScrape(input, onStep);
  if (provider === "doodstream") return doodstreamScrape(input, onStep);
  if (provider === "catbox") return catboxScrape(input, onStep);
  if (provider === "tiktok") return tiktokScrape(input, { onStep });
  if (provider === "terabox") return teraboxScrape(input, { onStep });
  if (provider === "rekonise") return rekoniseScrape(input, options);

  onStep("auto", "Deteksi provider gagal — coba rekonise");
  const rk = await rekoniseScrape(input, options);
  if (rk.status) return rk;

  onStep("auto", "Rekonise gagal — coba unshorten");
  const un = await unshortenScrape(input, options);
  if (un.status) return un;

  return rk;
}

// ─────────────────────────────────────────────────────────────────────────────
// prompts helper
// ─────────────────────────────────────────────────────────────────────────────

const CANCEL = Symbol("cancel");

async function ask(config) {
  const res = await prompts(config, { onCancel: () => true });
  const key = config.name;
  if (res[key] === undefined) return CANCEL;
  return res[key];
}

async function askSelect(message, choices) { return ask({ type: "select", name: "v", message, choices }); }
async function askConfirm(message, initial = true) { return ask({ type: "confirm", name: "v", message, initial }); }
async function askText(message, validate) { return ask({ type: "text", name: "v", message, validate }); }

// ─────────────────────────────────────────────────────────────────────────────
// TUI
// ─────────────────────────────────────────────────────────────────────────────

function banner() {
  const art = [
    "╔═╗╔╦╗╔═╗╦═╗╦  ╦╔═╗╦ ╦╔╦╗",
    "╚═╗ ║ ╠═╣╠╦╝║  ║║ ╦╠═╣ ║ ",
    "╚═╝ ╩ ╩ ╩╩╚═╩═╝╩╚═╝╩ ╩ ╩ ",
  ];
  console.log(chalk.cyan(art.join("\n")));
  console.log(chalk.gray(`  ${APP.name} v${APP.version} · termux edition · by ${APP.credits}`));
  console.log(chalk.gray("─".repeat(56)));
  console.log(chalk.gray(`  DL → ${CFG.DL_ROOT}`));
  console.log("");
}

function resultTable(r, elapsedSec) {
  const t = new Table({
    colWidths: [16, 64],
    wordWrap: true,
    style: { border: ["gray"], head: [] },
  });
  t.push(["Provider", r.provider || "-"]);
  if (r.providerChain && r.providerChain.length > 1) t.push(["Chain", r.providerChain.join(" → ")]);
  if (r.title) t.push(["Title", r.title]);
  if (r.filename) t.push(["Filename", r.filename]);
  if (r.filesize) t.push(["Filesize", r.filesize]);
  if (r.slug) t.push(["Slug", r.slug]);
  if (r.fileId) t.push(["File ID", r.fileId]);
  if (r.type) t.push(["Type", r.type]);
  if (r.trackCount != null) t.push(["Files", String(r.trackCount)]);
  if (r.author && r.author.unique_id) t.push(["Author", "@" + r.author.unique_id]);
  if (r.stats && r.stats.playCount != null) t.push(["Plays", String(r.stats.playCount)]);
  t.push(["Original", r.originalUrl || "-"]);
  if (r.destinationUrl && r.destinationUrl !== r.url) t.push(["Destination", r.destinationUrl]);
  t.push(["Direct URL", r.url || "-"]);
  if (r.hops && r.hops.length > 1) t.push(["Hops", `${r.hops.length} redirect(s)`]);
  if (r.downloads && r.downloads.length > 1) t.push(["Downloads", `${r.downloads.length} item(s)`]);
  if (elapsedSec != null) t.push(["Elapsed", `${elapsedSec}s`]);
  return t.toString();
}

async function runResolveFlow(input, opts) {
  const spinner = makeSpinner("Init…").start();
  const onStep = (_key, msg) => spinner.set(msg);

  const startedAt = Date.now();
  const res = await resolveAny(input, { autoResolve: opts.autoResolve, onStep });
  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);

  spinner.stop();

  if (!res.status) {
    console.log(chalk.red("✘ ") + res.message);
    return null;
  }

  console.log("");
  console.log(chalk.cyan("┌ Result"));
  console.log(resultTable(res.result, elapsed));

  if (res.result.downloads && res.result.downloads.length > 1) {
    console.log("");
    console.log(chalk.cyan("┌ Downloads"));
    const dt = new Table({ colWidths: [36, 12, 16, 56], wordWrap: true, style: { border: ["gray"] } });
    dt.push([chalk.bold("Filename"), chalk.bold("Quality"), chalk.bold("Size"), chalk.bold("URL")]);
    for (const d of res.result.downloads) {
      dt.push([d.filename || "-", d.quality || d.type || "-", d.size || "-", d.url]);
    }
    console.log(dt.toString());
  }

  return res.result;
}

function saveResult(r) {
  ensureOutDir();
  const fname = `${(r.slug || r.filename || "result")}-${Date.now()}.json`;
  const fpath = path.join(CFG.OUT_DIR, fname);
  fs.writeFileSync(fpath, JSON.stringify(r, null, 2));
  console.log(chalk.green("✔ ") + "Saved: " + fpath);
}

async function downloadAllToStarlight(r) {
  const root = ensureDlRoot();
  const slug = sanitizeFilename(r.slug || r.filename || "starlight_" + Date.now());
  const destDir = path.join(root, slug);

  if (!r.downloads || r.downloads.length === 0) {
    console.log(chalk.yellow("! ") + "Tidak ada download entry.");
    return null;
  }

  console.log("");
  console.log(chalk.cyan("┌ Downloading → ") + chalk.white(destDir));

  const results = [];
  for (let i = 0; i < r.downloads.length; i++) {
    const d = r.downloads[i];
    if (!d.url || !/^https?:\/\//i.test(d.url)) continue;

    const fallbackExt =
      d.type === "mp4" ? "mp4" :
      d.type === "video" ? "mp4" :
      d.type === "jpg" ? "jpg" :
      resolveExtFromUrl(d.url, "bin");

    const baseName =
      d.filename && d.filename.trim().length > 0
        ? d.filename
        : `${sanitizeFilename(r.title || r.filename || slug)}_${d.quality || i + 1}.${fallbackExt}`;

    const spinner = makeSpinner(`[${i + 1}/${r.downloads.length}] ${baseName}`).start();

    try {
      const file = await downloadToFile(d.url, destDir, baseName, (_k, msg) => spinner.set(msg));
      spinner.stop(chalk.green("✔ ") + `${file.filename} (${formatBytes(file.size)})`);
      results.push({ ok: true, ...file });
    } catch (e) {
      spinner.stop(chalk.red("✘ ") + `${baseName}: ${e.message}`);
      results.push({ ok: false, error: e.message, url: d.url });
    }
  }

  console.log("");
  console.log(chalk.green("✔ ") + `Selesai. Folder: ${destDir}`);
  console.log(chalk.gray("  (buka File Manager → Download → Starlight)"));
  return { destDir, results };
}

async function promptAndResolve() {
  while (true) {
    const url = await askText(
      "URL (rekonise/mediafire/sfile/safelinku/sub2unlock/pixeldrain/krakenfiles/gdrive/doodstream/catbox/tiktok/terabox/shortener) — Ctrl+C untuk kembali",
      (v) => (v && v.trim().length > 3 ? true : "URL kosong."),
    );
    if (url === CANCEL) return "back";

    const autoResolve = await askConfirm("Auto-resolve provider chain?", true);
    if (autoResolve === CANCEL) return "back";

    const r = await runResolveFlow(url.trim(), { autoResolve });
    if (!r) {
      const after = await askSelect("Resolve gagal. Lanjut?", [
        { title: "Resolve lagi", value: "again" },
        { title: "Balik ke menu", value: "menu" },
      ]);
      if (after === CANCEL || after === "menu") return "back";
      if (after === "again") continue;
    }

    while (true) {
      const isMedia = r.provider === "tiktok" || r.provider === "terabox" ||
                      (r.providerChain && (r.providerChain.includes("tiktok") || r.providerChain.includes("terabox")));

      const choices = [
        { title: "Tampilkan direct URL", value: "show" },
        { title: "Save JSON ke out/", value: "save" },
        { title: "Download ke Download/Starlight/", value: "dl" },
        { title: "Resolve lagi", value: "again" },
        { title: "Balik ke menu", value: "menu" },
      ];
      if (isMedia) {
        choices.unshift({ title: "Auto-download semua → Download/Starlight/", value: "dl" });
      }

      const next = await askSelect("Lanjut?", choices);

      if (next === CANCEL || next === "menu") return "back";
      if (next === "again") break;

      if (next === "show") {
        console.log(chalk.green("✔ ") + "URL:");
        console.log("  " + chalk.underline(r.url));
        console.log(chalk.gray("  (Termux: tap-hold untuk copy)"));
      } else if (next === "save") {
        saveResult(r);
      } else if (next === "dl") {
        await downloadAllToStarlight(r);
      }
    }
  }
}

async function batchResolve() {
  const text = await askText("Tempel URL (pisah newline / koma / spasi) — Ctrl+C untuk kembali");
  if (text === CANCEL || !text) return "back";

  const urls = text.split(/[\s,\n]+/).map((s) => s.trim()).filter(Boolean);
  if (!urls.length) return "back";

  const autoResolve = await askConfirm("Auto-resolve provider chain?", true);
  if (autoResolve === CANCEL) return "back";

  const doDownload = await askConfirm("Auto-download semua ke Download/Starlight/?", false);
  if (doDownload === CANCEL) return "back";

  ensureOutDir();
  const results = [];

  for (let i = 0; i < urls.length; i++) {
    const u = urls[i];
    console.log("");
    console.log(chalk.cyan(`[${i + 1}/${urls.length}] `) + chalk.gray(u));
    const r = await runResolveFlow(u, { autoResolve });
    if (r && doDownload) await downloadAllToStarlight(r);
    results.push({ input: u, ...(r ? { result: r } : { failed: true }) });
  }

  const fpath = path.join(CFG.OUT_DIR, `batch-${Date.now()}.json`);
  fs.writeFileSync(fpath, JSON.stringify(results, null, 2));
  console.log("");
  console.log(chalk.green("✔ ") + `Batch done. Saved: ${fpath}`);

  const after = await askSelect("Setelah ini?", [
    { title: "Batch lagi", value: "again" },
    { title: "Balik ke menu", value: "menu" },
  ]);
  if (after === CANCEL || after === "menu") return "back";
  if (after === "again") return batchResolve();
  return "back";
}

async function listOut() {
  ensureOutDir();
  const files = fs.readdirSync(CFG.OUT_DIR).filter((f) => f.endsWith(".json"));
  console.log("");
  if (!files.length) {
    console.log(chalk.gray("  (kosong)"));
  } else {
    const t = new Table({ colWidths: [46, 10], style: { border: ["gray"] } });
    t.push([chalk.bold("File"), chalk.bold("Size")]);
    for (const f of files) {
      const st = fs.statSync(path.join(CFG.OUT_DIR, f));
      t.push([f, `${(st.size / 1024).toFixed(1)} KB`]);
    }
    console.log(t.toString());
  }
  await askSelect("Kembali?", [{ title: "Balik ke menu", value: "menu" }]);
  return "back";
}

async function listDownloads() {
  const root = ensureDlRoot();
  console.log("");
  console.log(chalk.cyan("┌ Download/Starlight/"));
  console.log(chalk.gray("  " + root));
  console.log("");

  try {
    const entries = fs.readdirSync(root, { withFileTypes: true });
    const dirs = entries.filter((e) => e.isDirectory());
    if (!dirs.length) {
      console.log(chalk.gray("  (kosong)"));
    } else {
      const t = new Table({ colWidths: [40, 10], style: { border: ["gray"] } });
      t.push([chalk.bold("Folder"), chalk.bold("Files")]);
      for (const d of dirs) {
        const files = fs.readdirSync(path.join(root, d.name)).filter((f) => !f.startsWith("."));
        t.push([d.name, String(files.length)]);
      }
      console.log(t.toString());
    }
  } catch (e) {
    console.log(chalk.red("✘ ") + e.message);
  }
  await askSelect("Kembali?", [{ title: "Balik ke menu", value: "menu" }]);
  return "back";
}

function showCredits() {
  const box = "═".repeat(56);
  console.log("");
  console.log(chalk.cyan("╔" + box + "╗"));
  console.log(chalk.cyan("║") + chalk.bold("  ✦ STARLIGHT — CREDITS".padEnd(56)) + chalk.cyan("║"));
  console.log(chalk.cyan("╠" + box + "╣"));
  const row = (k, v) =>
    console.log(chalk.cyan("║") + "  " + chalk.bold(k.padEnd(14)) + chalk.white(v.padEnd(38)) + chalk.cyan("║"));
  row("Author", APP.credits);
  row("Version", APP.version);
  row("Tool", APP.name);
  row("Providers", "Rekonise · MediaFire · SFile");
  row("", "Safelinku · Sub2Unlock · Unshorten");
  row("", "Pixeldrain · Krakenfiles");
  row("", "GDrive · Doodstream · Catbox");
  row("", "TikTok · TeraBox");
  console.log(chalk.cyan("╠" + box + "╣"));
  console.log(chalk.cyan("║") + "  " + chalk.gray("Dedicated to Patrick — keep building.".padEnd(54)) + chalk.cyan("║"));
  console.log(chalk.cyan("╚" + box + "╝"));
  console.log("");
}

async function creditsMenu() {
  showCredits();
  await askSelect("Kembali?", [{ title: "Balik ke menu", value: "menu" }]);
  return "back";
}

async function mainMenu() {
  banner();
  while (true) {
    const action = await askSelect("Pilih mode", [
      { title: "Resolve satu URL", value: "single" },
      { title: "Resolve batch URL", value: "batch" },
      { title: "Lihat folder out/ (JSON)", value: "out" },
      { title: "Lihat Download/Starlight/", value: "dls" },
      { title: "Credits", value: "credits" },
      { title: "Exit", value: "exit" },
    ]);

    if (action === CANCEL || action === "exit") {
      console.log(chalk.gray("bye."));
      process.exit(0);
    }

    if (action === "single") await promptAndResolve();
    else if (action === "batch") await batchResolve();
    else if (action === "out") await listOut();
    else if (action === "dls") await listDownloads();
    else if (action === "credits") await creditsMenu();

    console.log("");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// entry
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`${APP.name} v${APP.version} — by ${APP.credits}

Providers: Rekonise · MediaFire · SFile · Safelinku · Sub2Unlock
           Unshorten · Pixeldrain · Krakenfiles · GDrive
           Doodstream · Catbox · TikTok · TeraBox

Usage:
  node starlight.js                    interactive TUI
  node starlight.js <url>              resolve single
  node starlight.js <url> --json       JSON to stdout
  node starlight.js <url> --no-resolve disable auto-resolve chain
  node starlight.js <url> --download   resolve + auto download ke Download/Starlight/
  node starlight.js --batch <file>     batch (one URL per line)
  node starlight.js --batch <file> --download  batch + auto download
  node starlight.js --credits          print credits`);
    return;
  }

  if (args.includes("--credits")) {
    showCredits();
    return;
  }

  const wantJson = args.includes("--json");
  const noResolve = args.includes("--no-resolve");
  const autoDl = args.includes("--download");

  if (args.includes("--batch")) {
    const idx = args.indexOf("--batch");
    const file = args[idx + 1];
    if (!file || !fs.existsSync(file)) {
      console.error("File batch tidak ditemukan.");
      process.exit(1);
    }
    const urls = fs.readFileSync(file, "utf8").split(/\r?\n/).map((s) => s.trim()).filter(Boolean);

    ensureOutDir();
    const results = [];
    for (let i = 0; i < urls.length; i++) {
      process.stderr.write(`[${i + 1}/${urls.length}] ${urls[i]}\n`);
      const r = await resolveAny(urls[i], { autoResolve: !noResolve });
      if (r.status && autoDl) await downloadAllToStarlight(r.result);
      results.push({ input: urls[i], result: r });
    }
    const fpath = path.join(CFG.OUT_DIR, `batch-${Date.now()}.json`);
    fs.writeFileSync(fpath, JSON.stringify(results, null, 2));
    console.log(fpath);
    return;
  }

  const urlArg = args.find((a) => !a.startsWith("--"));

  if (urlArg) {
    const r = await resolveAny(urlArg, {
      autoResolve: !noResolve,
      onStep: (_k, msg) => {
        if (!wantJson) process.stderr.write(chalk.gray("• " + msg) + "\n");
      },
    });
    if (wantJson) {
      process.stdout.write(JSON.stringify(r, null, 2) + "\n");
    } else if (r.status) {
      console.log(resultTable(r.result, null));
      if (autoDl) await downloadAllToStarlight(r.result);
    } else {
      console.error(chalk.red("✘ ") + r.message);
      process.exit(2);
    }
    return;
  }

  await mainMenu();
}

main().catch((e) => {
  console.error(chalk.red("fatal: ") + (e && e.message ? e.message : String(e)));
  process.exit(1);
});
