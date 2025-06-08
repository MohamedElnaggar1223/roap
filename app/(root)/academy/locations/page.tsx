import { getLocations } from '@/lib/actions/locations.actions'
import { getAcademySports, getAllSports } from '@/lib/actions/academics.actions'
import LocationsClient from './locations-client'

export default async function LocationsPage() {
    const { data: locations, error } = await getLocations()
    const sports = await getAllSports('sports')
    const { data: academySports, error: sportsError } = await getAcademySports()

    if (error) return null

    return (
        <LocationsClient
            initialLocations={locations || []}
            sports={sports || []}
            academySports={academySports}
        />
    )
}