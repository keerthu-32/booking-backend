export interface JWTPayload {
    id: string;
    userId?: string;
    email: string;
    role: 'user' | 'admin';
    iat?: number;
    exp?: number;
}
export declare const generateAccessToken: (payload: Omit<JWTPayload, "iat" | "exp">) => string;
export declare const generateRefreshToken: (payload: Omit<JWTPayload, "iat" | "exp">) => string;
export declare const verifyAccessToken: (token: string) => JWTPayload;
export declare const verifyRefreshToken: (token: string) => JWTPayload;
export declare const decodeToken: (token: string) => JWTPayload | null;
//# sourceMappingURL=jwt.d.ts.map