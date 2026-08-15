import fs from "fs";
import path from "path";

export default function handler(req, res) {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Missing id"
      });
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
      return res.status(500).json({
        success: false,
        error: "channels.json not found"
      });
    }

    const data = JSON.parse(
      fs.readFileSync(filePath, "utf8")
    );

    // =========================
    // البحث عن القناة
    // =========================
    let channel = null;
    let category = null;

    for (const [group, channels] of Object.entries(data)) {

      if (!Array.isArray(channels)) {
        continue;
      }

      const found = channels.find(
        ch => String(ch.id) === String(id)
      );

      if (found) {
        channel = found;
        category = group;
        break;
      }
    }

    // =========================
    // القناة غير موجودة
    // =========================
    if (!channel) {
      return res.status(404).json({
        success: false,
        error: "Channel not found",
        id: String(id)
      });
    }

    // =========================
    // الرابط غير موجود
    // =========================
    if (!channel.url) {
      return res.status(404).json({
        success: false,
        error: "Channel URL missing",
        id: String(id),
        name: channel.name || ""
      });
    }

    // =========================
    // إرجاع البيانات للاختبار
    // =========================
    return res.status(200).json({
      success: true,
      id: String(channel.id),
      name: channel.name || "",
      category: category,
      url: channel.url,
      headers: channel.headers || {}
    });

  } catch (error) {

    console.error("PLAY TEST ERROR:", error);

    return res.status(500).json({
      success: false,
      error: "Server error",
      message: error.message
    });
  }
}
