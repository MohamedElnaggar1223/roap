import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
    return (
        <div className="w-full max-w-7xl mx-auto p-2 sm:p-4 bg-[#E0E4D9]">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 bg-[#E0E4D9] p-2 sm:p-4 rounded-lg">
                <div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-0">
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-24" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-9 w-24" />
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white rounded-lg overflow-hidden">
                {/* Days header */}
                <div className="grid grid-cols-1 sm:grid-cols-[repeat(15,minmax(0,1fr))] border-[#CDD1C7] border-b bg-[#E0E4D9]">
                    <div className="hidden sm:block p-2 border-r border-[#CDD1C7]" />
                    {[...Array(7)].map((_, i) => (
                        <div key={i} className="p-2 text-center border-[#CDD1C7] border-r last:border-r-0 rounded-t-2xl bg-[#F1F2E9] col-span-2">
                            <Skeleton className="h-4 w-8 mx-auto mb-1" />
                            <Skeleton className="h-6 w-6 mx-auto" />
                        </div>
                    ))}
                </div>

                {/* Time slots */}
                <div className="grid grid-cols-1 sm:grid-cols-[repeat(15,minmax(0,1fr))] bg-[#F1F2E9]">
                    {/* Time labels */}
                    <div className="hidden sm:block border-r border-[#CDD1C7] col-span-1 bg-[#E0E4D9]">
                        {[...Array(16)].map((_, i) => (
                            <div key={i} className="p-2 bg-[#E0E4D9]" style={{ height: '5rem' }}>
                                <Skeleton className="h-4 w-12" />
                            </div>
                        ))}
                    </div>

                    {/* Days columns */}
                    {[...Array(7)].map((_, dayIndex) => (
                        <div key={dayIndex} className="border-r last:border-r-0 border-[#CDD1C7] col-span-2">
                            {[...Array(16)].map((_, hourIndex) => (
                                <div
                                    key={`${dayIndex}-${hourIndex}`}
                                    className="border-b last:border-b-0 border-[#CDD1C7] relative"
                                    style={{ minHeight: "5rem" }}
                                >
                                    <Skeleton className="absolute left-1 right-1 top-1 h-[4.5rem] rounded-md" />
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}