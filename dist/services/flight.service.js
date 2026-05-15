"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.flightService = exports.FlightService = void 0;
const Flight_1 = require("../models/Flight");
const errors_1 = require("../utils/errors");
class FlightService {
    async searchFlights(params) {
        const { origin, destination, departureDate, cabinClass, sortBy = 'price', order = 'asc', page, limit, } = params;
        // Build query
        const query = {
            'origin.iataCode': origin.toUpperCase(),
            'destination.iataCode': destination.toUpperCase(),
            departureTime: {
                $gte: new Date(departureDate),
                $lt: new Date(new Date(departureDate).getTime() + 24 * 60 * 60 * 1000),
            },
        };
        // Build sort object
        const sortObj = {};
        if (sortBy === 'price') {
            sortObj['cabinClasses.baseFare'] = order === 'asc' ? 1 : -1;
        }
        else if (sortBy === 'duration') {
            sortObj['duration'] = order === 'asc' ? 1 : -1;
        }
        else {
            sortObj['departureTime'] = order === 'asc' ? 1 : -1;
        }
        // Get total count
        const total = await Flight_1.Flight.countDocuments(query);
        // Get flights with pagination
        const flights = await Flight_1.Flight.find(query)
            .sort(sortObj)
            .skip((page - 1) * limit)
            .limit(limit)
            .exec();
        return {
            total,
            page,
            limit,
            flights,
        };
    }
    async getFlightById(id) {
        const flight = await Flight_1.Flight.findById(id);
        if (!flight) {
            throw new errors_1.NotFoundError('Flight not found');
        }
        return flight;
    }
    async getSeatAvailability(id) {
        const flight = await this.getFlightById(id);
        return {
            flightId: flight._id.toString(),
            seatMap: this.generateSeatMap(flight),
            cabinClasses: flight.cabinClasses,
        };
    }
    generateSeatMap(flight) {
        // Simple seat map generation
        const rows = 20;
        const seatsPerRow = 6;
        const seatMap = {};
        flight.cabinClasses.forEach((cabin) => {
            seatMap[cabin.type] = [];
            let seatCount = 0;
            for (let row = 1; row <= rows && seatCount < cabin.totalSeats; row++) {
                const rowSeats = [];
                for (let col = 0; col < seatsPerRow && seatCount < cabin.totalSeats; col++) {
                    const seatNumber = `${row}${String.fromCharCode(65 + col)}`;
                    rowSeats.push({
                        seatNumber,
                        available: seatCount < cabin.availableSeats,
                    });
                    seatCount++;
                }
                seatMap[cabin.type].push(rowSeats);
            }
        });
        return seatMap;
    }
    async createFlight(flightData) {
        const flight = new Flight_1.Flight(flightData);
        await flight.save();
        return flight;
    }
    async updateFlight(id, updateData) {
        const flight = await Flight_1.Flight.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        });
        if (!flight) {
            throw new errors_1.NotFoundError('Flight not found');
        }
        return flight;
    }
    async deleteFlight(id) {
        const result = await Flight_1.Flight.findByIdAndDelete(id);
        if (!result) {
            throw new errors_1.NotFoundError('Flight not found');
        }
    }
}
exports.FlightService = FlightService;
exports.flightService = new FlightService();
//# sourceMappingURL=flight.service.js.map