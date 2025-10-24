export interface Room {
  id: number;
  name: string;
  capacity: number;
  floor: number;
  building: string;
  amenities: string[];
  hourlyRate: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user';
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: number;
  userId: number;
  roomId: number;
  startTime: string;
  endTime: string;
  purpose: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  totalCost: number;
  createdAt: string;
  updatedAt: string;
  user?: User;
  room?: Room;
}

export interface CreateBookingDto {
  roomId: number;
  startTime: string;
  endTime: string;
  purpose: string;
}

export interface UpdateBookingDto {
  startTime?: string;
  endTime?: string;
  purpose?: string;
  status?: 'pending' | 'confirmed' | 'cancelled';
}

export interface CreateRoomDto {
  name: string;
  capacity: number;
  floor: number;
  building: string;
  amenities?: string[];
  hourlyRate: number;
}

export interface UpdateRoomDto {
  name?: string;
  capacity?: number;
  floor?: number;
  building?: string;
  amenities?: string[];
  hourlyRate?: number;
  isActive?: boolean;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
