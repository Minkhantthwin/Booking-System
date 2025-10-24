import apiClient from '@/lib/api-client';
import { Booking, CreateBookingDto, UpdateBookingDto } from '@/types/api.types';

export const bookingsService = {
  getAll: async (): Promise<Booking[]> => {
    const { data } = await apiClient.get<Booking[]>('/bookings');
    return data;
  },

  getById: async (id: number): Promise<Booking> => {
    const { data } = await apiClient.get<Booking>(`/bookings/${id}`);
    return data;
  },

  getMyBookings: async (): Promise<Booking[]> => {
    const { data } = await apiClient.get<Booking[]>('/bookings/my-bookings');
    return data;
  },

  create: async (bookingData: CreateBookingDto): Promise<Booking> => {
    const { data } = await apiClient.post<Booking>('/bookings', bookingData);
    return data;
  },

  update: async (id: number, bookingData: UpdateBookingDto): Promise<Booking> => {
    const { data } = await apiClient.patch<Booking>(`/bookings/${id}`, bookingData);
    return data;
  },

  cancel: async (id: number): Promise<Booking> => {
    const { data } = await apiClient.patch<Booking>(`/bookings/${id}/cancel`);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/bookings/${id}`);
  },
};
