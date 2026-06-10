import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { sendSuccess, sendError } from "../../utils/response";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

// فولدر uploads رو بساز اگه نبود
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export const uploadController = {
  async uploadImage(req: Request, res: Response) {
    try {
      if (!req.file) return sendError(res, "فایلی ارسال نشده");

      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${req.file.mimetype.split("/")[1]}`;
      const filepath = path.join(UPLOAD_DIR, filename);

      fs.writeFileSync(filepath, req.file.buffer);

      const url = `${req.protocol}://${req.get("host")}/uploads/${filename}`;
      return sendSuccess(res, { url });
    } catch (e: any) {
      return sendError(res, e.message);
    }
  },
};
