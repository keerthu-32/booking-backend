"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Flight = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const flightSchema = new mongoose_1.Schema({
    flightNumber: { type: String, required: true, unique: true, index: true },
    airline: { type: String, required: true },
    origin: {
        iataCode: { type: String, required: true },
        city: { type: String, required: true },
        country: { type: String, required: true },
        terminal: { type: String },
    },
    destination: {
        iataCode: { type: String, required: true },
        city: { type: String, required: true },
        country: { type: String, required: true },
        terminal: { type: String },
    },
    departureTime: { type: Date, required: true, index: true },
    arrivalTime: { type: Date, required: true },
    duration: { type: Number, required: true },
    stops: { type: Number, default: 0 },
    aircraft: { type: String, required: true },
    status: {
        type: String,
        enum: ['scheduled', 'delayed', 'boarding', 'departed', 'arrived', 'cancelled'],
        default: 'scheduled',
    },
    cabinClasses: [
        {
            type: { type: String, enum: ['economy', 'business', 'first'], required: true },
            totalSeats: { type: Number, required: true },
            availableSeats: { type: Number, required: true },
            baseFare: { type: Number, required: true },
            currency: { type: String, default: 'USD' },
        },
    ],
    amenities: [{ type: String }],
}, { timestamps: true });
exports.Flight = mongoose_1.default.model('Flight', flightSchema);
//# sourceMappingURL=Flight.js.map