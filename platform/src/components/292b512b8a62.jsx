'use client';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/2795b661f080';
import { Label } from '@/components/78846397f3ca';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/1712d8a01fd3';
import { Clock, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/components/98e56006aa84';
const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
export function TimePicker({ value, onChange, label, className, disabled }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);
    // Convert 24-hour format to 12-hour format
    const parseTime = (time24) => {
        if (!time24 || !time24.includes(':'))
            return { hour: 12, minute: 0, period: 'AM' };
        const [hours, minutes] = time24.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        return { hour: hour12, minute: minutes || 0, period };
    };
    // Convert 12-hour format to 24-hour format
    const formatTime24 = (hour, minute, period) => {
        let hour24 = hour;
        if (period === 'PM' && hour !== 12)
            hour24 = hour + 12;
        if (period === 'AM' && hour === 12)
            hour24 = 0;
        return `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    };
    const { hour, minute, period } = parseTime(value);
    const handleHourChange = (newHour) => {
        const newTime = formatTime24(Number(newHour), minute, period);
        onChange(newTime);
    };
    const handleMinuteChange = (newMinute) => {
        const newTime = formatTime24(hour, Number(newMinute), period);
        onChange(newTime);
    };
    const handlePeriodChange = (newPeriod) => {
        const newTime = formatTime24(hour, minute, newPeriod);
        onChange(newTime);
    };
    const handleIncrement = (type) => {
        if (type === 'hour') {
            let newHour = hour + 1;
            if (newHour > 12) {
                newHour = 1;
                const newPeriod = period === 'AM' ? 'PM' : 'AM';
                onChange(formatTime24(newHour, minute, newPeriod));
            }
            else {
                onChange(formatTime24(newHour, minute, period));
            }
        }
        else {
            let newMinute = minute + 15;
            if (newMinute >= 60) {
                newMinute = 0;
                let newHour = hour + 1;
                let newPeriod = period;
                if (newHour > 12) {
                    newHour = 1;
                    newPeriod = period === 'AM' ? 'PM' : 'AM';
                }
                onChange(formatTime24(newHour, newMinute, newPeriod));
            }
            else {
                onChange(formatTime24(hour, newMinute, period));
            }
        }
    };
    const handleDecrement = (type) => {
        if (type === 'hour') {
            let newHour = hour - 1;
            if (newHour < 1) {
                newHour = 12;
                const newPeriod = period === 'AM' ? 'PM' : 'AM';
                onChange(formatTime24(newHour, minute, newPeriod));
            }
            else {
                onChange(formatTime24(newHour, minute, period));
            }
        }
        else {
            let newMinute = minute - 15;
            if (newMinute < 0) {
                newMinute = 45;
                let newHour = hour - 1;
                let newPeriod = period;
                if (newHour < 1) {
                    newHour = 12;
                    newPeriod = period === 'AM' ? 'PM' : 'AM';
                }
                onChange(formatTime24(newHour, newMinute, newPeriod));
            }
            else {
                onChange(formatTime24(hour, newMinute, period));
            }
        }
    };
    // Quick preset times
    const presets = [
        { label: '9:00 AM', value: '09:00' },
        { label: '12:00 PM', value: '12:00' },
        { label: '1:00 PM', value: '13:00' },
        { label: '3:00 PM', value: '15:00' },
        { label: '5:00 PM', value: '17:00' },
        { label: '6:00 PM', value: '18:00' },
    ];
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!isOpen)
                return;
            const target = event.target;
            // Don't close if clicking inside the container
            if (containerRef.current?.contains(target)) {
                return;
            }
            // Don't close if clicking on Radix UI Select portal elements
            // Check for various Radix UI select elements
            const isRadixSelect = target.closest('[data-radix-select-content]') ||
                target.closest('[data-radix-portal]') ||
                target.closest('[data-radix-popper-content-wrapper]') ||
                target.closest('[data-slot="select-content"]') ||
                target.closest('[data-slot="select-trigger"]') ||
                target.closest('[data-slot="select-item"]') ||
                target.closest('[role="listbox"]') ||
                target.closest('[role="option"]') ||
                // Check if any Select is currently open by looking for open state
                document.querySelector('[data-state="open"][data-slot="select-content"]');
            if (isRadixSelect) {
                return;
            }
            // Small delay to allow Select interactions to complete
            setTimeout(() => {
                // Double-check that no Select is open before closing
                const hasOpenSelect = document.querySelector('[data-state="open"][data-slot="select-content"]');
                if (!hasOpenSelect) {
                    setIsOpen(false);
                }
            }, 150);
        };
        if (isOpen) {
            // Use capture phase to catch events early
            document.addEventListener('mousedown', handleClickOutside, true);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside, true);
            };
        }
    }, [isOpen]);
    return (<div ref={containerRef} className={cn('relative', className)}>
      {label && (<Label className="text-sm font-medium text-gray-700 mb-1.5 block">{label}</Label>)}
      
      <div className="relative">
        {/* Main Time Display - Clickable */}
        <Button type="button" variant="outline" className={cn('w-full justify-between h-11 px-4 text-left font-medium', 'hover:bg-gray-50 dark:hover:bg-gray-800 focus:ring-2 focus:ring-blue-500', 'dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100', disabled && 'opacity-50 cursor-not-allowed')} onClick={() => !disabled && setIsOpen(!isOpen)} disabled={disabled}>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500"/>
            <span className="text-base">
              {hour}:{String(minute).padStart(2, '0')} {period}
            </span>
          </div>
        </Button>

        {/* Dropdown Picker */}
        {isOpen && !disabled && (<div className="absolute z-50 mt-2 w-full min-w-[320px] bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-xl p-4 left-0" onMouseDown={(e) => {
                // Prevent closing when clicking inside the dropdown
                e.stopPropagation();
            }}>
            <div className="space-y-4">
              {/* Time Selectors */}
              <div className="flex items-center justify-center gap-4">
                {/* Hour */}
                <div className="flex flex-col items-center gap-2">
                  <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => handleIncrement('hour')}>
                    <ChevronUp className="h-4 w-4"/>
                  </Button>
                  <Select value={String(hour)} onValueChange={handleHourChange}>
                    <SelectTrigger className="w-20 h-14 text-xl font-bold px-3 tracking-wider">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HOURS_12.map((h) => (<SelectItem key={h} value={String(h)} className="text-center font-semibold">
                          {h}
                        </SelectItem>))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => handleDecrement('hour')}>
                    <ChevronDown className="h-4 w-4"/>
                  </Button>
                </div>

                <span className="text-3xl font-bold text-gray-400 dark:text-gray-500 pb-2">:</span>

                {/* Minute */}
                <div className="flex flex-col items-center gap-2">
                  <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => handleIncrement('minute')}>
                    <ChevronUp className="h-4 w-4"/>
                  </Button>
                  <Select value={String(minute)} onValueChange={handleMinuteChange}>
                    <SelectTrigger className="w-20 h-14 text-xl font-bold px-3 tracking-wider">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {MINUTES.filter((m) => m % 15 === 0).map((m) => (<SelectItem key={m} value={String(m)} className="text-center font-semibold">
                          {String(m).padStart(2, '0')}
                        </SelectItem>))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => handleDecrement('minute')}>
                    <ChevronDown className="h-4 w-4"/>
                  </Button>
                </div>

                {/* AM/PM */}
                <div className="flex flex-col items-center gap-2">
                  <div className="h-8 w-8"/> {/* Spacer for alignment */}
                  <Select value={period} onValueChange={handlePeriodChange}>
                    <SelectTrigger className="w-20 h-14 text-lg font-bold px-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AM" className="text-center font-semibold">AM</SelectItem>
                      <SelectItem value="PM" className="text-center font-semibold">PM</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="h-8 w-8"/> {/* Spacer for alignment */}
                </div>
              </div>

              {/* Quick Presets */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Quick Select</p>
                <div className="grid grid-cols-3 gap-2">
                  {presets.map((preset) => (<Button key={preset.value} type="button" variant="outline" size="sm" className="text-xs hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:border-blue-300 dark:hover:border-blue-700" onClick={() => {
                    onChange(preset.value);
                    setIsOpen(false);
                }}>
                      {preset.label}
                    </Button>))}
                </div>
              </div>
            </div>
          </div>)}
      </div>
    </div>);
}
