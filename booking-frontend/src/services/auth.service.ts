import apiClient from '@/lib/api-client';
import { AuthResponse, LoginDto, RegisterDto, User } from '@/types/api.types';

export const authService = {
  login: async (credentials: LoginDto): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', credentials);
    localStorage.setItem('authToken', data.token);
    return data;
  },

  register: async (userData: RegisterDto): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/register', userData);
    localStorage.setItem('authToken', data.token);
    return data;
  },

  logout: () => {
    localStorage.removeItem('authToken');
  },

  getCurrentUser: async (): Promise<User> => {
    const { data } = await apiClient.get<User>('/auth/me');
    return data;
  },
};
