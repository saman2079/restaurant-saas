import { Response } from 'express';
import { AuthRequest } from '../../types';
export declare const orderController: {
    create(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getAll(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getById(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    updateStatus(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
};
//# sourceMappingURL=order.controller.d.ts.map