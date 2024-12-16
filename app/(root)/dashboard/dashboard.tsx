'use client'

import { Card } from '@/components/ui/card'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from 'recharts'

type DashboardStats = {
    currentMonthCount: number
    lastMonthCount: number
    totalBookings: number
    timeTraffic: Array<{ hour: string; count: number }>
    packageTraffic: Array<{ name: string | null; count: number }>
    programTraffic: Array<{ name: string | null; count: number }>
    coachTraffic: Array<{ name: string | null; count: number }>
    sportTraffic: Array<{ name: string; count: number }>
    branchTraffic: Array<{ name: string; count: number }>
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
    data: Array<{ name: string; count: number }>,
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
    const percentageChange = ((stats.currentMonthCount - stats.lastMonthCount) / stats.lastMonthCount) * 100

    const transformedTimeTraffic = [
        ...stats.timeTraffic.slice(0, 3).map(item => ({
            name: item.hour,
            count: item.count
        })),
        {
            name: 'Others',
            count: stats.timeTraffic.slice(3).reduce((acc, curr) => acc + curr.count, 0)
        }
    ]

    const transformData = (data: Array<{ name: string | null; count: number }>) => [
        ...data.slice(0, 3).map(item => ({
            name: item.name || 'Unknown',
            count: item.count
        })),
        {
            name: 'Others',
            count: data.slice(3).reduce((acc, curr) => acc + curr.count, 0)
        }
    ]

    return (
        <div className="space-y-8 p-6 font-inter">
            {/* Top Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="p-6 space-y-4 bg-[#F1F2E9] shadow-none border-none col-span-1">
                    <h3 className="text-sm font-normal mb-2 text-[#1F441F] font-inter">New Bookings</h3>
                    <div className="flex items-center justify-between">
                        <p className="text-3xl font-bold text-[#1F441F] font-inter">
                            {isNaN(stats.currentMonthCount) ? 'No data yet' : stats.currentMonthCount}
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
                        {isNaN(stats.totalBookings) ? 'No data yet' : stats.totalBookings}
                    </p>
                </Card>
            </div>

            {/* Middle Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-[#F1F2E9] rounded-[24px]">
                <CustomPieChart
                    data={transformedTimeTraffic}
                    title="Traffic by Time"
                    isTime
                />
                <CustomPieChart
                    data={transformData(stats.packageTraffic)}
                    title="Traffic by Package"
                />
                <CustomPieChart
                    data={transformData(stats.programTraffic)}
                    title="Traffic by Program"
                />
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-[#F1F2E9] rounded-[24px]">
                <CustomPieChart
                    data={transformData(stats.coachTraffic)}
                    title="Traffic by Coach"
                />
                <CustomPieChart
                    data={transformData(stats.sportTraffic)}
                    title="Traffic by Sport"
                />
                <CustomPieChart
                    data={transformData(stats.branchTraffic)}
                    title="Traffic by Location"
                />
            </div>
        </div>
    )
}