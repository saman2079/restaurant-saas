"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const profile_controller_1 = require("./profile.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.get('/', profile_controller_1.profileController.getMe);
router.patch('/', profile_controller_1.profileController.update);
exports.default = router;
//# sourceMappingURL=profile.routes.js.map