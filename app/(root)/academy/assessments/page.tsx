import { getAssessments } from '@/lib/actions/assessments.actions'
import { getLocations } from '@/lib/actions/locations.actions'
import { getAcademySports, getAllSports } from '@/lib/actions/academics.actions'
import { AssessmentsTable } from './assessments-table'

export default async function AssessmentsPage() {
    const { data: assessments, error } = await getAssessments()
    const { data: branches } = await getLocations()
    const sports = await getAllSports('sports')
    const { data: academySports } = await getAcademySports()

    if (error) return null

    return (
        <section className='flex flex-col gap-4 w-full px-4'>
            <AssessmentsTable
                data={assessments!}
                branches={branches!}
                sports={sports!}
                academySports={academySports}
                key={JSON.stringify(assessments)}
            />
        </section>
    )
}