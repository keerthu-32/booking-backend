import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/errors';
export declare const errorHandler: (error: Error | ApiError, req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export declare const notFoundHandler: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=errorHandler.d.ts.map