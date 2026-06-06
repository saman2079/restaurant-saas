import { Request, Response } from 'express';
import { AuthRequest } from '../../types';
export declare const tenantController: {
    getAll(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getBySlug(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    create(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    update(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    toggleActive(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
};
//# sourceMappingURL=tenant.controller.d.ts.map