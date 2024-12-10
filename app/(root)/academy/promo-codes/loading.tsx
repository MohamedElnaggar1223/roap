import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
    return (
        <div className="space-y-6 flex w-full items-center justify-start px-4 flex-col">
            <div className="flex items-center justify-between gap-4 w-full flex-wrap">
                <div className="flex items-center gap-4 flex-wrap">
                    <Skeleton className="h-10 w-[120px]" />
                    <Skeleton className="h-10 w-[100px]" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-[200px]" />
                </div>
            </div>

            <div className="w-full max-w-screen-2xl overflow-x-auto">
                <div className="min-w-full grid grid-cols-[auto,0.75fr,auto,auto,auto,auto,auto,auto] gap-y-6 text-nowrap">
                    {/* Header */}
                    <div className="contents rounded-[12px] overflow-hidden">
                        {Array(8).fill(null).map((_, index) => (
                            <Skeleton key={index} className="h-12 w-full rounded-none" />
                        ))}
                    </div>

                    {/* Rows */}
                    {Array(5).fill(null).map((_, rowIndex) => (
                        <div key={rowIndex} className="contents rounded-none">
                            {Array(8).fill(null).map((_, colIndex) => (
                                <Skeleton key={`${rowIndex}-${colIndex}`} className="h-20 w-full rounded-none" />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

