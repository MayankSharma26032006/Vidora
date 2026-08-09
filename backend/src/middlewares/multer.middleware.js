import multer from "multer";
import os from "os";
import path from "path";
import crypto from "crypto";




export const TEMP_DIR = os.tmpdir();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, TEMP_DIR);
  },
  filename: function (req, file, cb) {
    
    
    
    const ext = path.extname(file.originalname || "").replace(/[^a-zA-Z0-9.]/g, "").slice(0, 10);
    cb(null, `${Date.now()}-${crypto.randomUUID()}${ext}`);
  }
});

export const upload = multer({
  storage,
  
  
  limits: {
    fileSize: 500 * 1024 * 1024, 
    files: 2
  }
});