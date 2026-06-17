import { User, IUser } from '../models/User';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { UnauthorizedError, ValidationError, ConflictError } from '../utils/errors';

export class AuthService {
  async getCurrentUser(userId: string): Promise<Partial<IUser>> {
    const user = await User.findById(userId).select('-passwordHash -refreshToken');

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    return {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      dateOfBirth: user.dateOfBirth,
      passportNumber: user.passportNumber,
      nationality: user.nationality,
      preferences: user.preferences,
      role: user.role,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async updateCurrentUser(
    userId: string,
    updates: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      dateOfBirth?: string;
      passportNumber?: string;
      nationality?: string;
      preferences?: {
        seatPreference?: 'window' | 'middle' | 'aisle';
        mealPreference?: string;
        newsletterOptIn?: boolean;
      };
    }
  ): Promise<Partial<IUser>> {
    const user = await User.findById(userId);

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    if (updates.firstName !== undefined) user.firstName = updates.firstName;
    if (updates.lastName !== undefined) user.lastName = updates.lastName;
    if (updates.phone !== undefined) user.phone = updates.phone;
    if (updates.passportNumber !== undefined) user.passportNumber = updates.passportNumber;
    if (updates.nationality !== undefined) user.nationality = updates.nationality;
    if (updates.dateOfBirth !== undefined && updates.dateOfBirth !== '') {
      user.dateOfBirth = new Date(updates.dateOfBirth);
    }

    if (updates.preferences) {
      user.preferences = {
        ...user.preferences,
        ...updates.preferences,
      };
    }

    await user.save();

    return {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      dateOfBirth: user.dateOfBirth,
      passportNumber: user.passportNumber,
      nationality: user.nationality,
      preferences: user.preferences,
      role: user.role,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async register(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone: string;
  }): Promise<{ user: Partial<IUser>; accessToken: string; refreshToken: string }> {
    const email = userData.email.trim().toLowerCase();

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    // Create new user
    const user = new User({
      firstName: userData.firstName,
      lastName: userData.lastName,
      email,
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

  async login(
    email: string,
    password: string
  ): Promise<{ user: Partial<IUser>; accessToken: string; refreshToken: string }> {
    const normalizedEmail = email.trim().toLowerCase();

    // Find user
    const user = await User.findOne({ email: normalizedEmail });
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
    // Verify the token signature and expiry before doing a DB lookup.
    // Without this check, any stored token (even expired/tampered) would pass.
    const payload = verifyRefreshToken(refreshToken); // throws if invalid/expired

    // Confirm it still matches what's stored for this user
    const user = await User.findOne({ _id: payload.id, refreshToken });
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
