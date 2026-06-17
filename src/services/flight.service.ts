import { Flight, IFlight } from '../models/Flight';
import { NotFoundError } from '../utils/errors';

export interface FlightSearchParams {
  origin?: string;
  destination?: string;
  departureDate?: string;
  returnDate?: string;
  passengers: number;
  cabinClass?: 'economy' | 'business' | 'first';
  sortBy?: 'price' | 'duration' | 'departure';
  order?: 'asc' | 'desc';
  page: number;
  limit: number;
}

export class FlightService {
  async searchFlights(params: FlightSearchParams): Promise<{
    total: number;
    page: number;
    limit: number;
    flights: IFlight[];
  }> {
    const {
      origin,
      destination,
      departureDate,
      cabinClass,
      sortBy = 'price',
      order = 'asc',
      page,
      limit,
    } = params;

    // Build query - only add filters if provided
    const query: any = {};

    if (origin) {
      const originValue = origin.trim();
      query.$or = [
        { 'origin.iataCode': originValue.toUpperCase() },
        { 'origin.city': { $regex: `^${originValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } },
      ];
    }

    if (destination) {
      const destinationValue = destination.trim();
      const destinationMatch = {
        $or: [
          { 'destination.iataCode': destinationValue.toUpperCase() },
          { 'destination.city': { $regex: `^${destinationValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } },
        ],
      };

      if (query.$or) {
        query.$and = [{ $or: query.$or }, destinationMatch];
        delete query.$or;
      } else {
        query.$or = destinationMatch.$or;
      }
    }

    if (departureDate) {
      query.departureTime = {
        $gte: new Date(departureDate),
        $lt: new Date(new Date(departureDate).getTime() + 24 * 60 * 60 * 1000),
      };
    } else {
      query.departureTime = { $gte: new Date() };
    }

    if (cabinClass) {
      query['cabinClasses.type'] = cabinClass;
    }

    // Never show cancelled flights in search results
    query.status = { $nin: ['cancelled'] };

    // Build sort object
    const sortObj: any = {};
    if (sortBy === 'price') {
      sortObj['cabinClasses.baseFare'] = order === 'asc' ? 1 : -1;
    } else if (sortBy === 'duration') {
      sortObj['duration'] = order === 'asc' ? 1 : -1;
    } else {
      sortObj['departureTime'] = order === 'asc' ? 1 : -1;
    }

    // Get total count
    const total = await Flight.countDocuments(query);

    // Get flights with pagination
    const flights = await Flight.find(query)
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

  async getFlightById(id: string): Promise<IFlight> {
    const flight = await Flight.findById(id);
    if (!flight) {
      throw new NotFoundError('Flight not found');
    }
    return flight;
  }

  async getSeatAvailability(id: string): Promise<{
    flightId: string;
    seatMap: any;
    cabinClasses: any;
  }> {
    const flight = await this.getFlightById(id);

    return {
      flightId: flight._id.toString(),
      seatMap: this.generateSeatMap(flight),
      cabinClasses: flight.cabinClasses,
    };
  }

  private generateSeatMap(flight: IFlight): any {
    // Simple seat map generation
    const rows = 20;
    const seatsPerRow = 6;
    const seatMap: any = {};

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

  async createFlight(flightData: any): Promise<IFlight | IFlight[]> {
    const recurringDays = flightData.recurringDays ? parseInt(flightData.recurringDays, 10) : 1;
    if (isNaN(recurringDays) || recurringDays <= 1) {
      const flight = new Flight(flightData);
      await flight.save();
      return flight;
    }

    const createdFlights: IFlight[] = [];
    const baseDeparture = new Date(flightData.departureTime);
    const baseArrival = new Date(flightData.arrivalTime);

    for (let i = 0; i < recurringDays; i++) {
      const departureTime = new Date(baseDeparture.getTime() + i * 24 * 60 * 60 * 1000);
      const arrivalTime = new Date(baseArrival.getTime() + i * 24 * 60 * 60 * 1000);

      const singleFlightData = {
        ...flightData,
        departureTime,
        arrivalTime,
      };
      delete singleFlightData.recurringDays;

      const flight = new Flight(singleFlightData);
      await flight.save();
      createdFlights.push(flight);
    }
    return createdFlights;
  }

  async updateFlight(id: string, updateData: any): Promise<IFlight> {
    const flight = await Flight.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!flight) {
      throw new NotFoundError('Flight not found');
    }

    return flight;
  }

  async deleteFlight(id: string): Promise<void> {
    const result = await Flight.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundError('Flight not found');
    }
  }

  async getUniqueAirports(): Promise<{
    origins: Array<{ iataCode: string; city: string; country: string }>;
    destinations: Array<{ iataCode: string; city: string; country: string }>;
  }> {
    // Get unique origins
    const origins = await Flight.aggregate([
      {
        $group: {
          _id: '$origin.iataCode',
          city: { $first: '$origin.city' },
          country: { $first: '$origin.country' },
        },
      },
      {
        $project: {
          _id: 0,
          iataCode: '$_id',
          city: 1,
          country: 1,
        },
      },
      { $sort: { iataCode: 1 } },
    ]);

    // Get unique destinations
    const destinations = await Flight.aggregate([
      {
        $group: {
          _id: '$destination.iataCode',
          city: { $first: '$destination.city' },
          country: { $first: '$destination.country' },
        },
      },
      {
        $project: {
          _id: 0,
          iataCode: '$_id',
          city: 1,
          country: 1,
        },
      },
      { $sort: { iataCode: 1 } },
    ]);

    return { origins, destinations };
  }
}

export const flightService = new FlightService();
