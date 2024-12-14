import { getPrograms } from '@/lib/actions/programs.actions'
import { getLocations } from '@/lib/actions/locations.actions'
import { getAcademySports, getAllSports } from '@/lib/actions/academics.actions'
import { ProgramsDataTable } from './programs-table'

export default async function ProgramsPage() {
    const { data: programs, error } = await getPrograms()
    const { data: branches } = await getLocations()
    const sports = await getAllSports('sports')
    const { data: academySports, error: sportsError } = await getAcademySports()

    if (error) return null

    return (
        <section className='flex flex-col gap-4 w-full px-4'>
            <ProgramsDataTable
                data={programs!}
                branches={branches!}
                sports={sports!}
                academySports={academySports}
                key={JSON.stringify(programs)}
            />
        </section>
    )
}