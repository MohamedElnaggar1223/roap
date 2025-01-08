'use client'

import React, { useState, useEffect } from 'react'
import { format, setYear, setMonth, setDate, getDaysInMonth } from 'date-fns'
import { FormControl } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TextMorph } from '../ui/text-morph'

interface DateSelectorProps {
    field: {
        value: Date | undefined
        onChange: (date: Date | undefined) => void
    }
    optional?: boolean
}

export function DateSelector({ field, optional }: DateSelectorProps) {
    // Initialize with undefined to match field state
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(field.value)

    const years = Array.from({ length: 105 }, (_, i) => (new Date().getFullYear()) + 5 - i)
    const months = Array.from({ length: 12 }, (_, i) => i)
    // Get days in month based on selected date or current date
    const daysInMonth = selectedDate ? getDaysInMonth(selectedDate) : getDaysInMonth(new Date())
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

    useEffect(() => {
        setSelectedDate(field.value)
    }, [field.value])

    const handleDateChange = (type: 'day' | 'month' | 'year', value: number) => {
        // If no date is selected yet, start with current date
        const baseDate = selectedDate || new Date()
        let newDate: Date

        switch (type) {
            case 'day':
                newDate = setDate(baseDate, value)
                break
            case 'month':
                const daysInNewMonth = getDaysInMonth(setMonth(baseDate, value))
                const newDay = Math.min(baseDate.getDate(), daysInNewMonth)
                newDate = setDate(setMonth(baseDate, value), newDay)
                break
            case 'year':
                const daysInNewYear = getDaysInMonth(setYear(baseDate, value))
                const adjustedDay = Math.min(baseDate.getDate(), daysInNewYear)
                newDate = setDate(setYear(baseDate, value), adjustedDay)
                break
            default:
                newDate = baseDate
        }

        setSelectedDate(newDate)
        field.onChange(newDate)
    }

    const displayDate = selectedDate || new Date()

    return (
        <FormControl>
            <div className="flex flex-col gap-2">
                <div className="flex space-x-2">
                    <Select
                        onValueChange={(value) => handleDateChange('day', parseInt(value))}
                        value={displayDate.getDate().toString()}
                    >
                        <SelectTrigger
                            className={`w-[80px] ${!selectedDate ? 'text-muted-foreground' : ''}`}
                        >
                            <SelectValue placeholder="Day">
                                {selectedDate ? displayDate.getDate().toString() : "Day"}
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
                        value={displayDate.getMonth().toString()}
                    >
                        <SelectTrigger
                            className={`w-[110px] ${!selectedDate ? 'text-muted-foreground' : ''}`}
                        >
                            <SelectValue placeholder="Month">
                                {selectedDate ? format(displayDate, 'MMMM') : "Month"}
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
                        value={displayDate.getFullYear().toString()}
                    >
                        <SelectTrigger
                            className={`w-[90px] ${!selectedDate ? 'text-muted-foreground' : ''}`}
                        >
                            <SelectValue placeholder="Year">
                                {selectedDate ? displayDate.getFullYear().toString() : "Year"}
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
                </div>
                {!selectedDate && !optional && (
                    <p className="text-xs text-red-500 mt-1">Please select a date</p>
                )}
            </div>
        </FormControl>
    )
}