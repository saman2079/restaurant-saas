import { Request, Response } from 'express';
import { AuthRequest } from '../../types';
export declare const authController: {
    login(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    logout(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getMe(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
};
//# sourceMappingURL=auth.controller.d.ts.map