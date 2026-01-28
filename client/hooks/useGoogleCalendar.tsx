import { useState, useCallback } from 'react';
import { googleCalendarService } from '../lib/googleCalendar';
import { toast } from 'sonner';

interface CalendarEvent {
  title: string;
  description?: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  attendeeEmail?: string;
  attendeeName?: string;
  includeVideoCall?: boolean;
}

interface UseGoogleCalendarReturn {
  isConnected: boolean;
  isLoading: boolean;
  connectToGoogle: () => void;
  createEvent: (event: CalendarEvent) => Promise<{ success: boolean; eventId?: string; error?: string }>;
  updateEvent: (eventId: string, updates: Partial<CalendarEvent>) => Promise<{ success: boolean; error?: string }>;
  deleteEvent: (eventId: string) => Promise<{ success: boolean; error?: string }>;
  getAvailableSlots: (date: string, duration?: number) => Promise<string[]>;
  disconnect: () => void;
}

export function useGoogleCalendar(): UseGoogleCalendarReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(() => googleCalendarService.isAuthenticated());

  const connectToGoogle = useCallback(() => {
    const authUrl = googleCalendarService.getAuthUrl();
    window.location.href = authUrl;
  }, []);

  const createEvent = useCallback(async (event: CalendarEvent) => {
    if (!googleCalendarService.isAuthenticated()) {
      return { success: false, error: 'Not connected to Google Calendar' };
    }

    setIsLoading(true);
    try {
      const result = await googleCalendarService.createEvent(event);
      
      if (result.success) {
        toast.success('Calendar event created successfully');
      } else {
        toast.error(result.error || 'Failed to create calendar event');
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create calendar event';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateEvent = useCallback(async (eventId: string, updates: Partial<CalendarEvent>) => {
    if (!googleCalendarService.isAuthenticated()) {
      return { success: false, error: 'Not connected to Google Calendar' };
    }

    setIsLoading(true);
    try {
      const result = await googleCalendarService.updateEvent(eventId, {
        title: updates.title,
        description: updates.description,
        startTime: updates.startTime,
        endTime: updates.endTime
      });
      
      if (result.success) {
        toast.success('Calendar event updated successfully');
      } else {
        toast.error(result.error || 'Failed to update calendar event');
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update calendar event';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteEvent = useCallback(async (eventId: string) => {
    if (!googleCalendarService.isAuthenticated()) {
      return { success: false, error: 'Not connected to Google Calendar' };
    }

    setIsLoading(true);
    try {
      const result = await googleCalendarService.deleteEvent(eventId);
      
      if (result.success) {
        toast.success('Calendar event deleted successfully');
      } else {
        toast.error(result.error || 'Failed to delete calendar event');
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete calendar event';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getAvailableSlots = useCallback(async (date: string, duration: number = 60) => {
    if (!googleCalendarService.isAuthenticated()) {
      toast.error('Not connected to Google Calendar');
      return [];
    }

    setIsLoading(true);
    try {
      const slots = await googleCalendarService.getAvailableTimeSlots(date, duration);
      return slots;
    } catch (error) {
      console.error('Error getting available slots:', error);
      toast.error('Failed to get available time slots');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    googleCalendarService.disconnect();
    setIsConnected(false);
    toast.success('Disconnected from Google Calendar');
  }, []);

  return {
    isConnected,
    isLoading,
    connectToGoogle,
    createEvent,
    updateEvent,
    deleteEvent,
    getAvailableSlots,
    disconnect
  };
}
