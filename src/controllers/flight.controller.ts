import { Request, Response } from 'express';
import { flightService } from '../services/flight.service';
import { catchAsync } from '../utils/catchAsync';
import { flightSearchSchema } from '../validators';
import { ValidationError } from '../utils/errors';

export const searchFlights = catchAsync(async (req: Request, res: Response) => {
  const validatedData = flightSearchSchema.safeParse(req.query);
  if (!validatedData.success) {
    const errors = validatedData.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    throw new ValidationError('Validation failed', errors);
  }

  const result = await flightService.searchFlights(validatedData.data);

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Flights retrieved successfully',
    data: result,
  });
});

export const getFlightDetails = catchAsync(async (req: Request, res: Response) => {
  const flight = await flightService.getFlightById(req.params.id);

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Flight details retrieved',
    data: flight,
  });
});

export const getSeatAvailability = catchAsync(async (req: Request, res: Response) => {
  const result = await flightService.getSeatAvailability(req.params.id);

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Seat availability retrieved',
    data: result,
  });
});

export const createFlight = catchAsync(async (req: Request, res: Response) => {
  const flight = await flightService.createFlight(req.body);

  res.status(201).json({
    success: true,
    statusCode: 201,
    message: 'Flight created successfully',
    data: flight,
  });
});

export const updateFlight = catchAsync(async (req: Request, res: Response) => {
  const flight = await flightService.updateFlight(req.params.id, req.body);

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Flight updated successfully',
    data: flight,
  });
});

export const deleteFlight = catchAsync(async (req: Request, res: Response) => {
  await flightService.deleteFlight(req.params.id);

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Flight deleted successfully',
  });
});
