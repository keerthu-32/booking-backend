import { IFlight } from '../models/Flight';
export interface FlightSearchParams {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
    passengers: number;
    cabinClass?: 'economy' | 'business' | 'first';
    sortBy?: 'price' | 'duration' | 'departure';
    order?: 'asc' | 'desc';
    page: number;
    limit: number;
}
export declare class FlightService {
    searchFlights(params: FlightSearchParams): Promise<{
        total: number;
        page: number;
        limit: number;
        flights: IFlight[];
    }>;
    getFlightById(id: string): Promise<IFlight>;
    getSeatAvailability(id: string): Promise<{
        flightId: string;
        seatMap: any;
        cabinClasses: any;
    }>;
    private generateSeatMap;
    createFlight(flightData: any): Promise<IFlight>;
    updateFlight(id: string, updateData: any): Promise<IFlight>;
    deleteFlight(id: string): Promise<void>;
}
export declare const flightService: FlightService;
//# sourceMappingURL=flight.service.d.ts.map