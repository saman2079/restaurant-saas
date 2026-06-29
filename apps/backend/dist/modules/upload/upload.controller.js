"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadController = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const response_1 = require("../../utils/response");
const UPLOAD_DIR = path_1.default.join(process.cwd(), "uploads");
// فولدر uploads رو بساز اگه نبود
if (!fs_1.default.existsSync(UPLOAD_DIR)) {
    fs_1.default.mkdirSync(UPLOAD_DIR, { recursive: true });
}
exports.uploadController = {
    async uploadImage(req, res) {
        try {
            if (!req.file)
                return (0, response_1.sendError)(res, "فایلی ارسال نشده");
            const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${req.file.mimetype.split("/")[1]}`;
            const filepath = path_1.default.join(UPLOAD_DIR, filename);
            fs_1.default.writeFileSync(filepath, req.file.buffer);
            const url = `/uploads/${filename}`;
            return (0, response_1.sendSuccess)(res, { url });
        }
        catch (e) {
            return (0, response_1.sendError)(res, e.message);
        }
    },
};
//# sourceMappingURL=upload.controller.js.map