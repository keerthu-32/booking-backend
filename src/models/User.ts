import mongoose, { Schema, Document } from 'mongoose';
import bcryptjs from 'bcryptjs';

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  phone: string;
  dateOfBirth: Date;
  passportNumber: string;
  nationality: string;
  preferences: {
    seatPreference: 'window' | 'middle' | 'aisle';
    mealPreference: string;
    newsletterOptIn: boolean;
  };
  role: 'user' | 'admin';
  isVerified: boolean;
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true },
    phone: { type: String, required: true },
    dateOfBirth: { type: Date },
    passportNumber: { type: String },
    nationality: { type: String },
    preferences: {
      seatPreference: { type: String, enum: ['window', 'middle', 'aisle'], default: 'window' },
      mealPreference: { type: String, default: 'regular' },
      newsletterOptIn: { type: Boolean, default: true },
    },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    isVerified: { type: Boolean, default: false },
    refreshToken: { type: String },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcryptjs.compare(password, this.passwordHash);
};

userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  try {
    const salt = await bcryptjs.genSalt(Number(process.env.BCRYPT_SALT_ROUNDS || 12));
    this.passwordHash = await bcryptjs.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

export const User = mongoose.model<IUser>('User', userSchema);
