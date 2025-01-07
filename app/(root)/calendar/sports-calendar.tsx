"use client"

import { useCallback, useEffect, useMemo, useState, useTransition } from "react"
import { addDays, addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, isToday, startOfMonth, startOfWeek } from "date-fns"
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, ChevronsUpDown, MapPin } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn, formatTimeRange } from "@/lib/utils"
import { getCalendarSlots } from "@/lib/actions/academics.actions"
import Image from "next/image"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import AddBlock from "./add-block"
import BookingDialog from "./add-booking"

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
	packageId: number | null
	coachId: number | null
	color: string | null
	gender: string | null
}

type GroupedEvent = {
	time: string
	coachName: string
	packageId: number
	packageName: string
	count: number
	events: Event[]
	programName: string
	color: string
}

type CalendarView = 'day' | 'week' | 'month' | 'list'

const WEEK_DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]
const TIME_SLOTS = Array.from({ length: 16 }, (_, i) => i + 8)

const groupEvents = (events: Event[]): GroupedEvent[] => {
	const groupedMap = events.reduce((acc, event) => {
		if (!event.startTime || !event.endTime) return acc

		// Different key generation for blocks vs regular events
		const key = event.programName === 'block'
			? `block-${event.startTime}-${event.endTime}-${event.id}`
			: `${event.startTime}-${event.endTime}-${event.coachName}-${event.packageId}`

		// Skip regular events without required fields
		if (event.programName !== 'block' && (!event.packageId)) return acc

		if (!acc.has(key)) {
			acc.set(key, {
				time: `${event.startTime.split(':').length < 3 ? event.startTime + ':00' : event.startTime}-${event.endTime.split(':').length < 3 ? event.endTime + ':00' : event.endTime}`,
				coachName: event.coachName || 'No Coach',
				packageId: event.packageId || 0,
				packageName: event.programName === 'block' ? 'Blocked Time' : (event.packageName || ''),
				count: 0,
				events: [],
				programName: event.programName || '',
				color: event.programName !== 'block' ? event.color ?? '#DCE5AE' : '#E6E7DE'
			})
		}

		const group = acc.get(key)!
		group.count++
		group.events.push(event)

		return acc
	}, new Map<string, GroupedEvent>())

	return Array.from(groupedMap.values())
}
const EventDetailsDialog = ({
	isOpen,
	onClose,
	groupedEvent
}: {
	isOpen: boolean
	onClose: () => void
	groupedEvent: GroupedEvent | null
}) => {
	if (!groupedEvent) return null

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="bg-[#F1F2E9] border border-[#868685]">
				<DialogHeader>
					<DialogTitle className="text-[#1F441F]">
						{groupedEvent.programName} {groupedEvent.coachName !== 'No Coach' ? " - " + groupedEvent.coachName : ''}
					</DialogTitle>
				</DialogHeader>
				<div className="space-y-4">
					<div className="text-sm text-[#454745]">
						Time: {formatTimeRange(groupedEvent.time.split('-')[0], groupedEvent.time.split('-')[1])}
					</div>
					<div className="space-y-2">
						{groupedEvent.events.map((event) => (
							<div
								key={event.id}
								className="bg-white p-3 rounded-lg border border-[#CDD1C7]"
							>
								<div className="font-medium text-[#1F441F]">{event.studentName}</div>
								{/* <div className="text-sm text-[#454745]">
                  Birthday: {new Date(event.studentBirthday!).toLocaleDateString()}
                </div> */}
								<div className="text-sm text-[#454745]">
									Package: {event.packageName}
								</div>
							</div>
						))}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}

