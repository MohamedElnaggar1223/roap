import React, { useState, useEffect } from 'react'
import { format, setYear, setMonth, setDate, getDaysInMonth } from 'date-fns'
import { FormControl } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TextMorph } from '../ui/text-morph'
import { X } from 'lucide-react'
import { Button } from "@/components/ui/button"

interface DateSelectorProps {
    field: {
        value: Date | undefined
        onChange: (date: Date | undefined) => void
    }
    optional?: boolean
}

export function DateSelector({ field, optional }: DateSelectorProps) {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(field.value)

    const years = Array.from({ length: 105 }, (_, i) => (new Date().getFullYear()) + 5 - i)
    const months = Array.from({ length: 12 }, (_, i) => i)
    const daysInMonth = selectedDate ? getDaysInMonth(selectedDate) : 31
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

    const [initialValue] = useState(field.value)

    const areDatesEqual = (date1: Date | undefined, date2: Date | undefined) => {
        if (date1 === undefined && date2 === undefined) return true
        if (date1 === undefined || date2 === undefined) return false
        return date1.getTime() === date2.getTime()
    }

    useEffect(() => {
        if (!areDatesEqual(field.value, selectedDate) && !areDatesEqual(field.value, initialValue)) {
            setSelectedDate(field.value)
        }
    }, [field.value, selectedDate, initialValue])

    useEffect(() => {
        if (field.value && !(field.value instanceof Date)) {
            try {
                const parsed = new Date(field.value);
                if (!isNaN(parsed.getTime())) {
                    setSelectedDate(parsed);
                } else {
                    setSelectedDate(new Date());
                }
            } catch {
                setSelectedDate(new Date());
            }
        }
    }, [field.value]);

    const handleDateChange = (type: 'day' | 'month' | 'year', value: number) => {
        const baseDate = selectedDate || new Date()

        // Create date using UTC to avoid timezone shifts
        let newDate = new Date(Date.UTC(
            baseDate.getFullYear(),
            baseDate.getMonth(),
            baseDate.getDate(),
            12, 0, 0, 0
        ))

        switch (type) {
            case 'day':
                newDate = new Date(Date.UTC(
                    newDate.getUTCFullYear(),
                    newDate.getUTCMonth(),
                    value,
                    12, 0, 0, 0
                ))
                break
            case 'month':
                const daysInNewMonth = getDaysInMonth(new Date(Date.UTC(
                    newDate.getUTCFullYear(),
                    value,
                    1,
                    12, 0, 0, 0
                )))
                const newDay = Math.min(newDate.getUTCDate(), daysInNewMonth)
                newDate = new Date(Date.UTC(
                    newDate.getUTCFullYear(),
                    value,
                    newDay,
                    12, 0, 0, 0
                ))
                break
            case 'year':
                const daysInNewYear = getDaysInMonth(new Date(Date.UTC(
                    value,
                    newDate.getUTCMonth(),
                    1,
                    12, 0, 0, 0
                )))
                const adjustedDay = Math.min(newDate.getUTCDate(), daysInNewYear)
                newDate = new Date(Date.UTC(
                    value,
                    newDate.getUTCMonth(),
                    adjustedDay,
                    12, 0, 0, 0
                ))
                break
            default:
                return
        }

        setSelectedDate(newDate)
        field.onChange(newDate)
    }

    const handleClear = () => {
        setSelectedDate(undefined)
        field.onChange(undefined)
    }

    const getDisplayDay = () => {
        if (!selectedDate) return ""
        return selectedDate.getUTCDate().toString()
    }

    const getDisplayMonth = () => {
        if (!selectedDate) return ""
        return selectedDate.getUTCMonth().toString()
    }

    const getDisplayYear = () => {
        if (!selectedDate) return ""
        return selectedDate.getUTCFullYear().toString()
    }

    return (
        <FormControl>
            <div className="flex flex-col gap-2">
                <div className="flex items-center space-x-2">
                    <Select
                        onValueChange={(value) => handleDateChange('day', parseInt(value))}
                        value={getDisplayDay()}
                    >
                        <SelectTrigger
                            className={`w-[80px] ${!selectedDate ? 'text-muted-foreground' : ''}`}
                        >
                            <SelectValue placeholder="Day">
                                {selectedDate ? getDisplayDay() : "Day"}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent className='bg-[#F1F2E9]'>
                            {days.map((day) => (
                                <SelectItem key={day} value={day.toString()}>
                                    <TextMorph>
                                        {day.toString()}
                                    </TextMorph>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        onValueChange={(value) => handleDateChange('month', parseInt(value))}
                        value={getDisplayMonth()}
                    >
                        <SelectTrigger
                            className={`w-[110px] ${!selectedDate ? 'text-muted-foreground' : ''}`}
                        >
                            <SelectValue placeholder="Month">
                                {selectedDate ? format(new Date(
                                    selectedDate.getUTCFullYear(),
                                    selectedDate.getUTCMonth(),
                                    1
                                ), 'MMMM') : "Month"}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent className='bg-[#F1F2E9]'>
                            {months.map((month) => (
                                <SelectItem key={month} value={month.toString()}>
                                    <TextMorph>
                                        {format(new Date(2000, month, 1), 'MMMM')}
                                    </TextMorph>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        onValueChange={(value) => handleDateChange('year', parseInt(value))}
                        value={getDisplayYear()}
                    >
                        <SelectTrigger
                            className={`w-[90px] ${!selectedDate ? 'text-muted-foreground' : ''}`}
                        >
                            <SelectValue placeholder="Year">
                                {selectedDate ? getDisplayYear() : "Year"}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent className='bg-[#F1F2E9]'>
                            {years.map((year) => (
                                <SelectItem key={year} value={year.toString()}>
                                    <TextMorph>
                                        {year.toString()}
                                    </TextMorph>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {optional && selectedDate && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={handleClear}
                            type="button"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
                {!selectedDate && !optional && (
                    <p className="text-xs text-red-500 mt-1">Please select a date</p>
                )}
            </div>
        </FormControl>
    )
}