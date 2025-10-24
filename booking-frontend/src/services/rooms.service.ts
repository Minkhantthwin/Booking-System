import apiClient from '@/lib/api-client';
import { Room, CreateRoomDto, UpdateRoomDto } from '@/types/api.types';

export const roomsService = {
  getAll: async (): Promise<Room[]> => {
    const { data } = await apiClient.get<Room[]>('/rooms');
    return data;
  },

  getById: async (id: number): Promise<Room> => {
    const { data } = await apiClient.get<Room>(`/rooms/${id}`);
    return data;
  },

  getAvailable: async (startTime: string, endTime: string): Promise<Room[]> => {
    const { data } = await apiClient.get<Room[]>('/rooms/available', {
      params: { startTime, endTime },
    });
    return data;
  },

  create: async (roomData: CreateRoomDto): Promise<Room> => {
    const { data } = await apiClient.post<Room>('/rooms', roomData);
    return data;
  },

  update: async (id: number, roomData: UpdateRoomDto): Promise<Room> => {
    const { data } = await apiClient.patch<Room>(`/rooms/${id}`, roomData);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/rooms/${id}`);
  },
};
