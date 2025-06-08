'use client'

import { useEffect } from 'react'
import { useLocationsStore } from '@/providers/store-provider'
import { LocationsDataTable } from './locations-table'

interface Sport {
    id: number
    name: string
    image: string | null
    locale: string
}

interface LocationsClientProps {
    initialLocations: any[]
    sports: Sport[]
    academySports?: { id: number }[]
}

export default function LocationsClient({ initialLocations, sports, academySports }: LocationsClientProps) {
    const locations = useLocationsStore((state) => state.locations)
    const fetched = useLocationsStore((state) => state.fetched)
    const setLocations = useLocationsStore((state) => state.setLocations)
    const fetchLocations = useLocationsStore((state) => state.fetchLocations)

    // Initialize the store with server data
    useEffect(() => {
        if (initialLocations && initialLocations.length > 0) {
            // Always use fresh server data when available
            setLocations(initialLocations)
        } else if (!fetched) {
            // Only fetch if no server data and not already fetched
            fetchLocations().catch(console.error)
        }
    }, [initialLocations, fetched, setLocations, fetchLocations])

    // Use store data if available, otherwise use server data
    const displayLocations = locations.length > 0 ? locations : initialLocations

    return (
        <section className='flex flex-col gap-4 w-full px-4'>
            <LocationsDataTable
                data={displayLocations}
                sports={sports}
                academySports={academySports}
            />
        </section>
    )
} 