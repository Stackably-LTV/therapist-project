'use client';
import { useState, useEffect } from 'react';
import { Calendar } from '@/components/111083d11e1f';
import { Button } from '@/components/2795b661f080';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/c0ebd3fbafc6';
import { Clock, Calendar as CalendarIcon, DollarSign } from 'lucide-react';
import { bookingService } from '@/components/9b7fba1647b4';
import { toast } from 'sonner';
export default function BookingCalendar({ therapistId, therapistName, rate, sessionDuration, onBookingComplete, }) {
    const [selectedDate, setSelectedDate] = useState(undefined);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(undefined);
    const [loading, setLoading] = useState(false);
    const [bookingLoading, setBookingLoading] = useState(false);
    // Fetch available slots when date is selected
    useEffect(() => {
        if (selectedDate) {
            fetchAvailableSlots();
        }
    }, [selectedDate]);
    const fetchAvailableSlots = async () => {
        if (!selectedDate)
            return;
        setLoading(true);
        try {
            const startOfDay = new Date(selectedDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(selectedDate);
            endOfDay.setHours(23, 59, 59, 999);
            const slots = await bookingService.getAvailableSlots(therapistId, startOfDay, endOfDay);
            setAvailableSlots(slots);
        }
        catch (error) {
            console.error('Error fetching slots:', error);
            toast.error('Failed to load available time slots');
        }
        finally {
            setLoading(false);
        }
    };
    const handleBooking = async () => {
        if (!selectedSlot)
            return;
        setBookingLoading(true);
        try {
            const session = await bookingService.createBooking({
                therapistId,
                scheduledAt: selectedSlot,
                durationMinutes: sessionDuration,
            });
            toast.success('Session booked successfully!');
            if (onBookingComplete) {
                onBookingComplete(session.id);
            }
        }
        catch (error) {
            console.error('Booking error:', error);
            toast.error(error.message || 'Failed to book session');
        }
        finally {
            setBookingLoading(false);
        }
    };
    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    };
    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });
    };
    return (<Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">
              Book a Session
            </h3>
            <p className="text-gray-600 mt-1">
              with {therapistName}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-2xl font-bold text-indigo-600">
              <DollarSign className="w-6 h-6"/>
              {rate}
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Clock className="w-4 h-4"/>
              {sessionDuration} minutes
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Step 1: Select Date */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <CalendarIcon className="w-5 h-5 text-indigo-600"/>
            <h4 className="text-lg font-semibold text-gray-900">
              Step 1: Choose a Date
            </h4>
          </div>
          <div className="flex justify-center">
            <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} disabled={(date) => date < new Date() || date < new Date(new Date().setHours(0, 0, 0, 0))} className="rounded-md border"/>
          </div>
        </div>

        {/* Step 2: Select Time Slot */}
        {selectedDate && (<div>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-indigo-600"/>
              <h4 className="text-lg font-semibold text-gray-900">
                Step 2: Choose a Time
              </h4>
            </div>
            
            {loading ? (<div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>) : availableSlots.length === 0 ? (<div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-600">
                  No available slots for {formatDate(selectedDate)}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Please select a different date
                </p>
              </div>) : (<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {availableSlots.map((slot) => (<Button key={slot.toISOString()} variant={selectedSlot?.toISOString() === slot.toISOString() ? 'default' : 'outline'} className={`
                      h-14 text-base font-medium transition-all
                      ${selectedSlot?.toISOString() === slot.toISOString()
                        ? 'bg-indigo-600 text-white shadow-lg scale-105'
                        : 'hover:border-indigo-300 hover:bg-indigo-50'}
                    `} onClick={() => setSelectedSlot(slot)}>
                    {formatTime(slot)}
                  </Button>))}
              </div>)}
          </div>)}

        {/* Booking Summary */}
        {selectedSlot && (<div className="bg-indigo-50 rounded-lg p-6 border-2 border-indigo-200">
            <h4 className="font-semibold text-gray-900 mb-4">Booking Summary</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Therapist:</span>
                <span className="font-medium text-gray-900">{therapistName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium text-gray-900">
                  {formatDate(selectedSlot)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time:</span>
                <span className="font-medium text-gray-900">
                  {formatTime(selectedSlot)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="font-medium text-gray-900">
                  {sessionDuration} minutes
                </span>
              </div>
              <div className="flex justify-between pt-3 border-t border-indigo-300">
                <span className="font-semibold text-gray-900">Total:</span>
                <span className="text-2xl font-bold text-indigo-600">
                  ${rate}
                </span>
              </div>
            </div>
          </div>)}
      </CardContent>

      {selectedSlot && (<CardFooter>
          <Button size="lg" className="w-full text-lg h-14" onClick={handleBooking} disabled={bookingLoading}>
            {bookingLoading ? 'Processing...' : 'Proceed to Payment'}
          </Button>
        </CardFooter>)}
    </Card>);
}
