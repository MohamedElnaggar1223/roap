import { getLocations } from '@/lib/actions/locations.actions'
import { LocationsDataTable } from './locations-table'
import { getAllSports } from '@/lib/actions/academics.actions'

export default async function LocationsPage() {
    const { data: locations, error } = await getLocations()
    const sports = await getAllSports('sports')

    if (error) return null

    return (
        <section className='flex flex-col gap-4 w-full px-4'>
            <LocationsDataTable data={locations!} sports={sports!} key={JSON.stringify(locations)} />
        </section>
    )
}