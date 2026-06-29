"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cashierController = void 0;
const cashier_service_1 = require("./cashier.service");
const response_1 = require("../../utils/response");
exports.cashierController = {
    async getActiveTables(req, res) {
        try {
            const tables = await cashier_service_1.cashierService.getActiveTables(req.tenantId);
            return (0, response_1.sendSuccess)(res, tables);
        }
        catch (e) {
            console.error("====== CASHIER ERROR ======");
            console.error(e);
            console.error(e.stack);
            return (0, response_1.sendError)(res, e.message);
        }
    },
    async payTable(req, res) {
        const tableNumber = Number(req.params.tableNumber);
        const result = await cashier_service_1.cashierService.payTable(req.tenantId, tableNumber);
        return (0, response_1.sendSuccess)(res, result);
    },
    async getTableDetail(req, res) {
        try {
            const tableNumber = parseInt(req.params.tableNumber);
            const detail = await cashier_service_1.cashierService.getTableDetail(req.tenantId, tableNumber);
            return (0, response_1.sendSuccess)(res, detail);
        }
        catch (e) {
            return (0, response_1.sendError)(res, e.message);
        }
    },
    async closeTable(req, res) {
        try {
            const tableNumber = parseInt(req.params.tableNumber);
            const result = await cashier_service_1.cashierService.closeTable(req.tenantId, tableNumber);
            return (0, response_1.sendSuccess)(res, result, `میز ${tableNumber} بسته شد`);
        }
        catch (e) {
            return (0, response_1.sendError)(res, e.message);
        }
    },
};
//# sourceMappingURL=cashier.controller.js.map