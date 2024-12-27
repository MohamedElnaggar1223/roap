import { getPrograms } from '@/lib/actions/programs.actions'
import { getLocations } from '@/lib/actions/locations.actions'
import { getAcademySports, getAllSports } from '@/lib/actions/academics.actions'
import { ProgramsDataTable } from './programs-table'
import { checkAcademyStatus } from '@/lib/actions/check-academy-status'

export default async function ProgramsPage() {
    // const { data: programs, error } = await getPrograms()
    const { data: branches } = await getLocations()
    const sports = await getAllSports('sports')
    const { data: academySports, error: sportsError } = await getAcademySports()
    const status = await checkAcademyStatus()

    return (
        <section className='flex flex-col gap-4 w-full px-4'>
            <ProgramsDataTable
                branches={branches!}
                sports={sports!}
                academySports={academySports}
                academicId={status.academyId!}
            />
        </section>
    )
}