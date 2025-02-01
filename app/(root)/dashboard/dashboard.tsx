'use client'

import { Card } from '@/components/ui/card'
import { ArrowDown, ArrowUp, ChevronDown } from 'lucide-react'
import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from 'recharts'
import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type DashboardStats = {
    currentMonthCount: number
    lastMonthCount: number
    totalBookings: number
    timeTraffic: Array<{ hour: string; count: number; date: string }>
    packageTraffic: Array<{ name: string | null; count: number; branchName?: string; sportName?: string; programName?: string | null; date: string; genders: string }>
    programTraffic: Array<{ name: string | null; count: number; branchName?: string; sportName?: string; programName?: string | null; date: string; genders: string }>
    coachTraffic: Array<{ name: string | null; count: number; branchName?: string; sportName?: string; programName?: string | null; date: string }>
    sportTraffic: Array<{ name: string; count: number; branchName?: string; sportName?: string; programName?: string | null; date: string }>
    branchTraffic: Array<{ name: string; count: number; branchName?: string; sportName?: string; programName?: string | null; date: string }>
    allPrograms: Array<{ name: string }>
    allLocations: Array<{ name: string }>
    allSports: Array<{ name: string }>
}

const formatTime = (time: string) => {
    try {
        const [hours, minutes] = time.split(':').map(Number)
        if (isNaN(hours) || isNaN(minutes)) return time

        const period = hours >= 12 ? 'PM' : 'AM'
        const formattedHours = hours % 12 || 12
        return `${formattedHours}:${minutes.toString().padStart(2, '0')} ${period}`
    } catch {
        return time
    }
}

const COLORS = ['#AA7CBF', '#87B28A', '#87B2B2', '#E5DCAE']

