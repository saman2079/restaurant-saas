"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const auth_service_1 = require("./auth.service");
const response_1 = require("../../utils/response");
const zod_1 = require("zod");
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('ایمیل نامعتبر'),
    password: zod_1.z.string().min(6, 'رمز عبور باید حداقل ۶ کاراکتر باشد'),
});
exports.authController = {
    async login(req, res) {
        try {
            const body = loginSchema.parse(req.body);
            const result = await auth_service_1.authService.login(body.email, body.password);
            return (0, response_1.sendSuccess)(res, result, 'ورود موفق');
        }
        catch (error) {
            return (0, response_1.sendError)(res, error.message, 400);
        }
    },
    async logout(req, res) {
        try {
            const token = req.headers.authorization?.split(' ')[1];
            await auth_service_1.authService.logout(token);
            return (0, response_1.sendSuccess)(res, null, 'خروج موفق');
        }
        catch (error) {
            return (0, response_1.sendError)(res, error.message);
        }
    },
    async getMe(req, res) {
        try {
            const user = await auth_service_1.authService.getMe(req.user.userId);
            return (0, response_1.sendSuccess)(res, user);
        }
        catch (error) {
            return (0, response_1.sendError)(res, error.message, 404);
        }
    },
};
//# sourceMappingURL=auth.controller.js.map