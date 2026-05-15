"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.maskCardNumber = exports.isStrongPassword = exports.isValidEmail = exports.formatCurrency = exports.generateOTP = exports.calculateRefundAmount = exports.generateBookingReference = void 0;
const crypto_1 = __importDefault(require("crypto"));
const generateBookingReference = () => {
    const prefix = 'FB';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = crypto_1.default.randomBytes(3).toString('hex').toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
};
exports.generateBookingReference = generateBookingReference;
const calculateRefundAmount = (totalAmount, departureDate) => {
    const now = new Date();
    const timeDifference = departureDate.getTime() - now.getTime();
    const hoursDifference = timeDifference / (1000 * 60 * 60);
    if (hoursDifference > 48) {
        return totalAmount; // 100% refund
    }
    else if (hoursDifference > 24) {
        return totalAmount * 0.75; // 75% refund
    }
    else {
        return 0; // No refund
    }
};
exports.calculateRefundAmount = calculateRefundAmount;
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};
exports.generateOTP = generateOTP;
const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
    }).format(amount);
};
exports.formatCurrency = formatCurrency;
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
exports.isValidEmail = isValidEmail;
const isStrongPassword = (password) => {
    // At least 8 chars, 1 uppercase, 1 number, 1 special char
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
};
exports.isStrongPassword = isStrongPassword;
const maskCardNumber = (cardNumber) => {
    return `****-****-****-${cardNumber.slice(-4)}`;
};
exports.maskCardNumber = maskCardNumber;
//# sourceMappingURL=helpers.js.map