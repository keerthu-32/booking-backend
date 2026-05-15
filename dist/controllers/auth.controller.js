"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.refreshToken = exports.login = exports.register = void 0;
const auth_service_1 = require("../services/auth.service");
const catchAsync_1 = require("../utils/catchAsync");
const validators_1 = require("../validators");
const errors_1 = require("../utils/errors");
exports.register = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const validatedData = validators_1.registerSchema.safeParse(req.body);
    if (!validatedData.success) {
        const errors = validatedData.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
        }));
        throw new errors_1.ValidationError('Validation failed', errors);
    }
    const result = await auth_service_1.authService.register(validatedData.data);
    res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'User registered successfully',
        data: {
            user: result.user,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
        },
    });
});
exports.login = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const validatedData = validators_1.loginSchema.safeParse(req.body);
    if (!validatedData.success) {
        const errors = validatedData.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
        }));
        throw new errors_1.ValidationError('Validation failed', errors);
    }
    const result = await auth_service_1.authService.login(validatedData.data.email, validatedData.data.password);
    res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Login successful',
        data: {
            user: result.user,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
        },
    });
});
exports.refreshToken = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const validatedData = validators_1.refreshTokenSchema.safeParse(req.body);
    if (!validatedData.success) {
        const errors = validatedData.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
        }));
        throw new errors_1.ValidationError('Validation failed', errors);
    }
    const result = await auth_service_1.authService.refreshAccessToken(validatedData.data.refreshToken);
    res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Access token refreshed',
        data: result,
    });
});
exports.logout = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.userId) {
        throw new errors_1.ValidationError('User not found');
    }
    await auth_service_1.authService.logout(req.userId);
    res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Logout successful',
    });
});
//# sourceMappingURL=auth.controller.js.map