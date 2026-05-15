"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.errorHandler = void 0;
const errors_1 = require("../utils/errors");
const errorHandler = (error, req, res, next) => {
    console.error('Error:', error);
    if (error instanceof errors_1.ApiError) {
        return res.status(error.statusCode).json({
            success: false,
            statusCode: error.statusCode,
            message: error.message,
            errors: error.errors || [],
        });
    }
    // Handle Mongoose validation error
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            statusCode: 400,
            message: 'Validation Error',
            errors: [{ message: error.message }],
        });
    }
    // Handle Mongoose duplicate key error
    if (error.code === 11000) {
        const field = Object.keys(error.keyValue)[0];
        return res.status(409).json({
            success: false,
            statusCode: 409,
            message: `${field} already exists`,
            errors: [{ message: `${field} already exists`, field }],
        });
    }
    // Default error response
    return res.status(500).json({
        success: false,
        statusCode: 500,
        message: error.message || 'Internal Server Error',
        errors: [],
    });
};
exports.errorHandler = errorHandler;
const notFoundHandler = (req, res, next) => {
    res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'Route not found',
        errors: [],
    });
};
exports.notFoundHandler = notFoundHandler;
//# sourceMappingURL=errorHandler.js.map