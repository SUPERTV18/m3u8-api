import fs from "fs";
import path from "path";
import { incrementViewer } from "./viewers.js";

const REQUIRED_UA = "SUPER2026";

export default function handler(req, res) {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).send("Missing id");
    }

    const ua = req.headers["user-agent"] || "";

    if (!ua.toLowerCase().includes(REQUIRED_UA.toLowerCase())) {
      return res.status(403).send("Forbidden");
    }

    incrementViewer(id);

    const filePath = path.join(
      process.cwd(),
      "data",
      "channels.json"
    );

    const data = JSON.parse(
      fs.readFileSync(filePath, "utf8")
    );

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

    if (!channel) {
      return res.status(404).send("Channel not found");
    }

    if (!channel.url) {
      return res.status(404).send("URL missing");
    }

    // إرسال الرابط الأصلي كما هو
    res.statusCode = 302;
    res.setHeader("Location", channel.url);
    res.end();

  } catch (e) {
    console.error("PLAY ERROR:", e);

    return res.status(500).send(
      "Server error: " + e.message
    );
  }
}
