"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFlight = exports.updateFlight = exports.createFlight = exports.getSeatAvailability = exports.getFlightDetails = exports.searchFlights = void 0;
const flight_service_1 = require("../services/flight.service");
const catchAsync_1 = require("../utils/catchAsync");
const validators_1 = require("../validators");
const errors_1 = require("../utils/errors");
exports.searchFlights = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const validatedData = validators_1.flightSearchSchema.safeParse(req.query);
    if (!validatedData.success) {
        const errors = validatedData.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
        }));
        throw new errors_1.ValidationError('Validation failed', errors);
    }
    const result = await flight_service_1.flightService.searchFlights(validatedData.data);
    res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Flights retrieved successfully',
        data: result,
    });
});
exports.getFlightDetails = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const flight = await flight_service_1.flightService.getFlightById(req.params.id);
    res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Flight details retrieved',
        data: flight,
    });
});
exports.getSeatAvailability = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const result = await flight_service_1.flightService.getSeatAvailability(req.params.id);
    res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Seat availability retrieved',
        data: result,
    });
});
exports.createFlight = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const flight = await flight_service_1.flightService.createFlight(req.body);
    res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Flight created successfully',
        data: flight,
    });
});
exports.updateFlight = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const flight = await flight_service_1.flightService.updateFlight(req.params.id, req.body);
    res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Flight updated successfully',
        data: flight,
    });
});
exports.deleteFlight = (0, catchAsync_1.catchAsync)(async (req, res) => {
    await flight_service_1.flightService.deleteFlight(req.params.id);
    res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Flight deleted successfully',
    });
});
//# sourceMappingURL=flight.controller.js.map