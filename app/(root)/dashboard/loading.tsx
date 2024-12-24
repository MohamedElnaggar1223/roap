import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardLoading() {
    return (
        <div className="space-y-8 p-6 font-inter">
            {/* Filters Section Skeleton */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-24" />
            </div>

            {/* Top Section Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="p-6 space-y-4 bg-[#F1F2E9] shadow-none border-none col-span-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-32" />
                </Card>
                <Card className="p-6 space-y-4 bg-[#F1F2E9] shadow-none border-none col-span-3">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-8 w-40" />
                </Card>
            </div>

            {/* Middle Section Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-[#F1F2E9] rounded-[24px]">
                {[...Array(3)].map((_, index) => (
                    <Card key={index} className="p-4 bg-[#F1F2E9] border-none shadow-none">
                        <Skeleton className="h-4 w-32 mb-4" />
                        <Skeleton className="h-[300px] w-full" />
                    </Card>
                ))}
            </div>

            {/* Bottom Section Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-[#F1F2E9] rounded-[24px]">
                {[...Array(3)].map((_, index) => (
                    <Card key={index} className="p-4 bg-[#F1F2E9] border-none shadow-none">
                        <Skeleton className="h-4 w-32 mb-4" />
                        <Skeleton className="h-[300px] w-full" />
                    </Card>
                ))}
            </div>
        </div>
    )
}

