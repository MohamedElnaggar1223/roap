import { getDashboardStats, DashboardStatsParams } from '@/lib/actions/dashboard.actions'
import { DashboardClient } from './dashboard'
import { checkAcademyStatus } from '@/lib/actions/check-academy-status'
import { redirect } from 'next/navigation'

export default async function DashboardPage({
    searchParams
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const status = await checkAcademyStatus()

    if (!status.isOnboarded) {
        return redirect('/academy')
    }

    const searchParamsData = await searchParams

    const filters: DashboardStatsParams = {
        location: searchParamsData.location as string | undefined,
        sport: searchParamsData.sport as string | undefined,
        program: searchParamsData.program as string | undefined,
        gender: searchParamsData.gender as string | undefined,
    }

    const result = await getDashboardStats(filters)

    if (result.error) {
        return (
            <div className="flex items-center justify-center min-h-[400px] text-red-500">
                {result.error}
            </div>
        )
    }

    if (!result.data) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                Loading...
            </div>
        )
    }

    return <DashboardClient stats={result.data} />
}

