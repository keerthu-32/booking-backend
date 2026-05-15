"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const database_1 = require("./config/database");
const errorHandler_1 = require("./middleware/errorHandler");
const logger_1 = __importDefault(require("./config/logger"));
// Routes
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const flight_routes_1 = __importDefault(require("./routes/flight.routes"));
const booking_routes_1 = __importDefault(require("./routes/booking.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const app = (0, express_1.default)();
exports.app = app;
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use((0, morgan_1.default)('combined', { stream: { write: (message) => logger_1.default.info(message.trim()) } }));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ limit: '10mb', extended: true }));
// Health check
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});
// API Routes
const apiVersion = process.env.API_VERSION || 'v1';
const basePath = `/api/${apiVersion}`;
app.use(`${basePath}/auth`, auth_routes_1.default);
app.use(`${basePath}/flights`, flight_routes_1.default);
app.use(`${basePath}/bookings`, booking_routes_1.default);
app.use(`${basePath}/payments`, payment_routes_1.default);
// 404 handler
app.use(errorHandler_1.notFoundHandler);
// Error handler (must be last)
app.use(errorHandler_1.errorHandler);
// Database connection and server startup
const PORT = process.env.PORT || 5000;
const startServer = async () => {
    try {
        //await (0, database_1.connectDB)();
        app.listen(PORT, () => {
            logger_1.default.info(`✓ Server running on http://localhost:${PORT}`);
            logger_1.default.info(`✓ API available at http://localhost:${PORT}${basePath}`);
        });
    }
    catch (error) {
        logger_1.default.error('Failed to start server:', error);
        process.exit(1);
    }
};
exports.startServer = startServer;
// Graceful shutdown
process.on('SIGINT', async () => {
    logger_1.default.info('SIGINT received, shutting down gracefully...');
    process.exit(0);
});
process.on('SIGTERM', async () => {
    logger_1.default.info('SIGTERM received, shutting down gracefully...');
    process.exit(0);
});
// Only start server if this file is run directly
if (require.main === module) {
    startServer();
}
//# sourceMappingURL=app.js.map