import { User, IUser } from '../models/User';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { UnauthorizedError, ValidationError, ConflictError } from '../utils/errors';

export class AuthService {
  async register(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone: string;
  }): Promise<{ user: Partial<IUser>; accessToken: string; refreshToken: string }> {
    // Check if user exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    // Create new user
    const user = new User({
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      passwordHash: userData.password,
      phone: userData.phone,
      isVerified: true, // For simplicity, auto-verify in demo
    });

    await user.save();

    // Generate tokens
    const accessToken = generateAccessToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
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

  async login(email: string, password: string): Promise<{
    user: Partial<IUser>;
    accessToken: string;
    refreshToken: string;
  }> {
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
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

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    // Verify refresh token
    const user = await User.findOne({ refreshToken });
    if (!user) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Generate new access token
    const accessToken = generateAccessToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    return { accessToken };
  }

  async logout(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { refreshToken: undefined });
  }
}

export const authService = new AuthService();
