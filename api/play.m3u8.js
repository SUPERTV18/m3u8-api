import fs from "fs";
import path from "path";
import { incrementViewer } from "./viewers.js";

// User-Agent الخاص بالتطبيق
const NEW_UA = "SUPER2026";

// User-Agent القديم
const OLD_UA = "SUPERTVLIVE2026";

// فيديو المصيدة
const TRAP_VIDEO =
  "https://github.com/himasabry/video/raw/refs/heads/main/output.m3u8";

export default async function handler(req, res) {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).send("Missing id");
    }

    const ua = req.headers["user-agent"] || "";

    // =====================================
    // تسجيل معلومات الطلب
    // =====================================
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket?.remoteAddress ||
      "unknown";

    console.log("========== PLAY ==========");
    console.log("ID:", id);
    console.log("IP:", ip);
    console.log("UA:", ua);
    console.log("TIME:", new Date().toISOString());
    console.log("==========================");

    // =====================================
    // عداد المشاهدين
    // =====================================
    incrementViewer(id);

    // =====================================
    // 🔴 User-Agent القديم → المصيدة
    // =====================================
    if (ua.toLowerCase().includes(OLD_UA.toLowerCase())) {
      return res.redirect(302, TRAP_VIDEO);
    }

    // =====================================
    // ❌ User-Agent غير معروف
    // =====================================
    if (!ua.toLowerCase().includes(NEW_UA.toLowerCase())) {
      return res.status(403).send("Forbidden");
    }

    // =====================================
    // قراءة القنوات
    // =====================================
    const filePath = path.join(
      process.cwd(),
      "data",
      "channels.json"
    );

    const data = JSON.parse(
      fs.readFileSync(filePath, "utf8")
    );

    // =====================================
    // البحث عن القناة
    // =====================================
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

    // =====================================
    // القناة غير موجودة
    // =====================================
    if (!channel) {
      return res.status(404).send("Channel not found");
    }

    if (!channel.url) {
      return res.status(404).send("Channel URL missing");
    }

    // =====================================
    // تشغيل الرابط الأصلي كما هو
    // =====================================
    return res
      .status(302)
      .setHeader("Location", channel.url)
      .end();

  } catch (e) {
    console.error("PLAY ERROR:", e);

    return res.status(500).send(
      "Server error"
    );
  }
}
