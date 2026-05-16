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
      query['origin.iataCode'] = origin.toUpperCase();
    }
    
    if (destination) {
      query['destination.iataCode'] = destination.toUpperCase();
    }
    
    if (departureDate) {
      query.departureTime = {
        $gte: new Date(departureDate),
        $lt: new Date(new Date(departureDate).getTime() + 24 * 60 * 60 * 1000),
      };
    }

    if (cabinClass) {
      query['cabinClasses.type'] = cabinClass;
    }

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

  async createFlight(flightData: any): Promise<IFlight> {
    const flight = new Flight(flightData);
    await flight.save();
    return flight;
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
}

export const flightService = new FlightService();
