import { getDashboardStats } from '@/lib/actions/dashboard.actions'
import { DashboardClient } from './dashboard'

export default async function DashboardPage() {
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