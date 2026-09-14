const { put } = require("@vercel/blob");

const MAX_BYTES = 4 * 1024 * 1024;

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    res.status(500).json({ error: "File storage is not configured on this server yet." });
    return;
  }

  try {
    const { filename, dataUrl } = req.body || {};
    if (!filename || typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) {
      res.status(400).json({ error: "Missing photo data." });
      return;
    }

    const match = dataUrl.match(/^data:([^;]+);base64,(.*)$/);
    if (!match) {
      res.status(400).json({ error: "Malformed photo data." });
      return;
    }

    const contentType = match[1];
    const buffer = Buffer.from(match[2], "base64");

    if (buffer.length > MAX_BYTES) {
      res.status(413).json({ error: "Photo too large." });
      return;
    }

    const safeName = filename.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const blob = await put(`vendor-applications/${Date.now()}-${safeName}`, buffer, {
      access: "public",
      contentType,
    });

    res.status(200).json({ url: blob.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not upload photo." });
  }
};