const CustomPieChart = ({ data, title, isTime, className }: {
    data: Array<{ name: string | null; count: number }>,
    title: string,
    isTime?: boolean
    className?: string
}) => {
    // Check if data is empty or all counts are 0
    const hasData = data.length > 0 && data.some(item => item.count > 0)

    // Calculate total for percentages
    const total = data.reduce((sum, item) => sum + item.count, 0)

    // If no data, display a message
    if (!hasData) {
        return (
            <Card className="p-4 bg-[#F1F2E9] border-none shadow-none w-full">
                <h3 className="text-base md:text-lg font-semibold mb-4 text-[#1F441F] font-inter">{title}</h3>
                <div className="h-[200px] md:h-[300px] flex items-center justify-center">
                    <p className="text-[#6A6C6A] text-sm">No data yet</p>
                </div>
            </Card>
        )
    }

    // Custom renderer for the legend to include percentages
    const renderLegend = (props: any) => {
        const { payload } = props

        return (
            <ul className="flex flex-col gap-1 md:gap-2 text-xs md:text-sm">
                {payload.map((entry: any, index: number) => {
                    const percentage = ((entry.payload.count / total) * 100).toFixed(1)
                    const displayName = isTime && entry.value !== 'Others'
                        ? formatTime(entry.value)
                        : entry.value

                    return (
                        <li key={`item-${index}`} className="flex items-center gap-1 md:gap-2">
                            <span className="w-2 md:w-3 h-2 md:h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-[#1F441F] flex items-center justify-between gap-2 md:gap-4 w-full font-inter">
                                <p className="truncate max-w-[100px] md:max-w-full">{displayName}</p>
                                <span className="text-xs text-[#6A6C6A]">{percentage}%</span>
                            </span>
                        </li>
                    )
                })}
            </ul>
        )
    }

    return (
        <Card className="p-3 md:p-4 bg-[#F1F2E9] border-none shadow-none w-full">
            <h3 className="text-base md:text-lg font-semibold mb-2 md:mb-4 text-[#1F441F] font-inter">{title}</h3>
            <ResponsiveContainer width="100%" height={200} className="hidden 2xl:block">
                <PieChart>
                    <Pie
                        data={data}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#DCE5AE"
                    >
                        {data.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Legend
                        content={renderLegend}
                        layout="vertical"
                        align="right"
                        verticalAlign="middle"
                    />
                </PieChart>
            </ResponsiveContainer>
            <ResponsiveContainer width="100%" height={150} className="2xl:hidden">
                <PieChart layout='vertical'>
                    <Pie
                        data={data}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={40}
                        fill="#DCE5AE"
                    >
                        {data.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Legend
                        content={renderLegend}
                        layout="vertical"
                        align="right"
                        verticalAlign="middle"
                    />
                </PieChart>
            </ResponsiveContainer>
        </Card>
    )
}

export function DashboardClient({ stats }: { stats: DashboardStats }) {
    const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
    const [selectedSport, setSelectedSport] = useState<string | null>(null)
    const [selectedProgram, setSelectedProgram] = useState<string | null>(null)
    const [selectedGender, setSelectedGender] = useState<string | null>(null)
    const [selectedDate, setSelectedDate] = useState<string>('none');
    const [filteredStats, setFilteredStats] = useState<DashboardStats>(stats)

    const getUniqueValues = (key: 'branchName' | 'sportName' | 'programName'): string[] => {
        const fromBookings = Object.values(stats)
            .filter(Array.isArray)
            .flatMap(arr => arr.map(item => item[key]))
            .filter(Boolean) as string[]

        let allValues: string[] = []

        switch (key) {
            case 'branchName':
                allValues = stats.allLocations.map(loc => loc.name)
                break
            case 'sportName':
                allValues = stats.allSports.map(sport => sport.name)
                break
            case 'programName':
                allValues = stats.allPrograms.map(prog => prog.name)
                break
        }

        // Combine and deduplicate values
        return Array.from(new Set([...allValues, ...fromBookings]))
    }

    const filterByDate = (data: any[]) => {
        const now = new Date();
        const oneDay = 24 * 60 * 60 * 1000;
        const oneWeek = 7 * oneDay;
        const oneMonth = 30 * oneDay;

        return data.filter(item => {
            const itemDate = new Date(item.date);
            switch (selectedDate) {
                case 'today':
                    return now.toDateString() === itemDate.toDateString();
                case 'last week':
                    return (now.getTime() - itemDate.getTime()) <= oneWeek;
                case 'last month':
                    return (now.getTime() - itemDate.getTime()) <= oneMonth;
                default:
                    return true;
            }
        });
    };


    const locations = getUniqueValues('branchName')
    const sports = getUniqueValues('sportName')
    const programs = getUniqueValues('programName')

    useEffect(() => {
        const filterData = (data: any[], isTimeTraffic: boolean = false) => {
            return filterByDate(data.filter(item => {
                if (isTimeTraffic) {
                    const bookingExists = stats.packageTraffic.some(booking => {
                        const locationMatch = !selectedLocation || booking.branchName === selectedLocation;
                        const sportMatch = !selectedSport || booking.sportName === selectedSport;
                        const programMatch = !selectedProgram || booking.programName === selectedProgram;
                        const genderMatch = !selectedGender || (booking.genders && booking.genders.includes(selectedGender));
                        const dateMatch = new Date(booking.date).toDateString() === new Date(item.date).toDateString();
                        return locationMatch && sportMatch && programMatch && genderMatch && dateMatch;
                    });
                    return bookingExists;
                }

                const locationMatch = !selectedLocation || item.branchName === selectedLocation;
                const sportMatch = !selectedSport || item.sportName === selectedSport;
                const programMatch = !selectedProgram || item.programName === selectedProgram;
                const genderMatch = !selectedGender || (item?.genders && item?.genders?.includes(selectedGender));
                return locationMatch && sportMatch && programMatch && genderMatch;
            }));
        };

        const newFilteredStats: DashboardStats = {
            ...stats,
            timeTraffic: filterData(stats.timeTraffic, true),
            packageTraffic: filterData(stats.packageTraffic),
            programTraffic: filterData(stats.programTraffic),
            coachTraffic: filterData(stats.coachTraffic),
            sportTraffic: filterData(stats.sportTraffic),
            branchTraffic: filterData(stats.branchTraffic),
        }

        setFilteredStats(newFilteredStats)
    }, [selectedLocation, selectedSport, selectedProgram, selectedGender, selectedDate, stats])

    const percentageChange = ((filteredStats.currentMonthCount - filteredStats.lastMonthCount) / filteredStats.lastMonthCount) * 100

    const aggregateData = (data: any[], key: string) => {
        const aggregated = data.reduce((acc, item) => {
            const name = item[key] || 'Unknown'
            if (!acc[name]) {
                acc[name] = { name, count: 0 }
            }
            acc[name].count += item.count
            return acc
        }, {})
        return Object.values(aggregated)
    }

    const transformData = (data: any[], key: string) => {
        const aggregatedData = aggregateData(data, key)
        const sortedData = aggregatedData.sort((a: any, b: any) => b.count - a.count)
        return [
            ...sortedData.slice(0, 3),
            {
                name: 'Others',
                count: sortedData.slice(3).reduce((acc: number, curr: any) => acc + curr.count, 0)
            }
        ]
    }

    const availableGenders = useMemo(() => {
        return [...stats.programTraffic.map(item => item?.genders?.split(',')).flat().filter(Boolean), ...stats.packageTraffic.map(item => item?.genders?.split(',')).flat().filter(Boolean)].filter(value => value !== '').filter((value, index, self) => self.indexOf(value) === index)
    }, [stats]);

    const transformedTimeTraffic = useMemo(() => transformData(filteredStats.timeTraffic, 'hour'), [filteredStats.timeTraffic])
    const transformedPackageTraffic = useMemo(() => transformData(filteredStats.packageTraffic, 'name'), [filteredStats.packageTraffic])
    const transformedProgramTraffic = useMemo(() => transformData(filteredStats.programTraffic, 'name'), [filteredStats.programTraffic])
    const transformedCoachTraffic = useMemo(() => transformData(filteredStats.coachTraffic, 'name'), [filteredStats.coachTraffic])
    const transformedSportTraffic = useMemo(() => transformData(filteredStats.sportTraffic, 'name'), [filteredStats.sportTraffic])
    const transformedBranchTraffic = useMemo(() => transformData(filteredStats.branchTraffic, 'name'), [filteredStats.branchTraffic])

    return (
        <div className="space-y-3 sm:space-y-4 lg:space-y-8 p-3 sm:p-4 lg:p-6 font-inter">
            {/* Filters Section */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2 sm:mb-3 lg:mb-4">
                <span className="text-xs sm:text-sm font-medium">Filters:</span>
                <div className="flex flex-wrap gap-2">
                    {/* Date Filter */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="text-xs sm:text-sm px-2 sm:px-3 lg:px-4 gap-1 sm:gap-2 rounded-xl border border-none shadow-none hover:bg-transparent bg-transparent w-full sm:w-auto">
                                {selectedDate === 'none' ? 'Date' : selectedDate}
                                <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-[#F1F2E9] min-w-[120px] sm:min-w-[140px]">
                            <DropdownMenuItem onClick={() => setSelectedDate('none')}>None</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSelectedDate('today')}>Today</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSelectedDate('last week')}>Last Week</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSelectedDate('last month')}>Last Month</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Location Filter */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="text-xs sm:text-sm px-2 sm:px-3 lg:px-4 gap-1 sm:gap-2 rounded-xl border border-[#868685] bg-[#F1F2E9] w-full sm:w-auto">
                                {selectedLocation || 'Locations'}
                                <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-[#F1F2E9] min-w-[120px] sm:min-w-[140px]">
                            <DropdownMenuItem onClick={() => setSelectedLocation(null)}>All Locations</DropdownMenuItem>
                            {locations.map(location => (
                                <DropdownMenuItem key={location} onClick={() => setSelectedLocation(location)}>
                                    {location}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Sport Filter */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="text-xs sm:text-sm px-2 sm:px-3 lg:px-4 gap-1 sm:gap-2 rounded-xl border border-[#868685] bg-[#F1F2E9] w-full sm:w-auto">
                                {selectedSport || 'Sports'}
                                <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-[#F1F2E9] min-w-[120px] sm:min-w-[140px]">
                            <DropdownMenuItem onClick={() => setSelectedSport(null)}>All Sports</DropdownMenuItem>
                            {sports.map(sport => (
                                <DropdownMenuItem key={sport} onClick={() => setSelectedSport(sport)}>
                                    {sport}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Program Filter */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="text-xs sm:text-sm px-2 sm:px-3 lg:px-4 gap-1 sm:gap-2 rounded-xl border border-[#868685] bg-[#F1F2E9] w-full sm:w-auto">
                                {selectedProgram || 'Programs'}
                                <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-[#F1F2E9] min-w-[120px] sm:min-w-[140px]">
                            <DropdownMenuItem onClick={() => setSelectedProgram(null)}>All Programs</DropdownMenuItem>
                            {programs.map(program => (
                                <DropdownMenuItem key={program} onClick={() => setSelectedProgram(program)}>
                                    {program}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Gender Filter */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="text-xs sm:text-sm px-2 sm:px-3 lg:px-4 gap-1 sm:gap-2 rounded-xl border border-[#868685] bg-[#F1F2E9] w-full sm:w-auto">
                                {selectedGender || 'For'}
                                <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-[#F1F2E9] min-w-[120px] sm:min-w-[140px]">
                            <DropdownMenuItem onClick={() => setSelectedGender(null)}>All Genders</DropdownMenuItem>
                            {availableGenders.map(gender => (
                                <DropdownMenuItem key={gender} onClick={() => setSelectedGender(gender)}>
                                    {gender}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                <Card className="p-4 sm:p-5 lg:p-6 space-y-2 sm:space-y-3 lg:space-y-4 bg-[#F1F2E9] shadow-none border-none">
                    <h3 className="text-xs sm:text-sm font-normal mb-1 sm:mb-2 text-[#1F441F] font-inter">New Bookings</h3>
                    <div className="flex items-center justify-between">
                        <p className="text-lg sm:text-xl lg:text-2xl font-bold text-[#1F441F] font-inter">
                            {isNaN(filteredStats.currentMonthCount) ? 'No data yet' : filteredStats.currentMonthCount}
                        </p>
                        {!isNaN(percentageChange) && (
                            <div className={`flex items-center text-xs sm:text-sm ${percentageChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {percentageChange >= 0 ? <ArrowUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4" /> : <ArrowDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4" />}
                                <span className="ml-1">{Math.abs(percentageChange).toFixed(1)}%</span>
                            </div>
                        )}
                    </div>
                </Card>

                <Card className="p-4 sm:p-5 lg:p-6 space-y-2 sm:space-y-3 lg:space-y-4 bg-[#F1F2E9] shadow-none border-none sm:col-span-1 lg:col-span-3">
                    <h3 className="text-xs sm:text-sm font-normal mb-1 sm:mb-2 text-[#1F441F] font-inter">Total Bookings</h3>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-[#1F441F] font-inter">
                        {isNaN(filteredStats.totalBookings) ? 'No data yet' : filteredStats.totalBookings}
                    </p>
                </Card>
            </div>

            {/* First Row */}
            <div className="bg-[#F1F2E9] rounded-[24px] p-2 sm:p-3 lg:p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                    <div className="w-full min-w-0">
                        <CustomPieChart
                            data={transformedTimeTraffic as any}
                            title="Traffic by Time"
                            isTime
                        />
                    </div>
                    <div className="w-full min-w-0">
                        <CustomPieChart
                            data={transformedPackageTraffic as any}
                            title="Traffic by Package"
                        />
                    </div>
                    <div className="w-full min-w-0 col-span-1 sm:col-span-2 lg:col-span-1">
                        <CustomPieChart
                            data={transformedProgramTraffic as any}
                            title="Traffic by Program"
                        />
                    </div>
                </div>
            </div>

            {/* Second Row */}
            <div className="bg-[#F1F2E9] rounded-[24px] p-2 sm:p-3 lg:p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                    <div className="w-full min-w-0">
                        <CustomPieChart
                            data={transformedCoachTraffic as any}
                            title="Traffic by Coach"
                        />
                    </div>
                    <div className="w-full min-w-0">
                        <CustomPieChart
                            data={transformedSportTraffic as any}
                            title="Traffic by Sport"
                        />
                    </div>
                    <div className="w-full min-w-0 col-span-1 sm:col-span-2 lg:col-span-1">
                        <CustomPieChart
                            data={transformedBranchTraffic as any}
                            title="Traffic by Location"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

