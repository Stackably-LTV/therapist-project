'use client';
import { useState } from 'react';
import { Button } from '@/components/2795b661f080';
import { Calendar } from 'lucide-react';
import BookingModal from '@/components/3a889f18269d';
import { cn } from '@/components/98e56006aa84';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/943378a021ef';
export default function BookingModalTrigger({ therapistId, therapistName, therapistImage, rate, sessionDuration, className, disabled = false, disabledReason = '', defaultOpen = false, }) {
    const [open, setOpen] = useState(Boolean(defaultOpen) && !disabled);
    return (<>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="w-full">
              <Button onClick={() => {
            if (!disabled)
                setOpen(true);
        }} disabled={disabled} className={cn(disabled
            ? 'w-full px-6 py-6 bg-gray-200 text-gray-600 rounded-xl transition-all font-semibold text-center flex items-center justify-center gap-2 text-lg cursor-not-allowed'
            : 'w-full px-6 py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all font-semibold text-center shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-lg', className)}>
                <Calendar className="w-5 h-5"/>
                Book Session
              </Button>
            </span>
          </TooltipTrigger>
          {disabled && disabledReason ? (<TooltipContent>
              <p>{disabledReason}</p>
            </TooltipContent>) : null}
        </Tooltip>
      </TooltipProvider>

      <BookingModal open={open} onOpenChange={setOpen} therapistId={therapistId} therapistName={therapistName} therapistImage={therapistImage} rate={rate} sessionDuration={sessionDuration}/>
    </>);
}
