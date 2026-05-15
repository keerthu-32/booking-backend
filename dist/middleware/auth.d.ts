import { Request, Response, NextFunction } from 'express';
import { JWTPayload } from '../utils/jwt';
declare global {
    namespace Express {
        interface Request {
            user?: JWTPayload;
            userId?: string;
        }
    }
}
export declare const authenticateToken: (req: Request, res: Response, next: NextFunction) => void;
export declare const authorizeRole: (...roles: string[]) => (req: Request, res: Response, next: NextFunction) => void;
export declare const optionalAuth: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map