import { Skeleton } from "@/components/ui/skeleton"

export function AcademyFormLoading() {
    return (
        <div className="flex flex-col gap-6 w-full">
            <div className="flex w-full items-center justify-between">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-10 w-32 rounded-3xl" />
            </div>

            {/* Academy Name */}
            <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-12 w-full rounded-[10px]" />
            </div>

            {/* About */}
            <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-32 w-full rounded-[10px]" />
            </div>

            {/* Sports and Logo section */}
            <div className="flex w-full items-start justify-between gap-4">
                {/* Sports */}
                <div className="flex flex-col gap-4 w-full flex-1">
                    <Skeleton className="h-4 w-16" />
                    <div className="border border-gray-500 p-3 rounded-lg space-y-3">
                        <div className="flex flex-wrap gap-2">
                            <Skeleton className="h-7 w-20 rounded-3xl" />
                            <Skeleton className="h-7 w-24 rounded-3xl" />
                            <Skeleton className="h-7 w-16 rounded-3xl" />
                        </div>
                        <Skeleton className="h-10 w-full rounded-lg" />
                    </div>
                </div>

                {/* Logo */}
                <div className="flex flex-col gap-4 w-full flex-1">
                    <Skeleton className="h-4 w-12" />
                    <div className="flex w-full items-center justify-center gap-4 border border-gray-500 p-3 rounded-lg">
                        <Skeleton className="h-44 w-44 rounded-[31px]" />
                    </div>
                </div>
            </div>

            {/* Policy */}
            <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-[400px] w-full rounded-[10px]" />
            </div>

            {/* Gallery */}
            <div className="flex flex-col gap-4">
                <div className="flex w-full items-center justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-10 w-24 rounded-3xl" />
                </div>
                <div className="border border-gray-500 p-3 rounded-lg">
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {[...Array(6)].map((_, i) => (
                            <Skeleton key={i} className="aspect-square rounded-lg" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}