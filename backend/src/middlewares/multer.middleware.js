import multer from "multer";
import os from "os";
import path from "path";
import crypto from "crypto";

// Temp files land in the OS temp dir (NOT public/) so uploaded videos are never
// served statically while waiting for Cloudinary, and the directory always
// exists on a fresh deploy. Files are deleted right after the Cloudinary upload.
export const TEMP_DIR = os.tmpdir();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, TEMP_DIR);
  },
  filename: function (req, file, cb) {
    // Never trust client filenames: they collide (two "video.mp4" uploads
    // would overwrite each other) and can contain path traversal. Keep only
    // a safe extension so Cloudinary can sniff the real type anyway.
    const ext = path.extname(file.originalname || "").replace(/[^a-zA-Z0-9.]/g, "").slice(0, 10);
    cb(null, `${Date.now()}-${crypto.randomUUID()}${ext}`);
  }
});

export const upload = multer({
  storage,
  // Guard against runaway uploads filling the server disk (Render's filesystem
  // is small and ephemeral). Cloudinary enforces its own tighter limits.
  limits: {
    fileSize: 500 * 1024 * 1024, // 500 MB
    files: 2
  }
});