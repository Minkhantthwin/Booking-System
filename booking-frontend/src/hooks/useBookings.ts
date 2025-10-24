import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bookingsService } from '@/services/bookings.service';
import { CreateBookingDto, UpdateBookingDto } from '@/types/api.types';
import { toast } from 'sonner';

export const useBookings = () => {
  const queryClient = useQueryClient();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: bookingsService.getAll,
  });

  const { data: myBookings } = useQuery({
    queryKey: ['myBookings'],
    queryFn: bookingsService.getMyBookings,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateBookingDto) => bookingsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
      toast.success('Booking created successfully');
    },
    onError: () => {
      toast.error('Failed to create booking');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateBookingDto }) =>
      bookingsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
      toast.success('Booking updated successfully');
    },
    onError: () => {
      toast.error('Failed to update booking');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => bookingsService.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
      toast.success('Booking cancelled successfully');
    },
    onError: () => {
      toast.error('Failed to cancel booking');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => bookingsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
      toast.success('Booking deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete booking');
    },
  });

  return {
    bookings,
    myBookings,
    isLoading,
    createBooking: createMutation.mutateAsync,
    updateBooking: updateMutation.mutateAsync,
    cancelBooking: cancelMutation.mutateAsync,
    deleteBooking: deleteMutation.mutateAsync,
  };
};

export const useBooking = (id: number) => {
  return useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingsService.getById(id),
    enabled: !!id,
  });
};
