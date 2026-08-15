import fs from "fs";
import path from "path";
import { incrementViewer } from "./viewers.js";

// =========================
// User Agents
// =========================
const NEW_UA = "SUPER2026";
const OLD_UA = "SUPERTVLIVE2026";

// =========================
// فيديو الاستجابة للـ UA القديم
// =========================
const FALLBACK_VIDEO =
  "https://github.com/himasabry/video/raw/refs/heads/main/output.m3u8";

export default async function handler(req, res) {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).send("Missing id");
    }

    const ua = (req.headers["user-agent"] || "").toLowerCase();

    // =========================
    // عداد المشاهدين
    // =========================
    incrementViewer(id);

    // =========================
    // UA القديم
    // =========================
    if (
      ua.includes(OLD_UA.toLowerCase()) ||
      ua.includes("superlivetv")
    ) {
      return res.redirect(302, FALLBACK_VIDEO);
    }

    // =========================
    // السماح للتطبيق فقط
    // =========================
    if (!ua.includes(NEW_UA.toLowerCase())) {
      return res.status(403).send("Forbidden");
    }

    // =========================
    // قراءة channels.json
    // =========================
    const filePath = path.join(
      process.cwd(),
      "data",
      "channels.json"
    );

    if (!fs.existsSync(filePath)) {
      return res.status(500).send("channels.json not found");
    }

    const data = JSON.parse(
      fs.readFileSync(filePath, "utf8")
    );

    // =========================
    // البحث عن القناة
    // =========================
    let channel = null;

    for (const group of Object.values(data)) {
      if (!Array.isArray(group)) continue;

      const found = group.find(
        ch => String(ch.id) === String(id)
      );

      if (found) {
        channel = found;
        break;
      }
    }

    // =========================
    // القناة غير موجودة
    // =========================
    if (!channel) {
      return res.status(404).send("Channel not found");
    }

    if (!channel.url) {
      return res.status(404).send("Channel URL missing");
    }

    // =========================
    // القنوات العادية
    // الرابط الأصلي كما هو
    // =========================
    if (!channel.url.toLowerCase().includes("ostora")) {
      return res
        .status(302)
        .setHeader("Location", channel.url)
        .end();
    }

    // =========================
    // OSTORA
    // =========================
    const cleanUrl = channel.url.split("#")[0];

    const response = await fetch(cleanUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://ostora.pages.dev/"
      }
    });

    if (!response.ok) {
      return res.status(response.status).send(
        `Upstream error: ${response.status}`
      );
    }

    return res
      .status(302)
      .setHeader("Location", response.url)
      .end();

  } catch (e) {
    console.error("PLAY ERROR:", e);

    return res.status(500).send(
      "Server error: " + e.message
    );
  }
}
