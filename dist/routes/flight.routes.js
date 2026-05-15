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
const express_1 = require("express");
const flightController = __importStar(require("../controllers/flight.controller"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Public routes
router.get('/search', auth_1.optionalAuth, flightController.searchFlights);
router.get('/:id', auth_1.optionalAuth, flightController.getFlightDetails);
router.get('/:id/seats', auth_1.optionalAuth, flightController.getSeatAvailability);
// Admin routes
router.post('/', auth_1.authenticateToken, (0, auth_1.authorizeRole)('admin'), flightController.createFlight);
router.put('/:id', auth_1.authenticateToken, (0, auth_1.authorizeRole)('admin'), flightController.updateFlight);
router.delete('/:id', auth_1.authenticateToken, (0, auth_1.authorizeRole)('admin'), flightController.deleteFlight);
exports.default = router;
//# sourceMappingURL=flight.routes.js.map