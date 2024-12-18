'use client'

import React, { useState, useEffect } from 'react'
import { format, setYear, setMonth, setDate } from 'date-fns'
import { FormControl } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DateSelectorProps {
    field: {
        value: Date | undefined
        onChange: (date: Date | undefined) => void
    }
}

export function DateSelector({ field }: DateSelectorProps) {
    const [selectedDate, setSelectedDate] = useState<Date>(field.value || new Date())

    const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i)
    const months = Array.from({ length: 12 }, (_, i) => i)
    const days = Array.from({ length: 31 }, (_, i) => i + 1)

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
                newDate = setMonth(selectedDate, value)
                break
            case 'year':
                newDate = setYear(selectedDate, value)
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
                    <SelectContent>
                        {days.map((day) => (
                            <SelectItem key={day} value={day.toString()}>
                                {day}
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
                                {format(new Date(2000, month, 1), 'MMMM')}
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
                    <SelectContent>
                        {years.map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                                {year}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </FormControl>
    )
}

