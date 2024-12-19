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
    timeTraffic: Array<{ hour: string; count: number }>
    packageTraffic: Array<{ name: string | null; count: number; branchName?: string; sportName?: string; programName?: string | null }>
    programTraffic: Array<{ name: string | null; count: number; branchName?: string; sportName?: string; programName?: string | null }>
    coachTraffic: Array<{ name: string | null; count: number; branchName?: string; sportName?: string; programName?: string | null }>
    sportTraffic: Array<{ name: string; count: number; branchName?: string; sportName?: string; programName?: string | null }>
    branchTraffic: Array<{ name: string; count: number; branchName?: string; sportName?: string; programName?: string | null }>
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

const CustomPieChart = ({ data, title, isTime = false }: {
    data: Array<{ name: string | null; count: number }>,
    title: string,
    isTime?: boolean
}) => {
    // Check if data is empty or all counts are 0
    const hasData = data.length > 0 && data.some(item => item.count > 0)

    // Calculate total for percentages
    const total = data.reduce((sum, item) => sum + item.count, 0)

    // If no data, display a message
    if (!hasData) {
        return (
            <Card className="p-4 bg-[#F1F2E9] border-none shadow-none">
                <h3 className="text-lg font-semibold mb-4 text-[#1F441F] font-inter">{title}</h3>
                <div className="h-[300px] flex items-center justify-center">
                    <p className="text-[#6A6C6A] text-sm">No data yet</p>
                </div>
            </Card>
        )
    }

    // Custom renderer for the legend to include percentages
    const renderLegend = (props: any) => {
        const { payload } = props

        return (
            <ul className="flex flex-col gap-2">
                {payload.map((entry: any, index: number) => {
                    const percentage = ((entry.payload.count / total) * 100).toFixed(1)
                    const displayName = isTime && entry.value !== 'Others'
                        ? formatTime(entry.value)
                        : entry.value

                    return (
                        <li
                            key={`item-${index}`}
                            className="flex items-center gap-2 text-sm w-full"
                        >
                            <span
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-[#1F441F] flex items-center justify-between gap-4 w-full font-inter">
                                <p>{displayName}  </p>
                                <span className="text-xs text-[#6A6C6A]">{percentage}%</span>
                            </span>
                        </li>
                    )
                })}
            </ul>
        )
    }

    return (
        <Card className="p-4 bg-[#F1F2E9] border-none shadow-none">
            <h3 className="text-lg font-semibold mb-4 text-[#1F441F] font-inter">{title}</h3>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={data}
                        dataKey="count"
                        nameKey="name"
                        cx="35%"
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
        </Card>
    )
}

export function DashboardClient({ stats }: { stats: DashboardStats }) {
    const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
    const [selectedSport, setSelectedSport] = useState<string | null>(null)
    const [selectedProgram, setSelectedProgram] = useState<string | null>(null)
    const [selectedGender, setSelectedGender] = useState<string | null>(null)
    const [filteredStats, setFilteredStats] = useState<DashboardStats>(stats)

    const getUniqueValues = (key: 'branchName' | 'sportName' | 'programName'): string[] => {
        const allValues = Object.values(stats)
            .filter(Array.isArray)
            .flatMap(arr => arr.map(item => item[key]))
            .filter(Boolean) as string[]
        return Array.from(new Set(allValues))
    }

    const locations = getUniqueValues('branchName')
    const sports = getUniqueValues('sportName')
    const programs = getUniqueValues('programName')
    const genders = ['Male', 'Female', 'Mixed']

    useEffect(() => {
        const filterData = (data: any[]) => {
            return data.filter(item => {
                const locationMatch = !selectedLocation || item.branchName === selectedLocation
                const sportMatch = !selectedSport || item.sportName === selectedSport
                const programMatch = !selectedProgram || item.programName === selectedProgram
                const genderMatch = !selectedGender || (item.gender && item.gender === selectedGender)
                return locationMatch && sportMatch && programMatch && genderMatch
            })
        }

        const newFilteredStats: DashboardStats = {
            ...stats,
            timeTraffic: filterData(stats.timeTraffic),
            packageTraffic: filterData(stats.packageTraffic),
            programTraffic: filterData(stats.programTraffic),
            coachTraffic: filterData(stats.coachTraffic),
            sportTraffic: filterData(stats.sportTraffic),
            branchTraffic: filterData(stats.branchTraffic),
        }

        setFilteredStats(newFilteredStats)
    }, [selectedLocation, selectedSport, selectedProgram, selectedGender, stats])

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


    const transformedTimeTraffic = useMemo(() => transformData(filteredStats.timeTraffic, 'hour'), [filteredStats.timeTraffic])
    const transformedPackageTraffic = useMemo(() => transformData(filteredStats.packageTraffic, 'name'), [filteredStats.packageTraffic])
    const transformedProgramTraffic = useMemo(() => transformData(filteredStats.programTraffic, 'name'), [filteredStats.programTraffic])
    const transformedCoachTraffic = useMemo(() => transformData(filteredStats.coachTraffic, 'name'), [filteredStats.coachTraffic])
    const transformedSportTraffic = useMemo(() => transformData(filteredStats.sportTraffic, 'name'), [filteredStats.sportTraffic])
    const transformedBranchTraffic = useMemo(() => transformData(filteredStats.branchTraffic, 'name'), [filteredStats.branchTraffic])

    return (
        <div className="space-y-8 p-6 font-inter">
            {/* Filters Section */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-sm font-medium">Filters:</span>

                {/* Location Filter */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="gap-2 rounded-xl border border-[#868685] bg-[#F1F2E9]">
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

                {/* Sport Filter */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="gap-2 rounded-xl border border-[#868685] bg-[#F1F2E9]">
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

                {/* Program Filter */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="gap-2 rounded-xl border border-[#868685] bg-[#F1F2E9]">
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

                {/* Gender Filter */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="gap-2 rounded-xl border border-[#868685] bg-[#F1F2E9]">
                            {selectedGender || 'Gender'}
                            <ChevronDown className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className='bg-[#F1F2E9]'>
                        <DropdownMenuItem onClick={() => setSelectedGender(null)}>
                            All Genders
                        </DropdownMenuItem>
                        {genders.map(gender => (
                            <DropdownMenuItem
                                key={gender}
                                onClick={() => setSelectedGender(gender)}
                            >
                                {gender}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            {/* Top Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="p-6 space-y-4 bg-[#F1F2E9] shadow-none border-none col-span-1">
                    <h3 className="text-sm font-normal mb-2 text-[#1F441F] font-inter">New Bookings</h3>
                    <div className="flex items-center justify-between">
                        <p className="text-3xl font-bold text-[#1F441F] font-inter">
                            {isNaN(filteredStats.currentMonthCount) ? 'No data yet' : filteredStats.currentMonthCount}
                        </p>
                        {!isNaN(percentageChange) && (
                            <div className={`flex items-center ${percentageChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {percentageChange >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                                <span className="ml-1">{Math.abs(percentageChange).toFixed(1)}%</span>
                            </div>
                        )}
                    </div>
                </Card>

                <Card className="p-6 space-y-4 bg-[#F1F2E9] shadow-none border-none col-span-3">
                    <h3 className="text-sm font-normal mb-2 text-[#1F441F] font-inter">Total Bookings</h3>
                    <p className="text-3xl font-bold text-[#1F441F] font-inter">
                        {isNaN(filteredStats.totalBookings) ? 'No data yet' : filteredStats.totalBookings}
                    </p>
                </Card>
            </div>



            {/* Middle Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-[#F1F2E9] rounded-[24px]">
                <CustomPieChart
                    data={transformedTimeTraffic as any}
                    title="Traffic by Time"
                    isTime
                />
                <CustomPieChart
                    data={transformedPackageTraffic as any}
                    title="Traffic by Package"
                />
                <CustomPieChart
                    data={transformedProgramTraffic as any}
                    title="Traffic by Program"
                />
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-[#F1F2E9] rounded-[24px]">
                <CustomPieChart
                    data={transformedCoachTraffic as any}
                    title="Traffic by Coach"
                />
                <CustomPieChart
                    data={transformedSportTraffic as any}
                    title="Traffic by Sport"
                />
                <CustomPieChart
                    data={transformedBranchTraffic as any}
                    title="Traffic by Location"
                />
            </div>
        </div>
    )
}

