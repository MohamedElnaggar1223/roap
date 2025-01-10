'use client'

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
    const daysInMonth = selectedDate ? getDaysInMonth(selectedDate) : 31 // Default to 31 days when no date is selected
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

    // Skip the initial effect when field.value is undefined
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

    const handleDateChange = (type: 'day' | 'month' | 'year', value: number) => {
        // If there's no selected date, create a new one from the current date
        // but only if this is the first interaction
        const baseDate = selectedDate || new Date()
        const currentYear = baseDate.getFullYear()
        const currentMonth = baseDate.getMonth()
        const currentDay = baseDate.getDate()

        let newDate = new Date(currentYear, currentMonth, currentDay)

        switch (type) {
            case 'day':
                newDate = setDate(newDate, value)
                break
            case 'month':
                const daysInNewMonth = getDaysInMonth(setMonth(newDate, value))
                const newDay = Math.min(currentDay, daysInNewMonth)
                newDate = setDate(setMonth(newDate, value), newDay)
                break
            case 'year':
                const daysInNewYear = getDaysInMonth(setYear(newDate, value))
                const adjustedDay = Math.min(currentDay, daysInNewYear)
                newDate = setDate(setYear(newDate, value), adjustedDay)
                break
            default:
                return // Do nothing if type is invalid
        }

        setSelectedDate(newDate)
        field.onChange(newDate)
    }

    const handleClear = () => {
        setSelectedDate(undefined)
        field.onChange(undefined)
    }

    return (
        <FormControl>
            <div className="flex flex-col gap-2">
                <div className="flex items-center space-x-2">
                    <Select
                        onValueChange={(value) => handleDateChange('day', parseInt(value))}
                        value={selectedDate ? selectedDate.getDate().toString() : ""}
                    >
                        <SelectTrigger
                            className={`w-[80px] ${!selectedDate ? 'text-muted-foreground' : ''}`}
                        >
                            <SelectValue placeholder="Day">
                                {selectedDate ? selectedDate.getDate().toString() : "Day"}
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
                        value={selectedDate ? selectedDate.getMonth().toString() : ""}
                    >
                        <SelectTrigger
                            className={`w-[110px] ${!selectedDate ? 'text-muted-foreground' : ''}`}
                        >
                            <SelectValue placeholder="Month">
                                {selectedDate ? format(selectedDate, 'MMMM') : "Month"}
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
                        value={selectedDate ? selectedDate.getFullYear().toString() : ""}
                    >
                        <SelectTrigger
                            className={`w-[90px] ${!selectedDate ? 'text-muted-foreground' : ''}`}
                        >
                            <SelectValue placeholder="Year">
                                {selectedDate ? selectedDate.getFullYear().toString() : "Year"}
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