import { Response } from 'express';
import { ApiResponse } from '../types';
export declare const sendSuccess: <T>(res: Response, data: T, message?: string, statusCode?: number, pagination?: ApiResponse["pagination"]) => Response<any, Record<string, any>>;
export declare const sendError: (res: Response, message: string, statusCode?: number, error?: any) => Response<any, Record<string, any>>;
//# sourceMappingURL=response.d.ts.map