"use client"

import { useEffect, useState, useTransition } from "react"
import { addDays, endOfWeek, format, isSameDay, startOfWeek } from "date-fns"
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

const WEEK_DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]
const TIME_SLOTS = Array.from({ length: 16 }, (_, i) => i + 8)

export default function Calendar() {

  const [events, setEvents] = useState<Event[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isPending, startTransition] = useTransition()

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })


  const weekDates = WEEK_DAYS.map((_, i) => addDays(weekStart, i))

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

  const fetchEvents = async (start: Date, end: Date) => {
    startTransition(async () => {
      const result = await getCalendarSlots(start, end)
      setEvents(result)
    })
  }

  useEffect(() => {
    fetchEvents(weekStart, weekEnd)
  }, [])

  const getEventStyle = (event: Event) => {
    switch (event.programName) {
      case "block":
        return "bg-[#1C1C1C0D] border-none"
      default:
        return ""
    }
  }

  const getEventsForSlot = (date: Date, hour: number) => {
    return events.filter(
      (event) =>
        isSameDay(new Date(event?.date!), date) && new Date(event?.date!).getHours() === hour
    )
  }

  const getMaxEventsForTimeSlot = (hour: number) => {
    return Math.max(...weekDates.map(date => getEventsForSlot(date, hour).length))
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-2 sm:p-4 bg-[#E0E4D9]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 bg-[#E0E4D9] p-2 sm:p-4 rounded-lg">
        <div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-0">
          <span className="text-sm font-medium">Filters:</span>
          {["Locations", "Sports", "Packages", "Coaches"].map((filter) => (
            <DropdownMenu key={filter}>
              <DropdownMenuTrigger asChild>
                <Button disabled={isPending} variant="outline" className="text-xs sm:text-sm h-7 sm:h-8">
                  {filter} <ChevronsUpDown className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Option 1</DropdownMenuItem>
                <DropdownMenuItem>Option 2</DropdownMenuItem>
                <DropdownMenuItem>Option 3</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-7 w-7 sm:h-8 sm:w-8">
            <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          <Button variant="outline" className="text-xs sm:text-sm h-7 sm:h-8">Today</Button>
          <Button variant="outline" className="text-xs sm:text-sm h-7 sm:h-8">May 2024</Button>
          <Button variant="outline" size="icon" className="h-7 w-7 sm:h-8 sm:w-8">
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="text-xs sm:text-sm h-7 sm:h-8">
                Week <ChevronsUpDown className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Day</DropdownMenuItem>
              <DropdownMenuItem>Week</DropdownMenuItem>
              <DropdownMenuItem>Month</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg overflow-hidden">
        {/* Days header */}
        <div className="grid grid-cols-1 sm:grid-cols-[repeat(15,minmax(0,1fr))] border-[#CDD1C7] border-b bg-[#E0E4D9]">
          <div className="hidden sm:block p-2 border-r border-[#CDD1C7]" />
          {weekDates.map((date, i) => (
            <div
              key={i}
              className={cn(
                "p-2 text-center border-[#CDD1C7] border-r last:border-r-0 rounded-t-2xl bg-[#F1F2E9] col-span-2",
                isSameDay(date, currentDate) && "bg-[#FEFFF6]"
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
            <div key={dayIndex} className={cn("border-r last:border-r-0 border-[#CDD1C7] col-span-2", isSameDay(date, currentDate) && "bg-[#FEFFF6]")}>
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
    </div>
  )
}