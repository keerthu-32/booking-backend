"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeToken = exports.verifyRefreshToken = exports.verifyAccessToken = exports.generateRefreshToken = exports.generateAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errors_1 = require("./errors");
const generateAccessToken = (payload) => {
    const secret = process.env.JWT_ACCESS_SECRET || 'access-secret';
    const expiresIn = process.env.JWT_ACCESS_EXPIRES || '15m';
    return jsonwebtoken_1.default.sign(payload, secret, { expiresIn });
};
exports.generateAccessToken = generateAccessToken;
const generateRefreshToken = (payload) => {
    const secret = process.env.JWT_REFRESH_SECRET || 'refresh-secret';
    const expiresIn = process.env.JWT_REFRESH_EXPIRES || '7d';
    return jsonwebtoken_1.default.sign(payload, secret, { expiresIn });
};
exports.generateRefreshToken = generateRefreshToken;
const verifyAccessToken = (token) => {
    try {
        const secret = process.env.JWT_ACCESS_SECRET || 'access-secret';
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        return decoded;
    }
    catch (error) {
        throw new errors_1.UnauthorizedError('Invalid or expired access token');
    }
};
exports.verifyAccessToken = verifyAccessToken;
const verifyRefreshToken = (token) => {
    try {
        const secret = process.env.JWT_REFRESH_SECRET || 'refresh-secret';
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        return decoded;
    }
    catch (error) {
        throw new errors_1.UnauthorizedError('Invalid or expired refresh token');
    }
};
exports.verifyRefreshToken = verifyRefreshToken;
const decodeToken = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.decode(token);
        return decoded;
    }
    catch (error) {
        return null;
    }
};
exports.decodeToken = decodeToken;
//# sourceMappingURL=jwt.js.map