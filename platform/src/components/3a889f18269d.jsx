'use client';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ba221113eac7';
import { Calendar } from '@/components/111083d11e1f';
import { Button } from '@/components/2795b661f080';
import { Clock, DollarSign, Check, ArrowRight, Sparkles, Shield, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/components/98e56006aa84';
export default function BookingModal({ open, onOpenChange, therapistId, therapistName, therapistImage, rate, sessionDuration, }) {
    const [step, setStep] = useState(1);
    const [selectedDate, setSelectedDate] = useState(undefined);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(undefined);
    const [loading, setLoading] = useState(false);
    const [processingBooking, setProcessingBooking] = useState(false);
    const [bookingDisabledReason, setBookingDisabledReason] = useState('');
    const [month, setMonth] = useState(() => new Date());
    const [monthSlotsByDateKey, setMonthSlotsByDateKey] = useState({});
    const [availableDateKeys, setAvailableDateKeys] = useState([]);
    const [minBookableDateKey, setMinBookableDateKey] = useState('');
    const tzOffsetMinutes = useMemo(() => new Date().getTimezoneOffset(), []);
    const dateKeyFromDate = useCallback((date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }, []);
    const dateKeyFromIsoInSeekerTz = useCallback((iso) => {
        const utc = new Date(iso);
        if (Number.isNaN(utc.getTime()))
            return '';
        const localMs = utc.getTime() - tzOffsetMinutes * 60_000;
        const local = new Date(localMs);
        const y = local.getUTCFullYear();
        const m = String(local.getUTCMonth() + 1).padStart(2, '0');
        const d = String(local.getUTCDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }, [tzOffsetMinutes]);
    const startOfToday = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);
    const effectiveMinBookableDateKey = useMemo(() => {
        const todayKey = dateKeyFromDate(startOfToday);
        if (!minBookableDateKey)
            return todayKey;
        return minBookableDateKey > todayKey ? minBookableDateKey : todayKey;
    }, [dateKeyFromDate, minBookableDateKey, startOfToday]);
    const fetchMonthAvailability = useCallback(async () => {
        if (!open)
            return;
        setLoading(true);
        try {
            const first = new Date(month.getFullYear(), month.getMonth(), 1);
            const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
            const startKey = dateKeyFromDate(first);
            const endKey = dateKeyFromDate(last);
            const response = await fetch(`/api/booking/availability/${therapistId}?startDateKey=${startKey}&endDateKey=${endKey}&tzOffsetMinutes=${tzOffsetMinutes}`);
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(String(data?.error || 'Failed to fetch availability'));
            }
            if (data?.bookingEnabled === false) {
                setBookingDisabledReason(String(data.bookingDisabledReason || 'Booking is currently disabled.'));
                setAvailableDateKeys([]);
                setMonthSlotsByDateKey({});
                setMinBookableDateKey(String(data?.minBookableDateKey || ''));
                return;
            }
            setBookingDisabledReason('');
            setMinBookableDateKey(String(data?.minBookableDateKey || ''));
            const slotIsos = data.availableSlots || [];
            const map = {};
            for (const iso of slotIsos) {
                const key = dateKeyFromIsoInSeekerTz(iso);
                if (!key)
                    continue;
                if (!map[key])
                    map[key] = [];
                map[key].push(new Date(iso));
            }
            for (const key of Object.keys(map)) {
                map[key].sort((a, b) => a.getTime() - b.getTime());
            }
            setMonthSlotsByDateKey(map);
            const keys = data.availableDateKeys || Object.keys(map);
            setAvailableDateKeys(keys.slice().sort());
        }
        catch (error) {
            console.error('Error fetching month availability:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to load availability');
        }
        finally {
            setLoading(false);
        }
    }, [open, month, therapistId, tzOffsetMinutes, dateKeyFromDate, dateKeyFromIsoInSeekerTz]);
    useEffect(() => {
        void fetchMonthAvailability();
    }, [fetchMonthAvailability]);
    useEffect(() => {
        if (!selectedDate) {
            setAvailableSlots([]);
            return;
        }
        const key = dateKeyFromDate(selectedDate);
        setAvailableSlots(monthSlotsByDateKey[key] || []);
        setSelectedSlot(undefined);
    }, [selectedDate, dateKeyFromDate, monthSlotsByDateKey]);
    useEffect(() => {
        if (!open) {
            setTimeout(() => {
                setStep(1);
                setSelectedDate(undefined);
                setSelectedSlot(undefined);
                setAvailableSlots([]);
                setBookingDisabledReason('');
                setMonth(new Date());
                setMonthSlotsByDateKey({});
                setAvailableDateKeys([]);
                setMinBookableDateKey('');
            }, 200);
        }
    }, [open]);
    const handleDateSelect = (date) => {
        setSelectedDate(date);
        setSelectedSlot(undefined);
    };
    const handleSlotSelect = (slot) => {
        setSelectedSlot(slot);
    };
    const proceedToNextStep = () => {
        if (bookingDisabledReason)
            return;
        if (step === 1 && selectedDate && availableSlots.length > 0) {
            setStep(2);
        }
        else if (step === 2 && selectedSlot) {
            setStep(3);
        }
    };
    const confirmBooking = async () => {
        if (!selectedSlot)
            return;
        if (bookingDisabledReason)
            return;
        const selectedKey = selectedDate ? dateKeyFromDate(selectedDate) : '';
        if (selectedKey && !(monthSlotsByDateKey[selectedKey] || []).some((s) => s.toISOString() === selectedSlot.toISOString())) {
            toast.error('That time slot is no longer available. Please pick another time.');
            return;
        }
        setProcessingBooking(true);
        try {
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
            if (typeof data?.url === 'string' && data.url) {
                toast.success('Redirecting to secure payment');
                window.location.href = data.url;
                return;
            }
            toast.success('Booking confirmed');
            onOpenChange(false);
        }
        catch (error) {
            console.error('Booking error:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to create booking');
        }
        finally {
            setProcessingBooking(false);
        }
    };
    const availableDateKeysSet = useMemo(() => new Set(availableDateKeys), [availableDateKeys]);
    const blockedDay = useCallback((date) => {
        const key = dateKeyFromDate(date);
        return key < effectiveMinBookableDateKey;
    }, [dateKeyFromDate, effectiveMinBookableDateKey]);
    const noAvailabilityDay = useCallback((date) => {
        const key = dateKeyFromDate(date);
        if (key < effectiveMinBookableDateKey)
            return false;
        return !availableDateKeysSet.has(key);
    }, [availableDateKeysSet, dateKeyFromDate, effectiveMinBookableDateKey]);
    const BookingDayButton = useCallback(({ modifiers, children, className, ...props }) => {
        const isAvailable = Boolean(modifiers?.availableDay);
        const isNoAvailability = Boolean(modifiers?.noAvailabilityDay);
        return (<button {...props} className={cn('relative flex aspect-square w-full min-w-10 flex-col items-center justify-center rounded-md text-sm', 'disabled:opacity-50 disabled:cursor-not-allowed', className)}>
          <span className="leading-none">{children}</span>
          <span className={cn('mt-1 h-1.5 w-1.5 rounded-full', isAvailable ? 'bg-emerald-500' : isNoAvailability ? 'bg-slate-300' : 'bg-transparent')}/>
        </button>);
    }, []);
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
    return (<Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
            <DialogHeader>
              <DialogTitle className="text-3xl font-bold text-white mb-2">
                Book Your Session
              </DialogTitle>
              <p className="text-indigo-100">with {therapistName}</p>
            </DialogHeader>

            {/* Progress Steps */}
            <div className="flex items-center gap-4 mt-6">
              {[1, 2, 3].map((s) => (<div key={s} className="flex items-center flex-1">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${step >= s
                ? 'bg-white text-indigo-600 shadow-lg'
                : 'bg-white/20 text-white'}`}>
                    {step > s ? (<Check className="w-5 h-5"/>) : (<span className="font-semibold">{s}</span>)}
                  </div>
                  {s < 3 && (<div className={`flex-1 h-1 mx-2 rounded transition-all ${step > s ? 'bg-white' : 'bg-white/20'}`}/>)}
                </div>))}
            </div>

            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-indigo-100">
                {step === 1 && 'Choose a date'}
                {step === 2 && 'Select your time'}
                {step === 3 && 'Confirm booking'}
              </span>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4"/>
                  {sessionDuration} min
                </div>
                <div className="flex items-center gap-1 font-bold text-lg">
                  <DollarSign className="w-5 h-5"/>
                  {rate}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Content */}
        <div className="p-8">
          <AnimatePresence mode="wait">
            {/* Step 1: Date Selection */}
            {step === 1 && (<motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    When would you like to meet?
                  </h3>
                  <p className="text-gray-600">
                    Select a date to see available time slots
                  </p>
                </div>

                {bookingDisabledReason && (<div className="max-w-xl mx-auto rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                    <p className="font-semibold">Booking is disabled</p>
                    <p className="text-sm mt-1 text-amber-800">{bookingDisabledReason}</p>
                  </div>)}

                {!bookingDisabledReason && minBookableDateKey && effectiveMinBookableDateKey > dateKeyFromDate(startOfToday) ? (<div className="max-w-xl mx-auto rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-900">
                    <p className="font-semibold">Booking opens soon</p>
                    <p className="text-sm mt-1 text-blue-800">
                      This therapist is new. Booking opens on {effectiveMinBookableDateKey}.
                    </p>
                  </div>) : null}

                <div className="flex justify-center">
                  <Calendar mode="single" selected={selectedDate} onSelect={handleDateSelect} month={month} onMonthChange={setMonth} disabled={(date) => blockedDay(date) || Boolean(bookingDisabledReason)} modifiers={{
                availableDay: (date) => availableDateKeysSet.has(dateKeyFromDate(date)),
                noAvailabilityDay: (date) => noAvailabilityDay(date),
            }} components={{
                DayButton: BookingDayButton,
            }} className="rounded-lg border-2 border-gray-200 shadow-lg"/>
                </div>

                <div className="mx-auto max-w-xl text-xs text-slate-600 flex items-center justify-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500"/>
                    Available
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-slate-300"/>
                    No availability
                  </div>
                </div>

                {selectedDate && (<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center">
                    <Button onClick={proceedToNextStep} disabled={Boolean(bookingDisabledReason) ||
                    availableSlots.length === 0 ||
                    loading ||
                    dateKeyFromDate(selectedDate) < effectiveMinBookableDateKey} className="w-full max-w-sm h-12 px-6 text-base">
                      {loading ? ('Loading slots...') : dateKeyFromDate(selectedDate) < effectiveMinBookableDateKey ? ('Not bookable yet') : bookingDisabledReason ? ('Booking disabled') : availableSlots.length === 0 ? ('No slots available') : (<>
                          Continue
                          <ArrowRight className="ml-2 w-4 h-4"/>
                        </>)}
                    </Button>
                  </motion.div>)}
              </motion.div>)}

            {/* Step 2: Time Selection */}
            {step === 2 && selectedDate && (<motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Pick your perfect time
                  </h3>
                  <p className="text-gray-600">{formatDate(selectedDate)}</p>
                </div>

                {loading ? (<div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                  </div>) : availableSlots.length === 0 ? (<div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 mb-4">No available slots for this date</p>
                    <Button variant="outline" onClick={() => setStep(1)}>
                      Choose Another Date
                    </Button>
                  </div>) : (<>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-96 overflow-y-auto p-2">
                      {availableSlots.map((slot) => (<motion.div key={slot.toISOString()} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button variant={selectedSlot?.toISOString() === slot.toISOString()
                        ? 'default'
                        : 'outline'} className={`w-full h-16 text-base font-medium transition-all ${selectedSlot?.toISOString() === slot.toISOString()
                        ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-xl scale-105'
                        : 'hover:border-indigo-300 hover:bg-indigo-50'}`} onClick={() => handleSlotSelect(slot)}>
                            {formatTime(slot)}
                          </Button>
                        </motion.div>))}
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-12">
                        Back
                      </Button>
                      <Button onClick={proceedToNextStep} disabled={!selectedSlot} className="flex-1 h-12 text-base">
                        Continue
                        <ArrowRight className="ml-2 w-4 h-4"/>
                      </Button>
                    </div>
                  </>)}
              </motion.div>)}

            {/* Step 3: Confirmation */}
            {step === 3 && selectedSlot && (<motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="text-center">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-10 h-10 text-white"/>
                  </motion.div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Almost there!
                  </h3>
                  <p className="text-gray-600">Review your booking details</p>
                </div>

                {/* Booking Summary Card */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-indigo-200">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-4 border-b border-indigo-200">
                      <span className="text-gray-600 font-medium">Therapist</span>
                      <span className="font-bold text-gray-900">{therapistName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 font-medium">Date</span>
                      <span className="font-semibold text-gray-900">
                        {formatDate(selectedSlot)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 font-medium">Time</span>
                      <span className="font-semibold text-gray-900">
                        {formatTime(selectedSlot)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 font-medium">Duration</span>
                      <span className="font-semibold text-gray-900">
                        {sessionDuration} minutes
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t-2 border-indigo-300">
                      <span className="text-lg font-bold text-gray-900">Total</span>
                      <span className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        ${rate}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
                    <Shield className="w-6 h-6 text-green-600 mx-auto mb-2"/>
                    <p className="text-xs text-gray-600">Secure Booking</p>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
                    <Zap className="w-6 h-6 text-yellow-600 mx-auto mb-2"/>
                    <p className="text-xs text-gray-600">Instant Booking</p>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
                    <Check className="w-6 h-6 text-blue-600 mx-auto mb-2"/>
                    <p className="text-xs text-gray-600">HIPAA Compliant</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1 h-12">
                    Back
                  </Button>
                  <Button onClick={confirmBooking} disabled={processingBooking} className="flex-1 h-12 text-base bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                    {processingBooking ? (<>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Confirming...
                      </>) : (<>
                        <Check className="mr-2 w-4 h-4"/>
                        Confirm Booking
                      </>)}
                  </Button>
                </div>
              </motion.div>)}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>);
}
