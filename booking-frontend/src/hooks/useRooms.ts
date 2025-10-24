import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { roomsService } from '@/services/rooms.service';
import { CreateRoomDto, UpdateRoomDto } from '@/types/api.types';
import { toast } from 'sonner';

export const useRooms = () => {
  const queryClient = useQueryClient();

  const { data: rooms, isLoading } = useQuery({
    queryKey: ['rooms'],
    queryFn: roomsService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateRoomDto) => roomsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Room created successfully');
    },
    onError: () => {
      toast.error('Failed to create room');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateRoomDto }) =>
      roomsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Room updated successfully');
    },
    onError: () => {
      toast.error('Failed to update room');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => roomsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Room deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete room');
    },
  });

  return {
    rooms,
    isLoading,
    createRoom: createMutation.mutateAsync,
    updateRoom: updateMutation.mutateAsync,
    deleteRoom: deleteMutation.mutateAsync,
  };
};

export const useRoom = (id: number) => {
  return useQuery({
    queryKey: ['room', id],
    queryFn: () => roomsService.getById(id),
    enabled: !!id,
  });
};

export const useAvailableRooms = (startTime: string, endTime: string) => {
  return useQuery({
    queryKey: ['availableRooms', startTime, endTime],
    queryFn: () => roomsService.getAvailable(startTime, endTime),
    enabled: !!startTime && !!endTime,
  });
};
