"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const User_1 = require("../models/User");
const jwt_1 = require("../utils/jwt");
const errors_1 = require("../utils/errors");
class AuthService {
    async register(userData) {
        // Check if user exists
        const existingUser = await User_1.User.findOne({ email: userData.email });
        if (existingUser) {
            throw new errors_1.ConflictError('Email already registered');
        }
        // Create new user
        const user = new User_1.User({
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            passwordHash: userData.password,
            phone: userData.phone,
            isVerified: true, // For simplicity, auto-verify in demo
        });
        await user.save();
        // Generate tokens
        const accessToken = (0, jwt_1.generateAccessToken)({
            id: user._id.toString(),
            email: user.email,
            role: user.role,
        });
        const refreshToken = (0, jwt_1.generateRefreshToken)({
            id: user._id.toString(),
            email: user.email,
            role: user.role,
        });
        // Store refresh token
        user.refreshToken = refreshToken;
        await user.save();
        return {
            user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
            },
            accessToken,
            refreshToken,
        };
    }
    async login(email, password) {
        // Find user
        const user = await User_1.User.findOne({ email });
        if (!user) {
            throw new errors_1.UnauthorizedError('Invalid email or password');
        }
        // Verify password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            throw new errors_1.UnauthorizedError('Invalid email or password');
        }
        // Generate tokens
        const accessToken = (0, jwt_1.generateAccessToken)({
            id: user._id.toString(),
            email: user.email,
            role: user.role,
        });
        const refreshToken = (0, jwt_1.generateRefreshToken)({
            id: user._id.toString(),
            email: user.email,
            role: user.role,
        });
        // Store refresh token
        user.refreshToken = refreshToken;
        await user.save();
        return {
            user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
            },
            accessToken,
            refreshToken,
        };
    }
    async refreshAccessToken(refreshToken) {
        // Verify refresh token
        const user = await User_1.User.findOne({ refreshToken });
        if (!user) {
            throw new errors_1.UnauthorizedError('Invalid refresh token');
        }
        // Generate new access token
        const accessToken = (0, jwt_1.generateAccessToken)({
            id: user._id.toString(),
            email: user.email,
            role: user.role,
        });
        return { accessToken };
    }
    async logout(userId) {
        await User_1.User.findByIdAndUpdate(userId, { refreshToken: undefined });
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
//# sourceMappingURL=auth.service.js.map