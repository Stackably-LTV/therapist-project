'use client';
import { Button } from '@/components/2795b661f080';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/c0ebd3fbafc6';
import { Input } from '@/components/c2f62fb0cb5e';
import { Switch } from '@/components/395ec797588e';
import { Plus, Trash2, Clock, Copy, Calendar, Repeat, Briefcase } from 'lucide-react';
import { cn } from '@/components/98e56006aa84';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/943378a021ef';
const DAYS = [
    { value: 1, label: 'Monday', short: 'Mon' },
    { value: 2, label: 'Tuesday', short: 'Tue' },
    { value: 3, label: 'Wednesday', short: 'Wed' },
    { value: 4, label: 'Thursday', short: 'Thu' },
    { value: 5, label: 'Friday', short: 'Fri' },
    { value: 6, label: 'Saturday', short: 'Sat' },
    { value: 0, label: 'Sunday', short: 'Sun' },
];
const DEFAULT_START = '09:00';
const DEFAULT_END = '17:00';
export default function AvailabilityEditor({ value, onChange }) {
    // Helper to get slots for a specific day
    const getDaySlots = (dayIndex) => {
        return value.filter(s => s.dayOfWeek === dayIndex).sort((a, b) => a.startTime.localeCompare(b.startTime));
    };
    // Helper to check if a day is active (has slots)
    const isDayActive = (dayIndex) => {
        return value.some(s => s.dayOfWeek === dayIndex);
    };
    const handleDayToggle = (dayIndex, active) => {
        if (active) {
            // Add default slot
            const newSlot = {
                dayOfWeek: dayIndex,
                startTime: DEFAULT_START,
                endTime: DEFAULT_END,
            };
            onChange([...value, newSlot]);
        }
        else {
            // Remove all slots for this day
            onChange(value.filter(s => s.dayOfWeek !== dayIndex));
        }
    };
    const addSlotToDay = (dayIndex) => {
        const newSlot = {
            dayOfWeek: dayIndex,
            startTime: '13:00',
            endTime: '14:00',
        };
        onChange([...value, newSlot]);
    };
    const updateSlot = (originalSlot, field, newValue) => {
        const newValueArr = value.map(s => {
            if (s === originalSlot) {
                return { ...s, [field]: newValue };
            }
            return s;
        });
        onChange(newValueArr);
    };
    const removeSlot = (slotToRemove) => {
        onChange(value.filter(s => s !== slotToRemove));
    };
    const copyDaySchedule = (sourceDayIndex, targetDayIndices) => {
        const sourceSlots = getDaySlots(sourceDayIndex);
        if (sourceSlots.length === 0)
            return;
        // Remove existing slots for targets
        let newValue = value.filter(s => !targetDayIndices.includes(s.dayOfWeek));
        // Add source slots to targets
        targetDayIndices.forEach(targetDay => {
            sourceSlots.forEach(slot => {
                newValue.push({
                    dayOfWeek: targetDay,
                    startTime: slot.startTime,
                    endTime: slot.endTime
                });
            });
        });
        onChange(newValue);
    };
    const copyToWeekdays = (sourceDayIndex) => {
        copyDaySchedule(sourceDayIndex, [1, 2, 3, 4, 5].filter(d => d !== sourceDayIndex));
    };
    const copyToAllDays = (sourceDayIndex) => {
        copyDaySchedule(sourceDayIndex, [0, 1, 2, 3, 4, 5, 6].filter(d => d !== sourceDayIndex));
    };
    return (<div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Weekly Schedule</h3>
          <p className="text-sm text-gray-500">Set your recurring weekly availability.</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => {
            // Set 9-5 M-F
            const slots = [];
            [1, 2, 3, 4, 5].forEach(day => {
                slots.push({ dayOfWeek: day, startTime: DEFAULT_START, endTime: DEFAULT_END });
            });
            onChange(slots);
        }} className="text-xs">
            <Briefcase className="w-3.5 h-3.5 mr-2 text-gray-500"/>
            9-5 Weekdays
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange([])} className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50">
            Clear All
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {DAYS.map((day) => {
            const isActive = isDayActive(day.value);
            const slots = getDaySlots(day.value);
            return (<Card key={day.value} className={cn("transition-all duration-200 border-2", isActive ? "border-indigo-100 shadow-md ring-1 ring-indigo-50" : "border-dashed border-gray-200 bg-gray-50/30 opacity-70 hover:opacity-100")}>
              <CardHeader className="pb-3 pt-4 px-4 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                  <div className={cn("p-2 rounded-lg transition-colors", isActive ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-500")}>
                    <Calendar className="w-4 h-4"/>
                  </div>
                  <CardTitle className={cn("text-base font-bold", isActive ? "text-gray-900" : "text-gray-500")}>
                    {day.label}
                  </CardTitle>
                </div>
                <Switch checked={isActive} onCheckedChange={(checked) => handleDayToggle(day.value, checked)} className="data-[state=checked]:bg-indigo-600 scale-90"/>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                  {isActive ? (<div className="space-y-3">
                      <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                        {slots.map((slot, index) => (<div key={index} className="group flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex-1 flex items-center gap-1.5 bg-gray-50 rounded-lg p-1.5 border border-gray-100 hover:border-indigo-200 transition-colors">
                              <Input type="time" value={slot.startTime} onChange={(e) => updateSlot(slot, 'startTime', e.target.value)} className="h-7 min-w-0 flex-1 border-0 bg-transparent text-xs sm:text-sm focus-visible:ring-0 p-0 text-center font-semibold text-gray-700 hover:bg-white rounded"/>
                              <span className="text-gray-300 text-[10px] font-bold">TO</span>
                              <Input type="time" value={slot.endTime} onChange={(e) => updateSlot(slot, 'endTime', e.target.value)} className="h-7 min-w-0 flex-1 border-0 bg-transparent text-xs sm:text-sm focus-visible:ring-0 p-0 text-center font-semibold text-gray-700 hover:bg-white rounded"/>
                            </div>

                            <Button type="button" variant="ghost" size="icon" onClick={() => removeSlot(slot)} className="h-8 w-8 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-600 hover:bg-red-50 rounded-full transition-all">
                              <Trash2 className="w-3.5 h-3.5"/>
                            </Button>
                          </div>))}
                      </div>
                      
                      <div className="pt-2 mt-2 border-t border-gray-100 flex flex-col gap-2">
                        <Button type="button" variant="ghost" size="sm" onClick={() => addSlotToDay(day.value)} className="w-full h-8 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-medium justify-center border border-dashed border-indigo-200">
                          <Plus className="w-3 h-3 mr-1.5"/>
                          Add Time Slot
                        </Button>

                        <div className="flex justify-between items-center px-1">
                           <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button type="button" variant="ghost" size="sm" onClick={() => copyToWeekdays(day.value)} className="h-7 text-[10px] text-gray-400 hover:text-gray-700 px-2">
                                  <Copy className="w-3 h-3 mr-1.5"/>
                                  Copy M-F
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>Copy to Weekdays</p></TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                           <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button type="button" variant="ghost" size="sm" onClick={() => copyToAllDays(day.value)} className="h-7 text-[10px] text-gray-400 hover:text-gray-700 px-2">
                                  <Repeat className="w-3 h-3 mr-1.5"/>
                                  Copy All
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>Copy to other days</p></TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </div>) : (<div className="h-32 flex flex-col items-center justify-center text-center p-4 border border-dashed rounded-lg bg-gray-50/50">
                      <Clock className="w-10 h-10 text-gray-300 mb-2"/>
                      <p className="text-xs text-muted-foreground font-medium">No availability set</p>
                      <p className="text-[10px] text-gray-400 mt-1">Toggle switch to add hours</p>
                    </div>)}
              </CardContent>
            </Card>);
        })}
      </div>
    </div>);
}
