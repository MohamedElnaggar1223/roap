"use client"

import { useCallback, useEffect, useMemo, useState, useTransition } from "react"
import { addDays, addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, isToday, startOfMonth, startOfWeek } from "date-fns"
import { ChevronLeft, ChevronRight, ChevronsUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn, formatTimeRange } from "@/lib/utils"
import { getCalendarSlots } from "@/lib/actions/academics.actions"

type Event = {
  id: number | null
  date: string | null
  startTime: string | null
  endTime: string | null
  status: string | null
  programName: string | null
  studentName: string | null
  studentBirthday: string | null
  branchName: string | null
  sportName: string | null
  packageName: string | null
  coachName: string | null
}

type CalendarView = 'day' | 'week' | 'month'

const WEEK_DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]
const TIME_SLOTS = Array.from({ length: 16 }, (_, i) => i + 8)

export default function Calendar() {

  const today = new Date()
  const [events, setEvents] = useState<Event[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isPending, startTransition] = useTransition()
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [calendarView, setCalendarView] = useState<CalendarView>('week')
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
  const [selectedSport, setSelectedSport] = useState<string | null>(null)
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)
  const [selectedCoach, setSelectedCoach] = useState<string | null>(null)

  const locations = Array.from(new Set(events.map(e => e.branchName).filter(Boolean)))
  const sports = Array.from(new Set(events.map(e => e.sportName).filter(Boolean)))
  const packages = Array.from(new Set(events.map(e => e.packageName).filter(Boolean)))
  const coaches = Array.from(new Set(events.map(e => e.coachName).filter(Boolean)))

  const dateRange = useMemo(() => {
    switch (calendarView) {
      case 'day':
        return {
          start: currentDate,
          end: currentDate
        }
      case 'week':
        return {
          start: startOfWeek(currentDate, { weekStartsOn: 1 }),
          end: endOfWeek(currentDate, { weekStartsOn: 1 })
        }
      case 'month':
        return {
          start: startOfMonth(currentDate),
          end: endOfMonth(currentDate)
        }
    }
  }, [currentDate, calendarView])

  const navigate = (direction: 'prev' | 'next') => {
    switch (calendarView) {
      case 'day':
        setCurrentDate(prev => addDays(prev, direction === 'next' ? 1 : -1))
        break
      case 'week':
        setCurrentDate(prev => addDays(prev, direction === 'next' ? 7 : -7))
        break
      case 'month':
        setCurrentDate(prev => addMonths(prev, direction === 'next' ? 1 : -1))
        break
    }
  }

  // const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  // const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })


  // const weekDates = WEEK_DAYS.map((_, i) => addDays(weekStart, i))

  // const events: Event[] = [
  //   {
  //     id: "1",
  //     title: "SWIMMING U16",
  //     start: new Date(2024, 4, 23, 8, 0),
  //     end: new Date(2024, 4, 23, 9, 0),
  //     participant: "Hanna Ahmed, 16",
  //     type: "swimming",
  //   },
  //   {
  //     id: "2",
  //     title: "SWIMMING U16",
  //     start: new Date(2024, 4, 23, 8, 0),
  //     end: new Date(2024, 4, 23, 9, 0),
  //     participant: "John Doe, 16",
  //     type: "swimming",
  //   },
  //   {
  //     id: "3",
  //     title: "SWIMMING U16",
  //     start: new Date(2024, 4, 23, 8, 0),
  //     end: new Date(2024, 4, 23, 9, 0),
  //     participant: "Jane Smith, 16",
  //     type: "swimming",
  //   },
  //   {
  //     id: "4",
  //     title: "BLOCK",
  //     start: new Date(2024, 4, 24, 8, 0),
  //     end: new Date(2024, 4, 24, 9, 0),
  //     participant: "",
  //     type: "block",
  //   },
  //   {
  //     id: "5",
  //     title: "SWIMMING U16",
  //     start: new Date(2024, 4, 25, 11, 0),
  //     end: new Date(2024, 4, 25, 12, 0),
  //     participant: "Hanna Ahmed, 16",
  //     type: "swimming",
  //   },
  //   {
  //     id: "6",
  //     title: "SWIMMING U16",
  //     start: new Date(2024, 4, 26, 8, 0),
  //     end: new Date(2024, 4, 26, 9, 0),
  //     participant: "Hanna Ahmed, 16",
  //     type: "swimming",
  //   },
  //   {
  //     id: "7",
  //     title: "SWIMMING U16",
  //     start: new Date(2024, 4, 27, 12, 0),
  //     end: new Date(2024, 4, 27, 13, 0),
  //     participant: "Hanna Ahmed, 16",
  //     type: "swimming",
  //   },
  // ]

  console.log(events)

  const fetchEvents = useCallback(async () => {
    startTransition(async () => {
      const result = await getCalendarSlots(dateRange.start, dateRange.end)
      setEvents(result)
    })
  }, [dateRange.start, dateRange.end])

  useEffect(() => {
    fetchEvents()
  }, [])

  useEffect(() => {
    let filtered = [...events]
    
    if (selectedLocation) {
      filtered = filtered.filter(event => event.branchName === selectedLocation)
    }
    if (selectedSport) {
      filtered = filtered.filter(event => event.sportName === selectedSport)
    }
    if (selectedPackage) {
      filtered = filtered.filter(event => event.packageName === selectedPackage)
    }
    if (selectedCoach) {
      filtered = filtered.filter(event => event.coachName === selectedCoach)
    }
    
    setFilteredEvents(filtered)
  }, [events, selectedLocation, selectedSport, selectedPackage, selectedCoach])

  const getEventStyle = (event: Event) => {
    switch (event.programName) {
      case "block":
        return "bg-[#1C1C1C0D] border-none"
      default:
        return ""
    }
  }

  const getEventsForSlot = (date: Date, hour: number) => {
    return filteredEvents.filter((event) => {
      if (!event.date || !event.startTime) return false
      
      const eventDate = new Date(event.date)
      const [eventHour] = event.startTime.split(':').map(Number)
      
      return isSameDay(eventDate, date) && eventHour === hour
    })
  }

  const getMaxEventsForTimeSlot = (hour: number) => {
    return Math.max(...weekDates.map(date => getEventsForSlot(date, hour).length))
  }

  const weekDates = useMemo(() => {
    switch (calendarView) {
      case 'day':
        return [currentDate]
      case 'week':
        return WEEK_DAYS.map((_, i) => addDays(dateRange.start, i))
      case 'month':
        // TODO: Implement month view dates
        return WEEK_DAYS.map((_, i) => addDays(dateRange.start, i))
    }
  }, [calendarView, currentDate, dateRange.start])

  return (
    <div className="w-full max-w-7xl mx-auto p-2 sm:p-4 bg-[#E0E4D9]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 bg-[#E0E4D9] p-2 sm:p-4 rounded-lg">
      <div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-0">
          <span className="text-sm font-medium">Filters:</span>
          
          {/* Location Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className={cn(
                  "text-xs sm:text-sm h-7 sm:h-8",
                  selectedLocation && "bg-blue-100"
                )}
              >
                {selectedLocation || "Locations"} <ChevronsUpDown className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSelectedLocation(null)}>
                All Locations
              </DropdownMenuItem>
              {locations.map(location => (
                <DropdownMenuItem 
                  key={location} 
                  onClick={() => setSelectedLocation(location)}
                >
                  {location}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sports Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className={cn(
                  "text-xs sm:text-sm h-7 sm:h-8",
                  selectedSport && "bg-blue-100"
                )}
              >
                {selectedSport || "Sports"} <ChevronsUpDown className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSelectedSport(null)}>
                All Sports
              </DropdownMenuItem>
              {sports.map(sport => (
                <DropdownMenuItem 
                  key={sport} 
                  onClick={() => setSelectedSport(sport)}
                >
                  {sport}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Packages Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className={cn(
                  "text-xs sm:text-sm h-7 sm:h-8",
                  selectedPackage && "bg-blue-100"
                )}
              >
                {selectedPackage || "Packages"} <ChevronsUpDown className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSelectedPackage(null)}>
                All Packages
              </DropdownMenuItem>
              {packages.map(pkg => (
                <DropdownMenuItem 
                  key={pkg} 
                  onClick={() => setSelectedPackage(pkg)}
                >
                  {pkg}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Coaches Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className={cn(
                  "text-xs sm:text-sm h-7 sm:h-8",
                  selectedCoach && "bg-blue-100"
                )}
              >
                {selectedCoach || "Coaches"} <ChevronsUpDown className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSelectedCoach(null)}>
                All Coaches
              </DropdownMenuItem>
              {coaches.map(coach => (
                <DropdownMenuItem 
                  key={coach} 
                  onClick={() => setSelectedCoach(coach)}
                >
                  {coach}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            className="h-7 w-7 sm:h-8 sm:w-8"
            onClick={() => navigate('prev')}
          >
            <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          
          <Button 
            variant="outline" 
            className="text-xs sm:text-sm h-7 sm:h-8"
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </Button>
          
          <Button 
            variant="outline" 
            className="text-xs sm:text-sm h-7 sm:h-8"
          >
            {format(currentDate, 'MMMM yyyy')}
          </Button>
          
          <Button 
            variant="outline" 
            size="icon" 
            className="h-7 w-7 sm:h-8 sm:w-8"
            onClick={() => navigate('next')}
          >
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="text-xs sm:text-sm h-7 sm:h-8">
                {calendarView.charAt(0).toUpperCase() + calendarView.slice(1)} <ChevronsUpDown className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setCalendarView('day')}>Day</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCalendarView('week')}>Week</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCalendarView('month')}>Month</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
      </div>

      {calendarView === 'day' ? (
        <DayView 
          events={filteredEvents} 
          date={currentDate} 
        />
      ) : calendarView === 'month' ? (
        <MonthView 
          events={filteredEvents} 
          currentDate={currentDate} 
        />
      ) : (
        <div className="bg-white rounded-lg overflow-hidden">
          {/* Days header */}
          <div className="grid grid-cols-1 sm:grid-cols-[repeat(15,minmax(0,1fr))] border-[#CDD1C7] border-b bg-[#E0E4D9]">
            <div className="hidden sm:block p-2 border-r border-[#CDD1C7]" />
            {weekDates.map((date, i) => (
              <div
                key={i}
                className={cn(
                  "p-2 text-center border-[#CDD1C7] border-r last:border-r-0 rounded-t-2xl bg-[#F1F2E9] col-span-2",
                  isSameDay(date, today) && "bg-[#FEFFF6]"
                )}
              >
                <div className="font-medium text-xs text-[#6A6C6A]">{WEEK_DAYS[i]}</div>
                <div className="text-lg sm:text-2xl">{format(date, "d")}</div>
              </div>
            ))}
          </div>

          {/* Time slots */}
          <div className="grid grid-cols-1 sm:grid-cols-[repeat(15,minmax(0,1fr))] bg-[#F1F2E9]">
            {/* Time labels */}
            <div className="hidden sm:block border-r border-[#CDD1C7] col-span-1 bg-[#E0E4D9]">
              {TIME_SLOTS.map((hour) => {
                const maxEvents = getMaxEventsForTimeSlot(hour)
                return (
                  <div
                    key={hour}
                    className={"p-2 bg-[#E0E4D9]"}
                    style={{ height: `${Math.max(5, maxEvents * 6)}rem` }}
                  >
                    <span className="text-xs text-gray-500">{hour % 12 || 12} {hour >= 12 ? 'PM' : 'AM'}</span>
                  </div>
                )
              })}
            </div>

            {/* Days columns */}
            {weekDates.map((date, dayIndex) => (
              <div key={dayIndex} className={cn("border-r last:border-r-0 border-[#CDD1C7] col-span-2", isSameDay(date, today) && "bg-[#FEFFF6]")}>
                {TIME_SLOTS.map((hour) => {
                  const slotEvents = getEventsForSlot(date, hour)
                  const maxEvents = getMaxEventsForTimeSlot(hour)
                  const colors = ['bg-[#DCE5AE]', 'bg-[#AED3E5]', 'bg-[#AEE5D3]', 'bg-[#E5DCAE]']
                  return (
                    <div
                      key={`${dayIndex}-${hour}`}
                      className="border-b last:border-b-0 border-[#CDD1C7] relative"
                      style={{ minHeight: "5rem", height: `${Math.max(5, maxEvents * 6)}rem` }}
                    >
                      <div className="sm:hidden absolute top-0 left-0 text-xs text-gray-500 p-1">
                        {hour % 12 || 12} {hour >= 12 ? 'PM' : 'AM'}
                      </div>
                      {slotEvents.map((event, index) => (
                        <div
                          key={event.id}
                          className={cn(
                            "absolute left-0 right-0 m-1 p-2 text-xs border rounded-md overflow-hidden flex flex-col items-start justify-start gap-1",
                            getEventStyle(event),
                            event?.programName === "block" ? "top-0 bottom-0" : "",
                            event?.programName !== 'block' && colors[index % colors.length],
                          )}
                          style={event?.programName !== "block" ? {
                            top: `${index * 6}rem`,
                            height: "5rem",
                          } : undefined}
                        >
                          <div className={cn("font-bold uppercase text-[10px] font-inter", event?.programName === 'block' ? 'text-[#C11F26]' : 'text-[#1F441F]')}>• {event.programName}</div>
                          <div className='text-[10px] font-inter text-[#454745]'>{formatTimeRange(event?.startTime!, event?.endTime!)}</div>
                          {event.studentName && <div className="hidden sm:block font-normal text-sm text-[#1F441F] font-inter">{event.studentName}</div>}
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Calendar Grid */}

    </div>
  )
}

const DayView = ({ events, date }: { events: Event[], date: Date }) => {
  return (
    <div className="bg-transparent rounded-lg overflow-hidden">
      <div className="grid grid-cols-1 border-[#CDD1C7] border-b bg-[#E0E4D9]">
        <div className="p-4 text-center border-[#CDD1C7] rounded-t-2xl bg-[#F1F2E9]">
          <div className="font-medium text-xs text-[#6A6C6A]">{format(date, 'EEEE').toUpperCase()}</div>
          <div className="text-2xl">{format(date, 'd')}</div>
        </div>
      </div>

      <div className="bg-[#E0E4D9]">
        {TIME_SLOTS.map((hour) => {
          const timeEvents = events.filter((event) => {
            if (!event.startTime) return false
            const [eventHour] = event.startTime.split(':').map(Number)
            return eventHour === hour
          })

          return (
            <div
              key={hour}
              className="border-[#CDD1C7] bg-[#F1F2E9] my-1 p-2 min-h-[5rem] rounded-xl"
            >
              <div className="text-xs text-gray-500">
                {hour % 12 || 12} {hour >= 12 ? 'PM' : 'AM'}
              </div>
              <div className="space-y-2">
                {timeEvents.map((event) => (
                  <div
                    key={event.id}
                    className={cn(
                      "p-2 text-xs border rounded-md",
                      event.programName === "block" ? "bg-[#1C1C1C0D]" : "bg-[#DCE5AE]"
                    )}
                  >
                    <div className={cn(
                      "font-bold uppercase text-[10px] font-inter",
                      event.programName === 'block' ? 'text-[#C11F26]' : 'text-[#1F441F]'
                    )}>
                      • {event.programName}
                    </div>
                    <div className='text-[10px] font-inter text-[#454745]'>
                      {formatTimeRange(event.startTime!, event.endTime!)}
                    </div>
                    {event.studentName && (
                      <div className="font-normal text-sm text-[#1F441F] font-inter">
                        {event.studentName}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Month View Component
const MonthView = ({ events, currentDate }: { events: Event[], currentDate: Date }) => {
  const monthDays = useMemo(() => {
    const start = startOfMonth(currentDate)
    const end = endOfMonth(currentDate)
    return eachDayOfInterval({ start, end })
  }, [currentDate])

  const getEventsForDay = (date: Date) => {
    return events.filter((event) => {
      if (!event.date) return false
      return format(new Date(event.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    })
  }

  return (
    <div className="bg-white rounded-lg overflow-hidden">
      <div className="grid grid-cols-7 text-center border-[#CDD1C7] bg-[#E0E4D9]">
        {WEEK_DAYS.map((day) => (
          <div key={day} className="p-2 font-medium text-[#6A6C6A]">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 bg-[#E0E4D9]">
        {monthDays.map((date, i) => {
          const dayEvents = getEventsForDay(date)
          return (
            <div
              key={i}
              className={cn(
                "min-h-[8rem] p-2 border-r border-b border-[#CDD1C7] rounded-xl bg-[#F1F2E9]",
                !isSameMonth(date, currentDate) && "bg-gray-50",
                isToday(date) && "bg-[#FEFFF6]"
              )}
            >
              <div className="font-medium text-sm mb-1">{format(date, 'd')}</div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className={cn(
                      "text-xs p-1 rounded",
                      event.programName === "block" ? "bg-[#1C1C1C0D]" : "bg-[#DCE5AE]"
                    )}
                  >
                    <div className={cn(
                      "font-bold uppercase text-[10px]",
                      event.programName === 'block' ? 'text-[#C11F26]' : 'text-[#1F441F]'
                    )}>
                      • {event.programName}
                    </div>
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}