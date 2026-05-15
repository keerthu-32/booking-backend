import { IUser } from '../models/User';
export declare class AuthService {
    register(userData: {
        firstName: string;
        lastName: string;
        email: string;
        password: string;
        phone: string;
    }): Promise<{
        user: Partial<IUser>;
        accessToken: string;
        refreshToken: string;
    }>;
    login(email: string, password: string): Promise<{
        user: Partial<IUser>;
        accessToken: string;
        refreshToken: string;
    }>;
    refreshAccessToken(refreshToken: string): Promise<{
        accessToken: string;
    }>;
    logout(userId: string): Promise<void>;
}
export declare const authService: AuthService;
//# sourceMappingURL=auth.service.d.ts.map