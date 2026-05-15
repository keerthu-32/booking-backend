import mongoose, { Document } from 'mongoose';
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
export declare const User: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}, {}> & IUser & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=User.d.ts.map