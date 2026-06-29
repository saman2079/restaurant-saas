"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsController = void 0;
const analytics_service_1 = require("./analytics.service");
const response_1 = require("../../utils/response");
exports.analyticsController = {
    async getSummary(req, res) {
        try {
            const days = parseInt(req.query.days) || 30;
            const data = await analytics_service_1.analyticsService.getSummary(req.tenantId, days);
            return (0, response_1.sendSuccess)(res, data);
        }
        catch (e) {
            return (0, response_1.sendError)(res, e.message);
        }
    },
    async getTopItems(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const data = await analytics_service_1.analyticsService.getTopItems(req.tenantId, limit);
            return (0, response_1.sendSuccess)(res, data);
        }
        catch (e) {
            return (0, response_1.sendError)(res, e.message);
        }
    },
    async getDailyRevenue(req, res) {
        try {
            const days = parseInt(req.query.days) || 30;
            const data = await analytics_service_1.analyticsService.getDailyRevenue(req.tenantId, days);
            return (0, response_1.sendSuccess)(res, data);
        }
        catch (e) {
            return (0, response_1.sendError)(res, e.message);
        }
    },
    async getHourlyDistribution(req, res) {
        try {
            const data = await analytics_service_1.analyticsService.getHourlyDistribution(req.tenantId);
            return (0, response_1.sendSuccess)(res, data);
        }
        catch (e) {
            return (0, response_1.sendError)(res, e.message);
        }
    },
    async getAiInsight(req, res) {
        try {
            const { question } = req.body;
            if (!question)
                return (0, response_1.sendError)(res, 'سوال لازم است');
            const answer = await analytics_service_1.analyticsService.getAiInsight(req.tenantId, question);
            return (0, response_1.sendSuccess)(res, { answer });
        }
        catch (e) {
            return (0, response_1.sendError)(res, e.message);
        }
    },
};
//# sourceMappingURL=analytics.controller.js.map