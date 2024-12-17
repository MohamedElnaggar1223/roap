import { getDashboardStats } from '@/lib/actions/dashboard.actions'
import { DashboardClient } from './dashboard'
import { checkAcademyStatus } from '@/lib/actions/check-academy-status'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
    const status = await checkAcademyStatus()

    if (!status.isOnboarded) {
        return redirect('/academy')
    }

    const result = await getDashboardStats()

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