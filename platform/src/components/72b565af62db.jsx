'use client';
import { useState, useEffect } from 'react';
import { Calendar } from '@/components/111083d11e1f';
import { Button } from '@/components/2795b661f080';
import { Card, CardHeader, CardContent } from '@/components/c0ebd3fbafc6';
import { Badge } from '@/components/30348591d689';
import { Clock, Calendar as CalendarIcon, DollarSign, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
export default function BookingCalendarHosted({ therapistId, therapistName, rate, sessionDuration, }) {
    const [step, setStep] = useState('date');
    const [selectedDate, setSelectedDate] = useState(undefined);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(undefined);
    const [loading, setLoading] = useState(false);
    const [bookingDisabledReason, setBookingDisabledReason] = useState('');
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
            const dateKey = [
                selectedDate.getFullYear(),
                String(selectedDate.getMonth() + 1).padStart(2, '0'),
                String(selectedDate.getDate()).padStart(2, '0'),
            ].join('-');
            const tzOffsetMinutes = new Date().getTimezoneOffset();
            const response = await fetch(`/api/booking/availability/${therapistId}?date=${dateKey}&tzOffsetMinutes=${tzOffsetMinutes}`);
            if (!response.ok) {
                throw new Error('Failed to fetch availability');
            }
            const data = await response.json();
            if (data?.bookingEnabled === false) {
                setBookingDisabledReason(String(data.bookingDisabledReason || 'Booking is currently disabled.'));
                setAvailableSlots([]);
                return;
            }
            setBookingDisabledReason('');
            const slots = data.availableSlots || [];
            setAvailableSlots(slots.map((iso) => new Date(iso)));
        }
        catch (error) {
            console.error('Error fetching slots:', error);
            toast.error('Failed to load available time slots');
        }
        finally {
            setLoading(false);
        }
    };
    const handleDateSelect = (date) => {
        setSelectedDate(date);
        setSelectedSlot(undefined);
        if (date) {
            setStep('time');
        }
    };
    const handleSlotSelect = (slot) => {
        setSelectedSlot(slot);
    };
    const confirmBooking = async () => {
        if (!selectedSlot)
            return;
        if (bookingDisabledReason)
            return;
        setLoading(true);
        try {
            const tzOffsetMinutes = new Date().getTimezoneOffset();
            const response = await fetch('/api/booking/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    therapistId,
                    scheduledAt: selectedSlot.toISOString(),
                    durationMinutes: sessionDuration,
                    tzOffsetMinutes,
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to create booking');
            }
            toast.success('Booking confirmed. You will receive a confirmation email.');
            setSelectedSlot(undefined);
            setSelectedDate(undefined);
            setStep('date');
        }
        catch (error) {
            console.error('Booking error:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to create booking');
        }
        finally {
            setLoading(false);
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
            <h3 className="text-2xl font-bold text-gray-900">Book a Session</h3>
            <p className="text-gray-600 mt-1">with {therapistName}</p>
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
        <div className="flex items-center gap-4 mb-6">
          <Badge variant={step === 'date' || step === 'time' ? 'default' : 'outline'}>
            1. Date
          </Badge>
          <div className="h-px flex-1 bg-gray-300"/>
          <Badge variant={step === 'time' ? 'default' : 'outline'}>2. Time</Badge>
        </div>

        {bookingDisabledReason && (<div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
            <p className="font-semibold">Booking is disabled</p>
            <p className="text-sm mt-1 text-amber-800">{bookingDisabledReason}</p>
          </div>)}

        {(step === 'date' || step === 'time') && (<div>
            <div className="flex items-center gap-2 mb-4">
              <CalendarIcon className="w-5 h-5 text-indigo-600"/>
              <h4 className="text-lg font-semibold text-gray-900">Choose a Date</h4>
            </div>
            <div className="flex justify-center">
              <Calendar mode="single" selected={selectedDate} onSelect={handleDateSelect} disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))} className="rounded-md border"/>
            </div>
          </div>)}

        {step === 'time' && selectedDate && (<div>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-indigo-600"/>
              <h4 className="text-lg font-semibold text-gray-900">
                Available Times for {formatDate(selectedDate)}
              </h4>
            </div>

            {loading ? (<div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>) : bookingDisabledReason ? (<div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-700">Booking is disabled for this therapist.</p>
                <p className="text-sm text-gray-500 mt-2">Send a message to coordinate.</p>
              </div>) : availableSlots.length === 0 ? (<div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-600">No available slots for this date</p>
                <p className="text-sm text-gray-500 mt-2">Please select a different date</p>
              </div>) : (<>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {availableSlots.map((slot) => (<Button key={slot.toISOString()} variant={selectedSlot?.toISOString() === slot.toISOString() ? 'default' : 'outline'} className={`h-14 text-base font-medium transition-all ${selectedSlot?.toISOString() === slot.toISOString()
                        ? 'bg-indigo-600 text-white shadow-lg scale-105'
                        : 'hover:border-indigo-300 hover:bg-indigo-50'}`} onClick={() => handleSlotSelect(slot)}>
                      {formatTime(slot)}
                    </Button>))}
                </div>

                {selectedSlot && (<div className="mt-6 space-y-4">
                    <div className="bg-indigo-50 rounded-lg p-6 border-2 border-indigo-200">
                      <h4 className="font-semibold text-gray-900 mb-4">Booking Summary</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Therapist:</span>
                          <span className="font-medium text-gray-900">{therapistName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Date & Time:</span>
                          <span className="font-medium text-gray-900">
                            {formatDate(selectedSlot)} at {formatTime(selectedSlot)}
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
                          <span className="text-2xl font-bold text-indigo-600">${rate}</span>
                        </div>
                      </div>
                    </div>

                    <Button size="lg" className="w-full text-lg h-14 flex items-center justify-center gap-2" onClick={confirmBooking} disabled={loading || Boolean(bookingDisabledReason)}>
                      {loading ? (<>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Confirming...
                        </>) : (<>
                          <CheckCircle className="w-5 h-5"/>
                          Confirm booking
                        </>)}
                    </Button>
                  </div>)}
              </>)}
          </div>)}
      </CardContent>
    </Card>);
}
