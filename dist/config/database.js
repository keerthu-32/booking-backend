"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dropDatabase = exports.disconnectDB = exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/flight_booking';
        await mongoose_1.default.connect(mongoUri);
        console.log('✓ MongoDB connected successfully');
    }
    catch (error) {
        console.error('✗ MongoDB connection failed:', error);
        process.exit(1);
    }
};
exports.connectDB = connectDB;
const disconnectDB = async () => {
    try {
        await mongoose_1.default.disconnect();
        console.log('✓ MongoDB disconnected');
    }
    catch (error) {
        console.error('✗ MongoDB disconnection failed:', error);
    }
};
exports.disconnectDB = disconnectDB;
const dropDatabase = async () => {
    try {
        if (process.env.NODE_ENV !== 'test') {
            throw new Error('Database drop is only allowed in test environment');
        }
        await mongoose_1.default.connection.db?.dropDatabase();
        console.log('✓ Database dropped');
    }
    catch (error) {
        console.error('✗ Database drop failed:', error);
    }
};
exports.dropDatabase = dropDatabase;
//# sourceMappingURL=database.js.map