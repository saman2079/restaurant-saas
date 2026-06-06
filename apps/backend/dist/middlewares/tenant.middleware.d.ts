import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
export declare const resolveTenant: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
//# sourceMappingURL=tenant.middleware.d.ts.map