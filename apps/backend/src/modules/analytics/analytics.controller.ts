import { Response } from 'express';
import { analyticsService } from './analytics.service';
import { sendSuccess, sendError } from '../../utils/response';
import { AuthRequest } from '../../types';

export const analyticsController = {
  async getSummary(req: AuthRequest, res: Response) {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const data = await analyticsService.getSummary(req.tenantId!, days);
      return sendSuccess(res, data);
    } catch (e: any) {
      return sendError(res, e.message);
    }
  },

  async getTopItems(req: AuthRequest, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const data = await analyticsService.getTopItems(req.tenantId!, limit);
      return sendSuccess(res, data);
    } catch (e: any) {
      return sendError(res, e.message);
    }
  },

  async getDailyRevenue(req: AuthRequest, res: Response) {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const data = await analyticsService.getDailyRevenue(req.tenantId!, days);
      return sendSuccess(res, data);
    } catch (e: any) {
      return sendError(res, e.message);
    }
  },

  async getHourlyDistribution(req: AuthRequest, res: Response) {
    try {
      const data = await analyticsService.getHourlyDistribution(req.tenantId!);
      return sendSuccess(res, data);
    } catch (e: any) {
      return sendError(res, e.message);
    }
  },

  async getAiInsight(req: AuthRequest, res: Response) {
    try {
      const { question } = req.body;
      if (!question) return sendError(res, 'سوال لازم است');
      const answer = await analyticsService.getAiInsight(req.tenantId!, question);
      return sendSuccess(res, { answer });
    } catch (e: any) {
      return sendError(res, e.message);
    }
  },
};