"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.authorizeRole = exports.authenticateToken = void 0;
const jwt_1 = require("../utils/jwt");
const errors_1 = require("../utils/errors");
const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            throw new errors_1.UnauthorizedError('Access token is required');
        }
        const payload = (0, jwt_1.verifyAccessToken)(token);
        // ensure payload carries a userId alias for compatibility
        payload.userId = payload.id;
        req.user = payload;
        req.userId = payload.id;
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.authenticateToken = authenticateToken;
const authorizeRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new errors_1.UnauthorizedError('User not authenticated'));
        }
        if (!roles.includes(req.user.role)) {
            return next(new errors_1.ForbiddenError('Insufficient permissions'));
        }
        next();
    };
};
exports.authorizeRole = authorizeRole;
const optionalAuth = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (token) {
            const payload = (0, jwt_1.verifyAccessToken)(token);
            payload.userId = payload.id;
            req.user = payload;
            req.userId = payload.id;
        }
        next();
    }
    catch (error) {
        next();
    }
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.js.map