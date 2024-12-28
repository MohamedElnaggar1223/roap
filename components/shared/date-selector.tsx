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
}

export function DateSelector({ field }: DateSelectorProps) {
    const [selectedDate, setSelectedDate] = useState<Date>(field.value || new Date())

    const years = Array.from({ length: 105 }, (_, i) => (new Date().getFullYear()) + 5 - i)
    const months = Array.from({ length: 12 }, (_, i) => i)
    const daysInMonth = getDaysInMonth(selectedDate)
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

    useEffect(() => {
        if (field.value) {
            setSelectedDate(field.value)
        }
    }, [field.value])

    const handleDateChange = (type: 'day' | 'month' | 'year', value: number) => {
        let newDate: Date

        switch (type) {
            case 'day':
                newDate = setDate(selectedDate, value)
                break
            case 'month':
                // When changing months, ensure the day is valid for the new month
                const daysInNewMonth = getDaysInMonth(setMonth(selectedDate, value))
                const newDay = Math.min(selectedDate.getDate(), daysInNewMonth)
                newDate = setDate(setMonth(selectedDate, value), newDay)
                break
            case 'year':
                // When changing years, handle February 29th in leap years
                const daysInNewYear = getDaysInMonth(setYear(selectedDate, value))
                const adjustedDay = Math.min(selectedDate.getDate(), daysInNewYear)
                newDate = setDate(setYear(selectedDate, value), adjustedDay)
                break
            default:
                newDate = selectedDate
        }

        setSelectedDate(newDate)
        field.onChange(newDate)
    }

    return (
        <FormControl>
            <div className="flex space-x-2">
                <Select
                    onValueChange={(value) => handleDateChange('day', parseInt(value))}
                    value={selectedDate.getDate().toString()}
                >
                    <SelectTrigger className="w-[80px]">
                        <SelectValue placeholder="Day" />
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
                    value={selectedDate.getMonth().toString()}
                >
                    <SelectTrigger className="w-[110px]">
                        <SelectValue placeholder="Month" />
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
                    value={selectedDate.getFullYear().toString()}
                >
                    <SelectTrigger className="w-[90px]">
                        <SelectValue placeholder="Year" />
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
        </FormControl>
    )
}