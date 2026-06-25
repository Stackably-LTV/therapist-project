'use client';
import * as React from 'react';
import { cn, normalizeUsPhoneToNationalDigits } from '@/components/98e56006aa84';
import { Input } from '@/components/c2f62fb0cb5e';
export function UsPhoneInput({ value, onValueChange, className, disabled, ...props }) {
    return (<div className={cn('flex w-full items-stretch rounded-md border border-input bg-background focus-within:ring-1 focus-within:ring-ring', disabled && 'opacity-50')}>
      <div className="flex select-none items-center border-r border-input px-3 text-sm text-muted-foreground">
        +1
      </div>
      <Input {...props} disabled={disabled} type="tel" inputMode="numeric" pattern="[0-9]*" autoComplete="tel-national" value={value} onChange={(e) => onValueChange(normalizeUsPhoneToNationalDigits(e.target.value))} maxLength={10} className={cn('h-11 rounded-none border-0 bg-transparent px-3 shadow-none focus-visible:ring-0', className)}/>
    </div>);
}
