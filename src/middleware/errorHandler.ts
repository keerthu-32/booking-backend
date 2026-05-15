import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/errors';

export const errorHandler = (
  error: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', error);

  if (error instanceof ApiError) {
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
  if ((error as any).code === 11000) {
    const field = Object.keys((error as any).keyValue)[0];
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

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: 'Route not found',
    errors: [],
  });
};
