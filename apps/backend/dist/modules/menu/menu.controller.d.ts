import { Response } from 'express';
import { AuthRequest } from '../../types';
export declare const menuController: {
    getFullMenu(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getCategories(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    createCategory(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    updateCategory(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    deleteCategory(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getItems(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    createItem(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    updateItem(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    deleteItem(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
};
//# sourceMappingURL=menu.controller.d.ts.map