import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { catchAsync } from '../utils/catchAsync';
import { registerSchema, loginSchema, refreshTokenSchema, updateUserSchema } from '../validators';
import { ValidationError } from '../utils/errors';

export const register = catchAsync(async (req: Request, res: Response) => {
  const validatedData = registerSchema.safeParse(req.body);
  if (!validatedData.success) {
    const errors = validatedData.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    throw new ValidationError('Validation failed', errors);
  }

  const result = await authService.register(validatedData.data);

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

export const login = catchAsync(async (req: Request, res: Response) => {
  const validatedData = loginSchema.safeParse(req.body);
  if (!validatedData.success) {
    const errors = validatedData.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    throw new ValidationError('Validation failed', errors);
  }

  const result = await authService.login(validatedData.data.email, validatedData.data.password);

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

export const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const validatedData = refreshTokenSchema.safeParse(req.body);
  if (!validatedData.success) {
    const errors = validatedData.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    throw new ValidationError('Validation failed', errors);
  }

  const result = await authService.refreshAccessToken(validatedData.data.refreshToken);

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Access token refreshed',
    data: result,
  });
});

export const me = catchAsync(async (req: Request, res: Response) => {
  if (!req.userId) {
    throw new ValidationError('User not authenticated');
  }

  const user = await authService.getCurrentUser(req.userId);

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'User profile retrieved successfully',
    data: user,
  });
});

export const updateMe = catchAsync(async (req: Request, res: Response) => {
  if (!req.userId) {
    throw new ValidationError('User not authenticated');
  }

  const validatedData = updateUserSchema.safeParse(req.body);
  if (!validatedData.success) {
    const errors = validatedData.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    throw new ValidationError('Validation failed', errors);
  }

  const user = await authService.updateCurrentUser(req.userId, validatedData.data);

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Profile updated successfully',
    data: user,
  });
});

export const logout = catchAsync(async (req: Request, res: Response) => {
  if (!req.userId) {
    throw new ValidationError('User not found');
  }

  await authService.logout(req.userId);

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Logout successful',
  });
});