export default function Calendar() {

	const today = new Date()
	const [events, setEvents] = useState<Event[]>([])
	const [currentDate, setCurrentDate] = useState(new Date())
	const [isPending, startTransition] = useTransition()
	const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
	const [calendarView, setCalendarView] = useState<CalendarView>('week')
	const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
	const [selectedSport, setSelectedSport] = useState<string | null>(null)
	const [selectedProgram, setSelectedProgram] = useState<string | null>(null)
	const [selectedGender, setSelectedGender] = useState<string | null>(null)
	const [selectedGroupedEvent, setSelectedGroupedEvent] = useState<GroupedEvent | null>(null)
	const [refetch, setRefetch] = useState(false)

	const locations = Array.from(new Set(events.map(e => e.branchName).filter(Boolean)))
	const sports = Array.from(new Set(events.map(e => e.sportName).filter(Boolean)))
	const programs = Array.from(new Set(events.map(e => e.programName).filter(Boolean)))
	const genders = Array.from(new Set(events.map(e => e.gender?.split(',')).flat().filter(Boolean)))

	const dateRange = useMemo(() => {
		switch (calendarView) {
			case 'day':
				return {
					start: currentDate,
					end: currentDate
				}
			case 'list':
				return {
					start: startOfWeek(currentDate, { weekStartsOn: 1 }),
					end: endOfWeek(currentDate, { weekStartsOn: 1 })
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

	const fetchEvents = useCallback(async () => {
		console.log("fetching events")
		startTransition(async () => {
			const result = await getCalendarSlots(dateRange.start, dateRange.end)
			if (result?.error) return
			console.log(result.data)
			setEvents(result.data)
		})
	}, [dateRange, refetch])

	useEffect(() => {
		fetchEvents()
	}, [dateRange, refetch])

	useEffect(() => {
		let filtered = [...events]

		if (selectedLocation) {
			filtered = filtered.filter(event => event.branchName === selectedLocation)
		}
		if (selectedSport) {
			filtered = filtered.filter(event => event.sportName === selectedSport)
		}
		if (selectedProgram) {
			filtered = filtered.filter(event => event.programName === selectedProgram)
		}
		if (selectedGender) {
			filtered = filtered.filter(event => event.gender === selectedGender) // Assuming there's a gender field in events
		}

		setFilteredEvents(filtered)
	}, [events, selectedLocation, selectedSport, selectedProgram, selectedGender])

	const getEventStyle = (event: Event) => {
		switch (event.programName) {
			case "block":
				return "bg-[#1C1C1C0D] border-none"
			default:
				return ""
		}
	}

	const availableGenders = useMemo(() => {
		return [...events.map(item => item?.gender?.split(',')).flat().filter(Boolean), ...events.map(item => item.gender?.split(',')).flat().filter(Boolean)].filter(value => value !== '').filter((value, index, self) => self.indexOf(value) === index)
	}, [events]);

	const getEventsForSlot = (date: Date, hour: number) => {
		const slotEvents = filteredEvents.filter((event) => {
			if (!event.date || !event.startTime) return false

			const eventDate = new Date(event.date)
			const [eventHour] = event.startTime.split(':').map(Number)

			return isSameDay(eventDate, date) && eventHour === hour
		})

		return groupEvents(slotEvents)
	}

	const getMaxEventsForTimeSlot = (hour: number) => {
		return Math.max(...weekDates.map(date => getEventsForSlot(date, hour).length))
	}

	const weekDates = useMemo(() => {
		switch (calendarView) {
			case 'day':
				return [currentDate]
			case 'list':
				return WEEK_DAYS.map((_, i) => addDays(dateRange.start, i))
			case 'week':
				return WEEK_DAYS.map((_, i) => addDays(dateRange.start, i))
			case 'month':
				return WEEK_DAYS.map((_, i) => addDays(dateRange.start, i))
		}
	}, [calendarView, currentDate, dateRange.start])

	console.log('Events', filteredEvents)

	return (
		<>
			<div className="flex-wrap items-center gap-2 mb-2 sm:mb-0 flex">
				<BookingDialog setRefetch={setRefetch} />
				{/* <AddBlock setRefetch={setRefetch} /> */}
			</div>
			<div className="w-full max-w-7xl mx-auto p-2 sm:p-4 bg-[#E0E4D9]">
				{/* Header */}
				<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 bg-[#E0E4D9] p-2 sm:p-4 rounded-lg">
					<div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-0">
						<span className="text-sm font-medium">Filters:</span>

						{/* Location Filter */}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" className="gap-2 rounded-xl border border-[#868685] bg-[#F1F2E9]">
									<MapPin className="h-4 w-4" />
									{selectedLocation || 'Locations'}
									<ChevronDown className="w-4 h-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent className='bg-[#F1F2E9]'>
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
								<Button variant="outline" className="gap-2 rounded-xl border border-[#868685] bg-[#F1F2E9]">
									<Image
										src='/images/sports.svg'
										width={16}
										height={16}
										alt='Sports'
									/>
									{selectedSport || 'Sports'}
									<ChevronDown className="w-4 h-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent className='bg-[#F1F2E9]'>
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
								<Button variant="outline" className="gap-2 rounded-xl border border-[#868685] bg-[#F1F2E9]">
									<Image
										src='/images/sports.svg'
										width={16}
										height={16}
										alt='Programs'
									/>
									{selectedProgram || 'Programs'}
									<ChevronDown className="w-4 h-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent className='bg-[#F1F2E9]'>
								<DropdownMenuItem onClick={() => setSelectedProgram(null)}>
									All Programs
								</DropdownMenuItem>
								{programs.map(program => (
									<DropdownMenuItem
										key={program}
										onClick={() => setSelectedProgram(program)}
									>
										{program}
									</DropdownMenuItem>
								))}
							</DropdownMenuContent>
						</DropdownMenu>

						{/* Coaches Filter */}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" className="gap-2 rounded-xl border border-[#868685] bg-[#F1F2E9]">
									<Image
										src='/images/sports.svg'
										width={16}
										height={16}
										alt='Gender'
									/>
									{selectedGender || 'For'}
									<ChevronDown className="w-4 h-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent className='bg-[#F1F2E9]'>
								<DropdownMenuItem onClick={() => setSelectedGender(null)}>
									All Genders
								</DropdownMenuItem>
								{availableGenders.map(gender => (
									<DropdownMenuItem
										key={gender}
										onClick={() => setSelectedGender(gender ?? '')}
									>
										{gender?.slice(0, 1).toUpperCase()}{gender?.slice(1)}
									</DropdownMenuItem>
								))}
							</DropdownMenuContent>
						</DropdownMenu>
					</div>

					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="icon"
							className="h-7 w-7 sm:h-8 sm:w-8 bg-[#F1F2E9] border border-[#868685] rounded-xl"
							onClick={() => navigate('prev')}
						>
							<ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
						</Button>

						<div className="flex gap-0">
							<Button
								variant="outline"
								className="text-xs sm:text-sm h-7 sm:h-9 bg-[#F1F2E9] border border-[#868685] rounded-xl rounded-r-none"
								onClick={() => setCurrentDate(new Date())}
							>
								Today
							</Button>

							<Button
								variant="outline"
								className="text-xs sm:text-sm h-7 sm:h-9 bg-[#F1F2E9] border border-[#868685] rounded-xl rounded-l-none border-l-0"
							>
								{format(currentDate, 'MMMM yyyy')}
							</Button>
						</div>

						<Button
							variant="outline"
							size="icon"
							className="h-7 w-7 sm:h-8 sm:w-8 bg-[#F1F2E9] border border-[#868685] rounded-xl"
							onClick={() => navigate('next')}
						>
							<ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
						</Button>

						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" className="gap-2 rounded-xl border border-[#868685] bg-[#F1F2E9]">
									<CalendarDays className="w-4 h-4" />
									{calendarView.charAt(0).toUpperCase() + calendarView.slice(1)}
									<ChevronDown className="w-4 h-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent className='bg-[#F1F2E9]'>
								<DropdownMenuItem onClick={() => setCalendarView('day')}>Day</DropdownMenuItem>
								<DropdownMenuItem onClick={() => setCalendarView('week')}>Week</DropdownMenuItem>
								<DropdownMenuItem onClick={() => setCalendarView('month')}>Month</DropdownMenuItem>
								<DropdownMenuItem onClick={() => setCalendarView('list')}>List</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>

				</div>

				{calendarView === 'day' ? (
					<DayView
						events={filteredEvents}
						date={currentDate}
						setSelectedGroupedEvent={setSelectedGroupedEvent}
					/>
				) : calendarView === 'month' ? (
					<MonthView
						events={filteredEvents}
						currentDate={currentDate}
						setSelectedGroupedEvent={setSelectedGroupedEvent}
					/>
				) : calendarView === 'list' ? (
					<ListView
						events={filteredEvents}
						currentDate={currentDate}
						setSelectedGroupedEvent={setSelectedGroupedEvent}
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
												{slotEvents.map((groupedEvent, index) => (
													<div
														key={index}
														className={cn(
															"absolute left-0 right-0 m-1 p-2 text-xs border rounded-md overflow-hidden flex flex-col items-start justify-start gap-1 cursor-pointer",
															// groupedEvent.color ? `!bg-[${groupedEvent.color}]` : colors[index % colors.length]
														)}
														style={{
															top: `${index * 6}rem`,
															height: "5rem",
															backgroundColor: groupedEvent.color ? groupedEvent.color : colors[index % colors.length]
														}}
														onClick={() => setSelectedGroupedEvent(groupedEvent)}
													>
														<div className={cn("font-bold uppercase text-[10px] font-inter", groupedEvent.programName === 'block' ? 'text-[#CA5154]' : "text-[#1F441F]")}>
															• {groupedEvent.programName}
														</div>
														<div className='text-[10px] font-inter text-[#454745]'>
															{formatTimeRange(
																groupedEvent.time.split('-')[0],
																groupedEvent.time.split('-')[1]
															)}
														</div>
														<div className="hidden sm:block font-normal text-sm text-[#1F441F] font-inter text-ellipsis">
															{groupedEvent.programName === 'block' ? '' : `${(groupedEvent.events[0].studentName?.length ?? 0) > 12 ? groupedEvent.events[0].studentName?.slice(0, 12) + '...' : groupedEvent.events[0].studentName}, ${groupedEvent.count}`}
														</div>
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
			<EventDetailsDialog
				isOpen={!!selectedGroupedEvent}
				onClose={() => setSelectedGroupedEvent(null)}
				groupedEvent={selectedGroupedEvent}
			/>
		</>
	)
}

const DayView = ({ events, date, setSelectedGroupedEvent }: { events: Event[], date: Date, setSelectedGroupedEvent: React.Dispatch<React.SetStateAction<GroupedEvent | null>> }) => {
	const groupTimeEvents = (hour: number) => {
		const timeEvents = events.filter((event) => {
			if (!event.startTime) return false
			const [eventHour] = event.startTime.split(':').map(Number)
			return eventHour === hour
		})
		return groupEvents(timeEvents)
	}

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
					const groupedEvents = groupTimeEvents(hour)
					const colors = ['bg-[#DCE5AE]', 'bg-[#AED3E5]', 'bg-[#AEE5D3]', 'bg-[#E5DCAE]']

					return (
						<div key={hour} className="border-[#CDD1C7] bg-[#F1F2E9] my-1 p-2 min-h-[5rem] rounded-xl">
							<div className="text-xs text-gray-500">
								{hour % 12 || 12} {hour >= 12 ? 'PM' : 'AM'}
							</div>
							<div className="space-y-2">
								{groupedEvents.map((groupedEvent, index) => (
									<div
										key={`${groupedEvent.coachName}-${groupedEvent.packageId}`}
										className={cn(
											"p-2 text-xs border rounded-md cursor-pointer",
											// groupedEvent.color ? `!bg-[${groupedEvent.color}]` : colors[index % colors.length]
										)}
										onClick={() => setSelectedGroupedEvent(groupedEvent)}
										style={{
											backgroundColor: groupedEvent.color ? groupedEvent.color : colors[index % colors.length]
										}}
									>
										<div className="font-bold uppercase text-[10px] font-inter text-[#1F441F]">
											• {groupedEvent.packageName}
										</div>
										<div className='text-[10px] font-inter text-[#454745]'>
											{formatTimeRange(
												groupedEvent.time.split('-')[0],
												groupedEvent.time.split('-')[1]
											)}
										</div>
										<div className="font-normal text-sm text-[#1F441F] font-inter">
											{groupedEvent.coachName}, {groupedEvent.count}
										</div>
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

const DayEventsDialog = ({
	isOpen,
	onClose,
	date,
	events,
	setSelectedGroupedEvent
}: {
	isOpen: boolean
	onClose: () => void
	date: Date | null
	events: GroupedEvent[]
	setSelectedGroupedEvent: (event: GroupedEvent) => void
}) => {
	if (!date || !events.length) return null;

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="bg-[#F1F2E9] border border-[#868685]">
				<DialogHeader>
					<DialogTitle className="text-[#1F441F]">
						Events for {format(date, 'MMMM d, yyyy')}
					</DialogTitle>
				</DialogHeader>
				<div className="space-y-2 max-h-[60vh] overflow-y-auto">
					{events.map((groupedEvent, index) => (
						<div
							key={`${groupedEvent.coachName}-${groupedEvent.packageId}-${index}`}
							className="p-3 rounded-lg cursor-pointer"
							style={{
								backgroundColor: groupedEvent.color ?? '#DCE5AE'
							}}
							onClick={() => {
								setSelectedGroupedEvent(groupedEvent);
								onClose();
							}}
						>
							<div className="font-bold uppercase text-xs font-inter text-[#1F441F]">
								• {groupedEvent.programName}
							</div>
							<div className="text-xs font-inter text-[#454745] mt-1">
								{formatTimeRange(
									groupedEvent.time.split('-')[0],
									groupedEvent.time.split('-')[1]
								)}
							</div>
							<div className="font-normal text-sm text-[#1F441F] font-inter">
								{groupedEvent.coachName}, {groupedEvent.count} students
							</div>
						</div>
					))}
				</div>
			</DialogContent>
		</Dialog>
	);
};

const MonthView = ({ events, currentDate, setSelectedGroupedEvent }: {
	events: Event[],
	currentDate: Date,
	setSelectedGroupedEvent: React.Dispatch<React.SetStateAction<GroupedEvent | null>>
}) => {
	const [selectedDate, setSelectedDate] = useState<Date | null>(null);
	const [dayEvents, setDayEvents] = useState<GroupedEvent[]>([]);

	const monthDays = useMemo(() => {
		const start = startOfMonth(currentDate)
		const end = endOfMonth(currentDate)
		let firstDay = startOfMonth(currentDate)
		while (firstDay.getDay() !== 1) {
			firstDay = addDays(firstDay, -1)
		}
		return eachDayOfInterval({
			start: firstDay,
			end: addDays(end, 42 - eachDayOfInterval({ start: firstDay, end }).length)
		})
	}, [currentDate])

	const getGroupedEventsForDay = (date: Date) => {
		const dayEvents = events.filter((event) => {
			if (!event.date) return false
			const eventDate = new Date(event.date)
			return isSameDay(eventDate, date)
		})
		return groupEvents(dayEvents)
	}

	const handleShowMoreClick = (date: Date, groupedEvents: GroupedEvent[]) => {
		setSelectedDate(date);
		setDayEvents(groupedEvents);
	};

	return (
		<div className="bg-white rounded-lg overflow-hidden">
			<div className="grid grid-cols-7 text-center border-[#CDD1C7] bg-[#E0E4D9]">
				{["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((day) => (
					<div key={day} className="p-2 font-medium text-[#6A6C6A]">
						{day}
					</div>
				))}
			</div>

			<div className="grid grid-cols-7 bg-[#E0E4D9]">
				{monthDays.map((date, i) => {
					const groupedEvents = getGroupedEventsForDay(date)
					const colors = ['bg-[#DCE5AE]', 'bg-[#AED3E5]', 'bg-[#AEE5D3]', 'bg-[#E5DCAE]']

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
								{groupedEvents.slice(0, 3).map((groupedEvent, index) => (
									<div
										key={`${groupedEvent.coachName}-${groupedEvent.packageId}`}
										className="text-xs p-1 rounded cursor-pointer"
										onClick={() => setSelectedGroupedEvent(groupedEvent)}
										style={{
											backgroundColor: groupedEvent.color ? groupedEvent.color : colors[index % colors.length]
										}}
									>
										<div className="font-bold uppercase text-[10px] text-[#1F441F]">
											• {groupedEvent.programName} ({groupedEvent.count})
										</div>
									</div>
								))}
								{groupedEvents.length > 3 && (
									<button
										onClick={() => handleShowMoreClick(date, groupedEvents)}
										className="text-xs text-[#1F441F] hover:text-[#454745] transition-colors p-1 w-full text-left"
									>
										+{groupedEvents.length - 3} more events
									</button>
								)}
							</div>
						</div>
					)
				})}
			</div>

			<DayEventsDialog
				isOpen={!!selectedDate}
				onClose={() => setSelectedDate(null)}
				date={selectedDate}
				events={dayEvents}
				setSelectedGroupedEvent={setSelectedGroupedEvent}
			/>
		</div>
	)
}

const ListView = ({
	events,
	currentDate,
	setSelectedGroupedEvent
}: {
	events: Event[],
	currentDate: Date,
	setSelectedGroupedEvent: React.Dispatch<React.SetStateAction<GroupedEvent | null>>
}) => {
	const weekDates = useMemo(() => {
		const start = startOfWeek(currentDate, { weekStartsOn: 1 })
		return Array.from({ length: 7 }, (_, i) => addDays(start, i))
	}, [currentDate])

	const getGroupedEventsForDay = (date: Date) => {
		const dayEvents = events.filter((event) => {
			if (!event.date) return false
			return format(new Date(event.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
		})
		return groupEvents(dayEvents)
	}

	return (
		<div className="bg-transparent space-y-4">
			{weekDates.map((date, i) => {
				const groupedEvents = getGroupedEventsForDay(date)
				const colors = ['bg-[#DCE5AE]', 'bg-[#AED3E5]', 'bg-[#AEE5D3]', 'bg-[#E5DCAE]']

				return (
					<div
						key={i}
						className={cn(
							"rounded-xl overflow-hidden border border-[#CDD1C7]",
							isSameDay(date, new Date()) ? "bg-[#FEFFF6]" : "bg-[#F1F2E9]"
						)}
					>
						<div className="p-4">
							<div className="font-medium text-xs text-[#6A6C6A]">
								{format(date, 'EEEE').toUpperCase()}
							</div>
							<div className="text-lg">
								{format(date, 'd MMMM yyyy')}
							</div>
						</div>

						<div className="space-y-2 p-4 pt-0">
							{groupedEvents.length > 0 ? (
								groupedEvents.map((groupedEvent, index) => (
									<div
										key={`${groupedEvent.coachName}-${groupedEvent.packageId}`}
										className={cn(
											"p-3 text-sm border rounded-md cursor-pointer",
											// groupedEvent.color ? `!bg-[${groupedEvent.color}]` : colors[index % colors.length]
										)}
										onClick={() => setSelectedGroupedEvent(groupedEvent)}
										style={{
											backgroundColor: groupedEvent.color ? groupedEvent.color : colors[index % colors.length]
										}}
									>
										<div className="font-bold uppercase text-xs font-inter text-[#1F441F]">
											• {groupedEvent.packageName}
										</div>
										<div className='text-xs font-inter text-[#454745] mt-1'>
											{formatTimeRange(
												groupedEvent.time.split('-')[0],
												groupedEvent.time.split('-')[1]
											)}
										</div>
										<div className="font-normal text-sm text-[#1F441F] font-inter mt-1">
											{groupedEvent.coachName}, {groupedEvent.count} students
										</div>
									</div>
								))
							) : (
								<div className="p-3 text-sm text-[#454745] bg-white/50 rounded-md border border-[#CDD1C7]">
									No bookings scheduled for this day
								</div>
							)}
						</div>
					</div>
				)
			})}
		</div>
	)
}